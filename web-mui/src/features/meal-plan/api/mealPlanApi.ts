import { apiRequest } from "../../../shared/api/http";
import type { ProductSummary } from "../../products/api/productsApi";
import { createRecipe } from "../../recipes/api/recipesApi";
import type { RecipeFormValues } from "../../recipes/model/recipeTypes";
import type { RecipeSummary } from "../../recipes/model/recipeTypes";

export type NutritionTotals = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type NutritionPer100 = NutritionTotals;

export type MealPlanItem = {
  id: string;
  slot: string;
  type: "product" | "recipe";
  isManual: boolean;
  title: string;
  productId?: string | null;
  recipeId?: string | null;
  entryId?: string | null;
  amount?: number | null;
  unit?: string | null;
  servings?: number | null;
  nutritionPer100?: NutritionPer100 | null;
  nutritionTotal: NutritionTotals;
};

export type MealPlanSection = {
  id: string;
  title: string;
  items: MealPlanItem[];
  totals: NutritionTotals;
};

export type MealPlanDay = {
  date: string;
  sections: MealPlanSection[];
  totals: NutritionTotals;
};

type BackendEntry = {
  id?: string;
  name?: string;
  isManual?: boolean;
  productId?: string;
  recipeId?: string;
  slot?: string;
  type?: string;
  amount?: number;
  unit?: string;
  servings?: number;
  nutrition?: Record<string, unknown>;
  nutritionPer100?: Record<string, unknown>;
  nutritionTotal?: Record<string, unknown>;
  product?: {
    id?: string;
    name?: string;
  } | null;
  recipe?: {
    id?: string;
    title?: string;
    name?: string;
  } | null;
};

type BackendDay = {
  date: string;
  slots?: Record<string, BackendEntry[]>;
  nutritionBySlot?: Record<string, Record<string, unknown>>;
  nutritionTotal?: Record<string, unknown>;
};

const SLOT_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack"
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeTotals(input?: Record<string, unknown>): NutritionTotals {
  const source = input ?? {};
  return {
    caloriesKcal: toNumber(source.caloriesKcal ?? source.calories ?? source.kcal ?? source.kcal100),
    proteinG: toNumber(source.proteinG ?? source.protein ?? source.protein100),
    fatG: toNumber(source.fatG ?? source.fat ?? source.fat100),
    carbsG: toNumber(source.carbsG ?? source.carbs ?? source.carbs100)
  };
}

function slotTitle(slot: string): string {
  return SLOT_LABELS[slot] ?? slot;
}

function mapEntry(slot: string, entry: BackendEntry): MealPlanItem {
  const type = String(entry.type ?? "").toUpperCase() === "RECIPE" || entry.recipe ? "recipe" : "product";
  const title = entry.name ?? entry.product?.name ?? entry.recipe?.title ?? entry.recipe?.name ?? "Item";
  const isManual =
    Boolean(entry.isManual) ||
    (type === "product" && !entry.productId && !entry.product?.id && !entry.recipeId && !entry.recipe?.id);
  const nutritionTotal = normalizeTotals((entry.nutritionTotal ?? entry.nutrition) as Record<string, unknown> | undefined);
  const nutritionPer100 = type === "product"
    ? normalizeTotals(entry.nutritionPer100 as Record<string, unknown> | undefined)
    : null;

  return {
    id: entry.id ?? `${slot}-${title}`,
    slot,
    type,
    isManual,
    title,
    productId: type === "product" ? entry.productId ?? entry.product?.id ?? null : null,
    recipeId: type === "recipe" ? entry.recipeId ?? entry.recipe?.id ?? null : null,
    entryId: entry.id ?? null,
    amount: type === "product" ? toNumber(entry.amount) || null : null,
    unit: type === "product" ? entry.unit ?? "g" : null,
    servings: type === "recipe" ? toNumber(entry.servings) || 1 : null,
    nutritionPer100,
    nutritionTotal
  };
}

function mapDay(day: BackendDay): MealPlanDay {
  const sectionsOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

  const sections = sectionsOrder.map((slot) => {
    const entries = day.slots?.[slot] ?? [];
    return {
      id: slot.toLowerCase(),
      title: slotTitle(slot),
      items: entries.map((entry) => mapEntry(slot, entry)),
      totals: normalizeTotals(day.nutritionBySlot?.[slot])
    };
  });

  return {
    date: day.date,
    sections,
    totals: normalizeTotals(day.nutritionTotal)
  };
}

export async function getMealPlanDay(date: string): Promise<MealPlanDay> {
  const response = await apiRequest<BackendDay>(`/v1/meal-plans/day?date=${encodeURIComponent(date)}`);
  return mapDay(response);
}

function normalizeProductAmountAndUnit(
  amount: number | undefined,
  unit: string | undefined
): { amount: number; unit: string } {
  const safeAmount = Number.isFinite(amount) && (amount as number) > 0 ? (amount as number) : 100;
  const rawUnit = (unit ?? "").trim().toLowerCase();
  const normalizedUnit =
    rawUnit === "г" || rawUnit === "гр" ? "g"
      : rawUnit === "мл" ? "ml"
      : rawUnit;

  if (normalizedUnit === "" || normalizedUnit === "g" || normalizedUnit === "gr" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return { amount: safeAmount, unit: "g" };
  }

  return { amount: safeAmount, unit: "g" };
}

