import clsx from "clsx";
import { ReactNode } from "react";
import styles from "./Card.module.css";

type CardProps = {
  title?: string;
  className?: string;
  children: ReactNode;
};

export function Card({ title, className, children }: CardProps): JSX.Element {
  return (
    <section className={clsx(styles.card, className)}>
      {title && <header className={styles.title}>{title}</header>}
      <div className={styles.content}>{children}</div>
    </section>
  );
}
