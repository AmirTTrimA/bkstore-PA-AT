from datetime import timedelta

from catalog.models import Book  # Import the Book model
from django.conf import settings  # For accessing AUTH_USER_MODEL
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

# -------------------------------------------------------------
# 1. CORE PRICING INFRASTRUCTURE
# -------------------------------------------------------------


class Price(models.Model):
    """Tracks the historical price of a Book."""

    # --- Relationships ---
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="prices", verbose_name=_("Book")
    )

    # --- Price Details ---
    value = models.DecimalField(_("Price Value"), max_digits=10, decimal_places=2)
    currency = models.CharField(_("Currency"), max_length=3, default="USD")
    min_price = models.DecimalField(_("Minimum Price"), max_digits=10, decimal_places=2, null=True, blank=True, default=None)

    # --- Time Validity ---
    effective_from = models.DateTimeField(_("Effective From"), default=timezone.now)
    effective_until = models.DateTimeField(_("Effective Until"), blank=True, null=True)

    class Meta:
        verbose_name = _("Price History Record")
        verbose_name_plural = _("Price History Records")
        ordering = ["-effective_from"]
        # Note: Application logic in serializers/views must enforce only one active price at any time.

    def __str__(self):
        return f"{self.book.title} - {self.value} {self.currency} ({self.effective_from.strftime('%Y-%m-%d')})"


class DiscountCode(models.Model):
    """Defines promotion codes (e.g., BLACKFRIDAY) that give discounts."""

    # --- Code Details ---
    code = models.CharField(_("Code"), max_length=50, unique=True)
    discount_percent = models.IntegerField(
        _("Discount Percentage"), default=0
    )  # e.g., 10 for 10%

    # --- Time and Usage Limits ---
    is_active = models.BooleanField(_("Is Active"), default=True)
    valid_from = models.DateTimeField(_("Valid From"), default=timezone.now)
    valid_until = models.DateTimeField(_("Valid Until"), blank=True, null=True)
    max_uses = models.IntegerField(_("Maximum Uses"), blank=True, null=True)
    times_used = models.IntegerField(_("Times Used"), default=0)

    class Meta:
        verbose_name = _("Discount Code")
        verbose_name_plural = _("Discount Codes")

    def __str__(self):
        return f"{self.code} ({self.discount_percent}%)"


# -------------------------------------------------------------
# 2. SUBSCRIPTION INFRASTRUCTURE
# -------------------------------------------------------------


class SubscriptionPlan(models.Model):
    """Defines subscription tiers and their benefits."""

    # --- Plan Details ---
    name = models.CharField(_("Plan Name"), max_length=100, unique=True)
    slug = models.SlugField(_("Slug"), max_length=100, unique=True)

    # --- Pricing and Benefits ---
    monthly_price = models.DecimalField(
        _("Monthly Price"), max_digits=10, decimal_places=2
    )
    # This discount is applied to specific *digital* books
    digital_discount_percent = models.IntegerField(_("Digital Discount %"), default=0)

    # --- Control ---
    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta:
        verbose_name = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")

    def __str__(self):
        return self.name


class UserSubscription(models.Model):
    """Tracks a user's active/historical subscription status."""

    # --- Relationships ---
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name=_("User"),
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,  # Protects the subscription history if a plan is retired
        verbose_name=_("Plan"),
    )

    # --- Status ---
    is_active = models.BooleanField(_("Is Active"), default=False)
    start_date = models.DateTimeField(_("Start Date"), default=timezone.now)
    # The time-based digital access model is enforced here
    end_date = models.DateTimeField(_("End Date"), blank=True, null=True)

    class Meta:
        verbose_name = _("User Subscription")
        verbose_name_plural = _("User Subscriptions")

    def __str__(self):
        return f"{self.user.username}'s {self.plan.name} Subscription"

    def is_current(self):
        """Checks if the subscription is currently valid based on end_date."""
        if not self.is_active:
            return False
        if self.end_date and self.end_date < timezone.now():
            return False
        return True
