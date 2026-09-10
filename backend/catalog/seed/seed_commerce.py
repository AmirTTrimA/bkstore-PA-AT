"""
Commerce Seeder: Users, Wallets, Iranian Rial Discounts, Subscriptions, Orders, and Carts.
"""
import random
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import Address
from cart.models import Cart, CartItem, Order, OrderItem, WishlistItem
from catalog.models import BookFormat
from content.models import License
from pricing.models import (
    Discount,
    DiscountCode,
    SubscriptionPlan,
    UserSubscription,
)
from wallet.models import Wallet, WalletTransaction

User = get_user_model()

PASSWORD = "demo12345"

DEMO_CUSTOMERS = [
    ("alice", "Alice Johnson", "alice@example.com", "تهران، خیابان ولیعصر، پلاک ۱۲", "تهران", "1939543211"),
    ("bob", "Bob Smith", "bob@example.com", "اصفهان، خیابان چهارباغ عباسی، کوچه مروارید", "اصفهان", "8146598712"),
    ("charlie", "Charlie Brown", "charlie@example.com", "شیراز، بلوار زند، خیابان انوری", "شیراز", "7134567890"),
    ("diana", "Diana Miller", "diana@example.com", "مشهد، بلوار احمدآباد، پلاک ۵", "مشهد", "9176543210"),
    ("amir", "Amir Hossein", "amir@example.com", "تهران، میدان ونک، برج نگار", "تهران", "1968634125"),
]

