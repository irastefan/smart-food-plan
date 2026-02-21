import { apiRequest } from "@/utils/apiClient";
import type { ProductSummary } from "@/utils/vaultProducts";
import type { RecipeSummary } from "@/utils/vaultRecipes";

export type NutritionTotals = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG?: number | null;
  fiberG?: number | null;
};

export type NutritionTargetsSnapshot = {
  caloriesKcal?: number | null;
  proteinG?: number | null;
  fatG?: number | null;
  carbsG?: number | null;
  sugarG?: number | null;
  fiberG?: number | null;
};

export type MealPlanItem = {
  type: "product" | "recipe";
  ref: string;
  title: string;
  portionGrams?: number | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  servings?: number | null;
  nutrition: NutritionTotals;
  source?: {
    kind: "product" | "recipe";
    slug?: string;
    fileName?: string;
    entryId?: string;
    slot?: string;
  };
};

export type MealPlanSection = {
  id: string;
  name?: string;
  items: MealPlanItem[];
  totals: NutritionTotals;
};

export type MealPlanDayMeta = Record<string, unknown> & {
  weightKg?: number | null;
};

export type MealPlanDay = {
  date: string;
  sections: MealPlanSection[];
  totals: NutritionTotals;
  targetsSnapshot?: NutritionTargetsSnapshot | null;
  wellness?: {
    mood?: string;
    sleepHours?: number | null;
    steps?: number | null;
    notes?: string | null;
  } | null;
  updatedAt?: string;
  meta?: MealPlanDayMeta;
};

export type MealPlanUpdateResult = {
  day: MealPlanDay;
};

type BackendEntry = {
  id?: string;
  productId?: string;
  recipeId?: string;
  title?: string;
  name?: string;
  amount?: number;
  unit?: string;
  servings?: number;
  nutrition?: Record<string, unknown>;
  nutritionTotal?: Record<string, unknown>;
  product?: {
    id?: string;
    name?: string;
  };
  recipe?: {
    id?: string;
    title?: string;
    name?: string;
  };
};

type BackendDay = {
  id?: string;
  date: string;
  slots?: Record<string, BackendEntry[]>;
  nutritionBySlot?: Record<string, Record<string, unknown>>;
  nutritionTotal?: Record<string, unknown>;
  updatedAt?: string;
};

const WEIGHT_KEY = "smartFoodPlan.dayWeights";

const SLOT_TO_SECTION: Record<string, string> = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  SNACK: "snack"
};

const SECTION_TO_SLOT: Record<string, string> = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  snack: "SNACK",
  flex: "SNACK"
};

const EMPTY_TOTALS: NutritionTotals = {
  caloriesKcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  sugarG: 0,
  fiberG: 0
};

function normalizeProductAmountAndUnit(
  amount: number | undefined,
  unit: string | undefined,
  product: ProductSummary
): { amount: number; unit: string } {
  const safeAmount = Number.isFinite(amount) && (amount as number) > 0 ? (amount as number) : product.portionGrams ?? 100;
  const rawUnit = (unit ?? "").trim().toLowerCase();

  const isGramLike = rawUnit === "g" || rawUnit === "gr" || rawUnit === "gram" || rawUnit === "grams" || rawUnit === "г" || rawUnit === "гр";
  if (isGramLike || rawUnit === "") {
    return { amount: safeAmount, unit: "g" };
  }

  const isPortionLike = rawUnit === "portion" || rawUnit === "portions" || rawUnit === "serving" || rawUnit === "servings" || rawUnit.startsWith("порц");
  if (isPortionLike) {
    const gramsPerPortion = product.portionGrams && product.portionGrams > 0 ? product.portionGrams : 100;
    return { amount: Number.parseFloat((safeAmount * gramsPerPortion).toFixed(2)), unit: "g" };
  }

  return { amount: safeAmount, unit: "g" };
}

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

function normalizeTotals(input?: Record<string, unknown> | NutritionTotals): NutritionTotals {
  const source = (input ?? {}) as Record<string, unknown>;
  return {
    caloriesKcal: toNumber(source.caloriesKcal ?? source.kcal ?? source.calories),
    proteinG: toNumber(source.proteinG ?? source.protein_g ?? source.protein),
    fatG: toNumber(source.fatG ?? source.fat_g ?? source.fat),
    carbsG: toNumber(source.carbsG ?? source.carbs_g ?? source.carbs),
    sugarG: toNumber(source.sugarG ?? source.sugar_g),
    fiberG: toNumber(source.fiberG ?? source.fiber_g)
  };
}

