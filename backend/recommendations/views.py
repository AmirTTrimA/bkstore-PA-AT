from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import RecommendationEngine


class SimilarBooksView(APIView):
    """
    GET /api/v1/recommendations/similar/<int:book_id>/
    Returns top-N similar books with explainable match reasons based on:
    - Shared Thematic Tags
    - Shared Canonical Genres
    - Author Affinity
    - Content Tone & Target Age
    """

    permission_classes = [AllowAny]

    def get(self, request, book_id):
        limit = request.query_params.get("limit", 6)
        try:
            limit = int(limit)
            if limit < 1 or limit > 20:
                limit = 6
        except ValueError:
            limit = 6

        result = RecommendationEngine.get_similar_books(
            book_id=book_id,
            limit=limit,
            request=request,
        )

        if result is None:
            return Response(
                {"detail": f"Book with id {book_id} was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(result, status=status.HTTP_200_OK)


class ForYouRecommendationsView(APIView):
    """
    GET /api/v1/recommendations/for-you/
    Returns personalized recommendation feed for authenticated users
    (based on library licenses, preferences, and profile bio)
    or a curated cross-genre showcase for anonymous visitors.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        limit = request.query_params.get("limit", 8)
        try:
            limit = int(limit)
            if limit < 1 or limit > 24:
                limit = 8
        except ValueError:
            limit = 8

        language = request.query_params.get("language", None)

        user = request.user if request.user.is_authenticated else None

        result = RecommendationEngine.get_for_you_recommendations(
            user=user,
            limit=limit,
            language=language,
            request=request,
        )

        return Response(result, status=status.HTTP_200_OK)
