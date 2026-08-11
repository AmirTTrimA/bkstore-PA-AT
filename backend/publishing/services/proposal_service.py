from catalog.models import Book
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from ..models.catalog import BookCreateProposal, BookUpdateProposal
from ..models.pricing import PriceChangeProposal
from ..models.proposal import Proposal


class ProposalService:
    """
    Handles publisher proposal workflow.

    This service is responsible for:
    - validating proposal actions
    - submitting proposals
    - applying approved changes
    - updating proposal lifecycle
    """

    # ============================================================
    # Submission
    # ============================================================

    @staticmethod
    @transaction.atomic
    def submit_book_create(
        publisher,
        user,
        **validated_data,
    ):
        """
        Creates and submits a new book creation proposal.

        The generic Proposal and its BookCreateProposal detail
        are created atomically.
        """

        proposal = Proposal.objects.create(
            title=f"Create book: {validated_data['title']}",
            publisher=publisher,
            submitted_by=user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.SUBMITTED,
            submitted_at=timezone.now(),
        )

        BookCreateProposal.objects.create(
            proposal=proposal,
            **validated_data,
        )

        return proposal

    @staticmethod
    @transaction.atomic
    def submit_book_update(
        publisher,
        user,
        **validated_data,
    ):
        """
        Creates and submits a book update proposal.

        Only one submitted update proposal may exist for
        a particular book at a time.
        """

        book = validated_data["book"]

        existing_proposal = Proposal.objects.filter(
            proposal_type=Proposal.ProposalType.BOOK_UPDATE,
            status=Proposal.Status.SUBMITTED,
            book_update__book=book,
        ).exists()

        if existing_proposal:
            raise ValidationError(
                "There is already a submitted update proposal "
                "for this book."
            )

        proposal = Proposal.objects.create(
            title=f"Update book: {book.title}",
            publisher=publisher,
            submitted_by=user,
            proposal_type=Proposal.ProposalType.BOOK_UPDATE,
            status=Proposal.Status.SUBMITTED,
            submitted_at=timezone.now(),
        )

        BookUpdateProposal.objects.create(
            proposal=proposal,
            **validated_data,
        )

        return proposal

    @staticmethod
    @transaction.atomic
    def submit_price_change(
        publisher,
        user,
        **validated_data,
    ):
        """
        Creates and submits a price change proposal.

        The current price is not modified here.
        It is changed only when the proposal is approved.
        """

        book = validated_data["book"]

        proposal = Proposal.objects.create(
            title=f"Price update for {book.title}",
            publisher=publisher,
            submitted_by=user,
            proposal_type=Proposal.ProposalType.PRICE_CHANGE,
            status=Proposal.Status.SUBMITTED,
            submitted_at=timezone.now(),
        )

        PriceChangeProposal.objects.create(
            proposal=proposal,
            **validated_data,
        )

        return proposal

    # ============================================================
    # Rejection
    # ============================================================

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

        if not reason or not reason.strip():
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

    # ============================================================
    # Approval
    # ============================================================

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

        result = ProposalService.apply(proposal)

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

    # ============================================================
    # Application
    # ============================================================

    @staticmethod
    @transaction.atomic
    def apply(proposal):
        """
        Applies proposal-specific business changes.
        """

        handlers = {
            Proposal.ProposalType.BOOK_CREATE:
                ProposalService._apply_book_create,

            Proposal.ProposalType.BOOK_UPDATE:
                ProposalService._apply_book_update,

            Proposal.ProposalType.PRICE_CHANGE:
                ProposalService._apply_price_change,

            # TODO: AUTHOR_CREATE, AUTHOR_UPDATE, BOOK_DELETE
        }

        handler = handlers.get(
            proposal.proposal_type
        )

        if handler is None:
            raise ValidationError(
                "Unsupported proposal type."
            )

        return handler(proposal)

    @staticmethod
    def _generate_unique_book_slug(title):

        base_slug = slugify(title)
        slug = base_slug
        counter = 2

        while Book.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

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

            slug=ProposalService._generate_unique_book_slug(
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
        """
        Applies a book update proposal to an existing Book.
        """

        try:
            update = proposal.book_update

        except BookUpdateProposal.DoesNotExist:
            raise ValidationError(
                "Book update details are missing."
            )

        book = update.book

        book.title = update.title
        book.description = update.description
        book.cover_image_url = update.cover_image_url
        book.genre = update.genre

        book.is_digital = update.is_digital
        book.is_audio = update.is_audio

        book.digital_file_path = update.digital_file_path
        book.audio_file_path = update.audio_file_path

        book.save()

        return book

    @staticmethod
    def _apply_price_change(proposal):
        """
        Applies a price change proposal to an existing Book.

        The Book.change_price() business method is used so that
        price history and pricing rules remain centralized in the
        catalog domain.
        """

        try:
            price_proposal = proposal.price_change

        except PriceChangeProposal.DoesNotExist:
            raise ValidationError(
                "Price change details are missing."
            )

        book = price_proposal.book

        return book.change_price(
            value=price_proposal.value,
            currency=price_proposal.currency,
            min_price=price_proposal.min_price,
        )