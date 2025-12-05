from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
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
