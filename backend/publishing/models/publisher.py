# publishing/models/publisher.py

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class Publisher(models.Model):
    """
    Represents a publishing organization.

    Publishers submit catalog and pricing proposals to the platform.
    Multiple users may eventually belong to the same publisher.
    """

    name = models.CharField(
        _("Name"),
        max_length=255,
        unique=True,
    )

    slug = models.SlugField(
        _("Slug"),
        unique=True,
        max_length=255,
    )

    description = models.TextField(
        _("Description"),
        blank=True,
    )

    website = models.URLField(
        _("Website"),
        blank=True,
    )

    contact_email = models.EmailField(
        _("Contact Email"),
    )

    is_active = models.BooleanField(
        _("Active"),
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = _("Publisher")
        verbose_name_plural = _("Publishers")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):

        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)


class PublisherMembership(models.Model):
    """
    Associates a platform user with a publisher organization.

    Multiple users may belong to the same publisher.
    A user belongs to at most one publisher.
    """

    class Role(models.TextChoices):
        OWNER = "OWNER", _("Owner")
        MANAGER = "MANAGER", _("Manager")
        EDITOR = "EDITOR", _("Editor")

    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.CASCADE,
        related_name="members",
        verbose_name=_("Publisher"),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="publisher_membership",
        verbose_name=_("User"),
    )   
        # Business rule: a platform user may belong to only one publisher
        # organization at a time. Use ForeignKey if multi-publisher membership
        # is required in the future.

    role = models.CharField(
        _("Role"),
        max_length=20,
        choices=Role.choices,
        default=Role.EDITOR,
    )

    is_active = models.BooleanField(
        _("Active"),
        default=True,
    )

    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = _("Publisher Membership")
        verbose_name_plural = _("Publisher Memberships")
        ordering = [
            "publisher",
            "user__username",
        ]

    def __str__(self):
        return f"{self.user.username} ({self.role}) @ {self.publisher.name}"