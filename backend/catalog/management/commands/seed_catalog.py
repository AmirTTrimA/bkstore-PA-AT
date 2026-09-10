"""
Catalog Seeder Management Command: python manage.py seed_catalog [--clean]
Orchestrates modular database seeding according to Step 1 and Step 3 specifications.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Author, Book, BookFormat, Genre, Tag
from catalog.seed.seed_taxonomies import seed_taxonomies
from catalog.seed.seed_publishers import seed_publishers
from catalog.seed.seed_authors import seed_authors
from catalog.seed.seed_books import seed_books
from catalog.seed.seed_commerce import seed_commerce
from content.models import License
from pricing.models import Price
from publishing.models import BookCreateProposal, Proposal


class Command(BaseCommand):
    help = "Populates the database with realistic, high-quality bookstore catalog and commerce data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clean",
            action="store_true",
            help="Purge existing books, formats, prices, and proposals before seeding.",
        )

    def handle(self, *args, **options):
        clean = options.get("clean", False)

        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════"))
        self.stdout.write(self.style.MIGRATE_HEADING("  Bookstore Catalog & Commerce Seeder (Step 1 Foundation)  "))
        self.stdout.write(self.style.MIGRATE_HEADING("══════════════════════════════════════════════════════════"))

        if clean:
            self.stdout.write(self.style.WARNING("  Cleaning existing catalog records..."))
            with transaction.atomic():
                BookCreateProposal.objects.all().delete()
                Proposal.objects.filter(proposal_type=Proposal.ProposalType.BOOK_CREATE).delete()
                License.objects.all().delete()
                Price.objects.all().delete()
                BookFormat.objects.all().delete()
                Book.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  ✓ Existing books, formats, and prices cleaned successfully."))

        with transaction.atomic():
            self.stdout.write("\n1. Seeding Taxonomies (Genres & Thematic Tags)...")
            genres_map, tags_map = seed_taxonomies(self.stdout)

            self.stdout.write("\n2. Seeding Publishers & Memberships...")
            publishers_map = seed_publishers(self.stdout)

            self.stdout.write("\n3. Seeding Authors (World & Iranian Literature)...")
            authors_map = seed_authors(self.stdout)

            self.stdout.write("\n4. Seeding Books, Formats, Prices & Publisher Proposals...")
            books_list = seed_books(authors_map, publishers_map, genres_map, tags_map, self.stdout)

            self.stdout.write("\n5. Seeding Commerce (Wallets, Discounts, Orders, Licenses)...")
            seed_commerce(books_list, self.stdout)

        self.stdout.write(self.style.SUCCESS("\n🎉 Database successfully populated with authentic demonstration catalog!"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Books: {Book.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Authors: {Author.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Genres: {Genre.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Thematic Tags: {Tag.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Book Formats: {BookFormat.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"   • Total Active Prices: {Price.objects.count()}\n"))
