from rest_framework import serializers


class WalletChargeSerializer(serializers.Serializer):
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        min_value=1,
    )