import clsx from "clsx";
import { KeyboardEvent, MouseEvent } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps): JSX.Element {
  const { themeName, toggleTheme } = useTheme();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleTheme();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTheme();
    }
  };

  const label = themeName === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      className={clsx(styles.toggle, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${themeName === "dark" ? "light" : "dark"} theme`}
    >
      <span className={styles.indicator}>{themeName === "dark" ? <MoonIcon /> : <SunIcon />}</span>
      <span className={styles.label}>{label} mode</span>
    </button>
  );
}

function SunIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 13V14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3 8H1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 8H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.75736 3.75736L2.6967 2.6967"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.3033 13.3033L12.2426 12.2426"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.2426 3.75736L13.3033 2.6967"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.6967 13.3033L3.75736 12.2426"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.5 10.5C12.7419 10.7831 11.9198 10.9359 11.0667 10.9359C7.18948 10.9359 4.06674 7.81313 4.06674 3.93591C4.06674 3.08286 4.21952 2.26075 4.50266 1.50266C2.33224 2.32172 0.833374 4.44005 0.833374 6.93331C0.833374 10.5312 3.86878 13.5666 7.46671 13.5666C9.95997 13.5666 12.0783 12.0678 12.8974 9.89735C12.8273 10.1052 12.7461 10.307 12.6534 10.5H13.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
