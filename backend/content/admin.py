from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html, mark_safe

from .models import License


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):

    list_display = (
        "license_id",
        "cover_thumb",
        "user_display",
        "book_display",
        "format_badge",
        "order_link",
        "status_badge",
        "valid_from",
        "valid_until",
    )
    list_display_links = (
        "license_id",
        "cover_thumb",
    )

    list_filter = (
        "is_active",
        "book_format__format_type",
        "valid_from",
        "valid_until",
    )

    search_fields = (
        "user__username",
        "user__email",
        "book__title",
        "book__isbn",
    )

    ordering = (
        "-valid_from",
    )

    autocomplete_fields = (
        "user",
        "book",
        "book_format",
        "order",
    )

    list_select_related = (
        "user",
        "book",
        "book_format",
        "order",
    )

    readonly_fields = (
        "user",
        "book",
        "book_format",
        "order",
        "valid_from",
        "valid_until",
    )

    list_per_page = 25

    @admin.display(description="License ID", ordering="id")
    def license_id(self, obj):
        val_str = f"#{obj.id:05d}"
        return format_html('<span class="order-id-tag">{}</span>', val_str)

    @admin.display(description="Cover")
    def cover_thumb(self, obj):
        if obj.book and obj.book.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.book.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(description="Customer", ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{} <span class="cell-muted">({})</span></a>',
            url,
            obj.user.username,
            obj.user.email,
        )

    @admin.display(description="Book", ordering="book__title")
    def book_display(self, obj):
        url = reverse("admin:catalog_book_change", args=[obj.book.pk])
        return format_html(
            '<a href="{}" class="admin-book-link">{}</a>',
            url,
            obj.book.title,
        )

    @admin.display(description="Format")
    def format_badge(self, obj):
        if not obj.book_format:
            return "-"
        fmt = obj.book_format.format_type
        cls = "status-purple" if "DIGITAL" in fmt else ("status-info" if "AUDIO" in fmt else "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{fmt.replace("_", " ")}</span>')

    @admin.display(description="Order", ordering="order__id")
    def order_link(self, obj):
        if not obj.order:
            return mark_safe('<span class="cell-muted">Manual / Grant</span>')
        url = reverse("admin:cart_order_change", args=[obj.order.pk])
        order_num = f"#{obj.order.id:05d}"
        return format_html(
            '<a href="{}" class="order-id-tag">{}</a>',
            url,
            order_num,
        )

    @admin.display(description="License Status")
    def status_badge(self, obj):
        if not obj.is_active:
            return mark_safe('<span class="status-badge status-danger">Revoked</span>')
        if not obj.is_valid():
            return mark_safe('<span class="status-badge status-neutral">Expired</span>')
        return mark_safe('<span class="status-badge status-success">Active License</span>')

    fieldsets = (
        (
            "License",
            {
                "fields": (
                    "user",
                    "book",
                    "book_format",
                    "order",
                )
            },
        ),
        (
            "Validity",
            {
                "fields": (
                    "is_active",
                    "valid_from",
                    "valid_until",
                )
            },
        ),
    )

    @admin.display(
        boolean=True,
        description="Currently Valid",
    )
    def is_currently_valid(self, obj):
        return obj.is_valid()