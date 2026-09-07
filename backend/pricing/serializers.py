# pricing/serializers.py
from decimal import Decimal

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import DiscountCode, Price, SubscriptionPlan, UserSubscription

# -------------------------------------------------------------
# 2. DISCOUNT SERIALIZER
# -------------------------------------------------------------


class DiscountCodeSerializer(serializers.ModelSerializer):
    """
    Serializer used for validating input codes (POST /api/v1/pricing/validate/).
    Outputs the discount information if the code is valid.
    """

    name = serializers.CharField(source="discount.name", read_only=True)
    discount_type = serializers.CharField(
        source="discount.discount_type", read_only=True
    )
    value = serializers.DecimalField(
        source="discount.value", max_digits=15, decimal_places=0, read_only=True
    )
    is_valid = serializers.SerializerMethodField()
    is_percentage = serializers.SerializerMethodField()

    class Meta:
        model = DiscountCode
        fields = (
            "id",
            "code",
            "name",
            "discount_type",
            "value",
            "is_valid",
            "is_percentage",
        )
        read_only_fields = fields

    def get_is_valid(self, obj):
        if not obj.is_active:
            return False
        if obj.max_uses is not None and obj.times_used >= obj.max_uses:
            return False
        if not obj.discount or not obj.discount.is_active_now():
            return False
        return True

    def get_is_percentage(self, obj):
        if not obj.discount:
            return False
        return str(obj.discount.discount_type).upper() in (
            "PERCENT",
            "PERCENTAGE",
        )

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
        max_digits=15,
        decimal_places=0,
        min_value=Decimal("1"),
    )

    min_price = serializers.DecimalField(
        max_digits=15,
        decimal_places=0,
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


class SubscriptionCancelSerializer(serializers.Serializer):
    subscription_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    refund = serializers.BooleanField(
        required=False,
        default=True,
    )