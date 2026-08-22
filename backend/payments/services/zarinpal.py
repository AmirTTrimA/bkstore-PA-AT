import requests
from django.conf import settings


class ZarinpalError(Exception):
    pass


class ZarinpalClient:
    """
    Client for interacting with Zarinpal payment gateway.
    """

    def __init__(self):
        self.merchant_id = settings.ZARINPAL_MERCHANT_ID
        self.request_url = settings.ZARINPAL_REQUEST_URL
        self.verify_url = settings.ZARINPAL_VERIFY_URL
        self.startpay_url = settings.ZARINPAL_STARTPAY_URL

    def request_payment(
        self,
        amount,
        description,
        callback_url,
        mobile=None,
        email=None,
    ):
        payload = {
            "merchant_id": self.merchant_id,
            "amount": int(amount),
            "description": description,
            "callback_url": callback_url,
            "metadata": {},
        }

        if mobile:
            payload["metadata"]["mobile"] = mobile

        if email:
            payload["metadata"]["email"] = email

        response = requests.post(
            self.request_url,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("data", {}).get("code") != 100:
            raise ZarinpalError(
                data.get("errors", "Payment request failed.")
            )

        return {
            "authority": data["data"]["authority"],
            "payment_url": (
                f"{self.startpay_url}"
                f"{data['data']['authority']}"
            ),
        }

    def verify_payment(
        self,
        amount,
        authority,
    ):
        payload = {
            "merchant_id": self.merchant_id,
            "amount": int(amount),
            "authority": authority,
        }

        response = requests.post(
            self.verify_url,
            json=payload,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("data", {}).get("code") != 100:
            raise ZarinpalError(
                data.get("errors", "Payment verification failed.")
            )

        return {
            "ref_id": data["data"]["ref_id"],
        }