const APP_PREFERENCES_STORAGE_KEY = "smartFoodPlanMui.appPreferences";

export type AppPreferences = {
  mealPlanSummaryMetric: "remaining" | "food";
};

const defaultPreferences: AppPreferences = {
  mealPlanSummaryMetric: "food"
};

export function getAppPreferences(): AppPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      mealPlanSummaryMetric:
        parsed.mealPlanSummaryMetric === "food" || parsed.mealPlanSummaryMetric === "remaining"
          ? parsed.mealPlanSummaryMetric
          : defaultPreferences.mealPlanSummaryMetric
    };
  } catch {
    return defaultPreferences;
  }
}

export function setAppPreferences(value: AppPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
}
