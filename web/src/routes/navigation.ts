import { useCallback, useEffect, useMemo, useState } from "react";

export type AppRoute =
  | "meal-plan"
  | "add-recipe-to-day"
  | "recipes"
  | "add-recipe"
  | "recipe"
  | "products"
  | "add-product"
  | "product"
  | "shopping"
  | "settings"
  | "onboarding";

const DEFAULT_ROUTE: AppRoute = "meal-plan";

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
    case "recipes":
      return "recipes";
    case "add-recipe":
      return "add-recipe";
    case "recipe":
      return "recipe";
    case "add-recipe-to-day":
      return "add-recipe-to-day";
    case "product":
      return "product";
    case "shopping":
      return "shopping";
    case "settings":
      return "settings";
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
  { route: "meal-plan", hash: routeToHash("meal-plan") },
  { route: "recipes", hash: routeToHash("recipes") },
  { route: "add-recipe", hash: routeToHash("add-recipe") },
  { route: "recipe", hash: routeToHash("recipe") },
  { route: "add-recipe-to-day", hash: routeToHash("add-recipe-to-day") },
  { route: "products", hash: routeToHash("products") },
  { route: "add-product", hash: routeToHash("add-product") },
  { route: "product", hash: routeToHash("product") },
  { route: "shopping", hash: routeToHash("shopping") },
  { route: "settings", hash: routeToHash("settings") },
  { route: "onboarding", hash: routeToHash("onboarding") }
];

export const defaultRoute = DEFAULT_ROUTE;
