from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from accounts.models import User
from catalog.models import Author, Book, BookFormat
from catalog.serializers import BookListSerializer
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from pricing.models import Discount, DiscountCode, Price
from pricing.services import PricingEngine, PricingResult
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
            value=Decimal("19"),
            effective_from=timezone.now() - timedelta(days=1),
        )

        self.assertIsNotNone(self.book.current_price)
        self.assertEqual(
            self.book.current_price.value,
            Decimal("19"),
        )

    def test_current_price_returns_none_when_no_prices_exist(self):
        """Books without prices should return None."""

        self.assertIsNone(self.book.current_price)

    def test_current_price_ignores_future_price(self):
        """Future prices should not be considered active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("29"),
            effective_from=timezone.now() + timedelta(days=1),
        )

        self.assertIsNone(self.book.current_price)

    def test_current_price_ignores_expired_price(self):
        """Expired prices should not be considered active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("14"),
            effective_from=timezone.now() - timedelta(days=10),
            effective_until=timezone.now() - timedelta(days=1),
        )

        self.assertIsNone(self.book.current_price)

    def test_current_price_returns_newest_active_price(self):
        """Newest active price should be returned when multiple are active."""

        Price.objects.create(
            book=self.book,
            value=Decimal("19"),
            effective_from=timezone.now() - timedelta(days=10),
        )

        Price.objects.create(
            book=self.book,
            value=Decimal("24"),
            effective_from=timezone.now() - timedelta(days=2),
        )

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24"),
        )

    def test_book_list_serializer_returns_current_price(self):
        """BookListSerializer exposes the current active price."""

        Price.objects.create(
            book=self.book,
            value=Decimal("19"),
            effective_from=timezone.now() - timedelta(days=1),
        )

        serializer = BookListSerializer(self.book)

        self.assertEqual(
            serializer.data["price"],
            "19",
        )

    def test_book_list_serializer_returns_none_when_no_price_exists(self):
        """Serializer returns None if no active price exists."""

        serializer = BookListSerializer(self.book)

        self.assertIsNone(serializer.data["price"])

