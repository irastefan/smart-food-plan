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
      background: "#FAFBFA",
      surface: "#FFFFFF",
      border: "#A8BCB3",
      textPrimary: "#1A2522",
      textSecondary: "rgba(26,37,34,0.72)",
      accent: "#35C2A1",
      disabled: "rgba(26,37,34,0.35)",
      buttonHover: "#2EA78F",
      error: "#D25555",
      success: "#55B578",
      warning: "#E3C079"
    }
  },
  dark: {
    name: "dark",
    colors: {
      background: "#041C1C",
      surface: "#0A2A2B",
      border: "rgba(46, 209, 191, 0.32)",
      textPrimary: "#E7F4F0",
      textSecondary: "#9BBDB6",
      accent: "#1FA293",
      disabled: "rgba(255,255,255,0.25)",
      buttonHover: "linear-gradient(135deg, rgba(31,162,147,0.95), rgba(46,209,191,0.95))",
      error: "#D47171",
      success: "#6DD8A2",
      warning: "#E7B96F"
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
    "--color-surface-elevated": "#F0F6F3",
    "--color-surface-translucent": "rgba(255, 255, 255, 0.95)",
    "--color-border": theme.light.colors.border,
    "--color-divider": "rgba(26,37,34,0.22)",
    "--color-text-primary": theme.light.colors.textPrimary,
    "--color-text-secondary": theme.light.colors.textSecondary,
    "--color-accent": theme.light.colors.accent,
    "--color-accent-soft": "rgba(53, 194, 161, 0.28)",
    "--color-disabled": theme.light.colors.disabled,
    "--color-error": theme.light.colors.error,
    "--color-success": theme.light.colors.success,
    "--color-warning": theme.light.colors.warning,
    "--color-button-contained-text": "#0F2A24",
    "--color-button-contained-bg": theme.light.colors.accent,
    "--color-button-contained-hover": theme.light.colors.buttonHover,
    "--button-shadow": "0 12px 30px rgba(53, 194, 161, 0.2)",
    "--color-icon-container": "rgba(53, 194, 161, 0.24)",
    "--color-icon-container-strong": "rgba(31, 137, 115, 0.6)",
    "--color-checkbox-border": "#8FB2A7",
    "--color-checkbox-background": "#FFFFFF",
    "--card-background": "rgba(255, 255, 255, 0.97)",
    "--card-border": "rgba(164, 189, 179, 0.85)",
    "--card-shadow": "0 16px 38px rgba(46, 99, 85, 0.16)",
    "--info-chip-background": "rgba(53, 194, 161, 0.12)",
    "--background-glow":
      "radial-gradient(circle at 20% 10%, rgba(107, 216, 190, 0.42), transparent 62%), radial-gradient(circle at 92% -8%, rgba(164, 222, 204, 0.4), transparent 55%)",
    "--body-background":
      "radial-gradient(circle at top, rgba(107, 216, 190, 0.22), transparent 58%), #FAFBFA",
    "--body-text-color": theme.light.colors.textPrimary,
    "--shadow-elevated": "0 18px 45px rgba(28, 76, 66, 0.1)"
  },
  dark: {
    "--color-background": theme.dark.colors.background,
    "--color-surface": theme.dark.colors.surface,
    "--color-surface-elevated": "#103637",
    "--color-surface-translucent": "rgba(10, 42, 43, 0.92)",
    "--color-border": theme.dark.colors.border,
    "--color-divider": "rgba(255,255,255,0.08)",
    "--color-text-primary": theme.dark.colors.textPrimary,
    "--color-text-secondary": theme.dark.colors.textSecondary,
    "--color-accent": theme.dark.colors.accent,
    "--color-accent-soft": "#2ED1BF",
    "--color-disabled": theme.dark.colors.disabled,
    "--color-error": theme.dark.colors.error,
    "--color-success": theme.dark.colors.success,
    "--color-warning": theme.dark.colors.warning,
    "--color-button-contained-text": "#041C1C",
    "--color-button-contained-bg": "linear-gradient(135deg, rgba(31,162,147,0.8), rgba(46,209,191,0.85))",
    "--color-button-contained-hover": theme.dark.colors.buttonHover,
    "--button-shadow": "0 12px 30px rgba(31, 162, 147, 0.25)",
    "--color-icon-container": "rgba(255, 255, 255, 0.06)",
    "--color-icon-container-strong": "rgba(46, 209, 191, 0.22)",
    "--color-checkbox-border": "rgba(255, 255, 255, 0.25)",
    "--color-checkbox-background": "rgba(255,255,255,0.03)",
    "--card-background": "rgba(10, 42, 43, 0.92)",
    "--card-border": "rgba(255, 255, 255, 0.06)",
    "--card-shadow": "0 18px 45px rgba(3, 20, 21, 0.45)",
    "--info-chip-background": "rgba(31, 162, 147, 0.18)",
    "--background-glow":
      "radial-gradient(circle at 20% 10%, rgba(46, 209, 191, 0.12), transparent 55%), radial-gradient(circle at 80% -10%, rgba(3, 85, 79, 0.35), transparent 50%)",
    "--body-background":
      "radial-gradient(circle at top, rgba(47, 109, 102, 0.2), transparent 60%), #041C1C",
    "--body-text-color": theme.dark.colors.textPrimary,
    "--shadow-elevated": "0 18px 45px rgba(3, 20, 21, 0.45)"
  }
};

export type ThemePalette = typeof theme.light | typeof theme.dark;
