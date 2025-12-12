from datetime import timedelta

from accounts.models import OTPCode
from celery import shared_task
from django.utils import timezone


@shared_task
def expire_otp_codes():
    """
    Periodic task to invalidate OTP codes that have passed their expiration time
    or are already marked as invalid/used.

    Runs hourly (configured in CELERY_BEAT_SCHEDULE).
    """

    # 1. Invalidate codes that are past their expiration time.
    expired_count_time = OTPCode.objects.filter(
        expires_at__lte=timezone.now(), is_valid=True
    ).update(is_valid=False)

    # 2. Hard delete codes that expired more than a week ago to clean up the DB
    # We delete old, expired codes to prevent bloat.
    cleanup_date = timezone.now() - timedelta(days=7)
    deleted_count, _ = OTPCode.objects.filter(expires_at__lte=cleanup_date).delete()

    print(
        f"Celery Task: OTP Cleanup - Expired {expired_count_time} codes; Deleted {deleted_count} old codes."
    )
    return {"expired_by_time": expired_count_time, "deleted_old": deleted_count}