function addTotals(left: NutritionTotals, right: NutritionTotals): NutritionTotals {
  return {
    caloriesKcal: Number.parseFloat((left.caloriesKcal + right.caloriesKcal).toFixed(2)),
    proteinG: Number.parseFloat((left.proteinG + right.proteinG).toFixed(2)),
    fatG: Number.parseFloat((left.fatG + right.fatG).toFixed(2)),
    carbsG: Number.parseFloat((left.carbsG + right.carbsG).toFixed(2)),
    sugarG: Number.parseFloat(((left.sugarG ?? 0) + (right.sugarG ?? 0)).toFixed(2)),
    fiberG: Number.parseFloat(((left.fiberG ?? 0) + (right.fiberG ?? 0)).toFixed(2))
  };
}

function buildEmptyDay(date: string): MealPlanDay {
  return {
    date,
    sections: ["breakfast", "lunch", "dinner", "snack"].map((id) => ({
      id,
      name: undefined,
      items: [],
      totals: { ...EMPTY_TOTALS }
    })),
    totals: { ...EMPTY_TOTALS },
    targetsSnapshot: null,
    wellness: null,
    updatedAt: new Date().toISOString(),
    meta: {}
  };
}

function mapEntry(slot: string, entry: BackendEntry): MealPlanItem {
  const backendType = String((entry as unknown as { type?: string }).type ?? "").toUpperCase();
  const type = backendType === "RECIPE" || entry.recipe || entry.recipeId ? "recipe" : "product";
  const productId = entry.productId ?? entry.product?.id;
  const recipeId = entry.recipeId ?? entry.recipe?.id;
  const id = (type === "recipe" ? recipeId : productId) ?? entry.id ?? crypto.randomUUID();
  const title =
    entry.title ??
    entry.name ??
    entry.product?.name ??
    entry.recipe?.title ??
    entry.recipe?.name ??
    "Item";

  const nutrition = normalizeTotals(entry.nutrition ?? entry.nutritionTotal);

  return {
    type,
    ref: `${type}:${id}`,
    title,
    portionGrams: type === "product" ? 100 : null,
    quantity: type === "product" ? toNumber(entry.amount) || null : null,
    quantityUnit: type === "product" ? entry.unit ?? "g" : null,
    servings: type === "recipe" ? toNumber(entry.servings) || 1 : null,
    nutrition,
    source: {
      kind: type,
      slug: id,
      fileName: id,
      entryId: entry.id,
      slot
    }
  };
}

function mapDay(day: BackendDay): MealPlanDay {
  const base = buildEmptyDay(day.date);
  const weights = loadWeights();
  const slots = day.slots ?? {};

  const sections: MealPlanSection[] = Object.entries(slots).map(([slot, entries]) => {
    const id = SLOT_TO_SECTION[slot] ?? slot.toLowerCase();
    const items = (entries ?? []).map((entry) => mapEntry(slot, entry));
    const totals = items.reduce((acc, item) => addTotals(acc, item.nutrition), { ...EMPTY_TOTALS });

    return {
      id,
      name: id,
      items,
      totals
    };
  });

  base.sections = sections.length > 0 ? sections : base.sections;
  base.totals = day.nutritionTotal ? normalizeTotals(day.nutritionTotal) : sections.reduce((acc, section) => addTotals(acc, section.totals), { ...EMPTY_TOTALS });
  base.updatedAt = day.updatedAt;
  base.meta = {
    ...(base.meta ?? {}),
    weightKg: weights[day.date] ?? null
  };

  return base;
}

function ensureIsoDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  return new Date(date).toISOString().slice(0, 10);
}

function loadWeights(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(WEIGHT_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, number> = {};
    Object.entries(parsed).forEach(([date, value]) => {
      const num = toNumber(value);
      if (num > 0) {
        result[date] = Number.parseFloat(num.toFixed(1));
      }
    });
    return result;
  } catch {
    return {};
  }
}

function saveWeights(weights: Record<string, number>): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(WEIGHT_KEY, JSON.stringify(weights));
}

function sectionToSlot(sectionId?: string): string {
  if (!sectionId) {
    return "SNACK";
  }
  return SECTION_TO_SLOT[sectionId] ?? "SNACK";
}

export function scaleNutritionTotals(nutrition: NutritionTotals, factor: number): NutritionTotals {
  return {
    caloriesKcal: Number.parseFloat((nutrition.caloriesKcal * factor).toFixed(2)),
    proteinG: Number.parseFloat((nutrition.proteinG * factor).toFixed(2)),
    fatG: Number.parseFloat((nutrition.fatG * factor).toFixed(2)),
    carbsG: Number.parseFloat((nutrition.carbsG * factor).toFixed(2)),
    sugarG: Number.parseFloat(((nutrition.sugarG ?? 0) * factor).toFixed(2)),
    fiberG: Number.parseFloat(((nutrition.fiberG ?? 0) * factor).toFixed(2))
  };
}

