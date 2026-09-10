import re
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Sends a test email to verify SMTP / Gmail configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            "recipient",
            nargs="?",
            type=str,
            default="",
            help="Recipient email address (defaults to EMAIL_HOST_USER if configured)",
        )

    def handle(self, *args, **options):
        recipient = (
            options["recipient"].strip()
            if options.get("recipient")
            else (settings.EMAIL_HOST_USER or "").strip()
        )

        if not recipient or not re.match(r"[^@]+@[^@]+\.[^@]+", recipient):
            self.stderr.write(
                self.style.ERROR(
                    "Error: Please provide a valid recipient email address:\n"
                    "  python manage.py send_test_email user@example.com"
                )
            )
            return

        self.stdout.write(self.style.MIGRATE_HEADING("=== Bookstore Email Diagnostics ==="))
        self.stdout.write(f"  EMAIL_BACKEND:       {settings.EMAIL_BACKEND}")
        self.stdout.write(f"  EMAIL_HOST:          {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        self.stdout.write(f"  EMAIL_USE_TLS:       {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"  EMAIL_USE_SSL:       {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"  EMAIL_HOST_USER:     {settings.EMAIL_HOST_USER or '(not set)'}")
        self.stdout.write(f"  DEFAULT_FROM_EMAIL:  {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"  Recipient:           {recipient}")
        self.stdout.write("--------------------------------------------------")

        subject = "Bookstore - Email Configuration Test"
        plain_message = (
            "Hello!\n\n"
            "This is a test email sent from your Bookstore project.\n\n"
            "If you are reading this, your email configuration (SMTP / Gmail) is successfully connected and operational!\n\n"
            "--- Diagnostics ---\n"
            f"Backend: {settings.EMAIL_BACKEND}\n"
            f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}\n"
            f"From: {settings.DEFAULT_FROM_EMAIL}\n"
            f"To: {recipient}\n"
        )
        html_message = (
            "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; "
            "padding: 24px; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; "
            "border-radius: 10px; color: #1e293b;'>"
            "<div style='text-align: center; margin-bottom: 24px;'>"
            "<h1 style='color: #4f46e5; margin: 0; font-size: 24px;'>Bookstore</h1>"
            "<p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>SMTP Configuration Test</p>"
            "</div>"
            "<div style='background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;'>"
            "<p style='margin: 0; color: #065f46; font-size: 15px; font-weight: 600;'>"
            "&#10004; Email delivery is functioning properly!"
            "</p>"
            "<p style='margin: 6px 0 0 0; color: #047857; font-size: 13px;'>"
            "Your Django application successfully authenticated and dispatched this message."
            "</p>"
            "</div>"
            "<p style='font-size: 14px; line-height: 1.5; color: #334155;'>"
            "This confirms that order confirmation emails and OTP verification codes will be delivered to users."
            "</p>"
            "<div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #475569; margin-top: 20px;'>"
            "<strong>Backend:</strong> " + str(settings.EMAIL_BACKEND) + "<br>"
            "<strong>Host:</strong> " + str(settings.EMAIL_HOST) + ":" + str(settings.EMAIL_PORT) + "<br>"
            "<strong>From:</strong> " + str(settings.DEFAULT_FROM_EMAIL) +
            "</div>"
            "<p style='font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; margin-bottom: 0;'>"
            "&copy; Bookstore Development"
            "</p>"
            "</div>"
        )

        try:
            self.stdout.write("Sending test email...")
            sent_count = send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                html_message=html_message,
                fail_silently=False,
            )
            if sent_count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"\n SUCCESS: Test email dispatched successfully to '{recipient}'!"
                    )
                )
        except Exception as exc:
            self.stderr.write(
                self.style.ERROR(f"\n FAILED to send email: {exc}\n")
            )
            self.stderr.write("Troubleshooting Tips for Gmail SMTP:")
            self.stderr.write("1. Google accounts require 2-Step Verification enabled to use SMTP.")
            self.stderr.write("2. You must generate an App Password (16 letters) — your regular Google account password will NOT work.")
            self.stderr.write("   Generate it here: https://myaccount.google.com/apppasswords")
            self.stderr.write("3. Ensure EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in backend/.env are set without extra spaces.")
            self.stderr.write("4. Verify that port 587 (TLS) is not blocked by your firewall or ISP.")
