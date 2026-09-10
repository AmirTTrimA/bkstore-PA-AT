from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Author, Book, BookFormat, Genre, Tag


class GenreModelSerializer(serializers.ModelSerializer):
    """Serializer for the controlled Genre taxonomy model."""

    class Meta:
        model = Genre
        fields = ("id", "name", "slug", "description")


class TagModelSerializer(serializers.ModelSerializer):
    """Serializer for the fine-grained Tag taxonomy model."""

    class Meta:
        model = Tag
        fields = ("id", "name", "normalized_name", "description", "language")


class AuthorSerializer(serializers.ModelSerializer):
    """Serializer for Author detail and list views."""

    # We add a summary field for list view, which will be the first 100 characters of the bio
    bio_summary = serializers.SerializerMethodField()

    # We will compute the book count in the detail view
    books_count = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = (
            "id",
            "name",
            "normalized_name",
            "primary_language",
            "avatar_url",
            "biography",
            "bio_summary",
            "created_at",
            "books_count",
        )

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
    price_format = serializers.SerializerMethodField()
    price_format_name = serializers.SerializerMethodField()
    has_any_discount = serializers.SerializerMethodField()
    max_discount_percent = serializers.SerializerMethodField()

    def _get_all_format_pricings(self, obj):
        if not hasattr(obj, "_cached_all_format_pricings"):
            from pricing.services import PricingEngine

            request = self.context.get("request")
            user = request.user if request and request.user.is_authenticated else None

            pricings = []
            if hasattr(obj, "formats"):
                for fmt in obj.formats.filter(is_available=True):
                    try:
                        engine = PricingEngine(book=obj, book_format=fmt, user=user)
                        calc = engine.calculate()
                        if calc:
                            pricings.append((fmt, calc))
                    except Exception:
                        pass
            obj._cached_all_format_pricings = pricings
        return obj._cached_all_format_pricings

    def _get_book_pricing(self, obj):
        if not hasattr(obj, "_cached_book_pricing"):
            pricings = self._get_all_format_pricings(obj)
            if pricings:
                # Select the format with lowest final price (best starting entry price)
                best_fmt, best_calc = min(pricings, key=lambda x: x[1].final_price)
                obj._cached_book_pricing = best_calc
                obj._cached_primary_format = best_fmt
            else:
                from pricing.services import PricingEngine
                request = self.context.get("request")
                user = request.user if request and request.user.is_authenticated else None
                try:
                    engine = PricingEngine(book=obj, user=user)
                    obj._cached_book_pricing = engine.calculate()
                    obj._cached_primary_format = None
                except Exception:
                    obj._cached_book_pricing = None
                    obj._cached_primary_format = None
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

    def get_price_format(self, obj):
        self._get_book_pricing(obj)
        fmt = getattr(obj, "_cached_primary_format", None)
        return fmt.format_type if fmt else None

    def get_price_format_name(self, obj):
        self._get_book_pricing(obj)
        fmt = getattr(obj, "_cached_primary_format", None)
        return fmt.get_format_type_display() if fmt else None

    def get_has_any_discount(self, obj):
        pricings = self._get_all_format_pricings(obj)
        return any(calc.final_price < calc.base_price for _, calc in pricings)

    def get_max_discount_percent(self, obj):
        pricings = self._get_all_format_pricings(obj)
        discounts = [
            int(round((calc.base_price - calc.final_price) / calc.base_price * 100))
            for _, calc in pricings
            if calc.final_price < calc.base_price and calc.base_price > 0
        ]
        return max(discounts) if discounts else 0


class BookFormatSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="format_type", read_only=True)
    format = serializers.CharField(source="format_type", read_only=True)
    format_name = serializers.CharField(source="get_format_type_display", read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()

    class Meta:
        model = BookFormat
        fields = (
            "id",
            "type",
            "format",
            "format_name",
            "is_available",
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
    language = serializers.CharField(read_only=True)
    target_age_group = serializers.CharField(read_only=True)
    content_tone = serializers.CharField(read_only=True)
    formats = BookFormatSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "slug",
            "author_name",
            "cover_image_url",
            "language",
            "target_age_group",
            "content_tone",
            "formats",
            "price",
            "original_price",
            "discount_percent",
            "has_discount",
            "price_format",
            "price_format_name",
            "has_any_discount",
            "max_discount_percent",
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
    genres = GenreModelSerializer(many=True, read_only=True)
    tags = TagModelSerializer(many=True, read_only=True)
    publication_year = serializers.IntegerField(read_only=True)
    edition = serializers.CharField(read_only=True)
    is_semantically_eligible = serializers.BooleanField(read_only=True)
    publisher_id = serializers.SerializerMethodField()
    publisher_name = serializers.SerializerMethodField()
    publisher_slug = serializers.SerializerMethodField()

    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + (
            "author_id",
            "isbn",
            "description",
            "genre",
            "genres",
            "tags",
            "publication_year",
            "edition",
            "is_semantically_eligible",
            "publisher_id",
            "publisher_name",
            "publisher_slug",
        )

    def get_publisher_id(self, obj):
        proposal = getattr(obj, "creation_proposal", None)
        if proposal and proposal.proposal_id:
            return proposal.proposal.publisher_id
        return None

    def get_publisher_name(self, obj):
        proposal = getattr(obj, "creation_proposal", None)
        if proposal and proposal.proposal_id and proposal.proposal.publisher:
            return proposal.proposal.publisher.name
        return None

    def get_publisher_slug(self, obj):
        proposal = getattr(obj, "creation_proposal", None)
        if proposal and proposal.proposal_id and proposal.proposal.publisher:
            return proposal.proposal.publisher.slug
        return None


class AuthorDetailSerializer(AuthorSerializer):
    """Serializer for Author detail view, nesting all books by this author."""

    books = serializers.SerializerMethodField()

    class Meta(AuthorSerializer.Meta):
        fields = AuthorSerializer.Meta.fields + ("books",)

    def get_books(self, obj):
        books_qs = obj.books.all().prefetch_related("formats", "formats__prices")
        return BookListSerializer(books_qs, many=True, context=self.context).data