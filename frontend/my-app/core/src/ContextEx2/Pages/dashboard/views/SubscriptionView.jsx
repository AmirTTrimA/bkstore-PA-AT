import React, { useRef, useState } from "react";
import { useLanguage } from "../../../Context/LanguageContext";
import Notification from "../../../Components/feature/Notification";
import { formatPrice } from "../../../utils/formatPrice";
import {
  useSubscriptionPlans,
  useMySubscriptions,
  usePurchaseSubscription,
  useUpgradeSubscription,
  useCancelSubscription,
} from "../../../Hooks/queries";

import "../../../Styles/components/Subscription.css";

const extractErrorMessage = (err, fallback = "Subscription action failed.") => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (Array.isArray(data.wallet) && data.wallet.length) return data.wallet[0];
  if (typeof data.wallet === "string") return data.wallet;
  if (Array.isArray(data.subscription) && data.subscription.length) return data.subscription[0];
  if (typeof data.subscription === "string") return data.subscription;
  if (Array.isArray(data.plan) && data.plan.length) return data.plan[0];
  if (typeof data.plan === "string") return data.plan;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return data.non_field_errors[0];
  return fallback;
};

export default function SubscriptionView() {
  const { t } = useLanguage();
  const notificationRef = useRef(null);

  const [autoRenew, setAutoRenew] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [subToCancel, setSubToCancel] = useState(null);

  // React Query domain hooks
  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useSubscriptionPlans();

  const {
    data: subscriptions = [],
    isLoading: subsLoading,
    error: subsError,
    refetch: refetchSubs,
  } = useMySubscriptions();

  const purchaseMutation = usePurchaseSubscription();
  const upgradeMutation = useUpgradeSubscription();
  const cancelMutation = useCancelSubscription();

  const loading = plansLoading || subsLoading;
  const error = plansError || subsError;

  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "ACTIVE"
  );

  const reservedSubscription = subscriptions.find(
    (sub) => sub.status === "RESERVED"
  );

  const handlePlanAction = async (plan) => {
    if (purchasingPlanId) return;

    const isCurrent = activeSubscription?.plan?.id === plan.id;
    if (isCurrent) return;

    setPurchasingPlanId(plan.id);

    try {
      // If user has an active subscription and chooses a higher tier, call upgrade
      const canUpgrade =
        activeSubscription &&
        Number(plan.tier) > Number(activeSubscription.plan?.tier || 0);

      if (canUpgrade) {
        await upgradeMutation.mutateAsync({ plan_id: plan.id });
        notificationRef.current?.showNotif(
          t("library.upgradedSuccess", "Subscription upgraded successfully!"),
          "success"
        );
      } else {
        const payload = {
          plan_id: plan.id,
          auto_renew: autoRenew,
        };
        await purchaseMutation.mutateAsync(payload);
        const successMsg = activeSubscription
          ? t("library.scheduledSuccess", "Subscription scheduled successfully for when your current term ends!")
          : t("library.activatedSuccess", "Subscription activated successfully!");
        notificationRef.current?.showNotif(successMsg, "success");
      }
    } catch (err) {
      console.error("Subscription purchase/upgrade error:", err);
      const msg = extractErrorMessage(
        err,
        t("library.purchaseFailed", "Could not complete subscription transaction.")
      );
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
    if (cancelMutation.isPending) return;
    setCancelModalOpen(false);
    setSubToCancel(null);
  };

  const handleConfirmCancel = async () => {
    if (!subToCancel || cancelMutation.isPending) return;

    try {
      const res = await cancelMutation.mutateAsync({
        subscription_id: subToCancel.id,
        refund: true,
      });

      const refundAmount = res?.data?.refunded_amount || res?.refunded_amount;
      const refundMsg =
        Number(refundAmount) > 0
          ? t("library.cancelRefundSuccess", "Subscription cancelled. {amount} refunded to your wallet.", {
              amount: formatPrice(refundAmount),
            })
          : t("library.cancelSuccess", "Subscription cancelled successfully.");

      notificationRef.current?.showNotif(refundMsg, "success");
      closeCancelModal();
    } catch (err) {
      console.error("Failed cancelling subscription:", err);
      const msg = extractErrorMessage(
        err,
        t("library.cancelFailed", "Failed to cancel subscription.")
      );
      notificationRef.current?.showNotif(msg, "error");
    }
  };

  const handleRetry = () => {
    refetchPlans();
    refetchSubs();
  };

  return (
    <div className="dashboard-subscription-embed">
      {/* Header section with responsive, theme-adaptive titles */}
      <div className="subscription-hero">
        <h2 className="sub-main-title">
          💎 {t("library.vipPlans", "VIP Subscription & Reader Plans")}
        </h2>
        <p className="sub-main-subtitle">
          {t(
            "library.vipSubtitle",
            "Unlock exclusive percentage discounts on all digital and audiobooks with an active VIP membership."
          )}
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
          <p>{error?.message || t("common.failedLoading", "Failed to load subscription information.")}</p>
          <button type="button" onClick={handleRetry} className="sub-retry-btn">
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
                  <span className="sub-status-pill active">
                    {t("library.activeMembership", "Active Membership")}
                  </span>
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
                  <span className="sub-status-pill reserved">
                    {t("library.scheduledPlan", "Scheduled Plan")}
                  </span>
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

          {/* Auto-renew checkbox card */}
          <div className="auto-renew-card">
            <label className="auto-renew-label">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
              />
              <span>{t("library.autoRenewMonthly", "Automatically renew subscription each month")}</span>
            </label>
            <p className="auto-renew-help">
              {autoRenew
                ? t(
                    "library.autoRenewOnHelp",
                    "Your subscription will automatically extend at the end of each billing cycle."
                  )
                : t(
                    "library.autoRenewOffHelp",
                    "Auto-renew is off. Your benefits will expire at the end of the current term."
                  )}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="plans-grid">
            {plans.map((plan, index) => {
              const isCurrent = activeSubscription?.plan?.id === plan.id;
              const isBusy = purchasingPlanId === plan.id;
              const canUpgrade =
                activeSubscription &&
                Number(plan.tier) > Number(activeSubscription.plan?.tier || 0);

              return (
                <div
                  key={plan.id}
                  className={`plan-card plan-tier-${(index % 3) + 1} ${
                    isCurrent ? "current-tier" : ""
                  }`}
                >
                  {isCurrent && (
                    <span className="current-plan-badge">
                      {t("library.currentPlan", "Current Plan")}
                    </span>
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
                      {formatPrice(plan.monthly_price ?? plan.price)}
                    </span>
                    <span className="plan-price-unit">/ {t("library.month", "month")}</span>
                  </div>

                  {plan.description && <p className="plan-desc">{plan.description}</p>}

                  <ul className="plan-perks-list">
                    <li>
                      <i className="fa-solid fa-check"></i>
                      <span>
                        <strong>{plan.digital_discount_percent}% discount</strong> on all digital & audiobook titles
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
                      <span>30-day billing cycle with auto-renewal support</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="plan-action-btn"
                    onClick={() => handlePlanAction(plan)}
                    disabled={isCurrent || isBusy}
                  >
                    {isBusy ? (
                      <span>
                        <i className="fas fa-spinner fa-spin"></i> {t("common.processing", "Processing...")}
                      </span>
                    ) : isCurrent ? (
                      t("library.activePlan", "Active Plan")
                    ) : canUpgrade ? (
                      t("library.upgradePlan", "Upgrade to this Plan")
                    ) : (
                      t("library.subscribeNow", "Subscribe Now")
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
        <div className="modal-backdrop" onClick={closeCancelModal}>
          <div
            className="cancel-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div className="cancel-modal-header">
              <h3 id="cancel-modal-title">
                {t("library.cancelConfirmTitle", "Cancel Subscription?")}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeCancelModal}
                disabled={cancelMutation.isPending}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="cancel-modal-body">
              <div className="cancel-modal-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p className="cancel-modal-text">
                {t(
                  "library.cancelConfirmDesc",
                  `Are you sure you want to cancel your ${subToCancel?.plan?.name || "active"} subscription?`
                )}
              </p>
              <p className="sub-modal-warning">
                {t(
                  "library.cancelConfirmWarning",
                  `Your benefits will remain active until the end of the current billing term on ${
                    subToCancel?.end_date
                      ? new Date(subToCancel.end_date).toLocaleDateString()
                      : "the expiration date"
                  }. Unused days will be credited to your wallet.`
                )}
              </p>
            </div>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="modal-btn-dismiss"
                onClick={closeCancelModal}
                disabled={cancelMutation.isPending}
              >
                {t("library.keepSubscription", "Keep Subscription")}
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <span>
                    <i className="fas fa-spinner fa-spin"></i> {t("library.cancelling", "Cancelling...")}
                  </span>
                ) : (
                  t("library.confirmCancelBtn", "Yes, Cancel It")
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
