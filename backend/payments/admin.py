from django.contrib import admin
from payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "amount",
        "status",
        "gateway_token",
        "res_num",
        "ref_id",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "gateway_token",
        "ref_id",
    )

    list_filter = (
        "status",
        "created_at",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )