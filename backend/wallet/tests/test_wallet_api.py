from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from wallet.models import WalletTransaction
from wallet.services import WalletService

User = get_user_model()


from wallet.models import Wallet


class WalletAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="walletapi",
            password="testpass123",
        )

        self.client.force_authenticate(user=self.user)

        wallet = Wallet.objects.get(user=self.user)
        wallet.balance = Decimal("150")
        wallet.save(update_fields=["balance"])

        WalletService.deposit(
            self.user,
            Decimal("25"),
            description="Initial top-up",
        )

        # Ensure the user relation is not using a stale cached wallet
        self.user.refresh_from_db()

    def test_get_my_wallet(self):
        response = self.client.get("/api/v1/wallet/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"], "walletapi")
        self.assertEqual(response.data["balance"], "175")

    def test_get_my_wallet_transactions(self):
        response = self.client.get(
            "/api/v1/wallet/transactions/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

        transaction = response.data["results"][0]

        self.assertEqual(transaction["transaction_type"], WalletTransaction.TransactionType.DEPOSIT)
        self.assertEqual(transaction["amount"], "25")

    def test_wallet_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/v1/wallet/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )