# accounts/models.py
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    # Core fields are inherited (username, email, password, etc.)

    # Custom fields for the Recommendation System (Phase 3)
    job_or_major = models.CharField(max_length=100, blank=True, null=True)
    hobbies_or_likings = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.email or self.username


class OTPCode(models.Model):
    """Stores temporary One-Time Passwords for user verification."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="otp_codes",)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)

    # We set the default expiration time here.
    def default_expiration():
        return timezone.now() + timedelta(minutes=5)

    expires_at = models.DateTimeField(default=default_expiration)

    def is_expired(self):
        """Checks if the current code has passed its expiration time."""
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username}"

    def save(self, *args, **kwargs):
        # Generate a 6-digit code before saving if it's new
        if not self.pk:
            self.code = str(random.randint(100000, 999999))
        super().save(*args, **kwargs)
