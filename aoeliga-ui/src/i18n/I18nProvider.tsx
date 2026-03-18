import { createContext, useContext, useEffect, useState } from "react";
import { en, type TranslationKey } from "./messages/en";
import { cs } from "./messages/cs";
import {
  type Locale,
  detectInitialLocale,
  LOCALE_STORAGE_KEY,
} from "./locale";

const messages = { en, cs };

type TranslationVars = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => detectInitialLocale());

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  function t(key: TranslationKey, vars?: TranslationVars) {
    let text = messages[locale][key];

    if (!vars) {
      return text;
    }

    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{{${name}}}`, String(value));
    }

    return text;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("I18nProvider is missing");
  }
  return ctx;
}