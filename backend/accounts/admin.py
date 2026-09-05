from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Count

from .models import Address, OTPCode, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "is_active",
        "subscription_plan",
        "subscription_status",
        "order_count",
        "license_count",
        "date_joined",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )

    search_fields = (
        "username",
        "email",
        "first_name",
        "last_name",
    )

    ordering = (
        "-date_joined",
    )

    readonly_fields = (
        "date_joined",
        "last_login",
    )

    def get_fieldsets(self, request, obj=None):

        fieldsets = list(
            super().get_fieldsets(request, obj)
        )

        fieldsets.append(
            (
                "Recommendation Profile",
                {
                    "fields": (
                        "job_or_major",
                        "hobbies_or_likings",
                    )
                },
            )
        )

        return fieldsets

    def get_queryset(self, request):

        return (
            super()
            .get_queryset(request)
            .prefetch_related(
                "subscriptions",
                "subscriptions__plan",
            )
            .annotate(
                order_total=Count(
                    "orders",
                    distinct=True,
                ),
                license_total=Count(
                    "licenses",
                    distinct=True,
                ),
            )
        )

    @admin.display(
        ordering="order_total",
        description="Orders",
    )
    def order_count(self, obj):
        return obj.order_total

    @admin.display(
        ordering="license_total",
        description="Licenses",
    )
    def license_count(self, obj):
        return obj.license_total

    @admin.display(
        boolean=True,
        description="Subscribed",
    )
    def subscription_status(self, obj):
        active_sub = next(
            (s for s in obj.subscriptions.all() if s.status == "ACTIVE" and s.is_current()),
            None,
        )
        return active_sub is not None

    @admin.display(description="Plan")
    def subscription_plan(self, obj):
        active_sub = next(
            (s for s in obj.subscriptions.all() if s.status == "ACTIVE" and s.is_current()),
            None,
        )
        return active_sub.plan.name if active_sub else "-"

@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "code",
        "is_valid",
        "created_at",
        "expires_at",
    )

    list_filter = (
        "is_valid",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    ordering = (
        "-created_at",
    )

    autocomplete_fields = (
        "user",
    )

    readonly_fields = (
        "code",
        "created_at",
        "expires_at",
    )

    list_select_related = (
        "user",
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "title",
        "recipient_name",
        "city",
        "phone_number",
        "is_default",
        "created_at",
    )
    list_filter = (
        "is_default",
        "city",
        "country",
        "created_at",
    )
    search_fields = (
        "user__username",
        "user__email",
        "recipient_name",
        "city",
        "address_line",
        "phone_number",
    )
    autocomplete_fields = ("user",)