class BookPriceChangeTestCase(PricingBaseTestCase):

    def test_change_price_creates_first_price(self):
        self.book.change_price(
            value=Decimal("19"),
        )

        self.assertEqual(
            Price.objects.count(),
            1,
        )

        price = self.book.current_price

        self.assertIsNotNone(price)

        self.assertEqual(
            price.value,
            Decimal("19"),
        )

        self.assertIsNone(price.effective_until)
    
    def test_change_price_closes_previous_price(self):

        first = self.book.change_price(
            value=Decimal("19"),
        )

        second = self.book.change_price(
            value=Decimal("24"),
        )

        first.refresh_from_db()

        self.assertIsNotNone(first.effective_until)

        self.assertIsNone(second.effective_until)

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24"),
        )

        self.assertEqual(
            self.book.prices.count(),
            2,
        )

    def test_change_price_returns_created_price(self):

        price = self.book.change_price(
            value=Decimal("29"),
        )

        self.assertIsInstance(
            price,
            Price,
        )

        self.assertEqual(
            price.value,
            Decimal("29"),
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
            value=Decimal("19"),
        )

        self.book.change_price(
            value=Decimal("24"),
        )

        response = self.client.get(self.url)

        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)

        self.assertEqual(
            response.data["results"][0]["value"],
            "24",
        )

        self.assertEqual(
            response.data["results"][1]["value"],
            "19",
        )

    def test_post_creates_first_price(self):
        """POST creates the first active price."""

        payload = {
            "value": "19",
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
            Decimal("19"),
        )

    def test_post_closes_previous_price(self):
        """POST creates a new active price and closes the previous one."""

        first = self.book.change_price(
            value=Decimal("19"),
        )

        payload = {
            "value": "24",
        }

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        first.refresh_from_db()

        self.assertIsNotNone(first.effective_until)

        self.book.refresh_from_db()

        self.assertEqual(
            self.book.current_price.value,
            Decimal("24"),
        )

        self.assertEqual(
            self.book.prices.count(),
            2,
        )

    def test_post_rejects_invalid_min_price(self):
        """Minimum price cannot exceed selling price."""

        payload = {
            "value": "20",
            "min_price": "25",
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

class PricingEngineTestBase(TestCase):

    def setUp(self):
        self.author = self.create_author()

        self.book = self.create_book(
            author=self.author,
            genre="SCI_FI",
            is_digital=True,
            is_audio=False,
        )

        self.engine = PricingEngine(self.book)

    def create_author(
        self,
        *,
        name="Douglas Adams",
        biography="British author.",
    ):
        return Author.objects.create(
            name=name,
            biography=biography,
        )

    def create_book(
        self,
        *,
        author=None,
        title=None,
        genre="SCI_FI",
        is_digital=True,
        is_audio=False,
        price=Decimal("100"),
        min_price=Decimal("70"),
    ):
        if author is None:
            author = self.author

        uid = uuid4().hex[:8]

        book = Book.objects.create(
            author=author,
            title=title or f"Test Book {uid}",
            slug=f"test-book-{uid}",
            isbn=f"978{uid.zfill(10)}",
            description="Test book",
            genre=genre,
            is_digital=is_digital,
            is_audio=is_audio,
        )

        book.change_price(
            value=price,
            min_price=min_price,
        )

        return book

    def create_discount(
        self,
        *,
        discount_type=Discount.DiscountType.PERCENT,
        value=Decimal("10"),
        scope=Discount.Scope.STORE,
        **kwargs,
    ):
        defaults = {
            "name": "Test Discount",
            "description": "Test discount",
            "discount_type": discount_type,
            "value": value,
            "scope": scope,
            "is_active": True,
            "valid_from": timezone.now(),
        }

        defaults.update(kwargs)

        return Discount.objects.create(**defaults)

    def create_coupon(
        self,
        *,
        discount,
        code="WELCOME20",
        **kwargs,
    ):
        defaults = {
            "discount": discount,
            "code": code,
        }

        defaults.update(kwargs)

        return DiscountCode.objects.create(
            **defaults,
    )

    def create_coupon_discount(
        self,
        *,
        discount_type=Discount.DiscountType.PERCENT,
        value=Decimal("10"),
        **kwargs,
    ):
        defaults = {
            "name": "Coupon Discount",
            "description": "Coupon Discount",
            "discount_type": discount_type,
            "value": value,
            "scope": Discount.Scope.BOOK,
            "activation": Discount.Activation.COUPON,
            "book": self.create_book(),
            "is_active": True,
            "valid_from": timezone.now(),
        }

        defaults.update(kwargs)

        return Discount.objects.create(**defaults)

    def test_returns_current_price(self):
        """
        The engine should retrieve the book's current active price.
        """
        price = self.engine.get_current_price()

        self.assertEqual(price.value, Decimal("100"))
        self.assertEqual(price.min_price, Decimal("70"))

    def test_returns_pricing_result_instance(self):
        """
        calculate() should return a PricingResult object.
        """
        result = self.engine.calculate()

        self.assertIsInstance(result, PricingResult)

    def test_returns_base_price_when_no_discounts_exist(self):
        """
        Without any discounts, the final price should equal the base price.
        """
        result = self.engine.calculate()

        self.assertEqual(result.base_price, Decimal("100"))
        self.assertEqual(result.final_price, Decimal("100"))

        self.assertIsNone(result.automatic_discount)
        self.assertIsNone(result.automatic_discount_amount)

        self.assertIsNone(result.coupon_discount)
        self.assertIsNone(result.coupon_discount_amount)

        self.assertIsNone(result.subscription_discount)
        self.assertIsNone(result.subscription_discount_amount)

from decimal import Decimal

from django.utils import timezone
from pricing.models import Discount


class PricingEngineAutomaticDiscountTestCase(PricingEngineTestBase):
    """Tests automatic discount selection and application."""

    def create_discount(
        self,
        *,
        discount_type=Discount.DiscountType.PERCENT,
        value=Decimal("10"),
        scope=Discount.Scope.STORE,
        **kwargs,
    ):
        defaults = {
            "name": "Test Discount",
            "description": "Test discount",
            "discount_type": discount_type,
            "value": value,
            "scope": scope,
            "is_active": True,
            "valid_from": timezone.now(),
        }

        defaults.update(kwargs)

        return Discount.objects.create(**defaults)

    def test_applies_percentage_discount(self):
        """
        A percentage discount should reduce the book price.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("10"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.base_price, Decimal("100"))
        self.assertEqual(result.final_price, Decimal("90"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("10"),
        )

    def test_applies_fixed_discount(self):
        """
        A fixed discount should subtract its value from the price.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("15"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.base_price, Decimal("100"))
        self.assertEqual(result.final_price, Decimal("85"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("15"),
        )

    def test_selects_best_percentage_discount(self):
        """
        The engine should choose the percentage discount producing
        the lowest selling price.
        """
        self.create_discount(value=Decimal("10"))
        self.create_discount(value=Decimal("20"))
        self.create_discount(value=Decimal("15"))

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("80"))
        self.assertEqual(
            result.automatic_discount.value,
            Decimal("20"),
        )

    def test_selects_discount_producing_lowest_price(self):
        """
        The engine should choose the discount resulting in
        the lowest final selling price, regardless of type.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("10"),
        )

        self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("15"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("85"))
        self.assertEqual(
            result.automatic_discount.discount_type,
            Discount.DiscountType.FIXED,
        )

    def test_returns_one_of_equal_discounts(self):
        """
        If multiple discounts produce the same final price,
        the engine should still return a valid discount.
        """
        first = self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("10"),
        )

        second = self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("10"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("90"))
        self.assertIn(
            result.automatic_discount,
            [first, second],
    )

class PricingEngineScopeTestCase(PricingEngineTestBase):
    """Tests discount applicability based on scope."""

    def test_store_discount_applies(self):
        self.create_discount(
            scope=Discount.Scope.STORE,
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("80"))

    def test_book_discount_applies_only_to_matching_book(self):
        other_book = self.create_book()

        self.create_discount(
            scope=Discount.Scope.BOOK,
            book=other_book,
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("100"))

        other_result = PricingEngine(other_book).calculate()

        self.assertEqual(other_result.final_price, Decimal("80"))

    def test_author_discount_applies_only_to_matching_author(self):
        other_author = self.create_author(
            name="Frank Herbert",
        )

        other_book = self.create_book(
            author=other_author,
        )

        self.create_discount(
            scope=Discount.Scope.AUTHOR,
            author=other_author,
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("100"))

        other_result = PricingEngine(other_book).calculate()

        self.assertEqual(other_result.final_price, Decimal("80"))

    def test_genre_discount_applies_only_to_matching_genre(self):
        fantasy = self.create_book(
            genre="FANTASY",
        )

        self.create_discount(
            scope=Discount.Scope.GENRE,
            genre="FANTASY",
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("100"))

        fantasy_result = PricingEngine(fantasy).calculate()

        self.assertEqual(fantasy_result.final_price, Decimal("80"))

    def test_digital_discount_applies_to_digital_books(self):
        physical = self.create_book(
            is_digital=False,
            is_audio=False,
        )

        self.create_discount(
            scope=Discount.Scope.FORMAT,
            format=Discount.Format.DIGITAL,
            value=Decimal("20"),
        )

        self.assertEqual(
            self.engine.calculate().final_price,
            Decimal("80"),
        )

        self.assertEqual(
            PricingEngine(physical).calculate().final_price,
            Decimal("100"),
        )

    def test_audio_discount_applies_to_audio_books(self):
        audio = self.create_book(
            is_digital=False,
            is_audio=True,
        )

        self.create_discount(
            scope=Discount.Scope.FORMAT,
            format=Discount.Format.AUDIO,
            value=Decimal("20"),
        )

        self.assertEqual(
            self.engine.calculate().final_price,
            Decimal("100"),
        )

        self.assertEqual(
            PricingEngine(audio).calculate().final_price,
            Decimal("80"),
        )

    def test_physical_discount_applies_only_to_physical_books(self):
        physical = self.create_book(
            is_digital=False,
            is_audio=False,
        )

        self.create_discount(
            scope=Discount.Scope.FORMAT,
            format=Discount.Format.PHYSICAL,
            value=Decimal("20"),
        )

        self.assertEqual(
            self.engine.calculate().final_price,
            Decimal("100"),
        )

        self.assertEqual(
            PricingEngine(physical).calculate().final_price,
            Decimal("80"),
        )

from datetime import timedelta
from decimal import Decimal

from django.utils import timezone


class PricingEngineValidityTestCase(PricingEngineTestBase):
    """Tests discount validity based on activity and dates."""

    def test_inactive_discount_is_ignored(self):
        """
        Inactive discounts should never be applied.
        """
        self.create_discount(
            is_active=False,
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertIsNone(result.automatic_discount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_expired_discount_is_ignored(self):
        """
        Discounts whose validity has ended should be ignored.
        """
        now = timezone.now()

        self.create_discount(
            valid_from=now - timedelta(days=10),
            valid_until=now - timedelta(days=1),
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertIsNone(result.automatic_discount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_future_discount_is_ignored(self):
        """
        Discounts that have not yet started should not apply.
        """
        now = timezone.now()

        self.create_discount(
            valid_from=now + timedelta(days=1),
            valid_until=now + timedelta(days=10),
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertIsNone(result.automatic_discount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_discount_is_valid_at_valid_from(self):
        """
        A discount should become valid exactly at its valid_from timestamp.
        """
        now = timezone.now()

        self.create_discount(
            valid_from=now,
            valid_until=now + timedelta(days=1),
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertIsNotNone(result.automatic_discount)
        self.assertEqual(result.final_price, Decimal("80"))

    def test_discount_is_valid_before_valid_until(self):
        """
        A discount should still be valid exactly at its valid_until timestamp.
        """
        now = timezone.now()

        self.create_discount(
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(seconds=1),
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertIsNotNone(result.automatic_discount)
        self.assertEqual(result.final_price, Decimal("80"))

class PricingEngineMinimumPriceTestCase(PricingEngineTestBase):
    """Tests enforcement of a book's minimum selling price."""

    def test_percentage_discount_respects_minimum_price(self):
        """
        Percentage discounts should never reduce the selling
        price below the configured minimum price.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("50"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.base_price, Decimal("100"))
        self.assertEqual(result.final_price, Decimal("70"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("30"),
        )

    def test_fixed_discount_respects_minimum_price(self):
        """
        Fixed discounts should never reduce the selling
        price below the configured minimum price.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("50"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("70"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("30"),
        )

    def test_discount_is_not_clamped_when_above_minimum_price(self):
        """
        Discounts resulting in a price above the minimum
        should not be modified.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("20"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("80"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("20"),
        )

    def test_discount_without_minimum_price(self):
        """
        Discounts should apply normally when no minimum
        selling price is configured.
        """
        self.book.change_price(
            value=Decimal("100"),
            min_price=None,
        )

        self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("50"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("50"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("50"),
        )

    def test_discount_can_reduce_price_exactly_to_minimum_price(self):
        """
        A discount resulting exactly in the minimum price
        should be applied without modification.
        """
        self.create_discount(
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("30"),
        )

        result = self.engine.calculate()

        self.assertEqual(result.final_price, Decimal("70"))
        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("30"),
        )

class PricingEngineCouponTestCase(PricingEngineTestBase):
    """Tests coupon-related pricing behavior."""

    def test_coupon_parameter_is_ignored_when_not_implemented(self):
        result = self.engine.calculate(
            coupon_code="WELCOME20",
        )

        self.assertEqual(
            result.final_price,
            Decimal("100"),
        )

        self.assertIsNone(result.coupon_discount)
        self.assertIsNone(result.coupon_discount_amount)

class PricingEngineCouponLookupTestCase(PricingEngineTestBase):
    """Tests coupon lookup by coupon code."""

    def test_returns_coupon_when_code_exists(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            code="WELCOME20",
        )

        result = self.engine._get_coupon("WELCOME20")

        self.assertEqual(result, coupon)

    def test_returns_none_for_unknown_code(self):
        result = self.engine._get_coupon(
            "DOES_NOT_EXIST",
        )

        self.assertIsNone(result)

    def test_returns_none_when_code_is_none(self):
        result = self.engine._get_coupon(None)

        self.assertIsNone(result)

    def test_returns_none_when_code_is_empty(self):
        result = self.engine._get_coupon("")

        self.assertIsNone(result)

class PricingEngineCouponValidationTestCase(
    PricingEngineTestBase
):
    """Tests coupon validation."""

    def test_active_coupon_is_valid(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertEqual(result, coupon)

    def test_inactive_coupon_is_rejected(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            is_active=False,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertIsNone(result)

    def test_coupon_without_usage_limit_is_valid(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            max_uses=None,
            times_used=500,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertEqual(result, coupon)

    def test_coupon_below_usage_limit_is_valid(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            max_uses=10,
            times_used=9,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertEqual(result, coupon)

    def test_coupon_at_usage_limit_is_rejected(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            max_uses=10,
            times_used=10,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertIsNone(result)

    def test_coupon_above_usage_limit_is_rejected(self):
        discount = self.create_discount()

        coupon = self.create_coupon(
            discount=discount,
            max_uses=10,
            times_used=15,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertIsNone(result)

    def test_coupon_with_invalid_discount_is_rejected(self):
        discount = self.create_discount(
            is_active=False,
        )

        coupon = self.create_coupon(
            discount=discount,
        )

        result = self.engine._validate_coupon(
            coupon,
            user=None,
        )

        self.assertIsNone(result)

class PricingEngineCouponApplicationTestCase(
    PricingEngineTestBase
):
    """Tests coupon application within the pricing engine."""

    def test_percent_coupon_is_applied(self):
        discount = self.create_discount(
            activation=Discount.Activation.COUPON,
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("20"),
        )

        self.create_coupon(
            discount=discount,
            code="WELCOME20",
        )

        result = self.engine.calculate(
            coupon_code="WELCOME20",
        )

        self.assertEqual(result.base_price, Decimal("100"))
        self.assertEqual(result.final_price, Decimal("80"))
        self.assertEqual(
            result.coupon_discount,
            discount,
        )
        self.assertEqual(
            result.coupon_discount_amount,
            Decimal("20"),
        )

    def test_fixed_coupon_is_applied(self):
        discount = self.create_discount(
            activation=Discount.Activation.COUPON,
            discount_type=Discount.DiscountType.FIXED,
            value=Decimal("15"),
        )

        self.create_coupon(
            discount=discount,
            code="WELCOME15",
        )

        result = self.engine.calculate(
            coupon_code="WELCOME15",
        )

        self.assertEqual(result.final_price, Decimal("85"))
        self.assertEqual(
            result.coupon_discount,
            discount,
        )
        self.assertEqual(
            result.coupon_discount_amount,
            Decimal("15"),
        )

    def test_invalid_coupon_is_ignored(self):
        discount = self.create_discount(
            activation=Discount.Activation.COUPON,
        )

        self.create_coupon(
            discount=discount,
            code="WELCOME20",
            is_active=False,
        )

        result = self.engine.calculate(
            coupon_code="WELCOME20",
        )

        self.assertEqual(
            result.final_price,
            Decimal("100"),
        )

        self.assertIsNone(result.coupon_discount)
        self.assertIsNone(result.coupon_discount_amount)

    def test_coupon_stacks_with_automatic_discount(self):
        self.create_discount(
            activation=Discount.Activation.AUTOMATIC,
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("20"),
        )

        coupon_discount = self.create_discount(
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("10"),
        )

        self.create_coupon(
            discount=coupon_discount,
            code="WELCOME10",
        )

        result = self.engine.calculate(
            coupon_code="WELCOME10",
        )

        self.assertEqual(
            result.base_price,
            Decimal("100"),
        )

        self.assertEqual(
            result.final_price,
            Decimal("72"),
        )

        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("20"),
        )

        self.assertEqual(
            result.coupon_discount_amount,
            Decimal("8"),
        )

    def test_coupon_respects_minimum_price(self):
        self.create_discount(
            activation=Discount.Activation.AUTOMATIC,
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("20"),
        )

        coupon_discount = self.create_discount(
            activation=Discount.Activation.COUPON,
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("50"),
        )

        self.create_coupon(
            discount=coupon_discount,
            code="HALFPRICE",
        )

        result = self.engine.calculate(
            coupon_code="HALFPRICE",
        )

        self.assertEqual(
            result.final_price,
            Decimal("70"),
        )

        self.assertEqual(
            result.automatic_discount_amount,
            Decimal("20"),
        )

        self.assertEqual(
            result.coupon_discount_amount,
            Decimal("10"),
        )

class PriceFormatBridgeTest(TestCase):
    def test_existing_price_has_book_format(self):
        author = Author.objects.create(name="Bridge Author")

        book = Book.objects.create(
            author=author,
            title="Bridge Book",
            slug="bridge-book",
            isbn="9782222222222",
            description="Test",
            genre="SCI_FI",
        )

        fmt = BookFormat.objects.create(
            book=book,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        price = Price.objects.create(
            book=book,
            book_format=fmt,
            value=Decimal("19"),
        )

        self.assertEqual(price.book_format, fmt)

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase
from wallet.models import Wallet

from .models import SubscriptionPlan, UserSubscription
from .subscription_services import SubscriptionService

User = get_user_model()


class SubscriptionServiceTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="subscription-user",
            password="testpass123",
        )

        self.wallet = self.user.wallet
        self.wallet.balance = Decimal("100")
        self.wallet.save(update_fields=["balance"])

        self.reader = SubscriptionPlan.objects.create(
            name="Reader",
            slug="reader",
            tier=1,
            monthly_price=Decimal("5"),
            digital_discount_percent=5,
            is_active=True,
        )

        self.scholar = SubscriptionPlan.objects.create(
            name="Scholar",
            slug="scholar",
            tier=2,
            monthly_price=Decimal("10"),
            digital_discount_percent=10,
            is_active=True,
        )

        self.professional = SubscriptionPlan.objects.create(
            name="Professional",
            slug="professional",
            tier=3,
            monthly_price=Decimal("15"),
            digital_discount_percent=15,
            is_active=True,
        )

    def test_first_purchase_creates_active_subscription(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            subscription.status,
            UserSubscription.Status.ACTIVE,
        )

        self.assertEqual(
            subscription.plan,
            self.reader,
        )

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("95"),
        )

        self.assertGreater(
            subscription.end_date,
            subscription.start_date,
        )

    def test_purchase_fails_when_wallet_is_insufficient(self):
        self.user.wallet.balance = Decimal("2")
        self.user.wallet.save(update_fields=["balance"])

        with self.assertRaises(ValidationError):
            SubscriptionService.purchase(
                user=self.user,
                plan=self.reader,
            )

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("2"),
        )

        self.assertFalse(
            UserSubscription.objects.filter(
                user=self.user,
            ).exists()
        )

    def test_purchase_with_active_subscription_creates_reserved_subscription(self):
        current = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        reserved = SubscriptionService.purchase(
            user=self.user,
            plan=self.scholar,
        )

        self.assertEqual(
            current.status,
            UserSubscription.Status.ACTIVE,
        )

        self.assertEqual(
            reserved.status,
            UserSubscription.Status.RESERVED,
        )

        self.assertEqual(
            reserved.start_date,
            current.end_date,
        )

        self.assertEqual(
            reserved.end_date,
            current.end_date + timezone.timedelta(days=30),
        )

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("85"),
        )

    def test_second_reserved_subscription_is_rejected(self):
        SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        SubscriptionService.purchase(
            user=self.user,
            plan=self.scholar,
        )

        with self.assertRaises(ValidationError):
            SubscriptionService.purchase(
                user=self.user,
                plan=self.professional,
            )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
            ).count(),
            2,
        )

    def test_inactive_plan_cannot_be_purchased(self):
        self.professional.is_active = False
        self.professional.save(update_fields=["is_active"])

        with self.assertRaises(ValidationError):
            SubscriptionService.purchase(
                user=self.user,
                plan=self.professional,
            )

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("100"),
        )

    def test_upgrade_requires_active_subscription(self):
        with self.assertRaises(ValidationError):
            SubscriptionService.upgrade(
                user=self.user,
                plan=self.scholar,
            )

    def test_upgrade_requires_higher_tier(self):
        SubscriptionService.purchase(
            user=self.user,
            plan=self.scholar,
        )

        with self.assertRaises(ValidationError):
            SubscriptionService.upgrade(
                user=self.user,
                plan=self.reader,
            )

    def test_upgrade_replaces_active_subscription(self):
        current = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        before_upgrade = timezone.now()

        upgraded = SubscriptionService.upgrade(
            user=self.user,
            plan=self.scholar,
        )

        after_upgrade = timezone.now()

        current.refresh_from_db()

        self.assertEqual(
            current.status,
            UserSubscription.Status.EXPIRED,
        )

        self.assertEqual(
            upgraded.status,
            UserSubscription.Status.ACTIVE,
        )

        self.assertEqual(
            upgraded.plan,
            self.scholar,
        )

        self.assertGreaterEqual(
            upgraded.start_date,
            before_upgrade,
        )

        self.assertLessEqual(
            upgraded.start_date,
            after_upgrade,
        )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
                status=UserSubscription.Status.ACTIVE,
            ).count(),
            1,
        )

    def test_upgrade_charges_only_remaining_value(self):
        current = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        now = timezone.now()

        current.start_date = now - timedelta(days=20)
        current.end_date = now + timedelta(days=10)
        current.save(
            update_fields=[
                "start_date",
                "end_date",
                "updated_at",
            ],
        )

        self.user.wallet.refresh_from_db()
        initial_balance = self.user.wallet.balance

        SubscriptionService.upgrade(
            user=self.user,
            plan=self.scholar,
        )

        self.user.wallet.refresh_from_db()

        remaining_value = (
            Decimal("5")
            * Decimal("10")
            / Decimal("30")
        ).quantize(Decimal("0"))

        expected_charge = (
            Decimal("10") - remaining_value
        )

        self.assertEqual(
            self.user.wallet.balance,
            initial_balance - expected_charge,
        )

    def test_expired_subscription_without_auto_renew_becomes_expired(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        subscription.end_date = timezone.now() - timedelta(days=1)
        subscription.auto_renew = False
        subscription.save(
            update_fields=[
                "end_date",
                "auto_renew",
                "updated_at",
            ],
        )

        self.user.wallet.refresh_from_db()
        initial_balance = self.user.wallet.balance

        result = SubscriptionService.process_expired_subscriptions()

        subscription.refresh_from_db()
        self.user.wallet.refresh_from_db()

        self.assertEqual(
            subscription.status,
            UserSubscription.Status.EXPIRED,
        )

        self.assertEqual(
            self.user.wallet.balance,
            initial_balance,
        )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
            ).count(),
            1,
        )

        self.assertEqual(
            result["expired"],
            1,
        )

    def test_expired_subscription_activates_reserved_subscription(self):
        current = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        reserved = SubscriptionService.purchase(
            user=self.user,
            plan=self.scholar,
        )

        current.end_date = timezone.now() - timedelta(days=1)
        current.save(
            update_fields=[
                "end_date",
                "updated_at",
            ],
        )

        # The reservation must begin exactly when the original
        # subscription expires.
        reserved.start_date = current.end_date
        reserved.end_date = SubscriptionService._calculate_end_date(
            reserved.start_date,
        )
        reserved.save(
            update_fields=[
                "start_date",
                "end_date",
                "updated_at",
            ],
        )

        self.user.wallet.refresh_from_db()
        initial_balance = self.user.wallet.balance

        result = SubscriptionService.process_expired_subscriptions()

        current.refresh_from_db()
        reserved.refresh_from_db()
        self.user.wallet.refresh_from_db()

        self.assertEqual(
            current.status,
            UserSubscription.Status.EXPIRED,
        )

        self.assertEqual(
            reserved.status,
            UserSubscription.Status.ACTIVE,
        )

        self.assertEqual(
            reserved.start_date,
            current.end_date,
        )

        # The reserved subscription was already paid for.
        self.assertEqual(
            self.user.wallet.balance,
            initial_balance,
        )

        self.assertEqual(
            result["reserved_activated"],
            1,
        )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
                status=UserSubscription.Status.ACTIVE,
            ).count(),
            1,
        )

    def test_auto_renew_fails_with_insufficient_wallet_balance(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        subscription.end_date = timezone.now() - timedelta(days=1)
        subscription.auto_renew = True
        subscription.save(
            update_fields=[
                "end_date",
                "auto_renew",
                "updated_at",
            ],
        )

        self.user.wallet.balance = Decimal("2")
        self.user.wallet.save(
            update_fields=["balance"],
        )

        result = SubscriptionService.process_expired_subscriptions()

        subscription.refresh_from_db()
        self.user.wallet.refresh_from_db()

        self.assertEqual(
            subscription.status,
            UserSubscription.Status.EXPIRED,
        )

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("2"),
        )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
                status=UserSubscription.Status.ACTIVE,
            ).count(),
            0,
        )

        self.assertEqual(
            result["renewal_failed"],
            1,
        )

    def test_expiration_processing_is_idempotent(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        subscription.end_date = timezone.now() - timedelta(days=1)
        subscription.auto_renew = True
        subscription.save(
            update_fields=[
                "end_date",
                "auto_renew",
                "updated_at",
            ],
        )

        self.user.wallet.refresh_from_db()
        initial_balance = self.user.wallet.balance

        first_result = SubscriptionService.process_expired_subscriptions()

        self.user.wallet.refresh_from_db()

        balance_after_first_run = self.user.wallet.balance

        second_result = SubscriptionService.process_expired_subscriptions()

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            first_result["renewed"],
            1,
        )

        self.assertEqual(
            second_result["renewed"],
            0,
        )

        self.assertEqual(
            self.user.wallet.balance,
            balance_after_first_run,
        )

        self.assertEqual(
            self.user.wallet.balance,
            initial_balance - self.reader.monthly_price,
        )

        self.assertEqual(
            UserSubscription.objects.filter(
                user=self.user,
                status=UserSubscription.Status.ACTIVE,
            ).count(),
            1,
        )

    def test_non_expired_subscription_is_untouched(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
        )

        original_end_date = subscription.end_date

        result = SubscriptionService.process_expired_subscriptions()

        subscription.refresh_from_db()

        self.assertEqual(
            subscription.status,
            UserSubscription.Status.ACTIVE,
        )

        self.assertEqual(
            subscription.end_date,
            original_end_date,
        )

        self.assertEqual(
            result["expired"],
            0,
        )

    def test_purchase_respects_auto_renew(self):
        subscription = SubscriptionService.purchase(
            user=self.user,
            plan=self.reader,
            auto_renew=True,
        )

        self.assertTrue(subscription.auto_renew)

class PricingEngineSubscriptionTestCase(PricingEngineTestBase):

    def setUp(self):
        super().setUp()

        self.user = User.objects.create_user(
            username="subscription-user",
            password="testpass123",
        )

        self.reader = SubscriptionPlan.objects.create(
            name="Reader",
            slug="reader",
            tier=1,
            monthly_price=Decimal("5"),
            digital_discount_percent=5,
            is_active=True,
        )

        self.scholar = SubscriptionPlan.objects.create(
            name="Scholar",
            slug="scholar",
            tier=2,
            monthly_price=Decimal("10"),
            digital_discount_percent=10,
            is_active=True,
        )

        self.professional = SubscriptionPlan.objects.create(
            name="Professional",
            slug="professional",
            tier=3,
            monthly_price=Decimal("15"),
            digital_discount_percent=15,
            is_active=True,
        )

        self.digital_format = BookFormat.objects.create(
            book=self.book,
            format_type=BookFormat.FormatType.DIGITAL,
            is_available=True,
        )

        self.physical_format = BookFormat.objects.create(
            book=self.book,
            format_type=BookFormat.FormatType.PHYSICAL,
            is_available=True,
        )

        self.digital_price = Price.objects.create(
            book=self.book,
            book_format=self.digital_format,
            value=Decimal("100"),
            min_price=Decimal("70"),
        )

        self.physical_price = Price.objects.create(
            book=self.book,
            book_format=self.physical_format,
            value=Decimal("100"),
            min_price=Decimal("70"),
        )

    def test_active_subscription_applies_digital_discount(self):
        UserSubscription.objects.create(
            user=self.user,
            plan=self.reader,
            status=UserSubscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )

        result = PricingEngine(
            book=self.book,
            book_format=self.digital_format,
            user=self.user,
        ).calculate()

        self.assertEqual(
            result.subscription_discount,
            self.reader,
        )

        self.assertEqual(
            result.subscription_discount_amount,
            Decimal("5"),
        )

        self.assertEqual(
            result.final_price,
            Decimal("95"),
        )

    def test_reserved_subscription_does_not_apply_discount(self):
        UserSubscription.objects.create(
            user=self.user,
            plan=self.reader,
            status=UserSubscription.Status.RESERVED,
            start_date=timezone.now() + timedelta(days=30),
            end_date=timezone.now() + timedelta(days=60),
        )

        result = PricingEngine(
            book=self.book,
            book_format=self.digital_format,
            user=self.user,
        ).calculate()

        self.assertIsNone(result.subscription_discount)
        self.assertIsNone(result.subscription_discount_amount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_expired_subscription_does_not_apply_discount(self):
        UserSubscription.objects.create(
            user=self.user,
            plan=self.reader,
            status=UserSubscription.Status.EXPIRED,
            start_date=timezone.now() - timedelta(days=60),
            end_date=timezone.now() - timedelta(days=30),
        )

        result = PricingEngine(
            book=self.book,
            book_format=self.digital_format,
            user=self.user,
        ).calculate()

        self.assertIsNone(result.subscription_discount)
        self.assertIsNone(result.subscription_discount_amount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_subscription_discount_does_not_apply_to_physical_format(self):
        UserSubscription.objects.create(
            user=self.user,
            plan=self.reader,
            status=UserSubscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )

        result = PricingEngine(
            book=self.book,
            book_format=self.physical_format,
            user=self.user,
        ).calculate()

        self.assertIsNone(result.subscription_discount)
        self.assertIsNone(result.subscription_discount_amount)
        self.assertEqual(result.final_price, Decimal("100"))

    def test_subscription_discount_respects_minimum_price(self):
        self.digital_price.min_price = Decimal("98")
        self.digital_price.save(update_fields=["min_price"])

        UserSubscription.objects.create(
            user=self.user,
            plan=self.professional,
            status=UserSubscription.Status.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),
        )

        result = PricingEngine(
            book=self.book,
            book_format=self.digital_format,
            user=self.user,
        ).calculate()

        self.assertEqual(
            result.final_price,
            Decimal("98"),
        )

        self.assertEqual(
            result.subscription_discount_amount,
            Decimal("2"),
        )