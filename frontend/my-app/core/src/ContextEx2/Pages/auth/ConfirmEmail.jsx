import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useLanguage } from '../../Context/LanguageContext';
import AuthService from '../../Services/AuthService';
import Notification from '../../Components/feature/Notification';
import '../../Styles/components/Login.css';
import '../../Styles/components/ConfirmEmail.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ConfirmEmail() {
  const { error, setError, clearError } = useAuth();
  const { t } = useLanguage();
  const notificationRef = useRef(null);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-clear global context error
  useEffect(() => {
    if (error) clearError();
    return () => {
      if (error) clearError();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) clearError();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please enter your email address.', 'error');
      }
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please enter a valid email address.', 'error');
      }
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.requestPasswordReset({
        email: trimmedEmail,
      });

      setSubmittedEmail(trimmedEmail);
      setSuccess(true);
      if (notificationRef.current) {
        notificationRef.current.showNotif('Password reset link dispatched.', 'success');
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        'Failed to request password reset. Please verify the email.';
      setError(msg);
      if (notificationRef.current) {
        notificationRef.current.showNotif(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="confirm-page-wrapper">
      <div className="confirm-card">
        {/* Navigation Header */}
        <div className="auth-header-nav">
          <Link to="/home" className="auth-back-btn" title={t("reader.store", "Back to Bookstore")}>
            <i className="fas fa-arrow-left"></i>
            <span>{t("common.back", "Back to Store")}</span>
          </Link>
          <Link to="/home" className="auth-brand">
            Page<span>Net</span>
          </Link>
        </div>

        {/* Brand Icon */}
        <div className="confirm-icon-circle">
          <i className="fas fa-key"></i>
        </div>

        {/* Title Section */}
        <div className="auth-title-section">
          <h1 className="auth-main-title">{t("auth.resetPassword", "Reset Your Password")}</h1>
          <p className="auth-subtitle">
            Enter your account email address and we will dispatch a secure link to reset your password.
          </p>
        </div>

        {/* Inline Error */}
        {error && (
          <div className="auth-inline-alert error">
            <i className="fas fa-exclamation-circle" style={{ marginTop: 2 }}></i>
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {success ? (
          <div className="confirm-success-box">
            <i className="fas fa-check-circle confirm-success-icon"></i>
            <h2 className="confirm-success-title">Reset Link Sent</h2>
            <p className="confirm-success-text">
              If an account is associated with <strong>{submittedEmail}</strong>, we have dispatched a password reset link.
              Please check your inbox (and spam or junk folder).
            </p>
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              style={{ marginTop: '1.25rem' }}
            >
              <i className="fas fa-redo"></i>
              <span>Send another request</span>
            </button>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reset-email">
                {t("auth.email", "Registered Email Address")}
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-envelope auth-input-icon"></i>
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) clearError();
                  }}
                  placeholder="name@example.com"
                  required
                  className="auth-input"
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || !email.trim()}
              style={{ marginTop: '0.75rem' }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>{t("common.loading", "Sending Link...")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.sendResetLink", "Send Reset Link")}</span>
                  <i className="fas fa-paper-plane"></i>
                </>
              )}
            </button>
          </form>
        )}

        {/* Alternative Links */}
        <div className="confirm-alt-links">
          <Link to="/login?mode=otp" className="confirm-alt-link">
            <i className="fas fa-shield-alt"></i>
            <span>{t("auth.modeOtp", "Sign in with an OTP code instead")}</span>
          </Link>
          <Link to="/login" className="confirm-subtle-link">
            {t("auth.haveAccount", "Remember your password? Back to Login")}
          </Link>
        </div>
      </div>

      <Notification ref={notificationRef} />
    </div>
  );
}