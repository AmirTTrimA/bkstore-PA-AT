from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    job_or_major = models.CharField(
        _("Job or Major"),
        max_length=100,
        blank=True,
        null=True,
    )
    hobbies_or_likings = models.TextField(
        _("Hobbies or Likings"), blank=True, null=True
    )

    def __str__(self):
        return self.email or self.username
