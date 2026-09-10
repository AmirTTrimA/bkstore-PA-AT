import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useLanguage } from '../../Context/LanguageContext';
import { ThemeToggle } from '../../Components/common/ThemeToggle';
import { LanguageToggle } from '../../Components/common/LanguageToggle';
import Notification from '../../Components/feature/Notification';
import '../../Styles/components/Login.css';

const OTP_COUNTDOWN_SECONDS = 60;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isPersian } = useLanguage();
  const notificationRef = useRef(null);
  const digitInputRefs = useRef([]);

  // Auth Context
  const { login, loginWithOtp, requestOtp, error, clearError } = useAuth();

  // Mode check from URL search query: /login?mode=otp
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'otp' ? 'otp' : 'password';

  // State
  const [loginMode, setLoginMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // OTP State
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: request, 2: verify
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-clear global context error on mode change or unmount
  useEffect(() => {
    if (error) clearError();
    return () => {
      if (error) clearError();
    };
  }, [loginMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle standard password form input changes
  const handleChange = useCallback((e) => {
    if (error) clearError();
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, [error, clearError]);

  // Handle standard password submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const usableName = formData.name.trim();
    const usablePassword = formData.password;

    if (!usableName || !usablePassword) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please fill in all fields', 'error');
      }
      return;
    }

    setSubmitting(true);
    try {
      const success = await login(usableName, usablePassword);
      if (success) {
        if (notificationRef.current) {
          notificationRef.current.showNotif('Signed in successfully!', 'success', {
            navigateTo: '/dashboard',
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        if (notificationRef.current) {
          notificationRef.current.showNotif(error || 'Invalid username or password', 'error');
        }
      }
    } catch {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Login failed. Please check your credentials.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // OTP Step 1: Request code
  const handleRequestOtp = async () => {
    const id = (otpIdentifier || formData.name).trim();
    if (!id) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please enter your username or email', 'error');
      }
      return;
    }

    setOtpLoading(true);
    if (error) clearError();

    const res = await requestOtp(id);
    setOtpLoading(false);

    if (res.success) {
      setOtpStep(2);
      setCountdown(OTP_COUNTDOWN_SECONDS);
      if (notificationRef.current) {
        notificationRef.current.showNotif(res.detail || 'Verification code sent!', 'success');
      }
      // Focus the first digit input
      setTimeout(() => {
        if (digitInputRefs.current[0]) {
          digitInputRefs.current[0].focus();
        }
      }, 100);
    } else {
      if (notificationRef.current) {
        notificationRef.current.showNotif(res.error || 'Failed to send OTP code', 'error');
      }
    }
  };

  // OTP Step 2: Handle individual digit entry
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasteData.length, 5);
    digitInputRefs.current[nextIndex]?.focus();
  };

  // OTP Step 2: Verify code submission
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please enter the complete 6-digit code', 'error');
      }
      return;
    }

    const id = (otpIdentifier || formData.name).trim();
    setOtpLoading(true);
    if (error) clearError();

    const success = await loginWithOtp(id, code);
    setOtpLoading(false);

    if (success) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Signed in successfully!', 'success', {
          navigateTo: '/dashboard',
        });
      } else {
        navigate('/dashboard');
      }
    } else {
      if (notificationRef.current) {
        notificationRef.current.showNotif(error || 'Invalid or expired OTP code', 'error');
      }
    }
  };

  const isPasswordFormValid = formData.name.trim() && formData.password;
  const isOtpCodeComplete = otpDigits.every((d) => d !== '');

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Navigation & Brand Header */}
        <div className="auth-header-nav">
          <Link to="/home" className="auth-back-btn" title={isPersian ? 'بازگشت به فروشگاه' : 'Back to Store'}>
            <i className={isPersian ? 'fas fa-arrow-right' : 'fas fa-arrow-left'}></i>
            <span>{isPersian ? 'بازگشت به فروشگاه' : 'Back to Store'}</span>
          </Link>
          <div className="auth-header-controls">
            <ThemeToggle page="auth" />
            <LanguageToggle page="auth" />
            <Link to="/home" className="auth-brand">
              Book<span>kadeh</span>
            </Link>
          </div>
        </div>

        {/* Title Section */}
        <div className="auth-title-section">
          <h1 className="auth-main-title">{t("auth.loginTitle", "Welcome Back")}</h1>
          <p className="auth-subtitle">
            {t("auth.loginSubtitle", "Sign in to access your digital library, bookmarks, and purchases.")}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${loginMode === 'password' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('password');
              if (error) clearError();
            }}
          >
            <i className="fas fa-key"></i>
            {t("auth.modePassword", "Password")}
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${loginMode === 'otp' ? 'active' : ''}`}
            onClick={() => {
              setLoginMode('otp');
              if (error) clearError();
            }}
          >
            <i className="fas fa-shield-alt"></i>
            {t("auth.modeOtp", "OTP Code")}
          </button>
        </div>

        {/* Inline Error Notice if present */}
        {error && (
          <div className="auth-inline-alert error">
            <i className="fas fa-exclamation-circle" style={{ marginTop: 2 }}></i>
            <span>{error}</span>
          </div>
        )}

        {/* PASSWORD LOGIN FORM */}
        {loginMode === 'password' ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-username">
                {t("auth.username", "Username or Email")}
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-user auth-input-icon"></i>
                <input
                  id="login-username"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  required
                  className="auth-input"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-password">
                {t("auth.password", "Password")}
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="auth-input has-toggle"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-toggle-pass-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <div className="auth-actions-row">
              <Link to="/confirmemail" className="auth-link">
                {t("auth.forgotPassword", "Forgot password?")}
              </Link>
              <Link to="/signup" className="auth-link">
                {t("auth.noAccount", "Need an account?")}
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={submitting || !isPasswordFormValid}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>{t("common.loading", "Signing In...")}</span>
                </>
              ) : (
                <>
                  <span>{t("nav.login", "Sign In")}</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>
        ) : (
          /* OTP LOGIN FLOW */
          <div className="auth-otp-flow">
            {otpStep === 1 ? (
              <div>
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="otp-identifier">
                    Username or Email
                  </label>
                  <div className="auth-input-wrapper">
                    <i className="fas fa-envelope auth-input-icon"></i>
                    <input
                      id="otp-identifier"
                      type="text"
                      name="otpIdentifier"
                      value={otpIdentifier || formData.name}
                      onChange={(e) => {
                        setOtpIdentifier(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="Enter your username or email"
                      required
                      className="auth-input"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <p className="auth-subtitle" style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                  We will send a one-time 6-digit verification code to your registered email address.
                </p>

                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={handleRequestOtp}
                  disabled={otpLoading || !(otpIdentifier || formData.name).trim()}
                >
                  {otpLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>{t("common.loading", "Sending Code...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.requestOtp", "Send Verification Code")}</span>
                      <i className="fas fa-paper-plane"></i>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  Enter the 6-digit code sent to{' '}
                  <strong style={{ color: '#fff' }}>{otpIdentifier || formData.name}</strong>:
                </p>

                <div className="auth-otp-grid" onPaste={handleDigitPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (digitInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="auth-otp-digit"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="auth-otp-meta">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    className="auth-resend-btn"
                    onClick={handleRequestOtp}
                    disabled={countdown > 0 || otpLoading}
                  >
                    {countdown > 0 ? t("auth.resendIn", `Resend in ${countdown}s`, { seconds: countdown }) : t("auth.resendOtp", "Resend Code")}
                  </button>
                </div>

                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || !isOtpCodeComplete}
                >
                  {otpLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>{t("common.loading", "Verifying...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.verifyOtp", "Verify & Sign In")}</span>
                      <i className="fas fa-check"></i>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="auth-btn-secondary"
                  onClick={() => {
                    setOtpStep(1);
                    setOtpDigits(['', '', '', '', '', '']);
                    if (error) clearError();
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  <span>Use a different username/email</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Card Footer */}
        <div className="auth-card-footer">
          Don't have an account?
          <Link to="/signup">Create one here</Link>
        </div>
      </div>

      <Notification ref={notificationRef} />
    </div>
  );
}