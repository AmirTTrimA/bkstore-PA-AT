from django.urls import path
from .views import ForYouRecommendationsView, SimilarBooksView

app_name = "recommendations"

urlpatterns = [
    path("similar/<int:book_id>/", SimilarBooksView.as_view(), name="similar-books"),
    path("for-you/", ForYouRecommendationsView.as_view(), name="for-you-books"),
]
