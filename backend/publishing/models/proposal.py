# publishing/models/proposal.py

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from .publisher import Publisher


class Proposal(models.Model):
    """
    Generic workflow model.

    Stores proposal lifecycle information while proposal-specific
    data lives in dedicated detail models.
    """

    class ProposalType(models.TextChoices):

        BOOK_CREATE = "BOOK_CREATE", _("Book Creation")
        BOOK_UPDATE = "BOOK_UPDATE", _("Book Update")
        BOOK_DELETE = "BOOK_DELETE", _("Book Deletion")

        AUTHOR_CREATE = "AUTHOR_CREATE", _("Author Creation")
        AUTHOR_UPDATE = "AUTHOR_UPDATE", _("Author Update")

        PRICE_CHANGE = "PRICE_CHANGE", _("Price Change")

    class Status(models.TextChoices):

        DRAFT = "DRAFT", _("Draft")

        SUBMITTED = "SUBMITTED", _("Submitted")

        UNDER_REVIEW = "UNDER_REVIEW", _("Under Review")

        APPROVED = "APPROVED", _("Approved")

        APPLIED = "APPLIED", _("Applied")

        REJECTED = "REJECTED", _("Rejected")

    title = models.CharField(
        _("Title"),
        max_length=255,
    )

    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.CASCADE,
        related_name="proposals",
        verbose_name=_("Publisher"),
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_proposals",
        verbose_name=_("Submitted By"),
        help_text=_(
            "Publisher member who submitted this proposal."
        ),
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reviewed_proposals",
        null=True,
        blank=True,
        verbose_name=_("Reviewed By"),
        help_text=_(
            "Administrator who reviewed this proposal."
        ),
    )

    proposal_type = models.CharField(
        _("Proposal Type"),
        max_length=30,
        choices=ProposalType.choices,
    )

    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    review_notes = models.TextField(
        _("Review Notes"),
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    reviewed_at = models.DateTimeField(
        _("Reviewed At"),
        null=True,
        blank=True,
    )

    applied_at = models.DateTimeField(
        _("Applied At"),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Proposal")
        verbose_name_plural = _("Proposals")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def clean(self):
        ...