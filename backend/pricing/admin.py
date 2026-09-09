from django.contrib import admin
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html, mark_safe

from .models import (Discount, DiscountCode, Price, SubscriptionPlan,
                     UserSubscription)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "tier_badge",
        "formatted_monthly_price",
        "digital_discount_display",
        "status_badge",
    )

    list_filter = (
        "is_active",
        "tier",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "name",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    @admin.display(description="Tier", ordering="tier")
    def tier_badge(self, obj):
        cls = "status-purple" if obj.tier in ("PREMIUM", "VIP") else "status-info"
        return mark_safe(f'<span class="status-badge {cls}">{obj.get_tier_display() if hasattr(obj, "get_tier_display") else obj.tier}</span>')

    @admin.display(description="Monthly Price", ordering="monthly_price")
    def formatted_monthly_price(self, obj):
        return mark_safe(f'<span class="currency-tag">{obj.monthly_price:,.0f} <span class="irr-unit">IRR</span></span>')

    @admin.display(description="Digital Discount", ordering="digital_discount_percent")
    def digital_discount_display(self, obj):
        return mark_safe(f'<span class="status-badge status-accent">{obj.digital_discount_percent}% OFF</span>')

    @admin.display(description="Status", ordering="is_active")
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Active</span>')
        return mark_safe('<span class="status-badge status-neutral">Inactive</span>')

    fieldsets = (
        (
            "Plan Information",
            {
                "fields": (
                    "name",
                    "slug",
                    "tier",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "monthly_price",
                    "digital_discount_percent",
                )
            },
        ),
        (
            "Status",
            {
                "fields": (
                    "is_active",
                )
            },
        ),
    )


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):

    list_display = (
        "user_display",
        "plan_badge",
        "status_badge",
        "validity_countdown",
        "start_date",
        "end_date",
        "auto_renew",
    )

    list_filter = (
        "status",
        "auto_renew",
        "plan",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    autocomplete_fields = (
        "user",
        "plan",
    )

    readonly_fields = (
        "currently_valid",
        "created_at",
        "updated_at",
    )

    list_select_related = (
        "user",
        "plan",
    )

    @admin.display(description="Customer", ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{} <span class="cell-muted">({})</span></a>',
            url,
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(description="Plan", ordering="plan__name")
    def plan_badge(self, obj):
        return mark_safe(f'<span class="status-badge status-purple">{obj.plan.name}</span>')

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        mapping = {
            "ACTIVE": "status-success",
            "CANCELLED": "status-warning",
            "EXPIRED": "status-danger",
        }
        cls = mapping.get(obj.status, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.get_status_display()}</span>')

    @admin.display(description="Validity")
    def validity_countdown(self, obj):
        if not obj.is_current():
            return mark_safe('<span class="status-badge status-neutral">Expired</span>')
        now = timezone.now()
        remaining = (obj.end_date - now).days
        if remaining > 7:
            return mark_safe(f'<span class="status-badge status-info">{remaining} days left</span>')
        elif remaining >= 0:
            return mark_safe(f'<span class="status-badge status-warning">{remaining} days left</span>')
        return mark_safe('<span class="status-badge status-danger">Expired</span>')

    @admin.display(
        boolean=True,
        description="Valid",
    )
    def currently_valid(self, obj):
        if not obj or not obj.end_date:
            return False
        return obj.is_current()

    fieldsets = (
        (
            "Subscription",
            {
                "fields": (
                    "user",
                    "plan",
                    "status",
                    "auto_renew",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "start_date",
                    "end_date",
                    "currently_valid",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    date_hierarchy = "start_date"
    list_per_page = 25


@admin.register(Price)
class PriceAdmin(admin.ModelAdmin):

    list_display = (
        "cover_thumb",
        "book_link",
        "formatted_value",
        "formatted_min_price",
        "validity_badge",
        "effective_from",
        "effective_until",
    )

    list_filter = (
        "effective_from",
        "effective_until",
    )

    search_fields = (
        "book__title",
        "book__isbn",
        "book__author__name",
    )

    ordering = (
        "-effective_from",
    )

    autocomplete_fields = (
        "book",
    )

    list_select_related = (
        "book",
    )

    list_per_page = 25

    fieldsets = (
        (
            "Book",
            {
                "fields": (
                    "book",
                )
            },
        ),
        (
            "Pricing",
            {
                "fields": (
                    "value",
                    "min_price",
                )
            },
        ),
        (
            "Validity",
            {
                "fields": (
                    "effective_from",
                    "effective_until",
                    "currently_active",
                )
            },
        ),
    )

    readonly_fields = (
        "currently_active",
    )

    @admin.display(description="Cover")
    def cover_thumb(self, obj):
        if obj.book and obj.book.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.book.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(description="Book", ordering="book__title")
    def book_link(self, obj):
        url = reverse("admin:catalog_book_change", args=[obj.book.pk])
        return format_html(
            '<a href="{}" class="admin-book-link">{}</a>',
            url,
            obj.book.title,
        )

    @admin.display(description="Price", ordering="value")
    def formatted_value(self, obj):
        return mark_safe(
            f'<span class="currency-tag" style="color:var(--pn-primary);">{obj.value:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    @admin.display(description="Floor Price", ordering="min_price")
    def formatted_min_price(self, obj):
        if obj.min_price is not None:
            return mark_safe(
                f'<span class="currency-tag">{obj.min_price:,.0f} <span class="irr-unit">IRR</span></span>'
            )
        return mark_safe('<span style="color:#94a3b8;">-</span>')

    @admin.display(description="Validity")
    def validity_badge(self, obj):
        now = timezone.now()
        if obj.effective_from > now:
            return mark_safe('<span class="status-badge status-info">Future</span>')
        if obj.effective_until and obj.effective_until <= now:
            return mark_safe('<span class="status-badge status-neutral">Expired</span>')
        return mark_safe('<span class="status-badge status-success">Active Now</span>')

    @admin.display(
        boolean=True,
        description="Active",
    )
    def currently_active(self, obj):
        if obj is None:
            return False
        now = timezone.now()
        if obj.effective_from > now:
            return False
        if obj.effective_until and obj.effective_until <= now:
            return False
        return True

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return self.readonly_fields
        return (
            "book",
            "value",
            "min_price",
            "effective_from",
            "effective_until",
            "currently_active",
        )

    def has_delete_permission(self, request, obj=None):
        return False


class DiscountCodeInline(admin.TabularInline):
    model = DiscountCode
    extra = 0
    fields = (
        "code_pill",
        "code",
        "is_active",
        "times_used",
        "max_uses",
        "remaining_uses",
    )
    readonly_fields = (
        "code_pill",
        "times_used",
        "remaining_uses",
    )

    @admin.display(description="Code")
    def code_pill(self, obj):
        if not obj.pk:
            return "-"
        return format_html(
            '<span class="promo-code-pill">{}</span>',
            obj.code,
        )


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):

    inlines = [
        DiscountCodeInline,
    ]

    list_display = (
        "name",
        "type_badge",
        "formatted_value",
        "scope_badge",
        "validity_badge",
        "status_badge",
    )

    list_filter = (
        "activation",
        "scope",
        "discount_type",
        "is_active",
    )

    search_fields = (
        "name",
        "book__title",
        "author__name",
    )

    ordering = (
        "-valid_from",
    )

    autocomplete_fields = (
        "book",
        "author",
    )

    readonly_fields = (
        "currently_active",
    )

    list_per_page = 25

    list_select_related = (
        "book",
        "author",
    )

    @admin.display(description="Type", ordering="discount_type")
    def type_badge(self, obj):
        cls = "status-purple" if obj.discount_type == "PERCENTAGE" else "status-info"
        return mark_safe(f'<span class="status-badge {cls}">{obj.get_discount_type_display()}</span>')

    @admin.display(description="Value", ordering="value")
    def formatted_value(self, obj):
        if obj.discount_type == "PERCENTAGE":
            return mark_safe(f'<span class="status-badge status-accent">{obj.value}% OFF</span>')
        return mark_safe(f'<span class="currency-tag" style="color:#15803d;">-{obj.value:,.0f} <span class="irr-unit">IRR</span></span>')

    @admin.display(description="Scope", ordering="scope")
    def scope_badge(self, obj):
        return mark_safe(f'<span class="status-badge status-neutral">{obj.get_scope_display()}</span>')

    @admin.display(description="Validity")
    def validity_badge(self, obj):
        if obj.is_active_now():
            return mark_safe('<span class="status-badge status-success">Active Now</span>')
        now = timezone.now()
        if obj.valid_from and obj.valid_from > now:
            return mark_safe('<span class="status-badge status-info">Upcoming</span>')
        return mark_safe('<span class="status-badge status-neutral">Expired / Inactive</span>')

    @admin.display(description="Status", ordering="is_active")
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Enabled</span>')
        return mark_safe('<span class="status-badge status-danger">Disabled</span>')

    @admin.display(
        boolean=True,
        description="Currently Active",
    )
    def currently_active(self, obj):
        return obj.is_active_now()

    fieldsets = (
        (
            "General",
            {
                "fields": (
                    "name",
                    "description",
                )
            },
        ),
        (
            "Discount",
            {
                "fields": (
                    "discount_type",
                    "value",
                )
            },
        ),
        (
            "Scope",
            {
                "fields": (
                    "scope",
                    "book",
                    "author",
                    "genre",
                    "format",
                )
            },
        ),
        (
            "Availability",
            {
                "fields": (
                    "activation",
                    "is_active",
                    "valid_from",
                    "valid_until",
                    "currently_active",
                )
            },
        ),
    )


@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):

    list_display = (
        "code_pill",
        "discount_link",
        "usage_badge",
        "status_badge",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "code",
        "discount__name",
    )

    ordering = (
        "code",
    )

    autocomplete_fields = (
        "discount",
    )

    list_select_related = (
        "discount",
    )

    list_per_page = 25

    @admin.display(description="Promo Code", ordering="code")
    def code_pill(self, obj):
        return format_html(
            '<span class="promo-code-pill">{}</span>',
            obj.code,
        )

    @admin.display(description="Discount Campaign", ordering="discount__name")
    def discount_link(self, obj):
        url = reverse("admin:pricing_discount_change", args=[obj.discount.pk])
        return format_html(
            '<a href="{}" class="admin-accent-link">{}</a>',
            url,
            obj.discount.name,
        )

    @admin.display(description="Usage")
    def usage_badge(self, obj):
        max_u = obj.max_uses if obj.max_uses is not None else "&infin;"
        return mark_safe(f'<span class="item-count-badge">{obj.times_used} / {max_u}</span>')

    @admin.display(description="Status", ordering="is_active")
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Active</span>')
        return mark_safe('<span class="status-badge status-neutral">Inactive</span>')

    @admin.display(description="Remaining Uses")
    def remaining_uses(self, obj):
        if obj.remaining_uses is None:
            return "Unlimited"
        return obj.remaining_uses

    fieldsets = (
        (
            "Coupon",
            {
                "fields": (
                    "code",
                    "discount",
                )
            },
        ),
        (
            "Usage",
            {
                "fields": (
                    "is_active",
                    "times_used",
                    "max_uses",
                    "remaining_uses",
                )
            },
        ),
    )

    readonly_fields = (
        "times_used",
        "remaining_uses",
    )