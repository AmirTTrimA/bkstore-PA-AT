from django.contrib import admin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html, mark_safe
from django.utils.translation import gettext_lazy as _

from .models.transaction import WalletTransaction
from .models.wallet import Wallet


class WalletTransactionInline(admin.TabularInline):
    model = WalletTransaction
    extra = 0
    can_delete = False
    fields = (
        "type_badge",
        "formatted_amount",
        "formatted_balance_after",
        "description",
        "created_at",
    )
    readonly_fields = (
        "type_badge",
        "formatted_amount",
        "formatted_balance_after",
        "description",
        "created_at",
    )

    def has_add_permission(self, request, obj=None):
        return False

    @admin.display(description="Type")
    def type_badge(self, obj):
        mapping = {
            "DEPOSIT": "status-success",
            "PURCHASE": "status-danger",
            "REFUND": "status-purple",
            "ADJUSTMENT": "status-warning",
        }
        cls = mapping.get(obj.transaction_type, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.get_transaction_type_display()}</span>')

    @admin.display(description="Amount")
    def formatted_amount(self, obj):
        sign = "+" if obj.transaction_type in ("DEPOSIT", "REFUND") else "-"
        color = "#15803d" if sign == "+" else "#b91c1c"
        return mark_safe(
            f'<span class="currency-tag" style="color:{color};">{sign}{obj.amount:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    @admin.display(description="Balance After")
    def formatted_balance_after(self, obj):
        return mark_safe(
            f'<span class="currency-tag">{obj.balance_after:,.0f} <span class="irr-unit">IRR</span></span>'
        )


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    inlines = [WalletTransactionInline]

    list_display = (
        "wallet_id",
        "user_display",
        "formatted_balance",
        "transaction_count",
        "updated_at",
        "created_at",
    )
    list_display_links = (
        "wallet_id",
        "formatted_balance",
    )
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    autocomplete_fields = (
        "user",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    list_select_related = (
        "user",
    )
    list_per_page = 25

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .annotate(tx_total=Count("transactions"))
        )

    @admin.display(description=_("Wallet ID"), ordering="id")
    def wallet_id(self, obj):
        val_str = f"#{obj.id:05d}"
        return format_html('<span class="order-id-tag">{}</span>', val_str)

    @admin.display(description=_("Customer"), ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{} <span class="cell-muted">({})</span></a>',
            url,
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(description=_("Balance"), ordering="balance")
    def formatted_balance(self, obj):
        return mark_safe(
            f'<span class="currency-tag" style="font-size:0.95rem; color:var(--pn-primary);">{obj.balance:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    @admin.display(description=_("Transactions"), ordering="tx_total")
    def transaction_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.tx_total} txns</span>')


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_id",
        "wallet_link",
        "wallet_user",
        "type_badge",
        "formatted_amount",
        "formatted_balance_after",
        "description",
        "created_at",
    )
    list_display_links = (
        "transaction_id",
    )
    search_fields = (
        "wallet__user__username",
        "wallet__user__email",
        "description",
    )
    list_filter = (
        "transaction_type",
        "created_at",
    )
    autocomplete_fields = (
        "wallet",
    )
    readonly_fields = (
        "wallet",
        "transaction_type",
        "amount",
        "balance_after",
        "description",
        "created_at",
    )
    list_select_related = (
        "wallet__user",
    )
    date_hierarchy = "created_at"
    list_per_page = 25

    @admin.display(description=_("Tx ID"), ordering="id")
    def transaction_id(self, obj):
        val_str = f"#{obj.id:05d}"
        return format_html('<span class="order-id-tag">{}</span>', val_str)

    @admin.display(description=_("Wallet"), ordering="wallet_id")
    def wallet_link(self, obj):
        url = reverse("admin:wallet_wallet_change", args=[obj.wallet.pk])
        val_str = f"#{obj.wallet.pk:05d}"
        return format_html('<a href="{}" class="admin-accent-link">Wallet {}</a>', url, val_str)

    @admin.display(description=_("Customer"), ordering="wallet__user__username")
    def wallet_user(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.wallet.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{}</a>',
            url,
            obj.wallet.user.username,
        )

    @admin.display(description="Type", ordering="transaction_type")
    def type_badge(self, obj):
        mapping = {
            "DEPOSIT": "status-success",
            "PURCHASE": "status-danger",
            "REFUND": "status-purple",
            "ADJUSTMENT": "status-warning",
        }
        cls = mapping.get(obj.transaction_type, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.get_transaction_type_display()}</span>')

    @admin.display(description="Amount", ordering="amount")
    def formatted_amount(self, obj):
        sign = "+" if obj.transaction_type in ("DEPOSIT", "REFUND") else "-"
        color = "#15803d" if sign == "+" else "#b91c1c"
        return mark_safe(
            f'<span class="currency-tag" style="color:{color};">{sign}{obj.amount:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    @admin.display(description="Balance After", ordering="balance_after")
    def formatted_balance_after(self, obj):
        return mark_safe(
            f'<span class="currency-tag">{obj.balance_after:,.0f} <span class="irr-unit">IRR</span></span>'
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False