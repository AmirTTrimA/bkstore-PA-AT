# publishing/services/proposal_service.py

from catalog.models import Book
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from ..models.catalog import BookCreateProposal
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
    @transaction.atomic
    def approve(proposal, reviewer):
        """
        Approves a proposal and applies its requested changes.
        """

        if proposal is None:
            raise ValidationError(
                "Proposal does not exist."
            )

        if not proposal.can_approve():
            raise ValidationError(
                "Only submitted proposals can be approved."
            )

        ProposalService.apply(proposal)

        proposal.mark_applied(
            reviewer=reviewer
        )

        proposal.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "applied_at",
            ]
        )

        return proposal


    @staticmethod
    @transaction.atomic
    def apply(proposal):
        """
        Applies proposal-specific business changes.
        """

        proposal_type = proposal.proposal_type

        if proposal_type == proposal.ProposalType.BOOK_CREATE:
            return ProposalService._apply_book_create(
                proposal
            )

        if proposal_type == proposal.ProposalType.BOOK_UPDATE:
            return ProposalService._apply_book_update(
                proposal
            )

        if proposal_type == proposal.ProposalType.PRICE_CHANGE:
            return ProposalService._apply_price_change(
                proposal
            )

        raise ValidationError(
            "Unsupported proposal type."
        )


    @staticmethod
    def _apply_book_create(proposal):
        """
        Creates a new Book from a BookCreateProposal.
        """

        try:
            book_proposal = proposal.book_create

        except BookCreateProposal.DoesNotExist:
            raise ValidationError(
                "Book creation details are missing."
            )

        book = Book.objects.create(
            author=book_proposal.author,

            title=book_proposal.title,

            slug=slugify(
                book_proposal.title
            ),

            isbn=book_proposal.isbn,

            description=book_proposal.description,

            cover_image_url=(
                book_proposal.cover_image_url
            ),

            genre=book_proposal.genre,

            is_digital=(
                book_proposal.is_digital
            ),

            is_audio=(
                book_proposal.is_audio
            ),

            digital_file_path=(
                book_proposal.digital_file_path
            ),

            audio_file_path=(
                book_proposal.audio_file_path
            ),
        )

        book_proposal.created_book = book
        book_proposal.save(
            update_fields=["created_book"]
        )

        return book


    @staticmethod
    def _apply_book_update(proposal):
        pass


    @staticmethod
    def _apply_price_change(proposal):
        pass