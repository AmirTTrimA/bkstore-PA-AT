from django.contrib import admin
from django.db.models import Count

from .models import Cart, CartItem, Order, OrderItem, WishlistItem


class OrderItemInline(admin.TabularInline):

    model = OrderItem
    extra = 0
    can_delete = False

    readonly_fields = (
        "book",
        "snapshot_title",
        "snapshot_author_name",
        "quantity",
        "snapshot_price",
    )

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [
        OrderItemInline,
    ]

    list_display = (
        "id",
        "user",
        "status",
        "total_amount",
        "discount_code",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "id",
        "user__username",
        "user__email",
        "shipping_name",
    )

    ordering = (
        "-created_at",
    )

    list_select_related = (
        "user",
        "discount_code",
    )

    readonly_fields = (
        "user",
        "subtotal",
        "discount_amount",
        "total_amount",
        "discount_code",
        "created_at",
        "shipping_name",
        "shipping_address_line1",
        "shipping_city",
        "shipping_country",
    )

    fieldsets = (
        (
            "Order",
            {
                "fields": (
                    "user",
                    "status",
                    "created_at",
                )
            },
        ),
        (
            "Financial",
            {
                "fields": (
                    "subtotal",
                    "discount_amount",
                    "total_amount",
                    "discount_code",
                )
            },
        ),
        (
            "Shipping",
            {
                "fields": (
                    "shipping_name",
                    "shipping_address_line1",
                    "shipping_city",
                    "shipping_country",
                )
            },
        ),
    )

    def has_delete_permission(self, request, obj=None):
        return False

class CartItemInline(admin.TabularInline):
    """
    Displays cart contents inside the Cart admin page.
    """

    model = CartItem

    extra = 0

    autocomplete_fields = (
        "book",
    )

    readonly_fields = (
        "book",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Admin interface for persistent shopping carts.
    """

    inlines = [
        CartItemInline,
    ]

    list_display = (
        "user",
        "item_count",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    ordering = (
        "-updated_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "user",
    )

    fieldsets = (
        (
            "Cart",
            {
                "fields": (
                    "user",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    @admin.display(
        ordering="item_total",
        description="Items",
    )
    def item_count(self, obj):
        return obj.item_total

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .annotate(
                item_total=Count("items")
            )
        )

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    """
    Admin interface for user wishlists.
    """

    list_display = (
        "user",
        "book",
        "author",
        "added_at",
    )

    list_filter = (
        "added_at",
        "book__genre",
    )

    search_fields = (
        "user__username",
        "user__email",
        "book__title",
    )

    ordering = (
        "-added_at",
    )

    autocomplete_fields = (
        "user",
        "book",
    )

    readonly_fields = (
        "added_at",
    )

    list_select_related = (
        "user",
        "book",
        "book__author",
    )

    @admin.display(
        ordering="book__author__name",
        description="Author",
    )
    def author(self, obj):
        return obj.book.author