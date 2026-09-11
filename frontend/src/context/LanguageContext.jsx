/**
 * @file LanguageContext.jsx
 * @description Global Internationalization (i18n) Context supporting English (en) and Indonesian (id).
 * Stores user language preference persistently in localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import idTranslations from "../i18n/id";
import enTranslations from "../i18n/en";

const translations = {
  id: idTranslations,
  en: enTranslations,
};

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", shortLabel: "ID" },
  { code: "en", label: "English", flag: "🇬🇧", shortLabel: "EN" },
];

/**
 * Provider component for application localization.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("arusuka_lang") || "id";
  });

  const setLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem("arusuka_lang", langCode);
    }
  }, []);

  /**
   * Translate a key with optional fallback.
   * @param {string} key - Translation dictionary key
   * @param {string} [fallback] - Fallback string if key not found
   * @returns {string} Translated string
   */
  const t = useCallback((key, fallback = "") => {
    const currentDict = translations[language] || translations.id;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const fallbackDict = translations.id;
    return fallbackDict[key] !== undefined ? fallbackDict[key] : (fallback || key);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to consume localization context.
 * @returns {{ language: string, setLanguage: (code: string) => void, t: (key: string, fallback?: string) => string, supportedLanguages: Array }}
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
