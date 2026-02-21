import { apiRequest } from "@/utils/apiClient";
import { createSlug, persistProductMarkdown } from "@/utils/vaultProducts";
import type { NutritionTotals } from "@/utils/vaultDays";

export type RecipeIngredient = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  referenceAmount: number;
  referenceUnit: string;
  macros: NutritionTotals;
  totals: NutritionTotals;
  product?: {
    slug?: string;
    ref?: string;
    title?: string;
    fileName?: string;
  };
};

export type RecipeSummary = {
  fileName: string;
  slug: string;
  title: string;
  description?: string;
  servings: number;
  nutritionTotal: NutritionTotals;
  nutritionPerServing: NutritionTotals;
  photoUrl?: string;
  cookTimeMinutes?: number;
  updatedAt?: string;
  createdAt?: string;
  tags?: string[];
};

export type RecipeDetail = RecipeSummary & {
  stepsMarkdown: string;
  ingredients: RecipeIngredient[];
};

export type RecipeIngredientDraft = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  referenceAmount: number;
  referenceUnit: string;
  macros: Partial<NutritionTotals>;
  product?: {
    slug?: string;
    ref?: string;
    title?: string;
    fileName?: string;
  };
};

export type RecipeFormData = {
  title: string;
  description?: string;
  servings: number;
  photoUrl?: string;
  stepsMarkdown: string;
  ingredients: RecipeIngredientDraft[];
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
};

type BackendRecipe = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  servings?: number;
  isPublic?: boolean;
  ingredients?: Array<{
    id?: string;
    productId?: string;
    amount?: number;
    unit?: string;
    name?: string;
    product?: {
      id?: string;
      name?: string;
      kcal100?: number;
      protein100?: number;
      fat100?: number;
      carbs100?: number;
    };
  }>;
  steps?: string[];
  createdAt?: string;
  updatedAt?: string;
  photoUrl?: string;
  cookTimeMinutes?: number;
  nutritionTotal?: Partial<NutritionTotals>;
  nutritionPerServing?: Partial<NutritionTotals>;
};

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeTotals(value?: Partial<NutritionTotals>): NutritionTotals {
  return {
    caloriesKcal: safeNumber(value?.caloriesKcal),
    proteinG: safeNumber(value?.proteinG),
    fatG: safeNumber(value?.fatG),
    carbsG: safeNumber(value?.carbsG),
    sugarG: safeNumber(value?.sugarG),
    fiberG: safeNumber(value?.fiberG)
  };
}

function sumTotals(values: NutritionTotals[]): NutritionTotals {
  return values.reduce(
    (acc, item) => ({
      caloriesKcal: Number.parseFloat((acc.caloriesKcal + item.caloriesKcal).toFixed(2)),
      proteinG: Number.parseFloat((acc.proteinG + item.proteinG).toFixed(2)),
      fatG: Number.parseFloat((acc.fatG + item.fatG).toFixed(2)),
      carbsG: Number.parseFloat((acc.carbsG + item.carbsG).toFixed(2)),
      sugarG: Number.parseFloat(((acc.sugarG ?? 0) + (item.sugarG ?? 0)).toFixed(2)),
      fiberG: Number.parseFloat(((acc.fiberG ?? 0) + (item.fiberG ?? 0)).toFixed(2))
    }),
    { caloriesKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, sugarG: 0, fiberG: 0 }
  );
}

function scaleTotals(base: NutritionTotals, amount: number, referenceAmount = 100): NutritionTotals {
  const factor = referenceAmount > 0 ? amount / referenceAmount : 0;
  return {
    caloriesKcal: Number.parseFloat((base.caloriesKcal * factor).toFixed(2)),
    proteinG: Number.parseFloat((base.proteinG * factor).toFixed(2)),
    fatG: Number.parseFloat((base.fatG * factor).toFixed(2)),
    carbsG: Number.parseFloat((base.carbsG * factor).toFixed(2)),
    sugarG: Number.parseFloat(((base.sugarG ?? 0) * factor).toFixed(2)),
    fiberG: Number.parseFloat(((base.fiberG ?? 0) * factor).toFixed(2))
  };
}

