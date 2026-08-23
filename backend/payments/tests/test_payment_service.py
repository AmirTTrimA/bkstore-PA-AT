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
        "payments.services.payment_service.SepGateway"
    )
    def test_create_wallet_payment(
        self,
        mock_sep,
    ):
        mock_sep.return_value.request_payment.return_value = {
            "token": "TEST_TOKEN",
            "res_num": "TEST_RES_NUM",
            "payment_url": "https://sep.test/payment",
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
            payment.gateway_token,
            "TEST_TOKEN",
        )

        self.assertEqual(
            payment.res_num,
            "TEST_RES_NUM",
        )

        self.assertEqual(
            payment_url,
            "https://sep.test/payment",
        )


    @patch(
        "payments.services.payment_service.SepGateway"
    )
    def test_successful_wallet_payment_verification(
        self,
        mock_sep,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            gateway_token="TEST_TOKEN",
            res_num="TEST_RES_NUM",
        )

        mock_sep.return_value.verify_payment.return_value = {
            "ref_id": "123456",
        }

        PaymentService.verify_wallet_payment(
            gateway_token=payment.gateway_token,
            res_num=payment.res_num,
            callback_data={
                "RefNum": "999999",
                "State": "OK",
            },
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
        "payments.services.payment_service.SepGateway"
    )
    def test_duplicate_verification_does_not_deposit_twice(
        self,
        mock_zarinpal,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            gateway_token="TEST_TOKEN",
            res_num="TEST_RES_NUM",
        )

        mock_zarinpal.return_value.verify_payment.return_value = {
            "ref_id": "123456",
        }

        PaymentService.verify_wallet_payment(
            gateway_token=payment.gateway_token,
            res_num=payment.res_num,
            callback_data={
                "RefNum": "999999",
                "State": "OK",
            },
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