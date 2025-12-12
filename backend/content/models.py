from datetime import timedelta

from cart.models import Order
from catalog.models import Book
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class License(models.Model):
    """
    Represents a user's right to access a specific digital book/audio file.
    A license is typically generated upon successful order confirmation.
    """

    # --- Relationships ---
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name=_("User")
    )
    book = models.ForeignKey(
        Book, on_delete=models.PROTECT, verbose_name=_("Book")
    )  # Protects link to the source book
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Source Order"),
    )  # Links to the source transaction

    # --- License Details (Based on time-based model) ---
    is_active = models.BooleanField(_("Is Active"), default=True)
    valid_from = models.DateTimeField(_("Valid From"), default=timezone.now)
    valid_until = models.DateTimeField(
        _("Valid Until"), null=True, blank=True
    )  # If null, it's a perpetual license

    # Unique constraint: A user should only have one active license entry for a specific book.
    # We will enforce this via application logic, as multiple expired licenses are possible.

    class Meta:
        verbose_name = _("Digital License")
        verbose_name_plural = _("Digital Licenses")
        ordering = ["-valid_from"]
        unique_together = ("user", "book")  # Enforce uniqueness to simplify lookups

    def __str__(self):
        return f"License for {self.user.username} on {self.book.title}"

    def is_valid(self):
        """Checks if the license is currently active and not expired."""
        if not self.is_active:
            return False
        if self.valid_until and self.valid_until < timezone.now():
            return False
        return True
