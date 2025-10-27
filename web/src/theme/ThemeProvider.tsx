import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { ThemeName, themeVariables } from "./theme";

type ThemeContextValue = {
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "smartFoodPlan.theme";

type ThemeProviderProps = {
  children: ReactNode;
};

function applyTheme(name: ThemeName) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.theme = name;
  const entries = Object.entries(themeVariables[name]);
  entries.forEach(([key, value]) => {
    root.style.setProperty(key, String(value));
  });
}

function getInitialTheme(): ThemeName {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    return getInitialTheme();
  });

  useEffect(() => {
    applyTheme(themeName);
    window.localStorage.setItem(STORAGE_KEY, themeName);
  }, [themeName]);

  const toggleTheme = useCallback(() => {
    setThemeName((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      setThemeName,
      toggleTheme
    }),
    [themeName, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
