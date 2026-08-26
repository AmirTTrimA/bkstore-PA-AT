from django.contrib import admin
from django.utils import timezone

from .models import (Discount, DiscountCode, Price, SubscriptionPlan,
                     UserSubscription)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "monthly_price",
        "digital_discount_percent",
        "is_active",
    )

    list_filter = (
        "is_active",
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

    readonly_fields = (
        "slug",
    )

    fieldsets = (
        (
            "Plan Information",
            {
                "fields": (
                    "name",
                    "slug",
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
        "user",
        "plan",
        "status",
        "start_date",
        "end_date",
        "auto_renew",
        "currently_valid",
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

    @admin.display(
        boolean=True,
        description="Valid",
    )
    def currently_valid(self, obj):
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
        "book",
        "value",
        "min_price",
        "effective_from",
        "effective_until",
        "currently_active",
    )

    list_filter = (

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

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "discount_type",
        "value",
        "scope",
        "activation",
        "is_active",
        "currently_active",
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

    list_select_related = (
        "book",
        "author",
    )

@admin.register(DiscountCode)
class DiscountCodeAdmin(admin.ModelAdmin):

    list_display = (
        "code",
        "discount",
        "is_active",
        "times_used",
        "max_uses",
        "remaining_uses",
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