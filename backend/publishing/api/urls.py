# publishing/api/urls.py
from django.urls import path

from .views import (BookCreateProposalSubmissionView,
                    BookDeleteProposalSubmissionView,
                    BookUpdateProposalSubmissionView, MyPublishersView,
                    PriceChangeProposalCreateView, ProposalDetailView, ProposalWithdrawalView,
                    PublisherProposalListView, AuthorCreateProposalSubmissionView,
                    AuthorUpdateProposalSubmissionView
                    )

app_name = "publishing-api"

urlpatterns = [
    path(
        "publishers/",
        MyPublishersView.as_view(),
        name="my-publishers" ),
    path(
        "publishers/<int:publisher_id>/proposals/",
        PublisherProposalListView.as_view(),
        name="publisher-proposals" ),
    path(
        "proposals/<int:pk>/",
        ProposalDetailView.as_view(),
        name="proposal-detail",
        ),
    path(
        "proposals/book-create/",
        BookCreateProposalSubmissionView.as_view(),
        name="proposal-book-create" ),
    path(
        "proposals/book-update/",
        BookUpdateProposalSubmissionView.as_view(),
        name="proposal-book-update",
    ),
    path(
        "proposals/price-change/",
        PriceChangeProposalCreateView.as_view(),
        name="proposal-price-change",
    ),
    path(
        "proposals/book-delete/",
        BookDeleteProposalSubmissionView.as_view(),
        name="proposal-book-delete",
    ),
    path(
        "proposals/author-create/",
        AuthorCreateProposalSubmissionView.as_view(),
        name="proposal-author-create",
    ),

    path(
        "proposals/author-update/",
        AuthorUpdateProposalSubmissionView.as_view(),
        name="proposal-author-update",
    ),
    path(
        "proposals/<int:proposal_id>/withdraw/",
        ProposalWithdrawalView.as_view(),
        name="proposal-withdraw",
    ),
]