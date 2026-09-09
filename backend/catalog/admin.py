from django.contrib import admin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Author, Book, BookFormat, Genre, Tag
from pricing.models import Price


class BookFormatInline(admin.TabularInline):
    model = BookFormat
    extra = 0
    fields = ("format_type", "is_available")
    classes = ("collapse",)


class PriceInline(admin.TabularInline):
    model = Price
    extra = 0
    fields = ("book_format", "value", "min_price", "effective_from", "effective_until")
    ordering = ("-effective_from",)


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "normalized_name", "book_count", "created_at")
    search_fields = ("name", "slug", "normalized_name")
    prepopulated_fields = {"slug": ("name",)}

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(book_total=Count("books"))

    @admin.display(ordering="book_total", description=_("Books"))
    def book_count(self, obj):
        count = getattr(obj, "book_total", obj.books.count())
        return format_html('<span class="item-count-badge">{}</span>', count)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "normalized_name", "language_badge", "book_count", "created_at")
    search_fields = ("name", "normalized_name", "description")
    list_filter = ("language",)

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(book_total=Count("books"))

    @admin.display(description=_("Lang"))
    def language_badge(self, obj):
        pill_cls = "pill-fa" if obj.language == "fa" else "pill-en"
        return format_html('<span class="status-badge {}">{}</span>', pill_cls, obj.language.upper())

    @admin.display(ordering="book_total", description=_("Books"))
    def book_count(self, obj):
        count = getattr(obj, "book_total", obj.books.count())
        return format_html('<span class="item-count-badge">{}</span>', count)


