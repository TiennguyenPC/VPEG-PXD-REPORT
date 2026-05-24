import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, formatMessage, LOCALE_STORAGE_KEY, messages, SUPPORTED_LOCALES, translateStored } from '../i18n/messages';

const I18nContext = createContext(null);

function resolveMessage(locale, key) {
  const parts = key.split('.');
  let val = messages[locale] || messages[DEFAULT_LOCALE];
  for (const part of parts) {
    val = val?.[part];
  }
  if (val !== undefined) return val;
  val = messages[DEFAULT_LOCALE];
  for (const part of parts) {
    val = val?.[part];
  }
  return val ?? key;
}

const viFallback = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => resolveMessage(DEFAULT_LOCALE, key),
  tf: (key, vars) => formatMessage(resolveMessage(DEFAULT_LOCALE, key), vars),
  ts: (value) => translateStored(DEFAULT_LOCALE, value),
};

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(saved) ? saved : DEFAULT_LOCALE;
  });

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'en' ? 'en-US' : 'vi';
    return () => {
      document.documentElement.lang = 'vi';
    };
  }, [locale]);

  const setLocale = (next) => {
    if (SUPPORTED_LOCALES.includes(next)) setLocaleState(next);
  };

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key) => resolveMessage(locale, key),
    tf: (key, vars) => formatMessage(resolveMessage(locale, key), vars),
    ts: (value) => translateStored(locale, value),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Nội bộ: luôn tiếng Việt. Chỉ trang /share có I18nProvider. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  return ctx || viFallback;
}
