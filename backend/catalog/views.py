from django.db.models import Count, Q
from haystack.query import SearchQuerySet
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.filters import OrderingFilter
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import F

from .models import Author, Book
from .serializers import AuthorSerializer, BookDetailSerializer, BookListSerializer
from .pagination import BookPagination


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


# class BookViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     Handles GET operations for Books (List, Search, and Detail).
#     Maps to GET /api/v1/books/ and /api/v1/books/<id>/
#     """

#     queryset = Book.objects.all().select_related(
#         "author"
#     )  # Optimizes query by joining Author data
#     permission_classes = [AllowAny]

#     def get_serializer_class(self):
#         # Use the detailed serializer for single retrievals and list for collections
#         if self.action == "retrieve":
#             return BookDetailSerializer
#         return BookListSerializer

#     def get_queryset(self):
#         """
#         Custom queryset logic for simplified ORM search (Phase 1).
#         """
#         queryset = self.queryset
#         search_query = self.request.query_params.get("search", None)

#         if search_query:
#             # !!! PHASE 1 SIMPLE SEARCH: Use Django ORM's __icontains for case-insensitive lookup
#             queryset = queryset.filter(
#                 Q(title__icontains=search_query)
#                 | Q(author__name__icontains=search_query)
#                 | Q(isbn__icontains=search_query)
#             )

#         return queryset.order_by("-created_at")  # Order by most recently created


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles GET operations for Books (List, Search, and Detail).
    Maps to GET /api/v1/books/ and /api/v1/books/<id>/
    """

    # Start with the default queryset
    queryset = Book.objects.all().select_related("author")
    permission_classes = [AllowAny]
    pagination_class = BookPagination

    filter_backends = [OrderingFilter]

    ordering_fields = [
        "title",
        "created_at",
    ]

    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        return BookListSerializer

    def get_queryset(self):
        """
        Custom queryset logic: Uses PostgreSQL Full-Text Search for ranked results.

        Note: This temporarily replaces Solr until the external service is stable.
        """
        search_query_param = self.request.query_params.get("search", None)
        genre = self.request.query_params.get("genre")
        author = self.request.query_params.get("author")
        is_digital = self.request.query_params.get("is_digital")
        is_audio = self.request.query_params.get("is_audio")

        # 🔑 ANNOTATE QUERYSET: Add a SearchVector field to the queryset that combines relevant text fields.
        queryset = self.queryset.annotate(
            search=SearchVector("title", weight="A", config="english")
            + SearchVector("description", weight="B", config="english")
            + SearchVector("author__name", weight="B", config="english")
        )

        if genre:
            queryset = queryset.filter(genre=genre)

        if author:
            queryset = queryset.filter(author_id=author)

        if is_digital is not None:
            queryset = queryset.filter(
                is_digital=is_digital.lower() == "true"
            )

        if is_audio is not None:
            queryset = queryset.filter(
                is_audio=is_audio.lower() == "true"
            )

        if search_query_param:
            # Create the SearchQuery object from the user's input
            query = SearchQuery(search_query_param, config="english")

            # Filter the queryset using the SearchQuery, then apply ranking
            return (
                queryset.filter(search=query)
                .annotate(
                    # Calculate the ranking score based on the query and vector
                    rank=SearchRank(F("search"), query)
                )
                .order_by("-rank")
            )

        # Fallback: If no search query, return all books ordered by creation date
        return queryset.order_by("-created_at")
