from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import DiscountCode, SubscriptionPlan, UserSubscription

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
