'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';

export type SupportedLocale = 'es' | 'en' | 'pt';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const translations: Record<SupportedLocale, any> = { es, en, pt };

const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('es');

  useEffect(() => {
    const saved = localStorage.getItem('billar_locale') as SupportedLocale;
    if (saved && ['es', 'en', 'pt'].includes(saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('billar_locale', newLocale);
  };

  const t = (path: string, params?: Record<string, string>): string => {
    const keys = path.split('.');
    let current = translations[locale];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback a español si no se encuentra
        let fallback = translations['es'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let text = current;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
      }
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
