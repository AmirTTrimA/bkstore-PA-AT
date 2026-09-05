# accounts/urls.py
from dj_rest_auth.views import PasswordResetConfirmView, PasswordResetView
from django.urls import path, re_path
from rest_framework_simplejwt.views import (TokenBlacklistView,
                                            TokenObtainPairView,
                                            TokenRefreshView)

from .views import (AddressDetailView, AddressListCreateView,
                    OTPLoginView, OTPRequestView, OTPVerifyView,
                    PasswordChangeView, UserProfileUpdateView, UserProfileView,
                    UserRegistrationView)


urlpatterns = [
    # --- JWT Token Management ---
    path(
        "register/",
        UserRegistrationView.as_view(),
        name="register"
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login"
    ),
    # NEW LOGIN ROUTE: OTP Login (for unauthenticated users)
    path(
        "login/otp/",
        OTPLoginView.as_view(),
        name="login-otp"
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh"
    ),
    path(
        "logout/",
        TokenBlacklistView.as_view(),
        name="logout"
    ),
    # --- Password Reset Flow ---
    path(
        "password/reset/",
        PasswordResetView.as_view(),
        name="password_reset"
    ),
    # 1. The Complex URL (REQUIRED for link generation, must have arguments)
    re_path(
        r"^password/reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,32}-[0-9A-Za-z]{1,64})/$",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",  # 🔑 FIX: Keep the original name for the link generation to work
    ),
    # 2. The simple API endpoint for POST requests (The actual API the test should reverse)
    # 🔑 FIX: We will name this endpoint differently and update the test file.
    path(
        "password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm_post",
    ),
    # --- OTP/2FA Logic (Custom Views) ---
    path(
        "otp/request/",
        OTPRequestView.as_view(),
        name="otp-request"
    ),
    path(
        "otp/verify/",
        OTPVerifyView.as_view(),
        name="otp-verify"
    ),
    # --- User Profile Hub (NEW) ---
    path(
        "profile/",
        UserProfileView.as_view(),
        name="profile",
    ),
    path(
        "profile/update/",
        UserProfileUpdateView.as_view(),
        name="profile-update",
    ),
    path(
        "password/change/",
        PasswordChangeView.as_view(),
        name="password-change",
    ),
    # --- Saved Addresses ---
    path(
        "addresses/",
        AddressListCreateView.as_view(),
        name="address-list-create",
    ),
    path(
        "addresses/<int:pk>/",
        AddressDetailView.as_view(),
        name="address-detail",
    ),
]

