import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { PaletteMode, Theme } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { createAppTheme } from "../../theme/appTheme";

const STORAGE_KEY = "smartFoodPlanMui.themeMode";

type ThemeModeContextValue = {
  mode: PaletteMode;
  toggleMode: () => void;
  theme: Theme;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function getInitialMode(): PaletteMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  function toggleMode(): void {
    setMode((currentMode) => {
      const nextMode = currentMode === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      }
      return nextMode;
    });
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, theme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
}
