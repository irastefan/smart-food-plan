export const colors = {
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  surfaceElevated: "var(--color-surface-elevated)",
  surfaceTranslucent: "var(--color-surface-translucent)",
  border: "var(--color-border)",
  divider: "var(--color-divider)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  accent: "var(--color-accent)",
  accentSoft: "var(--color-accent-soft)",
  disabled: "var(--color-disabled)",
  error: "var(--color-error)",
  success: "var(--color-success)",
  warning: "var(--color-warning)"
} as const;

export const radii = {
  card: "var(--radius-card)",
  button: "var(--radius-button)",
  control: "var(--radius-control)"
} as const;

export const elevations = {
  button: "var(--button-shadow)",
  surface: "var(--shadow-elevated)"
} as const;
