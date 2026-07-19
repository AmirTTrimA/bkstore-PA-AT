from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Author(models.Model):
    """Stores information about book authors."""

    name = models.CharField(_("Full Name"), max_length=255)
    biography = models.TextField(_("Biography"), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Author")
        verbose_name_plural = _("Authors")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}"


class Book(models.Model):
    """Stores information about books, linking to author and digital assets."""

    # --- Genre Choices for Filtering/Recommendations (Phase 3) ---
    GENRE_CHOICES = [
        ("FICTION", _("Fiction")),
        ("SCI_FI", _("Science Fiction")),
        ("HISTORY", _("History")),
        ("SCIENCE", _("Science")),
        ("TECH", _("Technology")),
        ("BUSINESS", _("Business")),
        # ...
    ]

    # --- Core Identification ---
    author = models.ForeignKey(
        Author, on_delete=models.CASCADE, verbose_name=_("Author")
    )
    title = models.CharField(_("Title"), max_length=255)
    slug = models.SlugField(
        _("Slug"),
        max_length=255,
        unique=True,
        help_text=_("URL-friendly title format."),
    )
    isbn = models.CharField(_("ISBN"), max_length=17, unique=True)

    # --- Content & Description ---
    description = models.TextField(_("Description"))
    cover_image_url = models.URLField(
        _("Cover Image URL"), max_length=500, blank=True, null=True
    )
    genre = models.CharField(_("Genre"), max_length=50, choices=GENRE_CHOICES)

    # --- Digital Asset Flags (For Sales & Licensing) ---
    is_digital = models.BooleanField(_("Available as E-book"), default=False)
    is_audio = models.BooleanField(_("Available as Audiobook"), default=False)

    # --- File Paths (Used for secure serving in Phase 3) ---
    digital_file_path = models.CharField(
        _("Digital File Path"),
        max_length=500,
        blank=True,
        help_text=_("Path to EPUB/PDF file for licensed readers."),
    )
    audio_file_path = models.CharField(
        _("Audio File Path"),
        max_length=500,
        blank=True,
        help_text=_("Path to MP3/M4A file for licensed audio player."),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_current_price(self):
        """
        Returns the currently active Price object for this book.
        Returns None if no active price exists.
        """
        now = timezone.now()

        return (
            self.prices.filter(
                effective_from__lte=now,
            )
            .filter(
                models.Q(effective_until__isnull=True)
                | models.Q(effective_until__gt=now)
            )
            .order_by("-effective_from")
            .first()
        )
    
    @property
    def current_price(self):
        """
        Returns the most recent active price for this book.

        A price is active when:
        - effective_from <= now
        - effective_until is null or in the future

        If multiple prices are active, the most recently effective one is returned.
        """
        return self.get_current_price()

    class Meta:
        verbose_name = _("Book")
        verbose_name_plural = _("Books")
        # Ensure a book's title is unique per author to prevent accidental duplication
        unique_together = ["author", "title"]
        ordering = ["title"]

    def __str__(self):
        return f"{self.title}"
