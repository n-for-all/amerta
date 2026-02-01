
type LocaleItem = {
  label: string;
  code: string;
  rtl?: boolean;
};

const _LOCALES = [
  // --- The Universals ---
  { label: "English", code: "en" },
  { label: "Español", code: "es" },

  // --- East Asia ---
  { label: "中文 (Chinese)", code: "zh" },
  { label: "日本語 (Japanese)", code: "ja" },
  { label: "한국어 (Korean)", code: "ko" },

  // --- Western Europe ---
  { label: "Français", code: "fr" },
  { label: "Deutsch", code: "de" },
  { label: "Italiano", code: "it" },
  { label: "Português", code: "pt" },
  { label: "Nederlands", code: "nl" },

  // --- Eastern Europe & Russia ---
  { label: "Русский", code: "ru" },
  { label: "Polski", code: "pl" },
  { label: "Türkçe", code: "tr" },
  { label: "Čeština", code: "cs" },
  { label: "Ελληνικά", code: "el" },

  // --- Middle East (MENA) ---
  { label: "العربية", code: "ar", rtl: true },

  // --- South & Southeast Asia ---
  { label: "हिन्दी", code: "hi" },
  { label: "Bahasa Indonesia", code: "id" },
  { label: "ภาษาไทย", code: "th" },
  { label: "Tiếng Việt", code: "vi" },
  { label: "Bahasa Melayu", code: "ms" },

  // --- The Nordics ---
  { label: "Svenska", code: "sv" },
  { label: "Dansk", code: "da" },
  { label: "Norsk", code: "no" },
  { label: "Suomi", code: "fi" },
] as const;


export type LocaleCode = (typeof _LOCALES)[number]["code"];

export const LOCALES: readonly LocaleItem[] = _LOCALES;

export const DEFAULT_LOCALE = (process.env.DEFAULT_LOCALE || "en") as LocaleCode;