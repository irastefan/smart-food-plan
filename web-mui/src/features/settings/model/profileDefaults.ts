import type { UserGoal } from "../api/settingsApi";

export function getDefaultCalorieDelta(goal: UserGoal): number | null {
  switch (goal) {
    case "LOSE":
      return 200;
    case "GAIN":
      return 200;
    case "MAINTAIN":
      return 0;
    default:
      return null;
  }
}

export function getEffectiveCalorieDelta(goal: UserGoal, value: number | null): number | null {
  if (goal === "MAINTAIN") {
    return 0;
  }
  if (value == null || !Number.isFinite(value)) {
    return getDefaultCalorieDelta(goal);
  }
  return Math.abs(value);
}

export function formatCalorieDelta(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return String(Math.abs(value));
}

export function parseCalorieDelta(value: string): number | null {
  const normalized = value.trim().replace(",", ".").replace(/[+-]/g, "");
  if (!normalized || normalized === "+" || normalized === "-") {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.abs(parsed) : null;
}
