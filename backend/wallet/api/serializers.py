from rest_framework import serializers
from wallet.models import Wallet, WalletTransaction


class WalletSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Wallet
        fields = [
            "id",
            "user",
            "balance",
            "updated_at",
        ]


class WalletTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display",
        read_only=True,
    )

    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "transaction_type",
            "transaction_type_display",
            "amount",
            "balance_after",
            "description",
            "created_at",
        ]

class OrderCancellationSerializer(serializers.Serializer):
    """
    Input serializer for order cancellation requests.
    Reserved for future cancellation reasons and audit metadata.
    """

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )