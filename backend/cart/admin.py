from django.contrib import admin, messages
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html, mark_safe

from .models import Cart, CartItem, Order, OrderItem, WishlistItem


class OrderItemInline(admin.TabularInline):

    model = OrderItem
    extra = 0
    can_delete = False

    fields = (
        "cover_thumb",
        "book_link",
        "format_badge",
        "snapshot_title",
        "snapshot_author_name",
        "quantity",
        "formatted_price",
        "line_total",
    )

    readonly_fields = (
        "cover_thumb",
        "book_link",
        "format_badge",
        "snapshot_title",
        "snapshot_author_name",
        "quantity",
        "formatted_price",
        "line_total",
    )

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Cover")
    def cover_thumb(self, obj):
        if obj.book and obj.book.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.book.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(description="Book")
    def book_link(self, obj):
        if obj.book:
            url = reverse("admin:catalog_book_change", args=[obj.book.pk])
            return format_html(
                '<a href="{}" style="font-weight:600; color:var(--pn-primary);">{}</a>',
                url,
                obj.book.title,
            )
        return "-"

    @admin.display(description="Format")
    def format_badge(self, obj):
        if not obj.book_format:
            return "-"
        fmt = obj.book_format.format_type
        pill_cls = (
            "status-purple"
            if "DIGITAL" in fmt
            else ("status-info" if "AUDIO" in fmt else "status-neutral")
        )
        return mark_safe(
            f'<span class="status-badge {pill_cls}">{fmt.replace("_", " ")}</span>'
        )

    @admin.display(description="Unit Price")
    def formatted_price(self, obj):
        return mark_safe(
            f'<span class="currency-tag">{obj.snapshot_price:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    @admin.display(description="Line Total")
    def line_total(self, obj):
        tot = obj.quantity * obj.snapshot_price
        return mark_safe(
            f'<span class="currency-tag" style="color:var(--pn-primary);">{tot:,.0f} <span class="irr-unit">IRR</span></span>'
        )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = [
        OrderItemInline,
    ]

    list_display = (
        "order_id_display",
        "user_display",
        "status_badge",
        "items_count",
        "formatted_subtotal",
        "formatted_discount",
        "formatted_total",
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

    actions = (
        "mark_processing",
        "mark_shipped",
        "mark_delivered",
        "mark_refunded",
    )

    date_hierarchy = "created_at"
    list_per_page = 25

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user", "discount_code")
            .annotate(items_total=Count("items"))
        )

    @admin.display(description="Order ID", ordering="id")
    def order_id_display(self, obj):
        return format_html(
            '<span style="font-family:monospace; font-weight:700; color:#0f172a;">#{:05d}</span>',
            obj.id,
        )

    @admin.display(description="Customer", ordering="user__username")
    def user_display(self, obj):
        if not obj.user:
            return mark_safe('<span style="color:#94a3b8;">Guest / Deleted</span>')
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" style="font-weight:600; color:#1e293b;">{} <span style="color:#64748b; font-weight:normal;">({})</span></a>',
            url,
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        mapping = {
            "DELIVERED": ("status-success", "Delivered"),
            "SHIPPED": ("status-info", "Shipped"),
            "PROCESSING": ("status-purple", "Processing"),
            "PENDING": ("status-warning", "Pending"),
            "CANCELLED": ("status-neutral", "Cancelled"),
            "REFUNDED": ("status-danger", "Refunded"),
        }
        cls, label = mapping.get(obj.status, ("status-neutral", obj.get_status_display()))
        return mark_safe(f'<span class="status-badge {cls}">{label}</span>')

    @admin.display(description="Items", ordering="items_total")
    def items_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.items_total} items</span>')

    @admin.display(description="Subtotal", ordering="subtotal")
    def formatted_subtotal(self, obj):
        return mark_safe(f'<span class="currency-tag">{obj.subtotal:,.0f} <span class="irr-unit">IRR</span></span>')

    @admin.display(description="Discount", ordering="discount_amount")
    def formatted_discount(self, obj):
        if obj.discount_amount:
            return mark_safe(f'<span class="currency-tag" style="color:#15803d;">-{obj.discount_amount:,.0f} <span class="irr-unit">IRR</span></span>')
        return mark_safe('<span style="color:#94a3b8;">-</span>')

    @admin.display(description="Total Paid", ordering="total_amount")
    def formatted_total(self, obj):
        return mark_safe(f'<span class="currency-tag" style="font-size:0.92rem; color:var(--pn-primary);">{obj.total_amount:,.0f} <span class="irr-unit">IRR</span></span>')

    @admin.action(description="Mark selected orders as Processing")
    def mark_processing(self, request, queryset):
        updated = queryset.update(status="PROCESSING")
        self.message_user(request, f"{updated} order(s) marked as Processing.", level=messages.SUCCESS)

    @admin.action(description="Mark selected orders as Shipped")
    def mark_shipped(self, request, queryset):
        updated = queryset.update(status="SHIPPED")
        self.message_user(request, f"{updated} order(s) marked as Shipped.", level=messages.SUCCESS)

    @admin.action(description="Mark selected orders as Delivered")
    def mark_delivered(self, request, queryset):
        updated = queryset.update(status="DELIVERED")
        self.message_user(request, f"{updated} order(s) marked as Delivered.", level=messages.SUCCESS)

    @admin.action(description="Mark selected orders as Refunded")
    def mark_refunded(self, request, queryset):
        updated = queryset.update(status="REFUNDED")
        self.message_user(request, f"{updated} order(s) marked as Refunded.", level=messages.SUCCESS)

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

    fields = (
        "cover_thumb",
        "book_link",
        "format_badge",
        "quantity",
    )

    readonly_fields = (
        "cover_thumb",
        "book_link",
        "format_badge",
        "quantity",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description="Cover")
    def cover_thumb(self, obj):
        if obj.book and obj.book.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.book.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(description="Book")
    def book_link(self, obj):
        if obj.book:
            url = reverse("admin:catalog_book_change", args=[obj.book.pk])
            return format_html(
                '<a href="{}" style="font-weight:600; color:var(--pn-primary);">{}</a>',
                url,
                obj.book.title,
            )
        return "-"

    @admin.display(description="Format")
    def format_badge(self, obj):
        if not obj.book_format:
            return "-"
        fmt = obj.book_format.format_type
        pill_cls = (
            "status-purple"
            if "DIGITAL" in fmt
            else ("status-info" if "AUDIO" in fmt else "status-neutral")
        )
        return mark_safe(
            f'<span class="status-badge {pill_cls}">{fmt.replace("_", " ")}</span>'
        )


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Admin interface for persistent shopping carts.
    """

    inlines = [
        CartItemInline,
    ]

    list_display = (
        "user_display",
        "item_count",
        "updated_at",
        "created_at",
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

    list_per_page = 25

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
        ordering="user__username",
        description="Customer",
    )
    def user_display(self, obj):
        if not obj.user:
            return mark_safe('<span style="color:#94a3b8;">Guest</span>')
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" style="font-weight:600; color:#1e293b;">{} <span style="color:#64748b; font-weight:normal;">({})</span></a>',
            url,
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(
        ordering="item_total",
        description="Items",
    )
    def item_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.item_total} items</span>')

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
        "cover_thumb",
        "user_display",
        "book_display",
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

    list_per_page = 25

    @admin.display(description="Cover")
    def cover_thumb(self, obj):
        if obj.book and obj.book.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.book.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(
        ordering="user__username",
        description="Customer",
    )
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" style="font-weight:600; color:#1e293b;">{}</a>',
            url,
            obj.user.username,
        )

    @admin.display(
        ordering="book__title",
        description="Book",
    )
    def book_display(self, obj):
        url = reverse("admin:catalog_book_change", args=[obj.book.pk])
        return format_html(
            '<a href="{}" style="font-weight:600; color:var(--pn-primary);">{}</a>',
            url,
            obj.book.title,
        )

    @admin.display(
        ordering="book__author__name",
        description="Author",
    )
    def author(self, obj):
        return obj.book.author