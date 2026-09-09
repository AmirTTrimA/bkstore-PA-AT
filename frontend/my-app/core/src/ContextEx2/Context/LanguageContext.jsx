import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n/i18';

// ============================================
// Context
// ============================================
const LanguageContext = createContext(null);

// ============================================
// Hook
// ============================================
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// ============================================
// Helper: Resolve nested dot keys
// e.g. resolveKey(obj, "nav.home")
// ============================================
const resolveKey = (obj, path) => {
  if (!obj || typeof path !== 'string') return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

// ============================================
// Provider
// ============================================
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('language');
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return DEFAULT_LANGUAGE;
  });

  const isPersian = language === 'fa';
  const dir = isPersian ? 'rtl' : 'ltr';

  // Synchronize document attributes on language change
  useEffect(() => {
    try {
      localStorage.setItem('language', language);
    } catch {
      // Ignore localStorage write errors
    }

    document.documentElement.lang = language;
    document.documentElement.dir = dir;

    if (isPersian) {
      document.documentElement.classList.add('rtl-mode');
      document.body.classList.add('rtl-mode');
    } else {
      document.documentElement.classList.remove('rtl-mode');
      document.body.classList.remove('rtl-mode');
    }

    // Notify listeners (such as ApiClient or external observers)
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language, dir } }));
  }, [language, dir, isPersian]);

  const setLanguage = useCallback((lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'fa' ? 'en' : 'fa'));
  }, []);

  // Translation helper: resolves dot path with fallback to English and parameter interpolation
  const t = useCallback(
    (path, fallback = '', params = {}) => {
      let actualFallback = fallback;
      let actualParams = params;
      if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
        actualParams = fallback;
        actualFallback = '';
      }

      const currentDict = translations[language] || {};
      const fallbackDict = translations[DEFAULT_LANGUAGE] || {};

      let result = resolveKey(currentDict, path);
      if (result === undefined) {
        result = resolveKey(fallbackDict, path);
      }
      if (result === undefined) {
        result = actualFallback || path;
      }

      if (typeof result === 'string' && actualParams && typeof actualParams === 'object') {
        Object.entries(actualParams).forEach(([key, val]) => {
          result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val ?? ''));
        });
      }

      return result;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      isPersian,
      dir,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, isPersian, dir, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageProvider;
