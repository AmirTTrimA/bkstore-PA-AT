import random
from datetime import timedelta
from decimal import Decimal

from cart.models import Cart, CartItem, Order, OrderItem, WishlistItem
from cart.services import CheckoutService
from catalog.models import Author, Book
from content.models import License
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from pricing.models import (Discount, DiscountCode, Price, SubscriptionPlan,
                            UserSubscription)
from publishing.models import (AuthorCreateProposal, AuthorUpdateProposal,
                               BookCreateProposal, BookDeleteProposal,
                               BookUpdateProposal, PriceChangeProposal,
                               Proposal, Publisher, PublisherMembership)
from wallet.models import Wallet, WalletTransaction

User = get_user_model()

class Command(BaseCommand):

    help = "Generates a complete demo bookstore environment."

    DEMO_USERS = [
        ("alice", "Alice Johnson"),
        ("bob", "Bob Smith"),
        ("charlie", "Charlie Brown"),
        ("diana", "Diana Miller"),
        ("emma", "Emma Davis"),
        ("farah", "Farah Hassan"),
        ("george", "George Wilson"),
        ("henry", "Henry Clark"),
        ("isabella", "Isabella Moore"),
        ("jack", "Jack Taylor"),
        ("kate", "Kate Anderson"),
        ("liam", "Liam Thomas"),
        ("mia", "Mia Martin"),
        ("noah", "Noah White"),
        ("olivia", "Olivia Harris"),
        ("peter", "Peter Lewis"),
        ("quinn", "Quinn Walker"),
        ("ruby", "Ruby Hall"),
        ("sam", "Sam Young"),
        ("victoria", "Victoria King"),
    ]

    PASSWORD = "demo12345"

    AUTHOR_NAMES = [
        "J.R.R. Tolkien",
        "George Orwell",
        "Jane Austen",
        "Isaac Asimov",
        "Gabriel García Márquez",
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

    BOOK_TEMPLATES = {
        "FICTION": [
            "The Silent River",
            "Echoes of Tomorrow",
            "The Last Letter",
            "Hidden Truths",
            "Crossing Paths",
        ],
        "SCI_FI": [
            "Beyond Orion",
            "Neural Horizon",
            "The Quantum Gate",
            "Mars Protocol",
            "Stellar Dreams",
        ],
        "HISTORY": [
            "Empires of the East",
            "The Roman Frontier",
            "Medieval Europe",
            "Age of Discovery",
            "The Last Dynasty",
        ],
        "SCIENCE": [
            "Understanding the Cosmos",
            "Modern Genetics",
            "The Nature of Time",
            "Physics for Everyone",
            "Inside the Atom",
        ],
        "TECH": [
            "Mastering Django",
            "Clean Python",
            "Distributed Systems",
            "Modern Rust",
            "Practical Linux",
        ],
        "BUSINESS": [
            "Building Great Teams",
            "Startup Mindset",
            "Strategic Leadership",
            "Finance Essentials",
            "The Product Journey",
        ],
    }

    PRICE_RANGES = {
        "FICTION": (12, 25),
        "SCI_FI": (15, 30),
        "HISTORY": (18, 35),
        "SCIENCE": (25, 60),
        "TECH": (30, 80),
        "BUSINESS": (20, 50),
    }

    SUBSCRIPTION_PLANS = [
        {
            "name": "Reader",
            "price": Decimal("4.99"),
            "discount": 10,
        },
        {
            "name": "Scholar",
            "price": Decimal("9.99"),
            "discount": 20,
        },
        {
            "name": "Professional",
            "price": Decimal("19.99"),
            "discount": 35,
        },
    ]

    AUTOMATIC_DISCOUNTS = [
        {
            "name": "Summer Fiction Sale",
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal("15"),
            "scope": Discount.Scope.GENRE,
            "genre": "FICTION",
        },
        {
            "name": "Technology Week",
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal("20"),
            "scope": Discount.Scope.GENRE,
            "genre": "TECH",
        },
        {
            "name": "Audiobook Promotion",
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal("10"),
            "scope": Discount.Scope.FORMAT,
            "format": Discount.Format.AUDIO,
        },
    ]

    COUPON_DISCOUNTS = [
        {
            "name": "WELCOME10",
            "code": "WELCOME10",
            "value": Decimal("10"),
        },
        {
            "name": "SUMMER20",
            "code": "SUMMER20",
            "value": Decimal("20"),
        },
        {
            "name": "VIP30",
            "code": "VIP30",
            "value": Decimal("30"),
        },
    ]

    PUBLISHERS = [
        {
            "name": "O'Reilly Media",
            "website": "https://www.oreilly.com",
            "email": "contact@oreilly.demo",
            "description": (
                "Technology and software engineering publisher "
                "specializing in developer education."
            ),
        },
        {
            "name": "Penguin Books",
            "website": "https://www.penguinrandomhouse.com",
            "email": "contact@penguin.demo",
            "description": (
                "General publishing organization covering fiction, "
                "history, and educational works."
            ),
        },
        {
            "name": "MIT Press",
            "website": "https://mitpress.mit.edu",
            "email": "contact@mit.demo",
            "description": (
                "Academic publisher focused on science and technology."
            ),
        },
        {
            "name": "Pearson",
            "website": "https://www.pearson.com",
            "email": "contact@pearson.demo",
            "description": (
                "Educational and professional learning publisher."
            ),
        },
        {
            "name": "Demo Independent Publishing",
            "website": "https://demo-publishing.local",
            "email": "contact@demo-publishing.local",
            "description": (
                "Small independent publisher used for testing workflows."
            ),
        },
    ]

    def build_shipping_data(self, user, coupon_code=None):

        data = {
            "shipping_name": f"{user.first_name} {user.last_name}",
            "shipping_address_line1": "123 Demo Street",
            "shipping_city": "Booktown",
            "shipping_country": "DemoLand",
        }

        if coupon_code:
            data["discount_code"] = coupon_code

        return data

    @transaction.atomic
    def handle(self, *args, **options):

        random.seed(42)

        self.users = {}
        self.authors = {}
        self.books = {}

        self.prices = {}

        self.subscription_plans = []
        self.automatic_discounts = []
        self.coupon_codes = []

        self.publishers = {}
        self.proposals = []

        self.wallets = {}
        self.wallet_transactions = []

        self.reset_demo_data()

        self.create_users()

        self.create_wallets()

        self.create_publishers()

        self.create_authors()

        self.create_books()

        self.create_prices()

        self.create_subscription_plans()

        self.create_discounts()

        self.create_subscriptions()

        self.create_carts()

        self.create_wishlists()

        self.create_orders()

        self.create_proposals()

        self.print_summary()

    def reset_demo_data(self):
        """
        Removes existing demo data so the command can be safely rerun.
        """

        self.stdout.write("Removing existing demo data...")

        # --- Publishing proposal details ---
        BookDeleteProposal.objects.all().delete()
        BookUpdateProposal.objects.all().delete()
        BookCreateProposal.objects.all().delete()

        AuthorUpdateProposal.objects.all().delete()
        AuthorCreateProposal.objects.all().delete()

        PriceChangeProposal.objects.all().delete()

        # --- Generic proposals ---
        Proposal.objects.all().delete()

        # --- Publisher memberships / publishers ---
        PublisherMembership.objects.all().delete()
        Publisher.objects.all().delete()

        # --- Orders ---
        OrderItem.objects.all().delete()
        Order.objects.all().delete()

        # --- Wallets ---
        WalletTransaction.objects.all().delete()
        Wallet.objects.all().delete()

        # --- Licensing ---
        License.objects.all().delete()
        UserSubscription.objects.all().delete()

        # --- Pricing ---
        Price.objects.all().delete()
        DiscountCode.objects.all().delete()
        SubscriptionPlan.objects.all().delete()

        # --- Catalog ---
        Book.objects.all().delete()
        Author.objects.all().delete()

        # Remove demo users but leave superusers intact.
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(
            self.style.SUCCESS("Previous demo data removed.")
        )

    def create_users(self):
        """
        Creates demo users used throughout the demo environment.
        """

        self.stdout.write("Creating demo users...")

        for username, full_name in self.DEMO_USERS:

            first_name = full_name.split()[0]
            last_name = full_name.split()[1]

            user = User.objects.create_user(
                username=username,
                email=f"{username}@demo.local",
                password=self.PASSWORD,
                first_name=first_name,
                last_name=last_name,
            )

            self.users[user.username] = user

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.users)} demo users."
            )
    )

    def create_wallets(self):
        """
        Creates wallets and realistic transaction history for demo users.
        """

        self.stdout.write("Creating wallets...")

        transaction_count = 0

        for user in self.user_list:

            wallet = Wallet.objects.create(
                user=user,
                currency="USD",
            )

            # Give each user an initial deposit between $40 and $250.
            initial_balance = Decimal(
                str(round(random.uniform(40, 250), 2))
            )

            wallet.balance = initial_balance
            wallet.save(update_fields=["balance"])

            deposit = WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type=WalletTransaction.TransactionType.DEPOSIT,
                amount=initial_balance,
                balance_after=initial_balance,
                description="Initial demo wallet funding",
            )

            self.wallets[user.username] = wallet
            self.wallet_transactions.append(deposit)

            transaction_count += 1

            # Roughly half the users get a second deposit transaction.
            if random.random() < 0.50:

                extra_amount = Decimal(
                    str(round(random.uniform(10, 75), 2))
                )

                wallet.balance += extra_amount
                wallet.save(update_fields=["balance"])

                extra_deposit = WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.TransactionType.DEPOSIT,
                    amount=extra_amount,
                    balance_after=wallet.balance,
                    description="Additional demo funding",
                )

                self.wallet_transactions.append(extra_deposit)
                transaction_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.wallets)} wallets "
                f"and {transaction_count} wallet transactions."
            )
        )

    def create_publishers(self):
        """
        Creates demo publisher organizations and memberships.
        """

        self.stdout.write("Creating publishers...")

        publishers = []

        for data in self.PUBLISHERS:

            publisher = Publisher.objects.create(
                name=data["name"],
                website=data["website"],
                contact_email=data["email"],
                description=data["description"],
            )

            self.publishers[publisher.slug] = publisher
            publishers.append(publisher)

        roles = [
            PublisherMembership.Role.OWNER,
            PublisherMembership.Role.MANAGER,
            PublisherMembership.Role.EDITOR,
        ]

        users = self.user_list.copy()

        random.shuffle(users)

        for publisher in publishers:

            if not users:
                break

            number_of_members = random.randint(3, 5)

            members = users[:number_of_members]

            users = users[number_of_members:]

            for position, user in enumerate(members):

                PublisherMembership.objects.create(
                    publisher=publisher,
                    user=user,
                    role=roles[position % len(roles)],
                    is_active=True,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.publishers)} publishers "
                # f"and {membership_count} memberships."
            )
        )

    def create_authors(self):
        """
        Creates demo authors.
        """

        self.stdout.write("Creating authors...")

        for name in self.AUTHOR_NAMES:

            author = Author.objects.create(
                name=name,
                biography=(
                    f"{name} is one of the demo authors generated for the "
                    "Bookstore development environment."
                ),
            )

            self.authors[author.name] = author

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.authors)} authors."
            )
        )

    def create_books(self):
        """
        Creates a realistic catalog of demo books.
        """

        self.stdout.write("Creating books...")

        book_counter = 1

        genres = tuple(self.BOOK_TEMPLATES)

        for author in self.authors.values():

            number_of_books = random.randint(3, 4)

            for _ in range(number_of_books):

                genre = random.choice(genres)

                title = random.choice(
                    self.BOOK_TEMPLATES[genre]
                )

                title = f"{title} ({book_counter})"

                book = Book.objects.create(
                    author=author,
                    title=title,
                    slug=slugify(title),
                    isbn=f"978100000{book_counter:06d}",
                    description=(
                        f"{title} is a demo {genre.lower()} book "
                        f"written by {author.name}."
                    ),
                    genre=genre,
                    cover_image_url=(
                        f"https://placehold.co/400x600"
                        f"?text={slugify(title)}"
                    ),
                    is_digital=random.random() < 0.75,
                    is_audio=random.random() < 0.35,
                    digital_file_path="demo/book.epub",
                    audio_file_path="demo/book.mp3",
                )

                self.books[book.isbn] = book

                book_counter += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.books)} books."
            )
        )

    def create_prices(self):
        """
        Creates realistic price histories for demo books.

        Most books receive a single active price.
        Around 20% receive multiple historical price changes.
        """

        self.stdout.write("Creating prices...")

        now = timezone.now()

        for book in self.books.values():

            minimum, maximum = self.PRICE_RANGES[book.genre]

            current_price = Decimal(
                str(
                    round(
                        random.uniform(minimum, maximum),
                        2,
                    )
                )
            )

            min_price = (
                current_price * Decimal("0.40")
            ).quantize(
                Decimal("0.01")
            )

            # --------------------------------------------------
            # Most books only receive one price.
            # --------------------------------------------------

            if random.random() >= 0.20:

                price = book.change_price(
                    value=current_price,
                    currency="USD",
                    min_price=min_price,
                )

                self.prices[book.isbn] = price

                continue

            # --------------------------------------------------
            # Build a realistic price history.
            # --------------------------------------------------

            history_count = random.randint(2, 4)

            dates = sorted(
                random.sample(
                    range(30, 700),
                    history_count - 1,
                ),
                reverse=True,
            )

            dates.append(0)

            value = current_price

            previous_price = None

            for days_ago in dates:

                if previous_price is not None:

                    change = Decimal(
                        str(
                            round(
                                random.uniform(-0.20, 0.20),
                                2,
                            )
                        )
                    )

                    value = (
                        value * (Decimal("1.00") + change)
                    ).quantize(
                        Decimal("0.01")
                    )

                    if value < min_price:
                        value = min_price

                price = book.change_price(
                    value=value,
                    currency="USD",
                    min_price=min_price,
                )

                timestamp = now - timedelta(days=days_ago)

                price.effective_from = timestamp

                if previous_price is not None:
                    previous_price.effective_until = timestamp
                    previous_price.save(update_fields=["effective_until"])

                price.save(update_fields=["effective_from"])

                previous_price = price

            self.prices[book.isbn] = previous_price

        self.stdout.write(
            self.style.SUCCESS(
                f"Created prices for {len(self.books)} books."
            )
        )

    def create_subscription_plans(self):
        """
        Creates the demo subscription plans.
        """

        self.stdout.write("Creating subscription plans...")

        for plan_data in self.SUBSCRIPTION_PLANS:

            plan = SubscriptionPlan.objects.create(
                name=plan_data["name"],
                slug=slugify(plan_data["name"]),
                monthly_price=plan_data["price"],
                digital_discount_percent=plan_data["discount"],
                is_active=True,
            )

            self.subscription_plans.append(plan)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(self.subscription_plans)} subscription plans."
            )
        )

    def create_discounts(self):
        """
        Creates automatic discounts and coupon-based discounts.
        """

        self.stdout.write("Creating discounts...")

        for data in self.AUTOMATIC_DISCOUNTS:

            discount = Discount.objects.create(
                name=data["name"],
                description=f"{data['name']} promotion.",
                discount_type=data["discount_type"],
                value=data["value"],
                scope=data["scope"],
                genre=data.get("genre", ""),
                format=data.get("format", ""),
                activation=Discount.Activation.AUTOMATIC,
                is_active=True,
            )

            self.automatic_discounts.append(discount)

        for data in self.COUPON_DISCOUNTS:

            discount = Discount.objects.create(
                name=data["name"],
                description=f"Coupon activated by the code '{data['code']}'.",
                discount_type=Discount.DiscountType.PERCENT,
                value=data["value"],
                scope=Discount.Scope.STORE,
                activation=Discount.Activation.COUPON,
                is_active=True,
            )

            code = DiscountCode.objects.create(
                discount=discount,
                code=data["code"],
                is_active=True,
                max_uses=random.choice([50, 100, 250, None]),
            )

            self.coupon_codes.append(code)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created "
                f"{len(self.automatic_discounts)} automatic discounts "
                f"and {len(self.coupon_codes)} coupon codes."
            )
        )

    def create_subscriptions(self):
        """
        Creates a realistic mixture of active, expired, and absent subscriptions.
        """

        self.stdout.write("Creating user subscriptions...")

        users = list(self.users.values())
        random.shuffle(users)

        reader_plan = next(
            plan
            for plan in self.subscription_plans
            if plan.name == "Reader"
        )

        scholar_plan = next(
            plan
            for plan in self.subscription_plans
            if plan.name == "Scholar"
        )

        professional_plan = next(
            plan
            for plan in self.subscription_plans
            if plan.name == "Professional"
        )

        now = timezone.now()

        # -----------------------------
        # Reader subscriptions (6)
        # -----------------------------
        for user in users[:6]:

            UserSubscription.objects.create(
                user=user,
                plan=reader_plan,
                is_active=True,
                start_date=now,
                end_date=now + timedelta(days=365),
            )

        # -----------------------------
        # Scholar subscriptions (4)
        # -----------------------------
        for user in users[6:10]:

            UserSubscription.objects.create(
                user=user,
                plan=scholar_plan,
                is_active=True,
                start_date=now,
                end_date=now + timedelta(days=365),
            )

        # -----------------------------
        # Professional subscription (1)
        # -----------------------------
        UserSubscription.objects.create(
            user=users[10],
            plan=professional_plan,
            is_active=True,
            start_date=now,
            end_date=now + timedelta(days=365),
        )

        # -----------------------------
        # Expired subscription (1)
        # -----------------------------
        UserSubscription.objects.create(
            user=users[11],
            plan=reader_plan,
            is_active=True,
            start_date=now - timedelta(days=730),
            end_date=now - timedelta(days=365),
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Created 12 user subscriptions."
            )
        )

    def create_carts(self):
        """
        Creates shopping carts for a subset of demo users.
        """

        self.stdout.write("Creating shopping carts...")

        users_with_carts = random.sample(
            self.user_list,
            k=12,
        )

        cart_count = 0

        for user in users_with_carts:

            cart = Cart.objects.create(
                user=user,
            )

            available_books = random.sample(
                self.book_list,
                k=random.randint(1, 5),
            )

            for book in available_books:

                CartItem.objects.create(
                    cart=cart,
                    book=book,
                    quantity=random.randint(1, 3),
                )

            cart_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {cart_count} shopping carts."
            )
        )

    def create_wishlists(self):
        """
        Creates demo wishlists for a subset of users.
        """

        self.stdout.write("Creating wishlists...")

        users_with_wishlists = random.sample(
            self.user_list,
            k=10,
        )

        wishlist_count = 0

        for user in users_with_wishlists:

            books = random.sample(
                self.book_list,
                k=random.randint(2, 6),
            )

            for book in books:

                WishlistItem.objects.create(
                    user=user,
                    book=book,
                )

                wishlist_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {wishlist_count} wishlist items."
            )
        )

    def create_orders(self):
        """
        Creates completed orders by exercising the real checkout workflow.
        """

        self.stdout.write("Creating orders...")

        purchasing_users = random.sample(
            self.user_list,
            k=10,
        )

        orders_created = 0

        for user in purchasing_users:

            cart, _ = Cart.objects.get_or_create(
                user=user,
            )

            books = random.sample(
                self.book_list,
                k=random.randint(1, 4),
            )

            for book in books:

                CartItem.objects.create(
                    cart=cart,
                    book=book,
                    quantity=random.randint(1, 2),
                )

            coupon = None

            if random.random() < 0.30:
                coupon = random.choice(self.coupon_codes).code

            CheckoutService(user=user).checkout(
                cart=cart,
                shipping_data=self.build_shipping_data(
                    user=user,
                    coupon_code=coupon,
                ),
            )

            orders_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {orders_created} orders."
            )
        )

    def create_proposals(self):
        """
        Creates demo publisher proposals for moderation workflow testing.
        """

        self.stdout.write("Creating proposals...")

        publishers = list(self.publishers.values())

        created = 0

        statuses = [
            Proposal.Status.SUBMITTED,
            Proposal.Status.UNDER_REVIEW,
            Proposal.Status.REJECTED,
        ]

        # Users that belong to publishers
        members = list(
            PublisherMembership.objects.filter(
                is_active=True,
            )
        )

        if not members:
            self.stdout.write(
                self.style.WARNING(
                    "No publisher memberships found. Skipping proposals."
                )
            )
            return

        # ------------------------------------------------------------
        # Book creation proposals
        # ------------------------------------------------------------

        for _ in range(5):

            membership = random.choice(members)
            publisher = membership.publisher

            proposal = Proposal.objects.create(
                title=f"Create new book proposal #{created + 1}",
                publisher=publisher,
                submitted_by=membership.user,
                proposal_type=Proposal.ProposalType.BOOK_CREATE,
                status=random.choice(statuses),
            )

            author = random.choice(self.author_list)

            BookCreateProposal.objects.create(
                proposal=proposal,
                author=author,
                title=f"New Demo Book {created + 1}",
                description=(
                    "A demo book creation request submitted "
                    "by a publisher."
                ),
                isbn=f"978200000{created + 1:06d}",
                cover_image_url=(
                    f"https://placehold.co/400x600"
                    f"?text=new-demo-book-{created + 1}"
                ),
                genre=random.choice(
                    list(Book.GENRE_CHOICES)
                )[0],
                is_digital=True,
                is_audio=random.choice(
                    [True, False]
                ),
                digital_file_path="demo/new_book.epub",
                audio_file_path="demo/new_book.mp3",
            )

            self.proposals.append(proposal)
            created += 1


        # ------------------------------------------------------------
        # Book update proposals
        # ------------------------------------------------------------

        for book in random.sample(
            self.book_list,
            k=5,
        ):

            membership = random.choice(members)

            proposal = Proposal.objects.create(
                title=f"Update {book.title}",
                publisher=membership.publisher,
                submitted_by=membership.user,
                proposal_type=Proposal.ProposalType.BOOK_UPDATE,
                status=random.choice(statuses),
            )

            BookUpdateProposal.objects.create(
                proposal=proposal,
                book=book,
                title=book.title,
                description=(
                    f"Updated description for {book.title}"
                ),
                cover_image_url=book.cover_image_url,
                genre=book.genre,
                is_digital=book.is_digital,
                is_audio=book.is_audio,
                digital_file_path=book.digital_file_path,
                audio_file_path=book.audio_file_path,
            )

            self.proposals.append(proposal)
            created += 1


        # ------------------------------------------------------------
        # Price change proposals
        # ------------------------------------------------------------

        for book in random.sample(
            self.book_list,
            k=5,
        ):

            membership = random.choice(members)

            current_price = self.prices.get(
                book.isbn
            )

            if not current_price:
                continue

            new_price = (
                current_price.value * Decimal("1.10")
            ).quantize(
                Decimal("0.01")
            )

            proposal = Proposal.objects.create(
                title=f"Price update for {book.title}",
                publisher=membership.publisher,
                submitted_by=membership.user,
                proposal_type=Proposal.ProposalType.PRICE_CHANGE,
                status=random.choice(statuses),
            )

            PriceChangeProposal.objects.create(
                proposal=proposal,
                book=book,
                value=new_price,
                currency="USD",
                min_price=current_price.min_price,
                reason="Annual price adjustment.",
            )

            self.proposals.append(proposal)
            created += 1


        # ------------------------------------------------------------
        # Rejection/review metadata
        # ------------------------------------------------------------

        for proposal in self.proposals:

            if proposal.status in [
                Proposal.Status.REJECTED,
                Proposal.Status.UNDER_REVIEW,
            ]:

                proposal.reviewed_by = User.objects.filter(
                    is_superuser=True
                ).first()

                proposal.reviewed_at = (
                    timezone.now()
                    -
                    timedelta(
                        days=random.randint(1, 30)
                    )
                )

                if proposal.status == Proposal.Status.REJECTED:

                    proposal.review_notes = (
                        "Rejected during demo review. "
                        "Metadata requires revision."
                    )

                proposal.save()


        self.stdout.write(
            self.style.SUCCESS(
                f"Created {created} demo proposals."
            )
        )

    def print_summary(self):
        """
        Prints a summary of the generated demo environment.
        """

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Demo environment generated successfully"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        self.stdout.write("")
        self.stdout.write("Created:")

        self.stdout.write(f"  Users:               {User.objects.count()}")

        self.stdout.write(f"  Publishers:          {Publisher.objects.count()}")

        self.stdout.write(f"  Publisher Members:   {PublisherMembership.objects.count()}")

        self.stdout.write(f"  Proposals:           {Proposal.objects.count()}")
        
        self.stdout.write(f"  Authors:            {Author.objects.count()}")
        self.stdout.write(f"  Books:              {Book.objects.count()}")

        self.stdout.write(f"  Prices:             {Price.objects.count()}")
        self.stdout.write(f"  Subscription Plans: {SubscriptionPlan.objects.count()}")

        self.stdout.write(f"  Discounts:          {Discount.objects.count()}")
        self.stdout.write(f"  Coupon Codes:       {DiscountCode.objects.count()}")

        self.stdout.write(f"  User Subscriptions: {UserSubscription.objects.count()}")

        self.stdout.write(f"  Wallets:            {Wallet.objects.count()}")
        self.stdout.write(f"  Wallet Transactions:{WalletTransaction.objects.count()}")

        self.stdout.write(f"  Shopping Carts:     {Cart.objects.count()}")
        self.stdout.write(f"  Cart Items:         {CartItem.objects.count()}")

        self.stdout.write(f"  Wishlist Items:     {WishlistItem.objects.count()}")

        self.stdout.write(f"  Orders:             {Order.objects.count()}")
        self.stdout.write(f"  Order Items:        {OrderItem.objects.count()}")

        self.stdout.write(f"  Licenses:           {License.objects.count()}")

        self.stdout.write("")
        self.stdout.write("Demo login credentials:")

        self.stdout.write("  Username: alice")
        self.stdout.write(f"  Password: {self.PASSWORD}")

        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "Superuser accounts were preserved."
            )
        )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Demo database is ready."
            )
        )

        self.stdout.write("")
        self.stdout.write(
            self.style.HTTP_INFO(
                "To recreate the demo database later:"
            )
        )
        self.stdout.write(
            "  python manage.py generate_demo_data"
        )

    @property
    def user_list(self):
        return list(self.users.values())

    @property
    def book_list(self):
        return list(self.books.values())

    @property
    def author_list(self):
        return list(self.authors.values())