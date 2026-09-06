from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Author, Book, BookFormat


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for Author detail and list views."""

    # We add a summary field for list view, which will be the first 100 characters of the bio
    bio_summary = serializers.SerializerMethodField()

    # We will compute the book count in the detail view
    books_count = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ("id", "name", "biography", "bio_summary", "created_at", "books_count")

    def get_bio_summary(self, obj):
        """Returns a summary of the biography for list views."""
        if obj.biography:
            return obj.biography[:100] + ("..." if len(obj.biography) > 100 else "")
        return ""

    def get_books_count(self, obj):
        """Returns the total number of books by this author."""
        return obj.books.count()

class GenreSerializer(serializers.Serializer):
    value = serializers.CharField(source="genre")
    label = serializers.SerializerMethodField()
    count = serializers.IntegerField()

    GENRE_LABELS = {
        "SCI_FI": "Science Fiction",
    }

    def get_label(self, obj):
        genre = obj["genre"]

        return self.GENRE_LABELS.get(
            genre,
            genre.replace("_", " ").title(),
        )


class CurrentPriceMixin(serializers.Serializer):
    """Provides the current active price and discount information for a book."""

    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()

    def _get_book_pricing(self, obj):
        if not hasattr(obj, "_cached_book_pricing"):
            from pricing.services import PricingEngine

            request = self.context.get("request")
            user = request.user if request and request.user.is_authenticated else None

            primary_format = None
            if hasattr(obj, "formats"):
                primary_format = obj.formats.filter(is_available=True).first()

            try:
                engine = PricingEngine(book=obj, book_format=primary_format, user=user)
                obj._cached_book_pricing = engine.calculate()
            except Exception:
                obj._cached_book_pricing = None
        return obj._cached_book_pricing

    def get_price(self, obj):
        res = self._get_book_pricing(obj)
        if res:
            return str(int(round(res.final_price)))
        current_price = obj.current_price
        return str(current_price.value) if current_price else None

    def get_original_price(self, obj):
        res = self._get_book_pricing(obj)
        if res:
            return str(int(round(res.base_price)))
        current_price = obj.current_price
        return str(current_price.value) if current_price else None

    def get_discount_percent(self, obj):
        res = self._get_book_pricing(obj)
        if res and res.final_price < res.base_price and res.base_price > 0:
            return int(round((res.base_price - res.final_price) / res.base_price * 100))
        return 0

    def get_has_discount(self, obj):
        res = self._get_book_pricing(obj)
        return bool(res and res.final_price < res.base_price)


class BookFormatSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="format_type", read_only=True)
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()

    class Meta:
        model = BookFormat
        fields = (
            "id",
            "type",
            "price",
            "original_price",
            "discount_percent",
            "has_discount",
        )

    def _get_pricing(self, obj):
        if not hasattr(obj, "_cached_pricing"):
            from pricing.services import PricingEngine

            request = self.context.get("request")
            user = request.user if request and request.user.is_authenticated else None
            try:
                engine = PricingEngine(book_format=obj, user=user)
                obj._cached_pricing = engine.calculate()
            except Exception:
                obj._cached_pricing = None
        return obj._cached_pricing

    def get_price(self, obj):
        res = self._get_pricing(obj)
        if res:
            return str(int(round(res.final_price)))
        from pricing.services import PricingEngine

        price = PricingEngine(book_format=obj).get_current_price()
        return str(price.value) if price else None

    def get_original_price(self, obj):
        res = self._get_pricing(obj)
        if res:
            return str(int(round(res.base_price)))
        from pricing.services import PricingEngine

        price = PricingEngine(book_format=obj).get_current_price()
        return str(price.value) if price else None

    def get_discount_percent(self, obj):
        res = self._get_pricing(obj)
        if res and res.final_price < res.base_price and res.base_price > 0:
            return int(round((res.base_price - res.final_price) / res.base_price * 100))
        return 0

    def get_has_discount(self, obj):
        res = self._get_pricing(obj)
        return bool(res and res.final_price < res.base_price)


class BookListSerializer(CurrentPriceMixin, serializers.ModelSerializer):
    """Serializer for the public Book list and search results."""

    author_name = serializers.CharField(source="author.name")

    formats = BookFormatSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "slug",
            "author_name",
            "cover_image_url",
            "formats",
            "price",
            "original_price",
            "discount_percent",
            "has_discount",
        )


class BookDetailSerializer(BookListSerializer):
    """Serializer for the single Book detail view."""

    # We inherit list fields and add detailed ones
    author_id = serializers.PrimaryKeyRelatedField(source="author", read_only=True)
    isbn = serializers.CharField()
    description = serializers.CharField()
    genre = serializers.CharField(
        source="get_genre_display"
    )  # Gets the human-readable genre name

    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + (
            "author_id",
            "isbn",
            "description",
            "genre",
        )