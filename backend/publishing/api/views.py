from django.db.models import F
from rest_framework import permissions
from publishing.models import Proposal, Publisher
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .permissions import IsProposalPublisherMember, IsPublisherMember
from .serializers import (BookCreateProposalSubmissionSerializer, BookUpdateProposalResponseSerializer, PriceChangeProposalResponseSerializer,
                          ProposalDetailSerializer, ProposalListSerializer,
                          ProposalSubmissionResponseSerializer,
                          PublisherSerializer, BookUpdateProposalSubmissionSerializer, PriceChangeProposalSubmissionSerializer)


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
        return (
            Proposal.objects
            .filter(publisher_id=self.kwargs["publisher_id"])
            .select_related(
                "publisher",
                "submitted_by",
                "reviewed_by",
            )
            .order_by(
                "-submitted_at",
                "-created_at",
            )
        )


class ProposalDetailView(generics.RetrieveAPIView):
    """
    Returns full details for a single proposal.
    Access is restricted to members of the proposal's publisher.
    """

    serializer_class = ProposalDetailSerializer
    permission_classes = [
        IsAuthenticated,
        IsProposalPublisherMember,
    ]

    queryset = (
        Proposal.objects
        .select_related( "publisher", "submitted_by", "reviewed_by" )
    )

class BookCreateProposalSubmissionView(generics.CreateAPIView):
    """
    Allows a publisher member to submit a new book creation proposal.
    The request creates a Proposal + BookCreateProposal in SUBMITTED status.
    """

    serializer_class = BookCreateProposalSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proposal = serializer.save()

        response_data = {
            "proposal_id": proposal.id,
            "proposal_type": proposal.proposal_type,
            "status": proposal.status,
            "submitted_at": proposal.submitted_at,
            "title": proposal.book_create.title,
            "message": "Book creation proposal submitted successfully.",
        }

        response_serializer = ProposalSubmissionResponseSerializer( response_data )

        return Response( response_serializer.data, status=status.HTTP_201_CREATED )

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

        response_data = {
            "proposal_id": proposal.id,
            "proposal_type": proposal.proposal_type,
            "status": proposal.status,
            "submitted_at": proposal.submitted_at,
            "title": proposal.book_update.title,
            "message": "Book update proposal submitted successfully.",
        }

        response_serializer = ProposalSubmissionResponseSerializer(
            response_data
        )

        return Response(
            BookUpdateProposalResponseSerializer(
                proposal.book_update
            ).data,
            status=status.HTTP_201_CREATED,
        )

class PriceChangeProposalCreateView(
    generics.CreateAPIView
):

    serializer_class = (
        PriceChangeProposalSubmissionSerializer
    )

    permission_classes = (
        permissions.IsAuthenticated,
    )


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