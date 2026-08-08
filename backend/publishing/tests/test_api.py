from decimal import Decimal

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
            Proposal.Status.SUBMITTED,
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
                "publisher": self.publisher.id,
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
                "publisher": self.other_publisher.id,
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