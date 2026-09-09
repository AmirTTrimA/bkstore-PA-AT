from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html, mark_safe

from .models import (AuthorCreateProposal, AuthorUpdateProposal,
                     BookCreateProposal, BookDeleteProposal,
                     BookUpdateProposal, PriceChangeProposal, Proposal,
                     Publisher, PublisherMembership)
from .services.proposal_service import ProposalService

# ============================================================
# Publisher Inlines & Admin
# ============================================================

class PublisherMembershipInline(admin.TabularInline):
    model = PublisherMembership
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "role", "is_active", "joined_at")
    readonly_fields = ("joined_at",)


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "website_link",
        "member_count",
        "proposal_count",
        "status_badge",
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
    inlines = [PublisherMembershipInline]

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
        return mark_safe(f'<span class="item-count-badge">{obj.member_total} members</span>')

    @admin.display(
        ordering="proposal_total",
        description="Proposals",
    )
    def proposal_count(self, obj):
        return mark_safe(f'<span class="item-count-badge">{obj.proposal_total} proposals</span>')

    @admin.display(
        description="Status",
        ordering="is_active",
    )
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Active</span>')
        return mark_safe('<span class="status-badge status-neutral">Inactive</span>')

    @admin.display(
        description="Website",
    )
    def website_link(self, obj):
        if obj.website:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener noreferrer" style="color:var(--pn-primary); font-weight:600;">{} &#x2197;</a>',
                obj.website,
                obj.website[:32] + ("..." if len(obj.website) > 32 else ""),
            )
        return "-"


# ============================================================
# Publisher Membership
# ============================================================

