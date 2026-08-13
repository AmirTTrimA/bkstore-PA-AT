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
    
class CurrentPriceMixin(serializers.Serializer):
    """Provides the current active price for a book."""

    price = serializers.SerializerMethodField()

    def get_price(self, obj):
        current_price = obj.current_price
        return str(current_price.value) if current_price else None

class BookFormatSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="format_type", read_only=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = BookFormat
        fields = ("id", "type", "price")

    def get_price(self, obj):
        from pricing.services import PricingEngine

        result = PricingEngine(book_format=obj).calculate()
        return result.final_price


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