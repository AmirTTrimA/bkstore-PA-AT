# cart/tasks.py
from cart.models import Order
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.utils.html import strip_tags


@shared_task
def send_order_confirmation_email(order_id):
    """
    Sends a detailed order confirmation email to the user.
    This task is called immediately after a successful checkout transaction.
    """
    try:
        order = get_object_or_404(Order, pk=order_id)
    except Exception:
        # If the order is deleted or not found, fail gracefully.
        return

    subject = f"Order #{order.pk} Confirmation - Your Books Are Ready!"

    # 🔑 Note: This requires an HTML template located at 'email/order_confirmation.html'
    # For now, we use a plain text template.

    message = (
        f"Thank you for your order, {order.user.username}!\n\n"
        f"Order ID: {order.pk}\n"
        f"Status: {order.get_status_display()}\n\n"
        f"Total Paid: ${order.total_amount}\n"
        f"Discount Applied: ${order.discount_amount}\n\n"
        f"Shipping Address: {order.shipping_name}, {order.shipping_address_line1}, {order.shipping_city}\n\n"
        "--- Items ---\n"
    )

    for item in order.items.all():
        message += (
            f"- {item.quantity}x {item.snapshot_title} @ ${item.snapshot_price} each\n"
        )

    message += "\nIf you purchased digital items, your license is now active."

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [order.user.email],
        fail_silently=False,
    )

    print(f"Sent confirmation email for Order ID {order.pk} to {order.user.email}")
