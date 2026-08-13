from django.contrib import admin
from django.db.models import Count

from .models import Author, Book, BookFormat


@admin.register(BookFormat)
class BookFormatAdmin(admin.ModelAdmin):
    list_display = ("book", "format_type", "is_available")
    list_filter = ("format_type", "is_available")
    search_fields = ("book__title",)

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "book_count",
        "created_at",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(
                book_total=Count("books")
            )
        )

    @admin.display(
        ordering="book_total",
        description="Books",
    )
    def book_count(self, obj):
        return obj.book_total

    fieldsets = (
        (
            "Author Information",
            {
                "fields": (
                    "name",
                    "biography",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "author",
        "genre",
        "current_price",
        "is_digital",
        "is_audio",
        "created_at",
    )

    list_filter = (
        "genre",
        "is_digital",
        "is_audio",
        "author",
    )

    search_fields = (
        "title",
        "isbn",
        "author__name",
    )

    ordering = (
        "title",
    )

    autocomplete_fields = (
        "author",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    @admin.display(description="Current Price")
    def current_price(self, obj):

        if obj.current_price is None:
            return "-"

        return f"{obj.current_price.value} {obj.current_price.currency}"

    fieldsets = (
        (
            "Book Information",
            {
                "fields": (
                    "title",
                    "author",
                    "slug",
                    "isbn",
                    "genre",
                )
            },
        ),
        (
            "Description",
            {
                "fields": (
                    "description",
                    "cover_image_url",
                )
            },
        ),
        (
            "Formats",
            {
                "fields": (
                    "is_digital",
                    "is_audio",
                    "digital_file_path",
                    "audio_file_path",
                )
            },
        ),
        (
            "Audit",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    list_select_related = (
        "author",
    )

    prepopulated_fields = {
        "slug": ("title",),
    }