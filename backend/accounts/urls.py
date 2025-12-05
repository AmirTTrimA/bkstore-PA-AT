from dj_rest_auth.views import PasswordResetConfirmView, PasswordResetView
from django.urls import path, re_path
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import OTPLoginView, OTPRequestView, OTPVerifyView, UserRegistrationView

urlpatterns = [
    # --- Standard JWT Authentication ---
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="logout"),
    # --- Passwordless Login Flow (OTP Steps) ---
    path(
        "otp/request/", OTPRequestView.as_view(), name="otp-request"
    ),  # Step 1: Request code
    path(
        "login/otp/", OTPLoginView.as_view(), name="login-otp"
    ),  # Step 2: Login with code
    path(
        "otp/verify/", OTPVerifyView.as_view(), name="otp-verify"
    ),  # 2FA / Re-verify identity
    # --- Password Reset Flow ---
    path("password/reset/", PasswordResetView.as_view(), name="password_reset"),
    # Required pattern for internal email link generation (complex regex)
    re_path(
        r"^password/reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,32}-[0-9A-Za-z]{1,64})/$",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    # The actual API endpoint the frontend POSTs to
    path("password/reset/confirm/", PasswordResetConfirmView.as_view()),
]
