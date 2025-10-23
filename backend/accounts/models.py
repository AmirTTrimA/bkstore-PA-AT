from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Core fields are inherited (username, email, password, etc.)

    # Custom fields for the Recommendation System (Phase 3)
    job_or_major = models.CharField(max_length=100, blank=True, null=True)
    hobbies_or_likings = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.email or self.username
