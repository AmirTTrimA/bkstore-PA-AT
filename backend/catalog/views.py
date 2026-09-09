# catalog/views.py
from django.contrib.postgres.search import (SearchQuery, SearchRank,
                                            SearchVector)
from django.db.models import Count, F, Q
from haystack.query import SearchQuerySet
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Author, Book
from .pagination import BookPagination
from .serializers import (AuthorDetailSerializer, AuthorSerializer, BookDetailSerializer,
                          BookListSerializer, GenreSerializer)

TRUE_VALUES = {"true", "1", "yes"}

class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Handles GET operations for Authors (List and Detail).
    Maps to GET /api/v1/authors/ and /api/v1/authors/<id>/
    """

    queryset = Author.objects.all().order_by("name").annotate(
        books_count=Count("books")  # Count books for performance in get_books_count()
    )
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AuthorDetailSerializer
        return AuthorSerializer


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
    queryset = Book.objects.all().select_related("author", "creation_proposal__proposal__publisher")
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
        return self.get_filtered_queryset().order_by("-created_at").prefetch_related(
            "formats",
            "formats__prices",
        )
    
    def get_filtered_queryset(self):
        search_query_param = self.request.query_params.get("search", None)
        genre = self.request.query_params.get("genre")
        author = self.request.query_params.get("author")
        is_digital = self.request.query_params.get("is_digital")
        is_audio = self.request.query_params.get("is_audio")
        publisher = self.request.query_params.get("publisher")
        format_param = self.request.query_params.get("format") or self.request.query_params.get("book_format")
        language = self.request.query_params.get("language")

        queryset = self.queryset

        if language:
            queryset = queryset.filter(language=language.lower())

        if genre:
            queryset = queryset.filter(genre__iexact=genre)

        if author:
            queryset = queryset.filter(author_id=author)

        if publisher:
            if publisher.isdigit():
                queryset = queryset.filter(creation_proposal__proposal__publisher_id=int(publisher))
            else:
                queryset = queryset.filter(creation_proposal__proposal__publisher__slug=publisher)

        if format_param:
            queryset = queryset.filter(formats__format_type=format_param.upper(), formats__is_available=True).distinct()

        if is_digital is not None:
            queryset = queryset.filter(
            is_digital=is_digital.lower() in TRUE_VALUES
            )

        if is_audio is not None:
            queryset = queryset.filter(
                is_audio=is_audio.lower() in TRUE_VALUES
            )

        if search_query_param:
            from django.db import connection

            if connection.vendor == "postgresql":
                search_vector = (
                    SearchVector("title", weight="A", config="english")
                    + SearchVector("description", weight="B", config="english")
                    + SearchVector("author__name", weight="B", config="english")
                )
                query = SearchQuery(search_query_param, config="english")
                return (
                    queryset.annotate(search=search_vector)
                    .filter(search=query)
                    .annotate(rank=SearchRank(F("search"), query))
                    .order_by("-rank")
                )
            else:
                return queryset.filter(
                    Q(title__icontains=search_query_param)
                    | Q(description__icontains=search_query_param)
                    | Q(author__name__icontains=search_query_param)
                ).distinct().order_by("-created_at")

        # Fallback: If no search query, return all books ordered by creation date
        return queryset.order_by("-created_at")
    
    @action(detail=False, methods=["get"])
    def new(self, request):
        queryset = self.get_filtered_queryset().order_by("-created_at")

        return self.paginate_and_serialize(queryset)
    
    def paginate_and_serialize(self, queryset):
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="genres")
    def genres(self, request):
        genres = (
            Book.objects
            .values("genre")
            .annotate(count=Count("id"))
            .order_by("-count", "genre")
        )

        serializer = GenreSerializer(
            genres,
            many=True,
        )

        return Response({
            "results": serializer.data,
        })