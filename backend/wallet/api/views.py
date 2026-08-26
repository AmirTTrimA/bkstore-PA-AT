from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from wallet.api.serializers import (WalletSerializer,
                                    WalletTransactionSerializer)
from wallet.models import WalletTransaction


class MyWalletView(generics.RetrieveAPIView):
    """
    Returns the authenticated user's wallet summary.
    """

    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.wallet


class MyWalletTransactionListView(generics.ListAPIView):
    """
    Returns the authenticated user's wallet transaction history.
    """

    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            WalletTransaction.objects
            .filter(wallet__user=self.request.user)
            .order_by("-created_at")
        )