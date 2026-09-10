from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse

from catalog.models import Author, Book
from publishing.models import (
    Proposal,
    BookCreateProposal,
    Publisher,
    PublisherMembership,
)

User = get_user_model()


class ProposalAdminTestCase(TestCase):

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@test.com",
            password="adminpassword123",
            is_staff=True,
            is_superuser=True,
        )

        self.publisher_user = User.objects.create_user(
            username="pub_user",
            email="pub@test.com",
            password="password123",
        )

        self.publisher = Publisher.objects.create(
            name="Test Publishing Co",
            slug="test-publishing-co",
        )

        PublisherMembership.objects.create(
            publisher=self.publisher,
            user=self.publisher_user,
            role="OWNER",
            is_active=True,
        )

        self.author = Author.objects.create(
            name="Admin Test Author",
            biography="Admin Test Bio",
        )

        self.client = Client()
        self.client.force_login(self.admin)

    def test_approve_selected_admin_action(self):
        proposal = Proposal.objects.create(
            title="Create book: Test Admin Book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )

        BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Test Admin Book",
            description="A test book description",
            genre="FICTION",
        )

        url = reverse("admin:publishing_proposal_changelist")
        response = self.client.post(url, {
            "action": "approve_selected",
            "_selected_action": [str(proposal.id)],
        }, follow=True)

        self.assertEqual(response.status_code, 200)

        proposal.refresh_from_db()
        self.assertEqual(proposal.status, Proposal.Status.APPLIED)
        self.assertEqual(proposal.reviewed_by, self.admin)
        self.assertTrue(Book.objects.filter(title="Test Admin Book").exists())

    def test_reject_selected_admin_action(self):
        proposal = Proposal.objects.create(
            title="Create book: Rejected Book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )

        BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Rejected Book",
            description="Description",
            genre="FICTION",
        )

        url = reverse("admin:publishing_proposal_changelist")
        response = self.client.post(url, {
            "action": "reject_selected",
            "_selected_action": [str(proposal.id)],
        }, follow=True)

        self.assertEqual(response.status_code, 200)

        proposal.refresh_from_db()
        self.assertEqual(proposal.status, Proposal.Status.REJECTED)
        self.assertEqual(proposal.reviewed_by, self.admin)
        self.assertFalse(Book.objects.filter(title="Rejected Book").exists())

    def test_direct_approve_view(self):
        proposal = Proposal.objects.create(
            title="Create book: Direct Approve Book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )
        BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Direct Approve Book",
            description="Book synopsis description",
            genre="FICTION",
            isbn="978-1234567890",
        )

        approve_url = reverse("admin:publishing_proposal_approve", args=[proposal.id])
        response = self.client.get(approve_url, follow=True)
        self.assertEqual(response.status_code, 200)

        proposal.refresh_from_db()
        self.assertEqual(proposal.status, Proposal.Status.APPLIED)
        self.assertEqual(proposal.reviewed_by, self.admin)
        self.assertTrue(Book.objects.filter(title="Direct Approve Book").exists())

    def test_direct_reject_view(self):
        proposal = Proposal.objects.create(
            title="Create book: Direct Reject Book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )
        BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Direct Reject Book",
            description="Book synopsis description",
            genre="FICTION",
        )

        reject_url = reverse("admin:publishing_proposal_reject", args=[proposal.id])
        # Test GET loads confirmation page
        get_response = self.client.get(reject_url)
        self.assertEqual(get_response.status_code, 200)
        self.assertContains(get_response, "Reject Proposal")

        # Test POST with reason performs rejection
        post_response = self.client.post(reject_url, {
            "reason": "Incomplete catalog synopsis."
        }, follow=True)
        self.assertEqual(post_response.status_code, 200)

        proposal.refresh_from_db()
        self.assertEqual(proposal.status, Proposal.Status.REJECTED)
        self.assertEqual(proposal.reviewed_by, self.admin)
        self.assertEqual(proposal.review_notes, "Incomplete catalog synopsis.")

    def test_dynamic_inlines_and_inspection_card(self):
        from django.contrib.admin.sites import AdminSite
        from publishing.admin import (
            ProposalAdmin,
            BookCreateProposalInline,
            BookUpdateProposalInline,
        )
        from publishing.models import BookUpdateProposal

        site = AdminSite()
        admin_instance = ProposalAdmin(Proposal, site)

        # 1. Book Create Proposal inline & card
        create_prop = Proposal.objects.create(
            title="Create book: Card Book",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
        )
        BookCreateProposal.objects.create(
            proposal=create_prop,
            author=self.author,
            title="Card Book",
            description="A comprehensive synopsis of the book.",
            genre="FICTION",
        )
        inlines = admin_instance.get_inlines(None, create_prop)
        self.assertEqual(inlines, [BookCreateProposalInline])

        card_html = admin_instance.proposal_inspection_card(create_prop)
        self.assertIn("New Book Submission Overview", card_html)
        self.assertIn("Card Book", card_html)

        # Preview card test
        preview_html = admin_instance.content_preview(create_prop)
        self.assertIn("Card Book", preview_html)
        self.assertIn("Admin Test Author", preview_html)

        # 2. Book Update Proposal inline & diff card
        existing_book = Book.objects.create(
            title="Original Book Title",
            author=self.author,
            genre="FICTION",
            description="Original book description.",
        )
        update_prop = Proposal.objects.create(
            title="Update: Original Book Title",
            publisher=self.publisher,
            submitted_by=self.publisher_user,
            proposal_type=Proposal.ProposalType.BOOK_UPDATE,
            status=Proposal.Status.PENDING,
        )
        BookUpdateProposal.objects.create(
            proposal=update_prop,
            book=existing_book,
            title="New Proposed Title",
            genre="PHILOSOPHY",
            description="Updated and expanded book description.",
        )
        update_inlines = admin_instance.get_inlines(None, update_prop)
        self.assertEqual(update_inlines, [BookUpdateProposalInline])

        diff_html = admin_instance.proposal_inspection_card(update_prop)
        self.assertIn("Side-by-Side Comparison", diff_html)
        self.assertIn("Original Book Title", diff_html)
        self.assertIn("New Proposed Title", diff_html)
        self.assertIn("Modified", diff_html)
