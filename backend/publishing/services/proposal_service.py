# publishing/services/proposal_service.py

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from ..models.proposal import Proposal


class ProposalService:
    """
    Handles publisher proposal workflow.

    This service is responsible for:
    - validating proposal actions
    - applying approved changes
    - updating proposal lifecycle
    """

    @staticmethod
    @transaction.atomic
    def reject(proposal, reviewer, reason):
        """
        Rejects a submitted proposal.

        Args:
            proposal:
                Proposal instance being rejected.

            reviewer:
                Admin/user performing the rejection.

            reason:
                Explanation stored for audit purposes.
        """

        if proposal is None:
            raise ValidationError(
                "Proposal does not exist."
            )

        if not proposal.can_reject():
            raise ValidationError(
                "Only submitted proposals can be rejected."
            )

        if not reason:
            raise ValidationError(
                "A rejection reason is required."
            )

        proposal.reject(
            reviewer=reviewer,
            reason=reason,
        )

        proposal.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_notes",
            ]
        )

        return proposal

    @staticmethod
    def approve(...):
        ...

    @staticmethod
    def apply(...):
        ...

    @staticmethod
    def _apply_book_create(...):
        ...

    @staticmethod
    def _apply_book_update(...):
        ...

    @staticmethod
    def _apply_price_change(...):
        ...