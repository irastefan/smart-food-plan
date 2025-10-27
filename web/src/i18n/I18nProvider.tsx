import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { Language, TranslationKey, messages } from "./messages";

type TranslationValues = Record<string, string>;

type AvailableLanguageOption = {
  code: Language;
  labelKey: TranslationKey;
  shortLabelKey: TranslationKey;
};

const AVAILABLE_LANGUAGES = [
  {
    code: "en",
    labelKey: "language.option.english",
    shortLabelKey: "language.short.english"
  },
  {
    code: "ru",
    labelKey: "language.option.russian",
    shortLabelKey: "language.short.russian"
  }
] as const satisfies readonly AvailableLanguageOption[];

const LANGUAGE_STORAGE_KEY = "smartFoodPlan.language";
const DEFAULT_LANGUAGE: Language = "en";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  availableLanguages: { code: Language; label: string; shortLabel: string }[];
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function isLanguage(value: string | null): value is Language {
  return AVAILABLE_LANGUAGES.some((item) => item.code === value);
}

function format(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return Object.keys(values).reduce((result, key) => {
    const pattern = new RegExp(`{{${key}}}`, "g");
    return result.replace(pattern, values[key]);
  }, template);
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LANGUAGE;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const translate = (key: TranslationKey, values?: TranslationValues) => {
      const table = messages[language];
      const fallback = messages[DEFAULT_LANGUAGE];
      const template = table[key] ?? fallback[key] ?? key;
      return format(template, values);
    };

    const available = AVAILABLE_LANGUAGES.map((item) => ({
      code: item.code,
      label: translate(item.labelKey),
      shortLabel: translate(item.shortLabelKey)
    }));

    return {
      language,
      setLanguage,
      t: translate,
      availableLanguages: available
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation(): { t: I18nContextValue["t"] } {
  const { t } = useI18n();
  return { t };
}
