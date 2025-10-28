import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRoute = "products" | "add-product" | "meal-plan" | "onboarding";

const DEFAULT_ROUTE: AppRoute = "products";

function routeToHash(route: AppRoute): string {
  return `#/${route}`;
}

function hashToRoute(hash: string): AppRoute {
  const normalized = hash.startsWith("#/") ? hash.slice(2) : hash.replace(/^#/, "");
  switch (normalized) {
    case "products":
      return "products";
    case "meal-plan":
      return "meal-plan";
    case "onboarding":
      return "onboarding";
    case "add-product":
    default:
      return "add-product";
  }
}

export function useHashNavigation(): { route: AppRoute; navigate: (route: AppRoute) => void } {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_ROUTE;
    }
    const current = hashToRoute(window.location.hash || "");
    if (!window.location.hash) {
      window.location.hash = routeToHash(current);
    }
    return current;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleHashChange = () => {
      setRoute(hashToRoute(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (typeof window === "undefined") {
      return;
    }
    const targetHash = routeToHash(nextRoute);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(nextRoute);
    }
  }, []);

  return useMemo(() => ({ route, navigate }), [route, navigate]);
}

export const appRoutes: { route: AppRoute; hash: string }[] = [
  { route: "products", hash: routeToHash("products") },
  { route: "add-product", hash: routeToHash("add-product") },
  { route: "meal-plan", hash: routeToHash("meal-plan") },
  { route: "onboarding", hash: routeToHash("onboarding") }
];

export const defaultRoute = DEFAULT_ROUTE;
