import { apiRequest } from "../../../shared/api/http";
import type { RecipeDetail, RecipeFormValues, RecipeIngredient, RecipeSummary, NutritionTotals } from "../model/recipeTypes";
import { normalizeRecipeCategory } from "../model/recipeCategories";

export type BackendRecipe = {
  id: string;
  title?: string;
  description?: string | null;
  isPublic?: boolean | null;
  category?: string | null;
  servings?: number | null;
  photoUrl?: string | null;
  cookTimeMinutes?: number | null;
  createdAt?: string;
  updatedAt?: string;
  nutritionTotal?: Record<string, unknown> | null;
  nutritionPerServing?: Record<string, unknown> | null;
  ingredients?: Array<{
    id?: string;
    isManual?: boolean | null;
    productId?: string | null;
    name?: string | null;
    amount?: number | null;
    unit?: string | null;
    kcal100?: number | null;
    protein100?: number | null;
    fat100?: number | null;
    carbs100?: number | null;
    product?: {
      id?: string;
      name?: string;
      kcal100?: number | null;
      protein100?: number | null;
      fat100?: number | null;
      carbs100?: number | null;
    } | null;
  }>;
  steps?: Array<string | { id?: string; text?: string | null; order?: number }>;
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

function createSlug(source: string): string {
  return source
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTotals(source?: Record<string, unknown> | null): NutritionTotals {
  const input = source ?? {};
  return {
    caloriesKcal: toNumber(input.caloriesKcal ?? input.calories ?? input.kcal),
    proteinG: toNumber(input.proteinG ?? input.protein),
    fatG: toNumber(input.fatG ?? input.fat),
    carbsG: toNumber(input.carbsG ?? input.carbs)
  };
}

function scaleTotals(base: NutritionTotals, amount: number, referenceAmount = 100): NutritionTotals {
  const factor = referenceAmount > 0 ? amount / referenceAmount : 0;
  return {
    caloriesKcal: Number.parseFloat((base.caloriesKcal * factor).toFixed(2)),
    proteinG: Number.parseFloat((base.proteinG * factor).toFixed(2)),
    fatG: Number.parseFloat((base.fatG * factor).toFixed(2)),
    carbsG: Number.parseFloat((base.carbsG * factor).toFixed(2))
  };
}

function sumTotals(items: NutritionTotals[]): NutritionTotals {
  return items.reduce(
    (acc, current) => ({
      caloriesKcal: Number.parseFloat((acc.caloriesKcal + current.caloriesKcal).toFixed(2)),
      proteinG: Number.parseFloat((acc.proteinG + current.proteinG).toFixed(2)),
      fatG: Number.parseFloat((acc.fatG + current.fatG).toFixed(2)),
      carbsG: Number.parseFloat((acc.carbsG + current.carbsG).toFixed(2))
    }),
    { caloriesKcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );
}

function mapIngredient(item: NonNullable<BackendRecipe["ingredients"]>[number]): RecipeIngredient {
  const amount = toNumber(item.amount);
  const isManual = Boolean(item.isManual) || !item.productId;
  const macros = {
    caloriesKcal: toNumber(item.kcal100 ?? item.product?.kcal100),
    proteinG: toNumber(item.protein100 ?? item.product?.protein100),
    fatG: toNumber(item.fat100 ?? item.product?.fat100),
    carbsG: toNumber(item.carbs100 ?? item.product?.carbs100)
  } satisfies NutritionTotals;

  return {
    id: item.id ?? crypto.randomUUID(),
    isManual,
    productId: item.productId ?? item.product?.id ?? undefined,
    title: (item.name ?? item.product?.name ?? "Ingredient").trim() || "Ingredient",
    quantity: amount,
    unit: item.unit ?? "g",
    referenceAmount: 100,
    referenceUnit: "g",
    macros,
    totals: scaleTotals(macros, amount)
  };
}

function mapSteps(steps: BackendRecipe["steps"]): string[] {
  return (steps ?? [])
    .map((step) => {
      if (typeof step === "string") {
        return step.trim();
      }
      return String(step.text ?? "").trim();
    })
    .filter(Boolean);
}

function mapSummary(recipe: BackendRecipe): RecipeSummary {
  const ingredients = (recipe.ingredients ?? []).map(mapIngredient);
  const nutritionTotal =
    recipe.nutritionTotal && Object.keys(recipe.nutritionTotal).length > 0
      ? normalizeTotals(recipe.nutritionTotal)
      : sumTotals(ingredients.map((item) => item.totals));
  const servings = Math.max(1, Math.round(toNumber(recipe.servings) || 1));
  const nutritionPerServing =
    recipe.nutritionPerServing && Object.keys(recipe.nutritionPerServing).length > 0
      ? normalizeTotals(recipe.nutritionPerServing)
      : scaleTotals(nutritionTotal, 1, servings);

  return {
    id: recipe.id,
    slug: createSlug(recipe.title ?? "recipe") || recipe.id,
    title: (recipe.title ?? "Recipe").trim() || "Recipe",
    description: recipe.description ?? undefined,
    isPublic: recipe.isPublic ?? undefined,
    category: String(normalizeRecipeCategory(recipe.category)),
    servings,
    nutritionTotal,
    nutritionPerServing,
    photoUrl: recipe.photoUrl ?? undefined,
    cookTimeMinutes: toNumber(recipe.cookTimeMinutes) || undefined,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };
}

function mapDetail(recipe: BackendRecipe): RecipeDetail {
  return {
    ...mapSummary(recipe),
    ingredients: (recipe.ingredients ?? []).map(mapIngredient),
    steps: mapSteps(recipe.steps)
  };
}

async function fetchRecipes(): Promise<BackendRecipe[]> {
  try {
    return await apiRequest<BackendRecipe[]>("/v1/me/recipes");
  } catch {
    return apiRequest<BackendRecipe[]>("/v1/recipes", undefined, { auth: false });
  }
}

export async function getRecipes(): Promise<RecipeSummary[]> {
  const recipes = await fetchRecipes();
  return recipes.map(mapSummary).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getRecipe(recipeId: string): Promise<RecipeDetail> {
  const recipe = await apiRequest<BackendRecipe>(`/v1/recipes/${recipeId}`);
  return mapDetail(recipe);
}

function toPayload(values: RecipeFormValues) {
  return {
    title: values.title,
    description: values.description || null,
    category: values.category,
    servings: values.servings,
    isPublic: false,
    ingredients: values.ingredients.map((ingredient) => ({
      productId: ingredient.isManual ? undefined : ingredient.productId,
      name: ingredient.isManual ? ingredient.name : undefined,
      amount: ingredient.amount,
      unit: ingredient.unit || "g",
      kcal100: ingredient.isManual ? ingredient.kcal100 : undefined,
      protein100: ingredient.isManual ? ingredient.protein100 : undefined,
      fat100: ingredient.isManual ? ingredient.fat100 : undefined,
      carbs100: ingredient.isManual ? ingredient.carbs100 : undefined
    })),
    steps: values.steps.filter((step) => step.trim().length > 0)
  };
}

export async function createRecipe(values: RecipeFormValues): Promise<RecipeDetail> {
  const created = await apiRequest<BackendRecipe>("/v1/recipes", {
    method: "POST",
    body: JSON.stringify(toPayload(values))
  });
  return mapDetail(created);
}

export async function updateRecipe(recipeId: string, values: RecipeFormValues): Promise<RecipeDetail> {
  const updated = await apiRequest<BackendRecipe>(`/v1/recipes/${recipeId}`, {
    method: "PATCH",
    body: JSON.stringify(toPayload(values))
  });
  return mapDetail(updated);
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await apiRequest(`/v1/recipes/${recipeId}`, { method: "DELETE" });
}
