from django.contrib import admin
from payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "amount",
        "status",
        "authority",
        "ref_id",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
        "authority",
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