const APP_PREFERENCES_STORAGE_KEY = "smartFoodPlanMui.appPreferences";

export type AppPreferences = {
  mealPlanSummaryMetric: "remaining" | "food";
  bodyMetricsHistoryDays: 30 | 60 | 90 | 180;
  mobileQuickNavItems: Array<"meal-plan" | "recipes" | "products" | "shopping" | "self-care" | "settings">;
  visibleBodyMetricFields: Array<
    "weightKg" | "neckCm" | "bustCm" | "underbustCm" | "waistCm" | "hipsCm" | "bicepsCm" | "forearmCm" | "thighCm" | "calfCm"
  >;
};

const defaultPreferences: AppPreferences = {
  mealPlanSummaryMetric: "food",
  bodyMetricsHistoryDays: 90,
  mobileQuickNavItems: ["meal-plan", "recipes", "shopping", "settings"],
  visibleBodyMetricFields: ["weightKg", "bustCm", "waistCm", "hipsCm"]
};

const VALID_MOBILE_NAV_ITEMS = new Set<AppPreferences["mobileQuickNavItems"][number]>([
  "meal-plan",
  "recipes",
  "products",
  "shopping",
  "self-care",
  "settings"
]);

const VALID_BODY_METRIC_FIELDS = new Set<AppPreferences["visibleBodyMetricFields"][number]>([
  "weightKg",
  "neckCm",
  "bustCm",
  "underbustCm",
  "waistCm",
  "hipsCm",
  "bicepsCm",
  "forearmCm",
  "thighCm",
  "calfCm"
]);

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
          : defaultPreferences.mealPlanSummaryMetric,
      bodyMetricsHistoryDays:
        parsed.bodyMetricsHistoryDays === 30 || parsed.bodyMetricsHistoryDays === 60 || parsed.bodyMetricsHistoryDays === 90 || parsed.bodyMetricsHistoryDays === 180
          ? parsed.bodyMetricsHistoryDays
          : defaultPreferences.bodyMetricsHistoryDays,
      mobileQuickNavItems: Array.isArray(parsed.mobileQuickNavItems)
        ? Array.from(new Set(parsed.mobileQuickNavItems)).filter(
            (item): item is AppPreferences["mobileQuickNavItems"][number] =>
              typeof item === "string" && VALID_MOBILE_NAV_ITEMS.has(item as AppPreferences["mobileQuickNavItems"][number])
          ).slice(0, 4)
        : defaultPreferences.mobileQuickNavItems,
      visibleBodyMetricFields: Array.isArray(parsed.visibleBodyMetricFields)
        ? parsed.visibleBodyMetricFields.filter(
            (field): field is AppPreferences["visibleBodyMetricFields"][number] =>
              typeof field === "string" && VALID_BODY_METRIC_FIELDS.has(field as AppPreferences["visibleBodyMetricFields"][number])
          )
        : defaultPreferences.visibleBodyMetricFields
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
