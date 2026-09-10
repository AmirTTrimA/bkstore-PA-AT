# catalog/models.py
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Author(models.Model):
    """Stores information about book authors."""

    name = models.CharField(_("Full Name"), max_length=255)
    normalized_name = models.CharField(
        _("Normalized Name"), max_length=255, blank=True, db_index=True
    )
    primary_language = models.CharField(
        _("Primary Language"), max_length=10, default="en"
    )
    biography = models.TextField(_("Biography"), blank=True)
    avatar_url = models.URLField(
        _("Avatar URL"), max_length=500, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Author")
        verbose_name_plural = _("Authors")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}"

    def save(self, *args, **kwargs):
        if not self.normalized_name and self.name:
            self.normalized_name = self.name.strip().lower()
        super().save(*args, **kwargs)


class Genre(models.Model):
    """
    Controlled semantic category for books.
    Represents high-level categorical meaning, not marketing labels.
    """

    name = models.CharField(_("Genre Name"), max_length=100, unique=True)
    slug = models.SlugField(_("Slug"), max_length=120, unique=True)
    normalized_name = models.CharField(
        _("Normalized Name"), max_length=100, unique=True, db_index=True
    )
    description = models.TextField(_("Description"), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Genre")
        verbose_name_plural = _("Genres")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.normalized_name and self.name:
            self.normalized_name = self.name.strip().lower()
        super().save(*args, **kwargs)


class Tag(models.Model):
    """
    Fine-grained semantic signal representing concepts, themes, motifs, or topics.
    """

    name = models.CharField(_("Tag Name"), max_length=100, unique=True)
    normalized_name = models.CharField(
        _("Normalized Name"), max_length=100, unique=True, db_index=True
    )
    description = models.TextField(_("Description"), blank=True)
    language = models.CharField(_("Language"), max_length=10, default="en")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.normalized_name and self.name:
            self.normalized_name = self.name.strip().lower()
        super().save(*args, **kwargs)


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
        ("PHILOSOPHY", _("Philosophy")),
        ("PSYCHOLOGY", _("Psychology")),
        ("PERSIAN_LIT", _("Persian Literature")),
    ]

    # --- Core Identification ---
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name="books",
        verbose_name=_("Author"),
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

    # --- Semantic & Taxonomy Additions (Phase 3 Foundation) ---
    language = models.CharField(
        _("Language"),
        max_length=10,
        default="en",
        choices=[("en", _("English")), ("fa", _("Persian"))],
    )
    genres = models.ManyToManyField(
        Genre,
        related_name="books",
        blank=True,
        verbose_name=_("Genres"),
    )
    tags = models.ManyToManyField(
        Tag,
        related_name="books",
        blank=True,
        verbose_name=_("Tags"),
    )
    publication_year = models.PositiveIntegerField(
        _("Publication Year"), null=True, blank=True
    )
    edition = models.CharField(_("Edition"), max_length=50, blank=True)

    TARGET_AGE_CHOICES = [
        ("all_ages", _("All Ages")),
        ("children", _("Children (0-12)")),
        ("young_adult", _("Young Adult (13-17)")),
        ("adult", _("Adult (18+)")),
    ]
    CONTENT_TONE_CHOICES = [
        ("philosophical", _("Philosophical & Reflective")),
        ("dystopian", _("Dark & Dystopian")),
        ("academic", _("Analytical & Academic")),
        ("inspiring", _("Uplifting & Inspiring")),
        ("humorous", _("Lighthearted & Humorous")),
        ("mystical", _("Mystical & Spiritual")),
    ]

    target_age_group = models.CharField(
        _("Target Age Group"),
        max_length=30,
        choices=TARGET_AGE_CHOICES,
        default="all_ages",
        blank=True,
    )
    content_tone = models.CharField(
        _("Content Tone"),
        max_length=50,
        choices=CONTENT_TONE_CHOICES,
        default="philosophical",
        blank=True,
    )

    @property
    def is_semantically_eligible(self):
        """
        A book is semantically eligible for recommendations when:
        - description is non-empty
        - language is English ('en')
        - at least one genre exists
        """
        return bool(
            self.description
            and self.language == "en"
            and self.genres.exists()
        )

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
    
    def change_price(self, value, min_price=None):
        """Creates a new active price while preserving price history."""

        now = timezone.now()

        with transaction.atomic():

            current_price = self.current_price

            if current_price:
                current_price.effective_until = now
                current_price.save(update_fields=["effective_until"])

            return self.prices.create(
                value=value,
                min_price=min_price,
                effective_from=now,
            )

    class Meta:
        verbose_name = _("Book")
        verbose_name_plural = _("Books")
        # Ensure a book's title is unique per author to prevent accidental duplication
        unique_together = ["author", "title"]
        ordering = ["title"]

    def __str__(self):
        return f"{self.title}"

class BookFormat(models.Model):
    class FormatType(models.TextChoices):
        PHYSICAL = "PHYSICAL", _("Physical")
        DIGITAL = "DIGITAL", _("Digital")
        AUDIO = "AUDIO", _("Audio")

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="formats",
        verbose_name=_("Book"),
    )

    format_type = models.CharField(
        _("Format Type"),
        max_length=20,
        choices=FormatType.choices,
    )

    is_available = models.BooleanField(_("Available"), default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Book Format")
        verbose_name_plural = _("Book Formats")
        unique_together = ("book", "format_type")
        ordering = ["book", "format_type"]

    def __str__(self):
        return f"{self.book.title} ({self.get_format_type_display()})"
