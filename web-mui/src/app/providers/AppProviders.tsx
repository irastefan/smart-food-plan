import type { PropsWithChildren } from "react";
import { Box, CssBaseline, GlobalStyles } from "@mui/material";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { LanguageProvider } from "./LanguageProvider";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeProvider";
import { useLanguage } from "./LanguageProvider";

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
  const { language } = useLanguage();
  const direction = isRtlLanguage(language) ? "rtl" : "ltr";

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
          "#root": {
            direction
          },
          body: {
            margin: 0,
            backgroundColor: theme.palette.background.default,
            direction,
            textAlign: "start"
          },
          a: {
            color: "inherit",
            textDecoration: "none"
          }
        }}
      />
      <Box data-app-root="true" dir={direction} style={{ direction }} sx={{ minHeight: "100%" }}>
        {children}
      </Box>
    </>
  );
}
