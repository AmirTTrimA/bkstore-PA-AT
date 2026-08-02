from datetime import timedelta
from decimal import Decimal

from cart.models import Cart, CartItem, Order, OrderItem
from catalog.models import Author, Book
from content.models import License
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from pricing.models import (Discount, DiscountCode, Price, SubscriptionPlan,
                            UserSubscription)
from rest_framework import serializers, status
from rest_framework.test import APITestCase

from .models import CartItem, WishlistItem
from .services import CheckoutService

User = get_user_model()

# Set the session key used for anonymous cart data (needs to match settings)
CART_SESSION_KEY = getattr(settings, "CART_SESSION_KEY", "cart")


class CartCRUDTest(APITestCase):
    """
    Part 1: Tests for Cart Item Management (CRUD) and Persistence (Session vs DB).
    Verifies the CartItemHandlerView functionality for both anonymous and authenticated users.
    """

    @classmethod
    def setUpTestData(cls):
        """Setup test users and books once for the entire test suite."""
        # 🔑 FIX 1: Removed client login logic from here, as 'cls.client' does not exist.
        cls.user = User.objects.create_user(
            username="cart_tester",
            email="cart@test.com",
            password="testpassword",
        )
        cls.author = Author.objects.create(name="Test Author")
        cls.book_1 = Book.objects.create(
            author=cls.author,
            title="Digital Guide",
            slug="digital-guide",
            isbn="978-0000000001",
            is_digital=True,  # Mark as digital for subscription discount tests
        )
        cls.book_2 = Book.objects.create(
            author=cls.author,
            title="Physical Manual",
            slug="physical-manual",
            isbn="978-0000000002",
            is_digital=False,  # Mark as physical
        )
        cls.cart_url = reverse("cart-items")
        cls.login_url = reverse("login")
        cls.merge_url = reverse("cart-merge")  # 🔑 NEW: Merge URL

    # 🔑 FIX 2: Added setUp method to access self.client for authentication
    def setUp(self):
        """Runs before every test: logs in the user and generates the auth token."""
        # Log in the user and get token for authenticated requests
        response = self.client.post(
            self.login_url,
            {"username": "cart_tester", "password": "testpassword"},
            format="json",
        )
        self.auth_token = response.data["access"]

    # --- ANONYMOUS (SESSION) TESTS ---

    def test_anonymous_cart_add_and_view(self):
        """Verifies an anonymous user can add items and view them in the session."""
        book_id = self.book_1.pk

        # 1. POST (Add item)
        response_post = self.client.post(
            self.cart_url, {"book_id": book_id, "quantity": 3}, format="json"
        )
        self.assertEqual(response_post.status_code, status.HTTP_200_OK)

        # 2. VERIFY SESSION: Check the Django session directly
        session_cart = self.client.session.get(CART_SESSION_KEY, {})
        self.assertIn(str(book_id), session_cart)
        self.assertEqual(session_cart[str(book_id)], 3)

        # 3. GET (View cart)
        response_get = self.client.get(self.cart_url)
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_get.data), 1)
        self.assertEqual(response_get.data[0]["book_id"], book_id)
        self.assertEqual(response_get.data[0]["quantity"], 3)

    def test_anonymous_cart_delete_item(self):
        """Verifies an anonymous user can remove items from the session."""
        # Setup: Add an item directly to the session first
        session = self.client.session
        session[CART_SESSION_KEY] = {str(self.book_1.pk): 5}
        session.save()

        # 1. DELETE (Remove item)
        response_delete = self.client.delete(
            self.cart_url, {"book_id": self.book_1.pk}, format="json"
        )
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)

        # 2. VERIFY SESSION: Check that the item is gone
        session_cart = self.client.session.get(CART_SESSION_KEY, {})
        self.assertNotIn(str(self.book_1.pk), session_cart)

    # --- AUTHENTICATED (DATABASE) TESTS ---

    def test_authenticated_cart_add_and_view(self):
        """Verifies a logged-in user can add items and views them from the DB."""
        book_id = self.book_2.pk

        # 1. POST (Add item)
        response_post = self.client.post(
            self.cart_url,
            {"book_id": book_id, "quantity": 2},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )
        self.assertEqual(response_post.status_code, status.HTTP_200_OK)

        # 2. VERIFY DB: Check CartItem count in the database
        user_cart = get_object_or_404(Cart, user=self.user)
        self.assertEqual(CartItem.objects.filter(cart=user_cart).count(), 1)
        self.assertEqual(CartItem.objects.get(cart=user_cart).quantity, 2)

        # 3. POST (Update quantity for the same item)
        response_update = self.client.post(
            self.cart_url,
            {"book_id": book_id, "quantity": 1},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )
        # Note: The view logic adds quantity (2 + 1 = 3)
        self.assertEqual(response_update.status_code, status.HTTP_200_OK)
        self.assertEqual(CartItem.objects.get(cart=user_cart).quantity, 3)

        # 4. GET (View cart)
        response_get = self.client.get(
            self.cart_url, HTTP_AUTHORIZATION=f"Bearer {self.auth_token}"
        )
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_get.data), 1)
        self.assertEqual(response_get.data[0]["book_id"], book_id)

    def test_authenticated_cart_delete_item(self):
        """Verifies a logged-in user can remove items from the DB."""
        book = self.book_1

        # Setup: Add item directly to the DB Cart
        user_cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=user_cart, book=book, quantity=5)
        self.assertEqual(CartItem.objects.filter(cart=user_cart).count(), 1)

        # 1. DELETE (Remove item)
        response_delete = self.client.delete(
            self.cart_url,
            {"book_id": book.pk},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)

        # 2. VERIFY DB: Check that the item is gone from the database
        self.assertEqual(CartItem.objects.filter(cart=user_cart).count(), 0)


