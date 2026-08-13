from dataclasses import dataclass
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone

from .models import Discount, DiscountCode, Price


@dataclass
class PricingResult:
    base_price: Decimal

    automatic_discount: Discount | None
    automatic_discount_amount: Decimal | None

    coupon_discount: Discount | None
    coupon_discount_amount: Decimal | None

    subscription_discount: Discount | None
    subscription_discount_amount: Decimal |None

    final_price: Decimal

class PricingEngine:
    """
    Calculates the effective selling price for a single book.
    """

    def __init__(self, book=None, book_format=None, user=None, coupon_code=None):
        if book is None and book_format is None:
            raise ValueError("Either book or book_format must be provided.")

        self.book = book or book_format.book
        self.book_format = book_format
        self.user = user
        self.coupon_code = coupon_code

    def get_current_price(self):
        """
        Returns the currently active Price object.
        Supports both format-aware and legacy book-level pricing.
        """

        return self._get_active_price()


    def _get_active_price(self):
        """
        Returns the currently active price for the selected format.
        Falls back to the legacy book-level relation during the migration phase.
        """

        now = timezone.now()

        def active_prices(queryset):
            return queryset.filter(
                effective_from__lte=now
            ).filter(
                Q(effective_until__isnull=True)
                | Q(effective_until__gte=now)
            )

        if self.book_format is not None:
            price = active_prices(
                Price.objects.filter(book_format=self.book_format)
            ).order_by("-effective_from").first()

            if price is not None:
                return price

        # Legacy fallback
        return active_prices(
            Price.objects.filter(book=self.book)
        ).order_by("-effective_from").first()

    def get_applicable_discounts(self):
        discounts = Discount.objects.filter(
            is_active=True,
            activation=Discount.Activation.AUTOMATIC,
        )

        return [
            discount
            for discount in discounts
            if discount.can_apply_to(self.book)
        ]
    
    def apply_discount(
        self,
        current_price,
        price_record,
        discount,
    ):
        if discount.discount_type == Discount.DiscountType.PERCENT:
            new_price = current_price * (
                Decimal("1.00") - discount.value / Decimal("100")
            )
        else:
            new_price = current_price - discount.value

        if (
            price_record.min_price is not None
            and new_price < price_record.min_price
        ):
            return price_record.min_price

        return new_price
    
    def get_best_discount(self, current_price):
        price_record = self.get_current_price()

        discounts = self.get_applicable_discounts()

        if not discounts:
            return None, current_price

        best_discount = None
        best_price = current_price

        for discount in discounts:
            discounted_price = self.apply_discount(
                current_price,
                price_record,
                discount,
            )

            if discounted_price < best_price:
                best_price = discounted_price
                best_discount = discount

        return best_discount, best_price

    def _get_coupon(
        self,
        coupon_code,
    ):
        if not coupon_code:
            return None

        try:
            return DiscountCode.objects.select_related(
                "discount",
            ).get(
                code=coupon_code,
            )
        except DiscountCode.DoesNotExist:
            return None

    def _validate_coupon(
        self,
        coupon,
        user,
    ):
        if coupon is None:
            return None

        if coupon.discount is None:
            return None

        if not coupon.is_active:
            return None

        if (
            coupon.max_uses is not None
            and coupon.times_used >= coupon.max_uses
        ):
            return None

        if not coupon.discount.is_active_now():
            return None

        return coupon

    def _apply_coupon(
        self,
        current_price,
        price_record,
        coupon,
    ):
        if coupon is None:
            return current_price

        return self.apply_discount(
            current_price,
            price_record,
            coupon.discount,
        )


    def calculate(
        self,
        coupon_code=None,
        user=None,
    ):
        """
        Calculates the final selling price for a book.

        Args:
            coupon_code:
                Optional coupon code supplied by the customer.

            user:
                Optional authenticated user used when
                validating coupons and subscription discounts.
        """

        # Base price
        price = self.get_current_price()

        if price is None:
            raise ValueError(
                f"Book '{self.book}' has no active price."
            )

        current_price = price.value

        # Automatic discounts
        automatic_discount, current_price = (
            self.get_best_discount(current_price)
        )

        automatic_discount_amount = None
        if automatic_discount:
            automatic_discount_amount = (
                price.value - current_price
            )

        # Coupon
        coupon = self._get_coupon(coupon_code)
        coupon = self._validate_coupon(coupon, user)

        coupon_discount = None
        coupon_discount_amount = None

        if coupon:
            before_coupon = current_price

            current_price = self._apply_coupon(
                current_price,
                price,
                coupon,
            )

            coupon_discount = coupon.discount
            coupon_discount_amount = (
                before_coupon - current_price
            )

        # Subscription discounts (not implemented yet)
        subscription_discount = None
        subscription_discount_amount = None

        return PricingResult(
            base_price=price.value,

            automatic_discount=automatic_discount,
            automatic_discount_amount=automatic_discount_amount,

            coupon_discount=coupon_discount,
            coupon_discount_amount=coupon_discount_amount,

            subscription_discount=subscription_discount,
            subscription_discount_amount=subscription_discount_amount,

            final_price=current_price,
        )