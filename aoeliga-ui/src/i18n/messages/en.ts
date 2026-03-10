export const en = {
  "header.title": "CZ/SK AoE Liga",

  "auth.login": "Log in",
  "auth.logout": "Log out",
  "auth.account": "Account",
  "auth.profile": "Profile (soon)",

  "nav.dashboard": "Dashboard",
  "nav.divisions": "Divisions",
  "nav.schedule": "Schedule",
  "nav.players": "Players",

  "tournament.loading": "Loading...",
  "tournament.placeholder": "Tournament dashboard placeholder.",

  "landing.title": "Tournaments",
  "landing.subtitle": "Seasons, divisions, schedule, standings.",
  "landing.empty": "No tournaments available yet.",

  "language.english": "English",
  "language.czech": "Czech",
  "language.language": "Language",
  "language.switch": "Switch language",
} as const;

export type TranslationKey = keyof typeof en;
export type MessagesShape = Record<TranslationKey, string>;