import type { PropsWithChildren } from "react";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { LanguageProvider } from "./LanguageProvider";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <AppFrame>{children}</AppFrame>
      </ThemeModeProvider>
    </LanguageProvider>
  );
}

function AppFrame({ children }: PropsWithChildren) {
  const { mode, theme } = useThemeMode();

  return (
    <>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ":root": {
            colorScheme: mode,
            fontSynthesis: "none",
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale"
          },
          "html, body, #root": {
            minHeight: "100%"
          },
          body: {
            margin: 0,
            backgroundColor: theme.palette.background.default
          },
          a: {
            color: "inherit",
            textDecoration: "none"
          }
        }}
      />
      {children}
    </>
  );
}
