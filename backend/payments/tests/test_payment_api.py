from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from payments.models import Payment
from rest_framework import status
from rest_framework.test import APITestCase
from wallet.models import Wallet, WalletTransaction

User = get_user_model()


@override_settings(
    PAYMENT_RESULT_URL="http://localhost:3000/payment/result"
)
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
        "payments.services.payment_service.SepGateway"
    )
    def test_authenticated_user_can_create_wallet_charge(
        self,
        mock_sep,
    ):
        mock_sep.return_value.request_payment.return_value = {
            "token": "TEST_TOKEN",
            "res_num": "TEST_RES_NUM",
            "payment_url": "https://sep.test/payment",
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
            "payment_url",
            response.data,
        )

        payment = Payment.objects.get(
            gateway_token="TEST_TOKEN"
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
        "payments.services.payment_service.SepGateway"
    )
    def test_successful_payment_callback_redirects_and_deposits_wallet(
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
            "ref_id": "999999",
        }

        response = self.client.post(
            self.callback_url,
            {
                "Token": payment.gateway_token,
                "ResNum": payment.res_num,
                "State": "OK",
                "RefNum": "999999",
            },
            format="json",
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
            gateway_token="A_FAILED_TEST",
        )

        response = self.client.post(
            self.callback_url,
            {
                "Token": payment.gateway_token,
                "ResNum": payment.res_num,
                "State": "FAILED",
            },
            format="json",
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