from django.db import models
from django.utils.translation import gettext_lazy as _

from .wallet import Wallet


class WalletTransaction(models.Model):
    """
    Immutable ledger entry for wallet balance changes.
    """

    class TransactionType(models.TextChoices):
        DEPOSIT = "DEPOSIT", _("Deposit")
        PURCHASE = "PURCHASE", _("Purchase")
        REFUND = "REFUND", _("Refund")
        ADJUSTMENT = "ADJUSTMENT", _("Adjustment")

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name=_("Wallet"),
    )

    transaction_type = models.CharField(
        _("Transaction Type"),
        max_length=20,
        choices=TransactionType.choices,
    )

    amount = models.DecimalField(
        _("Amount"),
        max_digits=12,
        decimal_places=2,
    )

    balance_after = models.DecimalField(
        _("Balance After Transaction"),
        max_digits=12,
        decimal_places=2,
    )

    description = models.CharField(
        _("Description"),
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Wallet Transaction")
        verbose_name_plural = _("Wallet Transactions")
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.wallet.user.username} | "
            f"{self.transaction_type} | "
            f"{self.amount}"
        )