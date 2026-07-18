# catalog/tests.py
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Author, Book

# ----------------------------------------------------------------------
# 🎯 CATALOG APPLICATION TEST SUITE
# ----------------------------------------------------------------------

"""
This suite verifies the functionality of the public Catalog APIs.

GOAL:
Ensure the backend correctly exposes book and author data through the public API.

KEY TESTS COVERED:
1. Book and author listing.
2. Book and author detail retrieval.
3. Serializer output.
4. PostgreSQL full-text search.
5. Pagination.
6. Ordering.
7. Filtering.
8. Collection endpoints.
"""


class CatalogAPITestCase(APITestCase):
    """
    Tests for the public Catalog API endpoints (Books and Authors).
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
        self.book_restaurant = Book.objects.create(
            author=self.author_adams,
            title="The Restaurant at the End of the Universe",
            slug="restaurant-at-the-end-of-the-universe",
            isbn="978-0345418920",
            description="The sequel to Hitchhiker's Guide.",
            cover_image_url="http://example.com/restaurant.jpg",
            genre="SCI_FI",
            is_digital=False,
            is_audio=True,
        )
        self.book_dirk = Book.objects.create(
            author=self.author_adams,
            title="Dirk Gently's Holistic Detective Agency",
            slug="dirk-gently",
            isbn="978-0671746728",
            description="A humorous detective novel.",
            cover_image_url="http://example.com/dirk.jpg",
            genre="MYSTERY",
            is_digital=True,
            is_audio=True,
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
        self.book_emma = Book.objects.create(
            author=self.author_austen,
            title="Emma",
            slug="emma",
            isbn="978-0141439587",
            description="Another classic novel.",
            cover_image_url="http://example.com/emma.jpg",
            genre="FICTION",
            is_digital=True,
            is_audio=False,
        )

        # 3. Define URL names (Using reverse ensures correct URL mapping)
        self.books_url = reverse("book-list")
        self.new_books_url = reverse("book-new")
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
        self.assertEqual(response.data["count"], 5)
        self.assertEqual(len(response.data["results"]), 5)

        self.assertIn("price", response.data["results"][0])

        self.assertEqual(
            response.data["results"][0]["price"],
            "19.99",
        )

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
        """Test PostgreSQL full-text search by title."""
        response = self.client.get(self.books_url, {"search": "Pride"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return one match (Pride and Prejudice)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Pride and Prejudice")

    def test_book_search_by_author_name(self):
        """Test PostgreSQL full-text search by author name."""
        response = self.client.get(self.books_url, {"search": "Adams"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return one match (Douglas Adams)
        self.assertEqual(len(response.data["results"]), 3)
        titles = {book["title"] for book in response.data["results"]}

        self.assertSetEqual(
            titles,
            {
                "The Hitchhiker's Guide to the Galaxy",
                "The Restaurant at the End of the Universe",
                "Dirk Gently's Holistic Detective Agency",
            },
        )

    def test_author_detail_retrieval(self):
        """Test the detail endpoint for Author returns correct fields."""
        response = self.client.get(self.author_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check the book count field
        self.assertEqual(response.data["name"], "Douglas Adams")
        self.assertEqual(
            response.data["books_count"], 3
        )  # Douglas Adams wrote 1 book in setUp

    def test_author_list_retrieval(self):
        """Test the author list retrieval and summary field."""

        response = self.client.get(self.authors_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)

        # Check that bio_summary is generated
        self.assertIn("bio_summary", response.data["results"][0])

    def test_book_list_is_paginated(self):
        """Test that the book list endpoint returns a paginated response."""
        
        response = self.client.get(self.books_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Pagination keys should exist
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        self.assertIn("results", response.data)

        # We created 5 books
        self.assertEqual(response.data["count"], 5)

    def test_book_ordering_by_title(self):
        """Books should be ordered alphabetically by title."""

        response = self.client.get(
            self.books_url,
            {"ordering": "title"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        books = response.data["results"]

        self.assertEqual(
            books[0]["title"],
            "Dirk Gently's Holistic Detective Agency"
        )

        self.assertEqual(
            books[1]["title"],
            "Emma"
        )

        self.assertEqual(
            books[2]["title"],
            "Pride and Prejudice"
        )

    def test_filter_books_by_genre(self):
        """Test filtering books by genre."""

        response = self.client.get(
            self.books_url,
            {"genre": "SCI_FI"}
        )

        books = response.data["results"]

        self.assertEqual(response.data["count"], 2)

        titles = {book["title"] for book in books}

        self.assertSetEqual(
            titles,
            {
                "The Hitchhiker's Guide to the Galaxy",
                "The Restaurant at the End of the Universe",
            },
        )

    def test_filter_books_by_digital(self):
        """Test filtering only digital books."""

        response = self.client.get(
            self.books_url,
            {"is_digital": "true"},
        )

        books = response.data["results"]

        self.assertEqual(response.data["count"], 3)

        titles = {book["title"] for book in books}

        self.assertSetEqual(
            titles,
            {
                "The Hitchhiker's Guide to the Galaxy",
                "Dirk Gently's Holistic Detective Agency",
                "Emma",
            },
        )
    
    def test_filter_books_by_audio(self):
        """Test filtering only audiobooks."""

        response = self.client.get(
            self.books_url,
            {"is_audio": "true"},
        )

        books = response.data["results"]

        self.assertEqual(response.data["count"], 3)

        titles = {book["title"] for book in books}

        self.assertSetEqual(
            titles,
            {
                "The Restaurant at the End of the Universe",
                "Dirk Gently's Holistic Detective Agency",
                "Pride and Prejudice",
            },
        )

    def test_filter_books_by_multiple_parameters(self):
        """Test combining multiple query filters."""

        response = self.client.get(
            self.books_url,
            {
                "genre": "SCI_FI",
                "is_audio": "true",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        books = response.data["results"]

        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(books), 1)

        self.assertEqual(
            books[0]["title"],
            "The Restaurant at the End of the Universe",
        )
    
    def test_filter_books_by_author(self):
        """Test filtering books by author."""

        response = self.client.get(
            self.books_url,
            {"author": self.author_adams.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        books = response.data["results"]

        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(books), 3)

        titles = {book["title"] for book in books}

        self.assertSetEqual(
            titles,
            {
                "The Hitchhiker's Guide to the Galaxy",
                "The Restaurant at the End of the Universe",
                "Dirk Gently's Holistic Detective Agency",
            },
        )
    
    def test_new_books_endpoint(self):
        """Test the new books collection endpoint."""

        response = self.client.get(self.new_books_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 5)

        books = response.data["results"]

        # Emma was created last in setUp()
        self.assertEqual(books[0]["title"], "Emma")
    
    def test_new_books_endpoint_with_filter(self):
        """Test filtering the new books endpoint."""

        response = self.client.get(
            self.new_books_url,
            {"genre": "FICTION"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        books = response.data["results"]

        self.assertEqual(response.data["count"], 2)

        self.assertEqual(books[0]["title"], "Emma")
        self.assertEqual(books[1]["title"], "Pride and Prejudice")


# from catalog.models import Author, Book
# from django.core import management
# from django.urls import reverse
# from rest_framework import status
# from rest_framework.test import APITestCase


# class SolrSearchTest(APITestCase):
#     """
#     Tests to verify that the BookViewSet successfully uses Haystack/Solr
#     for search queries, demonstrating that the ORM filter has been superseded.
#     """

