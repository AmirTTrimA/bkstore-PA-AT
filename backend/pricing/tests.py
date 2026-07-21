from decimal import Decimal
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from catalog.models import Author, Book
from catalog.serializers import BookListSerializer
from pricing.models import Price


class PricingTestCase(TestCase):
    """Tests for the Book current_price helper and serializer integration."""

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
        self.book.refresh_from_db()

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