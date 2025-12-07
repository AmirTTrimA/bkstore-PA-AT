import random
from datetime import timedelta
from decimal import Decimal

from catalog.models import Author, Book
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

# 🔑 NEW IMPORT: Import pricing models
from pricing.models import DiscountCode, Price, SubscriptionPlan, UserSubscription

# Get the custom User model
User = get_user_model()


class Command(BaseCommand):
    """
    Custom management command to populate the database with mock Author and Book data,
    and necessary mock Pricing and Subscription infrastructure.
    """

    help = "Populates the catalog and pricing infrastructure for testing."

    # Mock Data Lists (Used for creation context)
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
        ("Science Fiction", "A Space Odyssey", True, False, 25.99),
        ("Science Fiction", "Foundation", True, True, 22.50),
        ("Fiction", "1984", True, False, 15.00),
        ("Fiction", "To the Lighthouse", False, True, 18.75),
        ("Mystery", "Murder on the Orient Express", False, False, 12.00),
        ("Fantasy", "The Hobbit", True, True, 29.99),
        ("History", "Sapiens", False, False, 35.00),
        ("Technology", "Code Complete", True, False, 45.99),
        ("Science", "Cosmos", False, True, 20.00),
        ("Business", "The 7 Habits", False, False, 14.50),
    ]

    SUBSCRIPTION_PLANS = [
        {"name": "Basic Reader", "price": 5.99, "discount": 10},
        {"name": "Premium Scholar", "price": 12.99, "discount": 25},
    ]

    @transaction.atomic
    def handle(self, *args, **options):
        # --- 1. CLEANUP ---
        self.stdout.write(self.style.WARNING("Deleting all existing data..."))
        Book.objects.all().delete()
        Author.objects.all().delete()
        DiscountCode.objects.all().delete()
        SubscriptionPlan.objects.all().delete()
        UserSubscription.objects.all().delete()
        Price.objects.all().delete()

        # --- 2. Create Authors ---
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

        # --- 3. Create Books and store them temporarily ---
        self.stdout.write(self.style.SUCCESS("Creating 50 Mock Books..."))
        books_to_price = []

        for i in range(50):
            author = random.choice(authors)

            # Select mock data from the list
            base_genre, base_title, is_digital, is_audio, base_price = random.choice(
                self.BOOK_TITLES
            )

            title = f"{base_title} #{i+1} ({random.choice(['The Last', 'The First', 'The New'])} Era)"
            book_slug = slugify(title)

            # Generate dummy ISBN (17 characters)
            isbn = f"978-{random.randint(0, 9)}-{random.randint(10, 99)}-{random.randint(100000, 999999)}"

            book = Book.objects.create(
                author=author,
                title=title,
                slug=book_slug,
                isbn=isbn,
                description=f"This is a crucial book in the {base_genre} genre that explores deep themes of {random.choice(['survival', 'love', 'war', 'AI'])}.",
                genre=base_genre.upper().replace(" ", "_"),
                is_digital=is_digital,
                is_audio=is_audio,
                cover_image_url=f"http://placehold.co/400x600/123456/white?text={base_title.replace(' ', '+')}",
            )
            books_to_price.append((book, base_price))

        # --- 4. Create Subscription Plans ---
        self.stdout.write(self.style.SUCCESS("Creating Subscription Plans..."))
        plans = []
        for p in self.SUBSCRIPTION_PLANS:
            plan = SubscriptionPlan.objects.create(
                name=p["name"],
                slug=slugify(p["name"]),
                monthly_price=Decimal(p["price"]),
                digital_discount_percent=p["discount"],
                is_active=True,
            )
            plans.append(plan)

        # --- 5. Create Discount Codes ---
        self.stdout.write(self.style.SUCCESS("Creating Discount Codes..."))
        DiscountCode.objects.create(
            code="SUMMER30",
            discount_percent=30,
            valid_until=timezone.now() + timedelta(days=30),
            max_uses=5,  # 🔑 NEW: Add capacity limit for testing
        )
        DiscountCode.objects.create(
            code="EXPIRED10",
            discount_percent=10,
            valid_until=timezone.now() - timedelta(days=1),
        )

        # --- 6. Set Active Prices for All Books ---
        self.stdout.write(
            self.style.SUCCESS("Setting current active price for all books...")
        )
        for book, base_price in books_to_price:
            Price.objects.create(
                book=book,
                value=Decimal(base_price),
                currency="USD",
                effective_from=timezone.now(),
                # 🔑 Note: Assuming a new DecimalField(max_digits=10, decimal_places=2, default=1.00)
                # named 'min_price_floor' is added to the Price model in your next step.
            )

        # --- 7. Create Mock User Subscription (for a test user) ---
        # Find the first user in the database (or create one if needed)
        try:
            test_user = User.objects.first()
            if not test_user:
                test_user = User.objects.create_user(
                    username="dev_tester",
                    email="dev@test.com",
                    password="devpassword",
                    job_or_major="Developer",
                    hobbies_or_likings="Testing",
                )

            # Subscribe the test user to the Premium plan for a year
            premium_plan = plans[1]
            UserSubscription.objects.create(
                user=test_user,
                plan=premium_plan,
                is_active=True,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=365),
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Subscribed user '{test_user.username}' to '{premium_plan.name}'."
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Could not create test user subscription: {e}")
            )

        self.stdout.write(self.style.SUCCESS("Database population complete."))
        self.stdout.write(
            self.style.WARNING(
                "Please run 'python manage.py rebuild_index' now to update search data."
            )
        )