def seed_commerce(books_list, stdout=None):
    # 1. Create Promotional Discounts & Codes
    disc_vip, _ = Discount.objects.update_or_create(
        name="تخفیف ویژه باشگاه مشتریان (VIP30)",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(30),
            "scope": Discount.Scope.STORE,
            "activation": Discount.Activation.COUPON,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۳۰ درصد تخفیف ویژه برای تمام کتاب‌های فروشگاه",
        },
    )
    DiscountCode.objects.update_or_create(
        code="VIP30",
        defaults={"discount": disc_vip, "is_active": True, "max_uses": 1000},
    )

    disc_welcome, _ = Discount.objects.update_or_create(
        name="کد تخفیف خوش‌آمدگویی (WELCOME10)",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(10),
            "scope": Discount.Scope.STORE,
            "activation": Discount.Activation.COUPON,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۱۰ درصد تخفیف برای خرید اول",
        },
    )
    DiscountCode.objects.update_or_create(
        code="WELCOME10",
        defaults={"discount": disc_welcome, "is_active": True, "max_uses": 5000},
    )

    disc_summer, _ = Discount.objects.update_or_create(
        name="تخفیف نقدی تابستانه (SUMMER50K)",
        defaults={
            "discount_type": Discount.DiscountType.FIXED,
            "value": Decimal(50000),
            "scope": Discount.Scope.STORE,
            "activation": Discount.Activation.COUPON,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۵۰,۰۰۰ ریال تخفیف مقطوع روی سبد خرید",
        },
    )
    DiscountCode.objects.update_or_create(
        code="SUMMER50K",
        defaults={"discount": disc_summer, "is_active": True, "max_uses": 2000},
    )

    # Automatic Promotional Store & Genre Discounts
    Discount.objects.update_or_create(
        name="جشنواره شاهکارهای ادبیات داستانی",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(25),
            "scope": Discount.Scope.GENRE,
            "genre": "FICTION",
            "activation": Discount.Activation.AUTOMATIC,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۲۵ درصد تخفیف ویژه برای تمام آثار ادبیات و داستان",
        },
    )
    Discount.objects.update_or_create(
        name="تخفیف ویژه فلسفه و اندیشه",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(20),
            "scope": Discount.Scope.GENRE,
            "genre": "PHILOSOPHY",
            "activation": Discount.Activation.AUTOMATIC,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۲۰ درصد تخفیف برای کتاب‌های فلسفه و اندیشه",
        },
    )
    Discount.objects.update_or_create(
        name="تخفیف ویژه کتاب‌های فناوری و مهندسی",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(30),
            "scope": Discount.Scope.GENRE,
            "genre": "TECH",
            "activation": Discount.Activation.AUTOMATIC,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۳۰ درصد تخفیف برای کتاب‌های فناوری و مهندسی نرم‌افزار",
        },
    )
    Discount.objects.update_or_create(
        name="تخفیف ویژه شاهکارهای علمی‌تخیلی",
        defaults={
            "discount_type": Discount.DiscountType.PERCENT,
            "value": Decimal(20),
            "scope": Discount.Scope.GENRE,
            "genre": "SCI_FI",
            "activation": Discount.Activation.AUTOMATIC,
            "is_active": True,
            "valid_from": timezone.now() - timezone.timedelta(days=30),
            "valid_until": timezone.now() + timezone.timedelta(days=365),
            "description": "۲۰ درصد تخفیف ویژه کتاب‌های علمی‌تخیلی",
        },
    )

    # 2. Create Subscription Plans
    gold_plan, _ = SubscriptionPlan.objects.update_or_create(
        slug="gold-tier",
        defaults={
            "name": "اشتراک طلایی (Gold Tier)",
            "tier": 1,
            "monthly_price": Decimal(290000),
            "digital_discount_percent": 30,
            "is_active": True,
        },
    )
    silver_plan, _ = SubscriptionPlan.objects.update_or_create(
        slug="silver-tier",
        defaults={
            "name": "اشتراک نقره‌ای (Silver Tier)",
            "tier": 2,
            "monthly_price": Decimal(150000),
            "digital_discount_percent": 15,
            "is_active": True,
        },
    )

    # 3. Create Customers & Seed Accounts
    created_users = []
    for username, full_name, email, addr_line, city, postal in DEMO_CUSTOMERS:
        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=PASSWORD,
                first_name=full_name.split()[0],
                last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "",
            )
        else:
            user.set_password(PASSWORD)
            user.save()

        created_users.append(user)

        # Shipping Address
        Address.objects.update_or_create(
            user=user,
            is_default=True,
            defaults={
                "title": "منزل (Home)",
                "recipient_name": full_name,
                "phone_number": "09121234567",
                "country": "Iran",
                "province": city,
                "city": city,
                "address_line": addr_line,
                "postal_code": postal,
            },
        )

        # Funded Wallet with IRR balance
        wallet, _ = Wallet.objects.update_or_create(
            user=user,
            defaults={"balance": Decimal(3500000), "currency": "IRR", "is_active": True},
        )
        if not wallet.transactions.exists():
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=Decimal(3500000),
                balance_after=Decimal(3500000),
                transaction_type=WalletTransaction.TransactionType.DEPOSIT,
                description="شارژ اولیه حساب کاربری دمو (Initial Demo Credit)",
            )

        # Cart
        Cart.objects.get_or_create(user=user)

    # Alice gets an active Gold Subscription
    alice = created_users[0]
    UserSubscription.objects.update_or_create(
        user=alice,
        defaults={
            "plan": gold_plan,
            "status": UserSubscription.Status.ACTIVE,
            "start_date": timezone.now() - timezone.timedelta(days=5),
            "end_date": timezone.now() + timezone.timedelta(days=25),
        },
    )

    # 4. Realistic Completed Orders and Licenses
    if books_list:
        # Create an order for Alice with 2 books
        book1 = books_list[0]  # 1984
        book2 = books_list[3]  # Brave New World

        phys_fmt1 = book1.formats.filter(format_type=BookFormat.FormatType.PHYSICAL).first()
        dig_fmt2 = book2.formats.filter(format_type=BookFormat.FormatType.DIGITAL).first()

        if phys_fmt1 and dig_fmt2:
            price1 = phys_fmt1.prices.first().value if phys_fmt1.prices.exists() else Decimal(680000)
            price2 = dig_fmt2.prices.first().value if dig_fmt2.prices.exists() else Decimal(396000)
            total = price1 + price2

            order = Order.objects.create(
                user=alice,
                subtotal=total,
                discount_amount=Decimal(0),
                total_amount=total,
                status="DELIVERED",
                shipping_name=alice.get_full_name(),
                shipping_address_line1="تهران، خیابان ولیعصر، پلاک ۱۲",
                shipping_city="تهران",
                shipping_country="Iran",
            )
            OrderItem.objects.create(
                order=order,
                book=book1,
                book_format=phys_fmt1,
                quantity=1,
                snapshot_price=price1,
                snapshot_title=book1.title,
                snapshot_author_name=book1.author.name,
            )
            OrderItem.objects.create(
                order=order,
                book=book2,
                book_format=dig_fmt2,
                quantity=1,
                snapshot_price=price2,
                snapshot_title=book2.title,
                snapshot_author_name=book2.author.name,
            )

            # Issue License for digital purchase
            License.objects.update_or_create(
                user=alice,
                book=book2,
                book_format=dig_fmt2,
                defaults={
                    "order": order,
                    "is_active": True,
                    "valid_from": timezone.now() - timezone.timedelta(days=10),
                },
            )

        # Add items to Alice's active cart and wishlist
        alice_cart = alice.cart
        book_tech = next((b for b in books_list if b.genre == "TECH"), books_list[1])
        phys_tech = book_tech.formats.filter(format_type=BookFormat.FormatType.PHYSICAL).first()
        if phys_tech:
            CartItem.objects.update_or_create(
                cart=alice_cart,
                book=book_tech,
                book_format=phys_tech,
                defaults={"quantity": 1},
            )

        # Wishlist
        for w_book in books_list[5:8]:
            WishlistItem.objects.get_or_create(user=alice, book=w_book)

    if stdout:
        stdout.write(f"  ✓ Seeded {len(created_users)} customers, wallets, discount codes, subscription tiers, and orders.")
