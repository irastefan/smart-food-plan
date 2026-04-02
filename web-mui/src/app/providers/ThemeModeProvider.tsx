import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import type { PaletteMode, Theme } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { createAppTheme } from "../../theme/appTheme";
import { useLanguage } from "./LanguageProvider";

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
  const { language } = useLanguage();
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  const direction = isRtlLanguage(language) ? "rtl" : "ltr";
  const theme = useMemo(() => createAppTheme(mode, direction), [direction, mode]);
  const emotionCache = useMemo(
    () =>
      createCache({
        key: direction === "rtl" ? "mui-rtl" : "mui",
        stylisPlugins: direction === "rtl" ? [prefixer, rtlPlugin] : [prefixer]
      }),
    [direction]
  );

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
      <CacheProvider key={direction} value={emotionCache}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </CacheProvider>
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
