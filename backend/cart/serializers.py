# cart/serilaizers.py
from decimal import Decimal  # 🔑 NEW: Import for safe decimal calculation

from catalog.models import Book  # To check if book exists
from django.utils.translation import gettext_lazy as _
from pricing.models import Price
from rest_framework import serializers

from .models import Cart, Order, OrderItem, WishlistItem

# -------------------------------------------------------------
# 1. CART ITEM INPUT/OUTPUT
# -------------------------------------------------------------


class CartItemInputSerializer(serializers.Serializer):
    """
    Serializer for inputting data to modify the cart (add/update/remove item).
    """

    book_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(
        min_value=1, required=False
    )  # Optional for deletion

    def validate_book_id(self, value):
        """Checks if the book ID is valid before processing the cart action."""
        try:
            Book.objects.get(pk=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError(_("Book with this ID does not exist."))
        return value


class CartItemOutputSerializer(serializers.Serializer):
    """
    Serializer to represent a single item in the cart (used for displaying the current state).
    Note: This is used to display the final cart state in the views.
    """

    book_id = serializers.IntegerField()
    title = serializers.CharField()
    quantity = serializers.IntegerField()
    # 🔑 CRITICAL CHANGE: subtotal is dynamic (SerializerMethodField)
    subtotal = serializers.SerializerMethodField()
    cover_image_url = serializers.URLField()

    # Placeholder for the future price service integration
    def get_subtotal(self, item):
        """
        Calculates the item subtotal based on current active price and quantity.
        This method will integrate the Price Lookup Service (Phase 2, Step 1).
        """
        # 🔑 FIX: Removed MOCK Price. The view MUST now pass the calculated unit price
        # (or the Book object) via the serializer's context.
        # Since the view will compute and inject the final price, the serializer
        # relies on receiving the 'unit_price' in the item dictionary.

        # Fallback in case unit_price is not provided by the view logic:
        current_unit_price = item.get("unit_price", Decimal("0.00"))

        return round(item["quantity"] * current_unit_price, 2)


class WishlistItemSerializer(serializers.ModelSerializer):
    """
    Serializer to represent and validate items in the user's wishlist.
    """

    book_id = serializers.IntegerField(source="book.id", read_only=True)
    title = serializers.CharField(source="book.title", read_only=True)
    author_name = serializers.CharField(source="book.author.name", read_only=True)
    cover_image_url = serializers.URLField(
        source="book.cover_image_url", read_only=True
    )

    # 🔑 Note: Price is NOT included here, as it changes frequently.
    # The frontend should pull the current price separately via the public /books/ endpoint.

    class Meta:
        model = WishlistItem
        fields = (
            "id",
            "book_id",
            "title",
            "author_name",
            "cover_image_url",
            "added_at",
        )
        read_only_fields = fields  # All output fields are read-only


class WishlistCreateSerializer(serializers.Serializer):
    """Serializer for adding a new item to the wishlist (input only)."""

    book_id = serializers.IntegerField(required=True)

    def validate_book_id(self, value):
        """Checks if the book ID is valid."""
        try:
            Book.objects.get(pk=value)
        except Book.DoesNotExist:
            raise serializers.ValidationError(_("Book with this ID does not exist."))
        return value


# -------------------------------------------------------------
# 3. CHECKOUT & ORDER SERIALIZERS
# -------------------------------------------------------------


class CheckoutInputSerializer(serializers.Serializer):
    """
    Serializer for input data during final order submission (checkout).
    """

    # --- Shipping Address Snapshot (Required for physical delivery) ---
    shipping_name = serializers.CharField(
        max_length=255, required=True, label=_("Recipient Name")
    )
    shipping_address_line1 = serializers.CharField(
        max_length=255, required=True, label=_("Address Line 1")
    )
    shipping_city = serializers.CharField(
        max_length=100, required=True, label=_("City")
    )
    shipping_country = serializers.CharField(
        max_length=100, required=True, label=_("Country")
    )

    # --- Optional Discount Code ---
    discount_code = serializers.CharField(
        max_length=50, required=False, allow_blank=True, label=_("Discount Code")
    )

    # Validation: We don't need extensive validation here; it will happen in the View/Service layer
    # to enforce business rules (like checking code validity and availability).


class OrderItemOutputSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying items within a final, historical Order.
    """

    # Display the book title and author name from the saved snapshots
    book_title = serializers.CharField(source="snapshot_title", read_only=True)
    author_name = serializers.CharField(source="snapshot_author_name", read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "book_title",
            "author_name",
            "quantity",
            "snapshot_price",  # The price locked in at the time of purchase
        )


class OrderOutputSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying a completed Order in the user's history/confirmation screen.
    """

    # 🔑 Nested Serializer: Embeds all the items associated with this order.
    items = OrderItemOutputSerializer(many=True, read_only=True)

    # Custom fields for readability
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "status_display",
            "subtotal",
            "discount_amount",
            "total_amount",
            "created_at",
            # Address Snapshot for confirmation
            "shipping_name",
            "shipping_address_line1",
            "shipping_city",
            "shipping_country",
            "items",
        )
