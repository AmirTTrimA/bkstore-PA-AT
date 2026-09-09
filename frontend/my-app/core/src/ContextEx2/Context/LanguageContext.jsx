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

  // Translation helper: resolves dot path with fallback to English then path itself
  const t = useCallback(
    (path, fallback = '') => {
      const currentDict = translations[language] || {};
      const fallbackDict = translations[DEFAULT_LANGUAGE] || {};

      const value = resolveKey(currentDict, path);
      if (value !== undefined) return value;

      const fallbackValue = resolveKey(fallbackDict, path);
      if (fallbackValue !== undefined) return fallbackValue;

      return fallback || path;
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
