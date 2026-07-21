from datetime import timedelta
from decimal import Decimal

from accounts.models import User
from catalog.models import Author, Book
from catalog.serializers import BookListSerializer
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from pricing.models import Price
from rest_framework import status
from rest_framework.test import APITestCase


class PricingBaseTestCase(TestCase):
    """Shared fixtures for pricing tests."""

    def setUp(self):
        self.author = Author.objects.create(
            name="Douglas Adams",
            biography="Author of The Hitchhiker's Guide to the Galaxy."
        )

        self.book = Book.objects.create(
            author=self.author,
            title="The Hitchhiker's Guide to the Galaxy",
            slug="the-hitchhikers-guide-to-the-galaxy",
            isbn="9780345391803",
            description="Don't Panic.",
            genre="SCI_FI",
            is_digital=True,
            is_audio=False,
        )


class PricingTestCase(PricingBaseTestCase):
    """Tests for the Book current_price helper and serializer integration."""

    def test_current_price_returns_active_price(self):
        """Book.current_price returns the active price."""

        Price.objects.create(
            book=self.book,
            value=Decimal("19.99"),
            effective_from=timezone.now() - timedelta(days=1),
        )

        self.assertIsNotNone(self.book.current_price)
        self.assertEqual(
            self.book.current_price.value,
            Decimal("19.99"),
        )

    def test_current_price_returns_none_when_no_prices_exist(self):
        """Books without prices should return None."""

        self.assertIsNone(self.book.current_price)

    def test_current_price_ignores_future_price(self):
        """Future prices should not be considered active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("29.99"),
            effective_from=timezone.now() + timedelta(days=1),
        )

        self.assertIsNone(self.book.current_price)

    def test_current_price_ignores_expired_price(self):
        """Expired prices should not be considered active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("14.99"),
            effective_from=timezone.now() - timedelta(days=10),
            effective_until=timezone.now() - timedelta(days=1),
        )

        self.assertIsNone(self.book.current_price)

    def test_current_price_returns_newest_active_price(self):
        """Newest active price should be returned when multiple are active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("19.99"),
            effective_from=timezone.now() - timedelta(days=10),
        )

        Price.objects.create(
            book=self.book,
            value=Decimal("24.99"),
            effective_from=timezone.now() - timedelta(days=2),
        )

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24.99"),
        )

    def test_book_list_serializer_returns_current_price(self):
        """BookListSerializer exposes the current active price."""

        Price.objects.create(
            book=self.book,
            value=Decimal("19.99"),
            effective_from=timezone.now() - timedelta(days=1),
        )

        serializer = BookListSerializer(self.book)

        self.assertEqual(
            serializer.data["price"],
            "19.99",
        )

    def test_book_list_serializer_returns_none_when_no_price_exists(self):
        """Serializer returns None if no active price exists."""

        serializer = BookListSerializer(self.book)

        self.assertIsNone(serializer.data["price"])

class BookPriceChangeTestCase(PricingBaseTestCase):

    def test_change_price_creates_first_price(self):
        self.book.change_price(
            value=Decimal("19.99"),
        )

        self.assertEqual(
            Price.objects.count(),
            1,
        )

        price = self.book.current_price

        self.assertIsNotNone(price)

        self.assertEqual(
            price.value,
            Decimal("19.99"),
        )

        self.assertIsNone(price.effective_until)
    
    def test_change_price_closes_previous_price(self):

        first = self.book.change_price(
            value=Decimal("19.99"),
        )

        second = self.book.change_price(
            value=Decimal("24.99"),
        )

        first.refresh_from_db()

        self.assertIsNotNone(first.effective_until)

        self.assertIsNone(second.effective_until)

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24.99"),
        )

        self.assertEqual(
            self.book.prices.count(),
            2,
        )

    def test_change_price_returns_created_price(self):

        price = self.book.change_price(
            value=Decimal("29.99"),
        )

        self.assertIsInstance(
            price,
            Price,
        )

        self.assertEqual(
            price.value,
            Decimal("29.99"),
        )
    
class BookPriceApiTestCase(APITestCase):
    """Tests for the Book price management API."""

    def setUp(self):
        self.author = Author.objects.create(
            name="Douglas Adams",
            biography="Author of The Hitchhiker's Guide to the Galaxy.",
        )

        self.book = Book.objects.create(
            author=self.author,
            title="The Hitchhiker's Guide to the Galaxy",
            slug="the-hitchhikers-guide-to-the-galaxy",
            isbn="9780345391803",
            description="Don't Panic.",
            genre="SCI_FI",
            is_digital=True,
            is_audio=False,
        )

        self.url = reverse(
            "book-price-list-create",
            kwargs={"book_id": self.book.id},
        )

        self.user = User.objects.create_user(
            username="admin",
            password="password123",
        )

        self.client.force_authenticate(self.user)

    def test_get_returns_empty_price_history(self):
        """GET should return an empty list when no prices exist."""

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(response.data["results"], [])

    def test_get_returns_price_history(self):
        """GET returns all historical prices."""

        self.book.change_price(
            value=Decimal("19.99"),
            currency="USD",
        )

        self.book.change_price(
            value=Decimal("24.99"),
            currency="USD",
        )

        response = self.client.get(self.url)

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)

        self.assertEqual(
            response.data["results"][0]["value"],
            "24.99",
        )

        self.assertEqual(
            response.data["results"][1]["value"],
            "19.99",
        )

    def test_post_creates_first_price(self):
        """POST creates the first active price."""

        payload = {
            "value": "19.99",
            "currency": "USD",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(
            Price.objects.count(),
            1,
        )

        self.book.refresh_from_db()

        self.assertEqual(
            self.book.current_price.value,
            Decimal("19.99"),
        )

    def test_post_closes_previous_price(self):
        """POST creates a new active price and closes the previous one."""

        first = self.book.change_price(
            value=Decimal("19.99"),
        )

        payload = {
            "value": "24.99",
            "currency": "USD",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        first.refresh_from_db()

        self.assertIsNotNone(first.effective_until)

        self.book.refresh_from_db()

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24.99"),
        )

        self.assertEqual(
            self.book.prices.count(),
            2,
        )

    def test_post_rejects_invalid_min_price(self):
        """Minimum price cannot exceed selling price."""

        payload = {
            "value": "20.00",
            "min_price": "25.00",
            "currency": "USD",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertIn(
            "min_price",
            response.data,
        )

    def test_invalid_book_returns_404(self):
        """Unknown books should return 404."""

        response = self.client.get(
            reverse(
                "book-price-list-create",
                kwargs={"book_id": 99999},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )