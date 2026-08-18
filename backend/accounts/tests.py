import base64
import json
from datetime import timedelta
from decimal import Decimal

from cart.models import Order, OrderItem
from content.models import License
# 🔑 FIX: Use apps.get_model for reliable access to token models in tests
from django.apps import apps
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.urls import reverse
from django.utils import timezone
from django.utils.encoding import force_str  # Import for localization fixes
from django.utils.http import urlsafe_base64_decode
from django.utils.translation import gettext_lazy as _
from pricing.models import SubscriptionPlan  # 🔑 New imports for setup
from pricing.models import UserSubscription
from rest_framework import status
from rest_framework.test import APITestCase

# Get the custom User model
User = get_user_model()
# 🔑 FIX: Get the token blacklist models via apps.get_model()
OutstandingToken = apps.get_model("token_blacklist", "OutstandingToken")
BlacklistedToken = apps.get_model("token_blacklist", "BlacklistedToken")


class AuthAPITestCase(APITestCase):
    """
    Comprehensive test suite for the Accounts application's API endpoints.
    Verifies JWT token management, user registration, and custom OTP flows.
    """

    def setUp(self):
        """Set up test data and variables."""
        self.user_data = {
            "username": "testuser_setup",
            "email": "setup@example.com",
            # 🔑 FIX: Use a stronger password to pass Django's validators (min 8 chars)
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!",
            "job_or_major": "Software Engineer",
            "hobbies_or_likings": "Reading, Hiking",
        }
        self.login_data = {
            "username": "testuser_setup",
            "password": "StrongPassword123!",  # 🔑 FIX: Match the strong password
        }

        # Endpoints
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.refresh_url = reverse("refresh")
        self.logout_url = reverse("logout")
        self.password_reset_url = reverse("password_reset")
        self.otp_request_url = reverse("otp-request")
        self.otp_verify_url = reverse("otp-verify")
        self.login_otp_url = reverse("login-otp")

        # FIX: Remove 'password2' and profile data from model creation in setUp
        user_creation_data = self.user_data.copy()
        user_creation_data.pop("password2")
        user_creation_data.pop("job_or_major")
        user_creation_data.pop("hobbies_or_likings")

        # Create a test user for login/auth checks
        self.user = User.objects.create_user(**user_creation_data)
        self.authenticated_token = self._get_auth_token(self.login_data)

    def _get_auth_token(self, credentials):
        """Helper to log in and return the access token."""
        response = self.client.post(self.login_url, credentials, format="json")
        return response.data["access"]

    # --- 1. CORE JWT & REGISTRATION TESTS ---

    def test_registration_success(self):
        """Test successful user registration."""
        # Test registering a new user (not the one in setUp)
        new_user_data = {
            "username": "testuser_success",
            "email": "success@test.com",
            "password": "StrongPwd123!",  # 🔑 FIX: Stronger password
            "password2": "StrongPwd123!",
            "job_or_major": "Data Scientist",
            "hobbies_or_likings": "Coding, Running",
        }
        response = self.client.post(self.register_url, new_user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 🔑 FIX: Assert against the response content bytes for reliability
        self.assertIn(
            force_str(_("User created successfully.")).encode("utf-8"), response.content
        )

    def test_registration_password_mismatch(self):
        """Test registration fails on password mismatch."""
        mismatch_data = {
            "username": "testuser_mismatch",
            "email": "mismatch@test.com",
            "password": "StrongPwd123!",  # 🔑 FIX: Stronger password
            "password2": "WrongPassword",  # Mismatch
            "job_or_major": "Student",
            "hobbies_or_likings": "Gaming",
        }
        response = self.client.post(self.register_url, mismatch_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # 🔑 FIX: Assert against the response content bytes for reliability
        self.assertIn(
            force_str(_("Password fields didn't match.")).encode("utf-8"),
            response.content,
        )

    def test_login_success(self):
        """Test successful login returns access and refresh tokens."""
        response = self.client.post(self.login_url, self.login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_logout_success(self):
        """Test logout successfully blacklists the refresh token."""
        response_login = self.client.post(
            self.login_url, self.login_data, format="json"
        )
        refresh_token_str = response_login.data["refresh"]

        # 🔑 FIX: OutstandingToken access is now reliable
        token_object = OutstandingToken.objects.get(token=refresh_token_str)

        # Send logout request
        response_logout = self.client.post(
            self.logout_url, {"refresh": refresh_token_str}, format="json"
        )
        # FIX: Accept 200 or 204 status codes for logout dependency
        self.assertIn(
            response_logout.status_code,
            [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT],
        )

        # FIX: Verify token is in the blacklist model (reliable check vs. API status)
        self.assertTrue(BlacklistedToken.objects.filter(token=token_object).exists())

        # Attempt to refresh token after logout (should fail)
        response_refresh = self.client.post(
            self.refresh_url, {"refresh": refresh_token_str}, format="json"
        )
        self.assertEqual(response_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- 2. PASSWORD RESET TESTS (dj-rest-auth) ---

    def test_password_reset_request_success(self):
        """Test password reset request sends an email and responds 200 OK."""
        # Clear the outbox first to count the email
        mail.outbox = []

        response = self.client.post(
            self.password_reset_url, {"email": self.user.email}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that exactly one email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.email, mail.outbox[0].to)

    def test_password_reset_confirm_success(self):
        """Test successful password reset confirmation."""
        # 1. Manually generate UID and token (simulating clicking the email link)

        # We must call the view to generate the actual token used in the email/form submission flow.
        # This is the most reliable way to get a token that dj-rest-auth's serializer will accept.
        self.client.post(
            self.password_reset_url, {"email": self.user.email}, format="json"
        )

        # Get the email from the outbox
        email_content = mail.outbox[0].body

        # Extract UID and Token from the generated link (using the format from the terminal)
        # Link pattern is usually: .../reset/confirm/<uidb64>/<token>/
        import re

        match = re.search(
            r"reset-password/([^/]+)/([^/]+)/",
            email_content,
        )

        self.assertIsNotNone(
            match,
            "Password reset email did not contain a frontend reset URL.",
        )

        uid = match.group(1)
        token = match.group(2)

        new_password = "NewSecurePassword456!"
        confirm_data = {
            # FIX: We now use the actual token and uid extracted from the test environment's email output.
            "uid": uid,
            "token": token,
            "new_password1": new_password,
            "new_password2": new_password,
        }

        # 2. POST to the confirmation endpoint (using the simple URL that accepts JSON)
        response = self.client.post(
            reverse(
                "password_reset_confirm_post"
            ),  # 🔑 FIX: Use the simple POST endpoint name
            confirm_data,
            format="json",
        )

        # 3. Assert status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Verify user can log in with the new password
        self.user.refresh_from_db()

        login_check = self.client.post(
            self.login_url,
            {"username": self.user.username, "password": new_password},
            format="json",
        )

        self.assertEqual(login_check.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_check.data)

    # --- 3. CUSTOM OTP & PASSWORDLESS LOGIN TESTS ---

    def test_otp_request_sends_code(self):
        """Test unauthenticated user can request OTP code via email."""
        mail.outbox = []
        request_data = {"username_or_email": self.user.email}

        response = self.client.post(self.otp_request_url, request_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        # Check that the code was saved to the DB
        otp_entry = self.user.otp_codes.order_by("-created_at").first()
        self.assertIsNotNone(otp_entry)
        self.assertEqual(len(otp_entry.code), 6)

        # Clean up the email queue
        mail.outbox = []

    def test_otp_request_security_hiding_non_user(self):
        """Test request succeeds (200 OK) even if user doesn't exist for security."""
        request_data = {"username_or_email": "nonexistent@user.com"}
        response = self.client.post(self.otp_request_url, request_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)  # No email should be sent

    def test_otp_login_success(self):
        """Test successful passwordless login using username and OTP code."""
        # 1. Request the OTP code (Passwordless Step 1)
        self.client.post(
            self.otp_request_url, {"username_or_email": self.user.email}, format="json"
        )
        otp_entry = self.user.otp_codes.order_by("-created_at").first()
        valid_code = otp_entry.code

        login_data = {"username_or_email": self.user.username, "code": valid_code}

        # 2. Attempt login with OTP (Passwordless Step 2)
        response = self.client.post(self.login_otp_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", response.data)

        # 3. Verify OTP code was consumed (invalidated)
        otp_entry.refresh_from_db()
        self.assertFalse(otp_entry.is_valid)

    def test_otp_login_failure_invalid_code(self):
        """Test passwordless login fails with an incorrect code."""
        # 1. Request code (to create a valid entry)
        self.client.post(
            self.otp_request_url, {"username_or_email": self.user.email}, format="json"
        )

        login_data = {
            "username_or_email": self.user.username,
            "code": "000000",  # Invalid code
        }

        # 2. Attempt login with invalid OTP
        response = self.client.post(self.login_otp_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # FIX: Force translation proxy to string for assertion
        self.assertIn(
            force_str(_("Invalid username/email or OTP code.")), response.data["detail"]
        )

    def test_otp_verify_2fa_success(self):
        """Test an already authenticated user can verify identity via /otp/verify/."""
        # 1. Request code for the logged-in user
        self.client.post(
            self.otp_request_url, {"username_or_email": self.user.email}, format="json"
        )
        otp_entry = self.user.otp_codes.order_by("-created_at").first()
        valid_code = otp_entry.code

        verify_data = {"code": valid_code}

        # 2. Authenticate and verify
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.authenticated_token)
        response = self.client.post(self.otp_verify_url, verify_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # FIX: Force translation proxy to string for assertion
        self.assertIn(
            force_str(_("OTP verified successfully. User is authenticated.")),
            response.data["detail"],
        )

        # 3. Verify code consumed
        otp_entry.refresh_from_db()
        self.assertFalse(otp_entry.is_valid)

    class UserProfileTest(APITestCase):
        """Tests the User Profile Hub (GET /api/v1/auth/profile/) endpoint."""

        @classmethod
        def setUpTestData(cls):
            cls.user_profile = User.objects.create_user(
                username="hub_user",
                email="hub@example.com",
                password="testpassword",
                job_or_major="Testing Engineer",
            )
            cls.profile_url = reverse("user-profile")
            cls.login_url = reverse("login")

            # Setup supporting data for nested serialization
            cls.plan = SubscriptionPlan.objects.create(
                name="Basic",
                slug="basic",
                monthly_price=Decimal("5.00"),
                digital_discount_percent=10,
            )
            cls.sub = UserSubscription.objects.create(
                user=cls.user_profile,
                plan=cls.plan,
                is_active=True,
                start_date=timezone.now() - timedelta(days=5),
                end_date=timezone.now() + timedelta(days=360),
            )

            # Setup an Order and a License
            cls.order = Order.objects.create(
                user=cls.user_profile,
                subtotal=Decimal("25.00"),
                total_amount=Decimal("22.50"),
            )

            # Note: Book models are required but not explicitly created here for brevity,
            # assuming previous test classes have populated the necessary tables.
            # We skip OrderItem and License creation for simplicity and rely on model counts.

        def setUp(self):
            response = self.client.post(
                self.login_url,
                {"username": "hub_user", "password": "testpassword"},
                format="json",
            )
            self.auth_token = response.data["access"]
            self.client.credentials(HTTP_AUTHORIZATION="Bearer " + self.auth_token)

        def test_01_unauthenticated_access_denied(self):
            """Tests that unauthenticated access is denied."""
            self.client.credentials()  # Clear credentials
            response = self.client.get(self.profile_url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        def test_02_profile_retrieval_success_and_base_fields(self):
            """Tests successful retrieval and checks core fields."""
            response = self.client.get(self.profile_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("username", response.data)
            self.assertIn("job_or_major", response.data)
            self.assertEqual(response.data["username"], "hub_user")

        def test_03_nested_subscription_data(self):
            """Tests that subscription data is correctly nested."""
            response = self.client.get(self.profile_url)

            sub_data = response.data["active_subscription"]
            self.assertIsNotNone(sub_data)
            self.assertEqual(sub_data["plan_name"], self.plan.name)
            self.assertEqual(
                sub_data["discount_percent"], self.plan.digital_discount_percent
            )
            self.assertTrue(sub_data["is_current"])

        def test_04_nested_orders_data(self):
            """Tests that order history is correctly nested and formatted."""
            # Setup one order item to ensure the count is correct
            # Note: We need a valid book for OrderItem, assuming one exists from other test setups
            from catalog.models import Book

            book = Book.objects.first()
            if book:
                OrderItem.objects.create(
                    order=self.order,
                    book=book,
                    quantity=1,
                    snapshot_price=Decimal("25.00"),
                    snapshot_title="Mock Item",
                    snapshot_author_name="Mock Author",
                )

            response = self.client.get(self.profile_url)

            orders_data = response.data["orders"]
            self.assertTrue(isinstance(orders_data, list))
            self.assertGreaterEqual(
                len(orders_data), 1
            )  # Should contain at least the one created order

            first_order = orders_data[0]
            self.assertEqual(first_order["total_amount"], "22.50")
            self.assertIn("items_count", first_order)
            self.assertIn("status_display", first_order)

        def test_05_nested_licenses_data(self):
            """Tests that license history is correctly nested."""
            from catalog.models import Book

            book = Book.objects.first()
            if book:
                License.objects.create(
                    user=self.user_profile, book=book, order=self.order, is_active=True
                )

            response = self.client.get(self.profile_url)

            licenses_data = response.data["licenses"]
            self.assertTrue(isinstance(licenses_data, list))
            self.assertGreaterEqual(len(licenses_data), 1)

            first_license = licenses_data[0]
            self.assertTrue(first_license["is_valid"])
            self.assertIn("book_title", first_license)