@admin.register(PublisherMembership)
class PublisherMembershipAdmin(admin.ModelAdmin):

    list_display = (
        "user_display",
        "publisher_display",
        "role_badge",
        "status_badge",
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

    @admin.display(description="User", ordering="user__username")
    def user_display(self, obj):
        url = reverse("admin:accounts_user_change", args=[obj.user.pk])
        return format_html(
            '<a href="{}" class="admin-user-link">{} <span class="cell-muted">({})</span></a>',
            url,
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(description="Publisher", ordering="publisher__name")
    def publisher_display(self, obj):
        url = reverse("admin:publishing_publisher_change", args=[obj.publisher.pk])
        return format_html(
            '<a href="{}" class="admin-accent-link">{}</a>',
            url,
            obj.publisher.name,
        )

    @admin.display(description="Role", ordering="role")
    def role_badge(self, obj):
        badge_cls = {
            PublisherMembership.Role.OWNER: "status-purple",
            PublisherMembership.Role.MANAGER: "status-info",
            PublisherMembership.Role.EDITOR: "status-accent",
        }.get(obj.role, "status-neutral")
        return mark_safe(f'<span class="status-badge {badge_cls}">{obj.get_role_display()}</span>')

    @admin.display(description="Status", ordering="is_active")
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe('<span class="status-badge status-success">Active</span>')
        return mark_safe('<span class="status-badge status-danger">Inactive</span>')

# ============================================================
# Proposal
# ============================================================

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):

    list_display = (
        "title_display",
        "publisher_display",
        "type_badge",
        "status_badge",
        "target_preview",
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
    list_per_page = 25

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("publisher", "submitted_by", "reviewed_by")
            .prefetch_related(
                "book_create",
                "book_update__book",
                "book_delete__book",
                "author_create",
                "author_update__author",
                "price_change__book",
            )
        )

    @admin.display(description="Title", ordering="title")
    def title_display(self, obj):
        return format_html('<span class="admin-title-cell">{}</span>', obj.title)

    @admin.display(description="Publisher", ordering="publisher__name")
    def publisher_display(self, obj):
        return format_html(
            '<span class="cell-secondary" style="font-weight:600;">{}</span>',
            obj.publisher.name,
        )

    @admin.display(description="Type", ordering="proposal_type")
    def type_badge(self, obj):
        badges = {
            Proposal.ProposalType.BOOK_CREATE: ("status-purple", "Book Create"),
            Proposal.ProposalType.BOOK_UPDATE: ("status-info", "Book Update"),
            Proposal.ProposalType.BOOK_DELETE: ("status-danger", "Book Delete"),
            Proposal.ProposalType.AUTHOR_CREATE: ("status-info", "Author Create"),
            Proposal.ProposalType.AUTHOR_UPDATE: ("status-accent", "Author Update"),
            Proposal.ProposalType.PRICE_CHANGE: ("status-warning", "Price Change"),
        }
        cls, label = badges.get(obj.proposal_type, ("status-neutral", obj.get_proposal_type_display()))
        return mark_safe(f'<span class="status-badge {cls}">{label}</span>')

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        badges = {
            Proposal.Status.PENDING: ("status-warning", "Pending"),
            Proposal.Status.APPROVED: ("status-info", "Approved"),
            Proposal.Status.APPLIED: ("status-success", "Applied"),
            Proposal.Status.REJECTED: ("status-danger", "Rejected"),
            Proposal.Status.WITHDRAWN: ("status-neutral", "Withdrawn"),
        }
        cls, label = badges.get(obj.status, ("status-neutral", obj.get_status_display()))
        return mark_safe(f'<span class="status-badge {cls}">{label}</span>')

    @admin.display(description="Proposal Target")
    def target_preview(self, obj):
        try:
            if hasattr(obj, "book_create"):
                return format_html(
                    '<span class="cell-secondary">Book: <strong>{}</strong></span>',
                    obj.book_create.title,
                )
            elif hasattr(obj, "book_update"):
                return format_html(
                    '<span class="cell-secondary">Book: <strong>{}</strong></span>',
                    obj.book_update.book.title,
                )
            elif hasattr(obj, "book_delete"):
                return format_html(
                    '<span style="font-size:0.85rem; color:#f87171;">Book: <strong>{}</strong></span>',
                    obj.book_delete.book.title,
                )
            elif hasattr(obj, "author_create"):
                return format_html(
                    '<span class="cell-secondary">Author: <strong>{}</strong></span>',
                    obj.author_create.name,
                )
            elif hasattr(obj, "author_update"):
                return format_html(
                    '<span class="cell-secondary">Author: <strong>{}</strong></span>',
                    obj.author_update.author.name,
                )
            elif hasattr(obj, "price_change"):
                val = f"{obj.price_change.value:,.0f}"
                return mark_safe(
                    f'<span class="cell-secondary">{obj.price_change.book.title} &rarr; '
                    f'<span class="currency-tag">{val} <span class="irr-unit">IRR</span></span></span>'
                )
        except Exception:
            pass
        return "-"

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
        "cover_preview",
        "title",
        "author",
        "genre",
        "created_book",
        "proposal_status_badge",
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

    list_select_related = (
        "author",
        "proposal",
        "created_book",
    )

    @admin.display(description="Cover")
    def cover_preview(self, obj):
        if obj.cover_image_url:
            return format_html(
                '<img src="{}" class="book-cover-thumb" alt="Cover" />',
                obj.cover_image_url,
            )
        return mark_safe('<div class="book-cover-placeholder">&#x1F4D6;</div>')

    @admin.display(description="Proposal Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')

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
        "title",
        "genre",
        "proposal_status_badge",
    )

    search_fields = (
        "book__title",
        "title",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )

    list_select_related = (
        "book",
        "proposal",
    )

    @admin.display(description="Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')


@admin.register(BookDeleteProposal)
class BookDeleteProposalAdmin(admin.ModelAdmin):

    list_display = (
        "book",
        "reason_summary",
        "proposal_status_badge",
    )

    search_fields = (
        "book__title",
        "reason",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )

    list_select_related = (
        "book",
        "proposal",
    )

    @admin.display(description="Reason")
    def reason_summary(self, obj):
        return obj.reason[:60] + ("..." if len(obj.reason) > 60 else "")

    @admin.display(description="Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')


@admin.register(AuthorCreateProposal)
class AuthorCreateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "proposal_status_badge",
    )

    search_fields = (
        "name",
    )

    autocomplete_fields = (
        "proposal",
    )

    list_select_related = (
        "proposal",
    )

    @admin.display(description="Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')


@admin.register(AuthorUpdateProposal)
class AuthorUpdateProposalAdmin(admin.ModelAdmin):

    list_display = (
        "author",
        "name",
        "proposal_status_badge",
    )

    search_fields = (
        "author__name",
        "name",
    )

    autocomplete_fields = (
        "author",
        "proposal",
    )

    list_select_related = (
        "author",
        "proposal",
    )

    @admin.display(description="Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')


@admin.register(PriceChangeProposal)
class PriceChangeProposalAdmin(admin.ModelAdmin):

    list_display = (
        "book",
        "formatted_value",
        "formatted_min_price",
        "proposal_status_badge",
    )

    search_fields = (
        "book__title",
        "reason",
    )

    autocomplete_fields = (
        "book",
        "proposal",
    )

    list_select_related = (
        "book",
        "proposal",
    )

    @admin.display(description="New Price", ordering="value")
    def formatted_value(self, obj):
        return mark_safe(f'<span class="currency-tag">{obj.value:,.0f} <span class="irr-unit">IRR</span></span>')

    @admin.display(description="Min Price", ordering="min_price")
    def formatted_min_price(self, obj):
        if obj.min_price is not None:
            return mark_safe(f'<span class="currency-tag">{obj.min_price:,.0f} <span class="irr-unit">IRR</span></span>')
        return "-"

    @admin.display(description="Status")
    def proposal_status_badge(self, obj):
        st = obj.proposal.status
        badges = {
            Proposal.Status.PENDING: "status-warning",
            Proposal.Status.APPROVED: "status-info",
            Proposal.Status.APPLIED: "status-success",
            Proposal.Status.REJECTED: "status-danger",
            Proposal.Status.WITHDRAWN: "status-neutral",
        }
        cls = badges.get(st, "status-neutral")
        return mark_safe(f'<span class="status-badge {cls}">{obj.proposal.get_status_display()}</span>')