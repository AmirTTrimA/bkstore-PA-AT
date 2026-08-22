from django.db import transaction
from payments.models import Payment
from payments.services.zarinpal import ZarinpalClient
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

        result = ZarinpalClient().request_payment(
            amount=amount,
            description=payment.description,
            callback_url=callback_url,
        )

        payment.authority = result["authority"]
        payment.save(
            update_fields=["authority"]
        )

        return payment, result["payment_url"]

    @staticmethod
    @transaction.atomic
    def verify_wallet_payment(
        authority,
    ):
        payment = (
            Payment.objects
            .select_for_update()
            .get(authority=authority)
        )

        # Prevent duplicate wallet deposits
        if payment.status == Payment.Status.SUCCESS:
            return payment

        result = ZarinpalClient().verify_payment(
            amount=payment.amount,
            authority=authority,
        )

        WalletService.deposit(
            user=payment.user,
            amount=payment.amount,
            description=(
                "Wallet charge via Zarinpal "
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