import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { useLanguage } from '../../Context/LanguageContext';
import { ThemeToggle } from '../../Components/common/ThemeToggle';
import { LanguageToggle } from '../../Components/common/LanguageToggle';
import Notification from '../../Components/feature/Notification';
import '../../Styles/components/Login.css';
import '../../Styles/components/Signup.css';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const navigate = useNavigate();
  const { signup, setError, error, clearError } = useAuth();
  const { t, isPersian } = useLanguage();
  const notificationRef = useRef(null);

  // Form State (no age field)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-clear global context error
  useEffect(() => {
    if (error) clearError();
    return () => {
      if (error) clearError();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Input Changes
  const handleChange = useCallback(
    (e) => {
      if (error) clearError();
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [error, clearError]
  );

  // Password criteria verification
  const criteria = useMemo(() => {
    const p = formData.password || '';
    return {
      length: p.length >= MIN_PASSWORD_LENGTH,
      lowercase: /[a-z]/.test(p),
      uppercase: /[A-Z]/.test(p),
      number: /[0-9]/.test(p),
      symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
    };
  }, [formData.password]);

  // Compute password score (0-4)
  const strengthScore = useMemo(() => {
    if (!formData.password) return 0;
    let score = 0;
    if (criteria.length) score += 1;
    if (criteria.lowercase && criteria.uppercase) score += 1;
    if (criteria.number) score += 1;
    if (criteria.symbol) score += 1;
    return score;
  }, [formData.password, criteria]);

  const strengthMeta = useMemo(() => {
    switch (strengthScore) {
      case 1:
        return { label: 'Weak', color: '#ff4757' };
      case 2:
        return { label: 'Fair', color: '#ffa502' };
      case 3:
        return { label: 'Good', color: '#eccc68' };
      case 4:
        return { label: 'Strong', color: '#2ed573' };
      default:
        return { label: 'Too short', color: '#6e7681' };
    }
  }, [strengthScore]);

  // Form Validation
  const isPasswordsMatch =
    formData.password &&
    formData.password2 &&
    formData.password === formData.password2;

  const isFormValid =
    formData.name.trim().length >= 3 &&
    EMAIL_REGEX.test(formData.email.trim()) &&
    formData.password.length >= MIN_PASSWORD_LENGTH &&
    isPasswordsMatch;

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, password2 } = formData;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Validation checks
    if (!trimmedName || !trimmedEmail || !password || !password2) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please complete all fields.', 'error');
      }
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please enter a valid email address.', 'error');
      }
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      if (notificationRef.current) {
        notificationRef.current.showNotif(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
          'error'
        );
      }
      return;
    }

    if (password !== password2) {
      if (notificationRef.current) {
        notificationRef.current.showNotif('Passwords do not match.', 'error');
      }
      return;
    }

    setSubmitting(true);
    try {
      const success = await signup(trimmedName, trimmedEmail, password, password2);
      if (success) {
        if (notificationRef.current) {
          notificationRef.current.showNotif(
            'Account created successfully! Please sign in.',
            'success',
            { navigateTo: '/login' }
          );
        } else {
          navigate('/login');
        }
      } else {
        if (notificationRef.current) {
          notificationRef.current.showNotif(error || 'Signup failed. Please try again.', 'error');
        }
      }
    } catch {
      setError('Registration failed. Username or email may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-card">
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
          <h1 className="auth-main-title">{t("auth.signupTitle", "Create an Account")}</h1>
          <p className="auth-subtitle">
            {t("auth.signupSubtitle", "Join Bookkadeh to read, listen, and collect your favorite books.")}
          </p>
        </div>

        {/* Inline Error Notice */}
        {error && (
          <div className="auth-inline-alert error">
            <i className="fas fa-exclamation-circle" style={{ marginTop: 2 }}></i>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-username">
              Username
            </label>
            <div className="auth-input-wrapper">
              <i className="fas fa-user auth-input-icon"></i>
              <input
                id="signup-username"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. alex_reader"
                required
                className="auth-input"
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-email">
              {t("auth.email", "Email Address")}
            </label>
            <div className="auth-input-wrapper">
              <i className="fas fa-envelope auth-input-icon"></i>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="auth-input"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-password">
              {t("auth.password", "Password")}
            </label>
            <div className="auth-input-wrapper">
              <i className="fas fa-lock auth-input-icon"></i>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                className="auth-input has-toggle"
                autoComplete="new-password"
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

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="signup-strength-container">
                <div className="signup-strength-header">
                  <span>Strength:</span>
                  <span
                    className="signup-strength-label"
                    style={{ color: strengthMeta.color }}
                  >
                    {strengthMeta.label}
                  </span>
                </div>
                <div className="signup-strength-bar">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="signup-strength-segment"
                      style={{
                        backgroundColor:
                          seg <= strengthScore ? strengthMeta.color : 'rgba(255, 255, 255, 0.08)',
                      }}
                    />
                  ))}
                </div>
                <div className="signup-criteria-list">
                  <span className={`signup-criteria-badge ${criteria.length ? 'met' : ''}`}>
                    <i className={criteria.length ? 'fas fa-check' : 'fas fa-circle'}></i>
                    8+ chars
                  </span>
                  <span className={`signup-criteria-badge ${criteria.uppercase ? 'met' : ''}`}>
                    <i className={criteria.uppercase ? 'fas fa-check' : 'fas fa-circle'}></i>
                    Uppercase
                  </span>
                  <span className={`signup-criteria-badge ${criteria.lowercase ? 'met' : ''}`}>
                    <i className={criteria.lowercase ? 'fas fa-check' : 'fas fa-circle'}></i>
                    Lowercase
                  </span>
                  <span className={`signup-criteria-badge ${criteria.number ? 'met' : ''}`}>
                    <i className={criteria.number ? 'fas fa-check' : 'fas fa-circle'}></i>
                    Number
                  </span>
                  <span className={`signup-criteria-badge ${criteria.symbol ? 'met' : ''}`}>
                    <i className={criteria.symbol ? 'fas fa-check' : 'fas fa-circle'}></i>
                    Symbol
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-password-repeat">
              {t("auth.confirmPassword", "Confirm Password")}
            </label>
            <div className="auth-input-wrapper">
              <i className="fas fa-lock auth-input-icon"></i>
              <input
                id="signup-password-repeat"
                type={showConfirmPassword ? 'text' : 'password'}
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                className="auth-input has-toggle"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-pass-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>

            {/* Live Password Match Status */}
            {formData.password2 && (
              <div
                className={`signup-match-status ${isPasswordsMatch ? 'valid' : 'invalid'}`}
              >
                <i
                  className={
                    isPasswordsMatch
                      ? 'fas fa-check-circle'
                      : 'fas fa-times-circle'
                  }
                ></i>
                <span>
                  {isPasswordsMatch
                    ? t("auth.passwordsMatch", "Passwords match")
                    : t("auth.passMismatch", "Passwords do not match")}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting || !isFormValid}
            style={{ marginTop: '1.25rem' }}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>{t("common.loading", "Creating Account...")}</span>
              </>
            ) : (
              <>
                <span>{t("auth.signupTitle", "Create Account")}</span>
                <i className="fas fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="auth-card-footer">
          {t("auth.haveAccount", "Already have an account?")}
          <Link to="/login">{t("nav.login", "Sign In here")}</Link>
        </div>
      </div>

      <Notification ref={notificationRef} />
    </div>
  );
}
