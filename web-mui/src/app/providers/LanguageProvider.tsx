import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { Language, TranslationKey } from "../../shared/i18n/messages";
import { messages } from "../../shared/i18n/messages";

const STORAGE_KEY = "smartFoodPlanMui.language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "ru" ? "ru" : "en";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  function setLanguage(nextLanguage: Language): void {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  }

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const template: string = messages[language][key] ?? messages.en[key] ?? key;
    if (!params) {
      return template;
    }

    return Object.entries(params).reduce<string>(
      (result, [paramKey, value]) => result.replace(`{{${paramKey}}}`, String(value)),
      template
    );
  }, [language]);

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
