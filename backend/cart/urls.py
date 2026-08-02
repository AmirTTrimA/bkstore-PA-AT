# cart/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CartItemHandlerView, CartMergeView, CheckoutView, WishlistViewSet

# Create a router for the Wishlist ViewSet
router = DefaultRouter()
router.register(r"wishlist", WishlistViewSet, basename="wishlist")

urlpatterns = [
    # GET, POST, DELETE /api/v1/cart/items/
    path("items/", CartItemHandlerView.as_view(), name="cart-items"),
    # POST /api/v1/cart/merge/
    path("merge/", CartMergeView.as_view(), name="cart-merge"),
    # POST /api/v1/cart/checkout/
    path("checkout/", CheckoutView.as_view(), name="cart-checkout"),
    # Wishlist endpoints
    path("", include(router.urls)),
    # The checkout/order submission view will be added later
]
