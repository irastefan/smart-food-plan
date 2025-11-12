export type ThemeName = "light" | "dark";

type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  disabled: string;
  buttonHover: string;
  error: string;
  success: string;
  warning: string;
};

type ThemeTypography = {
  fontFamily: string;
  title: { fontSize: number; fontWeight: "600" };
  subtitle: { fontSize: number; fontWeight: "400" };
  body: { fontSize: number; fontWeight: "400" };
  caption: { fontSize: number; fontWeight: "500" };
  button: { fontSize: number; fontWeight: "600" };
};

type ThemeShape = {
  cardRadius: number;
  buttonRadius: number;
};

export type ThemeDefinition = {
  name: ThemeName;
  colors: ThemeColors;
};

export const theme = {
  light: {
    name: "light",
    colors: {
      background: "#F3F7F4",
      surface: "#FFFFFF",
      border: "#A1BDB1",
      textPrimary: "#142923",
      textSecondary: "rgba(20, 41, 35, 0.72)",
      accent: "#0EBB7F",
      disabled: "rgba(20, 41, 35, 0.35)",
      buttonHover: "#0AA56F",
      error: "#D25C5C",
      success: "#32A56F",
      warning: "#E1AE55"
    }
  },
  dark: {
    name: "dark",
    colors: {
      background: "#011714",
      surface: "#052422",
      border: "rgba(72, 224, 179, 0.32)",
      textPrimary: "#E6F7EF",
      textSecondary: "#7FC9B5",
      accent: "#4CE0B3",
      disabled: "rgba(230,247,239,0.32)",
      buttonHover: "linear-gradient(135deg, rgba(76, 224, 179, 0.95), rgba(28, 148, 118, 0.95))",
      error: "#D47171",
      success: "#59E0AA",
      warning: "#E5C079"
    }
  },
  typography: {
    fontFamily: "Inter",
    title: { fontSize: 22, fontWeight: "600" },
    subtitle: { fontSize: 14, fontWeight: "400" },
    body: { fontSize: 15, fontWeight: "400" },
    caption: { fontSize: 13, fontWeight: "500" },
    button: { fontSize: 15, fontWeight: "600" }
  } satisfies ThemeTypography,
  shape: {
    cardRadius: 16,
    buttonRadius: 14
  } satisfies ThemeShape,
  spacing: (n: number) => n * 8
} as const;

type ThemeCSSVariables = Record<string, string>;

export const themeVariables: Record<ThemeName, ThemeCSSVariables> = {
  light: {
    "--color-background": theme.light.colors.background,
    "--color-surface": theme.light.colors.surface,
    "--color-surface-elevated": "#E7F1EC",
    "--color-surface-translucent": "rgba(255, 255, 255, 0.96)",
    "--color-border": theme.light.colors.border,
    "--color-divider": "rgba(20,41,35,0.18)",
    "--color-text-primary": theme.light.colors.textPrimary,
    "--color-text-secondary": theme.light.colors.textSecondary,
    "--color-accent": theme.light.colors.accent,
    "--color-accent-soft": "rgba(14, 187, 127, 0.22)",
    "--color-disabled": theme.light.colors.disabled,
    "--color-error": theme.light.colors.error,
    "--color-success": theme.light.colors.success,
    "--color-warning": theme.light.colors.warning,
    "--color-button-contained-text": "#0F2A24",
    "--color-button-contained-bg": theme.light.colors.accent,
    "--color-button-contained-hover": theme.light.colors.buttonHover,
    "--button-shadow": "0 12px 30px rgba(14, 187, 127, 0.22)",
    "--color-icon-container": "rgba(14, 187, 127, 0.18)",
    "--color-icon-container-strong": "rgba(8, 112, 84, 0.45)",
    "--color-checkbox-border": "#86AB9E",
    "--color-checkbox-background": "#FFFFFF",
    "--card-background": "rgba(255, 255, 255, 0.98)",
    "--card-border": "rgba(149, 178, 166, 0.85)",
    "--card-shadow": "0 16px 38px rgba(29, 73, 60, 0.14)",
    "--info-chip-background": "rgba(14, 187, 127, 0.1)",
    "--background-glow":
      "radial-gradient(circle at 15% 8%, rgba(36, 193, 136, 0.32), transparent 62%), radial-gradient(circle at 90% -8%, rgba(88, 214, 178, 0.35), transparent 55%)",
    "--body-background":
      "radial-gradient(circle at top, rgba(46, 195, 141, 0.2), transparent 58%), #F3F7F4",
    "--body-text-color": theme.light.colors.textPrimary,
    "--shadow-elevated": "0 18px 45px rgba(21, 52, 43, 0.1)"
  },
  dark: {
    "--color-background": theme.dark.colors.background,
    "--color-surface": theme.dark.colors.surface,
    "--color-surface-elevated": "#0B2E2A",
    "--color-surface-translucent": "rgba(5, 36, 34, 0.92)",
    "--color-border": theme.dark.colors.border,
    "--color-divider": "rgba(255,255,255,0.08)",
    "--color-text-primary": theme.dark.colors.textPrimary,
    "--color-text-secondary": theme.dark.colors.textSecondary,
    "--color-accent": theme.dark.colors.accent,
    "--color-accent-soft": "rgba(76, 224, 179, 0.6)",
    "--color-disabled": theme.dark.colors.disabled,
    "--color-error": theme.dark.colors.error,
    "--color-success": theme.dark.colors.success,
    "--color-warning": theme.dark.colors.warning,
    "--color-button-contained-text": "#041C1C",
    "--color-button-contained-bg": "linear-gradient(135deg, rgba(76, 224, 179, 0.78), rgba(21, 130, 106, 0.95))",
    "--color-button-contained-hover": theme.dark.colors.buttonHover,
    "--button-shadow": "0 12px 30px rgba(8, 84, 71, 0.5)",
    "--color-icon-container": "rgba(255, 255, 255, 0.05)",
    "--color-icon-container-strong": "rgba(76, 224, 179, 0.26)",
    "--color-checkbox-border": "rgba(230, 247, 239, 0.3)",
    "--color-checkbox-background": "rgba(255,255,255,0.03)",
    "--card-background": "rgba(5, 36, 34, 0.94)",
    "--card-border": "rgba(255, 255, 255, 0.08)",
    "--card-shadow": "0 18px 55px rgba(1, 14, 12, 0.65)",
    "--info-chip-background": "rgba(76, 224, 179, 0.18)",
    "--background-glow":
      "radial-gradient(circle at 25% 8%, rgba(76, 224, 179, 0.15), transparent 55%), radial-gradient(circle at 78% -10%, rgba(2, 52, 46, 0.55), transparent 50%)",
    "--body-background":
      "radial-gradient(circle at top, rgba(48, 118, 105, 0.25), transparent 60%), #011714",
    "--body-text-color": theme.dark.colors.textPrimary,
    "--shadow-elevated": "0 22px 55px rgba(1, 12, 10, 0.65)"
  }
};

export type ThemePalette = typeof theme.light | typeof theme.dark;
