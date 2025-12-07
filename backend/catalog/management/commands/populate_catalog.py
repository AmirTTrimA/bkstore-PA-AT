import random

from catalog.models import Author, Book
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

# Get the custom User model
User = get_user_model()


class Command(BaseCommand):
    """
    Custom management command to populate the database with mock Author and Book data.
    This helps in testing Search (Haystack/Solr) and Listing endpoints.
    """

    help = "Populates the catalog with 20 authors and 50 books for testing."

    # Mock Data Lists
    AUTHOR_NAMES = [
        "J.R.R. Tolkien",
        "George Orwell",
        "Jane Austen",
        "Isaac Asimov",
        "Gabriel Garcia Marquez",
        "Toni Morrison",
        "Chinua Achebe",
        "Margaret Atwood",
        "Douglas Adams",
        "Neil Gaiman",
        "Philip K. Dick",
        "Agatha Christie",
        "Stephen King",
        "J.K. Rowling",
        "Fyodor Dostoevsky",
        "Herman Melville",
        "Virginia Woolf",
        "Aldous Huxley",
        "Ayn Rand",
        "Ursula K. Le Guin",
    ]

    BOOK_TITLES = [
        ("Science Fiction", "A Space Odyssey", True, False),
        ("Science Fiction", "Foundation", True, True),
        ("Fiction", "1984", True, False),
        ("Fiction", "To the Lighthouse", False, True),
        ("Mystery", "Murder on the Orient Express", False, False),
        ("Fantasy", "The Hobbit", True, True),
        ("History", "Sapiens", False, False),
        ("Technology", "Code Complete", True, False),
        ("Science", "Cosmos", False, True),
        ("Business", "The 7 Habits", False, False),
    ]

    @transaction.atomic
    def handle(self, *args, **options):
        # Clear existing data for a fresh start
        self.stdout.write(
            self.style.WARNING("Deleting all existing Authors and Books...")
        )
        Book.objects.all().delete()
        Author.objects.all().delete()

        # --- 1. Create Authors ---
        self.stdout.write(
            self.style.SUCCESS(f"Creating {len(self.AUTHOR_NAMES)} Authors...")
        )
        authors = []
        for name in self.AUTHOR_NAMES:
            author = Author.objects.create(
                name=name,
                biography=f"A highly influential writer, {name} revolutionized the fields of {random.choice(['science', 'philosophy', 'fantasy'])} and {random.choice(['social commentary', 'mystery', 'technology'])}.",
            )
            authors.append(author)

        # --- 2. Create Books and Mock Prices ---
        self.stdout.write(self.style.SUCCESS("Creating 50 Mock Books..."))

        for i in range(50):
            # Pick a random author
            author = random.choice(authors)

            # Select a random base title/genre combination
            base_genre, base_title, is_digital, is_audio = random.choice(
                self.BOOK_TITLES
            )

            # Create a unique title
            title = f"{base_title} #{i+1} ({random.choice(['The Last', 'The First', 'The New'])} Era)"

            # Slugify for URL safety
            book_slug = slugify(title)

            # 🔑 FIX: Adjusted the final section to fit max_length=17
            # Original: 978-XXX-XX-XXXXXX-Y (19 chars)
            # Fixed: 978-X-XX-XXXXXX-X (17 chars total, including hyphens)
            isbn = f"978-{random.randint(0, 9)}-{random.randint(10, 99)}-{random.randint(100000, 999999)}"

            book = Book.objects.create(
                author=author,
                title=title,
                slug=book_slug,
                # 🔑 FIX: Pass the corrected ISBN string
                isbn=isbn,
                description=f"This is a crucial book in the {base_genre} genre that explores deep themes of {random.choice(['survival', 'love', 'war', 'AI'])}.",
                genre=base_genre.upper().replace(" ", "_"),
                is_digital=is_digital,
                is_audio=is_audio,
                cover_image_url=f"http://placehold.co/400x600/123456/white?text={base_title.replace(' ', '+')}",
            )
            # 🔑 Note: Mock price data is not created yet, as that model belongs to the 'pricing' app
            # and is part of the Phase 2 implementation. The serializer will still return "19.99".

        self.stdout.write(self.style.SUCCESS("Database population complete."))
        self.stdout.write(
            self.style.WARNING("Please run 'python manage.py rebuild_index' now.")
        )
