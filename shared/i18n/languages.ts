export const languageRegistry = {
  en: {
    shortLabel: "EN",
    speechLocale: "en-US",
    dateLocale: "en-US",
    aiName: "English",
    rtl: false
  },
  ru: {
    shortLabel: "RU",
    speechLocale: "ru-RU",
    dateLocale: "ru-RU",
    aiName: "Russian",
    rtl: false
  },
  he: {
    shortLabel: "HE",
    speechLocale: "he-IL",
    dateLocale: "he-IL",
    aiName: "Hebrew",
    rtl: true
  }
} as const;

export type SupportedLanguage = keyof typeof languageRegistry;

export const supportedLanguages = Object.keys(languageRegistry) as SupportedLanguage[];

export const defaultLanguage: SupportedLanguage = "en";

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value in languageRegistry;
}

export function getLanguageDisplayLabel(language: SupportedLanguage): string {
  return languageRegistry[language].shortLabel;
}

export function getLanguageSpeechLocale(language: SupportedLanguage): string {
  return languageRegistry[language].speechLocale;
}

export function getLanguageDateLocale(language: SupportedLanguage): string {
  return languageRegistry[language].dateLocale;
}

export function getAiLanguageName(language: SupportedLanguage): string {
  return languageRegistry[language].aiName;
}

export function isRtlLanguage(language: SupportedLanguage): boolean {
  return languageRegistry[language].rtl;
}
