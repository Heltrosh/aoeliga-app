export const SUPPORTED_LOCALES = ["en", "cs"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "aoeliga_locale";

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function detectInitialLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && isLocale(saved)) return saved;

  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("cs")) return "cs";

  return DEFAULT_LOCALE;
}