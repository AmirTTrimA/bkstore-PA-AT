from decimal import Decimal  # 🔑 NEW: Import for safe decimal calculation

from catalog.models import Book  # To check if book exists
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from decimal import Decimal

from .models import Cart, Order, OrderItem, WishlistItem
from pricing.models import Price

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
