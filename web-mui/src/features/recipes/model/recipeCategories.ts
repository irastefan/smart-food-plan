import type { RecipeCategoryKey } from "./recipeTypes";

export const recipeCategoryKeys: RecipeCategoryKey[] = [
  "all",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "salad",
  "soup",
  "main",
  "side",
  "drink"
];

export function normalizeRecipeCategory(value: string | undefined | null): RecipeCategoryKey | string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized.length > 0 ? normalized : "main";
}
