from django.urls import path

from payments.api.views import (
    WalletChargeView,
    PaymentCallbackView,
    SepPaymentRedirectView
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
    path(
        "sep/redirect/<str:gateway_token>/",
        SepPaymentRedirectView.as_view(),
        name="sep-payment-redirect",
    ),
]