#     @classmethod
#     def setUpTestData(cls):
#         """
#         Set up data and populate the search index once for all tests.
#         This ensures search is tested against a clean, pre-indexed dataset.
#         """
#         # 1. Create Authors
#         cls.author_adams = Author.objects.create(
#             name="Douglas Adams", biography="Sci-Fi Humorist"
#         )
#         cls.author_mystery = Author.objects.create(
#             name="Agatha Christie", biography="Queen of Mystery"
#         )

#         # 2. Create Books with unique search terms and genres
#         cls.book_hitchhiker = Book.objects.create(
#             author=cls.author_adams,
#             title="The Hitchhiker's Guide to the Galaxy",
#             slug="hitchhikers-guide",
#             isbn="978-1000000001",
#             description="A crucial book exploring the theme of existential survival.",
#             genre="SCI_FI",
#             is_digital=True,
#             is_audio=False,
#         )
#         cls.book_murder = Book.objects.create(
#             author=cls.author_mystery,
#             title="Murder on the Orient Express",
#             slug="orient-express",
#             isbn="978-2000000002",
#             description="A classic puzzle involving a detective on a train.",
#             genre="MYSTERY",
#             is_digital=False,
#             is_audio=True,
#         )
#         cls.book_long = Book.objects.create(
#             author=cls.author_adams,
#             title="The Long Dark Tea-Time of the Soul",
#             slug="long-dark-tea",
#             isbn="978-3000000003",
#             description="A modern classic about divine conflict.",
#             genre="FICTION",
#             is_digital=True,
#             is_audio=False,
#         )

#         # 3. 🔑 CRITICAL STEP: Rebuild the index in the test database
#         management.call_command("rebuild_index", interactive=False, verbosity=0)

#         cls.books_url = reverse("book-list")

#     # --- Test Cases ---

#     def test_01_search_by_single_keyword(self):
#         """Tests search functionality by matching a unique keyword in the description."""
#         response = self.client.get(self.books_url, {"search": "existential"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 1)
#         self.assertEqual(
#             response.data[0]["title"], "The Hitchhiker's Guide to the Galaxy"
#         )

#     def test_02_search_by_author_name(self):
#         """Tests search functionality by matching the author's name."""
#         response = self.client.get(self.books_url, {"search": "Christie"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 1)
#         self.assertEqual(response.data[0]["title"], "Murder on the Orient Express")

#     def test_03_search_returns_multiple_results(self):
#         """Tests a common keyword returns multiple relevant books (Douglas)."""
#         response = self.client.get(self.books_url, {"search": "Douglas"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         # Should return 'Hitchhiker' and 'Long Dark'
#         self.assertEqual(len(response.data), 2)

#     def test_04_fallback_to_all_books(self):
#         """Tests that without a search query, all books are returned."""
#         response = self.client.get(self.books_url)
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         # Should return all 3 books created in setUp
#         self.assertEqual(len(response.data), 3)

#     def test_05_no_results_found(self):
#         """Tests that a non-existent search term returns an empty list."""
#         response = self.client.get(self.books_url, {"search": "quantum mechanics"})
#         self.assertEqual(response.status_code, status.HTTP_200_OK)
#         self.assertEqual(len(response.data), 0)
