import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSafeLanguage } from '../../Context/LanguageContext';

import '../../Styles/components/Notification.css';

// Default durations (ms)
const DEFAULT_DURATION = 4200;
const ERROR_DURATION = 5500;
const EXIT_ANIMATION_MS = 240;

/**
 * Individual Toast Item Component
 */
function ToastItem({ toast, onDismiss, onNavigate }) {
  const { id, message, severity = 'info', title, linkText, linkHref, duration, isExiting } = toast;
  const [isHovered, setIsHovered] = useState(false);
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Resume or start countdown
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, remainingTimeRef.current);
  }, [id, onDismiss]);

  // Pause countdown
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(remainingTimeRef.current - elapsed, 600);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    pauseTimer();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    startTimer();
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'success':
        return <i className="fa-solid fa-circle-check"></i>;
      case 'error':
        return <i className="fa-solid fa-circle-exclamation"></i>;
      case 'warning':
        return <i className="fa-solid fa-triangle-exclamation"></i>;
      case 'info':
      default:
        return <i className="fa-solid fa-circle-info"></i>;
    }
  };

  return (
    <div
      className={`app-toast-card severity-${severity} ${isExiting ? 'exiting' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="assertive"
    >
      {/* Visual Icon Badge */}
      <div className="app-toast-icon-wrap" aria-hidden="true">
        {getSeverityIcon()}
      </div>

      {/* Main Content Area */}
      <div className="app-toast-content">
        <div className="app-toast-header-row">
          {title && <h4 className="app-toast-title">{title}</h4>}
        </div>

        <p className="app-toast-message">{message}</p>

        {/* Actionable Link / Button */}
        {linkText && (
          <a
            href={linkHref || '#'}
            className="app-toast-action-link"
            onClick={(e) => {
              if (onNavigate && linkHref && linkHref.startsWith('/')) {
                e.preventDefault();
                onNavigate(linkHref);
                onDismiss(id);
              }
            }}
          >
            <span>{linkText}</span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
          </a>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        className="app-toast-dismiss-btn"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        &times;
      </button>

      {/* Dynamic Animated Progress Countdown Line */}
      <div className="app-toast-progress-bar">
        <div
          className="app-toast-progress-fill"
          style={{
            animationDuration: `${duration}ms`,
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Main Notification Component
 * Maintains full backwards compatibility with showNotif(msg, type, options)
 */
const Notification = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const langContext = useSafeLanguage();
  const [toasts, setToasts] = useState([]);

  // Dismiss a toast with smooth exit animation
  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const getDefaultTitle = useCallback(
    (type) => {
      const translate = langContext?.t || ((key, fallback) => fallback || key);
      switch (type) {
        case 'success':
          return translate('common.success', 'Success');
        case 'error':
          return translate('common.error', 'Error');
        case 'warning':
          return translate('common.warning', 'Warning');
        case 'info':
        default:
          return translate('common.notice', 'Notice');
      }
    },
    [langContext]
  );

  // Imperative API via ref
  useImperativeHandle(ref, () => ({
    showNotif: (msg, type = 'info', options = {}) => {
      if (!msg) return;

      const duration =
        options.duration ||
        (type === 'error' ? ERROR_DURATION : DEFAULT_DURATION);

      const title =
        options.title !== undefined ? options.title : getDefaultTitle(type);

      const newToast = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message: msg,
        severity: type,
        title,
        linkText: options.linkText || '',
        linkHref: options.linkHref || '',
        duration,
        isExiting: false,
      };

      // Keep at most 3 active toasts
      setToasts((prev) => [...prev.slice(-2), newToast]);

      // If programmatic navigation requested
      if (options.navigateTo) {
        setTimeout(() => {
          navigate(options.navigateTo);
        }, duration);
      }
    },
  }));

  if (toasts.length === 0) {
    return null;
  }

  // Render directly into document.body portal to guarantee escape from parent container overflows/transforms
  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div className="app-toast-portal" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
          onNavigate={(url) => navigate(url)}
        />
      ))}
    </div>,
    portalRoot
  );
});

export default Notification;