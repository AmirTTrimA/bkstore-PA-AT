# publishing/api/serializers.py
from catalog.models import Book
from django.utils import timezone
from pricing.models import Price
from publishing.models import (BookCreateProposal, BookUpdateProposal, BookDeleteProposal,
                               PriceChangeProposal, Proposal, Publisher,
                               PublisherMembership)
from publishing.services.proposal_service import ProposalService
from requests import Response
from rest_framework import serializers


class PublisherSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = Publisher
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "website",
            "role",
        ]

class ProposalListSerializer(serializers.ModelSerializer):
    proposal_type_display = serializers.CharField(
        source="get_proposal_type_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    class Meta:
        model = Proposal
        fields = [
            "id",
            "title",
            "proposal_type",
            "proposal_type_display",
            "status",
            "status_display",
            "submitted_at",
            "reviewed_at",
            "applied_at",
        ]

class BookCreateProposalDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.name",
        read_only=True,
    )

    class Meta:
        model = BookCreateProposal
        fields = [
            "title",
            "isbn",
            "author",
            "author_name",
            "description",
            "cover_image_url",
            "genre",
            "is_digital",
            "is_audio",
            "digital_file_path",
            "audio_file_path",
            "created_book",
        ]


class BookUpdateProposalDetailSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )

    class Meta:
        model = BookUpdateProposal
        fields = [
            "book",
            "book_title",
            "title",
            "description",
            "cover_image_url",
            "genre",
            "is_digital",
            "is_audio",
            "digital_file_path",
            "audio_file_path",
        ]


class PriceChangeProposalDetailSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(
        source="book.title",
        read_only=True,
    )

    class Meta:
        model = PriceChangeProposal
        fields = [
            "book",
            "book_title",
            "value",
            "currency",
            "min_price",
            "reason",
        ]

class AdminProposalDetailSerializer(serializers.ModelSerializer):
    publisher_name = serializers.CharField(
        source="publisher.name",
        read_only=True,
    )

    submitted_by_username = serializers.CharField(
        source="submitted_by.username",
        read_only=True,
    )

    reviewed_by_username = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
    )

    details = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id",
            "title",
            "proposal_type",
            "status",
            "publisher_name",
            "submitted_by_username",
            "reviewed_by_username",
            "review_notes",
            "created_at",
            "submitted_at",
            "reviewed_at",
            "applied_at",
            "details",
        ]

    def get_details(self, obj):

        if obj.proposal_type == Proposal.ProposalType.BOOK_CREATE:
            if hasattr(obj, "book_create"):
                return BookCreateProposalDetailSerializer( obj.book_create ).data

        if obj.proposal_type == Proposal.ProposalType.BOOK_UPDATE:
            if hasattr(obj, "book_update"):
                return BookUpdateProposalDetailSerializer( obj.book_update ).data

        if obj.proposal_type == Proposal.ProposalType.PRICE_CHANGE:
            if hasattr(obj, "price_change"):
                return PriceChangeProposalDetailSerializer( obj.price_change ).data

        return None

class PublisherProposalDetailSerializer(serializers.ModelSerializer):
    publisher_name = serializers.CharField(
        source="publisher.name",
        read_only=True,
    )

    submitted_by_username = serializers.CharField(
        source="submitted_by.username",
        read_only=True,
    )

    details = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            "id",
            "title",
            "proposal_type",
            "status",
            "publisher_name",
            "submitted_by_username",
            "created_at",
            "submitted_at",
            "reviewed_at",
            "applied_at",
            "details",
        ]

    def get_details(self, obj):

        if obj.proposal_type == Proposal.ProposalType.BOOK_CREATE:
            if hasattr(obj, "book_create"):
                return BookCreateProposalDetailSerializer(
                    obj.book_create
                ).data

        if obj.proposal_type == Proposal.ProposalType.BOOK_UPDATE:
            if hasattr(obj, "book_update"):
                return BookUpdateProposalDetailSerializer(
                    obj.book_update
                ).data

        if obj.proposal_type == Proposal.ProposalType.PRICE_CHANGE:
            if hasattr(obj, "price_change"):
                return PriceChangeProposalDetailSerializer(
                    obj.price_change
                ).data

        return None