function normalizeManualItemPayload(item: {
  name: string;
  amount: number;
  unit: string;
  kcal100: number;
  protein100: number;
  fat100: number;
  carbs100: number;
}) {
  const rawUnit = (item.unit ?? "").trim().toLowerCase();
  const normalizedUnit =
    rawUnit === "г" || rawUnit === "гр" ? "g"
      : rawUnit === "мл" ? "ml"
      : rawUnit;
  const safeAmount = Number.isFinite(item.amount) && item.amount > 0 ? item.amount : 100;

  if (normalizedUnit === "" || normalizedUnit === "g" || normalizedUnit === "gr" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return {
      ...item,
      amount: safeAmount,
      unit: "g"
    };
  }

  if (normalizedUnit === "ml") {
    return {
      ...item,
      amount: safeAmount,
      unit: "ml"
    };
  }

  return {
    ...item,
    amount: 100,
    unit: "g",
    kcal100: item.kcal100 * safeAmount,
    protein100: item.protein100 * safeAmount,
    fat100: item.fat100 * safeAmount,
    carbs100: item.carbs100 * safeAmount
  };
}

function sectionToSlot(sectionId: string): string {
  const normalized = sectionId.toLowerCase();
  if (normalized === "breakfast") return "BREAKFAST";
  if (normalized === "lunch") return "LUNCH";
  if (normalized === "dinner") return "DINNER";
  return "SNACK";
}

function inferNutritionPer100(item: MealPlanItem): NutritionPer100 {
  if (item.nutritionPer100) {
    return item.nutritionPer100;
  }

  if (item.type === "product" && item.amount && item.amount > 0) {
    const factor = 100 / item.amount;
    return {
      caloriesKcal: item.nutritionTotal.caloriesKcal * factor,
      proteinG: item.nutritionTotal.proteinG * factor,
      fatG: item.nutritionTotal.fatG * factor,
      carbsG: item.nutritionTotal.carbsG * factor
    };
  }

  if (item.type === "recipe") {
    return {
      caloriesKcal: item.nutritionTotal.caloriesKcal * 100,
      proteinG: item.nutritionTotal.proteinG * 100,
      fatG: item.nutritionTotal.fatG * 100,
      carbsG: item.nutritionTotal.carbsG * 100
    };
  }

  return {
    caloriesKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0
  };
}

export async function addProductToMealPlan(
  date: string,
  sectionId: string,
  product: ProductSummary,
  options?: { quantity?: number; unit?: string }
): Promise<MealPlanDay> {
  const normalized = normalizeProductAmountAndUnit(options?.quantity, options?.unit);
  await apiRequest("/v1/meal-plans/day/entries", {
    method: "POST",
    body: JSON.stringify({
      date,
      slot: sectionToSlot(sectionId),
      productId: product.id,
      amount: normalized.amount,
      unit: normalized.unit
    })
  });

  return getMealPlanDay(date);
}

export async function addManualItemToMealPlan(
  date: string,
  sectionId: string,
  item: {
    name: string;
    amount: number;
    unit: string;
    kcal100: number;
    protein100: number;
    fat100: number;
    carbs100: number;
  }
): Promise<MealPlanDay> {
  const normalized = normalizeManualItemPayload(item);

  await apiRequest("/v1/meal-plans/day/entries", {
    method: "POST",
    body: JSON.stringify({
      date,
      slot: sectionToSlot(sectionId),
      name: normalized.name,
      amount: normalized.amount,
      unit: normalized.unit,
      kcal100: normalized.kcal100,
      protein100: normalized.protein100,
      fat100: normalized.fat100,
      carbs100: normalized.carbs100
    })
  });

  return getMealPlanDay(date);
}

export async function addManualItemsToMealPlan(
  date: string,
  sectionId: string,
  items: Array<{
    name: string;
    amount: number;
    unit: string;
    kcal100: number;
    protein100: number;
    fat100: number;
    carbs100: number;
  }>
): Promise<MealPlanDay> {
  for (const item of items) {
    const normalized = normalizeManualItemPayload(item);

    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date,
        slot: sectionToSlot(sectionId),
        name: normalized.name,
        amount: normalized.amount,
        unit: normalized.unit,
        kcal100: normalized.kcal100,
        protein100: normalized.protein100,
        fat100: normalized.fat100,
        carbs100: normalized.carbs100
      })
    });
  }

  return getMealPlanDay(date);
}

export async function addRecipeToMealPlan(
  date: string,
  sectionId: string,
  recipe: RecipeSummary,
  options?: { servings?: number }
): Promise<MealPlanDay> {
  await apiRequest("/v1/meal-plans/day/entries", {
    method: "POST",
    body: JSON.stringify({
      date,
      slot: sectionToSlot(sectionId),
      recipeId: recipe.id,
      servings: options?.servings ?? 1
    })
  });

  return getMealPlanDay(date);
}

