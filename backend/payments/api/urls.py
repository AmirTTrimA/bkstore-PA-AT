from django.urls import path

from payments.api.views import (
    WalletChargeView,
    PaymentCallbackView,
)

app_name = "payments-api"


urlpatterns = [
    path(
        "wallet/charge/",
        WalletChargeView.as_view(),
        name="wallet-charge",
    ),
    path(
        "callback/",
        PaymentCallbackView.as_view(),
        name="payment-callback",
    ),
]