class BookCreateProposalSubmissionSerializer(serializers.ModelSerializer):
    publisher_id = serializers.PrimaryKeyRelatedField( source="publisher", queryset=Publisher.objects.filter(is_active=True), write_only=True )

    class Meta:
        model = BookCreateProposal
        fields = [
            "publisher_id",
            "author",
            "title",
            "isbn",
            "description",
            "cover_image_url",
            "genre",
            "is_digital",
            "is_audio",
            "digital_file_path",
            "audio_file_path",
        ]

    def validate_publisher_id(self, publisher):
        user = self.context["request"].user

        is_member = PublisherMembership.objects.filter(
            publisher=publisher,
            user=user,
            is_active=True,
        ).exists()

        if not is_member:
            raise serializers.ValidationError(
                "You are not an active member of this publisher."
            )

        return publisher

    def create(self, validated_data):
        publisher = validated_data.pop("publisher")

        return ProposalService.submit_book_create(
            publisher=publisher,
            user=self.context["request"].user,
            **validated_data,
        )

class BookCreateProposalResponseSerializer(
    serializers.ModelSerializer
):
    proposal_id = serializers.IntegerField(
        source="proposal.id"
    )

    proposal_type = serializers.CharField(
        source="proposal.proposal_type"
    )

    status = serializers.CharField(
        source="proposal.status"
    )

    submitted_at = serializers.DateTimeField(
        source="proposal.submitted_at"
    )

    created_at = serializers.DateTimeField(
        source="proposal.created_at"
    )

    author = serializers.SerializerMethodField()

    proposed_book = serializers.SerializerMethodField()

    message = serializers.SerializerMethodField()

    class Meta:
        model = BookCreateProposal

        fields = (
            "proposal_id",
            "proposal_type",
            "status",
            "submitted_at",
            "created_at",
            "author",
            "proposed_book",
            "message",
        )

    def get_author(self, obj):
        return {
            "id": obj.author.id,
            "name": obj.author.name,
        }

    def get_proposed_book(self, obj):
        return {
            "title": obj.title,
            "isbn": obj.isbn,
            "description": obj.description,
            "cover_image_url": obj.cover_image_url,
            "genre": obj.genre,
            "is_digital": obj.is_digital,
            "is_audio": obj.is_audio,
            "digital_file_path": obj.digital_file_path,
            "audio_file_path": obj.audio_file_path,
        }

    def get_message(self, obj):
        return (
            "Book creation proposal submitted successfully."
        )

