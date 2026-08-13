# cart/models.py
from catalog.models import Book, BookFormat
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from pricing.models import DiscountCode


class Cart(models.Model):
    """
    Represents a persistent shopping cart linked to an authenticated User.
    """

    # Links to the User model (One-to-One ensures each authenticated user has only one primary cart)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
        verbose_name=_("User"),
    )

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Shopping Cart")
        verbose_name_plural = _("Shopping Carts")

    def __str__(self):
        return f"Cart for {self.user.username}"


# 🔑 NEW MODEL: CartItem (To store contents persistently in the DB)
class CartItem(models.Model):
    """
    Represents a specific item (Book) and quantity within a persistent Cart.
    """

    # Links to the Cart model
    cart = models.ForeignKey(
        Cart, on_delete=models.CASCADE, related_name="items", verbose_name=_("Cart")
    )
    # Links to the Book being purchased
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name=_("Book"))
    book_format = models.ForeignKey(
        BookFormat,
        on_delete=models.CASCADE,
        related_name="cart_items",
        verbose_name=_("Book Format"),
    )
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)

    class Meta:
        verbose_name = _("Cart Item")
        verbose_name_plural = _("Cart Items")
        # Ensure a user doesn't add the same book twice to the same cart
        unique_together = ("cart", "book", "book_format")

    def __str__(self):
        return f"{self.quantity}x {self.book.title} ({self.book_format.format_type}) in Cart for {self.cart.user.username}"


class Order(models.Model):
    """
    Represents a final, immutable transaction record (the snapshot).
    """

    # --- Status Choices ---
    STATUS_CHOICES = [
        ("PENDING", _("Pending Payment")),
        ("PROCESSING", _("Processing Order")),
        ("SHIPPED", _("Shipped")),
        ("DELIVERED", _("Delivered")),
        ("CANCELLED", _("Cancelled")),
        ("REFUNDED", _("Refunded")),
    ]

    # --- Relationships ---
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_("User"),
        related_name="orders",
    )
    discount_code = models.ForeignKey(
        DiscountCode,
        on_delete=models.PROTECT,  # 🔑 IMPROVEMENT: Changed SET_NULL to PROTECT for history
        blank=True,
        null=True,
        verbose_name=_("Applied Discount"),
    )

    # --- Financial Snapshot ---
    subtotal = models.DecimalField(
        _("Subtotal"), max_digits=10, decimal_places=2, default=0.00
    )
    discount_amount = models.DecimalField(
        _("Discount Amount"), max_digits=10, decimal_places=2, default=0.00
    )
    total_amount = models.DecimalField(
        _("Total Amount Paid"), max_digits=10, decimal_places=2, default=0.00
    )

    # --- Address Snapshot (NEW: Crucial for auditing and shipping) ---
    shipping_name = models.CharField(_("Recipient Name"), max_length=255, blank=True)
    shipping_address_line1 = models.CharField(
        _("Address Line 1"), max_length=255, blank=True
    )
    shipping_city = models.CharField(_("City"), max_length=100, blank=True)
    shipping_country = models.CharField(_("Country"), max_length=100, blank=True)

    # --- Transaction Details ---
    status = models.CharField(
        _("Status"), max_length=15, choices=STATUS_CHOICES, default="PENDING"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} by {self.user.username}"

    def can_cancel(self):
        return self.status in {"PENDING", "PROCESSING"}

    def mark_refunded(self):
        self.status = "REFUNDED"
        self.save(update_fields=["status"])


class OrderItem(models.Model):
    """
    Represents an item within an Order. Crucial for locking in the final price and details at purchase time.
    """

    # --- Relationships ---
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name=_("Order")
    )
    book = models.ForeignKey(
        Book, on_delete=models.PROTECT, verbose_name=_("Book")
    )  # PROTECT to keep reference

    book_format = models.ForeignKey(
        BookFormat,
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name=_("Book Format"),
    )

    # --- Snapshot Details (IMMUTABLE) ---
    quantity = models.PositiveIntegerField(_("Quantity"), default=1)
    # The price *at the moment of purchase* (includes subscription discount but not global code discount)
    snapshot_price = models.DecimalField(
        _("Snapshot Price"), max_digits=10, decimal_places=2
    )
    snapshot_title = models.CharField(_("Snapshot Title"), max_length=255)
    snapshot_author_name = models.CharField(
        _("Snapshot Author"), max_length=255
    )  # 🔑 IMPROVEMENT: Snapshot Author Name

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")

    def __str__(self):
        return f"{self.quantity}x {self.snapshot_title} in Order #{self.order.pk}"


class WishlistItem(models.Model):
    """
    Represents a persistent item saved by a User for later purchase (Wishlist/Later Cart).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
        verbose_name=_("User"),
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, verbose_name=_("Book"))

    # Audit fields
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Wishlist Item")
        verbose_name_plural = _("Wishlist Items")
        # Ensure a user cannot add the same book twice to their wishlist
        unique_together = ("user", "book")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user.username}'s Wishlist: {self.book.title}"
