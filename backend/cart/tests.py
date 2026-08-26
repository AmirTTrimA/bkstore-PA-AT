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
from requests import session
from rest_framework import serializers, status
from rest_framework.test import APITestCase
from wallet.models import Wallet

from .models import CartItem, WishlistItem
from .services import CheckoutService

User = get_user_model()

# Set the session key used for anonymous cart data (needs to match settings)
CART_SESSION_KEY = getattr(settings, "CART_SESSION_KEY", "cart")


class CartCRUDTest(APITestCase):
    """
    Tests cart item CRUD behavior for both anonymous and authenticated users.

    Cart identity is now:
        (book, book_format)

    Anonymous carts store that identity in the session as:
        "<book_id>:<format_id>"
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="cart_tester",
            email="cart@test.com",
            password="testpassword",
        )

        cls.author = Author.objects.create(
            name="Test Author",
        )

        cls.book_1 = Book.objects.create(
            author=cls.author,
            title="Digital Guide",
            slug="digital-guide",
            isbn="978-0000000001",
            description="Test digital book",
            genre="SCI_FI",
            is_digital=True,
        )

        cls.book_2 = Book.objects.create(
            author=cls.author,
            title="Physical Manual",
            slug="physical-manual",
            isbn="978-0000000002",
            description="Test physical book",
            genre="SCIENCE",
            is_digital=False,
        )

        cls.book_1_format = BookFormat.objects.create(
            book=cls.book_1,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        cls.book_2_format = BookFormat.objects.create(
            book=cls.book_2,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        Price.objects.create(
            book=cls.book_1,
            book_format=cls.book_1_format,
            value=Decimal("20"),
            effective_from=timezone.now(),
        )

        Price.objects.create(
            book=cls.book_2,
            book_format=cls.book_2_format,
            value=Decimal("30"),
            effective_from=timezone.now(),
        )

        cls.cart_url = reverse("cart-items")
        cls.login_url = reverse("login")

    def setUp(self):
        """
        Authenticate before each test.
        """
        response = self.client.post(
            self.login_url,
            {
                "username": "cart_tester",
                "password": "testpassword",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.auth_token = response.data["access"]

    # ============================================================
    # Anonymous cart
    # ============================================================

    def test_anonymous_cart_add_and_view(self):
        """
        Anonymous users can add a specific book format to the
        session cart and retrieve it.
        """

        book_id = self.book_1.pk
        format_id = self.book_1_format.pk

        response_post = self.client.post(
            self.cart_url,
            {
                "book_id": book_id,
                "format_id": format_id,
                "quantity": 2,
            },
            format="json",
        )

        self.assertEqual(
            response_post.status_code,
            status.HTTP_200_OK,
        )

        # Adding the same format again should increase quantity.
        response_post = self.client.post(
            self.cart_url,
            {
                "book_id": book_id,
                "format_id": format_id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            response_post.status_code,
            status.HTTP_200_OK,
        )

        session_cart = self.client.session.get(
            CART_SESSION_KEY,
            {},
        )

        cart_key = f"{book_id}:{format_id}"

        self.assertIn(
            cart_key,
            session_cart,
        )

        self.assertEqual(
            session_cart[cart_key],
            3,
        )

        response_get = self.client.get(
            self.cart_url,
        )

        self.assertEqual(
            response_get.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response_get.data),
            1,
        )

        item = response_get.data[0]

        self.assertEqual(
            item["book_id"],
            book_id,
        )

        self.assertEqual(
            item["format_id"],
            format_id,
        )

        self.assertEqual(
            item["quantity"],
            3,
        )

        self.assertEqual(
            item["format_type"],
            "Digital",
        )

    def test_anonymous_cart_delete_item(self):
        """
        Anonymous users can remove a specific book format
        from the session cart.
        """

        book_id = self.book_1.pk
        format_id = self.book_1_format.pk

        cart_key = f"{book_id}:{format_id}"

        session = self.client.session

        session[CART_SESSION_KEY] = {
            cart_key: 5,
        }

        session.save()

        response_delete = self.client.delete(
            self.cart_url,
            {
                "book_id": book_id,
                "format_id": format_id,
            },
            format="json",
        )

        self.assertEqual(
            response_delete.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        session_cart = self.client.session.get(
            CART_SESSION_KEY,
            {},
        )

        self.assertNotIn(
            cart_key,
            session_cart,
        )

    # ============================================================
    # Authenticated cart
    # ============================================================

    def test_authenticated_cart_add_and_view(self):
        """
        Authenticated users can add a specific book format to
        their persistent cart and retrieve it.
        """

        book_id = self.book_2.pk
        format_id = self.book_2_format.pk

        auth_headers = {
            "HTTP_AUTHORIZATION": f"Bearer {self.auth_token}",
        }

        # --------------------------------------------------------
        # Add 2 copies
        # --------------------------------------------------------

        response_post = self.client.post(
            self.cart_url,
            {
                "book_id": book_id,
                "format_id": format_id,
                "quantity": 2,
            },
            format="json",
            **auth_headers,
        )

        self.assertEqual(
            response_post.status_code,
            status.HTTP_200_OK,
        )

        user_cart = get_object_or_404(
            Cart,
            user=self.user,
        )

        cart_item = get_object_or_404(
            CartItem,
            cart=user_cart,
            book=self.book_2,
            book_format=self.book_2_format,
        )

        self.assertEqual(
            cart_item.quantity,
            2,
        )

        # --------------------------------------------------------
        # Add one more copy
        # --------------------------------------------------------

        response_update = self.client.post(
            self.cart_url,
            {
                "book_id": book_id,
                "format_id": format_id,
                "quantity": 1,
            },
            format="json",
            **auth_headers,
        )

        self.assertEqual(
            response_update.status_code,
            status.HTTP_200_OK,
        )

        # Re-query instead of refresh_from_db().
        #
        # The current storage implementation may replace the
        # CartItem row rather than updating the same database row.
        cart_item = get_object_or_404(
            CartItem,
            cart=user_cart,
            book=self.book_2,
            book_format=self.book_2_format,
        )

        self.assertEqual(
            cart_item.quantity,
            3,
        )

        # --------------------------------------------------------
        # View cart
        # --------------------------------------------------------

        response_get = self.client.get(
            self.cart_url,
            **auth_headers,
        )

        self.assertEqual(
            response_get.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response_get.data),
            1,
        )

        item = response_get.data[0]

        self.assertEqual(
            item["book_id"],
            book_id,
        )

        self.assertEqual(
            item["format_id"],
            format_id,
        )

        self.assertEqual(
            item["quantity"],
            3,
        )

    def test_authenticated_cart_delete_item(self):
        """
        Authenticated users can remove a specific book format
        from their persistent cart.
        """

        user_cart = Cart.objects.create(
            user=self.user,
        )

        CartItem.objects.create(
            cart=user_cart,
            book=self.book_1,
            book_format=self.book_1_format,
            quantity=5,
        )

        self.assertEqual(
            CartItem.objects.filter(
                cart=user_cart,
            ).count(),
            1,
        )

        response_delete = self.client.delete(
            self.cart_url,
            {
                "book_id": self.book_1.pk,
                "format_id": self.book_1_format.pk,
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )

        self.assertEqual(
            response_delete.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        self.assertFalse(
            CartItem.objects.filter(
                cart=user_cart,
                book=self.book_1,
                book_format=self.book_1_format,
            ).exists()
        )

class CartMergeTest(APITestCase):
    """
    Tests merging an anonymous session cart into a user's
    persistent database cart.

    Cart item identity is:
        (book, book_format)

    Verifies that:
    - anonymous items are transferred to the database cart;
    - matching book + format quantities are stacked;
    - different formats remain distinct cart items;
    - the anonymous session is cleared after a successful merge.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user_merge = User.objects.create_user(
            username="merge_user",
            email="merge@test.com",
            password="testpassword",
        )

        cls.author = Author.objects.create(
            name="Merge Author",
        )

        cls.book_A = Book.objects.create(
            author=cls.author,
            title="Book A",
            slug="book-a",
            isbn="978-0111111111",
            description="Merge test book A",
            genre="FICTION",
        )

        cls.book_B = Book.objects.create(
            author=cls.author,
            title="Book B",
            slug="book-b",
            isbn="978-0222222222",
            description="Merge test book B",
            genre="FICTION",
        )

        cls.book_A_format = BookFormat.objects.create(
            book=cls.book_A,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        cls.book_B_format = BookFormat.objects.create(
            book=cls.book_B,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        cls.merge_url = reverse("cart-merge")
        cls.login_url = reverse("login")

    def setUp(self):
        """
        Authenticate the user and start each test with an empty
        persistent cart and anonymous session cart.
        """

        response = self.client.post(
            self.login_url,
            {
                "username": "merge_user",
                "password": "testpassword",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.auth_token = response.data["access"]

        # Clear any persistent cart items from previous test state.
        CartItem.objects.filter(
            cart__user=self.user_merge,
        ).delete()

        # Start with an empty anonymous cart.
        session = self.client.session
        session[CART_SESSION_KEY] = {}
        session.save()

    def test_merge_anonymous_into_empty_db_cart(self):
        """
        An anonymous cart containing 2x Book B in a specific format
        is transferred into an empty persistent cart.
        """

        book_id = self.book_B.pk
        format_id = self.book_B_format.pk

        # --------------------------------------------------------
        # Anonymous cart
        # --------------------------------------------------------

        session = self.client.session

        session[CART_SESSION_KEY] = {
            f"{book_id}:{format_id}": 2,
        }

        session.save()

        # --------------------------------------------------------
        # Merge
        # --------------------------------------------------------

        response = self.client.post(
            self.merge_url,
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        # --------------------------------------------------------
        # Persistent cart
        # --------------------------------------------------------

        db_cart = get_object_or_404(
            Cart,
            user=self.user_merge,
        )

        self.assertEqual(
            CartItem.objects.filter(
                cart=db_cart,
            ).count(),
            1,
        )

        cart_item = get_object_or_404(
            CartItem,
            cart=db_cart,
            book=self.book_B,
            book_format=self.book_B_format,
        )

        self.assertEqual(
            cart_item.quantity,
            2,
        )

        # --------------------------------------------------------
        # Anonymous cart must be cleared
        # --------------------------------------------------------

        self.assertEqual(
            self.client.session.get(
                CART_SESSION_KEY,
                {},
            ),
            {},
        )

    def test_merge_with_quantity_stacking(self):
        """
        If the persistent cart already contains the same
        book + format, the anonymous quantity is added to it.

        DB:
            Book A / Physical = 2

        Session:
            Book A / Physical = 3
            Book B / Physical = 1

        Expected:
            Book A / Physical = 5
            Book B / Physical = 1
        """

        # --------------------------------------------------------
        # Persistent cart
        # --------------------------------------------------------

        db_cart = Cart.objects.create(
            user=self.user_merge,
        )

        CartItem.objects.create(
            cart=db_cart,
            book=self.book_A,
            book_format=self.book_A_format,
            quantity=2,
        )

        # --------------------------------------------------------
        # Anonymous cart
        # --------------------------------------------------------

        session = self.client.session

        session[CART_SESSION_KEY] = {
            f"{self.book_A.pk}:{self.book_A_format.pk}": 3,
            f"{self.book_B.pk}:{self.book_B_format.pk}": 1,
        }

        session.save()

        # --------------------------------------------------------
        # Merge
        # --------------------------------------------------------

        response = self.client.post(
            self.merge_url,
            HTTP_AUTHORIZATION=f"Bearer {self.auth_token}",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        # --------------------------------------------------------
        # Book A: matching book + format must stack
        # --------------------------------------------------------

        book_a_item = get_object_or_404(
            CartItem,
            cart=db_cart,
            book=self.book_A,
            book_format=self.book_A_format,
        )

        self.assertEqual(
            book_a_item.quantity,
            5,
        )

        # --------------------------------------------------------
        # Book B: new book + format must be created
        # --------------------------------------------------------

        book_b_item = get_object_or_404(
            CartItem,
            cart=db_cart,
            book=self.book_B,
            book_format=self.book_B_format,
        )

        self.assertEqual(
            book_b_item.quantity,
            1,
        )

        # Two distinct cart items should now exist.
        self.assertEqual(
            CartItem.objects.filter(
                cart=db_cart,
            ).count(),
            2,
        )

        # --------------------------------------------------------
        # Session must be cleared
        # --------------------------------------------------------

        self.assertEqual(
            self.client.session.get(
                CART_SESSION_KEY,
                {},
            ),
            {},
        )


class CheckoutServiceTestCase(TestCase):
    """
    Tests the CheckoutService orchestration.

    Pricing rules themselves are covered by PricingEngine tests.
    These tests verify that checkout correctly persists and finalizes
    an order while preserving the selected book format.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="checkout_user",
            password="password123",
        )

        wallet = cls.user.wallet
        wallet.balance = Decimal("1000")
        wallet.save(update_fields=["balance"])

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

        cls.digital_format = BookFormat.objects.create(
            book=cls.book_digital,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        cls.physical_format = BookFormat.objects.create(
            book=cls.book_physical,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        Price.objects.create(
            book=cls.book_digital,
            book_format=cls.digital_format,
            value=Decimal("40"),
            effective_from=timezone.now(),
        )

        Price.objects.create(
            book=cls.book_physical,
            book_format=cls.physical_format,
            value=Decimal("20"),
            effective_from=timezone.now(),
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

    def add_item(self, book, quantity=1, book_format=None):
        """
        Adds a specific book format to the test cart.
        """

        if book_format is None:
            if book == self.book_digital:
                book_format = self.digital_format
            elif book == self.book_physical:
                book_format = self.physical_format
            else:
                raise ValueError(
                    f"No default format configured for {book!r}."
                )

        return CartItem.objects.create(
            cart=self.cart,
            book=book,
            book_format=book_format,
            quantity=quantity,
        )

    # ============================================================
    # Checkout
    # ============================================================

    def test_creates_order(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertIsInstance(
            order,
            Order,
        )

        self.assertEqual(
            order.user,
            self.user,
        )

        self.assertEqual(
            order.shipping_name,
            self.shipping["shipping_name"],
        )

        self.assertEqual(
            order.shipping_city,
            self.shipping["shipping_city"],
        )

    def test_creates_order_items(self):
        self.add_item(
            self.book_digital,
            quantity=2,
            book_format=self.digital_format,
        )

        self.add_item(
            self.book_physical,
            quantity=1,
            book_format=self.physical_format,
        )

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            order.items.count(),
            2,
        )

        digital = order.items.get(
            book=self.book_digital,
        )

        self.assertEqual(
            digital.quantity,
            2,
        )

        self.assertEqual(
            digital.snapshot_title,
            self.book_digital.title,
        )

        self.assertEqual(
            digital.snapshot_author_name,
            self.author.name,
        )

    def test_checkout_preserves_format_specific_price(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        order_item = order.items.get(
            book=self.book_digital,
        )

        self.assertEqual(
            order_item.book_format,
            self.digital_format,
        )

        self.assertEqual(
            order_item.snapshot_price,
            Decimal("40"),
        )

    def test_clears_cart(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            self.cart.items.count(),
            0,
        )

    # ============================================================
    # Licensing
    # ============================================================

    def test_grants_license_for_digital_books(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        license_obj = License.objects.get(
            user=self.user,
            book=self.book_digital,
        )

        self.assertEqual(
            license_obj.order,
            order,
        )

        self.assertTrue(
            license_obj.is_active,
        )

        self.assertIsNone(
            license_obj.valid_until,
        )

    def test_physical_books_receive_no_license(self):
        self.add_item(
            self.book_physical,
            book_format=self.physical_format,
        )

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

    # ============================================================
    # Coupons
    # ============================================================

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

        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

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
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertEqual(
            DiscountCode.objects.count(),
            0,
        )

    # ============================================================
    # Shipping
    # ============================================================

    def test_shipping_snapshot_is_saved(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

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

    # ============================================================
    # Validation
    # ============================================================

    def test_empty_cart_raises_validation_error(self):
        with self.assertRaises(serializers.ValidationError):
            self.service.checkout(
                cart=self.cart,
                shipping_data=self.shipping,
            )

    def test_checkout_returns_created_order(self):
        self.add_item(
            self.book_digital,
            book_format=self.digital_format,
        )

        order = self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

        self.assertTrue(
            Order.objects.filter(
                pk=order.pk,
            ).exists()
        )

    # ============================================================
    # Cancellation / Refund
    # ============================================================

    def _create_paid_order(self):
        """
        Creates a paid order through the normal checkout flow.
        """

        wallet = Wallet.objects.get(
            user=self.user,
        )

        wallet.balance = Decimal("200")
        wallet.save(
            update_fields=["balance"],
        )

        self.cart.items.all().delete()

        self.cart.items.create(
            book=self.book_digital,
            book_format=self.digital_format,
            quantity=1,
        )

        return self.service.checkout(
            cart=self.cart,
            shipping_data=self.shipping,
        )

    def test_cancel_order_refunds_wallet_and_revokes_license(self):
        order = self._create_paid_order()

        wallet = Wallet.objects.get(
            user=self.user,
        )

        self.assertEqual(
            wallet.balance,
            Decimal("160"),
        )

        license_obj = License.objects.get(
            user=self.user,
            book=self.book_digital,
        )

        self.assertTrue(
            license_obj.is_active,
        )

        self.service.cancel_order(order)

        order.refresh_from_db()
        wallet.refresh_from_db()
        license_obj.refresh_from_db()

        self.assertEqual(
            order.status,
            "REFUNDED",
        )

        self.assertEqual(
            wallet.balance,
            Decimal("200"),
        )

        self.assertFalse(
            license_obj.is_active,
        )

    def test_cancel_order_rejects_non_cancellable_status(self):
        order = self._create_paid_order()

        order.status = "DELIVERED"
        order.save(
            update_fields=["status"],
        )

        with self.assertRaisesMessage(
            serializers.ValidationError,
            "This order cannot be cancelled.",
        ):
            self.service.cancel_order(order)

    def test_cancel_order_rejects_other_users_order(self):
        order = self._create_paid_order()

        other_user = User.objects.create_user(
            username="intruder",
            password="password123",
        )

        other_service = CheckoutService(
            other_user,
        )

        with self.assertRaisesMessage(
            serializers.ValidationError,
            "You cannot cancel this order.",
        ):
            other_service.cancel_order(order)

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

class OrderApiTest(APITestCase):
    """
    Tests the authenticated customer Order API.
    """

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="customer",
            email="customer@test.com",
            password="password123",
        )

        cls.other_user = User.objects.create_user(
            username="other",
            email="other@test.com",
            password="password123",
        )

        cls.author = Author.objects.create(
            name="Douglas Adams",
        )

        cls.book = Book.objects.create(
            author=cls.author,
            title="The Hitchhiker's Guide",
            slug="hitchhiker",
            isbn="9780345391803",
            description="Don't Panic.",
            genre="SCI_FI",
            is_digital=True,
        )

        cls.book_format = BookFormat.objects.create(
            book=cls.book,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        cls.order = Order.objects.create(
            user=cls.user,
            subtotal=Decimal("100"),
            discount_amount=Decimal("20"),
            total_amount=Decimal("80"),
            status="PROCESSING",
            shipping_name="Arthur Dent",
            shipping_address_line1="42 Galaxy Way",
            shipping_city="London",
            shipping_country="UK",
        )

        OrderItem.objects.create(
            order=cls.order,
            book=cls.book,
            book_format=cls.book_format,
            quantity=2,
            snapshot_price=Decimal("40"),
            snapshot_title=cls.book.title,
            snapshot_author_name=cls.author.name,
        )

        cls.other_order = Order.objects.create(
            user=cls.other_user,
            subtotal=Decimal("50"),
            discount_amount=Decimal("0"),
            total_amount=Decimal("50"),
            status="PROCESSING",
        )

        cls.list_url = reverse("orders-list")

    def setUp(self):
        login = self.client.post(
            reverse("login"),
            {
                "username": "customer",
                "password": "password123",
            },
            format="json",
        )

        self.cart, _ = Cart.objects.get_or_create(
            user=self.user,
        )

        self.book.change_price(
            value=Decimal("40"),
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['access']}"
        )

    def test_list_returns_only_user_orders(self):
        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

        self.assertEqual(
            response.data["results"][0]["id"],
            self.order.id,
        )

    def test_retrieve_returns_order_detail(self):
        response = self.client.get(
            reverse(
                "orders-detail",
                args=[self.order.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            self.order.id,
        )

    def test_order_detail_contains_items(self):
        response = self.client.get(
            reverse(
                "orders-detail",
                args=[self.order.id],
            )
        )

        self.assertEqual(
            len(response.data["items"]),
            1,
        )

        item = response.data["items"][0]

        self.assertEqual(
            item["book_title"],
            self.book.title,
        )

        self.assertEqual(
            item["book_format"],
            self.book_format.id,
        )

    def test_user_cannot_access_other_users_order(self):
        response = self.client.get(
            reverse(
                "orders-detail",
                args=[self.other_order.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_anonymous_user_cannot_list_orders(self):
        self.client.credentials()

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_anonymous_user_cannot_retrieve_order(self):
        self.client.credentials()

        response = self.client.get(
            reverse(
                "orders-detail",
                args=[self.order.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_orders_are_returned_newest_first(self):
        newer_order = Order.objects.create(
            user=self.user,
            subtotal=Decimal("10"),
            discount_amount=Decimal("0"),
            total_amount=Decimal("10"),
            status="PROCESSING",
        )

        response = self.client.get(self.list_url)

        self.assertEqual(
            response.data["results"][0]["id"],
            newer_order.id,
        )

        self.assertEqual(
            response.data["results"][1]["id"],
            self.order.id,
        )

    def test_user_can_cancel_own_order_via_api(self):
        wallet = Wallet.objects.get(user=self.user)

        wallet.balance = Decimal("200")
        wallet.save(update_fields=["balance"])

        self.cart.items.create(
            book=self.book,
            book_format=self.book_format,
            quantity=1,
        )

        checkout_response = self.client.post(
            "/api/v1/cart/checkout/",
            {
                "shipping_name": "John Doe",
                "shipping_address_line1": "123 Test Street",
                "shipping_city": "Testville",
                "shipping_country": "USA",
            },
            format="json",
        )

        self.assertEqual(
            checkout_response.status_code,
            status.HTTP_201_CREATED,
        )

        order_id = checkout_response.data["id"]

        response = self.client.post(
            f"/api/v1/cart/orders/{order_id}/cancel/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["status"],
            "REFUNDED",
        )

        wallet.refresh_from_db()

        self.assertEqual(
            wallet.balance,
            Decimal("200"),
        )

    def test_user_cannot_cancel_other_users_order_via_api(self):
        other_user = User.objects.create_user(
            username="other_customer",
            password="testpass123",
        )

        other_wallet = Wallet.objects.get(
            user=other_user,
        )

        other_wallet.balance = Decimal("200")
        other_wallet.save(update_fields=["balance"])

        other_cart, _ = Cart.objects.get_or_create(
            user=other_user,
        )

        other_cart.items.create(
            book=self.book,
            book_format=self.book_format,
            quantity=1,
        )

        order = CheckoutService(other_user).checkout(
            cart=other_cart,
            shipping_data={
                "shipping_name": "Other User",
                "shipping_address_line1": "456 Other Street",
                "shipping_city": "Elsewhere",
                "shipping_country": "USA",
            },
        )

        response = self.client.post(
            f"/api/v1/cart/orders/{order.id}/cancel/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

from decimal import Decimal

from cart.models import Cart, CartItem, Order
from catalog.models import Author, Book
from django.contrib.auth import get_user_model
from pricing.models import Price
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class CheckoutWalletIntegrationTest(APITestCase):
    """Tests wallet charging through the checkout API."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="checkoutuser",
            password="testpass123",
        )

        wallet = self.user.wallet
        wallet.balance = Decimal("100")
        wallet.save(update_fields=["balance"])

        self.author = Author.objects.create(
            name="Test Author",
        )

        self.book = Book.objects.create(
            author=self.author,
            title="Checkout Book",
            slug="checkout-book",
            isbn="1234567890123",
            description="Test checkout book",
            genre="TECH",
            is_digital=True,
            digital_file_path="books/checkout.epub",
        )

        self.book_format = BookFormat.objects.create(
            book=self.book,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        Price.objects.create(
            book=self.book,
            book_format=self.book_format,
            value=Decimal("25"),
        )

        self.cart = Cart.objects.create(
            user=self.user,
        )

        CartItem.objects.create(
            cart=self.cart,
            book=self.book,
            book_format=self.book_format,
            quantity=1,
        )

        self.checkout_url = "/api/v1/cart/checkout/"

        self.shipping_data = {
            "shipping_name": "John Doe",
            "shipping_address_line1": "123 Main St",
            "shipping_city": "Amsterdam",
            "shipping_country": "Netherlands",
        }

        self.client.force_authenticate(
            user=self.user,
        )

    def test_checkout_deducts_wallet_balance(self):
        response = self.client.post(
            self.checkout_url,
            self.shipping_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.user.wallet.refresh_from_db()

        self.assertEqual(
            self.user.wallet.balance,
            Decimal("75"),
        )

        order = Order.objects.get()

        self.assertEqual(
            order.status,
            "PROCESSING",
        )

        self.assertEqual(
            order.total_amount,
            Decimal("25"),
        )

    def test_checkout_fails_when_wallet_balance_is_insufficient(self):
        wallet = self.user.wallet
        wallet.balance = Decimal("5")
        wallet.save(update_fields=["balance"])

        response = self.client.post(
            self.checkout_url,
            self.shipping_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertIn(
            "wallet",
            response.data,
        )

        self.assertEqual(
            Order.objects.count(),
            0,
        )

        wallet.refresh_from_db()

        self.assertEqual(
            wallet.balance,
            Decimal("5"),
        )

from decimal import Decimal

from catalog.models import Author, Book, BookFormat
from django.contrib.auth import get_user_model
from pricing.models import Price
from rest_framework.test import APITestCase

from .models import Cart, CartItem

User = get_user_model()


class CartFormatTest(APITestCase):
    """Tests cart behavior when books have multiple purchasable formats."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="cart-test-user",
            password="testpass123",
        )

        self.author = Author.objects.create(
            name="Cart Test Author",
        )

        self.book = Book.objects.create(
            author=self.author,
            title="Cart Test Book",
            slug="cart-test-book",
            isbn="9781234567890",
            description="Test book",
            genre="SCI_FI",
        )

        self.physical = BookFormat.objects.create(
            book=self.book,
            format_type=BookFormat.FormatType.PHYSICAL,
        )

        self.digital = BookFormat.objects.create(
            book=self.book,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        Price.objects.create(
            book=self.book,
            book_format=self.physical,
            value=Decimal("30"),
        )

        Price.objects.create(
            book=self.book,
            book_format=self.digital,
            value=Decimal("20"),
        )

        self.cart_url = "/api/v1/cart/items/"

        self.client.force_authenticate(
            user=self.user,
        )

    def test_add_format_to_cart(self):
        response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.digital.id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        item = CartItem.objects.get(
            cart__user=self.user,
        )

        self.assertEqual(
            item.book,
            self.book,
        )

        self.assertEqual(
            item.book_format,
            self.digital,
        )

        self.assertEqual(
            item.quantity,
            1,
        )

    def test_same_book_can_have_multiple_formats(self):
        physical_response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.physical.id,
                "quantity": 1,
            },
            format="json",
        )

        digital_response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.digital.id,
                "quantity": 2,
            },
            format="json",
        )

        self.assertEqual(
            physical_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            digital_response.status_code,
            status.HTTP_200_OK,
        )

        cart = Cart.objects.get(
            user=self.user,
        )

        items = CartItem.objects.filter(
            cart=cart,
        )

        self.assertEqual(
            items.count(),
            2,
        )

        physical_item = items.get(
            book_format=self.physical,
        )

        digital_item = items.get(
            book_format=self.digital,
        )

        self.assertEqual(
            physical_item.quantity,
            1,
        )

        self.assertEqual(
            digital_item.quantity,
            2,
        )

    def test_cart_uses_format_specific_price(self):
        response_post = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.digital.id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            response_post.status_code,
            status.HTTP_200_OK,
        )

        response = self.client.get(
            self.cart_url,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        item = response.data[0]

        self.assertEqual(
            item["format_id"],
            self.digital.id,
        )

        self.assertEqual(
            item["format_type"],
            "Digital",
        )

        self.assertEqual(
            item["subtotal"],
            Decimal("20"),
        )

    def test_cannot_add_format_from_another_book(self):
        other_book = Book.objects.create(
            author=self.author,
            title="Other Book",
            slug="other-book",
            isbn="9781234567891",
            description="Other test book",
            genre="SCI_FI",
        )

        other_format = BookFormat.objects.create(
            book=other_book,
            format_type=BookFormat.FormatType.DIGITAL,
        )

        response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": other_format.id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            CartItem.objects.filter(
                cart__user=self.user,
            ).count(),
            0,
        )

    def test_delete_only_selected_format(self):
        physical_response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.physical.id,
                "quantity": 1,
            },
            format="json",
        )

        digital_response = self.client.post(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.digital.id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            physical_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            digital_response.status_code,
            status.HTTP_200_OK,
        )

        response = self.client.delete(
            self.cart_url,
            {
                "book_id": self.book.id,
                "format_id": self.digital.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
        )

        cart = Cart.objects.get(
            user=self.user,
        )

        self.assertTrue(
            CartItem.objects.filter(
                cart=cart,
                book_format=self.physical,
            ).exists()
        )

        self.assertFalse(
            CartItem.objects.filter(
                cart=cart,
                book_format=self.digital,
            ).exists()
        )