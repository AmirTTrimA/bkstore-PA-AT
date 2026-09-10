# cart/services.py
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional, Union

from accounts.models import User  # For type hinting
from catalog.models import Book, BookFormat
from content.models import License
from django.db import transaction
from django.db.models import (  # F is not used yet, but kept for future queries
    F, Q, Sum)
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from pricing.models import DiscountCode, Price, UserSubscription
from pricing.services import PricingEngine
from requests import Response  # For type hinting
from rest_framework import \
    serializers  # Must be imported for serializers.ValidationError
from wallet.exceptions import InsufficientBalanceError
from wallet.models.transaction import WalletTransaction
from wallet.services import WalletService

from .models import Cart, Order, OrderItem

# Define the minimum allowed price floor for any single item after all discounts
MINIMUM_PRICE_FLOOR = Decimal('1.00')

@dataclass
class SnapshotItem:
    book: Book
    book_format: BookFormat
    quantity: int
    unit_price: Decimal
    snapshot_title: str
    snapshot_author_name: str

@dataclass
class OrderSnapshot:
    items: list[SnapshotItem]
    subtotal: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    applied_coupon: DiscountCode | None

class CheckoutService:
    """
    Coordinates the checkout workflow.

    This service does not contain pricing logic. It orchestrates the checkout
    process by delegating price calculation to the PricingEngine and handling
    order creation, license granting, coupon consumption, cart cleanup, and
    other checkout-related operations.
    """

    def __init__(self, user: User):
        self.user = user

    def checkout(
        self,
        cart,
        shipping_data,
        coupon_code=None,
    ):
        """
        Executes the complete checkout workflow and returns the created order.
        """
        pass

    def _build_order_snapshot(
        self,
        cart,
        coupon_code=None,
    ):
        """
        Builds an immutable snapshot of the current cart.

        This method performs no database writes. It delegates all pricing
        calculations to PricingEngine and aggregates the results into an
        OrderSnapshot.
        """

        items = []

        subtotal = Decimal("0.00")
        discount_amount = Decimal("0.00")
        total_amount = Decimal("0.00")

        applied_coupon = None

        if coupon_code:
            applied_coupon = DiscountCode.objects.filter(
                code__iexact=coupon_code
            ).select_related("discount").first()

        for cart_item in cart.items.select_related(
            "book",
            "book__author",
            "book_format",
        ):

            result = PricingEngine(
                book=cart_item.book,
                book_format=cart_item.book_format,
                user=self.user,
            ).calculate(
                coupon_code=coupon_code,
            )

            item_discount = (
                (result.automatic_discount_amount or Decimal("0.00"))
                + (result.coupon_discount_amount or Decimal("0.00"))
                + (result.subscription_discount_amount or Decimal("0.00"))
            )

            subtotal += result.base_price * cart_item.quantity
            discount_amount += item_discount * cart_item.quantity
            total_amount += result.final_price * cart_item.quantity

            items.append(
                SnapshotItem(
                    book=cart_item.book,
                    book_format=cart_item.book_format,
                    quantity=cart_item.quantity,
                    unit_price=result.final_price,
                    snapshot_title=cart_item.book.title,
                    snapshot_author_name=cart_item.book.author.name,
                )
            )

        return OrderSnapshot(
            items=items,
            subtotal=subtotal,
            discount_amount=discount_amount,
            total_amount=total_amount,
            applied_coupon=applied_coupon,
        )

    def _resolve_shipping_data(self, cart: Cart, shipping_data: dict) -> dict:
        """
        Resolves shipping details from either a saved address_id or manual input fields.
        Enforces required shipping details only when physical books are present in cart.
        """
        has_physical_items = any(
            item.book_format.format_type == BookFormat.FormatType.PHYSICAL
            for item in cart.items.select_related("book_format")
        )

        address_id = shipping_data.get("address_id")
        if address_id:
            from accounts.models import Address

            try:
                saved_address = Address.objects.get(pk=address_id, user=self.user)
                return {
                    "shipping_name": saved_address.recipient_name,
                    "shipping_address_line1": saved_address.address_line,
                    "shipping_city": saved_address.city,
                    "shipping_country": saved_address.country,
                }
            except (Address.DoesNotExist, ValueError):
                raise serializers.ValidationError(
                    {"address_id": _("Selected address does not exist.")}
                )

        shipping_name = (shipping_data.get("shipping_name") or "").strip()
        shipping_address_line1 = (
            shipping_data.get("shipping_address_line1") or ""
        ).strip()
        shipping_city = (shipping_data.get("shipping_city") or "").strip()
        shipping_country = (
            shipping_data.get("shipping_country") or "Iran"
        ).strip()

        if has_physical_items:
            missing_fields = []
            if not shipping_name:
                missing_fields.append("shipping_name")
            if not shipping_address_line1:
                missing_fields.append("shipping_address_line1")
            if not shipping_city:
                missing_fields.append("shipping_city")

            if missing_fields:
                raise serializers.ValidationError(
                    {
                        field: _("This field is required for physical book delivery.")
                        for field in missing_fields
                    }
                )

        return {
            "shipping_name": shipping_name,
            "shipping_address_line1": shipping_address_line1,
            "shipping_city": shipping_city,
            "shipping_country": shipping_country,
        }

    def _create_order(
        self,
        snapshot: OrderSnapshot,
        shipping_data: dict,
    ):
        return Order.objects.create(
            user=self.user,
            discount_code=snapshot.applied_coupon,
            subtotal=snapshot.subtotal,
            discount_amount=snapshot.discount_amount,
            total_amount=snapshot.total_amount,
            status="PENDING",
            shipping_name=shipping_data.get("shipping_name", ""),
            shipping_address_line1=shipping_data.get("shipping_address_line1", ""),
            shipping_city=shipping_data.get("shipping_city", ""),
            shipping_country=shipping_data.get("shipping_country", ""),
        )


    def _create_order_items(
        self,
        order: Order,
        snapshot: OrderSnapshot,
    ):
        """
        Creates immutable OrderItem records from an OrderSnapshot.
        """

        order_items = []

        for item in snapshot.items:
            order_items.append(
                OrderItem(
                    order=order,
                    book=item.book,
                    book_format=item.book_format,
                    quantity=item.quantity,
                    snapshot_price=item.unit_price,
                    snapshot_title=item.snapshot_title,
                    snapshot_author_name=item.snapshot_author_name,
                )
            )

        OrderItem.objects.bulk_create(order_items)

    def _charge_wallet(self, amount: Decimal):
        """
        Charges the customer's wallet for the order amount.
        """

        return WalletService.withdraw(
            user=self.user,
            amount=amount,
            description=f"Bookstore order payment",
        )

    def _grant_licenses(
        self,
        order: Order,
        snapshot: OrderSnapshot,
    ):
        """
        Grants licenses for digital and audio formats purchased in the order.
        """

        for item in snapshot.items:
            book = item.book
            book_format = item.book_format

            if book_format.format_type not in (
                BookFormat.FormatType.DIGITAL,
                BookFormat.FormatType.AUDIO,
            ):
                continue

            License.objects.update_or_create(
                user=self.user,
                book=book,
                book_format=book_format,
                defaults={
                    "order": order,
                    "is_active": True,
                    "valid_from": timezone.now(),
                    "valid_until": None,
                },
            )

    def _consume_coupon(
        self,
        coupon: DiscountCode | None,
    ):
        """
        Marks a successfully used coupon as consumed.
        """

        if coupon is None:
            return

        coupon.times_used += 1
        coupon.save(update_fields=["times_used"])

    def _clear_cart(
        self,
        cart: Cart,
    ):
        """
        Removes all items from the customer's cart after a successful checkout.
        """

        cart.items.all().delete()

    @transaction.atomic
    def checkout(self, cart: Cart, shipping_data: dict):
        """
        Executes the complete checkout workflow.
        """

        if not cart.items.exists():
            raise serializers.ValidationError(_("Your cart is empty."))

        resolved_shipping = self._resolve_shipping_data(cart, shipping_data)

        coupon_code = shipping_data.get("discount_code")

        snapshot = self._build_order_snapshot(
            cart=cart,
            coupon_code=coupon_code,
        )

        try:
            self._charge_wallet(snapshot.total_amount)
        except InsufficientBalanceError as exc:
            raise serializers.ValidationError({
                "wallet": exc.messages
            })

        order = self._create_order(
            snapshot=snapshot,
            shipping_data=resolved_shipping,
        )


        # Wallet payment succeeded, so the order is already paid
        order.status = "PROCESSING"
        order.save(update_fields=["status"])

        self._create_order_items(order, snapshot)
        self._grant_licenses(order, snapshot)
        self._consume_coupon(snapshot.applied_coupon)
        self._clear_cart(cart)

        return order

    @transaction.atomic
    def cancel_order(self, order: Order):
        if order.user != self.user:
            raise serializers.ValidationError(_("You cannot cancel this order."))

        if not order.can_cancel():
            raise serializers.ValidationError(_("This order cannot be cancelled."))

        # Refund wallet
        WalletService.deposit(
            user=self.user,
            amount=order.total_amount,
            transaction_type="REFUND",
            description=f"Refund for Order #{order.pk}",
        )

        # Revoke licenses
        License.objects.filter(
            user=self.user,
            order=order,
        ).update(is_active=False)

        order.mark_refunded()

        return order