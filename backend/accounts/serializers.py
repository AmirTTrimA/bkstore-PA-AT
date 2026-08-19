from cart.models import Order  # Import Order model for history
from content.models import License  # Import License model for digital access
from dj_rest_auth.serializers import PasswordResetSerializer
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from pricing.models import SubscriptionPlan  # Import Subscription models
from pricing.models import UserSubscription
from rest_framework import serializers

from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration and creating a new User instance."""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2")
        extra_kwargs = {
            "email": {"required": True, "label": _("Email Address")},
            "username": {"required": True, "label": _("Username")},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": _("Password fields didn't match.")}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user

def frontend_password_reset_url(request, user, temp_key):
        """
        Generate the password-reset URL that the user receives by email.

        Token generation and validation remain the backend's responsibility,
        while the reset form itself is served by the frontend application.
        """
        from allauth.account.utils import user_pk_to_url_str

        uid = user_pk_to_url_str(user)
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        return f"{frontend_url}/reset-password/{uid}/{temp_key}/"


class CustomPasswordResetSerializer(PasswordResetSerializer):
    """
    Password-reset serializer that directs users to the frontend reset page.
    """

    def get_email_options(self):
        return {
            "url_generator": frontend_password_reset_url,
        }


class OTPVerificationSerializer(serializers.Serializer):
    """Input serializer for OTP verification."""

    code = serializers.CharField(
        max_length=6,
        required=True,
        label=_("One-Time Code"),
        help_text=_("The 6-digit code received via email."),
    )


class OTPRequestSerializer(serializers.Serializer):
    """Serializer to accept username or email for initiating OTP request."""

    username_or_email = serializers.CharField(
        required=True, label=_("Username or Email")
    )


class OTPLoginSerializer(serializers.Serializer):
    """Serializer for authenticating a user using a username/email and an OTP code."""

    username_or_email = serializers.CharField(
        required=True, label=_("Username or Email")
    )
    code = serializers.CharField(max_length=6, required=True, label=_("One-Time Code"))

    def validate(self, data):
        identifier = data.get("username_or_email")

        # Validate that the identifier corresponds to an existing user
        if "@" in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
            except User.DoesNotExist:
                raise serializers.ValidationError(_("Invalid credentials."))
        else:
            try:
                user = User.objects.get(username__iexact=identifier)
            except User.DoesNotExist:
                raise serializers.ValidationError(_("Invalid credentials."))

        # Attach the user instance for the view to use
        data["user"] = user
        return data


# --- 2. SUBSCRIPTION SERIALIZER (For Nesting in Profile Hub) ---


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying a user's active subscription status.
    Source: pricing.models
    """

    plan_name = serializers.CharField(source="plan.name", read_only=True)
    discount_percent = serializers.IntegerField(
        source="plan.digital_discount_percent", read_only=True
    )
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = [
            "plan_name",
            "discount_percent",
            "start_date",
            "end_date",
            "is_current",
        ]

    def get_is_current(self, obj):
        # Calls the is_current method defined on the UserSubscription model
        return obj.is_current()


# --- 3. NESTED ORDER/LICENSE SERIALIZERS (For User Profile Hub) ---


class LicenseSerializer(serializers.ModelSerializer):
    """Serializer for displaying a user's content licenses."""

    book_id = serializers.IntegerField(
        source="book.id",
        read_only=True,
    )

    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )

    book_slug = serializers.CharField(
        source="book.slug",
        read_only=True,
    )

    book_format_id = serializers.IntegerField(
        source="book_format.id",
        read_only=True,
    )

    format_type = serializers.CharField(
        source="book_format.format_type",
        read_only=True,
    )

    format_name = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = License
        fields = [
            "id",
            "book_id",
            "book_title",
            "book_slug",
            "book_format_id",
            "format_type",
            "format_name",
            "is_active",
            "valid_from",
            "valid_until",
            "is_valid",
        ]

    def get_format_name(self, obj):
        return obj.book_format.get_format_type_display()

    def get_is_valid(self, obj):
        return obj.is_valid()


class OrderHistorySerializer(serializers.ModelSerializer):
    """Serializer for displaying summary of an Order (for user history)."""

    items_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "created_at", "total_amount", "status_display", "items_count"]

    def get_items_count(self, obj):
        # Assumes Order model has a related_name 'items' pointing to OrderItem
        return obj.items.count()


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Master serializer for the User Profile Hub. Nests all required data.
    """

    # 1. Active Subscription: Uses the UserSubscriptionSerializer
    # Assumes related_name 'subscription' on User model (from pricing app)
    active_subscription = UserSubscriptionSerializer(
        source="subscription", read_only=True
    )

    # 2. Licenses: Fetches all associated licenses
    # Assumes related_name 'licenses' on User model (from content app)
    licenses = LicenseSerializer(many=True, read_only=True)

    # 3. Orders: Fetches all past orders
    # Uses reverse relation/related_name 'order_set' (or custom name if set on Order model)
    orders = OrderHistorySerializer(source="order_set", many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "job_or_major",
            "hobbies_or_likings",
            # Nested fields below:
            "active_subscription",
            "licenses",
            "orders",
        ]
        read_only_fields = fields  # Profile is read-only for this endpoint
