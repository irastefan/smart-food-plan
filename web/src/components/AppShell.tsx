import clsx from "clsx";
import type { ReactNode } from "react";
import { useState } from "react";
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
  translationKey:
    | "nav.mealPlan"
    | "nav.statistics"
    | "nav.recipes"
    | "nav.products"
    | "nav.shopping"
    | "nav.settings"
    | "nav.setup";
}[] = [
  { route: "meal-plan", translationKey: "nav.mealPlan" },
  { route: "statistics", translationKey: "nav.statistics" },
  { route: "recipes", translationKey: "nav.recipes" },
  { route: "products", translationKey: "nav.products" },
  { route: "shopping", translationKey: "nav.shopping" },
  { route: "settings", translationKey: "nav.settings" },
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
  "statistics": "statistics",
  "shopping": "shopping",
  "settings": "settings",
  "onboarding": "onboarding"
};

export function AppShell({ currentRoute, onNavigate, children }: AppShellProps): JSX.Element {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.brand} role="banner">
          {t("nav.brand")}
        </div>
        
        {/* Desktop Navigation */}
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
          
          {/* Mobile Menu Button */}
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={clsx(styles.hamburger, isMobileMenuOpen && styles.hamburgerOpen)}>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <nav className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            {NAV_SECTIONS.map((item) => (
              <button
                key={item.route}
                type="button"
                className={clsx(
                  styles.mobileNavLink,
                  ROUTE_TO_SECTION[currentRoute] === item.route && styles.mobileNavLinkActive
                )}
                onClick={() => handleNavigate(item.route)}
              >
                {t(item.translationKey)}
              </button>
            ))}
          </nav>
        </div>
      )}

      <main className={styles.content}>{children}</main>
    </div>
  );
}
