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

  if (
    normalized === "drink" ||
    normalized === "drinks" ||
    normalized === "beverage" ||
    normalized === "beverages" ||
    normalized === "coffee" ||
    normalized === "кофе" ||
    normalized === "напиток" ||
    normalized === "напитки" ||
    normalized === "кофе/напитки"
  ) {
    return "drink";
  }

  return normalized.length > 0 ? normalized : "main";
}

export function getRecipeCategoryLabel(
  category: string,
  t: (key: any, params?: Record<string, string | number>) => string
): string {
  const normalized = String(normalizeRecipeCategory(category));
  const translated = t(`recipes.categories.${normalized}` as never);
  return translated === `recipes.categories.${normalized}` ? category : translated;
}
