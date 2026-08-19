# content/models.py
from datetime import timedelta

from cart.models import Order
from catalog.models import Book, BookFormat
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class License(models.Model):
    """
    Represents a user's right to access a specific digital or audio format.
    A license is generated upon successful order confirmation.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name=_("User"),
        related_name="licenses",
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        verbose_name=_("Book"),
        related_name="licenses",
    )

    book_format = models.ForeignKey(
        BookFormat,
        on_delete=models.PROTECT,
        verbose_name=_("Book Format"),
        related_name="licenses",
    )

    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Source Order"),
        related_name="licenses",
    )

    is_active = models.BooleanField(_("Is Active"), default=True)

    valid_from = models.DateTimeField(
        _("Valid From"),
        default=timezone.now,
    )

    valid_until = models.DateTimeField(
        _("Valid Until"),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Digital License")
        verbose_name_plural = _("Digital Licenses")
        ordering = ["-valid_from"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book", "book_format"],
                name="unique_user_book_format_license",
            ),
        ]

    def __str__(self):
        return (
            f"License for {self.user.username} on "
            f"{self.book.title} "
            f"({self.book_format.get_format_type_display()})"
        )

    def is_valid(self):
        """Checks if the license is currently active and not expired."""
        if not self.is_active:
            return False

        if self.valid_until and self.valid_until < timezone.now():
            return False

        return True