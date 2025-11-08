from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils.translation import gettext_lazy as _
from .models import Author, Book

# ----------------------------------------------------------------------
# 🎯 CATALOG APPLICATION TEST SUITE
# ----------------------------------------------------------------------

"""
This suite verifies the functionality of the public Catalog APIs for Phase 1 (MVP).

GOAL: Ensure the backend correctly exposes book and author data to the frontend.

KEY TESTS COVERED:
1. Data Retrieval: Listing all books and authors works (HTTP 200 OK).
2. Detail Views: Retrieving individual book/author pages works and includes required fields.
3. Serialization: Serializers correctly format the data
4. Simple Search: The Django ORM filter correctly handles keyword searches by title and author name.
"""


class CatalogAPITestCase(APITestCase):
    """
    Tests for the public API endpoints in the Catalog app (Books and Authors).
    Phase 1 Goal: Verify listing, detail retrieval, and simple search functionality.
    """

    def setUp(self):
        """Set up test data that will be automatically cleaned up after tests run."""

        # 1. Create Authors
        self.author_adams = Author.objects.create(
            name="Douglas Adams",
            biography="Known for The Hitchhiker's Guide to the Galaxy.",
        )
        self.author_austen = Author.objects.create(
            name="Jane Austen",
            biography="Known for her six major novels, which interpret, critique and comment upon the British landed gentry.",
        )

        # 2. Create Books
        self.book_hitchhiker = Book.objects.create(
            author=self.author_adams,
            title="The Hitchhiker's Guide to the Galaxy",
            slug="the-hitchhikers-guide-to-the-galaxy",
            isbn="978-0345391803",
            description="A comedic science fiction classic.",
            cover_image_url="http://example.com/hitchhiker.jpg",
            genre="SCI_FI",
            is_digital=True,
            is_audio=False,
        )
        self.book_pride = Book.objects.create(
            author=self.author_austen,
            title="Pride and Prejudice",
            slug="pride-and-prejudice",
            isbn="978-0141439518",
            description="A novel of manners, published in 1813.",
            cover_image_url="http://example.com/pride.jpg",
            genre="FICTION",
            is_digital=False,
            is_audio=True,
        )

        # 3. Define URL names (Using reverse ensures correct URL mapping)
        self.books_url = reverse("book-list")
        self.authors_url = reverse("author-list")
        self.book_detail_url = reverse(
            "book-detail", kwargs={"pk": self.book_hitchhiker.pk}
        )
        self.author_detail_url = reverse(
            "author-detail", kwargs={"pk": self.author_adams.pk}
        )

    def test_book_list_retrieval(self):
        """Test the list endpoint returns correct status code and number of books."""
        response = self.client.get(self.books_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that both books are returned
        self.assertEqual(len(response.data), 2)

        # Check serialization fields (including MOCK PRICE)
        self.assertIn("price", response.data[0])
        self.assertEqual(
            response.data[0]["price"], "19.99"
        )  # Verifies Mock Price is present

    def test_book_detail_retrieval(self):
        """Test the detail endpoint returns correct fields and status."""
        response = self.client.get(self.book_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the book's specific data
        self.assertEqual(response.data["title"], "The Hitchhiker's Guide to the Galaxy")

        # Check the nested author ID and other detailed fields
        self.assertEqual(response.data["author_id"], self.author_adams.pk)
        self.assertIn("isbn", response.data)
        self.assertIn("description", response.data)
        self.assertEqual(response.data["price"], "19.99")  # MOCK PRICE verification

    def test_book_search_by_title(self):
        """Test the simplified ORM search for books by title keyword."""
        response = self.client.get(self.books_url, {"search": "Pride"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return one match (Pride and Prejudice)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Pride and Prejudice")

    def test_book_search_by_author_name(self):
        """Test the simplified ORM search for books by author name keyword."""
        response = self.client.get(self.books_url, {"search": "Adams"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return one match (Douglas Adams)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["title"], "The Hitchhiker's Guide to the Galaxy"
        )

    def test_author_detail_retrieval(self):
        """Test the detail endpoint for Author returns correct fields."""
        response = self.client.get(self.author_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the book count field
        self.assertEqual(response.data["name"], "Douglas Adams")
        self.assertEqual(
            response.data["books_count"], 1
        )  # Douglas Adams wrote 1 book in setUp

    def test_author_list_retrieval(self):
        """Test the author list retrieval and summary field."""
        response = self.client.get(self.authors_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check that bio_summary is generated
        self.assertIn("bio_summary", response.data[0])
