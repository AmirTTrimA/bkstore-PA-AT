import {
    useEffect,
    useRef,
    useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Notification from "../../Components/feature/Notification";
import { useAuth } from "../../Context/AuthContext";
import BasketService from "../../Services/BasketService";
import AddressService from "../../Services/AddressService";
import WalletService from "../../Services/WalletService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Checkout.css";

// ============================================
// Main
// ============================================

export default function Checkout() {
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // ============================================
    // State
    // ============================================

    const [step, setStep] = useState(1);
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(true);

    const [shippingInfo, setShippingInfo] = useState({
        name: "",
        address: "",
        city: "",
        country: "Iran",
        phone: "",
    });

    const [wallet, setWallet] = useState(null);
    const [discountCode, setDiscountCode] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ============================================
    // Load Data
    // ============================================

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                const [cartRes, addrRes, walletRes] = await Promise.allSettled([
                    BasketService.getBasket(),
                    AddressService.getAddresses(),
                    WalletService.getWallet(),
                ]);

                if (cancelled) return;

                if (cartRes.status === "fulfilled" && cartRes.value.data) {
                    setCartItems(cartRes.value.data);
                } else if (cartRes.status === "rejected") {
                    setError("Could not load basket.");
                }

                if (addrRes.status === "fulfilled" && Array.isArray(addrRes.value.data)) {
                    setAddresses(addrRes.value.data);
                    const defaultAddr =
                        addrRes.value.data.find((a) => a.is_default) ||
                        addrRes.value.data[0];
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
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    // ============================================
    // Helpers
    // ============================================

    const subtotal = cartItems.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
    );

    const hasItems = cartItems.length > 0;

    const hasPhysicalItems = cartItems.some(
        (item) => (item.format_type || "").toUpperCase() === "PHYSICAL"
    );

    const walletBalance = Number(wallet?.balance || 0);
    const hasEnoughBalance = walletBalance >= subtotal;

    // ============================================
    // Shipping Handlers
    // ============================================

    const handleShippingChange = (event) => {
        const { name, value } = event.target;
        setShippingInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateShipping = () => {
        if (!hasPhysicalItems) {
            return true;
        }

        if (!useNewAddress && selectedAddressId) {
            return true;
        }

        if (
            !shippingInfo.name.trim() ||
            !shippingInfo.address.trim() ||
            !shippingInfo.city.trim()
        ) {
            notificationRef.current?.showNotif(
                "Please complete all required shipping fields.",
                "error"
            );
            return false;
        }

        return true;
    };

    const continueToSummary = () => {
        if (validateShipping()) {
            setStep(2);
        }
    };

    // ============================================
    // Submit Order
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
                discount_code: discountCode.trim(),
            };

            if (hasPhysicalItems) {
                if (!useNewAddress && selectedAddressId) {
                    payload.address_id = selectedAddressId;
                } else {
                    payload.shipping_name = shippingInfo.name.trim();
                    payload.shipping_address_line1 = shippingInfo.address.trim();
                    payload.shipping_city = shippingInfo.city.trim();
                    payload.shipping_country =
                        shippingInfo.country.trim() || "Iran";

                    if (saveNewAddress) {
                        AddressService.createAddress({
                            title: "Saved Address",
                            recipient_name: shippingInfo.name.trim(),
                            city: shippingInfo.city.trim(),
                            country: shippingInfo.country.trim() || "Iran",
                            address_line: shippingInfo.address.trim(),
                            phone_number: shippingInfo.phone.trim(),
                        }).catch((e) =>
                            console.warn("Failed to auto-save address:", e)
                        );
                    }
                }
            }

            const response = await BasketService.checkout(payload);
            setOrder(response.data);
            setStep(3);
        } catch (err) {
            console.error("Checkout failed:", err.response?.data || err);
            const msg =
                err.response?.data?.wallet?.[0] ||
                err.response?.data?.shipping_address ||
                err.response?.data?.detail ||
                "Failed to complete checkout.";
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

    if (!hasItems && !order) {
        return (
            <div className="checkout-form">
                <h2>Your basket is empty.</h2>
            </div>
        );
    }

    if (error) {
        return <div className="checkout-form">{error}</div>;
    }

    // ============================================
    // Render
    // ============================================

    return (
        <div className="checkout-form">
            <Notification ref={notificationRef} />

            {/* STEP 1: Shipping or Digital Notice */}
            {step === 1 && (
                <div className="step1">
                    <h2 className="title-checkout">Checkout</h2>

                    {!hasPhysicalItems ? (
                        <div className="digital-order-notice">
                            <p>
                                <strong>Digital Order</strong>
                            </p>
                            <p>
                                All items in your cart are digital (e-books or
                                audiobooks). No shipping address is required.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p>Select or enter your delivery address:</p>

                            {addresses.length > 0 && !useNewAddress && (
                                <>
                                    <div className="address-selection-list">
                                        {addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                className={`saved-address-card ${
                                                    selectedAddressId === addr.id
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setSelectedAddressId(addr.id)
                                                }
                                            >
                                                <div className="saved-address-title">
                                                    {addr.title || "Address"}{" "}
                                                    {addr.is_default &&
                                                        "(Default)"}
                                                </div>
                                                <div className="saved-address-details">
                                                    <div>
                                                        <strong>
                                                            {addr.recipient_name}
                                                        </strong>{" "}
                                                        - {addr.phone_number}
                                                    </div>
                                                    <div>
                                                        {addr.city},{" "}
                                                        {addr.address_line}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="toggle-new-address-btn"
                                        onClick={() => setUseNewAddress(true)}
                                    >
                                        + Enter a new address
                                    </button>
                                </>
                            )}

                            {(useNewAddress || addresses.length === 0) && (
                                <>
                                    <input
                                        className="checkout-field"
                                        name="name"
                                        placeholder="Receiver Name *"
                                        value={shippingInfo.name}
                                        onChange={handleShippingChange}
                                    />

                                    <input
                                        className="checkout-field"
                                        name="address"
                                        placeholder="Street Address *"
                                        value={shippingInfo.address}
                                        onChange={handleShippingChange}
                                    />

                                    <input
                                        className="checkout-field"
                                        name="city"
                                        placeholder="City *"
                                        value={shippingInfo.city}
                                        onChange={handleShippingChange}
                                    />

                                    <input
                                        className="checkout-field"
                                        name="country"
                                        placeholder="Country"
                                        value={shippingInfo.country}
                                        onChange={handleShippingChange}
                                    />

                                    <input
                                        className="checkout-field"
                                        name="phone"
                                        placeholder="Phone Number"
                                        value={shippingInfo.phone}
                                        onChange={handleShippingChange}
                                    />

                                    <label
                                        style={{
                                            fontSize: "0.85rem",
                                            marginTop: "6px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={saveNewAddress}
                                            onChange={(e) =>
                                                setSaveNewAddress(
                                                    e.target.checked
                                                )
                                            }
                                            style={{ marginRight: "6px" }}
                                        />
                                        Save address to profile
                                    </label>

                                    {addresses.length > 0 && (
                                        <button
                                            type="button"
                                            className="toggle-new-address-btn"
                                            onClick={() =>
                                                setUseNewAddress(false)
                                            }
                                        >
                                            ← Back to saved addresses
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    <button
                        className="checkout-continue-btn"
                        onClick={continueToSummary}
                        style={{ marginTop: "15px" }}
                    >
                        Continue to Summary
                    </button>
                </div>
            )}

            {/* STEP 2: Order Summary & Wallet Payment */}
            {step === 2 && (
                <div className="step2">
                    <h2 className="title-checkout">Order Summary</h2>

                    <div className="checkout-items">
                        {cartItems.map((item) => (
                            <div
                                key={`${item.book_id}-${item.format_id}`}
                                className="checkout-item"
                            >
                                <span>
                                    {item.title} x {item.quantity} (
                                    {item.format_type})
                                </span>
                                <span>{formatPrice(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="checkout-summary">
                        <p style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                            Total: {formatPrice(subtotal)}
                        </p>
                    </div>

                    {/* Optional Discount Code */}
                    <div className="discount-input-box" style={{ margin: "15px 0" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem", color: "#555" }}>
                            Discount Voucher (optional):
                        </label>
                        <input
                            type="text"
                            placeholder="Enter discount code..."
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                fontSize: "0.95rem",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Wallet Balance Verification */}
                    <div className="wallet-balance-box">
                        <div className="wallet-balance-row">
                            <span>Wallet Balance:</span>
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
                                    Insufficient funds. You need{" "}
                                    {formatPrice(subtotal - walletBalance)} more.
                                </div>
                                <button
                                    type="button"
                                    className="wallet-topup-link-btn"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Top Up Wallet in Dashboard →
                                </button>
                            </>
                        )}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "10px",
                        }}
                    >
                        <button
                            type="button"
                            className="checkout-continue-btn"
                            style={{ background: "#444" }}
                            onClick={() => setStep(1)}
                        >
                            Back
                        </button>

                        <button
                            className="checkout-btn"
                            disabled={loading || !hasEnoughBalance}
                            onClick={handlePlaceOrder}
                            style={{ opacity: !hasEnoughBalance ? 0.5 : 1 }}
                        >
                            {loading
                                ? "Processing..."
                                : !hasEnoughBalance
                                ? "Insufficient Balance"
                                : "Pay from Wallet & Place Order"}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Order Completed */}
            {step === 3 && order && (
                <div className="step3">
                    <h2 style={{ color: "#00e384" }}>✓ Order Completed!</h2>

                    <p style={{ fontSize: "1.2rem", margin: "12px 0" }}>
                        Order ID: <strong>#{order.id}</strong>
                    </p>

                    <p>
                        Status:{" "}
                        <strong>{order.status_display || order.status}</strong>
                    </p>

                    <div style={{ margin: "14px 0", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "left", width: "100%", maxWidth: "380px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ color: "#aaa" }}>Subtotal:</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#00e384" }}>
                                <span>Discount Saved:</span>
                                <span>-{formatPrice(order.discount_amount)}</span>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "6px" }}>
                            <span>Total Paid:</span>
                            <span style={{ color: "#00e384" }}>{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>

                    <p
                        style={{
                            fontSize: "0.9rem",
                            color: "#aaa",
                            maxWidth: "380px",
                        }}
                    >
                        Your order has been paid and confirmed. Digital items
                        are now active in your library.
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "20px",
                        }}
                    >
                        <button
                            type="button"
                            className="checkout-continue-btn"
                            onClick={() => navigate("/library")}
                        >
                            Go to Library
                        </button>
                        <button
                            type="button"
                            className="checkout-continue-btn"
                            style={{ background: "#333" }}
                            onClick={() => navigate("/dashboard")}
                        >
                            View in Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}