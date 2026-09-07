import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import BasketService from "../../Services/BasketService";
import AddressService from "../../Services/AddressService";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import Notification from "../../Components/feature/Notification";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Basket.css";

// ============================================
//    Main Basket Component
// ============================================

export default function Basket() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const notificationRef = useRef();

  // ==============================
  // State
  // ==============================
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

  // ==============================
  // Load Basket
  // ==============================
  const loadBasket = useCallback(async () => {
    try {
      const response = await BasketService.getBasket();
      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed loading basket:", err);
      setError("Failed to load your basket. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBasket();
  }, [loadBasket]);

  // ==============================
  // Address Check (Real check)
  // ==============================
  useEffect(() => {
    if (isLoggedIn) {
      AddressService.getAddresses()
        .then((res) => {
          const addrs = res.data?.results || res.data || [];
          setHasSavedAddress(Array.isArray(addrs) && addrs.length > 0);
        })
        .catch(() => setHasSavedAddress(false));
    } else {
      setHasSavedAddress(false);
    }
  }, [isLoggedIn]);

  // ==============================
  // Helpers & Calculations
  // ==============================
  const isEmpty = cartItems.length === 0;

  const hasPhysicalBook = cartItems.some(
    (item) =>
      (item.format_type || "").toUpperCase() === "PHYSICAL" ||
      item.format_type?.toLowerCase().includes("physical")
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const originalSubtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number((item.original_price ?? item.unit_price) || 0) * (item.quantity || 1),
    0
  );

  const discountSavings = Math.max(0, originalSubtotal - subtotal);

  // Helper to detect percentage discounts
  const isPercentDiscount = (coupon) => {
    if (!coupon) return false;
    if (coupon.is_percentage === true) return true;
    const t = String(coupon.discount_type || "").toUpperCase();
    return t === "PERCENT" || t === "PERCENTAGE" || t === "PERCENT_DISCOUNT";
  };

  // Promo discount calculation
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (isPercentDiscount(appliedCoupon)) {
      couponDiscountAmount = Math.round(
        (subtotal * Number(appliedCoupon.value || 0)) / 100
      );
    } else {
      couponDiscountAmount = Math.min(
        subtotal,
        Number(appliedCoupon.value || 0)
      );
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscountAmount);

  // ==============================
  // Remove Item
  // ==============================
  const removeItems = async (item) => {
    try {
      await BasketService.removeItem({
        book_id: item.book_id,
        format_id: item.format_id,
      });

      const response = await BasketService.getBasket();
      setCartItems(Array.isArray(response.data) ? response.data : []);
      notificationRef.current?.showNotif("Item removed from basket", "info");
    } catch (err) {
      console.error("Failed removing item:", err);
      notificationRef.current?.showNotif("Failed to remove item", "error");
    }
  };

  // ==============================
  // Quantity Controls (Explicit PUT/Set)
  // ==============================
  const handleQuantityChange = async (item, newQuantity) => {
    const parsed = parseInt(newQuantity, 10);
    if (isNaN(parsed) || parsed < 1) {
      return;
    }
    if (parsed === item.quantity) {
      return;
    }

    try {
      await BasketService.setQuantity({
        book_id: item.book_id,
        format_id: item.format_id,
        quantity: parsed,
      });

      const response = await BasketService.getBasket();
      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed updating quantity:", err);
      notificationRef.current?.showNotif(
        "Could not update item quantity",
        "error"
      );
    }
  };

  // ==============================
  // Promo Code Validation
  // ==============================
  const handleApplyPromo = async (e) => {
    if (e) e.preventDefault();
    const code = promoCodeInput.trim();
    if (!code) return;

    setValidatingPromo(true);
    setPromoError("");

    try {
      const res = await BasketService.validateDiscount(code);
      if (res.data?.is_valid) {
        setAppliedCoupon(res.data);
        notificationRef.current?.showNotif(
          `Promo code "${res.data.code}" applied!`,
          "success"
        );
      } else {
        setPromoError("Invalid or expired promo code.");
        notificationRef.current?.showNotif(
          "Invalid or expired promo code.",
          "error"
        );
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid promo code.";
      setPromoError(msg);
      notificationRef.current?.showNotif(msg, "error");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setPromoCodeInput("");
    setPromoError("");
    notificationRef.current?.showNotif("Promo code removed", "info");
  };

  // ==============================
  // Checkout
  // ==============================
  const handleCheckout = () => {
    if (!isLoggedIn) {
      notificationRef.current?.showNotif(
        "Please log in to proceed to checkout",
        "error",
        {
          linkText: "Login",
          linkHref: "/login",
        }
      );
      return;
    }

    navigate("/checkout", {
      state: {
        cartItems,
        subtotal,
        total: finalTotal,
        appliedCoupon,
        discountCode: appliedCoupon?.code || "",
        couponDiscountAmount,
        hassavedaddress: hasSavedAddress,
        startAtStep: hasPhysicalBook ? 1 : 2,
      },
    });
  };

  return (
    <div className="basket-page-root">
      {/* Desktop Navigation */}
      <div className="full-basket-nav">
        <Navbar />
      </div>

      {/* Mobile Navigation */}
      <div className="basket-nav">
        <SimpleNav />
      </div>

      <Notification ref={notificationRef} />

      <div className="basket-container">
        {/* Top Bar with Continue Shopping Button & Breadcrumbs */}
        <div className="basket-top-bar">
          <button
            type="button"
            className="basket-continue-btn"
            onClick={() => navigate("/library")}
            title="Browse more books"
          >
            ← Continue Shopping
          </button>

          <div className="basket-breadcrumbs">
            <Link to="/home">Home</Link>
            <span>/</span>
            <span className="current">Shopping Basket</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="basket-state-box">
            <div className="basket-spinner" />
            <p>Loading your shopping basket...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="basket-state-box basket-error">
            <p>{error}</p>
            <button
              type="button"
              className="basket-retry-btn"
              onClick={loadBasket}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && isEmpty && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-solid fa-cart-arrow-down"></i>
            </div>
            <h3>Your basket is empty</h3>
            <p>Explore our vast collection and find books you love!</p>
            <button
              type="button"
              className="shop-button"
              onClick={() => navigate("/library")}
            >
              Explore Catalog
            </button>
          </div>
        )}

        {/* Cart Contents */}
        {!loading && !error && !isEmpty && (
          <div className="cart-list">
            <div className="cart-header-row">
              <h2>Shopping Basket</h2>
              <span className="cart-items-count">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="cart-items">
              {cartItems.map((item) => (
                <div
                  key={`${item.book_id}-${item.format_id}`}
                  className="cart-item"
                >
                  {/* Book Cover Thumbnail */}
                  <div className="item-cover-thumb">
                    <img
                      src={item.cover_image_url || "/default-book.png"}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-book.png";
                      }}
                    />
                  </div>

                  {/* Book Information */}
                  <div className="item-info">
                    <span className="item-format-pill">
                      {item.format_type || "Book"}
                    </span>

                    <h4 className="item-title">
                      <Link to={`/book/${item.book_id}`}>{item.title}</Link>
                    </h4>

                    <div className="basket-item-price-block">
                      {item.has_discount && item.discount_percent > 0 ? (
                        <>
                          <div className="basket-item-price-row">
                            <span className="basket-original-unit">
                              {formatPrice(item.original_price)}
                            </span>
                            <span className="basket-discount-badge">
                              -{item.discount_percent}%
                            </span>
                          </div>
                          <p className="item-price">
                            {formatPrice(item.subtotal)}
                          </p>
                        </>
                      ) : (
                        <p className="item-price">
                          {formatPrice(item.subtotal)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Item Actions: Quantity Controls & Remove */}
                  <div className="container-item-actions">
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(item, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          −
                        </button>

                        <input
                          type="number"
                          min="1"
                          max="99"
                          className="qty-input"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              handleQuantityChange(item, val);
                            }
                          }}
                          title="Type quantity directly"
                        />

                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(item, item.quantity + 1)
                          }
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItems(item)}
                        className="remove-btn"
                        title="Remove from cart"
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher / Promo Code Section */}
            <div className="promo-code-card">
              <div className="promo-header">
                <i className="fa-solid fa-ticket"></i>
                <h4>Have a Promo Code or Voucher?</h4>
              </div>

              {appliedCoupon ? (
                <div className="promo-applied-box">
                  <div className="promo-applied-info">
                    <span className="promo-tag-badge">
                      {appliedCoupon.code}
                    </span>
                    <span className="promo-name-text">
                      {appliedCoupon.name} (
                      {appliedCoupon.discount_type === "PERCENTAGE"
                        ? `${appliedCoupon.value}% OFF`
                        : `${formatPrice(appliedCoupon.value)} OFF`}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    className="promo-remove-btn"
                    onClick={handleRemovePromo}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="promo-input-group">
                  <input
                    type="text"
                    placeholder="Enter discount code (e.g. WELCOME20)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="promo-input"
                  />
                  <button
                    type="submit"
                    className="promo-apply-btn"
                    disabled={validatingPromo || !promoCodeInput.trim()}
                  >
                    {validatingPromo ? "Checking..." : "Apply Code"}
                  </button>
                </form>
              )}

              {promoError && (
                <p className="promo-error-msg">{promoError}</p>
              )}
            </div>

            {/* Price Summary Breakdown */}
            <div className="discount-section">
              {discountSavings > 0 && (
                <>
                  <div className="discount-summary-row muted">
                    <span>Original Catalog Subtotal:</span>
                    <span className="strikethrough">
                      {formatPrice(originalSubtotal)}
                    </span>
                  </div>

                  <div className="discount-summary-row savings">
                    <span>Catalog Savings:</span>
                    <span>-{formatPrice(discountSavings)}</span>
                  </div>
                </>
              )}

              <div className="discount-summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && couponDiscountAmount > 0 && (
                <div className="discount-summary-row promo-savings">
                  <span>
                    Voucher Discount ({appliedCoupon.code}
                    {isPercentDiscount(appliedCoupon) ? ` - ${appliedCoupon.value}%` : ""}):
                  </span>
                  <span>-{formatPrice(couponDiscountAmount)}</span>
                </div>
              )}
            </div>

            {/* Total & Checkout Bar */}
            <div className="cart-footer">
              <div className="total">
                <span className="total-label">Final Total:</span>
                <span className="total-amount">
                  {formatPrice(finalTotal)}
                </span>
              </div>

              <button
                type="button"
                className="checkout-btn"
                onClick={handleCheckout}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="BottomNav">
        <nav className="bottom-navbar">
          <Link to="/" className="nav-item">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/favorites" className="nav-item">
            <i className="fa-solid fa-heart"></i>
            <span>Favorites</span>
          </Link>
          <Link to="/library" className="nav-item">
            <i className="fa-solid fa-book"></i>
            <span>Catalog</span>
          </Link>
          <Link to="/subscription" className="nav-item">
            <i className="fa-solid fa-bolt"></i>
            <span>Plans</span>
          </Link>
          <Link to="/basket" className="nav-item active">
            <i className="fa-solid fa-cart-shopping"></i>
            <span>Cart</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}