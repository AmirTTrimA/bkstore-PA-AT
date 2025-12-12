from decimal import Decimal

from catalog.models import Book
from content.models import License
from django.conf import settings
from django.db import models, transaction
from django.db.utils import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from pricing.models import Price
from rest_framework import generics, serializers, status, viewsets
from rest_framework.mixins import DestroyModelMixin, ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Cart, CartItem, Order, OrderItem, WishlistItem
from .serializers import (  # Assuming CartItemOutputSerializer is for display
    CartItemInputSerializer,
    CartItemOutputSerializer,
    CheckoutInputSerializer,
    OrderOutputSerializer,
    WishlistCreateSerializer,
    WishlistItemSerializer,
)
from .services import PriceCalculationService
from .tasks import send_order_confirmation_email

# Set session key (should be in settings.py, but defined here for context)
CART_SESSION_KEY = getattr(settings, "CART_SESSION_KEY", "cart")

# -------------------------------------------------------------
# CORE LOGIC: Storage Helpers (DATABASE vs. SESSION)
# -------------------------------------------------------------


def get_storage_manager(request):
    """
    Returns the appropriate cart data manager (DB or Session) based on authentication.
    Returns: A dictionary representing the cart state.
    """
    if request.user.is_authenticated:
        # Authenticated: Use Database (persistent storage)
        cart, created = Cart.objects.get_or_create(user=request.user)
        # Convert DB items to a dictionary {book_id: quantity} for easy processing
        db_items = CartItem.objects.filter(cart=cart).values("book_id", "quantity")
        return {str(item["book_id"]): item["quantity"] for item in db_items}
    else:
        # Anonymous: Use Session (temporary storage)
        return request.session.get(CART_SESSION_KEY, {})


def save_storage_manager(request, cart_data):
    """
    Saves the cart data back to the appropriate storage (DB or Session).
    """
    if request.user.is_authenticated:
        # Authenticated: Save to Database
        cart, created = Cart.objects.get_or_create(user=request.user)

        # Atomically update DB: Delete old items and insert new ones
        with transaction.atomic():
            CartItem.objects.filter(cart=cart).delete()
            for book_id, quantity in cart_data.items():
                if quantity > 0:
                    book = get_object_or_404(Book, pk=int(book_id))
                    CartItem.objects.create(cart=cart, book=book, quantity=quantity)
    else:
        # Anonymous: Save to Session
        request.session[CART_SESSION_KEY] = cart_data
        request.session.modified = True


# -------------------------------------------------------------
# 1. CART ITEM ENDPOINTS (Unified Handler)
# -------------------------------------------------------------


def get_current_prices(book_ids):
    """
    Retrieves the currently active price for each book ID from the database.
    Returns: A dictionary mapping {book_id: price_value}
    """
    now = timezone.now()

    # Complex query to find the most recent valid price for each book
    # This logic finds the Price record where effective_from is the highest (most recent)
    # but still valid (effective_until is null or future)

    # For simplicity, we filter by effective_until=NULL or > now()
    active_prices = (
        Price.objects.filter(
            models.Q(effective_until__isnull=True) | models.Q(effective_until__gt=now),
            book_id__in=book_ids,
            effective_from__lte=now,
        )
        .order_by("book_id", "-effective_from")
        .distinct("book_id")
    )

    # Create a lookup dictionary: {book_id: value}
    price_map = {price.book_id: price.value for price in active_prices}
    return price_map


