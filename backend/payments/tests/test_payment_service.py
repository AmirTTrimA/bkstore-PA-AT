from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from payments.models import Payment
from payments.services.payment_service import PaymentService
from wallet.models import Wallet, WalletTransaction

User = get_user_model()


class PaymentServiceTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

        self.wallet = Wallet.objects.get_or_create(
            user=self.user,
            defaults={
                "balance": Decimal("0"),
            },
        )[0]

    @patch(
        "payments.services.payment_service.ZarinpalClient"
    )
    def test_create_wallet_payment(
        self,
        mock_zarinpal,
    ):
        mock_zarinpal.return_value.request_payment.return_value = {
            "authority": "A000000000000000000000000001",
            "payment_url": (
                "https://sandbox.zarinpal.com/pay"
            ),
        }

        payment, payment_url = (
            PaymentService.create_wallet_payment(
                user=self.user,
                amount=500000,
                callback_url=(
                    "http://localhost:8000/api/v1/payments/callback/"
                ),
            )
        )

        self.assertEqual(
            payment.amount,
            Decimal("500000"),
        )

        self.assertEqual(
            payment.status,
            Payment.Status.PENDING,
        )

        self.assertEqual(
            payment.authority,
            "A000000000000000000000000001",
        )

        self.assertEqual(
            payment_url,
            "https://sandbox.zarinpal.com/pay",
        )


    @patch(
        "payments.services.payment_service.ZarinpalClient"
    )
    def test_successful_wallet_payment_verification(
        self,
        mock_zarinpal,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            authority=(
                "A000000000000000000000000002"
            ),
        )

        mock_zarinpal.return_value.verify_payment.return_value = {
            "ref_id": "123456",
        }

        PaymentService.verify_wallet_payment(
            payment.authority,
        )

        payment.refresh_from_db()
        self.wallet.refresh_from_db()

        self.assertEqual(
            payment.status,
            Payment.Status.SUCCESS,
        )

        self.assertEqual(
            payment.ref_id,
            "123456",
        )

        self.assertEqual(
            self.wallet.balance,
            Decimal("500000"),
        )

        self.assertEqual(
            WalletTransaction.objects.count(),
            1,
        )


    @patch(
        "payments.services.payment_service.ZarinpalClient"
    )
    def test_duplicate_verification_does_not_deposit_twice(
        self,
        mock_zarinpal,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            authority=(
                "A000000000000000000000000003"
            ),
        )

        mock_zarinpal.return_value.verify_payment.return_value = {
            "ref_id": "123456",
        }

        PaymentService.verify_wallet_payment(
            payment.authority,
        )

        PaymentService.verify_wallet_payment(
            payment.authority,
        )

        self.wallet.refresh_from_db()

        self.assertEqual(
            self.wallet.balance,
            Decimal("500000"),
        )

        self.assertEqual(
            WalletTransaction.objects.count(),
            1,
        )