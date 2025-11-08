from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Author, Book


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
        return obj.book_set.count()


class BookListSerializer(serializers.ModelSerializer):
    """Serializer for the public Book list and Search results."""

    # Nested fields required by the API contract
    author_name = serializers.CharField(source="author.name")

    # MOCK PRICE FIELD for Phase 1 (We will replace this method in Phase 2)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ("id", "title", "slug", "author_name", "cover_image_url", "price")

    def get_price(self, obj):
        """Returns a fixed mock price for MVP testing."""
        # !!! PHASE 1 MOCK DATA: Returns a hardcoded value.
        # This will be replaced with logic querying the pricing_price model in Phase 2.
        return "19.99"


class BookDetailSerializer(BookListSerializer):
    """Serializer for the single Book detail view."""

    # We inherit list fields and add detailed ones
    author_id = serializers.PrimaryKeyRelatedField(source="author", read_only=True)
    isbn = serializers.CharField()
    description = serializers.CharField(source="description")
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
