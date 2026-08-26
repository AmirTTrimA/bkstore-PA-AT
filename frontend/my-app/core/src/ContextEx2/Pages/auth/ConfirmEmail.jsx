import { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import ApiClient from '../../Services/ApiClient';
import "../../Styles/components/ConfirmEmail.css";

// ============================================
// Constants
// ============================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_DURATION = 2000;

// ============================================
// Main
// ============================================
export default function ConfirmEmail() {

  const { error, setError, clearError } = useAuth();

  // --- State ---
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // ============================================
  // Effects
  // ============================================

  // Auto-clear error
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      clearError();
    }, ERROR_DURATION);

    return () => clearTimeout(timer);
  }, [error, clearError]);

  // ============================================
  // Handlers
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();

    // Validate email
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Not Valid Email');
      return;
    }

    setIsLoading(true);

    try {
      await ApiClient.post(
        "/auth/password/reset/",
        {
          email: trimmedEmail,
        }
      );

      setSuccess(
        "If an account exists with this email, a password reset link has been sent."
      );

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to request password reset."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="confirm-container">
      <form
        className="confirm-form"
        onSubmit={handleSubmit}
      >
        <h4 className="form-title">
          Enter your Email
        </h4>

        <span className="input-span">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
            placeholder="enter your email"
            style={{ textAlign: "center" }}
            disabled={isLoading}
            autoComplete="email"
          />
        </span>

        <button
          type="submit"
          className="submit"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        {error && (
          <div className="error-message auto-hide">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
      </form>
    </div>
  );
}