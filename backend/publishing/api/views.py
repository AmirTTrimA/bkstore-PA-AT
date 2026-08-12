# publishing/api/views.py
from django.db.models import F
from publishing.models import Proposal, Publisher
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .permissions import IsProposalPublisherMember, IsPublisherMember
from .serializers import (BookCreateProposalResponseSerializer,
                          BookCreateProposalSubmissionSerializer,
                          BookUpdateProposalResponseSerializer,
                          BookUpdateProposalSubmissionSerializer,
                          BookDeleteProposalSubmissionSerializer,
                          BookDeleteProposalResponseSerializer,
                          PriceChangeProposalResponseSerializer,
                          PriceChangeProposalSubmissionSerializer,
                          PublisherProposalDetailSerializer, ProposalListSerializer,
                          PublisherSerializer, AuthorCreateProposalResponseSerializer,
                          AuthorCreateProposalSubmissionSerializer,
                          AuthorUpdateProposalResponseSerializer,
                          AuthorUpdateProposalSubmissionSerializer,)


class MyPublishersView(generics.ListAPIView):
    """
    Returns the publishers where the current user has an active membership.
    """

    serializer_class = PublisherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Publisher.objects
            .filter( members__user=self.request.user, members__is_active=True )
            .annotate( role=F("members__role") )
            .order_by("name")
        )

from publishing.models import Proposal
from rest_framework.permissions import IsAuthenticated

from .permissions import IsPublisherMember
from .serializers import ProposalListSerializer


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