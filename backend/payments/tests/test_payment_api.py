from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from payments.models import Payment
from rest_framework import status
from rest_framework.test import APITestCase
from wallet.models import Wallet, WalletTransaction

User = get_user_model()


class WalletPaymentAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="payment_user",
            email="payment@example.com",
            password="testpass123",
        )

        self.wallet = Wallet.objects.get(
            user=self.user
        )

        self.charge_url = (
            "/api/v1/payments/wallet/charge/"
        )

        self.callback_url = (
            "/api/v1/payments/callback/"
        )

        self.client.force_authenticate(
            user=self.user
        )


    @patch(
        "payments.services.payment_service.ZarinpalClient"
    )
    def test_authenticated_user_can_create_wallet_charge(
        self,
        mock_zarinpal,
    ):
        mock_zarinpal.return_value.request_payment.return_value = {
            "authority": "A_TEST_AUTHORITY",
            "payment_url": (
                "https://sandbox.zarinpal.com/payment"
            ),
        }

        response = self.client.post(
            self.charge_url,
            {
                "amount": 500000,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertIn(
            "payment_url",
            response.data,
        )

        self.assertIn(
            "authority",
            response.data,
        )

        payment = Payment.objects.get(
            authority="A_TEST_AUTHORITY"
        )

        self.assertEqual(
            payment.user,
            self.user,
        )

        self.assertEqual(
            payment.amount,
            Decimal("500000"),
        )

        self.assertEqual(
            payment.status,
            Payment.Status.PENDING,
        )


    def test_anonymous_user_cannot_create_wallet_charge(
        self,
    ):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.post(
            self.charge_url,
            {
                "amount": 500000,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )


    @patch(
        "payments.services.payment_service.ZarinpalClient"
    )
    def test_successful_payment_callback_redirects_and_deposits_wallet(
        self,
        mock_zarinpal,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            authority="A_CALLBACK_TEST",
        )

        mock_zarinpal.return_value.verify_payment.return_value = {
            "ref_id": "999999",
        }

        response = self.client.get(
            self.callback_url,
            {
                "Authority": payment.authority,
                "Status": "OK",
            },
        )

        payment.refresh_from_db()
        self.wallet.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_302_FOUND,
        )

        self.assertIn(
            "status=success",
            response.url,
        )

        self.assertEqual(
            payment.status,
            Payment.Status.SUCCESS,
        )

        self.assertEqual(
            payment.ref_id,
            "999999",
        )

        self.assertEqual(
            self.wallet.balance,
            Decimal("500000"),
        )

        self.assertEqual(
            WalletTransaction.objects.count(),
            1,
        )


    def test_failed_callback_does_not_change_wallet(
        self,
    ):
        payment = Payment.objects.create(
            user=self.user,
            amount=500000,
            authority="A_FAILED_TEST",
        )

        response = self.client.get(
            self.callback_url,
            {
                "Authority": payment.authority,
                "Status": "NOK",
            },
        )

        payment.refresh_from_db()
        self.wallet.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_302_FOUND,
        )

        self.assertIn(
            "status=failed",
            response.url,
        )

        self.assertEqual(
            payment.status,
            Payment.Status.PENDING,
        )

        self.assertEqual(
            self.wallet.balance,
            Decimal("0"),
        )