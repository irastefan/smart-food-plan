const OPENAI_API_KEY_STORAGE_KEY = "smartFoodPlanMui.openAiApiKey";

export function getOpenAiApiKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? "";
}

export function setOpenAiApiKey(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (value.trim().length === 0) {
    window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, value.trim());
}
