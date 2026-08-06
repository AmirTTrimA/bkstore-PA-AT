from django.contrib import admin
from django.db.models import Count

from .models import (AuthorCreateProposal, AuthorUpdateProposal,
                     BookCreateProposal, BookDeleteProposal,
                     BookUpdateProposal, PriceChangeProposal, Proposal,
                     Publisher, PublisherMembership)

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


# ============================================================
# Proposal
# ============================================================

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "publisher",
        "proposal_type",
        "status",
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
    )

    ordering = (
        "-submitted_at",
    )

    list_select_related = (
        "publisher",
        "submitted_by",
        "reviewed_by",
    )

    readonly_fields = (
        "submitted_at",
        "reviewed_at",
        "applied_at",
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
        "proposal",
    )

    search_fields = (
        "title",
        "author__name",
    )

    autocomplete_fields = (
        "author",
        "proposal",
    )


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
        "currency",
        "proposal",
    )

    search_fields = (
        "book__title",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )