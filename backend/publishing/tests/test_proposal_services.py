from django.contrib.auth import get_user_model
from django.test import TestCase

from pricing.models import Price
from publishing.models.pricing import PriceChangeProposal
from publishing.models.catalog import BookUpdateProposal
from catalog.models import Author, Book
from publishing.models import (
    Proposal,
    BookCreateProposal,
    Publisher,
    PublisherMembership,
)
from publishing.services.proposal_service import ProposalService


User = get_user_model()

class ProposalServiceTests(TestCase):

    def setUp(self):

        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@test.com",
            password="password123",
        )

        self.publisher_user = User.objects.create_user(
            username="publisher",
            password="password123",
        )

        self.publisher = Publisher.objects.create(
            name="Test Publisher",
            slug="test-publisher",
        )

        PublisherMembership.objects.create(
            publisher=self.publisher,
            user=self.publisher_user,
            role="OWNER",
            is_active=True,
        )

        self.author = Author.objects.create(
            name="Test Author",
            biography="Test biography",
        )

    def test_reject_submitted_proposal(self):

        proposal = Proposal.objects.create(
            title="Reject test",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )


        result = ProposalService.reject(
            proposal,
            self.admin,
            "Missing metadata.",
        )


        result.refresh_from_db()


        self.assertEqual(
            result.status,
            Proposal.Status.REJECTED,
        )

        self.assertEqual(
            result.reviewed_by,
            self.admin,
        )

        self.assertEqual(
            result.review_notes,
            "Missing metadata.",
        )

    def test_approve_book_creation_proposal(self):

        proposal = Proposal.objects.create(
            title="Create book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )


        book_proposal = BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Testing Django",
            isbn="9781234567890",
            description="A test book.",
            genre="TECH",
            cover_image_url="https://example.com/book.jpg",
            is_digital=True,
            is_audio=False,
            digital_file_path="books/test.epub",
            audio_file_path="",
        )


        ProposalService.approve(
            proposal,
            self.admin,
        )


        proposal.refresh_from_db()


        self.assertEqual(
            proposal.status,
            Proposal.Status.APPLIED,
        )


        self.assertIsNotNone(
            book_proposal.created_book
        )


        created_book = book_proposal.created_book


        self.assertEqual(
            created_book.title,
            "Testing Django",
        )


        self.assertEqual(
            created_book.isbn,
            "9781234567890",
        )

    def test_approve_book_update_proposal(self):

        book = Book.objects.create(
            author=self.author,
            title="Old Title",
            slug="old-title",
            isbn="9781234567891",
            description="Old description",
            genre="TECH",
            is_digital=True,
            is_audio=False,
        )


        proposal = Proposal.objects.create(
            title="Update book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_UPDATE,
            status=Proposal.Status.PENDING,
        )


        BookUpdateProposal.objects.create(
            proposal=proposal,
            book=book,
            title="New Title",
            description="New description",
            genre="SCIENCE",
            cover_image_url="https://example.com/new.jpg",
            is_digital=True,
            is_audio=True,
            digital_file_path="new.epub",
            audio_file_path="new.mp3",
        )


        ProposalService.approve(
            proposal,
            self.admin,
        )


        book.refresh_from_db()


        self.assertEqual(
            book.title,
            "New Title",
        )

        self.assertEqual(
            book.genre,
            "SCIENCE",
        )

        self.assertTrue(
            book.is_audio,
        )


        proposal.refresh_from_db()

        self.assertEqual(
            proposal.status,
            Proposal.Status.APPLIED,
        )

    def test_approve_price_change_proposal(self):

        book = Book.objects.create(
            author=self.author,
            title="Pricing Test Book",
            slug="pricing-test-book",
            isbn="9781234567892",
            description="Pricing test book.",
            genre="TECH",
            is_digital=True,
            is_audio=False,
        )

        original_price = book.change_price(
            value=50,
            min_price=20,
        )

        proposal = Proposal.objects.create(
            title="Increase book price",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.PRICE_CHANGE,
            status=Proposal.Status.PENDING,
        )

        PriceChangeProposal.objects.create(
            proposal=proposal,
            book=book,
            value=60,
            min_price=20,
            reason="Annual price adjustment.",
        )

        ProposalService.approve(
            proposal,
            self.admin,
        )

        proposal.refresh_from_db()

        self.assertEqual(
            proposal.status,
            Proposal.Status.APPLIED,
        )

        self.assertEqual(
            Price.objects.filter(
                book=book
            ).count(),
            2,
        )

        latest_price = (
            Price.objects
            .filter(book=book)
            .order_by("-effective_from")
            .first()
        )

        self.assertEqual(
            latest_price.value,
            60,
        )

        self.assertEqual(
            original_price.value,
            50,
        )