import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Language, TranslationKey } from "../../shared/i18n/messages";
import { messages } from "../../shared/i18n/messages";
import { defaultLanguage, isRtlLanguage, isSupportedLanguage } from "../../shared/i18n/languages";

const STORAGE_KEY = "smartFoodPlanMui.language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isSupportedLanguage(stored) ? stored : defaultLanguage;
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  function setLanguage(nextLanguage: Language): void {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  }

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const direction = isRtlLanguage(language) ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.body.style.direction = direction;
    document.body.style.textAlign = "start";
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.dir = direction;
      rootElement.setAttribute("data-direction", direction);
      rootElement.style.direction = direction;
    }
  }, [language]);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const dictionaries = messages as unknown as Partial<Record<Language, Partial<Record<TranslationKey, string>>>>;
    const languageMessages = dictionaries[language];
    const template: string = languageMessages?.[key] ?? messages.en[key] ?? key;
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
