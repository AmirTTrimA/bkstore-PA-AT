# pricing/serializers.py
from decimal import Decimal

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import DiscountCode, Price, SubscriptionPlan, UserSubscription

# -------------------------------------------------------------
# 1. SUBSCRIPTION SERIALIZERS
# -------------------------------------------------------------


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for displaying available Subscription Plans."""

    class Meta:
        model = SubscriptionPlan
        fields = ("slug", "name", "monthly_price", "digital_discount_percent")
        # We only list active plans in the views
        read_only_fields = fields


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the GET /api/v1/pricing/subscription/ endpoint.
    Shows the user's active plan details and benefits.
    """

    # 🔑 Nested Serializer: Embeds the plan details within the user's status
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    digital_discount_percent = serializers.IntegerField(
        source="plan.digital_discount_percent", read_only=True
    )

    # Custom field to show if the subscription is currently valid
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = (
            "is_active",
            "plan_name",
            "digital_discount_percent",
            "start_date",
            "end_date",
            "is_current",
        )

    def get_is_current(self, obj):
        """Uses the model method to determine active status based on dates."""
        return obj.is_current()


# -------------------------------------------------------------
# 2. DISCOUNT SERIALIZER
# -------------------------------------------------------------


class DiscountCodeSerializer(serializers.ModelSerializer):
    """
    Serializer used for validating input codes (POST /api/v1/pricing/validate/).
    Outputs the discount information if the code is valid.
    """

    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = DiscountCode
        fields = ("id", "code", "discount_percent", "valid_until", "is_valid")
        read_only_fields = fields

    def get_is_valid(self, obj):
        """Custom logic to check if the code is active and not expired."""
        if not obj.is_active:
            return False
        if obj.valid_until and obj.valid_until < timezone.now():
            return False
        # Note: We do not check max_uses here, as that complex logic belongs in a dedicated validation service
        # that handles concurrency (like during the final order submission).
        return True

# -------------------------------------------------------------
# 3. PRICE SERIALIZERS
# -------------------------------------------------------------


class PriceSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for displaying price history records.
    """

    class Meta:
        model = Price
        fields = (
            "id",
            "value",
            "currency",
            "min_price",
            "effective_from",
            "effective_until",
        )
        read_only_fields = fields


class PriceChangeSerializer(serializers.Serializer):
    """
    Input serializer for changing a book's price.

    This serializer validates the incoming request. It does not create
    a Price object directly; instead, the view delegates to
    Book.change_price().
    """

    value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    currency = serializers.CharField(
        max_length=3,
        default="USD",
    )

    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        """
        Ensures the minimum price does not exceed the selling price.
        """

        value = attrs["value"]
        min_price = attrs.get("min_price")

        if min_price is not None and min_price > value:
            raise serializers.ValidationError(
                {
                    "min_price": _(
                        "Minimum price cannot be greater than the selling price."
                    )
                }
            )

        return attrs

from rest_framework import serializers

from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = (
            "id",
            "name",
            "slug",
            "tier",
            "monthly_price",
            "digital_discount_percent",
        )


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = (
            "id",
            "plan",
            "status",
            "start_date",
            "end_date",
            "auto_renew",
            "created_at",
        )


class SubscriptionPurchaseSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    auto_renew = serializers.BooleanField(
        required=False,
        default=False,
    )


class SubscriptionUpgradeSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()