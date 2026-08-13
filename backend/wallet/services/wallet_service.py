from decimal import Decimal

from django.db import transaction
from wallet.exceptions import InsufficientBalanceError
from wallet.models import Wallet, WalletTransaction


class WalletService:
    """
    Centralized wallet balance management.
    """

    @staticmethod
    def get_wallet(user):
        wallet, _ = Wallet.objects.get_or_create(user=user)
        return wallet

    @staticmethod
    @transaction.atomic
    def deposit(user, amount, description=""):
        amount = Decimal(str(amount))

        if amount <= 0:
            raise ValueError("Deposit amount must be greater than zero.")

        wallet = (
            Wallet.objects.select_for_update()
            .get(user=user)
        )

        wallet.balance += amount
        wallet.save(update_fields=["balance", "updated_at"])

        transaction_record = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.DEPOSIT,
            amount=amount,
            balance_after=wallet.balance,
            description=description or "Wallet deposit",
        )

        return transaction_record

    @staticmethod
    @transaction.atomic
    def withdraw(user, amount, description=""):
        amount = Decimal(str(amount))

        if amount <= 0:
            raise ValueError("Withdrawal amount must be greater than zero.")

        wallet = (
            Wallet.objects.select_for_update()
            .get(user=user)
        )

        if wallet.balance < amount:
            raise InsufficientBalanceError(
                "Insufficient wallet balance."
            )

        wallet.balance -= amount
        wallet.save(update_fields=["balance", "updated_at"])

        transaction_record = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.PURCHASE,
            amount=-amount,
            balance_after=wallet.balance,
            description=description or "Wallet withdrawal",
        )

        return transaction_record

    @staticmethod
    @transaction.atomic
    def refund(user, amount, description=""):
        amount = Decimal(str(amount))

        if amount <= 0:
            raise ValueError("Refund amount must be greater than zero.")

        wallet = (
            Wallet.objects.select_for_update()
            .get(user=user)
        )

        wallet.balance += amount
        wallet.save(update_fields=["balance", "updated_at"])

        transaction_record = WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.REFUND,
            amount=amount,
            balance_after=wallet.balance,
            description=description or "Wallet refund",
        )

        return transaction_record