from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count
from .models import Author, Book
from .serializers import AuthorSerializer, BookListSerializer, BookDetailSerializer


class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles GET operations for Authors (List and Detail).
    Maps to GET /api/v1/authors/ and /api/v1/authors/<id>/
    """

    queryset = Author.objects.all().annotate(
        books_count=Count("book")  # Count books for performance in get_books_count()
    )
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        # Use a simpler serializer for listing, and the detail serializer for single retrieval
        if self.action == "list":
            return AuthorSerializer
        return AuthorSerializer  # Both use the same serializer for now


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles GET operations for Books (List, Search, and Detail).
    Maps to GET /api/v1/books/ and /api/v1/books/<id>/
    """

    queryset = Book.objects.all().select_related(
        "author"
    )  # Optimizes query by joining Author data
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        # Use the detailed serializer for single retrievals and list for collections
        if self.action == "retrieve":
            return BookDetailSerializer
        return BookListSerializer

    def get_queryset(self):
        """
        Custom queryset logic for simplified ORM search (Phase 1).
        """
        queryset = self.queryset
        search_query = self.request.query_params.get("search", None)

        if search_query:
            # !!! PHASE 1 SIMPLE SEARCH: Use Django ORM's __icontains for case-insensitive lookup
            queryset = queryset.filter(
                Q(title__icontains=search_query)
                | Q(author__name__icontains=search_query)
                | Q(isbn__icontains=search_query)
            )

        return queryset.order_by("-created_at")  # Order by most recently created