class BookUpdateProposalSubmissionSerializer(serializers.ModelSerializer):
    publisher_id = serializers.PrimaryKeyRelatedField(
        source="publisher",
        queryset=Publisher.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = BookUpdateProposal
        fields = [
            "publisher_id",
            "book",
            "title",
            "description",
            "cover_image_url",
            "genre",
            "is_digital",
            "is_audio",
            "digital_file_path",
            "audio_file_path",
        ]

    def validate_publisher_id(self, publisher_id):
        user = self.context["request"].user

        is_member = PublisherMembership.objects.filter(
            publisher=publisher_id,
            user=user,
            is_active=True,
        ).exists()

        if not is_member:
            raise serializers.ValidationError(
                "You are not an active member of this publisher."
            )

        return publisher_id

    def create(self, validated_data):
        publisher = validated_data.pop("publisher")

        return ProposalService.submit_book_update(
            publisher=publisher,
            user=self.context["request"].user,
            **validated_data,
        )

class BookUpdateProposalResponseSerializer(serializers.ModelSerializer):

    proposal_id = serializers.IntegerField(
        source="proposal.id"
    )

    proposal_type = serializers.CharField(
        source="proposal.proposal_type"
    )

    status = serializers.CharField(
        source="proposal.status"
    )

    submitted_at = serializers.DateTimeField(
        source="proposal.submitted_at"
    )

    created_at = serializers.DateTimeField(
        source="proposal.created_at"
    )

    book = serializers.SerializerMethodField()

    proposed_changes = serializers.SerializerMethodField()

    message = serializers.SerializerMethodField()


    class Meta:
        model = BookUpdateProposal

        fields = (
            "proposal_id",
            "proposal_type",
            "status",
            "submitted_at",
            "created_at",
            "book",
            "proposed_changes",
            "message",
        )


    def get_book(self, obj):

        return {
            "id": obj.book.id,
            "current_title": obj.book.title,
            "isbn": obj.book.isbn,
        }


    def get_proposed_changes(self, obj):

        return {
            "title": obj.title,
            "description": obj.description,
            "cover_image_url": obj.cover_image_url,
            "genre": obj.genre,
            "is_digital": obj.is_digital,
            "is_audio": obj.is_audio,
            "digital_file_path": obj.digital_file_path,
            "audio_file_path": obj.audio_file_path,
        }


    def get_message(self, obj):

        return (
            "Book update proposal submitted successfully."
        )


class BookDeleteProposalSubmissionSerializer(serializers.ModelSerializer):
    publisher_id = serializers.PrimaryKeyRelatedField(
        source="publisher",
        queryset=Publisher.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = BookDeleteProposal

        fields = [
            "publisher_id",
            "book",
            "reason",
        ]

    def validate_publisher(self, publisher):
        user = self.context["request"].user

        is_member = PublisherMembership.objects.filter(
            publisher=publisher,
            user=user,
            is_active=True,
        ).exists()

        if not is_member:
            raise serializers.ValidationError(
                "You are not an active member of this publisher."
            )

        return publisher

    def validate(self, attrs):
        book = attrs["book"]

        exists = Proposal.objects.filter(
            proposal_type=Proposal.ProposalType.BOOK_DELETE,
            status=Proposal.Status.SUBMITTED,
            book_delete__book=book,
        ).exists()

        if exists:
            raise serializers.ValidationError(
                "There is already a submitted deletion proposal for this book."
            )

        return attrs

    def create(self, validated_data):
        publisher = validated_data.pop("publisher")

        return ProposalService.submit_book_delete(
            publisher=publisher,
            user=self.context["request"].user,
            **validated_data,
        )

class BookDeleteProposalResponseSerializer(serializers.ModelSerializer):
    proposal_id = serializers.IntegerField(
        source="proposal.id"
    )

    proposal_type = serializers.CharField(
        source="proposal.proposal_type"
    )

    status = serializers.CharField(
        source="proposal.status"
    )

    submitted_at = serializers.DateTimeField(
        source="proposal.submitted_at"
    )

    book = serializers.SerializerMethodField()

    message = serializers.SerializerMethodField()

    class Meta:
        model = BookDeleteProposal

        fields = (
            "proposal_id",
            "proposal_type",
            "status",
            "submitted_at",
            "book",
            "reason",
            "message",
        )

    def get_book(self, obj):
        return {
            "id": obj.book.id,
            "title": obj.book.title,
            "isbn": obj.book.isbn,
        }

    def get_message(self, obj):
        return "Book deletion proposal submitted successfully."

class PriceChangeProposalSubmissionSerializer(serializers.Serializer):

    publisher_id = serializers.PrimaryKeyRelatedField(
        source="publisher",
        queryset=Publisher.objects.filter(
            is_active=True,
        ),
        write_only=True,
    )

    book = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
    )

    value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    currency = serializers.CharField(
        max_length=3,
        default="USD",
    )

    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    reason = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):

        request = self.context["request"]

        membership = PublisherMembership.objects.filter(
            user=request.user,
            publisher=attrs["publisher"],
            is_active=True,
        ).exists()

        if not membership:
            raise serializers.ValidationError(
                "You are not a member of this publisher."
            )

        if attrs["value"] <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero."
            )

        if (
            attrs.get("min_price")
            and attrs["value"] < attrs["min_price"]
        ):
            raise serializers.ValidationError(
                "Price cannot be lower than minimum price."
            )

        return attrs

    def create(self, validated_data):

        publisher = validated_data.pop("publisher")

        return ProposalService.submit_price_change(
            publisher=publisher,
            user=self.context["request"].user,
            **validated_data,
        )

class PriceChangeProposalResponseSerializer(serializers.ModelSerializer):

    proposal_id = serializers.IntegerField(
        source="proposal.id"
    )

    proposal_type = serializers.CharField(
        source="proposal.proposal_type"
    )

    status = serializers.CharField(
        source="proposal.status"
    )

    submitted_at = serializers.DateTimeField(
        source="proposal.submitted_at"
    )

    created_at = serializers.DateTimeField(
        source="proposal.created_at"
    )

    book = serializers.SerializerMethodField()

    requested_price = serializers.SerializerMethodField()

    message = serializers.SerializerMethodField()


    class Meta:
        model = PriceChangeProposal

        fields = (
            "proposal_id",
            "proposal_type",
            "status",
            "submitted_at",
            "created_at",
            "book",
            "requested_price",
            "reason",
            "message",
        )


    def get_book(self, obj):

        return {
            "id": obj.book.id,
            "title": obj.book.title,
            "isbn": obj.book.isbn,
        }


    def get_requested_price(self, obj):

        return {
            "value": obj.value,
            "currency": obj.currency,
            "min_price": obj.min_price,
        }


    def get_message(self, obj):

        return (
            "Price change proposal submitted successfully."
        )