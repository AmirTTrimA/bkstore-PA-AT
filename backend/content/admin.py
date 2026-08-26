from django.contrib import admin

from .models import License

@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "book",
        "order",
        "is_active",
        "valid_from",
        "valid_until",
        "is_currently_valid",
    )

    list_filter = (
        "is_active",
        "valid_from",
        "valid_until",
    )

    search_fields = (
        "user__username",
        "user__email",
        "book__title",
    )

    ordering = (
        "-valid_from",
    )

    autocomplete_fields = (
        "user",
        "book",
        "order",
    )

    list_select_related = (
        "user",
        "book",
        "order",
    )

    readonly_fields = (
        "user",
        "book",
        "order",
        "valid_from",
        "valid_until",
    )

    fieldsets = (
        (
            "License",
            {
                "fields": (
                    "user",
                    "book",
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