from django.urls import path
from wallet.api.views import MyWalletTransactionListView, MyWalletView

app_name = "wallet-api"

urlpatterns = [
    path("", MyWalletView.as_view(), name="my-wallet"),
    path(
        "transactions/",
        MyWalletTransactionListView.as_view(),
        name="my-wallet-transactions",
    ),
]