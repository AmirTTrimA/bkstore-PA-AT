from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html, mark_safe

from .models import Address, OTPCode, User


class AddressInline(admin.StackedInline):
    model = Address
    extra = 0
    fields = (
        ("title", "is_default"),
        ("recipient_name", "phone_number"),
        ("country", "province", "city"),
        ("address_line", "postal_code"),
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):

    inlines = [AddressInline]

    list_display = (
        "username",
        "full_name_display",
        "email_display",
        "role_badges",
        "wallet_balance",
        "subscription_plan_badge",
        "order_count",
        "license_count",
        "status_badge",
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

    list_per_page = 25

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
            .select_related(
                "wallet",
                "publisher_membership__publisher",
            )
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

    @admin.display(description="Full Name", ordering="first_name")
    def full_name_display(self, obj):
        name = obj.get_full_name()
        return name if name else mark_safe('<span style="color:#94a3b8;">-</span>')

    @admin.display(description="Email", ordering="email")
    def email_display(self, obj):
        return format_html('<span class="cell-secondary">{}</span>', obj.email)

    @admin.display(description="Role(s)")
    def role_badges(self, obj):
        badges = []
        if obj.is_superuser:
            badges.append('<span class="status-badge status-purple">Superuser</span>')
        elif obj.is_staff:
            badges.append('<span class="status-badge status-purple">Staff</span>')

        if hasattr(obj, "publisher_membership") and obj.publisher_membership and obj.publisher_membership.is_active:
            role_name = obj.publisher_membership.get_role_display()
            badges.append(f'<span class="status-badge status-info">Publisher ({role_name})</span>')

        if not badges:
            badges.append('<span class="status-badge status-neutral">Customer</span>')
        return mark_safe(" ".join(badges))

    @admin.display(description="Wallet")
    def wallet_balance(self, obj):
        if hasattr(obj, "wallet") and obj.wallet:
            return mark_safe(f'<span class="currency-tag">{obj.wallet.balance:,.0f} <span class="irr-unit">IRR</span></span>')
        return mark_safe('<span class="currency-tag" style="color:#94a3b8;">0 <span class="irr-unit">IRR</span></span>')

    @admin.display(ordering="order_total", description="Orders")
    def order_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.order_total}</span>')

    @admin.display(ordering="license_total", description="Licenses")
    def license_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.license_total}</span>')

    @admin.display(description="Plan")
    def subscription_plan_badge(self, obj):
        active_sub = next(
            (s for s in obj.subscriptions.all() if s.status == "ACTIVE" and s.is_current()),
            None,
        )
        if active_sub:
            return mark_safe(f'<span class="status-badge status-purple">{active_sub.plan.name}</span>')
        return mark_safe('<span class="status-badge status-neutral">Free</span>')

    @admin.display(description="Status", ordering="is_active")
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Active</span>')
        return mark_safe('<span class="status-badge status-danger">Inactive</span>')


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):

    list_display = (
        "code_pill",
        "user_display",
        "valid_badge",
        "created_at",
        "expires_at",
    )
    list_display_links = (
        "code_pill",
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

    list_per_page = 25

    @admin.display(description="Customer", ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{}</a>',
            url,
            obj.user.username,
        )

    @admin.display(description="OTP Code", ordering="code")
    def code_pill(self, obj):
        return format_html(
            '<span class="promo-code-pill" style="letter-spacing:2px;">{}</span>',
            obj.code,
        )

    @admin.display(description="Status")
    def valid_badge(self, obj):
        if not obj.is_valid:
            return mark_safe('<span class="status-badge status-danger">Invalidated</span>')
        if obj.is_expired():
            return mark_safe('<span class="status-badge status-neutral">Expired</span>')
        return mark_safe('<span class="status-badge status-success">Active</span>')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "user_display",
        "recipient_name",
        "city",
        "phone_number",
        "default_badge",
        "created_at",
    )
    list_display_links = (
        "title",
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

    autocomplete_fields = (
        "user",
    )

    list_select_related = (
        "user",
    )

    list_per_page = 25

    @admin.display(description="Customer", ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{}</a>',
            url,
            obj.user.username,
        )

    @admin.display(description="Default", ordering="is_default")
    def default_badge(self, obj):
        if obj.is_default:
            return mark_safe('<span class="status-badge status-success">Default</span>')
        return mark_safe('<span class="status-badge status-neutral">Secondary</span>')