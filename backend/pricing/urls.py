# pricing/urls.py
from django.urls import path

from .views import (BookPriceListCreateView, DiscountValidationView,
                    SubscriptionPlanListView, UserSubscriptionDetailView)

urlpatterns = [
    # GET /api/v1/pricing/plans/ -> List all available subscription plans
    path("plans/", SubscriptionPlanListView.as_view(), name="plan-list"),
    # GET /api/v1/pricing/subscription/ -> Get logged-in user's active plan/discount
    path(
        "subscription/", UserSubscriptionDetailView.as_view(), name="user-subscription"
    ),
    # POST /api/v1/pricing/validate/ -> Validate a single promo code
    path("validate/", DiscountValidationView.as_view(), name="discount-validate"),
    path(
    "books/<int:book_id>/prices/",
    BookPriceListCreateView.as_view(),
    name="book-price-list-create",
),
]
