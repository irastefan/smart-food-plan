export const macroColors = {
  protein: "#f2b37a",
  fat: "#c7a3f5",
  carbs: "#7ecfc7"
} as const;

export function getMacroColor(key: "protein" | "fat" | "carbs"): string {
  return macroColors[key];
}
