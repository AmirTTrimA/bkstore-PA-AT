from celery import shared_task
from content.models import License
from django.db.models import F
from django.utils import timezone


@shared_task
def process_license_expiry():
    """
    Periodic task to enforce the time-based license model.
    Checks for licenses where valid_until has passed and sets is_active=False.

    Runs daily (configured in CELERY_BEAT_SCHEDULE).
    """

    # 1. Filter for all licenses that are currently active BUT whose valid_until date has passed
    expired_licenses = License.objects.filter(
        is_active=True, valid_until__lt=timezone.now()
    )

    # 2. Update the status to inactive
    expired_count = expired_licenses.update(is_active=False)

    print(
        f"Celery Task: License Expiry - Inactivated {expired_count} time-expired licenses."
    )

    # Optionally, send an email notification about the expired license (omitted for brevity)

    return {"expired_count": expired_count}
