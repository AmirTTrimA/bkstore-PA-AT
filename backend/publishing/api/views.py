from django.db.models import F, Q
from catalog.models import Book
from catalog.serializers import BookListSerializer
from publishing.models import Proposal, Publisher
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsProposalPublisherMember, IsPublisherMember
from .serializers import (BookCreateProposalResponseSerializer,
                          BookCreateProposalSubmissionSerializer,
                          BookUpdateProposalResponseSerializer,
                          BookUpdateProposalSubmissionSerializer,
                          BookDeleteProposalSubmissionSerializer,
                          BookDeleteProposalResponseSerializer,
                          PriceChangeProposalResponseSerializer,
                          PriceChangeProposalSubmissionSerializer, ProposalWithdrawalSerializer,
                          PublisherProposalDetailSerializer, ProposalListSerializer,
                          PublisherSerializer, AuthorCreateProposalResponseSerializer,
                          AuthorCreateProposalSubmissionSerializer,
                          AuthorUpdateProposalResponseSerializer,
                          AuthorUpdateProposalSubmissionSerializer,)


class MyPublishersView(generics.ListAPIView):
    """
    Returns the publishers where the current user has an active membership.
    Staff and superusers receive active publishers for administrative access.
    """

    serializer_class = PublisherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            user_memberships = (
                Publisher.objects.filter(
                    members__user=user, members__is_active=True
                )
                .annotate(role=F("members__role"))
                .order_by("name")
            )
            if user_memberships.exists():
                return user_memberships
            return (
                Publisher.objects.filter(is_active=True)
                .annotate(role=F("members__role"))
                .order_by("name")
            )

        return (
            Publisher.objects
            .filter( members__user=self.request.user, members__is_active=True )
            .annotate( role=F("members__role") )
            .order_by("name")
        )


class PublicPublisherListView(generics.ListAPIView):
    """
    Public list of active publishers for the storefront.
    """

    serializer_class = PublisherSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Publisher.objects.filter(is_active=True).order_by("name")


class PublicPublisherDetailView(generics.RetrieveAPIView):
    """
    Public detail of an active publisher by ID or slug.
    """

    serializer_class = PublisherSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        lookup = self.kwargs["id_or_slug"]
        if str(lookup).isdigit():
            return generics.get_object_or_404(Publisher, id=int(lookup), is_active=True)
        return generics.get_object_or_404(Publisher, slug=lookup, is_active=True)


class PublisherBooksView(generics.ListAPIView):
    """
    Returns books associated with a specific publisher.
    Accessible to active members of the publisher and staff/superusers.
    """

    serializer_class = BookListSerializer
    permission_classes = [IsAuthenticated, IsPublisherMember]

    def get_queryset(self):
        pub_id = self.kwargs["publisher_id"]
        return (
            Book.objects.filter(
                Q(creation_proposal__proposal__publisher_id=pub_id)
                | Q(update_proposals__proposal__publisher_id=pub_id)
                | Q(price_change_proposals__proposal__publisher_id=pub_id)
                | Q(deletion_proposals__proposal__publisher_id=pub_id)
            )
            .select_related("author")
            .prefetch_related("formats", "formats__prices")
            .distinct()
            .order_by("-created_at")
        )


class PublisherProposalListView(generics.ListAPIView):
    """
    Lists proposals belonging to a specific publisher.
    Only active members of that publisher may access it.
    """

    serializer_class = ProposalListSerializer
    permission_classes = [
        IsAuthenticated,
        IsPublisherMember,
    ]

    def get_queryset(self):

        queryset = (
            Proposal.objects
            .filter(
                publisher_id=self.kwargs["publisher_id"]
            )
            .select_related(
                "publisher",
                "submitted_by",
            )
            .order_by(
                "-submitted_at",
                "-created_at",
            )
        )

        status_filter = self.request.query_params.get(
            "status"
        )

        proposal_type_filter = self.request.query_params.get(
            "proposal_type"
        )

        if status_filter in Proposal.Status.values:
            queryset = queryset.filter(
                status=status_filter
            )

        if proposal_type_filter in Proposal.ProposalType.values:
            queryset = queryset.filter(
                proposal_type=proposal_type_filter
            )

        return queryset

class ProposalDetailView(generics.RetrieveAPIView):
    """
    Returns full details for a single proposal.
    Access is restricted to members of the proposal's publisher.
    """

    serializer_class = PublisherProposalDetailSerializer
    permission_classes = [
        IsAuthenticated,
        IsProposalPublisherMember,
    ]

    queryset = (
        Proposal.objects
        .select_related( "publisher", "submitted_by" )
    )

class BookCreateProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit a new book creation proposal.
    """

    serializer_class = BookCreateProposalSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        proposal = serializer.save()

        return Response(
            BookCreateProposalResponseSerializer(
                proposal.book_create
            ).data,
            status=status.HTTP_201_CREATED,
        )

class BookUpdateProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit a book update proposal.
    """

    serializer_class = BookUpdateProposalSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proposal = serializer.save()

        return Response(
            BookUpdateProposalResponseSerializer(
                proposal.book_update
            ).data,
            status=status.HTTP_201_CREATED,
        )

class BookDeleteProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit a book deletion proposal.
    """

    serializer_class = BookDeleteProposalSubmissionSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        proposal = serializer.save()

        return Response(
            BookDeleteProposalResponseSerializer(
                proposal.book_delete
            ).data,
            status=status.HTTP_201_CREATED,
        )

class PriceChangeProposalCreateView(
    generics.CreateAPIView
):

    serializer_class = (
        PriceChangeProposalSubmissionSerializer
    )

    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        proposal = serializer.save()


        return Response(
            PriceChangeProposalResponseSerializer(
                proposal.price_change
            ).data,
            status=status.HTTP_201_CREATED,
        )

class AuthorCreateProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit a new author creation proposal.
    """

    serializer_class = AuthorCreateProposalSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proposal = serializer.save()

        return Response(
            AuthorCreateProposalResponseSerializer(
                proposal.author_create
            ).data,
            status=status.HTTP_201_CREATED,
        )


class AuthorUpdateProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit an author update proposal.
    """

    serializer_class = AuthorUpdateProposalSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proposal = serializer.save()

        return Response(
            AuthorUpdateProposalResponseSerializer(
                proposal.author_update
            ).data,
            status=status.HTTP_201_CREATED,
        )

from django.shortcuts import get_object_or_404


class ProposalWithdrawalView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsProposalPublisherMember,
    ]

    def post(self, request, proposal_id):
        proposal = get_object_or_404(Proposal, pk=proposal_id)

        self.check_object_permissions(request, proposal)

        if proposal.submitted_by != request.user:
            return Response(
                {
                    "detail": "You can only withdraw proposals you submitted."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not proposal.can_withdraw():
            return Response(
                {
                    "detail": "Only pending proposals can be withdrawn."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ProposalWithdrawalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reason = serializer.validated_data.get("reason", "").strip()

        note = (
            f"Withdrawn by submitter: {reason}"
            if reason
            else "Withdrawn by submitter."
        )

        proposal.mark_withdrawn(note=note)

        return Response({
            "proposal_id": proposal.id,
            "status": proposal.status,
            "message": "Proposal withdrawn successfully.",
        })