export async function loadMealPlanDay(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string
): Promise<MealPlanDay> {
  const isoDate = ensureIsoDate(date);
  try {
    const day = await apiRequest<BackendDay>(`/v1/meal-plans/day?date=${encodeURIComponent(isoDate)}`);
    return mapDay(day);
  } catch {
    return buildEmptyDay(isoDate);
  }
}

export async function updateMealPlanDayMeta(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string,
  updates: { weightKg?: number | null }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const day = await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate);
  const weights = loadWeights();

  if (Object.prototype.hasOwnProperty.call(updates, "weightKg")) {
    if (updates.weightKg === null || updates.weightKg === undefined) {
      delete weights[isoDate];
    } else {
      weights[isoDate] = Number.parseFloat(Number(updates.weightKg).toFixed(1));
    }
  }

  saveWeights(weights);
  day.meta = { ...(day.meta ?? {}), weightKg: weights[isoDate] ?? null };

  return { day };
}

export async function loadMealPlanHistory(
  _vaultHandle: FileSystemDirectoryHandle,
  options?: { limit?: number }
): Promise<MealPlanDay[]> {
  const limit = options?.limit ?? 1;
  if (limit <= 0) {
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const day = await loadMealPlanDay({} as FileSystemDirectoryHandle, today);
  return [day];
}

export async function addProductToMealPlan(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string,
  product: ProductSummary,
  options?: { sectionId?: string; sectionName?: string; quantity?: number; unit?: string }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const normalized = normalizeProductAmountAndUnit(options?.quantity, options?.unit, product);
  await apiRequest("/v1/meal-plans/day/entries", {
    method: "POST",
    body: JSON.stringify({
      date: isoDate,
      slot: sectionToSlot(options?.sectionId ?? product.mealTime),
      productId: product.fileName,
      amount: normalized.amount,
      unit: normalized.unit
    })
  });

  return { day: await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate) };
}

export async function addRecipeToMealPlan(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string,
  recipe: RecipeSummary,
  options?: { sectionId?: string; sectionName?: string; servings?: number }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  await apiRequest("/v1/meal-plans/day/entries", {
    method: "POST",
    body: JSON.stringify({
      date: isoDate,
      slot: sectionToSlot(options?.sectionId),
      recipeId: recipe.fileName,
      servings: options?.servings ?? 1
    })
  });

  return { day: await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate) };
}

export async function removeMealPlanItem(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string,
  sectionId: string,
  itemIndex: number
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const day = await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate);
  const section = day.sections.find((entry) => entry.id === sectionId);
  const item = section?.items[itemIndex];
  const entryId = item?.source?.entryId;

  if (entryId) {
    await apiRequest(`/v1/meal-plans/day/entries/${entryId}`, { method: "DELETE" });
  }

  return { day: await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate) };
}

export async function updateMealPlanItem(
  _vaultHandle: FileSystemDirectoryHandle,
  date: string,
  sectionId: string,
  itemIndex: number,
  updates: { servings?: number; quantity?: number; unit?: string }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const day = await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate);
  const section = day.sections.find((entry) => entry.id === sectionId);
  const item = section?.items[itemIndex];

  if (!item) {
    return { day };
  }

  if (item.source?.entryId) {
    await apiRequest(`/v1/meal-plans/day/entries/${item.source.entryId}`, { method: "DELETE" });
  }

  if (item.type === "product") {
    const productStub: ProductSummary = {
      fileName: item.source?.fileName ?? "",
      slug: item.source?.slug ?? "",
      title: item.title,
      portionGrams: item.portionGrams ?? 100
    };
    const normalized = normalizeProductAmountAndUnit(
      updates.quantity ?? item.quantity ?? item.portionGrams ?? 100,
      updates.unit ?? item.quantityUnit ?? "g",
      productStub
    );
    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date: isoDate,
        slot: sectionToSlot(sectionId),
        productId: item.source?.fileName,
        amount: normalized.amount,
        unit: normalized.unit
      })
    });
  } else {
    await apiRequest("/v1/meal-plans/day/entries", {
      method: "POST",
      body: JSON.stringify({
        date: isoDate,
        slot: sectionToSlot(sectionId),
        recipeId: item.source?.fileName,
        servings: updates.servings ?? item.servings ?? 1
      })
    });
  }

  return { day: await loadMealPlanDay({} as FileSystemDirectoryHandle, isoDate) };
}
