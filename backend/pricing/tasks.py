from celery import shared_task

from .subscription_services import SubscriptionService


@shared_task
def process_subscription_expiry():
    """
    Process subscriptions that have reached their end date.

    Reserved subscriptions are activated first. If no reservation exists,
    eligible subscriptions are auto-renewed from the user's wallet.
    """
    result = SubscriptionService.process_expired_subscriptions()

    print(
        "Celery Task: Subscription Expiry - "
        f"Expired: {result.get('expired', 0)}, "
        f"Renewed: {result.get('renewed', 0)}, "
        f"Reserved activated: {result.get('reserved_activated', 0)}, "
        f"Renewal failed: {result.get('renewal_failed', 0)}."
    )

    return result