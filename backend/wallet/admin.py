from django.contrib import admin

from .models.transaction import WalletTransaction
from .models.wallet import Wallet


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "balance",
        "created_at",
        "updated_at",
    )
    search_fields = (
        "user__username",
        "user__email",
    )
    list_filter = (

    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "wallet",
        "transaction_type",
        "amount",
        "balance_after",
        "created_at",
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
    readonly_fields = (
        "created_at",
    )