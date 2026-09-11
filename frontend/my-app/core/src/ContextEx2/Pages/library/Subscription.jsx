import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
import Footer from "../../Components/Footer";
import { useAuth } from "../../Context/AuthContext";
import { useLanguage } from "../../Context/LanguageContext";
import Notification from "../../Components/feature/Notification";
import SubscriptionService from "../../Services/SubscriptionService";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/Subscription.css";

// ============================================
//      Main Subscription Component
// ============================================

export default function Subscription() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { t } = useLanguage();
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
    if (isLoggedIn) {
        return <Navigate to="/dashboard?tab=subscription" replace />;
    }

    return (
        <div className="subscription-page-root">
            <Navbar />

            <Notification ref={notificationRef} />

            <div className="sub-container">
                {/* Top Bar with Back Button & Breadcrumbs */}
                <div className="subscription-top-bar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="subscription-back-btn"
                        title={t("common.back", "Go Back")}
                    >
                        ← {t("common.back", "Back")}
                    </button>

                    <div className="subscription-breadcrumbs">
                        <Link to="/home">{t("nav.home", "Home")}</Link>
                        <span>/</span>
                        <span className="current">{t("nav.subscription", "Subscriptions")}</span>
                    </div>
                </div>

                {/* Page Title */}
                <div className="subscription-hero">
                    <h1 className="sub-main-title">{t("library.vipPlans", "Subscription Plans")}</h1>
                    <p className="sub-main-subtitle">
                        {t("library.vipSubtitle", "Unlock massive discounts on digital and audio books with an active reader membership.")}
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="subscription-state-box">
                        <div className="subscription-spinner" />
                        <p>{t("common.loading", "Loading subscription plans & status...")}</p>
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
                            {t("common.retry", "Retry")}
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
                                        <span className="sub-status-pill active">{t("library.activeMembership", "Active Membership")}</span>
                                        <h3>{activeSubscription.plan?.name}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openCancelModal(activeSubscription)}
                                        className="sub-cancel-btn"
                                        title={t("library.cancelSubscription", "Cancel this active subscription")}
                                    >
                                        {t("library.cancelSubscription", "Cancel Subscription")}
                                    </button>
                                </div>

                                <div className="sub-status-grid">
                                    <div className="sub-status-item">
                                        <span className="sub-label">{t("library.validUntil", "Valid Until")}</span>
                                        <span className="sub-val">
                                            {new Date(activeSubscription.end_date).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">{t("library.digitalDiscount", "Digital Discount")}</span>
                                        <span className="sub-val highlight">
                                            {activeSubscription.plan?.digital_discount_percent}% OFF
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">{t("library.autoRenew", "Auto-Renew")}</span>
                                        <span className="sub-val">
                                            {activeSubscription.auto_renew ? t("common.enabled", "Enabled") : t("common.disabled", "Disabled")}
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
                                        <span className="sub-status-pill reserved">{t("library.scheduledPlan", "Scheduled Plan")}</span>
                                        <h3>{reservedSubscription.plan?.name}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openCancelModal(reservedSubscription)}
                                        className="sub-cancel-btn"
                                        title={t("library.cancelScheduledPlan", "Cancel this scheduled subscription")}
                                    >
                                        {t("library.cancelScheduledPlan", "Cancel Scheduled Plan")}
                                    </button>
                                </div>

                                <div className="sub-status-grid">
                                    <div className="sub-status-item">
                                        <span className="sub-label">{t("library.startsOn", "Starts On")}</span>
                                        <span className="sub-val">
                                            {new Date(reservedSubscription.start_date).toLocaleDateString(undefined, {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="sub-status-item">
                                        <span className="sub-label">{t("library.digitalDiscount", "Digital Discount")}</span>
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
                                <span>{t("library.autoRenewMonthly", "Automatically renew subscription each month")}</span>
                            </label>
                            <p className="auto-renew-help">
                                {autoRenew
                                    ? t("library.autoRenewOnHelp", "Your subscription will automatically extend at the end of each billing cycle.")
                                    : t("library.autoRenewOffHelp", "Auto-renew is off. Your benefits will expire at the end of the current term.")
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
                                            <span className="current-plan-badge">{t("library.currentPlan", "Current Plan")}</span>
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
                                            <span className="plan-price-unit">/ {t("library.month", "month")}</span>
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
                                                ? t("common.processing", "Processing...")
                                                : isCurrent
                                                    ? t("library.activePlan", "Active Plan")
                                                    : hasActiveSubscription
                                                        ? t("library.upgradePlan", "Upgrade to this Plan")
                                                        : t("library.subscribeNow", "Subscribe Now")}
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
                            <h3>{t("library.cancelConfirmTitle", "Cancel Subscription")}</h3>
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
                                {t("library.cancelConfirmDesc", "Are you sure you want to cancel your {name} subscription?", {
                                    name: subToCancel.plan?.name
                                })}
                            </p>
                            <p className="cancel-modal-subtext">
                                {t("library.cancelRefundSubtext", "Any unused or scheduled prepaid balance will be automatically refunded to your wallet immediately.")}
                            </p>
                        </div>

                        <div className="cancel-modal-actions">
                            <button
                                type="button"
                                className="modal-btn-dismiss"
                                onClick={closeCancelModal}
                                disabled={cancelling}
                            >
                                {t("library.keepSubscription", "Keep Subscription")}
                            </button>
                            <button
                                type="button"
                                className="modal-btn-confirm"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? t("library.cancelling", "Cancelling...") : t("library.confirmAndRefund", "Confirm & Refund")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}