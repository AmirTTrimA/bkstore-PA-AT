# cart/serilaizers.py
from decimal import Decimal  # 🔑 NEW: Import for safe decimal calculation

from catalog.models import Book, BookFormat  # To check if book exists
from django.utils.translation import gettext_lazy as _
from pricing.models import Price
from rest_framework import serializers

from .models import Cart, Order, OrderItem, WishlistItem

# -------------------------------------------------------------
# 1. CART ITEM INPUT/OUTPUT
# -------------------------------------------------------------


class CartItemInputSerializer(serializers.Serializer):
    """
    Serializer for adding, updating, and removing cart items.
    """

    book_id = serializers.IntegerField(required=True)

    format_id = serializers.IntegerField(required=True)

    quantity = serializers.IntegerField(
        min_value=1,
        required=False,
    )

    def validate(self, attrs):
        book_id = attrs["book_id"]
        format_id = attrs["format_id"]

        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            raise serializers.ValidationError({
                "book_id": _("Book with this ID does not exist.")
            })

        try:
            book_format = book.formats.get(
                pk=format_id,
                is_available=True,
            )
        except BookFormat.DoesNotExist:
            raise serializers.ValidationError({
                "format_id": _(
                    "This format does not exist, does not belong "
                    "to this book, or is unavailable."
                )
            })

        attrs["book"] = book
        attrs["book_format"] = book_format

        return attrs


class CartItemOutputSerializer(serializers.Serializer):
    """
    Serializer for displaying the current cart.
    """

    book_id = serializers.IntegerField()
    title = serializers.CharField()

    format_id = serializers.IntegerField()
    format_type = serializers.CharField()

    quantity = serializers.IntegerField()

    subtotal = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()

    cover_image_url = serializers.URLField(
        allow_null=True,
    )

    def get_subtotal(self, item):
        unit_price = item.get(
            "unit_price",
            Decimal("0.00"),
        )

        return round(
            item["quantity"] * unit_price,
            2,
        )

    def get_unit_price(self, item):
        return item.get(
            "unit_price",
            Decimal("0.00"),
        )


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
            "book_format",
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
