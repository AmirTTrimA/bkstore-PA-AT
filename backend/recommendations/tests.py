from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Author, Book, Genre, Tag
from recommendations.services import RecommendationEngine

User = get_user_model()


class RecommendationEngineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.author = Author.objects.create(name="George Orwell", normalized_name="george orwell")
        self.author2 = Author.objects.create(name="Aldous Huxley", normalized_name="aldous huxley")

        self.genre_scifi = Genre.objects.create(name="Science Fiction", slug="sci-fi", normalized_name="science fiction")
        self.genre_fiction = Genre.objects.create(name="Fiction", slug="fiction", normalized_name="fiction")

        self.tag_dystopia = Tag.objects.create(name="Dystopia", normalized_name="dystopia", language="en")
        self.tag_surveillance = Tag.objects.create(name="Surveillance", normalized_name="surveillance", language="en")
        self.tag_tech = Tag.objects.create(name="Technology", normalized_name="technology", language="en")

        self.book1 = Book.objects.create(
            title="1984",
            slug="1984",
            isbn="9780451524935",
            author=self.author,
            description="Classic dystopian novel about Big Brother and surveillance.",
            genre="SCI_FI",
            language="en",
            content_tone="dystopian",
            target_age_group="adult",
        )
        self.book1.genres.add(self.genre_scifi, self.genre_fiction)
        self.book1.tags.add(self.tag_dystopia, self.tag_surveillance)

        self.book2 = Book.objects.create(
            title="Brave New World",
            slug="brave-new-world",
            isbn="9780060850524",
            author=self.author2,
            description="Futuristic dystopian World State.",
            genre="SCI_FI",
            language="en",
            content_tone="dystopian",
            target_age_group="adult",
        )
        self.book2.genres.add(self.genre_scifi)
        self.book2.tags.add(self.tag_dystopia, self.tag_tech)

        self.book3 = Book.objects.create(
            title="Animal Farm",
            slug="animal-farm",
            isbn="9780451526342",
            author=self.author,
            description="Political satire and revolution on a farm.",
            genre="FICTION",
            language="en",
            content_tone="dystopian",
            target_age_group="adult",
        )
        self.book3.genres.add(self.genre_fiction)

    def test_similar_books_engine_returns_scored_matches(self):
        result = RecommendationEngine.get_similar_books(self.book1.id, limit=5)
        self.assertIsNotNone(result)
        self.assertEqual(result["target_book"]["id"], self.book1.id)
        self.assertTrue(len(result["recommendations"]) >= 2)

        # Brave New World shares genre sci-fi + tag dystopia + dystopian tone
        recs = result["recommendations"]
        rec_ids = [r["id"] for r in recs]
        self.assertIn(self.book2.id, rec_ids)
        self.assertIn(self.book3.id, rec_ids)

        # Top item should have similarity score and match reasons
        top_rec = recs[0]
        self.assertIn("similarity_score", top_rec)
        self.assertIn("match_reasons", top_rec)
        self.assertTrue(len(top_rec["match_reasons"]) > 0)

    def test_similar_books_api_endpoint(self):
        url = reverse("recommendations:similar-books", kwargs={"book_id": self.book1.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("target_book", response.data)
        self.assertIn("recommendations", response.data)

    def test_similar_books_non_existent_id(self):
        url = reverse("recommendations:similar-books", kwargs={"book_id": 999999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_for_you_anonymous_returns_curated(self):
        url = reverse("recommendations:for-you-books")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["personalized"])
        self.assertTrue(len(response.data["recommendations"]) > 0)

    def test_for_you_authenticated_user_with_interests(self):
        user = User.objects.create_user(
            username="techuser",
            email="tech@example.com",
            password="Password123!",
            job_or_major="Software Engineer",
            hobbies_or_likings="Artificial Intelligence and Technology",
        )
        self.client.force_authenticate(user=user)
        url = reverse("recommendations:for-you-books")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["personalized"])
