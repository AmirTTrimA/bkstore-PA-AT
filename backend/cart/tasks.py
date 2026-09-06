# cart/tasks.py
import logging
from cart.models import Order
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


@shared_task
def send_order_confirmation_email(order_id):
    """
    Sends a detailed order confirmation email to the user.
    This task is called immediately after a successful checkout transaction.
    """
    try:
        order = (
            Order.objects.select_related("user")
            .prefetch_related("items__book_format")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        logger.warning(
            "send_order_confirmation_email: Order with ID %s does not exist.", order_id
        )
        return False
    except Exception as exc:
        logger.exception(
            "send_order_confirmation_email: Error fetching order %s: %s", order_id, exc
        )
        return False

    recipient_email = getattr(order.user, "email", None)
    if not recipient_email:
        logger.warning(
            "send_order_confirmation_email: User '%s' has no email address configured.",
            order.user.username,
        )
        return False

    subject = f"Order #{order.pk} Confirmation - Your Books Are Ready!"

    # Determine shipping presentation
    has_shipping = bool(order.shipping_name or order.shipping_address_line1)

    # Format line items
    items_data = []
    for item in order.items.all():
        format_display = ""
        if item.book_format:
            format_display = (
                item.book_format.get_format_display()
                if hasattr(item.book_format, "get_format_display")
                else str(item.book_format)
            )
        unit_price = int(item.snapshot_price) if item.snapshot_price is not None else 0
        subtotal = unit_price * item.quantity
        items_data.append(
            {
                "title": item.snapshot_title,
                "author": item.snapshot_author_name,
                "format": format_display,
                "quantity": item.quantity,
                "price_formatted": f"{unit_price:,} IRR",
                "subtotal_formatted": f"{subtotal:,} IRR",
            }
        )

    subtotal_val = int(order.subtotal) if order.subtotal is not None else 0
    discount_val = int(order.discount_amount) if order.discount_amount is not None else 0
    total_val = int(order.total_amount) if order.total_amount is not None else 0

    context = {
        "order": order,
        "items": items_data,
        "has_shipping": has_shipping,
        "subtotal_formatted": f"{subtotal_val:,} IRR",
        "discount_formatted": f"{discount_val:,} IRR",
        "total_formatted": f"{total_val:,} IRR",
        "frontend_url": getattr(settings, "FRONTEND_URL", "http://localhost:3000"),
    }

    try:
        html_message = render_to_string("email/order_confirmation.html", context)
        plain_message = strip_tags(html_message)
    except Exception as exc:
        logger.warning(
            "send_order_confirmation_email: Template rendering failed (%s). Falling back to plaintext.",
            exc,
        )
        # Plaintext fallback
        shipping_desc = (
            f"{order.shipping_name}, {order.shipping_address_line1}, {order.shipping_city}"
            if has_shipping
            else "Digital Delivery (instant access via dashboard)"
        )
        plain_message = (
            f"Thank you for your order, {order.user.username}!\n\n"
            f"Order ID: #{order.pk}\n"
            f"Status: {order.get_status_display()}\n\n"
            f"Subtotal: {subtotal_val:,} IRR\n"
            f"Discount Applied: {discount_val:,} IRR\n"
            f"Total Paid: {total_val:,} IRR\n\n"
            f"Shipping Address: {shipping_desc}\n\n"
            "--- Items ---\n"
        )
        for item in items_data:
            plain_message += (
                f"- {item['quantity']}x {item['title']} ({item['format']}) @ {item['price_formatted']} = {item['subtotal_formatted']}\n"
            )
        plain_message += "\nIf you purchased digital items, your license is now active in your dashboard.\n"
        html_message = None

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(
            "Sent order confirmation email for Order #%s to %s",
            order.pk,
            recipient_email,
        )
        return True
    except Exception as exc:
        logger.exception(
            "Failed to send confirmation email for Order #%s to %s: %s",
            order.pk,
            recipient_email,
            exc,
        )
        return False
