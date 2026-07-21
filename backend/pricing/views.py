# pricing/views.py
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import DiscountCode, SubscriptionPlan, UserSubscription
from .serializers import (DiscountCodeSerializer, SubscriptionPlanSerializer,
                          UserSubscriptionSerializer)

# -------------------------------------------------------------
# 1. SUBSCRIPTION ENDPOINTS
# -------------------------------------------------------------


class SubscriptionPlanListView(generics.ListAPIView):
    """
    API endpoint to list all active subscription plans.
    Maps to GET /api/v1/pricing/plans/
    """

    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]

    # Only show plans marked as active
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by("monthly_price")


class UserSubscriptionDetailView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve the current subscription status and benefits of the logged-in user.
    Maps to GET /api/v1/pricing/subscription/
    """

    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Retrieves the UserSubscription object for the current authenticated user.
        If no subscription exists, creates a new, inactive record to avoid crashing.
        """
        user = self.request.user

        # We use get_or_create to ensure every authenticated user has a UserSubscription row,
        # even if it's inactive (is_active=False), making lookups safer.
        user_sub, created = UserSubscription.objects.get_or_create(
            user=user,
            defaults={"is_active": False, "plan": SubscriptionPlan.objects.first()},
        )

        # Edge Case Handling: If a user somehow has a subscription but the plan was deleted,
        # we try to ensure a valid plan exists for the FK. For simplicity, we ensure
        # the user gets the first available plan if their current one is gone (or the default was NULL).
        if user_sub.plan is None:
            default_plan = SubscriptionPlan.objects.first()
            if default_plan:
                user_sub.plan = default_plan
                user_sub.save()
            else:
                # If no plans exist at all, we can't determine discount, so we return inactive.
                user_sub.is_active = False
                user_sub.save()

        return user_sub


# -------------------------------------------------------------
# 2. DISCOUNT VALIDATION ENDPOINT
# -------------------------------------------------------------


class DiscountValidationView(generics.GenericAPIView):
    """
    Validates a single discount code based on its active status and expiration date.
    Maps to POST /api/v1/pricing/validate/
    """

    permission_classes = [AllowAny]

    # Define an input serializer for the code field
    class InputSerializer(serializers.Serializer):
        code = serializers.CharField(max_length=50, required=True)

    def post(self, request, *args, **kwargs):
        input_serializer = self.InputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        code_input = input_serializer.validated_data["code"]

        try:
            # 1. Find the code, matching case-insensitively
            discount_code = DiscountCode.objects.get(code__iexact=code_input)
        except DiscountCode.DoesNotExist:
            # Security measure: Always return a generic error message for invalid codes
            return Response(
                {"detail": _("Invalid discount code.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Use the DiscountCodeSerializer to check active status and expiration (is_valid field)
        output_serializer = DiscountCodeSerializer(discount_code)

        if output_serializer.data["is_valid"]:
            # Return full discount details if valid
            return Response(output_serializer.data, status=status.HTTP_200_OK)
        else:
            # Return generic error if found but invalid/expired
            return Response(
                {"detail": _("Invalid or expired discount code.")},
                status=status.HTTP_400_BAD_REQUEST,
            )
