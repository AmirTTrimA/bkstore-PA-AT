from django.db import transaction
from payments.models import Payment
from payments.services.sep import SepError, SepGateway
from wallet.services.wallet_service import WalletService


class PaymentService:

    @staticmethod
    def create_wallet_payment(
        user,
        amount,
        callback_url,
    ):
        payment = Payment.objects.create(
            user=user,
            amount=amount,
            description="Wallet charge",
        )

        gateway = SepGateway()

        result = gateway.request_payment(
            payment=payment,
            callback_url=callback_url,
        )

        payment.gateway_token = result["token"]
        payment.res_num = result["res_num"]

        payment.save(
            update_fields=[
                "gateway_token",
                "res_num",
            ]
        )

        return payment, result["payment_url"]

    @staticmethod
    @transaction.atomic
    def verify_wallet_payment(
        gateway_token,
        res_num,
        callback_data,
    ):
        payment = (
            Payment.objects
            .select_for_update()
            .get(
                gateway_token=gateway_token,
                res_num=res_num,
            )
        )

        # Prevent duplicate wallet deposits.
        if payment.status == Payment.Status.SUCCESS:
            return payment

        gateway = SepGateway()

        result = gateway.verify_payment(
            payment=payment,
            callback_data=callback_data,
        )

        WalletService.deposit(
            user=payment.user,
            amount=payment.amount,
            description=(
                "Wallet charge via Saman "
                f"(Ref: {result['ref_id']})"
            ),
        )

        payment.ref_id = result["ref_id"]
        payment.status = Payment.Status.SUCCESS

        payment.save(
            update_fields=[
                "ref_id",
                "status",
            ]
        )

        return payment