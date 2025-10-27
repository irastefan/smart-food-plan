import clsx from "clsx";
import { ChangeEvent } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { Language } from "@/i18n/messages";
import styles from "./LanguageToggle.module.css";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps): JSX.Element {
  const { language, setLanguage, availableLanguages, t } = useI18n();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value as Language;
    if (nextLanguage !== language) {
      setLanguage(nextLanguage);
    }
  };

  const label = t("language.switcherLabel");

  return (
    <label className={clsx(styles.toggle, className)}>
      <span className={styles.visuallyHidden}>{label}</span>
      <span className={styles.icon} aria-hidden="true">
        <GlobeIcon />
      </span>
      <select
        className={styles.select}
        value={language}
        onChange={handleChange}
        aria-label={label}
      >
        {availableLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <span className={styles.caret} aria-hidden="true">
        <CaretIcon />
      </span>
    </label>
  );
}

function GlobeIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 16.5C12.866 16.5 16 13.366 16 9.5C16 5.63401 12.866 2.5 9 2.5C5.13401 2.5 2 5.63401 2 9.5C2 13.366 5.13401 16.5 9 16.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2.5 9.5H15.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M9 2.5C11 5.5 11 13.5 9 16.5C7 13.5 7 5.5 9 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4.5 4.5C6.5 5.5 11.5 5.5 13.5 4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4.5 14.5C6.5 13.5 11.5 13.5 13.5 14.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CaretIcon(): JSX.Element {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2.5L6 5.5L10 2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
