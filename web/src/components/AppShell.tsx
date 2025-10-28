import clsx from "clsx";
import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/I18nProvider";
import type { AppRoute } from "@/routes/navigation";
import styles from "./AppShell.module.css";

type AppShellProps = {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: ReactNode;
};

const NAV_ITEMS: { route: AppRoute; translationKey: "nav.addProduct" | "nav.mealPlan" | "nav.setup" }[] =
  [
    { route: "add-product", translationKey: "nav.addProduct" },
    { route: "meal-plan", translationKey: "nav.mealPlan" },
    { route: "onboarding", translationKey: "nav.setup" }
  ];

export function AppShell({ currentRoute, onNavigate, children }: AppShellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.brand} role="banner">
          {t("nav.brand")}
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.route}
              type="button"
              className={clsx(styles.navLink, currentRoute === item.route && styles.navLinkActive)}
              onClick={() => onNavigate(item.route)}
            >
              {t(item.translationKey)}
            </button>
          ))}
        </nav>
        <div className={styles.actions}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
