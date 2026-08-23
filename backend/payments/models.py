from django.conf import settings
from django.db import models


class Payment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING"
        SUCCESS = "SUCCESS"
        FAILED = "FAILED"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
    )

    description = models.CharField(
        max_length=255,
        default="Wallet charge",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=0,
    )

    gateway_token = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    res_num = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    ref_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )