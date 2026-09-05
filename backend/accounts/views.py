import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, status
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, OTPCode, User
from .serializers import (
    AddressSerializer,
    OTPLoginSerializer,
    OTPRequestSerializer,
    OTPVerificationSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer,
)


logger = logging.getLogger(__name__)


class UserRegistrationView(generics.CreateAPIView):
    """API endpoint for user registration."""

    serializer_class = UserRegistrationSerializer
    permission_classes = ()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"detail": _("User created successfully.")}, status=status.HTTP_201_CREATED
        )


class OTPRequestView(generics.GenericAPIView):
    """
    Initiates Passwordless Login (Step 1). Finds the user by identifier and sends an OTP code.
    Maps to POST /api/v1/auth/otp/request/
    """

    permission_classes = ()
    serializer_class = OTPRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["username_or_email"]

        try:
            # Replicate user lookup logic from serializer validation
            if "@" in identifier:
                user = User.objects.get(email__iexact=identifier)
            else:
                user = User.objects.get(username__iexact=identifier)
        except User.DoesNotExist:
            # Security measure: return success even if user not found to prevent enumeration
            return Response(
                {
                    "detail": _(
                        "If an account exists, an OTP has been sent to the email."
                    )
                },
                status=status.HTTP_200_OK,
            )

        if not user.email:
            return Response(
                {
                    "detail": _(
                        "User must have a registered email address to receive OTP."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Invalidate any previous valid codes for this user
        OTPCode.objects.filter(user=user, is_valid=True).update(is_valid=False)

        # 2. Create the new code (code is generated in the model's save method)
        new_otp_entry = OTPCode.objects.create(user=user)
        latest_otp_code = new_otp_entry.code

        # 3. Send Email
        send_mail(
            subject=_("Your One-Time Password (OTP)"),
            message=f"Your verification code is: {latest_otp_code}. It is valid for 5 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"detail": _("If an account exists, an OTP has been sent to the email.")},
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(generics.GenericAPIView):
    """
    Used for 2FA/Re-verification. Verifies the OTP provided by the authenticated user.
    Maps to POST /api/v1/auth/otp/verify/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = OTPVerificationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        input_code = serializer.validated_data["code"]

        # Look up the most recent valid code
        otp_entry = (
            OTPCode.objects.filter(user=request.user, code=input_code, is_valid=True)
            .order_by("-created_at")
            .first()
        )

        if not otp_entry or otp_entry.is_expired():
            # Invalidate expired entry if found
            if otp_entry and otp_entry.is_expired():
                otp_entry.is_valid = False
                otp_entry.save()

            return Response(
                {"detail": _("Invalid or expired OTP.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Code is valid! Invalidate it immediately so it can't be reused
        otp_entry.is_valid = False
        otp_entry.save()

        return Response(
            {"detail": _("OTP verified successfully. User is authenticated.")},
            status=status.HTTP_200_OK,
        )


class OTPLoginView(generics.GenericAPIView):
    """
    Passwordless Login (Step 2). Authenticates user with identifier and OTP code, issuing JWTs.
    Maps to POST /api/v1/auth/login/otp/
    """

    permission_classes = ()
    serializer_class = OTPLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        input_code = serializer.validated_data["code"]

        # 1. Look up the most recent valid code
        otp_entry = (
            OTPCode.objects.filter(user=user, code=input_code, is_valid=True)
            .order_by("-created_at")
            .first()
        )

        if not otp_entry or otp_entry.is_expired():
            if otp_entry and otp_entry.is_expired():
                otp_entry.is_valid = False
                otp_entry.save()

            return Response(
                {"detail": _("Invalid username/email or OTP code.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Code is valid! Invalidate it immediately
        otp_entry.is_valid = False
        otp_entry.save()

        # 3. Generate new JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Returns and updates the authenticated user's profile.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserProfileUpdateSerializer

        return UserProfileSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)

        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        output_serializer = UserProfileSerializer(
            instance,
            context=self.get_serializer_context(),
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )

class UserProfileUpdateView(generics.UpdateAPIView):
    """
    Updates the authenticated user's editable profile information.
    """

    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class PasswordChangeView(generics.GenericAPIView):
    """
    Changes the authenticated user's password.
    """

    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "detail": _("Password changed successfully.")
            },
            status=status.HTTP_200_OK,
        )


class AddressListCreateView(generics.ListCreateAPIView):
    """
    List user's saved shipping addresses or create a new one.
    """

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific saved shipping address.
    """

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)