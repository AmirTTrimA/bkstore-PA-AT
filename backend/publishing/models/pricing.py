from catalog.models import Book
from django.db import models
from django.utils.translation import gettext_lazy as _

from .proposal import Proposal


class PriceChangeProposal(models.Model):
    """
    Proposal requesting a new price for an existing book.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="price_change",
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name="price_change_proposals",
    )

    value = models.DecimalField(
        _("Price"),
        max_digits=10,
        decimal_places=2,
    )

    currency = models.CharField(
        _("Currency"),
        max_length=3,
        default="USD",
    )

    min_price = models.DecimalField(
        _("Minimum Price"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    reason = models.TextField(
        _("Reason"),
        blank=True,
    )

    class Meta:
        verbose_name = _("Price Change Proposal")
        verbose_name_plural = _("Price Change Proposals")

    def __str__(self):
        return f"{self.book.title} → {self.value} {self.currency}"