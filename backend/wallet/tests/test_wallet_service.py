from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from wallet.exceptions import InsufficientBalanceError
from wallet.models import Wallet, WalletTransaction
from wallet.services.wallet_service import WalletService

User = get_user_model()


class WalletServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="walletuser",
            password="testpass123",
        )

        self.wallet = Wallet.objects.create(
            user=self.user,
            balance=Decimal("100.00"),
        )

    def test_deposit_increases_balance(self):
        WalletService.deposit(self.user, Decimal("25.00"))

        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.balance, Decimal("125.00"))
        self.assertEqual(WalletTransaction.objects.count(), 1)

    def test_withdraw_decreases_balance(self):
        WalletService.withdraw(self.user, Decimal("30.00"))

        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.balance, Decimal("70.00"))

        transaction_record = WalletTransaction.objects.first()

        self.assertEqual(transaction_record.amount, Decimal("-30.00"))

    def test_withdraw_insufficient_balance_raises_error(self):
        with self.assertRaises(InsufficientBalanceError):
            WalletService.withdraw(self.user, Decimal("150.00"))

    def test_refund_restores_balance(self):
        WalletService.refund(self.user, Decimal("10.00"))

        self.wallet.refresh_from_db()

        self.assertEqual(self.wallet.balance, Decimal("110.00"))

        transaction_record = WalletTransaction.objects.first()

        self.assertEqual(transaction_record.transaction_type, WalletTransaction.TransactionType.REFUND)