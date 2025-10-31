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

const NAV_SECTIONS: {
  route: AppRoute;
  translationKey: "nav.mealPlan" | "nav.recipes" | "nav.products" | "nav.shopping" | "nav.setup";
}[] = [
  { route: "meal-plan", translationKey: "nav.mealPlan" },
  { route: "recipes", translationKey: "nav.recipes" },
  { route: "products", translationKey: "nav.products" },
  { route: "shopping", translationKey: "nav.shopping" },
  { route: "onboarding", translationKey: "nav.setup" }
];

const ROUTE_TO_SECTION: Record<AppRoute, AppRoute> = {
  "meal-plan": "meal-plan",
  "add-recipe-to-day": "meal-plan",
  "recipes": "recipes",
  "add-recipe": "recipes",
  "recipe": "recipes",
  "products": "products",
  "add-product": "products",
  "product": "products",
  "shopping": "shopping",
  "onboarding": "onboarding"
};

export function AppShell({ currentRoute, onNavigate, children }: AppShellProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.brand} role="banner">
          {t("nav.brand")}
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_SECTIONS.map((item) => (
            <button
              key={item.route}
              type="button"
              className={clsx(
                styles.navLink,
                ROUTE_TO_SECTION[currentRoute] === item.route && styles.navLinkActive
              )}
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
