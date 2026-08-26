from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from payments.api.serializers import WalletChargeSerializer
from payments.models import Payment
from payments.services.payment_service import PaymentService
from payments.services.sep import SepError
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

        if settings.NGROK_URL:
            callback_url = (
                f"{settings.NGROK_URL}"
                f"{reverse('payments-api:payment-callback')}"
            )
        else:
            callback_url = request.build_absolute_uri(
                reverse("payments-api:payment-callback")
            )

        payment, payment_url = (
            PaymentService.create_wallet_payment(
                user=request.user,
                amount=amount,
                callback_url=callback_url,
            )
        )

        payment_redirect_url = request.build_absolute_uri(
            reverse(
                "payments-api:sep-payment-redirect",
                kwargs={
                    "gateway_token": payment.gateway_token,
                },
            )
        )

        return Response(
            {
                "payment_url": payment_redirect_url,
                "token": payment.gateway_token,
            },
            status=status.HTTP_201_CREATED,
        )


class SepPaymentRedirectView(APIView):

    authentication_classes = []
    permission_classes = []

    def get(self, request, gateway_token):
        payment = Payment.objects.get(
            gateway_token=gateway_token,
            status=Payment.Status.PENDING,
        )

        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Redirecting to payment...</title>
        </head>
        <body>
            <p>Redirecting to payment gateway...</p>

            <form
                id="sep-payment-form"
                method="POST"
                action="{settings.SEP_PAYMENT_URL}"
            >
                <input
                    type="hidden"
                    name="Token"
                    value="{payment.gateway_token}"
                >
            </form>

            <script>
                document
                    .getElementById("sep-payment-form")
                    .submit();
            </script>
        </body>
        </html>
        """

        return HttpResponse(html)

class PaymentCallbackView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        gateway_token = request.data.get("Token")
        res_num = request.data.get("ResNum")
        state = request.data.get("State")

        if (
            state != "OK"
            or not gateway_token
            or not res_num
        ):
            return redirect(
                f"{settings.PAYMENT_RESULT_URL}?status=failed"
            )

        try:
            PaymentService.verify_wallet_payment(
                gateway_token=gateway_token,
                res_num=res_num,
                callback_data=request.data,
            )

        except (
            Payment.DoesNotExist,
            SepError,
        ):
            return redirect(
                f"{settings.PAYMENT_RESULT_URL}?status=failed"
            )

        return redirect(
            f"{settings.PAYMENT_RESULT_URL}?status=success"
        )