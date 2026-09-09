import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AuthService from '../../Services/AuthService';
import Notification from '../../Components/feature/Notification';
import { useLanguage } from '../../Context/LanguageContext';
import '../../Styles/components/Login.css';
import '../../Styles/components/Forgetpass.css';

const MIN_PASSWORD_LENGTH = 8;

export default function Forgetpass() {
  const { t, isPersian } = useLanguage();
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const notificationRef = useRef(null);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isTokenMissing = !uid || !token;

  // Auto-redirect to login upon success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const isPasswordsMatch = password && password2 && password === password2;
  const isFormValid = password.length >= MIN_PASSWORD_LENGTH && isPasswordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !password2) {
      setError('Please fill in both password fields.');
      if (notificationRef.current) {
        notificationRef.current.showNotif('Please fill in both password fields.', 'error');
      }
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      if (notificationRef.current) {
        notificationRef.current.showNotif(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          'error'
        );
      }
      return;
    }

    if (password !== password2) {
      setError('Passwords do not match.');
      if (notificationRef.current) {
        notificationRef.current.showNotif('Passwords do not match.', 'error');
      }
      return;
    }

    if (isTokenMissing) {
      setError('Invalid or incomplete password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.confirmPasswordReset({
        uid,
        token,
        new_password1: password,
        new_password2: password2,
      });

      setSuccess(true);
      if (notificationRef.current) {
        notificationRef.current.showNotif(
          'Password reset successfully! Redirecting to login...',
          'success'
        );
      }
    } catch (err) {
      const responseData = err.response?.data;
      let errorMsg = 'Failed to reset password. The link may have expired.';

      if (responseData) {
        if (typeof responseData === 'string') {
          errorMsg = responseData;
        } else if (responseData.detail) {
          errorMsg = responseData.detail;
        } else if (responseData.new_password1) {
          errorMsg = Array.isArray(responseData.new_password1)
            ? responseData.new_password1[0]
            : responseData.new_password1;
        } else if (responseData.token) {
          errorMsg = Array.isArray(responseData.token)
            ? responseData.token[0]
            : responseData.token;
        }
      }

      setError(errorMsg);
      if (notificationRef.current) {
        notificationRef.current.showNotif(errorMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgetpass-page-wrapper">
      <div className="forgetpass-card">
        {/* Navigation Header */}
        <div className="auth-header-nav">
          <Link to="/home" className="auth-back-btn" title={isPersian ? 'بازگشت به فروشگاه' : 'Back to Store'}>
            <i className={isPersian ? 'fas fa-arrow-right' : 'fas fa-arrow-left'}></i>
            <span>{isPersian ? 'بازگشت به فروشگاه' : 'Back to Store'}</span>
          </Link>
          <Link to="/home" className="auth-brand">
            Page<span>Net</span>
          </Link>
        </div>

        {/* Brand Icon */}
        <div className="forgetpass-icon-circle">
          <i className="fas fa-shield-alt"></i>
        </div>

        {/* Title Section */}
        <div className="auth-title-section">
          <h1 className="auth-main-title">{t('auth.setNewPassword')}</h1>
          <p className="auth-subtitle">
            {t('auth.setNewPasswordSubtitle')}
          </p>
        </div>

        {/* Missing Token Banner */}
        {isTokenMissing ? (
          <div className="forgetpass-missing-token">
            <i className="fas fa-exclamation-triangle forgetpass-missing-icon"></i>
            <h2 className="forgetpass-missing-title">{t('auth.missingLinkTitle')}</h2>
            <p className="forgetpass-missing-text">
              {t('auth.missingLinkText')}
            </p>
            <Link
              to="/confirmemail"
              className="auth-submit-btn"
              style={{ marginTop: '1.25rem', textDecoration: 'none' }}
            >
              <span>{t('auth.requestResetLink')}</span>
              <i className={isPersian ? 'fas fa-arrow-left' : 'fas fa-arrow-right'}></i>
            </Link>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/login" className="confirm-subtle-link">
                {t('auth.returnToLogin')}
              </Link>
            </div>
          </div>
        ) : success ? (
          /* Success Banner */
          <div className="forgetpass-success-box">
            <i className="fas fa-check-circle forgetpass-success-icon"></i>
            <h2 className="forgetpass-success-title">{t('auth.resetSuccessTitle')}</h2>
            <p className="forgetpass-success-text">
              {t('auth.resetSuccessText')}
            </p>
            <Link
              to="/login"
              className="auth-submit-btn"
              style={{ marginTop: '1.25rem', textDecoration: 'none' }}
            >
              <span>{t('auth.goToSignIn')}</span>
              <i className={isPersian ? 'fas fa-arrow-left' : 'fas fa-arrow-right'}></i>
            </Link>
          </div>
        ) : (
          /* Password Reset Form */
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-inline-alert error">
                <i className="fas fa-exclamation-circle" style={{ marginTop: 2 }}></i>
                <span>{error}</span>
              </div>
            )}

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="new-password">
                {t('auth.newPassword')}
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t('auth.minCharacters', { count: MIN_PASSWORD_LENGTH })}
                  required
                  className="auth-input has-toggle"
                  autoComplete="new-password"
                  disabled={isLoading}
                  autoFocus
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

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="confirm-new-password">
                {t('auth.confirmNewPassword')}
              </label>
              <div className="auth-input-wrapper">
                <i className="fas fa-lock auth-input-icon"></i>
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password2"
                  value={password2}
                  onChange={(e) => {
                    setPassword2(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t('auth.reenterNewPassword')}
                  required
                  className="auth-input has-toggle"
                  autoComplete="new-password"
                  disabled={isLoading}
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

              {password2 && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    marginTop: '0.35rem',
                    color: isPasswordsMatch ? '#2ed573' : '#ff4757',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
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
                      ? t('auth.passwordsMatch')
                      : t('auth.passwordsDoNotMatch')}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || !isFormValid}
              style={{ marginTop: '1.25rem' }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>{t('auth.resettingPassword')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.resetPassword')}</span>
                  <i className="fas fa-check"></i>
                </>
              )}
            </button>

            <div className="auth-card-footer" style={{ borderTop: 'none', marginTop: '1rem', paddingTop: '0.5rem' }}>
              <Link to="/login" className="confirm-subtle-link">
                {t('auth.rememberPasswordBack')}
              </Link>
            </div>
          </form>
        )}
      </div>

      <Notification ref={notificationRef} />
    </div>
  );
}