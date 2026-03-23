const AI_AGENT_SETTINGS_STORAGE_KEY = "smartFoodPlanMui.aiAgentSettings";

export type AiAgentSettings = {
  model: string;
  userInstructions: string;
  showToolOutput: boolean;
  speechLanguage: "interface" | "en" | "ru";
  mealPlanSummaryMetric: "remaining" | "food";
};

const defaultSettings: AiAgentSettings = {
  model: "gpt-5-mini",
  userInstructions: "",
  showToolOutput: false,
  speechLanguage: "interface",
  mealPlanSummaryMetric: "remaining"
};

export function getAiAgentSettings(): AiAgentSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const raw = window.localStorage.getItem(AI_AGENT_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiAgentSettings>;
    return {
      model: typeof parsed.model === "string" && parsed.model.trim().length > 0 ? parsed.model.trim() : defaultSettings.model,
      userInstructions:
        typeof parsed.userInstructions === "string" ? parsed.userInstructions : defaultSettings.userInstructions,
      showToolOutput:
        typeof parsed.showToolOutput === "boolean" ? parsed.showToolOutput : defaultSettings.showToolOutput,
      speechLanguage:
        parsed.speechLanguage === "en" || parsed.speechLanguage === "ru" || parsed.speechLanguage === "interface"
          ? parsed.speechLanguage
          : defaultSettings.speechLanguage,
      mealPlanSummaryMetric:
        parsed.mealPlanSummaryMetric === "food" || parsed.mealPlanSummaryMetric === "remaining"
          ? parsed.mealPlanSummaryMetric
          : defaultSettings.mealPlanSummaryMetric
    };
  } catch {
    return defaultSettings;
  }
}

export function setAiAgentSettings(value: AiAgentSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AI_AGENT_SETTINGS_STORAGE_KEY, JSON.stringify(value));
}
