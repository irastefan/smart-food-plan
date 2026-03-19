import type { UserGoal } from "../api/settingsApi";

export function getDefaultCalorieDelta(goal: UserGoal): number | null {
  switch (goal) {
    case "LOSE":
      return -200;
    case "GAIN":
      return 300;
    case "MAINTAIN":
      return 0;
    default:
      return null;
  }
}

export function formatCalorieDelta(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export function parseCalorieDelta(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || normalized === "+" || normalized === "-") {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