export async function removeMealPlanItem(date: string, item: MealPlanItem): Promise<MealPlanDay> {
  if (!item.entryId) {
    return getMealPlanDay(date);
  }

  await apiRequest(`/v1/meal-plans/day/entries/${item.entryId}`, { method: "DELETE" });
  return getMealPlanDay(date);
}

export async function updateMealPlanItem(
  date: string,
  sectionId: string,
  item: MealPlanItem,
  updates: { quantity?: number; unit?: string; servings?: number }
): Promise<MealPlanDay> {
  if (item.entryId) {
    await apiRequest(`/v1/meal-plans/day/entries/${item.entryId}`, { method: "DELETE" });
  }

  if (item.type === "product") {
    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date,
        slot: sectionToSlot(sectionId),
        ...(item.isManual
          ? normalizeManualItemPayload({
              name: item.title,
              amount: updates.quantity ?? item.amount ?? 100,
              unit: updates.unit ?? item.unit ?? "g",
              kcal100: item.nutritionPer100?.caloriesKcal ?? 0,
              protein100: item.nutritionPer100?.proteinG ?? 0,
              fat100: item.nutritionPer100?.fatG ?? 0,
              carbs100: item.nutritionPer100?.carbsG ?? 0
            })
          : {
              productId: item.productId,
              amount: updates.quantity ?? item.amount ?? 100,
              unit: updates.unit ?? item.unit ?? "g"
            })
      })
    });
  } else {
    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date,
        slot: sectionToSlot(sectionId),
        recipeId: item.recipeId,
        servings: updates.servings ?? item.servings ?? 1
      })
    });
  }

  return getMealPlanDay(date);
}

export async function saveMealPlanSectionAsRecipe(section: MealPlanSection, recipeTitle: string) {
  const normalizedCategory = section.id.toLowerCase();
  const payload: RecipeFormValues = {
    title: recipeTitle.trim(),
    description: "",
    category: normalizedCategory,
    servings: 1,
    steps: [],
    ingredients: section.items.map((item) => {
      const per100 = inferNutritionPer100(item);

      if (item.type === "product" && !item.isManual && item.productId) {
        return {
          id: item.id,
          isManual: false,
          productId: item.productId,
          name: item.title,
          amount: item.amount ?? 100,
          unit: item.unit ?? "g",
          kcal100: Math.round(per100.caloriesKcal),
          protein100: Math.round(per100.proteinG),
          fat100: Math.round(per100.fatG),
          carbs100: Math.round(per100.carbsG)
        };
      }

      return {
        id: item.id,
        isManual: true,
        productId: undefined,
        name: item.title,
        amount: item.type === "recipe" ? 1 : item.amount ?? 100,
        unit: item.type === "recipe" ? "portion" : item.unit ?? "g",
        kcal100: Math.round(per100.caloriesKcal),
        protein100: Math.round(per100.proteinG),
        fat100: Math.round(per100.fatG),
        carbs100: Math.round(per100.carbsG)
      };
    })
  };

  return createRecipe(payload);
}

export async function copyMealPlanSectionToDate(section: MealPlanSection, targetDate: string): Promise<void> {
  for (const item of section.items) {
    if (item.type === "recipe" && item.recipeId) {
      await apiRequest("/v1/meal-plans/day/entries", {
        method: "POST",
        body: JSON.stringify({
          date: targetDate,
          slot: sectionToSlot(section.id),
          recipeId: item.recipeId,
          servings: item.servings ?? 1
        })
      });
      continue;
    }

    if (item.type === "product" && !item.isManual && item.productId) {
      await apiRequest("/v1/meal-plans/day/entries", {
        method: "POST",
        body: JSON.stringify({
          date: targetDate,
          slot: sectionToSlot(section.id),
          productId: item.productId,
          amount: item.amount ?? 100,
          unit: item.unit ?? "g"
        })
      });
      continue;
    }

    const per100 = inferNutritionPer100(item);
    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date: targetDate,
        slot: sectionToSlot(section.id),
        ...normalizeManualItemPayload({
          name: item.title,
          amount: item.type === "recipe" ? 1 : item.amount ?? 100,
          unit: item.type === "recipe" ? "portion" : item.unit ?? "g",
          kcal100: Math.round(per100.caloriesKcal),
          protein100: Math.round(per100.proteinG),
          fat100: Math.round(per100.fatG),
          carbs100: Math.round(per100.carbsG)
        })
      })
    });
  }
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMealCompletion(day: MealPlanDay): number {
  const totalItems = day.sections.reduce((acc, section) => acc + section.items.length, 0);
  return Math.min(100, totalItems * 12);
}

export function getMacroDistribution(day: MealPlanDay): Array<{ key: string; label: string; value: number; color: string }> {
  return [
    { key: "protein", label: "Protein", value: day.totals.proteinG, color: "#22c55e" },
    { key: "fat", label: "Fat", value: day.totals.fatG, color: "#f59e0b" },
    { key: "carbs", label: "Carbs", value: day.totals.carbsG, color: "#0ea5e9" }
  ];
}
