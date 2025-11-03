import type { MouseEvent } from "react";
import clsx from "clsx";
import styles from "./ActionIconButton.module.css";

type ActionIcon = "view" | "edit" | "delete";

const icons: Record<ActionIcon, JSX.Element> = {
  view: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c5.05 0 9.27 3.11 10.73 7.5C21.27 16.89 17.05 20 12 20S2.73 16.89 1.27 12.5C2.73 8.11 6.95 5 12 5zm0 2C7.82 7 4.36 9.55 3.05 13c1.31 3.45 4.77 6 8.95 6s7.64-2.55 8.95-6C19.64 9.55 16.18 7 12 7zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
      />
    </svg>
  ),
  edit: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.71 7.04a1 1 0 0 1 0 1.41l-9.9 9.9c-.18.18-.4.3-.65.35l-4.5.75a1 1 0 0 1-1.15-1.15l.75-4.5c.05-.25.17-.47.35-.65l9.9-9.9a1 1 0 0 1 1.41 0l3.79 3.79zm-5.5-.21-8.5 8.5-.37 2.21 2.21-.37 8.5-8.5-1.84-1.84zm2.21-2.21-1.09 1.09 1.84 1.84 1.09-1.09-1.84-1.84z"
      />
    </svg>
  ),
  delete: (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3a1 1 0 0 0-1 1v1H4.5a1 1 0 0 0 0 2H5v12a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm1 2h4V5h-4v1zm-3 2h10v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7zm3 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V10a1 1 0 0 1 1-1z"
      />
    </svg>
  )
};

type ActionIconButtonProps = {
  action: ActionIcon;
  label: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function ActionIconButton({
  action,
  label,
  onClick,
  disabled = false,
  className,
  type = "button"
}: ActionIconButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={clsx(styles.button, styles[`tone-${action}`], className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span className={styles.srOnly}>{label}</span>
      {icons[action]}
    </button>
  );
}