@admin.register(BookFormat)
class BookFormatAdmin(admin.ModelAdmin):
    list_display = ("book", "format_badge", "is_available_badge", "price_display", "created_at")
    list_filter = ("format_type", "is_available")
    search_fields = ("book__title", "book__isbn")
    autocomplete_fields = ("book",)

    @admin.display(description=_("Format"))
    def format_badge(self, obj):
        colors = {
            "PHYSICAL": "status-info",
            "DIGITAL": "status-purple",
            "AUDIO": "status-warning",
        }
        cls = colors.get(obj.format_type, "status-neutral")
        return format_html('<span class="status-badge {}">{}</span>', cls, obj.get_format_type_display())

    @admin.display(description=_("Status"))
    def is_available_badge(self, obj):
        if obj.is_available:
            return format_html('<span class="status-badge status-success">✓ Available</span>')
        return format_html('<span class="status-badge status-danger">✗ Inactive</span>')

    @admin.display(description=_("Current Price"))
    def price_display(self, obj):
        price = obj.prices.order_by("-effective_from").first()
        if price:
            return format_html(
                '<span class="currency-tag">{:,.0f}<span class="irr-unit">IRR</span></span>',
                price.value,
            )
        return "-"


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = (
        "avatar_preview",
        "name",
        "primary_lang_badge",
        "book_count",
        "created_at",
    )
    list_display_links = ("avatar_preview", "name")
    search_fields = ("name", "normalized_name", "biography")
    list_filter = ("primary_language", "created_at")
    ordering = ("name",)
    readonly_fields = ("avatar_large_preview", "created_at", "updated_at")

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(book_total=Count("books"))

    @admin.display(description=_("Photo"))
    def avatar_preview(self, obj):
        if obj.avatar_url:
            return format_html(
                '<img src="{}" alt="{}" class="author-avatar-thumb" onerror="this.style.display=\'none\';" />',
                obj.avatar_url,
                obj.name,
            )
        return format_html('<span class="book-cover-placeholder" style="width:36px;height:36px;border-radius:50%;">👤</span>')

    @admin.display(description=_("Photo Preview"))
    def avatar_large_preview(self, obj):
        if obj.avatar_url:
            return format_html(
                '<img src="{}" alt="{}" style="max-height:140px;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.15);" />',
                obj.avatar_url,
                obj.name,
            )
        return _("No avatar URL configured.")

    @admin.display(description=_("Lang"))
    def primary_lang_badge(self, obj):
        pill_cls = "pill-fa" if obj.primary_language == "fa" else "pill-en"
        return format_html('<span class="status-badge {}">{}</span>', pill_cls, obj.primary_language.upper())

    @admin.display(ordering="book_total", description=_("Books"))
    def book_count(self, obj):
        count = getattr(obj, "book_total", obj.books.count())
        url = reverse("admin:catalog_book_changelist") + f"?author__id__exact={obj.id}"
        return format_html('<a href="{}" class="item-count-badge" title="View books">{} books</a>', url, count)

    fieldsets = (
        (
            _("Author Information"),
            {
                "fields": (
                    "name",
                    "normalized_name",
                    "primary_language",
                    "avatar_url",
                    "avatar_large_preview",
                    "biography",
                )
            },
        ),
        (
            _("Audit"),
            {
                "classes": ("collapse",),
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
        "cover_thumbnail",
        "title",
        "author",
        "language_badge",
        "display_genres",
        "formatted_price",
        "formats_badge",
        "semantic_status",
        "created_at",
    )
    list_display_links = ("cover_thumbnail", "title")

    list_filter = (
        "language",
        "genres",
        "genre",
        "is_digital",
        "is_audio",
        "author",
        "publication_year",
    )

    search_fields = (
        "title",
        "isbn",
        "author__name",
        "tags__name",
        "description",
    )

    ordering = ("-created_at",)
    autocomplete_fields = ("author",)
    filter_horizontal = ("genres", "tags")
    list_select_related = ("author",)
    prepopulated_fields = {"slug": ("title",)}
    inlines = [BookFormatInline, PriceInline]

    readonly_fields = (
        "cover_preview_large",
        "semantic_status_detail",
        "created_at",
        "updated_at",
    )

    @admin.display(description=_("Cover"))
    def cover_thumbnail(self, obj):
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" alt="{}" class="book-cover-thumb" onerror="this.style.display=\'none\';" />',
                obj.cover_image_url,
                obj.title,
            )
        return format_html('<span class="book-cover-placeholder">📖</span>')

    @admin.display(description=_("Cover Preview"))
    def cover_preview_large(self, obj):
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" alt="{}" style="max-height:220px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.2);" />',
                obj.cover_image_url,
                obj.title,
            )
        return _("No cover URL specified.")

    @admin.display(description=_("Lang"))
    def language_badge(self, obj):
        pill_cls = "pill-fa" if obj.language == "fa" else "pill-en"
        return format_html('<span class="status-badge {}">{}</span>', pill_cls, obj.language.upper())

    @admin.display(description=_("Genres"))
    def display_genres(self, obj):
        genre_list = [g.name for g in obj.genres.all()[:2]]
        if genre_list:
            text = ", ".join(genre_list)
            if obj.genres.count() > 2:
                text += f" (+{obj.genres.count() - 2})"
            return text
        return obj.get_genre_display()

    @admin.display(description=_("Active Price"))
    def formatted_price(self, obj):
        curr = obj.current_price
        if curr:
            return format_html(
                '<span class="currency-tag">{:,.0f}<span class="irr-unit">IRR</span></span>',
                curr.value,
            )
        return format_html('<span style="color:#94a3b8;">—</span>')

    @admin.display(description=_("Formats"))
    def formats_badge(self, obj):
        badges = []
        has_phys = obj.formats.filter(format_type=BookFormat.FormatType.PHYSICAL, is_available=True).exists()
        if has_phys:
            badges.append('<span class="status-badge status-info" title="Physical">Book</span>')
        if obj.is_digital:
            badges.append('<span class="status-badge status-purple" title="E-Book">EPUB</span>')
        if obj.is_audio:
            badges.append('<span class="status-badge status-warning" title="Audiobook">Audio</span>')
        if not badges:
            return format_html('<span style="color:#94a3b8;">None</span>')
        return format_html(" ".join(badges))

    @admin.display(description=_("Semantic AI"))
    def semantic_status(self, obj):
        if obj.is_semantically_eligible:
            return format_html('<span class="status-badge status-success" title="Eligible for English recommendations">✓ Eligible</span>')
        if obj.language != "en":
            return format_html('<span class="status-badge status-neutral" title="Excluded by language constraint (fa)">FA Excluded</span>')
        return format_html('<span class="status-badge status-warning" title="Incomplete metadata for recommendations">Incomplete</span>')

    @admin.display(description=_("Recommendation Invariants"))
    def semantic_status_detail(self, obj):
        eligible = obj.is_semantically_eligible
        status_text = "ELIGIBLE (Included in offline similarity index)" if eligible else "EXCLUDED"
        color = "#15803d" if eligible else "#b45309"
        reasons = []
        if obj.language != "en":
            reasons.append(f"Language is '{obj.language}' (only 'en' is indexed in Phase 3).")
        if not obj.description:
            reasons.append("Description is empty.")
        if not obj.genres.exists():
            reasons.append("No genres assigned.")
        if not reasons:
            reasons.append("Meets all canonical semantic constraints.")

        return format_html(
            '<div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid {};">'
            '<strong style="color:{};">{}</strong><ul style="margin:6px 0 0 16px;padding:0;">{}</ul></div>',
            color,
            color,
            status_text,
            "".join(f"<li>{r}</li>" for r in reasons),
        )

    fieldsets = (
        (
            _("Core Identification"),
            {
                "fields": (
                    "title",
                    "slug",
                    "author",
                    "isbn",
                    "language",
                    "publication_year",
                    "edition",
                )
            },
        ),
        (
            _("Taxonomy & Semantic Signals"),
            {
                "description": _("Controlled categories and fine-grained thematic signals for discovery and recommendations."),
                "fields": (
                    "genre",
                    "genres",
                    "tags",
                    "semantic_status_detail",
                ),
            },
        ),
        (
            _("Synopsis & Cover"),
            {
                "fields": (
                    "cover_image_url",
                    "cover_preview_large",
                    "description",
                ),
            },
        ),
        (
            _("Digital & Audio Assets"),
            {
                "fields": (
                    ("is_digital", "digital_file_path"),
                    ("is_audio", "audio_file_path"),
                ),
            },
        ),
        (
            _("Audit"),
            {
                "classes": ("collapse",),
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )