from decimal import Decimal
from django.utils import timezone as django_timezone

from accounts.models import User
from catalog.models import Author, Book
from django.urls import reverse
from publishing.models import (BookCreateProposal, BookUpdateProposal,
                               PriceChangeProposal, Proposal, Publisher,
                               PublisherMembership)
from rest_framework import status
from rest_framework.test import APITestCase


class PublishingAPITestCase(APITestCase):

    def setUp(self):

        self.user = User.objects.create_user(
            username="publisher_user",
            email="publisher@test.com",
            password="testpass123",
        )

        self.other_user = User.objects.create_user(
            username="other_user",
            email="other@test.com",
            password="testpass123",
        )


        self.publisher = Publisher.objects.create(
            name="Demo Publishing",
            contact_email="demo@publisher.com",
        )


        self.other_publisher = Publisher.objects.create(
            name="Other Publishing",
            contact_email="other@publisher.com",
        )


        PublisherMembership.objects.create(
            publisher=self.publisher,
            user=self.user,
            role=PublisherMembership.Role.OWNER,
        )


        PublisherMembership.objects.create(
            publisher=self.other_publisher,
            user=self.other_user,
            role=PublisherMembership.Role.OWNER,
        )


        self.author = Author.objects.create(
            name="Test Author",
            biography="Author biography",
        )


        self.book = Book.objects.create(
            author=self.author,
            title="Original Book",
            slug="original-book",
            isbn="1234567890123",
            description="Original description",
            genre="TECH",
            is_digital=True,
            digital_file_path="books/original.epub",
        )


        self.client.force_authenticate(
            user=self.user
        )

    def create_proposal(self, publisher, user):
        proposal = Proposal.objects.create(
            title="Test Proposal",
            publisher=publisher,
            submitted_by=user,
            proposal_type=Proposal.ProposalType.BOOK_CREATE,
            status=Proposal.Status.PENDING,
            submitted_at=django_timezone.now(),
        )

        BookCreateProposal.objects.create(
            proposal=proposal,
            author=self.author,
            title="Proposed Book",
            description="Proposed description",
            genre="TECH",
            isbn="9876543210123",
        )

        return proposal

class PublisherAPITest(PublishingAPITestCase):

    def test_user_can_view_own_publishers(self):

        response = self.client.get(
            "/api/v1/publishing/publishers/"
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )


        self.assertEqual(
            response.data["count"],
            1,
        )


        self.assertEqual(
            response.data["results"][0]["name"],
            "Demo Publishing",
        )

    def test_user_cannot_view_other_publishers(self):

        response = self.client.get(
            "/api/v1/publishing/publishers/"
        )


        names = [
            item["name"]
            for item in response.data["results"]
        ]


        self.assertNotIn(
            "Other Publishing",
            names,
        )

    def test_inactive_membership_cannot_view_publisher_proposals(self):
        membership = PublisherMembership.objects.get(
            publisher=self.publisher,
            user=self.user,
        )

        membership.is_active = False
        membership.save(update_fields=["is_active"])

        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.publisher.id}/proposals/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )


    def test_member_cannot_view_inactive_publisher(self):
        self.publisher.is_active = False
        self.publisher.save(update_fields=["is_active"])

        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.publisher.id}/proposals/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_user_cannot_view_other_publishers_proposals(self):
        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.other_publisher.id}/proposals/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_user_can_view_own_proposal(self):
        proposal = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        response = self.client.get(
            f"/api/v1/publishing/proposals/{proposal.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

    def test_user_cannot_view_other_publishers_proposal(self):
        proposal = self.create_proposal(
            publisher=self.other_publisher,
            user=self.other_user,
        )

        response = self.client.get(
            f"/api/v1/publishing/proposals/{proposal.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_proposal_detail_hides_internal_review_fields(self):
        proposal = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        proposal.review_notes = "Internal moderation note"
        proposal.save(update_fields=["review_notes"])

        response = self.client.get(
            f"/api/v1/publishing/proposals/{proposal.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertNotIn("review_notes", response.data)
        self.assertNotIn("reviewed_by_username", response.data)

    def test_can_filter_proposals_by_status(self):

        submitted = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        rejected = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        rejected.status = Proposal.Status.REJECTED
        rejected.save(update_fields=["status"])

        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.publisher.id}/proposals/?status=PENDING"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        proposal_ids = [
            item["id"]
            for item in response.data["results"]
        ]

        self.assertIn(submitted.id, proposal_ids)
        self.assertNotIn(rejected.id, proposal_ids)

    def test_can_filter_proposals_by_type(self):

        proposal = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.publisher.id}/proposals/?proposal_type=BOOK_CREATE"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        proposal_ids = [
            item["id"]
            for item in response.data["results"]
        ]

        self.assertIn(proposal.id, proposal_ids)

    def test_invalid_filters_are_ignored(self):

        self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        response = self.client.get(
            f"/api/v1/publishing/publishers/{self.publisher.id}/proposals/?status=INVALID"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertGreaterEqual(
            response.data["count"],
            1,
        )

class ProposalSubmissionAPITest(
    PublishingAPITestCase
):

    def test_submit_book_create_proposal(self):

        response = self.client.post(
            "/api/v1/publishing/proposals/book-create/",
            {
                "publisher_id": self.publisher.id,
                "title": "New API Book",
                "description": "Created through API",
                "genre": "TECH",
                "author": self.author.id,
                "isbn": "9999999999999",
                "is_digital": True,
                "digital_file_path": "demo/book.epub",
            },
            format="json",
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )


        self.assertEqual(
            Proposal.objects.count(),
            1,
        )


        proposal = Proposal.objects.first()


        self.assertEqual(
            proposal.proposal_type,
            Proposal.ProposalType.BOOK_CREATE,
        )


        self.assertEqual(
            proposal.status,
            Proposal.Status.PENDING,
        )


        self.assertTrue(
            hasattr(
                proposal,
                "book_create",
            )
        )

    def test_submit_book_update_proposal(self):

        response = self.client.post(
            "/api/v1/publishing/proposals/book-update/",
            {
                "publisher_id": self.publisher.id,
                "book": self.book.id,
                "title": "Updated Title",
                "description": "Updated description",
                "genre": "SCIENCE",
                "is_digital": True,
                "is_audio": False,
            },
            format="json",
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )


        proposal = Proposal.objects.first()


        update = proposal.book_update


        self.assertEqual(
            update.book,
            self.book,
        )


        self.assertEqual(
            update.title,
            "Updated Title",
        )

    def test_submit_price_change_proposal(self):

        response = self.client.post(
            "/api/v1/publishing/proposals/price-change/",
            {
                "publisher_id": self.publisher.id,
                "book": self.book.id,
                "value": "49.99",
                "currency": "USD",
                "min_price": "20.00",
                "reason": "Price update",
            },
            format="json",
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )


        proposal = Proposal.objects.first()


        price_change = proposal.price_change


        self.assertEqual(
            price_change.value,
            Decimal("49.99"),
        )

    def test_cannot_submit_for_unowned_publisher(self):

        response = self.client.post(
            "/api/v1/publishing/proposals/book-create/",
            {
                "publisher_id": self.other_publisher.id,
                "title": "Unauthorized Book",
                "description": "Should fail",
                "genre": "TECH",
                "author": self.author.id,
                "isbn": "8888888888888",
            },
            format="json",
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_authentication_required(self):

        self.client.force_authenticate(
            user=None
        )


        response = self.client.get(
            "/api/v1/publishing/publishers/"
        )


        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_submission_does_not_create_book(self):

        books_before = Book.objects.count()


        self.client.post(
            "/api/v1/publishing/proposals/book-create/",
            {
                "publisher": self.publisher.id,
                "title": "Future Book",
                "description": "Pending approval",
                "genre": "TECH",
                "author": self.author.id,
                "isbn": "7777777777777",
            },
            format="json",
        )


        self.assertEqual(
            Book.objects.count(),
            books_before,
        )

    def test_submit_book_delete_proposal(self):

        response = self.client.post(
            "/api/v1/publishing/proposals/book-delete/",
            {
                "publisher_id": self.publisher.id,
                "book": self.book.id,
                "reason": "Duplicate catalog entry.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        proposal = Proposal.objects.get(
            id=response.data["proposal_id"]
        )

        self.assertEqual(
            proposal.proposal_type,
            Proposal.ProposalType.BOOK_DELETE,
        )

        self.assertEqual(
            proposal.book_delete.book,
            self.book,
        )


    def test_book_is_not_deleted_before_approval(self):

        self.client.post(
            "/api/v1/publishing/proposals/book-delete/",
            {
                "publisher_id": self.publisher.id,
                "book": self.book.id,
                "reason": "Duplicate catalog entry.",
            },
            format="json",
        )

        self.assertTrue(
            Book.objects.filter(id=self.book.id).exists()
        )

    def test_submit_author_create_proposal(self):
        response = self.client.post(
            "/api/v1/publishing/proposals/author-create/",
            {
                "publisher_id": self.publisher.id,
                "name": "New Proposal Author",
                "biography": "Biography for proposal testing.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        proposal = Proposal.objects.get(
            id=response.data["proposal_id"]
        )

        self.assertEqual(
            proposal.proposal_type,
            Proposal.ProposalType.AUTHOR_CREATE,
        )

        self.assertEqual(
            proposal.author_create.name,
            "New Proposal Author",
        )


    def test_submit_author_update_proposal(self):
        response = self.client.post(
            "/api/v1/publishing/proposals/author-update/",
            {
                "publisher_id": self.publisher.id,
                "author": self.author.id,
                "name": "Updated Author Name",
                "biography": "Updated biography for testing.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        proposal = Proposal.objects.get(
            id=response.data["proposal_id"]
        )

        self.assertEqual(
            proposal.proposal_type,
            Proposal.ProposalType.AUTHOR_UPDATE,
        )

        self.assertEqual(
            proposal.author_update.author,
            self.author,
        )


    def test_cannot_submit_duplicate_author_update_proposal(self):
        self.client.post(
            "/api/v1/publishing/proposals/author-update/",
            {
                "publisher_id": self.publisher.id,
                "author": self.author.id,
                "name": "First Update",
                "biography": "First biography update.",
            },
            format="json",
        )

        response = self.client.post(
            "/api/v1/publishing/proposals/author-update/",
            {
                "publisher_id": self.publisher.id,
                "author": self.author.id,
                "name": "Second Update",
                "biography": "Second biography update.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )


    def test_author_is_not_modified_before_approval(self):
        original_name = self.author.name

        self.client.post(
            "/api/v1/publishing/proposals/author-update/",
            {
                "publisher_id": self.publisher.id,
                "author": self.author.id,
                "name": "Premature Change",
                "biography": "Should not be applied yet.",
            },
            format="json",
        )

        self.author.refresh_from_db()

        self.assertEqual(
            self.author.name,
            original_name,
        )

class ProposalWithdrawalAPITest(PublishingAPITestCase):
    def test_submitter_can_withdraw_pending_proposal(self):
        proposal = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        response = self.client.post(
            f"/api/v1/publishing/proposals/{proposal.id}/withdraw/",
            {"reason": "Wrong ISBN"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        proposal.refresh_from_db()

        self.assertEqual(
            proposal.status,
            Proposal.Status.WITHDRAWN,
        )

        self.assertIn(
            "Wrong ISBN",
            proposal.review_notes,
        )

    def test_cannot_withdraw_non_pending_proposal(self):
        proposal = self.create_proposal(
            publisher=self.publisher,
            user=self.user,
        )

        proposal.status = Proposal.Status.APPROVED
        proposal.save(update_fields=["status"])

        response = self.client.post(
            f"/api/v1/publishing/proposals/{proposal.id}/withdraw/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_cannot_withdraw_another_users_proposal(self):
        teammate = User.objects.create_user(
            username="publisher_teammate",
            email="teammate@test.com",
            password="testpass123",
        )

        PublisherMembership.objects.create(
            publisher=self.publisher,
            user=teammate,
            role=PublisherMembership.Role.EDITOR,
        )

        proposal = self.create_proposal(
            publisher=self.publisher,
            user=teammate,
        )

        response = self.client.post(
            f"/api/v1/publishing/proposals/{proposal.id}/withdraw/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
