from catalog.models import Author, Book
from django.db import models
from django.utils.translation import gettext_lazy as _

from .proposal import Proposal


class AbstractBookProposal(models.Model):
    """
    Shared fields between book creation and update proposals.
    Mirrors the editable fields of the Book model.
    """

    title = models.CharField(
        _("Title"),
        max_length=255,
    )

    description = models.TextField(
        _("Description"),
    )

    cover_image_url = models.URLField(
        _("Cover Image URL"),
        blank=True,
    )

    genre = models.CharField(
        _("Genre"),
        max_length=50,
        choices=Book.GENRE_CHOICES,
    )

    is_digital = models.BooleanField(
        _("Available as E-book"),
        default=False,
    )

    is_audio = models.BooleanField(
        _("Available as Audiobook"),
        default=False,
    )

    digital_file_path = models.CharField(
        _("Digital File Path"),
        max_length=500,
        blank=True,
    )

    audio_file_path = models.CharField(
        _("Audio File Path"),
        max_length=500,
        blank=True,
    )

    class Meta:
        abstract = True


class BookCreateProposal(AbstractBookProposal):
    """
    Proposal to create a new book.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="book_create",
    )

    author = models.ForeignKey(
        Author,
        on_delete=models.PROTECT,
        related_name="book_creation_proposals",
    )

    isbn = models.CharField(
        _("ISBN"),
        max_length=17,
    )

    class Meta:
        verbose_name = _("Book Creation Proposal")
        verbose_name_plural = _("Book Creation Proposals")

    def __str__(self):
        return self.title


class BookUpdateProposal(AbstractBookProposal):
    """
    Proposal to update an existing book.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="book_update",
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name="update_proposals",
    )

    class Meta:
        verbose_name = _("Book Update Proposal")
        verbose_name_plural = _("Book Update Proposals")

    def __str__(self):
        return f"Update: {self.book.title}"


class BookDeleteProposal(models.Model):
    """
    Proposal to remove a book from the catalog.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="book_delete",
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name="deletion_proposals",
    )

    reason = models.TextField(
        _("Reason"),
    )

    class Meta:
        verbose_name = _("Book Deletion Proposal")
        verbose_name_plural = _("Book Deletion Proposals")

    def __str__(self):
        return f"Delete: {self.book.title}"


class AuthorCreateProposal(models.Model):
    """
    Proposal to create a new author.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="author_create",
    )

    name = models.CharField(
        _("Name"),
        max_length=255,
    )

    biography = models.TextField(
        _("Biography"),
        blank=True,
    )

    class Meta:
        verbose_name = _("Author Creation Proposal")
        verbose_name_plural = _("Author Creation Proposals")

    def __str__(self):
        return self.name


class AuthorUpdateProposal(models.Model):
    """
    Proposal to update an existing author.
    """

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="author_update",
    )

    author = models.ForeignKey(
        Author,
        on_delete=models.PROTECT,
        related_name="update_proposals",
    )

    name = models.CharField(
        _("Name"),
        max_length=255,
    )

    biography = models.TextField(
        _("Biography"),
        blank=True,
    )

    class Meta:
        verbose_name = _("Author Update Proposal")
        verbose_name_plural = _("Author Update Proposals")

    def __str__(self):
        return f"Update: {self.author.name}"