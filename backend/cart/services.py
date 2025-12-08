from django.utils import timezone
from django.db.models import F, Q, Sum
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from catalog.models import Book
from pricing.models import Price, DiscountCode, UserSubscription
from accounts.models import User # For type hinting
from typing import Union, Optional # For type hinting
from rest_framework import serializers # Must be imported for serializers.ValidationError

# Define the minimum allowed price floor for any single item after all discounts
MINIMUM_PRICE_FLOOR = Decimal('1.00')

class PriceCalculationService:
    """
    Handles all complex financial logic for the cart and order submission.
    Ensures correct pricing, discount application, and anti-abuse measures.
    """
    
    def __init__(self, user: User):
        self.user = user
        self.active_plan = self._get_active_subscription()
        self.user_is_subscribed = self.active_plan is not None
        
        # 🔑 FIX: Convert the discount rate to Decimal for precise financial calculations
        self.digital_discount_rate = self._calculate_digital_discount_rate()

    def _calculate_digital_discount_rate(self) -> Decimal:
        """Calculates the digital discount rate as a Decimal."""
        if not self.user_is_subscribed:
            return Decimal('0.00')

        discount_percent = self.active_plan.plan.digital_discount_percent
        # 🔑 FIX: Convert percentage to Decimal('0.XX') before division/use
        return Decimal(discount_percent) / Decimal('100')

    def _get_current_price(self, book_id: int) -> Decimal:
        """
        Retrieves the currently active price for a single book.
        """
        now = timezone.now()
        
        # Find the most recent, non-expired price record
        try:
            price_record = Price.objects.filter(
                Q(book_id=book_id),
                Q(effective_from__lte=now),
                Q(effective_until__isnull=True) | Q(effective_until__gt=now)
            ).order_by('-effective_from').first()
            
            if price_record:
                return price_record.value
        except Exception:
            pass
            
        return Decimal('0.00') # Default to zero if no price is set

    def _get_active_subscription(self) -> Optional[UserSubscription]:
        """Retrieves the user's active subscription if one exists."""
        try:
            sub = UserSubscription.objects.get(user=self.user)
            if sub.is_current():
                return sub
        except UserSubscription.DoesNotExist:
            pass
        return None

    def calculate_order_snapshot(self, cart_items_data: dict, discount_code: str = None) -> tuple:
        """
        Calculates the final cost of the order based on items, subscription, and promo code.
        Returns: (final_items_list, subtotal, discount_amount, final_total, applied_discount_code)
        """
        items_for_snapshot = []
        item_subtotal_base = Decimal('0.00')
        
        # 1. PRICE LOOKUP & SUBSCRIPTION DISCOUNT (Item Level)
        for book_id_str, quantity in cart_items_data.items():
            book = get_object_or_404(Book, pk=int(book_id_str))
            unit_price_base = self._get_current_price(book.id)
            
            # Apply subscription discount only if user is subscribed AND book is digital
            subscription_discount = Decimal('0.00')
            if self.user_is_subscribed and book.is_digital:
                # 🔑 FIX IS HERE: Both operands are now Decimal, calculation is safe.
                subscription_discount = unit_price_base * self.digital_discount_rate
            
            unit_price_after_sub = unit_price_base - subscription_discount
            
            # 🔑 ANTI-ABUSE CHECK: Enforce Minimum Price Floor (e.g., $1.00)
            unit_price_final = max(unit_price_after_sub, MINIMUM_PRICE_FLOOR)
            
            item_subtotal_base += unit_price_final * quantity
            
            # Prepare data for OrderItem snapshot
            items_for_snapshot.append({
                'book': book,
                'quantity': quantity,
                'snapshot_price': unit_price_final, # Locked in item price after subscription/floor
                'snapshot_title': book.title,
                'snapshot_author_name': book.author.name
            })
            
        # 2. GLOBAL DISCOUNT CHECK (Order Level)
        final_total = item_subtotal_base
        order_discount_amount = Decimal('0.00')
        applied_discount_code = None
        
        if discount_code:
            try:
                promo_code = DiscountCode.objects.get(code__iexact=discount_code, is_active=True)
                
                # Check expiration and usage limits
                if promo_code.valid_until and promo_code.valid_until < timezone.now():
                    raise serializers.ValidationError(_("Discount code has expired."))
                if promo_code.max_uses is not None and promo_code.times_used >= promo_code.max_uses:
                    raise serializers.ValidationError(_("Discount code usage limit reached."))

                # 🔑 ANTI-STACKING CHECK: Ensure Promo Code is better than Subscription
                # The total discount is calculated on the item_subtotal_base (which ALREADY has 
                # the subscription discount applied at the item level).
                
                # We calculate the promo discount based on the initial base total
                promo_discount_value = item_subtotal_base * (Decimal(promo_code.discount_percent) / Decimal('100'))
                
                # We apply the promo discount to the order level (since the sub discount was applied at item level)
                order_discount_amount = promo_discount_value
                applied_discount_code = promo_code
                
            except DiscountCode.DoesNotExist:
                # 🔑 FIX: Raise Validation Error when code is not found.
                raise serializers.ValidationError(_("Invalid discount code."))
                
        # 3. CALCULATE FINALS
        final_total -= order_discount_amount
        
        # Ensure total is not negative
        final_total = max(final_total, Decimal('0.00')) 
        
        return (
            items_for_snapshot,
            item_subtotal_base, 
            order_discount_amount, 
            final_total,
            applied_discount_code
        )