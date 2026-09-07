import React, { useEffect, useRef, useState } from "react";
import Notification from "../../../Components/feature/Notification";
import SubscriptionService from "../../../Services/SubscriptionService";
import { formatPrice } from "../../../utils/formatPrice";

import "../../../Styles/components/Subscription.css";

export default function SubscriptionView() {
  const notificationRef = useRef(null);

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

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "ACTIVE"
  );

  const reservedSubscription = subscriptions.find(
    (sub) => sub.status === "RESERVED"
  );

  const loadData = async () => {
    try {
      setError("");
      setLoading(true);
      const plansResponse = await SubscriptionService.getPlans();
      const plansList = plansResponse.data?.results || plansResponse.data || [];
      setPlans(Array.isArray(plansList) ? plansList : []);

      const subscriptionResponse = await SubscriptionService.getMySubscriptions();
      const subList = subscriptionResponse.data?.results || subscriptionResponse.data || [];
      setSubscriptions(Array.isArray(subList) ? subList : []);
    } catch (err) {
      console.error("Failed loading subscription data:", err);
      setError("Failed to load subscription information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubscribe = async (planId) => {
    if (purchasingPlanId) return;

    setPurchasingPlanId(planId);
    try {
      const response = await SubscriptionService.purchaseSubscription(planId, autoRenew);
      const paymentUrl = response.data?.payment_url;

      if (paymentUrl) {
        notificationRef.current?.showNotif("Redirecting to payment gateway...", "info");
        window.location.href = paymentUrl;
      } else {
        notificationRef.current?.showNotif("Subscription activated successfully!", "success");
        await loadData();
      }
    } catch (err) {
      console.error("Failed purchasing subscription:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Could not initiate subscription purchase.";
      notificationRef.current?.showNotif(msg, "error");
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const openCancelModal = (sub) => {
    setSubToCancel(sub);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (cancelling) return;
    setCancelModalOpen(false);
    setSubToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!subToCancel || cancelling) return;

    setCancelling(true);
    try {
      await SubscriptionService.cancelSubscription(subToCancel.id);
      notificationRef.current?.showNotif("Subscription has been cancelled.", "success");
      closeCancelModal();
      await loadData();
    } catch (err) {
      console.error("Failed cancelling subscription:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        "Failed to cancel subscription.";
      notificationRef.current?.showNotif(msg, "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="dashboard-subscription-embed">
      <div className="subscription-hero" style={{ textAlign: "left", marginBottom: "24px" }}>
        <h2 className="sub-main-title" style={{ margin: 0, color: "#fff", fontSize: "1.4rem", fontWeight: 700 }}>
          💎 VIP Subscription & Reader Plans
        </h2>
        <p className="sub-main-subtitle" style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
          Unlock exclusive percentage discounts on all digital and audiobooks with an active VIP membership.
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
          <button type="button" onClick={loadData} className="sub-retry-btn">
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
                      day: "numeric"
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
                      day: "numeric"
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
                onChange={(e) => setAutoRenew(e.target.checked)}
              />
              <span>Automatically renew subscription each month</span>
            </label>
            <p className="auto-renew-help">
              {autoRenew
                ? "Your subscription will automatically extend at the end of each billing cycle."
                : "Auto-renew is off. Your benefits will expire at the end of the current term."}
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

                  <div className="plan-price-wrap">
                    <span className="plan-price-val">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="plan-duration">/ {plan.duration_days} days</span>
                  </div>

                  {plan.description && (
                    <p className="plan-desc">{plan.description}</p>
                  )}

                  <ul className="plan-features-list">
                    <li>
                      <i className="fa-solid fa-check"></i>
                      <span>
                        <strong>{plan.digital_discount_percent}% discount</strong> on all digital titles
                      </span>
                    </li>
                    <li>
                      <i className="fa-solid fa-check"></i>
                      <span>Full access to licensed online reader</span>
                    </li>
                    <li>
                      <i className="fa-solid fa-check"></i>
                      <span>Audiobook streaming privileges</span>
                    </li>
                    <li>
                      <i className="fa-solid fa-check"></i>
                      <span>Valid for {plan.duration_days} days</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="plan-cta-btn"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || isBusy}
                  >
                    {isBusy ? (
                      <span>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </span>
                    ) : isCurrent ? (
                      "Active Plan"
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="sub-modal-backdrop" onClick={closeCancelModal}>
          <div
            className="sub-modal-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div className="sub-modal-header">
              <h3 id="cancel-modal-title">Cancel Subscription?</h3>
              <button
                type="button"
                className="sub-modal-close-btn"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                &times;
              </button>
            </div>

            <div className="sub-modal-body">
              <p>
                Are you sure you want to cancel your{" "}
                <strong>{subToCancel?.plan?.name}</strong> subscription?
              </p>
              <p className="sub-modal-warning">
                Your benefits will remain active until the end of the current term on{" "}
                <strong>
                  {subToCancel?.end_date
                    ? new Date(subToCancel.end_date).toLocaleDateString()
                    : "the expiration date"}
                </strong>
                . After that, your digital discount will no longer apply.
              </p>
            </div>

            <div className="sub-modal-actions">
              <button
                type="button"
                className="sub-modal-keep-btn"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                className="sub-modal-confirm-cancel-btn"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <span>
                    <i className="fas fa-spinner fa-spin"></i> Cancelling...
                  </span>
                ) : (
                  "Yes, Cancel It"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Notification ref={notificationRef} />
    </div>
  );
}
