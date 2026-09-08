from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.db.models import Count

from .models import (AuthorCreateProposal, AuthorUpdateProposal,
                     BookCreateProposal, BookDeleteProposal,
                     BookUpdateProposal, PriceChangeProposal, Proposal,
                     Publisher, PublisherMembership)
from .services.proposal_service import ProposalService

# ============================================================
# Publisher
# ============================================================

@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "member_count",
        "proposal_count",
        "is_active",
        "created_at",
    )

    search_fields = (
        "name",
        "contact_email",
    )

    list_filter = (
        "is_active",
    )

    ordering = (
        "name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    list_per_page = 25

    def get_queryset(self, request):

        return (
            super()
            .get_queryset(request)
            .annotate(
                member_total=Count(
                    "members",
                    distinct=True,
                ),
                proposal_total=Count(
                    "proposals",
                    distinct=True,
                ),
            )
        )

    @admin.display(
        ordering="member_total",
        description="Members",
    )
    def member_count(self, obj):
        return obj.member_total

    @admin.display(
        ordering="proposal_total",
        description="Proposals",
    )
    def proposal_count(self, obj):
        return obj.proposal_total


# ============================================================
# Publisher Membership
# ============================================================

@admin.register(PublisherMembership)
class PublisherMembershipAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "publisher",
        "role",
        "is_active",
        "joined_at",
    )

    list_filter = (
        "role",
        "is_active",
        "publisher",
    )

    search_fields = (
        "user__username",
        "user__email",
        "publisher__name",
    )

    autocomplete_fields = (
        "user",
        "publisher",
    )

    ordering = (
        "publisher",
        "user",
    )

    readonly_fields = (
        "joined_at",
    )

    list_select_related = (
        "publisher",
        "user",
    )

# ============================================================
# Proposal
# ============================================================

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "publisher",
        "proposal_type",
        "proposal_status",
        "submitted_by",
        "submitted_at",
        "reviewed_by",
    )

    list_filter = (
        "status",
        "proposal_type",
        "publisher",
    )

    search_fields = (
        "title",
        "publisher__name",
        "submitted_by__username",
        "submitted_by__email",
        "review_notes",
    )

    ordering = (
        "-submitted_at",
        "-created_at",
    )

    list_select_related = (
        "publisher",
        "submitted_by",
        "reviewed_by",
    )

    readonly_fields = (
        "status",
        "submitted_by",
        "submitted_at",
        "reviewed_by",
        "reviewed_at",
        "applied_at",
    )

    actions = (
        "approve_selected",
        "reject_selected",
    )

    date_hierarchy = "submitted_at"

    @admin.action(
        description="Approve selected proposals"
    )
    def approve_selected(self, request, queryset):

        queryset = queryset.filter(
            status=Proposal.Status.PENDING
        )

        success = 0

        for proposal in queryset:

            try:
                ProposalService.approve(
                    proposal,
                    request.user,
                )

                success += 1

            except ValidationError as e:

                self.message_user(
                    request,
                    f"{proposal}: {e}",
                    level=messages.ERROR,
                )

        if success:
            self.message_user(
                request,
                f"{success} proposal(s) approved.",
                level=messages.SUCCESS,
            )

    @admin.action(
        description="Reject selected proposals"
    )
    def reject_selected(self, request, queryset):

        queryset = queryset.filter(
            status=Proposal.Status.PENDING
        )

        success = 0

        for proposal in queryset:

            try:
                ProposalService.reject(
                    proposal,
                    request.user,
                    "Rejected from admin action.",
                )

                success += 1

            except ValidationError as e:

                self.message_user(
                    request,
                    f"{proposal}: {e}",
                    level=messages.ERROR,
                )

        if success:
            self.message_user(
                request,
                f"{success} proposal(s) rejected.",
                level=messages.SUCCESS,
            )

    @admin.display(
        description="Status"
    )
    def proposal_status(self, obj):

        return obj.get_status_display()

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):
        if obj and obj.status == Proposal.Status.APPLIED:
            return False

        return super().has_delete_permission(
            request,
            obj,
        )

    fieldsets = (
        (
            "Proposal Information",
            {
                "fields": (
                    "title",
                    "publisher",
                    "submitted_by",
                    "proposal_type",
                    "status",
                )
            },
        ),
        (
            "Review",
            {
                "fields": (
                    "reviewed_by",
                    "review_notes",
                    "reviewed_at",
                    "applied_at",
                )
            },
        ),
    )


# ============================================================
# Proposal Detail Models
# ============================================================

@admin.register(BookCreateProposal)
class BookCreateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "author",
        "genre",
        "created_book",
        "proposal",
    )

    search_fields = (
        "title",
        "author__name",
        "created_book__title",
    )

    autocomplete_fields = (
        "author",
        "proposal",
        "created_book",
    )

    def get_readonly_fields(self, request, obj=None):

        if obj and obj.proposal.status == Proposal.Status.APPLIED:
            return [
                field.name
                for field in self.model._meta.fields
            ]

        return super().get_readonly_fields(request, obj)


@admin.register(BookUpdateProposal)
class BookUpdateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "book",
        "proposal",
    )

    search_fields = (
        "book__title",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )


@admin.register(BookDeleteProposal)
class BookDeleteProposalAdmin(admin.ModelAdmin):

    list_display = (
        "book",
        "proposal",
    )

    search_fields = (
        "book__title",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )


@admin.register(AuthorCreateProposal)
class AuthorCreateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "proposal",
    )

    search_fields = (
        "name",
    )


@admin.register(AuthorUpdateProposal)
class AuthorUpdateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "author",
        "proposal",
    )

    search_fields = (
        "author__name",
    )

    autocomplete_fields = (
        "author",
        "proposal",
    )


@admin.register(PriceChangeProposal)
class PriceChangeProposalAdmin(admin.ModelAdmin):

    list_display = (
        "book",
        "value",
        "proposal",
    )

    search_fields = (
        "book__title",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )