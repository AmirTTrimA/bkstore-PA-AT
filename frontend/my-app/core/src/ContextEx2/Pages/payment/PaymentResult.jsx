import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../../Components/Navbar";
import BottomNav from "../../Components/common/BottomNav";
import Footer from "../../Components/Footer";
import { useLanguage } from "../../Context/LanguageContext";
import { formatPrice } from "../../utils/formatPrice";

import "../../Styles/components/PaymentResult.css";

// ============================================
//    Main PaymentResult Component
// ============================================

export default function PaymentResult() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();

    const status = searchParams.get("status");
    const isSuccess = status === "success" || status === "OK";
    const refId = searchParams.get("ref_id") || searchParams.get("track_id");
    const amount = searchParams.get("amount");

    useEffect(() => {
        if (isSuccess) {
            console.log("Payment completed successfully.");
        }
    }, [isSuccess]);

    return (
        <div className="payment-result-page-root">
            <Navbar />

            <div className="payment-result-container">
                {/* Top Navigation Bar */}
                <div className="payment-top-bar">
                    <button
                        type="button"
                        className="payment-back-btn"
                        onClick={() => navigate("/dashboard")}
                        title={t("payment.backToDashboard", "Return to user dashboard")}
                    >
                        ← {t("payment.backToDashboard", "Back to Dashboard")}
                    </button>

                    <div className="payment-breadcrumbs">
                        <Link to="/home">{t("nav.home", "Home")}</Link>
                        <span>/</span>
                        <Link to="/dashboard">{t("nav.dashboard", "Dashboard")}</Link>
                        <span>/</span>
                        <span className="current">{t("payment.title", "Payment Result")}</span>
                    </div>
                </div>

                {/* Status Card */}
                <div className="payment-card-wrap">
                    <div
                        className={`payment-result-card ${
                            isSuccess
                                ? "payment-result-success"
                                : "payment-result-failed"
                        }`}
                    >
                        {/* Status Icon */}
                        <div className="payment-result-icon">
                            {isSuccess ? "✓" : "!"}
                        </div>

                        {/* Title */}
                        <h1 className="payment-result-title">
                            {isSuccess
                                ? t("payment.successTitle", "Payment Successful!")
                                : t("payment.failedTitle", "Payment Failed or Cancelled")}
                        </h1>

                        {/* Message */}
                        <p className="payment-result-message">
                            {isSuccess
                                ? t("payment.successDesc", "Your wallet has been topped up successfully and the transaction has been recorded.")
                                : t("payment.failedDesc", "Your payment could not be completed by the banking gateway. No funds were charged.")}
                        </p>

                        {/* Optional Reference Details */}
                        {(refId || amount) && (
                            <div className="payment-details-box">
                                {refId && (
                                    <div className="payment-detail-row">
                                        <span>{t("payment.refId", "Reference ID:")}</span>
                                        <strong>{refId}</strong>
                                    </div>
                                )}
                                {amount && (
                                    <div className="payment-detail-row">
                                        <span>{t("payment.amount", "Amount:")}</span>
                                        <strong className="amount-highlight">
                                            {formatPrice(amount)}
                                        </strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="payment-actions-row">
                            <button
                                type="button"
                                className="payment-primary-btn"
                                onClick={() => navigate("/dashboard")}
                            >
                                {t("payment.goToDashboard", "Go to Dashboard")}
                            </button>

                            {isSuccess ? (
                                <button
                                    type="button"
                                    className="payment-secondary-btn"
                                    onClick={() => navigate("/library")}
                                >
                                    {t("payment.exploreBooks", "Explore Books")}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="payment-secondary-btn"
                                    onClick={() => navigate("/basket")}
                                >
                                    {t("payment.returnToCart", "Return to Cart")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}