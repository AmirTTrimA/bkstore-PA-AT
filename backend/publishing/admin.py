from urllib.parse import quote
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Count
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html, mark_safe
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import gettext_lazy as _

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
        "membership_id",
        "user_display",
        "publisher_display",
        "role_badge",
        "status_badge",
        "joined_at",
    )
    list_display_links = (
        "membership_id",
        "role_badge",
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

    @admin.display(description=_("Membership ID"), ordering="id")
    def membership_id(self, obj):
        val_str = f"#{obj.id:05d}"
        return format_html('<span class="order-id-tag">{}</span>', val_str)

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
# Proposal Inlines
# ============================================================

class BookCreateProposalInline(admin.StackedInline):
    model = BookCreateProposal
    can_delete = False
    extra = 0
    autocomplete_fields = ("author", "created_book")
    readonly_fields = ("cover_preview",)
    classes = ("collapse",)

    @admin.display(description="Cover Preview")
    def cover_preview(self, obj):
        if obj and obj.cover_image_url:
            return format_html(
                '<img src="{}" style="max-height: 140px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" alt="Cover" />',
                obj.cover_image_url,
            )
        return mark_safe('<div style="width:70px;height:100px;display:flex;align-items:center;justify-content:center;background:#2d3748;color:#a0aec0;border-radius:6px;font-size:20px;">📖</div>')


class BookUpdateProposalInline(admin.StackedInline):
    model = BookUpdateProposal
    can_delete = False
    extra = 0
    autocomplete_fields = ("book",)
    readonly_fields = ("cover_preview",)
    classes = ("collapse",)

    @admin.display(description="Cover Preview")
    def cover_preview(self, obj):
        if obj and obj.cover_image_url:
            return format_html(
                '<img src="{}" style="max-height: 140px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" alt="Cover" />',
                obj.cover_image_url,
            )
        return mark_safe('<div style="width:70px;height:100px;display:flex;align-items:center;justify-content:center;background:#2d3748;color:#a0aec0;border-radius:6px;font-size:20px;">📖</div>')


class BookDeleteProposalInline(admin.StackedInline):
    model = BookDeleteProposal
    can_delete = False
    extra = 0
    autocomplete_fields = ("book",)
    classes = ("collapse",)


class AuthorCreateProposalInline(admin.StackedInline):
    model = AuthorCreateProposal
    can_delete = False
    extra = 0
    classes = ("collapse",)


class AuthorUpdateProposalInline(admin.StackedInline):
    model = AuthorUpdateProposal
    can_delete = False
    extra = 0
    autocomplete_fields = ("author",)
    classes = ("collapse",)


class PriceChangeProposalInline(admin.StackedInline):
    model = PriceChangeProposal
    can_delete = False
    extra = 0
    autocomplete_fields = ("book",)
    classes = ("collapse",)


# ============================================================
# Proposal Admin
# ============================================================

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    change_form_template = "admin/publishing/proposal/change_form.html"

    list_display = (
        "title_display",
        "publisher_display",
        "type_badge",
        "status_badge",
        "content_preview",
        "submitted_by",
        "submitted_at",
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
        "proposal_inspection_card",
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
                "book_create__author",
                "book_update__book",
                "book_update__book__author",
                "book_delete__book",
                "book_delete__book__author",
                "author_create",
                "author_update__author",
                "price_change__book",
            )
        )

    def get_inlines(self, request, obj=None):
        if not obj:
            return []
        inlines_map = {
            Proposal.ProposalType.BOOK_CREATE: [BookCreateProposalInline],
            Proposal.ProposalType.BOOK_UPDATE: [BookUpdateProposalInline],
            Proposal.ProposalType.BOOK_DELETE: [BookDeleteProposalInline],
            Proposal.ProposalType.AUTHOR_CREATE: [AuthorCreateProposalInline],
            Proposal.ProposalType.AUTHOR_UPDATE: [AuthorUpdateProposalInline],
            Proposal.ProposalType.PRICE_CHANGE: [PriceChangeProposalInline],
        }
        return inlines_map.get(obj.proposal_type, [])

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:proposal_id>/approve/",
                self.admin_site.admin_view(self.approve_proposal_view),
                name="publishing_proposal_approve",
            ),
            path(
                "<int:proposal_id>/reject/",
                self.admin_site.admin_view(self.reject_proposal_view),
                name="publishing_proposal_reject",
            ),
        ]
        return custom_urls + urls

    def approve_proposal_view(self, request, proposal_id):
        if not self.has_change_permission(request):
            raise PermissionDenied
        proposal = get_object_or_404(Proposal, pk=proposal_id)
        if proposal.status != Proposal.Status.PENDING:
            self.message_user(
                request,
                f"Proposal '{proposal.title}' cannot be approved because it is already {proposal.get_status_display().lower()}.",
                level=messages.WARNING,
            )
        else:
            try:
                ProposalService.approve(proposal, request.user)
                self.message_user(
                    request,
                    f"✓ Proposal '{proposal.title}' approved and applied to the live catalog successfully.",
                    level=messages.SUCCESS,
                )
            except ValidationError as e:
                self.message_user(
                    request,
                    f"Cannot approve proposal: {e}",
                    level=messages.ERROR,
                )
            except Exception as e:
                self.message_user(
                    request,
                    f"Unexpected error approving proposal: {e}",
                    level=messages.ERROR,
                )

        next_url = request.GET.get("next")
        if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
            return HttpResponseRedirect(next_url)
        return HttpResponseRedirect(reverse("admin:publishing_proposal_change", args=[proposal.pk]))

    def reject_proposal_view(self, request, proposal_id):
        if not self.has_change_permission(request):
            raise PermissionDenied
        proposal = get_object_or_404(Proposal, pk=proposal_id)
        if proposal.status != Proposal.Status.PENDING:
            self.message_user(
                request,
                f"Proposal '{proposal.title}' cannot be rejected because it is already {proposal.get_status_display().lower()}.",
                level=messages.WARNING,
            )
            return HttpResponseRedirect(reverse("admin:publishing_proposal_changelist"))

        if request.method == "POST":
            reason = request.POST.get("reason", "").strip()
            if not reason:
                self.message_user(
                    request,
                    "Rejection aborted: A reason is required.",
                    level=messages.ERROR,
                )
            else:
                try:
                    ProposalService.reject(proposal, request.user, reason)
                    self.message_user(
                        request,
                        f"Proposal '{proposal.title}' has been rejected.",
                        level=messages.SUCCESS,
                    )
                    next_url = request.POST.get("next") or request.GET.get("next")
                    if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
                        return HttpResponseRedirect(next_url)
                    return HttpResponseRedirect(reverse("admin:publishing_proposal_changelist"))
                except ValidationError as e:
                    self.message_user(
                        request,
                        f"Cannot reject proposal: {e}",
                        level=messages.ERROR,
                    )

        context = {
            **self.admin_site.each_context(request),
            "title": f"Reject Proposal: {proposal.title}",
            "proposal": proposal,
            "next_url": request.GET.get("next") or reverse("admin:publishing_proposal_changelist"),
            "opts": self.model._meta,
        }
        return TemplateResponse(request, "admin/publishing/proposal/reject_confirmation.html", context)

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

    @admin.display(description="Proposed Content Preview")
    def content_preview(self, obj):
        try:
            if hasattr(obj, "book_create"):
                bc = obj.book_create
                cover_html = (
                    f'<img src="{bc.cover_image_url}" class="proposal-thumb-mini" style="width: 44px; height: 60px; max-width: 44px; max-height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.18);" alt="Cover" />'
                    if bc.cover_image_url
                    else '<div class="proposal-thumb-placeholder" style="width: 44px; height: 60px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📖</div>'
                )
                formats = ["Print"]
                if bc.is_digital:
                    formats.append("E-Book")
                if bc.is_audio:
                    formats.append("Audio")
                formats_str = " | ".join(formats)
                return mark_safe(
                    f'<div class="proposal-preview-flex">'
                    f'{cover_html}'
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title">{bc.title}</span>'
                    f'<span class="proposal-preview-sub">Author: <strong>{bc.author.name}</strong> • {bc.get_genre_display()}</span>'
                    f'<span class="proposal-preview-sub" style="color:#d17842;">{formats_str}</span>'
                    f'</div></div>'
                )
            elif hasattr(obj, "book_update"):
                bu = obj.book_update
                cover_url = bu.cover_image_url or (bu.book.cover_image_url if bu.book else None)
                cover_html = (
                    f'<img src="{cover_url}" class="proposal-thumb-mini" style="width: 44px; height: 60px; max-width: 44px; max-height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.18);" alt="Cover" />'
                    if cover_url
                    else '<div class="proposal-thumb-placeholder" style="width: 44px; height: 60px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📖</div>'
                )
                changes = []
                if bu.title and bu.book and bu.title != bu.book.title:
                    changes.append("Title")
                if bu.genre and bu.book and bu.genre != bu.book.genre:
                    changes.append("Genre")
                if bu.cover_image_url and bu.book and bu.cover_image_url != bu.book.cover_image_url:
                    changes.append("Cover")
                if bu.description and bu.book and bu.description.strip() != bu.book.description.strip():
                    changes.append("Synopsis")
                if bu.is_digital:
                    changes.append("Digital")
                if bu.is_audio:
                    changes.append("Audio")
                changes_str = f"Modified: {', '.join(changes)}" if changes else "Metadata update"
                return mark_safe(
                    f'<div class="proposal-preview-flex">'
                    f'{cover_html}'
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title">{bu.book.title}</span>'
                    f'<span class="proposal-preview-sub"><span class="diff-badge-changed">{changes_str}</span></span>'
                    f'</div></div>'
                )
            elif hasattr(obj, "price_change"):
                pc = obj.price_change
                val = f"{pc.value:,.0f}"
                reason = f'"{pc.reason[:40]}..."' if pc.reason else "No reason stated"
                return mark_safe(
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title">{pc.book.title}</span>'
                    f'<span class="proposal-preview-sub">New Price: <strong style="color:#16a34a;">{val} IRR</strong></span>'
                    f'<span class="proposal-preview-sub" style="font-style:italic;">{reason}</span>'
                    f'</div>'
                )
            elif hasattr(obj, "book_delete"):
                bd = obj.book_delete
                reason = f'"{bd.reason[:50]}..."' if bd.reason else "No reason stated"
                return mark_safe(
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title" style="color:#ef4444;">Book: {bd.book.title}</span>'
                    f'<span class="proposal-preview-sub" style="font-style:italic;">Reason: {reason}</span>'
                    f'</div>'
                )
            elif hasattr(obj, "author_create"):
                ac = obj.author_create
                bio = f'"{ac.biography[:50]}..."' if ac.biography else "No biography provided"
                return mark_safe(
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title">Author: {ac.name}</span>'
                    f'<span class="proposal-preview-sub" style="font-style:italic;">{bio}</span>'
                    f'</div>'
                )
            elif hasattr(obj, "author_update"):
                au = obj.author_update
                return mark_safe(
                    f'<div class="proposal-preview-info">'
                    f'<span class="proposal-preview-title">{au.author.name} &rarr; {au.name}</span>'
                    f'</div>'
                )
        except Exception:
            pass
        return mark_safe('<span class="cell-secondary">-</span>')

    @admin.display(description="Decision")
    def quick_actions(self, obj):
        if obj.status == Proposal.Status.PENDING:
            changelist_url = reverse("admin:publishing_proposal_changelist")
            approve_url = reverse("admin:publishing_proposal_approve", args=[obj.pk]) + "?next=" + quote(changelist_url)
            reject_url = reverse("admin:publishing_proposal_reject", args=[obj.pk]) + "?next=" + quote(changelist_url)
            return format_html(
                '<div class="admin-quick-actions-row">'
                '<a href="{}" class="admin-action-btn btn-quick-approve" title="Approve & Apply to Catalog" onclick="return confirm(\'Approve and apply this proposal immediately?\');">✓ Approve</a>'
                '<a href="{}" class="admin-action-btn btn-quick-reject" title="Reject Proposal">✕ Reject</a>'
                '</div>',
                approve_url,
                reject_url,
            )
        elif obj.status == Proposal.Status.APPLIED:
            return mark_safe('<span class="status-badge status-success" style="font-size:0.75rem;">Applied</span>')
        elif obj.status == Proposal.Status.REJECTED:
            return mark_safe('<span class="status-badge status-danger" style="font-size:0.75rem;">Rejected</span>')
        elif obj.status == Proposal.Status.WITHDRAWN:
            return mark_safe('<span class="status-badge status-neutral" style="font-size:0.75rem;">Withdrawn</span>')
        return mark_safe(f'<span class="status-badge status-info" style="font-size:0.75rem;">{obj.get_status_display()}</span>')

    @admin.display(description="Proposal Review & Content Comparison")
    def proposal_inspection_card(self, obj):
        if not obj or not obj.pk:
            return "-"

        # 1. BOOK UPDATE: Side-by-side comparison table
        if hasattr(obj, "book_update") and obj.book_update:
            bu = obj.book_update
            book = bu.book

            def diff_row(label, old_val, new_val, is_html=False):
                changed = (str(old_val).strip() != str(new_val).strip())
                badge = '<span class="diff-badge-changed">Modified</span>' if changed else '<span class="diff-badge-same">Identical</span>'
                row_cls = "diff-row-changed" if changed else ""
                old_display = old_val if is_html else format_html("{}", old_val)
                new_display = new_val if is_html else format_html("{}", new_val)
                return f'<tr class="{row_cls}"><td><strong>{label}</strong></td><td>{old_display}</td><td>{new_display}</td><td style="text-align:center;">{badge}</td></tr>'

            old_cover = f'<img src="{book.cover_image_url}" style="max-height:90px;border-radius:4px;" />' if book.cover_image_url else "None"
            new_cover = f'<img src="{bu.cover_image_url}" style="max-height:90px;border-radius:4px;" />' if bu.cover_image_url else "None"

            rows = [
                diff_row("Title", book.title, bu.title),
                diff_row("Genre", book.get_genre_display(), bu.get_genre_display()),
                diff_row("Cover Art", old_cover, new_cover, is_html=True),
                diff_row("Synopsis", book.description, bu.description),
                diff_row("E-Book Available", "Yes" if book.is_digital else "No", "Yes" if bu.is_digital else "No"),
                diff_row("Digital File", getattr(book, "digital_file_path", "—") or "—", bu.digital_file_path or "—"),
                diff_row("Audiobook Available", "Yes" if book.is_audio else "No", "Yes" if bu.is_audio else "No"),
                diff_row("Audio File", getattr(book, "audio_file_path", "—") or "—", bu.audio_file_path or "—"),
            ]
            table_rows = "".join(rows)
            return mark_safe(
                f'<div class="proposal-inspection-container">'
                f'<h3 style="margin-top:0;margin-bottom:10px;font-size:1.1rem;color:var(--body-loud-color,#0f172a);">🔍 Side-by-Side Comparison: Current Catalog vs Proposed Changes</h3>'
                f'<table class="diff-comparison-table">'
                f'<thead><tr><th style="width:18%;">Attribute</th><th style="width:38%;">Current Live Catalog</th><th style="width:38%;">Proposed Changes</th><th style="width:6%;text-align:center;">Status</th></tr></thead>'
                f'<tbody>{table_rows}</tbody>'
                f'</table></div>'
            )

        # 2. BOOK CREATE: Full preview card
        elif hasattr(obj, "book_create") and obj.book_create:
            bc = obj.book_create
            cover_html = f'<img src="{bc.cover_image_url}" style="max-height:160px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15);" />' if bc.cover_image_url else '<div class="proposal-thumb-placeholder" style="width:110px;height:150px;font-size:32px;">📖</div>'
            formats = ["Physical Print"]
            if bc.is_digital:
                formats.append(f"E-Book (File: {bc.digital_file_path or 'Standard'})")
            if bc.is_audio:
                formats.append(f"Audiobook (File: {bc.audio_file_path or 'Standard'})")
            formats_html = "<br>".join([f"• {fmt}" for fmt in formats])

            return mark_safe(
                f'<div class="proposal-inspection-container">'
                f'<h3 style="margin-top:0;margin-bottom:14px;font-size:1.1rem;color:var(--body-loud-color,#0f172a);">📚 New Book Submission Overview</h3>'
                f'<div style="display:flex;gap:20px;align-items:flex-start;">'
                f'<div>{cover_html}</div>'
                f'<div style="flex:1;line-height:1.6;font-size:0.92rem;">'
                f'<div style="font-size:1.15rem;font-weight:700;margin-bottom:6px;">{bc.title}</div>'
                f'<div><strong>Author:</strong> {bc.author.name} &nbsp;|&nbsp; <strong>Genre:</strong> {bc.get_genre_display()} &nbsp;|&nbsp; <strong>ISBN:</strong> {bc.isbn}</div>'
                f'<div style="margin-top:10px;padding:10px 14px;background:var(--darkened-bg,#f8fafc);border-radius:6px;border:1px solid var(--pn-border,#e2e8f0);">'
                f'<strong>Synopsis:</strong><br>{bc.description}</div>'
                f'<div style="margin-top:10px;"><strong>Supported Editions & Files:</strong><br>{formats_html}</div>'
                f'</div></div></div>'
            )

        # 3. PRICE CHANGE: Price comparison card
        elif hasattr(obj, "price_change") and obj.price_change:
            pc = obj.price_change
            book = pc.book
            current_price = book.current_price.value if book.current_price else 0
            new_price = pc.value
            pct = 0
            if current_price:
                pct = ((new_price - current_price) / current_price) * 100
                diff_str = f"{pct:+.1f}%"
                badge_cls = "status-success" if pct >= 0 else "status-warning"
            else:
                diff_str = "Initial Price"
                badge_cls = "status-info"

            return mark_safe(
                f'<div class="proposal-inspection-container">'
                f'<h3 style="margin-top:0;margin-bottom:12px;font-size:1.1rem;color:var(--body-loud-color,#0f172a);">🏷️ Price Change Request</h3>'
                f'<div style="display:flex;gap:24px;align-items:center;margin-bottom:14px;padding:14px 18px;background:var(--darkened-bg,#f8fafc);border-radius:8px;border:1px solid var(--pn-border,#e2e8f0);">'
                f'<div><span style="font-size:0.85rem;color:var(--body-quiet-color);">Target Book:</span><br><strong style="font-size:1.05rem;">{book.title}</strong></div>'
                f'<div><span style="font-size:0.85rem;color:var(--body-quiet-color);">Current Price:</span><br><strong style="font-size:1.05rem;">{current_price:,.0f} IRR</strong></div>'
                f'<div style="font-size:1.4rem;color:var(--body-quiet-color);">&rarr;</div>'
                f'<div><span style="font-size:0.85rem;color:var(--body-quiet-color);">Proposed Price:</span><br><strong style="font-size:1.2rem;color:#16a34a;">{new_price:,.0f} IRR</strong> '
                f'<span class="status-badge {badge_cls}" style="font-size:0.75rem;margin-left:6px;">{diff_str}</span></div>'
                f'</div>'
                f'<div><strong>Publisher Stated Reason:</strong><br><span style="font-style:italic;">{pc.reason or "No reason provided."}</span></div>'
                f'</div>'
            )

        # 4. BOOK DELETE: Deletion warning card
        elif hasattr(obj, "book_delete") and obj.book_delete:
            bd = obj.book_delete
            return mark_safe(
                f'<div class="proposal-inspection-container" style="border-left:4px solid #ef4444;">'
                f'<h3 style="margin-top:0;color:#ef4444;font-size:1.1rem;">⚠️ Deletion Proposal: Book Catalog Removal</h3>'
                f'<p style="margin-bottom:8px;">This proposal requests deleting <strong>{bd.book.title}</strong> by <strong>{bd.book.author.name}</strong> from the store catalog.</p>'
                f'<div style="padding:10px 14px;background:var(--darkened-bg,#f8fafc);border-radius:6px;border:1px solid var(--pn-border,#e2e8f0);">'
                f'<strong>Publisher Justification:</strong><br><span style="font-style:italic;">{bd.reason or "No reason provided."}</span></div>'
                f'</div>'
            )

        # 5. AUTHOR CREATE:
        elif hasattr(obj, "author_create") and obj.author_create:
            ac = obj.author_create
            return mark_safe(
                f'<div class="proposal-inspection-container">'
                f'<h3 style="margin-top:0;font-size:1.1rem;">✍️ New Author Proposal: {ac.name}</h3>'
                f'<div style="padding:10px 14px;background:var(--darkened-bg,#f8fafc);border-radius:6px;border:1px solid var(--pn-border,#e2e8f0);">'
                f'<strong>Biography:</strong><br>{ac.biography or "No biography provided."}</div>'
                f'</div>'
            )

        # 6. AUTHOR UPDATE:
        elif hasattr(obj, "author_update") and obj.author_update:
            au = obj.author_update
            return mark_safe(
                f'<div class="proposal-inspection-container">'
                f'<h3 style="margin-top:0;font-size:1.1rem;">✍️ Author Update: {au.author.name}</h3>'
                f'<div><strong>Proposed Name:</strong> {au.name}</div>'
                f'<div style="margin-top:10px;padding:10px 14px;background:var(--darkened-bg,#f8fafc);border-radius:6px;border:1px solid var(--pn-border,#e2e8f0);">'
                f'<strong>Proposed Biography:</strong><br>{au.biography or "No biography provided."}</div>'
                f'</div>'
            )

        return mark_safe('<span class="cell-secondary">No additional proposal details.</span>')

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
                    "Rejected from bulk admin action.",
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
            "Proposal Review & Content Inspection",
            {
                "fields": (
                    "proposal_inspection_card",
                )
            },
        ),
        (
            "Proposal Metadata",
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
            "Editorial Review & Audit Trail",
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
    list_display_links = (
        "cover_preview",
        "title",
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
    list_display_links = (
        "book",
        "title",
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