function stepsToMarkdown(steps?: string[]): string {
  const normalized = (steps ?? []).map((step) => step.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return "";
  }
  return normalized.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function markdownToSteps(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

function ingredientFromBackend(item: NonNullable<BackendRecipe["ingredients"]>[number]): RecipeIngredient {
  const amount = safeNumber(item.amount);
  const per100 = {
    caloriesKcal: safeNumber(item.product?.kcal100),
    proteinG: safeNumber(item.product?.protein100),
    fatG: safeNumber(item.product?.fat100),
    carbsG: safeNumber(item.product?.carbs100),
    sugarG: 0,
    fiberG: 0
  } satisfies NutritionTotals;

  return {
    id: item.id ?? crypto.randomUUID(),
    title: item.name ?? item.product?.name ?? "Ingredient",
    quantity: amount,
    unit: item.unit ?? "g",
    referenceAmount: 100,
    referenceUnit: "g",
    macros: per100,
    totals: scaleTotals(per100, amount, 100),
    product: {
      fileName: item.productId ?? item.product?.id,
      slug: createSlug(item.product?.name ?? item.name ?? "ingredient"),
      title: item.product?.name ?? item.name
    }
  };
}

function toSummary(recipe: BackendRecipe): RecipeSummary {
  const ingredients = (recipe.ingredients ?? []).map(ingredientFromBackend);
  const nutritionTotal =
    recipe.nutritionTotal && Object.keys(recipe.nutritionTotal).length > 0
      ? normalizeTotals(recipe.nutritionTotal)
      : sumTotals(ingredients.map((item) => item.totals));

  const servings = safeNumber(recipe.servings) > 0 ? Math.max(1, Math.round(safeNumber(recipe.servings))) : 1;

  const nutritionPerServing =
    recipe.nutritionPerServing && Object.keys(recipe.nutritionPerServing).length > 0
      ? normalizeTotals(recipe.nutritionPerServing)
      : scaleTotals(nutritionTotal, 1, servings);

  return {
    fileName: recipe.id,
    slug: createSlug(recipe.title ?? "recipe") || recipe.id,
    title: recipe.title?.trim() || "Recipe",
    description: recipe.description,
    servings,
    nutritionTotal,
    nutritionPerServing,
    photoUrl: recipe.photoUrl,
    cookTimeMinutes: recipe.cookTimeMinutes,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    tags: recipe.category ? [recipe.category] : []
  };
}

function toDetail(recipe: BackendRecipe): RecipeDetail & { fileName: string } {
  const summary = toSummary(recipe);
  return {
    ...summary,
    fileName: summary.fileName,
    stepsMarkdown: stepsToMarkdown(recipe.steps),
    ingredients: (recipe.ingredients ?? []).map(ingredientFromBackend)
  };
}

async function fetchMyRecipes(): Promise<BackendRecipe[]> {
  try {
    return await apiRequest<BackendRecipe[]>("/v1/me/recipes");
  } catch {
    return apiRequest<BackendRecipe[]>("/v1/recipes", undefined, { auth: false });
  }
}

async function ensureProductForIngredient(ingredient: RecipeIngredientDraft): Promise<string> {
  const existing = ingredient.product?.fileName?.trim();
  if (existing) {
    return existing;
  }

  const referenceAmount = ingredient.referenceAmount > 0 ? ingredient.referenceAmount : 100;
  const factor = 100 / referenceAmount;

  const created = await persistProductMarkdown({} as FileSystemDirectoryHandle, {
    productName: ingredient.title || "Ingredient",
    portion: "100",
    calories: String(safeNumber(ingredient.macros.caloriesKcal) * factor),
    protein: String(safeNumber(ingredient.macros.proteinG) * factor),
    fat: String(safeNumber(ingredient.macros.fatG) * factor),
    carbs: String(safeNumber(ingredient.macros.carbsG) * factor)
  });

  return created.fileName;
}

export async function loadRecipeSummaries(
  _vaultHandle: FileSystemDirectoryHandle
): Promise<RecipeSummary[]> {
  const recipes = await fetchMyRecipes();
  return recipes.map(toSummary).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function loadRecipeDetail(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<RecipeDetail & { fileName: string }> {
  const item = await apiRequest<BackendRecipe>(`/v1/recipes/${fileName}`, undefined, { auth: false });
  return toDetail(item);
}

export async function persistRecipe(
  _vaultHandle: FileSystemDirectoryHandle,
  data: RecipeFormData
): Promise<{ fileName: string; slug: string }> {
  const ingredients = await Promise.all(
    data.ingredients.map(async (ingredient) => ({
      productId: await ensureProductForIngredient(ingredient),
      amount: ingredient.quantity,
      unit: ingredient.unit || "g"
    }))
  );

  const created = await apiRequest<BackendRecipe>("/v1/recipes", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      category: data.tags?.[0] ?? "",
      description: data.description ?? "",
      servings: data.servings,
      isPublic: false,
      ingredients,
      steps: markdownToSteps(data.stepsMarkdown)
    })
  });

  const summary = toSummary(created);
  return { fileName: summary.fileName, slug: summary.slug };
}

export async function updateRecipe(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string,
  data: RecipeFormData & { slug?: string }
): Promise<{ fileName: string; slug: string }> {
  const ingredients = await Promise.all(
    data.ingredients.map(async (ingredient) => ({
      productId: await ensureProductForIngredient(ingredient),
      amount: ingredient.quantity,
      unit: ingredient.unit || "g"
    }))
  );

  const updated = await apiRequest<BackendRecipe>(`/v1/recipes/${fileName}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: data.title,
      category: data.tags?.[0] ?? "",
      description: data.description ?? "",
      servings: data.servings,
      ingredients,
      steps: markdownToSteps(data.stepsMarkdown)
    })
  });

  const summary = toSummary(updated);
  return { fileName: summary.fileName, slug: summary.slug };
}

export async function deleteRecipe(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  await apiRequest(`/v1/recipes/${fileName}`, { method: "DELETE" });
}
