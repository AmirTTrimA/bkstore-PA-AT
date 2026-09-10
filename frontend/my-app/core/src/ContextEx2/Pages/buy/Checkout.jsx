import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import Notification from "../../Components/feature/Notification";
import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";
import BasketService from "../../Services/BasketService";
import AddressService from "../../Services/AddressService";
import WalletService from "../../Services/WalletService";
import { formatPrice } from "../../utils/formatPrice";
import {
    IRAN_PROVINCES,
    IRAN_CITIES_BY_PROVINCE,
} from "../../utils/iranLocations";

import "../../Styles/components/Checkout.css";

// Helper to reliably detect percentage discounts across all formats
export const isPercentDiscount = (coupon) => {
    if (!coupon) return false;
    if (coupon.is_percentage === true) return true;
    const type = String(coupon.discount_type || "").toUpperCase();
    return (
        type === "PERCENT" ||
        type === "PERCENTAGE" ||
        type === "PERCENT_DISCOUNT"
    );
};

// ============================================
// Main Checkout Component
// ============================================

export default function Checkout() {
    const { isLoggedIn } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const notificationRef = useRef(null);

    const incomingState = location.state || {};

    // Check if initial items have physical books
    const hasInitialPhysical = (incomingState.cartItems || []).some(
        (item) => (item.format_type || "").toUpperCase() === "PHYSICAL"
    );

    // ============================================
    // State
    // ============================================

    // When physical books are present, always start at Step 1 (Shipping Details)
    const [step, setStep] = useState(
        incomingState.startAtStep === 2 && !hasInitialPhysical ? 2 : 1
    );
    const [cartItems, setCartItems] = useState(incomingState.cartItems || []);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(true);

    const [shippingInfo, setShippingInfo] = useState({
        title: "Home",
        name: "",
        phone: "",
        country: "Iran",
        province: "",
        city: "",
        address: "",
        postal_code: "",
    });

    const [wallet, setWallet] = useState(null);

    // Voucher / Promo Code State
    const [discountCode, setDiscountCode] = useState(
        incomingState.discountCode || ""
    );
    const [appliedCoupon, setAppliedCoupon] = useState(
        incomingState.appliedCoupon || null
    );
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [promoError, setPromoError] = useState("");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================
    // Load Data
    // ============================================

    const loadData = useCallback(async () => {
        try {
            setPageLoading(true);
            const [cartRes, addrRes, walletRes] = await Promise.allSettled([
                BasketService.getBasket(),
                AddressService.getAddresses(),
                WalletService.getWallet(),
            ]);

            if (cartRes.status === "fulfilled" && cartRes.value.data) {
                const items = Array.isArray(cartRes.value.data)
                    ? cartRes.value.data
                    : [];
                setCartItems(items);
            } else if (cartRes.status === "rejected") {
                setError("Could not load your shopping basket.");
            }

            if (
                addrRes.status === "fulfilled" &&
                Array.isArray(addrRes.value.data)
            ) {
                const addrList = addrRes.value.data;
                setAddresses(addrList);
                const defaultAddr =
                    addrList.find((a) => a.is_default) || addrList[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                    setUseNewAddress(false);
                } else {
                    setUseNewAddress(true);
                }
            } else {
                setUseNewAddress(true);
            }

            if (walletRes.status === "fulfilled" && walletRes.value.data) {
                setWallet(walletRes.value.data);
            }
        } catch (err) {
            console.error("Failed loading checkout data:", err);
            setError("Failed to load checkout dependencies.");
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============================================
    // Helpers & Pricing Calculations
    // ============================================

    const originalSubtotal = cartItems.reduce(
        (sum, item) =>
            sum +
            Number((item.original_price ?? item.unit_price) || 0) *
                (item.quantity || 1),
        0
    );

    const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
    );

    const discountSavings = Math.max(0, originalSubtotal - subtotal);
    const hasDiscount = discountSavings > 0;

    const hasItems = cartItems.length > 0;

    const hasPhysicalItems = cartItems.some(
        (item) => (item.format_type || "").toUpperCase() === "PHYSICAL"
    );

    // Coupon discount calculation
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
    const walletBalance = Number(wallet?.balance || 0);
    const hasEnoughBalance = walletBalance >= finalTotal;

    // ============================================
    // Shipping Handlers & Cascading Location
    // ============================================

    const availableCities = useMemo(() => {
        if (!shippingInfo.province) return [];
        return IRAN_CITIES_BY_PROVINCE[shippingInfo.province] || [];
    }, [shippingInfo.province]);

    const handleProvinceChange = (event) => {
        const selectedProvince = event.target.value;
        setShippingInfo((prev) => ({
            ...prev,
            province: selectedProvince,
            city: "", // reset city whenever province changes
        }));
    };

    const handleShippingChange = (event) => {
        const { name, value } = event.target;
        setShippingInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Resolves currently chosen shipping address object for Step 2 display
    const currentAddress = useMemo(() => {
        if (!useNewAddress && selectedAddressId) {
            return addresses.find((a) => a.id === selectedAddressId) || null;
        }
        if (useNewAddress || addresses.length === 0) {
            if (
                !shippingInfo.name.trim() &&
                !shippingInfo.city.trim() &&
                !shippingInfo.address.trim()
            ) {
                return null;
            }
            return {
                recipient_name: shippingInfo.name,
                phone_number: shippingInfo.phone,
                country: shippingInfo.country || "Iran",
                province: shippingInfo.province,
                city: shippingInfo.city,
                address_line: shippingInfo.address,
                postal_code: shippingInfo.postal_code,
                title: shippingInfo.title || "New Address",
            };
        }
        return null;
    }, [useNewAddress, selectedAddressId, addresses, shippingInfo]);

    const validateShipping = () => {
        if (!hasPhysicalItems) {
            return true;
        }

        if (!useNewAddress && selectedAddressId) {
            return true;
        }

        if (
            !shippingInfo.name.trim() ||
            !shippingInfo.phone.trim() ||
            !shippingInfo.province.trim() ||
            !shippingInfo.city.trim() ||
            !shippingInfo.address.trim()
        ) {
            notificationRef.current?.showNotif(
                "Please fill in all required delivery fields (Recipient Name, Phone, Province, City, and Street Address).",
                "error"
            );
            return false;
        }

        return true;
    };

    const continueToSummary = () => {
        if (validateShipping()) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // ============================================
    // Voucher / Coupon Handlers
    // ============================================

    const handleApplyPromo = async (e) => {
        if (e) e.preventDefault();
        const code = discountCode.trim();
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
        setDiscountCode("");
        setPromoError("");
        notificationRef.current?.showNotif("Promo code removed", "info");
    };

    // ============================================
    // Submit Order (Address Save & Checkout Bug Fix)
    // ============================================

    const handlePlaceOrder = async () => {
        if (!hasEnoughBalance) {
            notificationRef.current?.showNotif(
                "Insufficient wallet balance. Please top up your wallet first.",
                "error"
            );
            return;
        }

        try {
            setLoading(true);

            const payload = {
                discount_code: appliedCoupon
                    ? appliedCoupon.code
                    : discountCode.trim(),
            };

            if (hasPhysicalItems) {
                if (!useNewAddress && selectedAddressId) {
                    payload.address_id = selectedAddressId;
                } else {
                    const addressPayload = {
                        title: shippingInfo.title?.trim() || "Delivery Address",
                        recipient_name: shippingInfo.name.trim(),
                        phone_number: shippingInfo.phone.trim(),
                        country: shippingInfo.country.trim() || "Iran",
                        province: shippingInfo.province.trim(),
                        city: shippingInfo.city.trim(),
                        address_line: shippingInfo.address.trim(),
                        postal_code: shippingInfo.postal_code?.trim() || "",
                    };

                    // PROPERLY AWAIT address creation so we get the newly created address ID!
                    if (saveNewAddress) {
                        try {
                            const createdAddrRes =
                                await AddressService.createAddress(
                                    addressPayload
                                );
                            const createdAddr = createdAddrRes.data;
                            if (createdAddr && createdAddr.id) {
                                payload.address_id = createdAddr.id;
                                setAddresses((prev) => [...prev, createdAddr]);
                                setSelectedAddressId(createdAddr.id);
                            }
                        } catch (addrErr) {
                            console.error(
                                "Address creation failed:",
                                addrErr.response?.data || addrErr
                            );
                            const addrErrMsg =
                                addrErr.response?.data?.detail ||
                                Object.values(addrErr.response?.data || {})
                                    .flat()
                                    .join(" ") ||
                                "Failed to save delivery address. Please verify your address details.";
                            notificationRef.current?.showNotif(
                                addrErrMsg,
                                "error"
                            );
                            setLoading(false);
                            return; // Stop checkout so address is not silently lost
                        }
                    } else {
                        payload.shipping_name = shippingInfo.name.trim();
                        payload.shipping_address_line1 =
                            shippingInfo.address.trim();
                        payload.shipping_city = shippingInfo.province
                            ? `${shippingInfo.province} - ${shippingInfo.city.trim()}`
                            : shippingInfo.city.trim();
                        payload.shipping_country =
                            shippingInfo.country.trim() || "Iran";
                    }
                }
            }

            const response = await BasketService.checkout(payload);
            setOrder(response.data);
            setStep(3);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.error("Checkout failed:", err.response?.data || err);
            const msg =
                err.response?.data?.wallet?.[0] ||
                err.response?.data?.shipping_address ||
                err.response?.data?.detail ||
                "Failed to complete checkout. Please try again.";
            notificationRef.current?.showNotif(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Guards
    // ============================================

    if (!isLoggedIn) {
        return <Navigate to="/login" />;
    }

    if (!pageLoading && !hasItems && !order) {
        return (
            <div className="checkout-page-root">
                <div className="full-checkout-nav">
                    <Navbar />
                </div>
                <div className="checkout-nav">
                    <SimpleNav />
                </div>
                <div className="checkout-container">
                    <div className="checkout-empty-box">
                        <h2>{t("cart.emptyCart", "Your basket is empty")}</h2>
                        <p>{t("cart.emptySubtitle", "There are no items to checkout.")}</p>
                        <button
                            type="button"
                            className="checkout-action-btn"
                            onClick={() => navigate("/library")}
                        >
                            {t("cart.browseStore", "Explore Catalog")}
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // ============================================
    // Render
    // ============================================

    return (
        <div className="checkout-page-root">
            {/* Desktop Navigation */}
            <div className="full-checkout-nav">
                <Navbar />
            </div>

            {/* Mobile Navigation */}
            <div className="checkout-nav">
                <SimpleNav />
            </div>

            <Notification ref={notificationRef} />

            <div className="checkout-container">
                {/* Top Navigation Bar: Back Button, Breadcrumbs, Steps */}
                <div className="checkout-top-bar">
                    <button
                        type="button"
                        className="checkout-back-btn"
                        onClick={() => {
                            if (step === 2 && hasPhysicalItems) {
                                setStep(1);
                            } else {
                                navigate("/basket");
                            }
                        }}
                        title={
                            step === 2 && hasPhysicalItems
                                ? t("checkout.backToShipping", "Back to delivery details")
                                : t("cart.title", "Back to Shopping Cart")
                        }
                    >
                        {step === 2 && hasPhysicalItems
                            ? `← ${t("checkout.backToShipping", "Back to Shipping")}`
                            : `← ${t("cart.title", "Back to Cart")}`}
                    </button>

                    <div className="checkout-breadcrumbs">
                        <Link to="/home">{t("nav.home", "Home")}</Link>
                        <span>/</span>
                        <Link to="/basket">{t("nav.cart", "Cart")}</Link>
                        <span>/</span>
                        <span className="current">{t("checkout.title", "Checkout")}</span>
                    </div>

                    <div className="checkout-steps-indicator">
                        <span className={`step-pill ${step >= 1 ? "active" : ""}`}>
                            {t("checkout.stepDetails", "1. Details")}
                        </span>
                        <span className="step-arrow">→</span>
                        <span className={`step-pill ${step >= 2 ? "active" : ""}`}>
                            {t("checkout.stepReview", "2. Review & Pay")}
                        </span>
                        <span className="step-arrow">→</span>
                        <span className={`step-pill ${step >= 3 ? "active" : ""}`}>
                            {t("checkout.stepSuccess", "3. Success")}
                        </span>
                    </div>
                </div>

                {/* Page Loading or Error */}
                {pageLoading && (
                    <div className="checkout-state-box">
                        <div className="checkout-spinner" />
                        <p>{t("common.loading", "Loading checkout details...")}</p>
                    </div>
                )}

                {!pageLoading && error && (
                    <div className="checkout-state-box checkout-error">
                        <p>{error}</p>
                        <button
                            type="button"
                            className="checkout-action-btn"
                            onClick={loadData}
                        >
                            {t("common.retry", "Retry")}
                        </button>
                    </div>
                )}

                {/* Main Step Flow */}
                {!pageLoading && !error && (
                    <div className="checkout-content-wrap">
                        {/* STEP 1: Shipping or Digital Notice */}
                        {step === 1 && (
                            <div className="checkout-step-card step1">
                                <h2 className="title-checkout">
                                    {t("checkout.deliveryDetails", "Delivery Details")}
                                </h2>

                                {!hasPhysicalItems ? (
                                    <div className="digital-order-notice">
                                        <div className="digital-notice-icon">
                                            📱
                                        </div>
                                        <div>
                                            <h4>{t("checkout.digitalOrder", "Digital Order")}</h4>
                                            <p>
                                                {t("checkout.digitalOrderDesc", "All items in your cart are digital (e-books or audiobooks). No physical shipping address is required.")}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="shipping-form-section">
                                        <p className="shipping-intro-text">
                                            Select a saved address or enter a
                                            new shipping destination:
                                        </p>

                                        {addresses.length > 0 &&
                                            !useNewAddress && (
                                                <div className="saved-addresses-block">
                                                    <div className="address-selection-list">
                                                        {addresses.map((addr) => (
                                                            <div
                                                                key={addr.id}
                                                                className={`saved-address-card ${
                                                                    selectedAddressId ===
                                                                    addr.id
                                                                        ? "selected"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    setSelectedAddressId(
                                                                        addr.id
                                                                    )
                                                                }
                                                            >
                                                                <div className="saved-address-header">
                                                                    <div className="saved-address-radio">
                                                                        <input
                                                                            type="radio"
                                                                            name="selectedAddressRadio"
                                                                            checked={
                                                                                selectedAddressId ===
                                                                                addr.id
                                                                            }
                                                                            onChange={() =>
                                                                                setSelectedAddressId(
                                                                                    addr.id
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="saved-address-title">
                                                                        <span>
                                                                            {addr.title ||
                                                                                "Saved Address"}
                                                                        </span>
                                                                        {addr.is_default && (
                                                                            <span className="default-pill">
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="saved-address-details">
                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                addr.recipient_name
                                                                            }
                                                                        </strong>{" "}
                                                                        {addr.phone_number && (
                                                                            <span className="addr-phone">
                                                                                - {addr.phone_number}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        {addr.province
                                                                            ? `${addr.province}، `
                                                                            : ""}
                                                                        {addr.city} - {addr.address_line}
                                                                    </div>
                                                                    {addr.postal_code && (
                                                                        <div className="saved-address-postal">
                                                                            Postal Code: {addr.postal_code}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="toggle-new-address-btn"
                                                        onClick={() =>
                                                            setUseNewAddress(true)
                                                        }
                                                    >
                                                        + Enter a new address
                                                    </button>
                                                </div>
                                            )}

                                        {(useNewAddress ||
                                            addresses.length === 0) && (
                                            <div className="new-address-form">
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Address Title / Label</label>
                                                        <input
                                                            className="checkout-field"
                                                            name="title"
                                                            placeholder="e.g. Home, Office"
                                                            value={shippingInfo.title}
                                                            onChange={
                                                                handleShippingChange
                                                            }
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Recipient Name *</label>
                                                        <input
                                                            className="checkout-field"
                                                            name="name"
                                                            placeholder="Full recipient name"
                                                            value={shippingInfo.name}
                                                            onChange={
                                                                handleShippingChange
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Phone Number *</label>
                                                        <input
                                                            className="checkout-field"
                                                            name="phone"
                                                            placeholder="e.g. 09123456789"
                                                            value={shippingInfo.phone}
                                                            onChange={
                                                                handleShippingChange
                                                            }
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Country</label>
                                                        <input
                                                            className="checkout-field"
                                                            name="country"
                                                            placeholder="Iran"
                                                            value={shippingInfo.country}
                                                            disabled
                                                        />
                                                    </div>
                                                </div>

                                                {/* Cascading Province & City Dropdowns */}
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Province / Ostan *</label>
                                                        <select
                                                            className="checkout-field checkout-select"
                                                            name="province"
                                                            value={shippingInfo.province || ""}
                                                            onChange={handleProvinceChange}
                                                        >
                                                            <option value="">-- Select Province --</option>
                                                            {IRAN_PROVINCES.map((prov) => (
                                                                <option key={prov.id} value={prov.id}>
                                                                    {prov.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>City / Shahrestan *</label>
                                                        <select
                                                            className="checkout-field checkout-select"
                                                            name="city"
                                                            value={shippingInfo.city || ""}
                                                            onChange={handleShippingChange}
                                                            disabled={!shippingInfo.province}
                                                        >
                                                            <option value="">
                                                                {shippingInfo.province
                                                                    ? "-- Select City --"
                                                                    : "-- First Select Province --"}
                                                            </option>
                                                            {availableCities.map((cityName) => (
                                                                <option key={cityName} value={cityName}>
                                                                    {cityName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Street Address *</label>
                                                    <input
                                                        className="checkout-field full-width"
                                                        name="address"
                                                        placeholder="Street, alley, building, plaque, unit"
                                                        value={shippingInfo.address}
                                                        onChange={
                                                            handleShippingChange
                                                        }
                                                    />
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>Postal Code (Optional)</label>
                                                        <input
                                                            className="checkout-field"
                                                            name="postal_code"
                                                            placeholder="10-digit postal code"
                                                            value={shippingInfo.postal_code || ""}
                                                            onChange={
                                                                handleShippingChange
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <label className="save-address-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={saveNewAddress}
                                                        onChange={(e) =>
                                                            setSaveNewAddress(
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        Save this address to my profile
                                                        for future purchases
                                                    </span>
                                                </label>

                                                {addresses.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="toggle-new-address-btn back-toggle"
                                                        onClick={() =>
                                                            setUseNewAddress(false)
                                                        }
                                                    >
                                                        ← Choose from saved addresses
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="step-actions-row">
                                    <button
                                        type="button"
                                        className="checkout-secondary-btn"
                                        onClick={() => navigate("/basket")}
                                    >
                                        ← Back to Cart
                                    </button>

                                    <button
                                        type="button"
                                        className="checkout-continue-btn"
                                        onClick={continueToSummary}
                                    >
                                        Continue to Review & Pay →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Order Summary & Wallet Payment */}
                        {step === 2 && (
                            <div className="checkout-step-card step2">
                                <h2 className="title-checkout">
                                    {t("checkout.reviewAndPayment", "Review & Payment")}
                                </h2>

                                {/* Delivery Destination Card for Physical Orders */}
                                {hasPhysicalItems && (
                                    <div className="checkout-delivery-summary-card">
                                        <div className="delivery-summary-header">
                                            <div className="delivery-summary-title">
                                                <span className="delivery-icon">📦</span>
                                                <div>
                                                    <h4>{t("checkout.deliveryDestination", "Delivery Destination")}</h4>
                                                    <p className="delivery-subtitle">
                                                        Physical items will be dispatched to:
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="checkout-edit-address-btn"
                                                onClick={() => {
                                                    setStep(1);
                                                    window.scrollTo({
                                                        top: 0,
                                                        behavior: "smooth",
                                                    });
                                                }}
                                                title={t("checkout.changeAddress", "Change delivery address")}
                                            >
                                                ✏️ {t("checkout.changeAddress", "Change Address")}
                                            </button>
                                        </div>
                                        {currentAddress ? (
                                            <div className="delivery-summary-body">
                                                <div className="delivery-recipient-row">
                                                    <strong>
                                                        {currentAddress.recipient_name}
                                                    </strong>
                                                    {currentAddress.phone_number && (
                                                        <span className="delivery-phone">
                                                            ({currentAddress.phone_number})
                                                        </span>
                                                    )}
                                                    {currentAddress.title && (
                                                        <span className="delivery-tag">
                                                            {currentAddress.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="delivery-location-row">
                                                    {currentAddress.province && (
                                                        <span>
                                                            {currentAddress.province}،{" "}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {currentAddress.city} -{" "}
                                                    </span>
                                                    <span>
                                                        {currentAddress.address_line}
                                                    </span>
                                                </div>
                                                {currentAddress.postal_code && (
                                                    <div className="delivery-postal-row">
                                                        Postal Code:{" "}
                                                        {currentAddress.postal_code}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="delivery-summary-empty">
                                                <p>No delivery address selected.</p>
                                                <button
                                                    type="button"
                                                    className="checkout-edit-address-btn"
                                                    onClick={() => {
                                                        setStep(1);
                                                        window.scrollTo({
                                                            top: 0,
                                                            behavior: "smooth",
                                                        });
                                                    }}
                                                >
                                                    Select an Address
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="checkout-items">
                                    {cartItems.map((item) => {
                                        const unitOriginal = Number(
                                            item.original_price ?? item.unit_price
                                        );
                                        const hasItemDiscount = Boolean(
                                            item.has_discount ||
                                                (item.original_price &&
                                                    Number(item.original_price) >
                                                        Number(item.unit_price))
                                        );
                                        const discountPercent =
                                            item.discount_percent ||
                                            (hasItemDiscount && item.original_price
                                                ? Math.round(
                                                      ((Number(item.original_price) -
                                                          Number(item.unit_price)) /
                                                          Number(item.original_price)) *
                                                          100
                                                  )
                                                : 0);

                                        return (
                                            <div
                                                key={`${item.book_id}-${item.format_id}`}
                                                className="checkout-item"
                                            >
                                                <div className="checkout-item-info">
                                                    <span className="checkout-item-title">
                                                        {item.title} x{" "}
                                                        {item.quantity} (
                                                        {item.format_type})
                                                    </span>
                                                    {hasItemDiscount &&
                                                        discountPercent > 0 && (
                                                            <span className="checkout-item-badge">
                                                                -{discountPercent}%
                                                            </span>
                                                        )}
                                                </div>

                                                <div className="checkout-item-prices">
                                                    {hasItemDiscount && (
                                                        <span className="checkout-item-original">
                                                            {formatPrice(
                                                                unitOriginal *
                                                                    item.quantity
                                                            )}
                                                        </span>
                                                    )}
                                                    <span className="checkout-item-final">
                                                        {formatPrice(item.subtotal)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Voucher / Promo Code Box with Real-Time Validation */}
                                <div className="checkout-promo-box">
                                    <label className="checkout-promo-label">
                                        Discount Voucher / Coupon:
                                    </label>

                                    {appliedCoupon ? (
                                        <div className="checkout-applied-promo">
                                            <div className="applied-promo-details">
                                                <span className="promo-badge-chip">
                                                    {appliedCoupon.code}
                                                </span>
                                                <span className="promo-discount-text">
                                                    {appliedCoupon.name} (
                                                    {appliedCoupon.discount_type ===
                                                    "PERCENTAGE"
                                                        ? `${appliedCoupon.value}% OFF`
                                                        : `${formatPrice(
                                                              appliedCoupon.value
                                                          )} OFF`}
                                                    )
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="promo-clear-link"
                                                onClick={handleRemovePromo}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="checkout-promo-input-wrap">
                                            <input
                                                type="text"
                                                placeholder="Enter coupon code (e.g. WELCOME20)"
                                                value={discountCode}
                                                onChange={(e) =>
                                                    setDiscountCode(e.target.value)
                                                }
                                                className="checkout-promo-input"
                                            />
                                            <button
                                                type="button"
                                                className="checkout-promo-btn"
                                                onClick={handleApplyPromo}
                                                disabled={
                                                    validatingPromo ||
                                                    !discountCode.trim()
                                                }
                                            >
                                                {validatingPromo
                                                    ? "Checking..."
                                                    : "Apply"}
                                            </button>
                                        </div>
                                    )}

                                    {promoError && (
                                        <p className="checkout-promo-error">
                                            {promoError}
                                        </p>
                                    )}
                                </div>

                                {/* Summary Breakdown */}
                                <div className="checkout-summary">
                                    {hasDiscount && (
                                        <>
                                            <div className="checkout-summary-row original">
                                                <span>Original Catalog Subtotal:</span>
                                                <span className="checkout-summary-strikethrough">
                                                    {formatPrice(originalSubtotal)}
                                                </span>
                                            </div>
                                            <div className="checkout-summary-row savings">
                                                <span>Catalog Discounts:</span>
                                                <span className="checkout-summary-savings-val">
                                                    -{formatPrice(discountSavings)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="checkout-summary-row">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>

                                    {appliedCoupon && couponDiscountAmount > 0 && (
                                        <div className="checkout-summary-row promo-savings">
                                            <span>
                                                Voucher ({appliedCoupon.code}
                                                {isPercentDiscount(appliedCoupon) ? ` - ${appliedCoupon.value}%` : ""}):
                                            </span>
                                            <span>
                                                -{formatPrice(couponDiscountAmount)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="checkout-summary-row total">
                                        <span>Final Total:</span>
                                        <span className="checkout-summary-total-val">
                                            {formatPrice(finalTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* Wallet Balance Verification */}
                                <div className="wallet-balance-box">
                                    <div className="wallet-balance-row">
                                        <span>Your Wallet Balance:</span>
                                        <span
                                            className={`wallet-balance-val ${
                                                !hasEnoughBalance
                                                    ? "wallet-balance-insufficient"
                                                    : ""
                                            }`}
                                        >
                                            {formatPrice(walletBalance)}
                                        </span>
                                    </div>

                                    {!hasEnoughBalance && (
                                        <>
                                            <div className="wallet-warning-banner">
                                                Insufficient wallet balance. You need{" "}
                                                <strong>
                                                    {formatPrice(
                                                        finalTotal - walletBalance
                                                    )}
                                                </strong>{" "}
                                                more to complete this order.
                                            </div>
                                            <button
                                                type="button"
                                                className="wallet-topup-link-btn"
                                                onClick={() =>
                                                    navigate("/dashboard")
                                                }
                                            >
                                                Top Up Wallet in Dashboard →
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="step-actions-row">
                                    <button
                                        type="button"
                                        className="checkout-secondary-btn"
                                        onClick={() => {
                                            if (hasPhysicalItems) {
                                                setStep(1);
                                            } else {
                                                navigate("/basket");
                                            }
                                        }}
                                    >
                                        {hasPhysicalItems
                                            ? "← Back to Shipping"
                                            : "← Back to Cart"}
                                    </button>

                                    <button
                                        type="button"
                                        className="checkout-btn"
                                        disabled={loading || !hasEnoughBalance}
                                        onClick={handlePlaceOrder}
                                    >
                                        {loading
                                            ? "Processing Payment..."
                                            : !hasEnoughBalance
                                            ? "Insufficient Balance"
                                            : "Pay from Wallet & Place Order"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Order Completed */}
                        {step === 3 && order && (
                            <div className="checkout-step-card step3">
                                <div className="checkout-success-icon">✓</div>
                                <h2 className="success-title">{t("checkout.orderPlacedSuccess", "Order Placed Successfully!")}</h2>

                                <p className="success-order-id">
                                    {t("cart.orderId", "Order ID: #{id}", { id: order.id })}
                                </p>

                                <span className="success-status-pill">
                                    {order.status_display || order.status}
                                </span>

                                <div className="order-receipt-box">
                                    <div className="receipt-row">
                                        <span>{t("cart.subtotal", "Subtotal")}:</span>
                                        <span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    {Number(order.discount_amount) > 0 && (
                                        <div className="receipt-row discount">
                                            <span>{t("cart.discount", "Discount Saved")}:</span>
                                            <span>
                                                -{formatPrice(order.discount_amount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="receipt-row total">
                                        <span>{t("checkout.totalPaid", "Total Paid:")}</span>
                                        <span className="paid-val">
                                            {formatPrice(order.total_amount)}
                                        </span>
                                    </div>
                                </div>

                                <p className="success-hint">
                                    Your order has been paid from your wallet and confirmed.
                                    Digital items and audiobooks are now immediately available in your library.
                                </p>

                                <div className="success-actions-row">
                                    <button
                                        type="button"
                                        className="checkout-continue-btn"
                                        onClick={() => navigate("/dashboard")}
                                    >
                                        {t("checkout.viewInDashboard", "View in Dashboard")}
                                    </button>
                                    <button
                                        type="button"
                                        className="checkout-secondary-btn"
                                        onClick={() => navigate("/library")}
                                    >
                                        {t("checkout.continueBrowsing", "Continue Browsing")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <div className="BottomNav">
                <nav className="bottom-navbar">
                    <Link to="/" className="nav-item">
                        <i className="fas fa-home"></i>
                        <span>{t("nav.home", "Home")}</span>
                    </Link>
                    <Link to="/favorites" className="nav-item">
                        <i className="fa-solid fa-heart"></i>
                        <span>{t("library.wishlistTitle", "Favorites")}</span>
                    </Link>
                    <Link to="/library" className="nav-item">
                        <i className="fa-solid fa-book"></i>
                        <span>{t("nav.explore", "Catalog")}</span>
                    </Link>
                    <Link to="/subscription" className="nav-item">
                        <i className="fa-solid fa-bolt"></i>
                        <span>{t("nav.subscription", "Plans")}</span>
                    </Link>
                    <Link to="/basket" className="nav-item active">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>{t("nav.cart", "Cart")}</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}