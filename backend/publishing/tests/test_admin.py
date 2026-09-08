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
