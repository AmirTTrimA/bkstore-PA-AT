import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import SimpleNav from "../../Components/SimpleNav";
import Footer from "../../Components/Footer";
import Notification from "../../Components/feature/Notification";
import SubscriptionService from "../../Services/SubscriptionService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Subscription.css";

// ============================================
//      Main Subscription Component
// ============================================

export default function Subscription() {
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // -------------------------
    // State
    // -------------------------
    const [plans, setPlans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [autoRenew, setAutoRenew] = useState(false);
    const [purchasingPlanId, setPurchasingPlanId] = useState(null);

    // Cancellation modal state
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [subToCancel, setSubToCancel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // -------------------------
    // Derived state
    // -------------------------
    const activeSubscription = subscriptions.find(
        sub => sub.status === "ACTIVE"
    );

    const reservedSubscription = subscriptions.find(
        sub => sub.status === "RESERVED"
    );

    const hasActiveSubscription = Boolean(activeSubscription);

    // -------------------------
    // Load Data
    // -------------------------
    const loadData = async () => {
        try {
            setError("");
            const plansResponse = await SubscriptionService.getPlans();
            const plansList = plansResponse.data?.results || plansResponse.data || [];
            setPlans(Array.isArray(plansList) ? plansList : []);

            const subscriptionResponse = await SubscriptionService.getMySubscriptions();
            const subList = subscriptionResponse.data?.results || subscriptionResponse.data || [];
            setSubscriptions(Array.isArray(subList) ? subList : []);
        } catch (err) {
            console.error("Failed to load subscriptions:", err);
            setError("Failed to load subscriptions. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // -------------------------
    // Purchase / Upgrade
    // -------------------------
    const handlePlanAction = async (plan) => {
        try {
            setPurchasingPlanId(plan.id);

            const payload = {
                plan_id: Number(plan.id),
                auto_renew: autoRenew,
            };

            if (hasActiveSubscription) {
                await SubscriptionService.upgrade(payload);
                notificationRef.current?.showNotif(
                    "Subscription successfully upgraded!",
                    "success"
                );
            } else {
                await SubscriptionService.purchase(payload);
                notificationRef.current?.showNotif(
                    "Subscription activated successfully!",
                    "success"
                );
            }

            await loadData();
        } catch (err) {
            console.error("Subscription purchase/upgrade error:", err);
            notificationRef.current?.showNotif(
                err.response?.data?.detail || "Subscription action failed.",
                "error"
            );
        } finally {
            setPurchasingPlanId(null);
        }
    };

    // -------------------------
    // Cancel Subscription
    // -------------------------
    const openCancelModal = (subscription) => {
        setSubToCancel(subscription);
        setCancelModalOpen(true);
    };

    const closeCancelModal = () => {
        if (cancelling) return;
        setCancelModalOpen(false);
        setSubToCancel(null);
    };

    const handleConfirmCancel = async () => {
        if (!subToCancel) return;
        setCancelling(true);

        try {
            const res = await SubscriptionService.cancel({
                subscription_id: subToCancel.id,
                refund: true,
            });

            const refundAmount = res.data?.refunded_amount;
            const refundMsg = Number(refundAmount) > 0
                ? `Subscription cancelled. ${formatPrice(refundAmount)} has been refunded to your wallet!`
                : "Subscription cancelled successfully.";

            notificationRef.current?.showNotif(refundMsg, "success");
            setCancelModalOpen(false);
            setSubToCancel(null);
            await loadData();
        } catch (err) {
            console.error("Failed to cancel subscription:", err);
            notificationRef.current?.showNotif(
                err.response?.data?.detail || "Could not cancel subscription. Please try again.",
                "error"
            );
        } finally {
            setCancelling(false);
        }
    };

    // -------------------------
    // Render
    // -------------------------
    return (
        <div className="subscription-page-root">
            {/* Desktop Navigation */}
            <div className="full-sub-nav">
                <Navbar />
            </div>

            {/* Mobile Navigation */}
            <div className="sub-nav">
                <SimpleNav />
            </div>

            <Notification ref={notificationRef} />

            <div className="sub-container">
                {/* Top Bar with Back Button & Breadcrumbs */}
                <div className="subscription-top-bar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="subscription-back-btn"
                        title="Go Back"
                    >
                        ← Back
                    </button>

                    <div className="subscription-breadcrumbs">
                        <Link to="/home">Home</Link>
                        <span>/</span>
                        <span className="current">Subscriptions</span>
                    </div>
                </div>

                {/* Page Title */}
                <div className="subscription-hero">
                    <h1 className="sub-main-title">Subscription Plans</h1>
                    <p className="sub-main-subtitle">
                        Unlock massive discounts on digital and audio books with an active reader membership.
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="subscription-state-box">
                        <div className="subscription-spinner" />
                        <p>Loading subscription plans & status...</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="subscription-state-box sub-error">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={loadData}
                            className="sub-retry-btn"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && (
                    <>
                        {/* Current Active Subscription Status */}
                        {activeSubscription && (
                            <div className="sub-status-card active-status">
                                <div className="sub-status-header">
                                    <div className="sub-status-title-wrap">
                                        <span className="sub-status-pill active">Active Membership</span>
                                        <h3>{activeSubscription.plan?.name}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openCancelModal(activeSubscription)}
                                        className="sub-cancel-btn"
                                        title="Cancel this active subscription"
                                    >
                                        Cancel Subscription
                                    </button>
                                </div>

                                <div className="sub-status-grid">
                                    <div className="sub-status-item">
                                        <span className="sub-label">Valid Until</span>
                                        <span className="sub-val">
                                            {new Date(activeSubscription.end_date).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">Digital Discount</span>
                                        <span className="sub-val highlight">
                                            {activeSubscription.plan?.digital_discount_percent}% OFF
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">Auto-Renew</span>
                                        <span className="sub-val">
                                            {activeSubscription.auto_renew ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scheduled / Reserved Subscription */}
                        {reservedSubscription && (
                            <div className="sub-status-card reserved-status">
                                <div className="sub-status-header">
                                    <div className="sub-status-title-wrap">
                                        <span className="sub-status-pill reserved">Scheduled Plan</span>
                                        <h3>{reservedSubscription.plan?.name}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openCancelModal(reservedSubscription)}
                                        className="sub-cancel-btn"
                                        title="Cancel this scheduled subscription"
                                    >
                                        Cancel Scheduled Plan
                                    </button>
                                </div>

                                <div className="sub-status-grid">
                                    <div className="sub-status-item">
                                        <span className="sub-label">Starts On</span>
                                        <span className="sub-val">
                                            {new Date(reservedSubscription.start_date).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">Digital Discount</span>
                                        <span className="sub-val highlight">
                                            {reservedSubscription.plan?.digital_discount_percent}% OFF
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Auto-renew checkbox */}
                        <div className="auto-renew-card">
                            <label className="auto-renew-label">
                                <input
                                    type="checkbox"
                                    checked={autoRenew}
                                    onChange={e => setAutoRenew(e.target.checked)}
                                />
                                <span>Automatically renew subscription each month</span>
                            </label>
                            <p className="auto-renew-help">
                                {autoRenew
                                    ? "Your subscription will automatically extend at the end of each billing cycle."
                                    : "Auto-renew is off. Your benefits will expire at the end of the current term."
                                }
                            </p>
                        </div>

                        {/* Plans Grid */}
                        <div className="plans-grid">
                            {plans.map((plan, index) => {
                                const isCurrent = activeSubscription?.plan?.id === plan.id;
                                const isBusy = purchasingPlanId === plan.id;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`plan-card plan-tier-${(index % 3) + 1} ${isCurrent ? "current-tier" : ""}`}
                                    >
                                        {isCurrent && (
                                            <span className="current-plan-badge">Current Plan</span>
                                        )}

                                        <div className="plan-card-header">
                                            <h3 className="plan-name">{plan.name}</h3>
                                            <p className="plan-discount-tag">
                                                {plan.digital_discount_percent > 0
                                                    ? `${plan.digital_discount_percent}% off digital books`
                                                    : "Standard digital catalog"}
                                            </p>
                                        </div>

                                        <div className="plan-price-row">
                                            <span className="plan-price-val">
                                                {formatPrice(plan.monthly_price)}
                                            </span>
                                            <span className="plan-price-unit">/ month</span>
                                        </div>

                                        <ul className="plan-perks-list">
                                            <li>
                                                <i className="fas fa-check"></i>
                                                <span>Unlimited streaming of digital preview samples</span>
                                            </li>
                                            <li>
                                                <i className="fas fa-check"></i>
                                                <span>
                                                    {plan.digital_discount_percent > 0
                                                        ? `${plan.digital_discount_percent}% discount applied at checkout`
                                                        : "Standard member pricing"}
                                                </span>
                                            </li>
                                            <li>
                                                <i className="fas fa-check"></i>
                                                <span>Cancel anytime with automated wallet refund</span>
                                            </li>
                                        </ul>

                                        <button
                                            type="button"
                                            className="plan-action-btn"
                                            disabled={isBusy || isCurrent}
                                            onClick={() => handlePlanAction(plan)}
                                        >
                                            {isBusy
                                                ? "Processing..."
                                                : isCurrent
                                                    ? "Active Plan"
                                                    : hasActiveSubscription
                                                        ? "Upgrade to this Plan"
                                                        : "Subscribe Now"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelModalOpen && subToCancel && (
                <div className="modal-backdrop" onClick={closeCancelModal}>
                    <div
                        className="cancel-modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="cancel-modal-header">
                            <h3>Cancel Subscription</h3>
                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={closeCancelModal}
                                disabled={cancelling}
                            >
                                ×
                            </button>
                        </div>

                        <div className="cancel-modal-body">
                            <div className="cancel-modal-icon">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <p className="cancel-modal-text">
                                Are you sure you want to cancel your <strong>{subToCancel.plan?.name}</strong>{" "}
                                {subToCancel.status === "RESERVED" ? "scheduled plan" : "subscription"}?
                            </p>
                            <p className="cancel-modal-subtext">
                                Any unused or scheduled prepaid balance will be <strong>automatically refunded to your wallet</strong> immediately.
                            </p>
                        </div>

                        <div className="cancel-modal-actions">
                            <button
                                type="button"
                                className="modal-btn-dismiss"
                                onClick={closeCancelModal}
                                disabled={cancelling}
                            >
                                Keep Subscription
                            </button>
                            <button
                                type="button"
                                className="modal-btn-confirm"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? "Cancelling..." : "Confirm & Refund"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <Link to="/subscription" className="nav-item active">
                        <i className="fa-solid fa-bolt"></i>
                        <span>Plans</span>
                    </Link>
                    <Link to="/basket" className="nav-item">
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>Cart</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
}