class CartItemHandlerView(generics.GenericAPIView):
    """
    Handles Add, Update, Delete, and Get actions for cart items, using DB or Session.
    Maps to POST, DELETE, GET /api/v1/cart/items/
    """

    serializer_class = CartItemInputSerializer
    permission_classes = []

    def get(self, request, *args, **kwargs):
        """Retrieves and displays the current cart contents (DB or Session)."""
        cart_data = get_storage_manager(request)

        # Fetch book objects in bulk for efficiency
        book_ids = [int(pk) for pk in cart_data.keys()]
        books = Book.objects.filter(pk__in=book_ids).in_bulk()

        # 🔑 CRITICAL FIX: Fetch active prices from DB
        price_map = get_current_prices(book_ids)

        cart_output = []
        for book_id, quantity in cart_data.items():
            book = books.get(int(book_id))

            # Use the actual price from the map, default to 0 if not found
            unit_price = price_map.get(int(book_id), Decimal("0.00"))

            if book:
                # 🔑 FIX: Pass the calculated unit price to the serializer's context (item dictionary)
                cart_output.append(
                    {
                        "book_id": book.pk,
                        "title": book.title,
                        "quantity": quantity,
                        "unit_price": unit_price,  # 🔑 NEW: Unit price passed for subtotal calc in serializer
                        "cover_image_url": book.cover_image_url,
                    }
                )

        # Sort output for consistent display
        serializer = CartItemOutputSerializer(
            sorted(cart_output, key=lambda x: x["book_id"]), many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """Adds a new item or updates quantity of an existing item."""
        # ... (post and delete methods remain the same, as they only touch storage/session)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        book_id = str(serializer.validated_data["book_id"])
        quantity = serializer.validated_data.get("quantity", 1)

        cart_data = get_storage_manager(request)

        # Add or update quantity
        cart_data[book_id] = cart_data.get(book_id, 0) + quantity

        save_storage_manager(request, cart_data)

        return Response({"detail": _("Item added to cart.")}, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """Deletes a specific item entirely from the cart."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        book_id = str(serializer.validated_data["book_id"])
        cart_data = get_storage_manager(request)

        if book_id in cart_data:
            del cart_data[book_id]
            save_storage_manager(request, cart_data)
            return Response(
                {"detail": _("Item removed from cart.")},
                status=status.HTTP_204_NO_CONTENT,
            )

        return Response(
            {"detail": _("Item not found in cart.")}, status=status.HTTP_404_NOT_FOUND
        )


# -------------------------------------------------------------
# 2. CART MERGE LOGIC (Upon Login)
# -------------------------------------------------------------


class CartMergeView(generics.GenericAPIView):
    """
    Handles merging the anonymous session cart into the persistent database cart upon login.
    This view is designed to be called by the frontend immediately after a successful JWT login.
    Maps to POST /api/v1/cart/merge/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        session_cart = request.session.get(CART_SESSION_KEY, {})

        if not session_cart:
            return Response(
                {"detail": _("No items to merge.")}, status=status.HTTP_200_OK
            )

        user = request.user

        # 1. Get the target (database) cart data
        database_cart_data = get_storage_manager(request)  # Retrieves current DB state

        # 2. Perform item-by-item merge (appending quantities)
        # Note: Merging session items (anonymous) into DB items (persistent)
        for book_id, quantity in session_cart.items():
            book_id_str = str(book_id)
            database_cart_data[book_id_str] = (
                database_cart_data.get(book_id_str, 0) + quantity
            )

        # 3. Save the merged cart back to the database
        save_storage_manager(request, database_cart_data)

        # 4. Clear the anonymous session cart (CRITICAL)
        request.session[CART_SESSION_KEY] = {}
        request.session.modified = True

        return Response(
            {"detail": _("Cart merged successfully.")}, status=status.HTTP_200_OK
        )


class WishlistViewSet(viewsets.GenericViewSet, ListModelMixin, DestroyModelMixin):
    """
    Handles listing the user's wishlist and removing items.
    Maps to GET, DELETE /api/v1/cart/wishlist/<id>/
    """

    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Returns the wishlist items for the currently authenticated user."""
        return WishlistItem.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Adds a new item to the user's wishlist."""
        input_serializer = WishlistCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        book_id = input_serializer.validated_data["book_id"]

        book = get_object_or_404(Book, pk=book_id)

        # 🔑 DEFINITIVE FIX: Query the database first to PREVENT IntegrityError
        if WishlistItem.objects.filter(user=request.user, book=book).exists():
            return Response(
                {"detail": _("Item is already in your wishlist.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If the item doesn't exist, create it. This creation is now guaranteed to succeed.
        WishlistItem.objects.create(user=request.user, book=book)

        return Response(
            {"detail": _("Item added to your wishlist."), "book_id": book_id},
            status=status.HTTP_201_CREATED,
        )


# -------------------------------------------------------------
# 4. LICENSE GRANTING HELPER (NEW)
# -------------------------------------------------------------


def create_licenses_for_order(order: Order, items_for_snapshot: list):
    """
    Grants digital licenses for eligible items purchased in the order.
    """
    for item_data in items_for_snapshot:
        book = item_data["book"]

        # Only grant licenses for digital or audio books (Phase 3 content)
        if not book.is_digital and not book.is_audio:
            continue

        # 🔑 License Logic: Perpetual access for purchased items.
        # We use update_or_create to ensure the user only has one License row per book.
        try:
            License.objects.update_or_create(
                user=order.user,
                book=book,
                defaults={
                    "order": order,
                    "is_active": True,
                    "valid_until": None,  # Perpetual license
                    "valid_from": timezone.now(),
                },
            )
        except IntegrityError:
            # If a rare concurrency error prevents the update_or_create, log or handle.
            print(f"Warning: Concurrency error when granting license for {book.title}.")
            pass


# -------------------------------------------------------------
# 5. ORDER SUBMISSION (CHECKOUT)
# -------------------------------------------------------------


class CheckoutView(generics.GenericAPIView):
    """
    Handles the final order submission, price calculation, and transaction snapshot.
    Maps to POST /api/v1/cart/checkout/
    """

    serializer_class = CheckoutInputSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        user = request.user

        # 1. Get current cart contents (must be from DB for persistence)
        cart_data = get_storage_manager(request)
        if not cart_data:
            return Response(
                {"detail": _("Your cart is empty.")}, status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Initialize Price Calculation Service and run final calculation
        calculator = PriceCalculationService(user=user)

        try:
            (
                items_for_snapshot,
                subtotal_base,
                discount_amount,
                final_total,
                applied_discount,
            ) = calculator.calculate_order_snapshot(
                cart_items_data=cart_data, discount_code=data.get("discount_code")
            )
        except serializers.ValidationError as e:
            # Catch exceptions raised by the service (e.g., expired discount code)
            return Response({"detail": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Create the final Order Snapshot (Transaction Record)
        new_order = Order.objects.create(
            user=user,
            discount_code=applied_discount,  # Can be None
            subtotal=subtotal_base,
            discount_amount=discount_amount,
            total_amount=final_total,
            status="PENDING",  # Assuming payment happens next
            # Address Snapshot
            shipping_name=data["shipping_name"],
            shipping_address_line1=data["shipping_address_line1"],
            shipping_city=data["shipping_city"],
            shipping_country=data["shipping_country"],
        )

        # 4. Create immutable OrderItem records
        for item_data in items_for_snapshot:
            OrderItem.objects.create(
                order=new_order,
                book=item_data["book"],
                quantity=item_data["quantity"],
                snapshot_price=item_data["snapshot_price"],
                snapshot_title=item_data["snapshot_title"],
                snapshot_author_name=item_data["snapshot_author_name"],
            )

        # 🔑 NEW STEP 5: Grant Digital Licenses (completes the loop)
        create_licenses_for_order(new_order, items_for_snapshot)

        # 6. Clean Up and Finalize

        # Clean up the persistent cart storage (DB only)
        Cart.objects.get(user=user).items.all().delete()

        # Update Discount Code usage count
        if applied_discount:
            applied_discount.times_used += 1
            applied_discount.save()

        # Send confirmation email to the background worker immediately after transaction completion.
        transaction.on_commit(lambda: send_order_confirmation_email.delay(new_order.id))

        # Return the newly created Order for confirmation
        return Response(
            OrderOutputSerializer(new_order).data, status=status.HTTP_201_CREATED
        )
