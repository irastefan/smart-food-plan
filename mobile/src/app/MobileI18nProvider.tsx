import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createTranslator } from "../../../shared/i18n/core";
import { defaultLanguage, isRtlLanguage, supportedLanguages, type SupportedLanguage } from "../../../shared/i18n/languages";
import type { TranslationKey } from "../../../shared/i18n/messages";

type MobileI18nContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  isRtl: boolean;
  supportedLanguages: typeof supportedLanguages;
  t: (key: TranslationKey, values?: Record<string, string | number | undefined>) => string;
};

const MobileI18nContext = createContext<MobileI18nContextValue | null>(null);

export function MobileI18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const value = useMemo<MobileI18nContextValue>(() => {
    const t = createTranslator(language);
    return {
      language,
      setLanguage,
      isRtl: isRtlLanguage(language),
      supportedLanguages,
      t
    };
  }, [language]);

  return <MobileI18nContext.Provider value={value}>{children}</MobileI18nContext.Provider>;
}

export function useMobileI18n() {
  const value = useContext(MobileI18nContext);
  if (!value) {
    throw new Error("useMobileI18n must be used within MobileI18nProvider");
  }

  return value;
}
