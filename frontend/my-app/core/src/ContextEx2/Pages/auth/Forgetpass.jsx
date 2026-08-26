import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ApiClient from '../../Services/ApiClient';
import '../../Styles/components/Forgetpass.css';

// ============================================
// Constants
// ============================================
const ERROR_DURATION = 3000;

// ============================================
// Main
// ============================================
export default function Forgetpass() {

  const navigate = useNavigate();
  const { uid, token } = useParams();

  // --- State ---
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // Effects
  // ============================================

  // Auto-clear error
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError('');
    }, ERROR_DURATION);

    return () => clearTimeout(timer);
  }, [error]);

  // ============================================
  // Handlers
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    // Basic validation
    if (!password || !password2) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    if (!uid || !token) {
      setError('Invalid or incomplete password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      await ApiClient.post(
        '/auth/password/reset/confirm/',
        {
          uid,
          token,
          new_password1: password,
          new_password2: password2,
        }
      );

      setSuccess(
        'Your password has been reset successfully.'
      );

      setPassword('');
      setPassword2('');

    } catch (err) {
      const responseData = err.response?.data;

      if (responseData) {
        if (typeof responseData === 'string') {
          setError(responseData);
        } else if (responseData.detail) {
          setError(responseData.detail);
        } else if (responseData.new_password1) {
          setError(
            Array.isArray(responseData.new_password1)
              ? responseData.new_password1[0]
              : responseData.new_password1
          );
        } else {
          setError('Failed to reset password.');
        }
      } else {
        setError('Server error. Please try again.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="form-container">

      <form
        className="form"
        onSubmit={handleSubmit}
      >

        {/* Close Button */}
        <button
          type="button"
          className="close"
          onClick={() => navigate('/login')}
          disabled={isLoading}
        >
          X
        </button>

        {/* Header */}
        <div className="forget-info">
          <span className="title">
            Reset Password
          </span>

          <p className="forget-description">
            Enter your new password below.
          </p>
        </div>

        {/* Password fields */}
        <div className="input-fields">

          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
          />

        </div>

        {/* Error */}
        {error && (
          <div className="error-message auto-hide">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Submit */}
        <div className="action-btns">

          <button
            type="submit"
            className="verify"
            disabled={
              isLoading ||
              !password ||
              !password2
            }
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

        </div>

      </form>

    </div>
  );
}