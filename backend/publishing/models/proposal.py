# publishing/models/proposal.py

from django.conf import settings
from django.db import models
from django.utils import timezone
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
        PENDING = "PENDING", _("Pending")
        APPROVED = "APPROVED", _("Approved")
        REJECTED = "REJECTED", _("Rejected")
        WITHDRAWN = "WITHDRAWN", _("Withdrawn")
        APPLIED = "APPLIED", _("Applied")

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
        default=Status.PENDING,
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

    def is_submitted(self):
        return self.status == self.Status.PENDING

    def can_reject(self):
        return self.is_submitted()

    def can_approve(self):
        return self.is_submitted()

    def reject(self, reviewer, reason):
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_notes = reason

    def mark_applied(self, reviewer):
        self.status = self.Status.APPLIED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.applied_at = timezone.now()

    def can_withdraw(self):
        return self.status == self.Status.PENDING


    def mark_withdrawn(self, note="Withdrawn by submitter."):
        if not self.can_withdraw():
            raise ValueError("Only pending proposals can be withdrawn.")

        self.status = self.Status.WITHDRAWN
        self.review_notes = note
        self.save(update_fields=["status", "review_notes"])