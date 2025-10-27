import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "contained" | "outlined" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({
  variant = "contained",
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={clsx(styles.button, styles[variant], className)}
      type={props.type ?? "button"}
      {...props}
    >
      {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className={styles.trailingIcon}>{trailingIcon}</span>}
    </button>
  );
}
