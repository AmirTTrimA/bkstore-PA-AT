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
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()

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

    def get_original_price(self, item):
        return item.get(
            "original_price",
            item.get("unit_price", Decimal("0.00")),
        )

    def get_discount_percent(self, item):
        return item.get("discount_percent", 0)

    def get_has_discount(self, item):
        return item.get("has_discount", False)


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
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = (
            "id",
            "book_id",
            "title",
            "author_name",
            "cover_image_url",
            "price",
            "original_price",
            "discount_percent",
            "has_discount",
            "added_at",
        )
        read_only_fields = fields  # All output fields are read-only

    def _get_pricing(self, obj):
        if not hasattr(obj, "_cached_pricing"):
            from pricing.services import PricingEngine

            request = self.context.get("request")
            user = request.user if request and request.user.is_authenticated else None
            format_obj = obj.book.formats.first()
            if not format_obj:
                obj._cached_pricing = None
                return None
            try:
                engine = PricingEngine(book_format=format_obj, user=user)
                obj._cached_pricing = engine.calculate()
            except Exception:
                obj._cached_pricing = None
        return obj._cached_pricing

    def get_price(self, obj):
        res = self._get_pricing(obj)
        if res:
            return str(int(round(res.final_price)))
        format_obj = obj.book.formats.first()
        if format_obj:
            from pricing.services import PricingEngine

            price = PricingEngine(book_format=format_obj).get_current_price()
            return str(price.value) if price else None
        return None

    def get_original_price(self, obj):
        res = self._get_pricing(obj)
        if res:
            return str(int(round(res.base_price)))
        format_obj = obj.book.formats.first()
        if format_obj:
            from pricing.services import PricingEngine

            price = PricingEngine(book_format=format_obj).get_current_price()
            return str(price.value) if price else None
        return None

    def get_discount_percent(self, obj):
        res = self._get_pricing(obj)
        if res and res.final_price < res.base_price and res.base_price > 0:
            return int(round((res.base_price - res.final_price) / res.base_price * 100))
        return 0

    def get_has_discount(self, obj):
        res = self._get_pricing(obj)
        return bool(res and res.final_price < res.base_price)


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
    Supports either selecting a saved address_id or providing manual shipping details.
    Shipping details are only mandatory if the cart contains physical books.
    """

    address_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        label=_("Saved Address ID"),
    )
    shipping_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default="",
        label=_("Recipient Name"),
    )
    shipping_address_line1 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        default="",
        label=_("Address Line 1"),
    )
    shipping_city = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default="",
        label=_("City"),
    )
    shipping_country = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default="Iran",
        label=_("Country"),
    )

    # --- Optional Discount Code ---
    discount_code = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        default="",
        label=_("Discount Code"),
    )



class OrderItemOutputSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying items within a final, historical Order.
    """

    # Display the book title and author name from the saved snapshots
    book_title = serializers.CharField(source="snapshot_title", read_only=True)
    author_name = serializers.CharField(source="snapshot_author_name", read_only=True)
    format_type = serializers.CharField(source="book_format.format_type", read_only=True)
    format_name = serializers.CharField(source="book_format.name", read_only=True)
    cover_image_url = serializers.URLField(source="book.cover_image_url", read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "book_title",
            "author_name",
            "quantity",
            "book_format",
            "format_type",
            "format_name",
            "cover_image_url",
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
