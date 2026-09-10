from decimal import Decimal

from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from wallet.exceptions import InsufficientBalanceError
from wallet.services import WalletService

from .models import (Discount, DiscountCode, Price, SubscriptionPlan,
                     UserSubscription)


class SubscriptionService:
    """
    Handles subscription lifecycle operations.

    Subscription purchases, upgrades, reservations, renewals, and expiration
    are kept here so they can be used by API views and background tasks
    without coupling business logic to either HTTP or Celery.
    """

    @staticmethod
    def process_expired_subscriptions():
        """
        Processes all subscriptions that have reached their end date.

        Reserved subscriptions take precedence over auto-renewal. If no
        reservation exists, an active subscription may be renewed when
        auto_renew is enabled and the user's wallet has sufficient funds.
        """

        now = timezone.now()

        expired_count = 0
        activated_count = 0
        renewed_count = 0
        failed_renewal_count = 0

        expired_ids = list(
            UserSubscription.objects.filter(
                status=UserSubscription.Status.ACTIVE,
                end_date__lte=now,
            ).values_list("id", flat=True)
        )

        for subscription_id in expired_ids:
            result = SubscriptionService._process_expired_subscription(
                subscription_id
            )

            if result is None:
                continue

            expired_count += 1

            if result == "reserved":
                activated_count += 1
            elif result == "renewed":
                renewed_count += 1
            elif result == "renewal_failed":
                failed_renewal_count += 1

        return {
            "expired": expired_count,
            "reserved_activated": activated_count,
            "renewed": renewed_count,
            "renewal_failed": failed_renewal_count,
        }

    @staticmethod
    @transaction.atomic
    def _process_expired_subscription(subscription_id):
        """
        Processes one expired subscription inside a transaction.

        The subscription is locked before processing so repeated or
        concurrent task execution cannot produce duplicate renewals.
        """

        try:
            subscription = (
                UserSubscription.objects
                .select_for_update()
                .select_related("user", "plan")
                .get(pk=subscription_id)
            )
        except UserSubscription.DoesNotExist:
            return None

        now = timezone.now()

        # Another worker may already have processed it.
        if (
            subscription.status != UserSubscription.Status.ACTIVE
            or subscription.end_date > now
        ):
            return None

        user = subscription.user

        reserved = (
            UserSubscription.objects
            .select_for_update()
            .filter(
                user=user,
                status=UserSubscription.Status.RESERVED,
                start_date=subscription.end_date,
            )
            .order_by("created_at")
            .first()
        )

        if reserved is not None:
            subscription.status = UserSubscription.Status.EXPIRED
            subscription.save(update_fields=["status", "updated_at"])

            reserved.status = UserSubscription.Status.ACTIVE
            reserved.save(update_fields=["status", "updated_at"])

            return "reserved"

        subscription.status = UserSubscription.Status.EXPIRED
        subscription.save(update_fields=["status", "updated_at"])

        if not subscription.auto_renew:
            return "expired"

        try:
            WalletService.withdraw(
                user=user,
                amount=subscription.plan.monthly_price,
                description=(
                    f"Auto-renewal for {subscription.plan.name} subscription"
                ),
            )
        except InsufficientBalanceError:
            return "renewal_failed"

        SubscriptionService._create_active_subscription(
            user=user,
            plan=subscription.plan,
            start_date=subscription.end_date,
            auto_renew=True,
        )

        return "renewed"

    @staticmethod
    def _create_active_subscription(
        user,
        plan,
        start_date,
        auto_renew=False,
    ):
        """
        Creates a new active subscription beginning at start_date.
        """

        return UserSubscription.objects.create(
            user=user,
            plan=plan,
            status=UserSubscription.Status.ACTIVE,
            start_date=start_date,
            end_date=SubscriptionService._calculate_end_date(start_date),
            auto_renew=auto_renew,
        )

    @staticmethod
    def _calculate_end_date(start_date):
        """
        Returns the expiration date for a one-month subscription.
        """
        return start_date + relativedelta(months=1)

    @staticmethod
    def _get_active_subscription(user):
        return (
            UserSubscription.objects
            .filter(
                user=user,
                status=UserSubscription.Status.ACTIVE,
            )
            .select_related("plan")
            .first()
        )

    @staticmethod
    def _get_reserved_subscription(user):
        return (
            UserSubscription.objects
            .filter(
                user=user,
                status=UserSubscription.Status.RESERVED,
            )
            .select_related("plan")
            .first()
        )

    @staticmethod
    def _charge(user, amount, description):
        """
        Charges the user's wallet.
        """

        try:
            WalletService.withdraw(
                user=user,
                amount=amount,
                description=description,
            )
        except InsufficientBalanceError as exc:
            raise serializers.ValidationError({
                "wallet": exc.messages,
            })

    @classmethod
    @transaction.atomic
    def purchase(cls, user, plan, auto_renew=False):
        """
        Purchases a subscription.

        A user without an active subscription receives the plan immediately.

        A user with an active subscription receives a reserved subscription
        beginning when the current subscription expires.

        Payment is collected immediately.
        """

        if not plan.is_active:
            raise serializers.ValidationError({
                "plan": "This subscription plan is not available.",
            })

        active_subscription = cls._get_active_subscription(user)
        reserved_subscription = cls._get_reserved_subscription(user)

        if reserved_subscription is not None:
            raise serializers.ValidationError({
                "subscription": (
                    "You already have a subscription scheduled."
                ),
            })

        cls._charge(
            user=user,
            amount=plan.monthly_price,
            description=f"Subscription purchase: {plan.name}",
        )

        if active_subscription is None:
            start_date = timezone.now()
            status = UserSubscription.Status.ACTIVE
        else:
            start_date = active_subscription.end_date
            status = UserSubscription.Status.RESERVED

        return UserSubscription.objects.create(
            user=user,
            plan=plan,
            status=status,
            start_date=start_date,
            end_date=cls._calculate_end_date(start_date),
            auto_renew=auto_renew,
        )

    @staticmethod
    def _calculate_remaining_value(subscription, now=None):
        """
        Calculates the unused monetary value of the current subscription.
        """

        now = now or timezone.now()

        if now >= subscription.end_date:
            return Decimal("0.00")

        total_seconds = (
            subscription.end_date - subscription.start_date
        ).total_seconds()

        remaining_seconds = (
            subscription.end_date - now
        ).total_seconds()

        if total_seconds <= 0:
            return Decimal("0.00")

        remaining_value = (
            subscription.plan.monthly_price
            * Decimal(str(remaining_seconds))
            / Decimal(str(total_seconds))
        )

        return remaining_value.quantize(Decimal("0.01"))

    @classmethod
    @transaction.atomic
    def upgrade(cls, user, plan):
        """
        Immediately upgrades the user's active subscription.

        The unused value of the current subscription is credited toward
        the new plan.
        """

        if not plan.is_active:
            raise serializers.ValidationError({
                "plan": "This subscription plan is not available.",
            })

        current = cls._get_active_subscription(user)

        if current is None:
            raise serializers.ValidationError({
                "subscription": (
                    "You do not have an active subscription to upgrade."
                ),
            })

        reserved = cls._get_reserved_subscription(user)

        if reserved is not None:
            raise serializers.ValidationError({
                "subscription": (
                    "Cancel your scheduled subscription before upgrading."
                ),
            })

        if plan.tier <= current.plan.tier:
            raise serializers.ValidationError({
                "plan": "The selected plan is not an upgrade.",
            })

        now = timezone.now()

        remaining_value = cls._calculate_remaining_value(
            current,
            now=now,
        )

        upgrade_price = (
            plan.monthly_price - remaining_value
        )

        if upgrade_price < Decimal("0.00"):
            upgrade_price = Decimal("0.00")

        cls._charge(
            user=user,
            amount=upgrade_price,
            description=(
                f"Subscription upgrade: "
                f"{current.plan.name} → {plan.name}"
            ),
        )

        current.status = UserSubscription.Status.EXPIRED
        current.auto_renew = False
        current.save(
            update_fields=[
                "status",
                "auto_renew",
                "updated_at",
            ]
        )

        return UserSubscription.objects.create(
            user=user,
            plan=plan,
            status=UserSubscription.Status.ACTIVE,
            start_date=now,
            end_date=cls._calculate_end_date(now),
            auto_renew=False,
        )

    @classmethod
    @transaction.atomic
    def cancel(cls, user, subscription_id=None, refund=True):
        """
        Cancels a user's active or reserved subscription.

        If subscription_id is provided, cancels that specific subscription
        belonging to the user (must be ACTIVE or RESERVED).
        If subscription_id is not provided:
        - If the user has a RESERVED subscription, it cancels the RESERVED subscription first.
        - Otherwise, it cancels the ACTIVE subscription.

        For a RESERVED subscription:
        Since the user prepaid for a future subscription that has not started,
        the full monthly price is refunded back to the user's wallet.

        For an ACTIVE subscription:
        The subscription status is set to CANCELLED and auto_renew to False.
        If refund is True, the prorated remaining unused monetary value is credited
        back to the user's wallet.
        """
        now = timezone.now()

        if subscription_id is not None:
            try:
                subscription = (
                    UserSubscription.objects
                    .select_for_update()
                    .select_related("plan")
                    .get(
                        id=subscription_id,
                        user=user,
                        status__in=[
                            UserSubscription.Status.ACTIVE,
                            UserSubscription.Status.RESERVED,
                        ],
                    )
                )
            except UserSubscription.DoesNotExist:
                raise serializers.ValidationError({
                    "subscription": "Subscription not found or not eligible for cancellation."
                })
        else:
            subscription = (
                UserSubscription.objects
                .select_for_update()
                .select_related("plan")
                .filter(
                    user=user,
                    status=UserSubscription.Status.RESERVED,
                )
                .order_by("-created_at")
                .first()
            )
            if subscription is None:
                subscription = (
                    UserSubscription.objects
                    .select_for_update()
                    .select_related("plan")
                    .filter(
                        user=user,
                        status=UserSubscription.Status.ACTIVE,
                    )
                    .first()
                )
            if subscription is None:
                raise serializers.ValidationError({
                    "subscription": "You do not have an active or scheduled subscription to cancel."
                })

        refunded_amount = Decimal("0.00")

        if subscription.status == UserSubscription.Status.RESERVED:
            if refund:
                refunded_amount = subscription.plan.monthly_price
                WalletService.deposit(
                    user=user,
                    amount=refunded_amount,
                    description=f"Refund for cancelled scheduled subscription: {subscription.plan.name}",
                )
        elif subscription.status == UserSubscription.Status.ACTIVE:
            if refund:
                remaining_value = cls._calculate_remaining_value(subscription, now=now)
                if remaining_value > Decimal("0.00"):
                    refunded_amount = remaining_value
                    WalletService.deposit(
                        user=user,
                        amount=refunded_amount,
                        description=f"Refund for cancelled subscription: {subscription.plan.name}",
                    )

        subscription.status = UserSubscription.Status.CANCELLED
        subscription.auto_renew = False
        subscription.save(
            update_fields=[
                "status",
                "auto_renew",
                "updated_at",
            ]
        )

        return subscription, refunded_amount
