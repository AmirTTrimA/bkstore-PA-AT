from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from .views import UserRegistrationView

urlpatterns = [
    # Custom registration view
    path("register/", UserRegistrationView.as_view(), name="register"),
    # Simple JWT's built-in views for token management
    path(
        "login/", TokenObtainPairView.as_view(), name="login"
    ),  # Generates access/refresh tokens
    path(
        "refresh/", TokenRefreshView.as_view(), name="refresh"
    ),  # Refreshes access token
    # TokenBlacklistView is used for logout (invalidates refresh token)
    path("logout/", TokenBlacklistView.as_view(), name="logout"),
]
