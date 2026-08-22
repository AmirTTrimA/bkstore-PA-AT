from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from payments.api.serializers import WalletChargeSerializer
from payments.models import Payment
from payments.services.zarinpal import ZarinpalClient, ZarinpalError
from payments.services.payment_service import PaymentService
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from wallet.services.wallet_service import WalletService


class WalletChargeView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WalletChargeSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]

        callback_url = request.build_absolute_uri(
            reverse(
                "payments-api:payment-callback"
            )
        )

        payment, payment_url = (
            PaymentService.create_wallet_payment(
                user=request.user,
                amount=amount,
                callback_url=callback_url,
            )
        )

        return Response(
            {
                "payment_url": payment_url,
                "authority": payment.authority,
            },
            status=status.HTTP_201_CREATED,
        )

class PaymentCallbackView(APIView):

    authentication_classes = []
    permission_classes = []

    def get(self, request):

        authority = request.GET.get("Authority")
        status_value = request.GET.get("Status")

        if status_value != "OK" or not authority:
            return redirect(
                f"{settings.PAYMENT_RESULT_URL}?status=failed"
            )

        try:
            PaymentService.verify_wallet_payment(
                authority=authority,
            )

        except (
            Payment.DoesNotExist,
            ZarinpalError,
        ):
            return redirect(
                f"{settings.PAYMENT_RESULT_URL}?status=failed"
            )

        return redirect(
            f"{settings.PAYMENT_RESULT_URL}?status=success"
        )