class CartMergeTest(APITestCase):
    """
    Part 2: Tests the Cart Merge logic (Anonymous Session -> Persistent DB).
    Verifies that item quantities are correctly merged and the session is cleared.
    """

    @classmethod
    def setUpTestData(cls):
        """Setup test data for the merge test."""
        # Note: This user must be different from the one used in CartCRUDTest setup
        cls.user_merge = User.objects.create_user(
            username="merge_user",
            email="merge@test.com",
            password="testpassword",
        )
        cls.author = Author.objects.create(name="Merge Author")
        cls.book_A = Book.objects.create(
            author=cls.author, title="Book A", slug="book-a", isbn="978-0111111111"
        )
        cls.book_B = Book.objects.create(
            author=cls.author, title="Book B", slug="book-b", isbn="978-0222222222"
        )
        cls.merge_url = reverse("cart-merge")
        cls.cart_url = reverse("cart-items")
        cls.login_url = reverse("login")

    def setUp(self):
        """Logs in the user for the merge and clears initial cart state."""
        response = self.client.post(
            self.login_url,
            {"username": "merge_user", "password": "testpassword"},
            format="json",
        )
        self.auth_token = response.data["access"]

        # Ensure user's persistent cart is empty before merge test begins
        CartItem.objects.filter(cart__user=self.user_merge).delete()
        # Ensure session starts clean
        self.client.session[CART_SESSION_KEY] = {}
        self.client.session.modified = True

    def test_merge_anonymous_into_empty_db_cart(self):
        """Scenario: Anonymous cart (2x B) merges into empty DB cart."""

        # 1. SETUP ANONYMOUS SESSION: Add 2x Book B to the session
        session = self.client.session
        session[CART_SESSION_KEY] = {str(self.book_B.pk): 2}
        session.save()

        # 2. EXECUTE MERGE
        response = self.client.post(
            self.merge_url, HTTP_AUTHORIZATION=f"Bearer {self.auth_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. VERIFY DB: Cart should now have 2x Book B
        db_cart = get_object_or_404(Cart, user=self.user_merge)
        self.assertEqual(CartItem.objects.filter(cart=db_cart).count(), 1)
        self.assertEqual(
            CartItem.objects.get(cart=db_cart, book=self.book_B).quantity, 2
        )

        # 4. VERIFY SESSION CLEAR: Anonymous session should be empty
        self.assertEqual(self.client.session.get(CART_SESSION_KEY, {}), {})

    def test_merge_with_quantity_stacking(self):
        """Scenario: Anonymous cart (3x A) merges with existing DB cart (2x A)."""

        # 1. SETUP DB: User already has 2x Book A in their persistent cart
        db_cart, _ = Cart.objects.get_or_create(user=self.user_merge)
        CartItem.objects.create(cart=db_cart, book=self.book_A, quantity=2)

        # 2. SETUP ANONYMOUS SESSION: Add 3x Book A to the session
        session = self.client.session
        session[CART_SESSION_KEY] = {
            str(self.book_A.pk): 3,
            str(self.book_B.pk): 1,
        }  # 3xA (stack) + 1xB (new)
        session.save()

        # 3. EXECUTE MERGE
        response = self.client.post(
            self.merge_url, HTTP_AUTHORIZATION=f"Bearer {self.auth_token}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. VERIFY DB STATE: Should have 2 items total.
        self.assertEqual(CartItem.objects.filter(cart=db_cart).count(), 2)

        # 5. VERIFY STACKING: Book A quantity should be 2 (DB) + 3 (Session) = 5
        self.assertEqual(
            CartItem.objects.get(cart=db_cart, book=self.book_A).quantity, 5
        )

        # 6. VERIFY NEW ITEM: Book B quantity should be 1
        self.assertEqual(
            CartItem.objects.get(cart=db_cart, book=self.book_B).quantity, 1
        )


class CheckoutServiceTestCase(TestCase):
    """
    Tests the CheckoutService orchestration.

    Pricing rules themselves are covered by PricingEngine tests.
    These tests verify that checkout correctly persists and finalizes
    an order.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="checkout_user",
            password="password123",
        )

        cls.author = Author.objects.create(
            name="Douglas Adams",
        )

        cls.book_digital = Book.objects.create(
            author=cls.author,
            title="Digital Book",
            slug="digital-book",
            isbn="9780000000001",
            description="Digital",
            genre="SCI_FI",
            is_digital=True,
        )

        cls.book_physical = Book.objects.create(
            author=cls.author,
            title="Physical Book",
            slug="physical-book",
            isbn="9780000000002",
            description="Physical",
            genre="SCI_FI",
            is_digital=False,
        )

        cls.book_digital.change_price(
            value=Decimal("40.00"),
            currency="USD",
        )

        cls.book_physical.change_price(
            value=Decimal("20.00"),
            currency="USD",
        )

    def setUp(self):
        self.cart, _ = Cart.objects.get_or_create(
            user=self.user,
        )

        self.shipping = {
            "shipping_name": "John Doe",
            "shipping_address_line1": "123 Test Street",
            "shipping_city": "Testville",
            "shipping_country": "USA",
        }

        self.service = CheckoutService(self.user)

    def add_item(self, book, quantity=1):
        CartItem.objects.create(
            cart=self.cart,
            book=book,
            quantity=quantity,
        )

    def test_creates_order(self):
        self.add_item(self.book_digital)

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertIsInstance(order, Order)

        self.assertEqual(order.user, self.user)

        self.assertEqual(
            order.shipping_name,
            self.shipping["shipping_name"],
        )

        self.assertEqual(
            order.shipping_city,
            self.shipping["shipping_city"],
        )

    def test_creates_order_items(self):
        self.add_item(self.book_digital, 2)
        self.add_item(self.book_physical, 1)

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(order.items.count(), 2)

        digital = order.items.get(book=self.book_digital)

        self.assertEqual(digital.quantity, 2)
        self.assertEqual(
            digital.snapshot_title,
            self.book_digital.title,
        )

        self.assertEqual(
            digital.snapshot_author_name,
            self.author.name,
        )

    def test_clears_cart(self):
        self.add_item(self.book_digital)

        self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            self.cart.items.count(),
            0,
        )

    def test_grants_license_for_digital_books(self):
        self.add_item(self.book_digital)

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        license = License.objects.get(
            user=self.user,
            book=self.book_digital,
        )

        self.assertEqual(
            license.order,
            order,
        )

        self.assertTrue(license.is_active)

        self.assertIsNone(
            license.valid_until,
        )

    def test_physical_books_receive_no_license(self):
        self.add_item(self.book_physical)

        self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertFalse(
            License.objects.filter(
                user=self.user,
                book=self.book_physical,
            ).exists()
        )

    def test_consumes_coupon(self):
        discount = Discount.objects.create(
            name="Coupon",
            description="Coupon",
            activation=Discount.Activation.COUPON,
            discount_type=Discount.DiscountType.PERCENT,
            value=Decimal("10"),
            scope=Discount.Scope.STORE,
        )

        coupon = DiscountCode.objects.create(
            discount=discount,
            code="SAVE10",
        )

        self.add_item(self.book_digital)

        self.service.checkout(
            cart=self.cart,
            shipping_data={
                **self.shipping,
                "discount_code": "SAVE10",
            },
        )

        coupon.refresh_from_db()

        self.assertEqual(
            coupon.times_used,
            1,
        )

    def test_checkout_without_coupon_does_not_consume_coupon(self):
        self.add_item(self.book_digital)

        self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            DiscountCode.objects.count(),
            0,
        )

    def test_shipping_snapshot_is_saved(self):
        self.add_item(self.book_digital)

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            order.shipping_name,
            "John Doe",
        )

        self.assertEqual(
            order.shipping_address_line1,
            "123 Test Street",
        )

        self.assertEqual(
            order.shipping_city,
            "Testville",
        )

        self.assertEqual(
            order.shipping_country,
            "USA",
        )

    def test_empty_cart_raises_validation_error(self):
        with self.assertRaises(serializers.ValidationError):
            self.service.checkout(
                cart=self.cart,
                shipping_data=self.shipping,
            )


    def test_checkout_returns_created_order(self):
        self.add_item(self.book_digital)

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertTrue(
            Order.objects.filter(
                pk=order.pk,
            ).exists()
        )


class WishlistTest(APITestCase):
    """
    Part 4: Tests for the Wishlist (Later Cart) functionality.
    Verifies creation, listing, and the unique constraint enforcement.
    """

    @classmethod
    def setUpTestData(cls):
        """Setup core user and books."""
        cls.user = User.objects.create_user(
            username="wishlist_user",
            email="wishlist@test.com",
            password="testpassword",
        )
        cls.author = Author.objects.create(name="Wishlist Author")
        cls.book_A = Book.objects.create(
            author=cls.author,
            title="Wishlist Book A",
            slug="w-book-a",
            isbn="978-0111111113",
        )
        cls.book_B = Book.objects.create(
            author=cls.author,
            title="Wishlist Book B",
            slug="w-book-b",
            isbn="978-0222222224",
        )
        cls.wishlist_url = reverse("wishlist-list")  # Maps to /api/v1/cart/wishlist/
        cls.login_url = reverse("login")

    def setUp(self):
        """Logs in the user and gets token before each test."""
        response = self.client.post(
            self.login_url,
            {"username": "wishlist_user", "password": "testpassword"},
            format="json",
        )
        self.auth_token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.auth_token}")

        # Ensure clean slate for each test (optional, but good practice)
        WishlistItem.objects.filter(user=self.user).delete()

    def test_01_create_and_list_wishlist_item(self):
        """Verifies a user can add a new item and list the contents."""

        # 1. POST (Add item A)
        response_post = self.client.post(
            self.wishlist_url, {"book_id": self.book_A.pk}, format="json"
        )
        self.assertEqual(response_post.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 1)

        # 2. GET (List items)
        response_get = self.client.get(self.wishlist_url)
        self.assertEqual(response_get.status_code, status.HTTP_200_OK)
        self.assertEqual(
            len(response_get.data["results"]),
            1,
        )

        # Verify nested data is correct (book title, author name)
        item_data = response_get.data["results"][0]
        self.assertEqual(item_data["book_id"], self.book_A.pk)
        self.assertEqual(item_data["title"], "Wishlist Book A")
        self.assertIn("added_at", item_data)

    def test_02_prevent_duplicate_creation(self):
        """Verifies the unique_together constraint prevents adding the same book twice."""

        # 1. Setup: Add item A once successfully (via the API)
        # 🔑 FIX: Ensure this step uses the API client so the view's pre-check logic runs
        self.client.post(
            self.wishlist_url,
            {"book_id": self.book_A.pk},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 1)

        # 2. POST (Attempt to add item A again)
        # This second POST is where the view's 'if exists()' check should return 400
        response_post = self.client.post(
            self.wishlist_url,
            {"book_id": self.book_A.pk},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )

        # 3. ASSERT STATUS: Check the view returned the correct status
        self.assertEqual(response_post.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already in your wishlist", str(response_post.data["detail"]))

        # 4. VERIFY COUNT: Should still only be 1 item in the database
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 1)

    def test_03_delete_wishlist_item(self):
        """Verifies a user can delete an item from their wishlist."""

        # 1. Setup: Add the item we want to delete
        wishlist_item = WishlistItem.objects.create(user=self.user, book=self.book_B)
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 1)

        # 2. DELETE (Remove by ID)
        delete_url = reverse("wishlist-detail", kwargs={"pk": wishlist_item.pk})

        response_delete = self.client.delete(
            delete_url, HTTP_AUTHORIZATION=f"Bearer {self.auth_token}"
        )
        self.assertEqual(response_delete.status_code, status.HTTP_204_NO_CONTENT)

        # 3. VERIFY COUNT: Item should be permanently gone
        self.assertEqual(WishlistItem.objects.filter(user=self.user).count(), 0)
