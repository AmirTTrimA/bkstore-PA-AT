import { useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";
import {
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useValidateDiscount,
  useAddresses,
} from "../../Hooks/queries";
import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
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
  const { t } = useLanguage();
  const notificationRef = useRef();

  // ==============================
  // Queries via React Query
  // ==============================
  const { data: cartData, isLoading: loading, error: cartError, refetch: loadBasket } = useCart();
  const cartItems = useMemo(() => {
    return Array.isArray(cartData) ? cartData : (cartData?.items || []);
  }, [cartData]);

  const { data: addressesData } = useAddresses({ enabled: Boolean(isLoggedIn) });
  const hasSavedAddress = useMemo(() => {
    return Boolean(Array.isArray(addressesData) && addressesData.length > 0);
  }, [addressesData]);

  const error = cartError ? "Failed to load your basket. Please try again." : "";

  // Mutations
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveFromCart();
  const validateDiscountMutation = useValidateDiscount();

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");

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
      await removeItemMutation.mutateAsync({
        book_id: item.book_id,
        format_id: item.format_id,
      });
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
      await updateQuantityMutation.mutateAsync({
        book_id: item.book_id,
        format_id: item.format_id,
        quantity: parsed,
      });
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
      const res = await validateDiscountMutation.mutateAsync(code);
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
      <Navbar />

      <Notification ref={notificationRef} />

      <div className="basket-container">
        {/* Top Bar with Continue Shopping Button & Breadcrumbs */}
        <div className="basket-top-bar">
          <button
            type="button"
            className="basket-continue-btn"
            onClick={() => navigate("/library")}
            title={t("cart.browseStore", "Browse more books")}
          >
            ← {t("cart.browseStore", "Continue Shopping")}
          </button>

          <div className="basket-breadcrumbs">
            <Link to="/home">{t("nav.home", "Home")}</Link>
            <span>/</span>
            <span className="current">{t("cart.title", "Shopping Basket")}</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="basket-state-box">
            <div className="basket-spinner" />
            <p>{t("common.loading", "Loading your shopping basket...")}</p>
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
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && isEmpty && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-solid fa-cart-arrow-down"></i>
            </div>
            <h3>{t("cart.emptyCart", "Your basket is empty")}</h3>
            <p>{t("cart.emptySubtitle", "Explore our vast collection and find books you love!")}</p>
            <button
              type="button"
              className="shop-button"
              onClick={() => navigate("/library")}
            >
              {t("cart.browseStore", "Explore Catalog")}
            </button>
          </div>
        )}

        {/* Cart Contents */}
        {!loading && !error && !isEmpty && (
          <div className="cart-list">
            <div className="cart-header-row">
              <h2>{t("cart.title", "Shopping Basket")}</h2>
              <span className="cart-items-count">
                {cartItems.length} {cartItems.length === 1 ? t("cart.item", "item") : t("cart.item", "items")}
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
                        title={t("cart.remove", "Remove from cart")}
                      >
                        <i className="fas fa-trash-alt"></i>
                        <span>{t("cart.remove", "Remove")}</span>
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
                <h4>{t("cart.promoCode", "Have a Promo Code or Voucher?")}</h4>
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
                    {t("cart.remove", "Remove")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="promo-input-group">
                  <input
                    type="text"
                    placeholder={t("cart.promoPlaceholder", "Enter discount coupon...")}
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="promo-input"
                  />
                  <button
                    type="submit"
                    className="promo-apply-btn"
                    disabled={validatingPromo || !promoCodeInput.trim()}
                  >
                    {validatingPromo ? t("common.loading", "Checking...") : t("cart.applyCode", "Apply Code")}
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
                    <span>{t("cart.subtotal", "Catalog Subtotal")}:</span>
                    <span className="strikethrough">
                      {formatPrice(originalSubtotal)}
                    </span>
                  </div>

                  <div className="discount-summary-row savings">
                    <span>{t("cart.discount", "Catalog Savings")}:</span>
                    <span>-{formatPrice(discountSavings)}</span>
                  </div>
                </>
              )}

              <div className="discount-summary-row">
                <span>{t("cart.subtotal", "Subtotal")}:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && couponDiscountAmount > 0 && (
                <div className="discount-summary-row promo-savings">
                  <span>
                    {t("cart.discount", "Voucher Discount")} ({appliedCoupon.code}
                    {isPercentDiscount(appliedCoupon) ? ` - ${appliedCoupon.value}%` : ""}):
                  </span>
                  <span>-{formatPrice(couponDiscountAmount)}</span>
                </div>
              )}
            </div>

            {/* Total & Checkout Bar */}
            <div className="cart-footer">
              <div className="total">
                <span className="total-label">{t("cart.total", "Final Total")}:</span>
                <span className="total-amount">
                  {formatPrice(finalTotal)}
                </span>
              </div>

              <button
                type="button"
                className="checkout-btn"
                onClick={handleCheckout}
              >
                {t("cart.checkout", "Proceed to Checkout")} →
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}