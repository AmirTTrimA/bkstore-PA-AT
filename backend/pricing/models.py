# pricing/models.py
from datetime import timedelta

from catalog.models import Book  # Import the Book model
from django.conf import settings  # For accessing AUTH_USER_MODEL
from django.db import models, transaction
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

# -------------------------------------------------------------
# 2. DISCOUNT INFRASTRUCTURE
# -------------------------------------------------------------


class Discount(models.Model):
    """Defines promotional discounts that may apply automatically or through codes."""

    class DiscountType(models.TextChoices):
        PERCENT = "PERCENT", _("Percentage")
        FIXED = "FIXED", _("Fixed Amount")

    class Scope(models.TextChoices):
        STORE = "STORE", _("Entire Store")
        BOOK = "BOOK", _("Specific Book")
        AUTHOR = "AUTHOR", _("Specific Author")
        GENRE = "GENRE", _("Genre")
        FORMAT = "FORMAT", _("Book Format")

    class Format(models.TextChoices):
        DIGITAL = "DIGITAL", _("Digital")
        PHYSICAL = "PHYSICAL", _("Physical")
        AUDIO = "AUDIO", _("Audiobook")

    class Activation(models.TextChoices):
        AUTOMATIC = "AUTOMATIC", _("Automatic")
        COUPON = "COUPON", _("Coupon")

    # ---- General ----

    name = models.CharField(_("Name"), max_length=100)

    discount_type = models.CharField(
        _("Discount Type"),
        max_length=10,
        choices=DiscountType.choices,
    )

    value = models.DecimalField(
        _("Discount Value"),
        max_digits=10,
        decimal_places=2,
    )

    # ---- Scope ----

    scope = models.CharField(
        _("Scope"),
        max_length=10,
        choices=Scope.choices,
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="discounts",
    )

    author = models.ForeignKey(
        "catalog.Author",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="discounts",
    )

    genre = models.CharField(
        _("Genre"),
        max_length=30,
        blank=True,
    )

    format = models.CharField(
        _("Format"),
        max_length=10,
        choices=Format.choices,
        blank=True,
    )

    description = models.TextField(
        _("Description"),
        blank=True,
    )

    # ---- Availability ----

    is_active = models.BooleanField(default=True)

    valid_from = models.DateTimeField(default=timezone.now)

    valid_until = models.DateTimeField(
        blank=True,
        null=True,
    )

    activation = models.CharField(
        _("Activation"),
        max_length=20,
        choices=Activation.choices,
        default=Activation.AUTOMATIC,
    )

    class Meta:
        ordering = ["-valid_from"]

    def __str__(self):
        return self.name
    
    def is_active_now(self):
        """
        Returns True if the discount is currently active and within
        its validity period.
        """
        now = timezone.now()

        if not self.is_active:
            return False

        if self.valid_from and self.valid_from > now:
            return False

        if self.valid_until and self.valid_until < now:
            return False

        return True

    def is_applicable(self, book):
        """
        Returns True if this discount applies to the given book.
        Does not check active dates.
        """

        if self.scope == self.Scope.STORE:
            return True

        if self.scope == self.Scope.BOOK:
            return self.book_id == book.id

        if self.scope == self.Scope.AUTHOR:
            return self.author_id == book.author_id

        if self.scope == self.Scope.GENRE:
            return self.genre == book.genre

        if self.scope == self.Scope.FORMAT:
            if self.format == self.Format.DIGITAL:
                return book.is_digital

            if self.format == self.Format.AUDIO:
                return book.is_audio

            if self.format == self.Format.PHYSICAL:
                return not book.is_digital and not book.is_audio

        return False
    
    def can_apply_to(self, book):
        """
        Returns True if the discount is active and applies
        to the given book.
        """
        return self.is_active_now() and self.is_applicable(book)

class DiscountCode(models.Model):
    """Coupon code that activates a Discount."""

    discount = models.ForeignKey(
        Discount,
        on_delete=models.CASCADE,
        related_name="codes",
    )

    code = models.CharField(
        _("Code"),
        max_length=50,
        unique=True,
    )

    is_active = models.BooleanField(default=True)

    max_uses = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    times_used = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.code

    @property
    def remaining_uses(self):

        if self.max_uses is None:
            return None

        return max(self.max_uses - self.times_used, 0)


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
