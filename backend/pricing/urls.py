# pricing/urls.py
from django.urls import path

from .views import (BookPriceListCreateView,  # UserSubscriptionDetailView)
                    DiscountValidationView, MySubscriptionView,
                    SubscriptionPlanListView, SubscriptionPurchaseView,
                    SubscriptionUpgradeView, SubscriptionCancelView)

urlpatterns = [
    # GET /api/v1/pricing/plans/ -> List all available subscription plans
    path("plans/", SubscriptionPlanListView.as_view(), name="plan-list"),
    # GET /api/v1/pricing/subscription/ -> Get logged-in user's active plan/discount
    # path(
    #     "subscription/", UserSubscriptionDetailView.as_view(), name="user-subscription"
    # ),
    # POST /api/v1/pricing/validate/ -> Validate a single promo code
    path("validate/", DiscountValidationView.as_view(), name="discount-validate"),
    path(
    "books/<int:book_id>/prices/",
    BookPriceListCreateView.as_view(),
    name="book-price-list-create",
    ),
    path(
        "subscriptions/",
        SubscriptionPlanListView.as_view(),
        name="subscription-plan-list",
    ),
    path(
        "subscriptions/me/",
        MySubscriptionView.as_view(),
        name="my-subscriptions",
    ),
    path(
        "subscriptions/purchase/",
        SubscriptionPurchaseView.as_view(),
        name="subscription-purchase",
    ),
    path(
        "subscriptions/upgrade/",
        SubscriptionUpgradeView.as_view(),
        name="subscription-upgrade",
    ),
    path(
        "subscriptions/cancel/",
        SubscriptionCancelView.as_view(),
        name="subscription-cancel",
    ),
]
