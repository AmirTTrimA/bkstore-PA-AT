import uuid

import requests
from django.conf import settings
from payments.services.base import PaymentGateway


class SepError(Exception):
    pass


class SepGateway(PaymentGateway):

    def request_payment(
        self,
        payment,
        callback_url,
    ):
        res_num = str(uuid.uuid4())

        payload = {
            "action": "token",
            "TerminalId": settings.SEP_TERMINAL_ID,
            "Amount": int(payment.amount),
            "ResNum": res_num,
            "RedirectUrl": callback_url,
        }

        response = requests.post(
            settings.SEP_TOKEN_URL,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("status") != 1:
            raise SepError(
                data.get(
                    "errorDesc",
                    "SEP token request failed.",
                )
            )

        token = data["token"]

        return {
            "token": token,
            "res_num": res_num,
            "payment_url": settings.SEP_PAYMENT_URL,
        }

    def verify_payment(
        self,
        payment,
        callback_data,
    ):
        ref_num = callback_data.get("RefNum")

        if not ref_num:
            raise SepError(
                "RefNum is missing."
            )

        payload = {
            "RefNum": ref_num,
            "TerminalNumber": int(
                settings.SEP_TERMINAL_ID
            ),
        }

        response = requests.post(
            settings.SEP_VERIFY_URL,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        if not data.get("Success"):
            raise SepError(
                data.get(
                    "ResultDescription",
                    "SEP verification failed.",
                )
            )

        transaction_detail = data.get(
            "TransactionDetail",
            {},
        )

        original_amount = transaction_detail.get(
            "OrginalAmount"
        )

        if original_amount is None:
            raise SepError(
                "Original transaction amount is missing."
            )

        if int(original_amount) != int(payment.amount):
            raise SepError(
                "Payment amount does not match "
                "verified amount."
            )

        return {
            "ref_id": transaction_detail["RefNum"],
            "amount": original_amount,
            "rrn": transaction_detail.get("RRN"),
            "trace_no": transaction_detail.get("StraceNo"),
        }