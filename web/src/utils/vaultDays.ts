import type { ProductSummary } from "@/utils/vaultProducts";
import type { RecipeSummary } from "@/utils/vaultRecipes";

export type NutritionTotals = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
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
  };
};

export type MealPlanSection = {
  id: string;
  name?: string;
  items: MealPlanItem[];
  totals: NutritionTotals;
};

export type MealPlanDay = {
  date: string;
  sections: MealPlanSection[];
  totals: NutritionTotals;
  meta?: Record<string, unknown>;
};

export type MealPlanUpdateResult = {
  day: MealPlanDay;
};

const DAYS_DIRECTORY_NAME = "days";

const DEFAULT_SECTION_IDS = ["breakfast", "lunch", "snack", "dinner"] as const;

const ZERO_TOTALS: NutritionTotals = {
  caloriesKcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0
};

function cloneTotals(totals?: NutritionTotals): NutritionTotals {
  return {
    caloriesKcal: totals?.caloriesKcal ?? 0,
    proteinG: totals?.proteinG ?? 0,
    fatG: totals?.fatG ?? 0,
    carbsG: totals?.carbsG ?? 0
  };
}

function normalizeNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateToFileName(date: string): string {
  return `${date}.md`;
}

function ensureIsoDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

async function ensureDaysDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(DAYS_DIRECTORY_NAME, { create: true });
}

type FrontMatterParseResult = {
  meta: Record<string, string>;
  body: string;
};

function parseFrontMatter(source: string): FrontMatterParseResult {
  const lines = source.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return { meta: {}, body: source.trim() };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { meta: {}, body: source.trim() };
  }

  const metaLines = lines.slice(1, endIndex);
  const meta: Record<string, string> = {};
  for (const line of metaLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const [key, ...rest] = trimmed.split(":");
    if (!key) {
      continue;
    }
    meta[key.trim()] = rest.join(":").trim().replace(/^"|"$/g, "");
  }

  const body = lines.slice(endIndex + 1).join("\n").trim();
  return { meta, body };
}

function buildFrontMatter(date: string): string {
  return `---\ndate: "${date}"\n---`;
}

function createEmptyDay(date: string): MealPlanDay {
  return {
    date,
    sections: DEFAULT_SECTION_IDS.map((id) => ({
      id,
      name: undefined,
      items: [],
      totals: cloneTotals()
    })),
    totals: cloneTotals(),
    meta: {}
  };
}

function recalculateSectionTotals(section: MealPlanSection): void {
  section.totals = section.items.reduce(
    (acc, item) => ({
      caloriesKcal: acc.caloriesKcal + normalizeNumber(item.nutrition.caloriesKcal),
      proteinG: acc.proteinG + normalizeNumber(item.nutrition.proteinG),
      fatG: acc.fatG + normalizeNumber(item.nutrition.fatG),
      carbsG: acc.carbsG + normalizeNumber(item.nutrition.carbsG)
    }),
    { ...ZERO_TOTALS }
  );
}

function recalculateDayTotals(day: MealPlanDay): void {
  day.sections.forEach(recalculateSectionTotals);
  day.totals = day.sections.reduce(
    (acc, section) => ({
      caloriesKcal: acc.caloriesKcal + section.totals.caloriesKcal,
      proteinG: acc.proteinG + section.totals.proteinG,
      fatG: acc.fatG + section.totals.fatG,
      carbsG: acc.carbsG + section.totals.carbsG
    }),
    { ...ZERO_TOTALS }
  );
}

async function writeDayFile(
  fileHandle: FileSystemFileHandle,
  day: MealPlanDay
): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  const frontMatter = buildFrontMatter(day.date);
  const bodyObject = {
    sections: day.sections,
    totals: day.totals,
    meta: day.meta ?? {}
  };
  const body = `${JSON.stringify(bodyObject, null, 2)}\n`;
  const content = `${frontMatter}\n${body}`;
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function readDayFile(fileHandle: FileSystemFileHandle, date: string): Promise<MealPlanDay> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  const { meta, body } = parseFrontMatter(text);
  const parsedDate = ensureIsoDate(meta.date ?? date);

  let json: Partial<MealPlanDay> & { sections?: MealPlanSection[] } = {};
  if (body) {
    try {
      json = JSON.parse(body) as Partial<MealPlanDay>;
    } catch (error) {
      console.warn("Failed to parse meal plan JSON body", error);
      json = {};
    }
  }

  const day: MealPlanDay = {
    date: parsedDate,
    sections: (json.sections ?? []).map((section) => ({
      id: section.id ?? "custom",
      name: section.name,
      items: (section.items ?? []).map((item) => ({
        type: item.type ?? "product",
        ref: item.ref ?? "",
        title: item.title ?? "",
        portionGrams: item.portionGrams ?? null,
        quantity: item.quantity ?? null,
        quantityUnit: item.quantityUnit ?? null,
        servings: item.servings ?? null,
        nutrition: cloneTotals(item.nutrition as NutritionTotals | undefined),
        source: item.source
      })),
      totals: cloneTotals(section.totals)
    })),
    totals: cloneTotals(json.totals),
    meta: json.meta ?? {}
  };

  if (day.sections.length === 0) {
    day.sections = createEmptyDay(parsedDate).sections;
  } else {
    day.sections = day.sections.map((section) => ({
      ...section,
      totals: cloneTotals(section.totals)
    }));
  }

  recalculateDayTotals(day);
  return day;
}

function findOrCreateSection(day: MealPlanDay, sectionId: string, sectionName?: string): MealPlanSection {
  const existing = day.sections.find((section) => section.id === sectionId);
  if (existing) {
    if (sectionName && !existing.name) {
      existing.name = sectionName;
    }
    return existing;
  }

  const section: MealPlanSection = {
    id: sectionId,
    name: sectionName,
    items: [],
    totals: { ...ZERO_TOTALS }
  };
  day.sections.push(section);
  return section;
}

function productSummaryToItem(product: ProductSummary): MealPlanItem {
  const nutrition = product.nutritionPerPortion ?? {};
  return {
    type: "product",
    ref: `product:${product.slug}`,
    title: product.title,
    portionGrams: product.portionGrams ?? null,
    nutrition: {
      caloriesKcal: normalizeNumber(nutrition.caloriesKcal),
      proteinG: normalizeNumber(nutrition.proteinG),
      fatG: normalizeNumber(nutrition.fatG),
      carbsG: normalizeNumber(nutrition.carbsG)
    },
    quantity: product.portionGrams ?? null,
    quantityUnit: product.portionGrams ? "g" : null,
    source: { kind: "product", slug: product.slug, fileName: product.fileName }
  };
}

export function scaleNutritionTotals(nutrition: NutritionTotals, factor: number): NutritionTotals {
  return {
    caloriesKcal: Number.parseFloat((nutrition.caloriesKcal * factor).toFixed(2)),
    proteinG: Number.parseFloat((nutrition.proteinG * factor).toFixed(2)),
    fatG: Number.parseFloat((nutrition.fatG * factor).toFixed(2)),
    carbsG: Number.parseFloat((nutrition.carbsG * factor).toFixed(2))
  };
}

function withScaledProductItem(
  product: ProductSummary,
  quantity?: number,
  unit?: string
): MealPlanItem {
  const base = productSummaryToItem(product);
  if (!quantity || quantity <= 0) {
    return base;
  }

  const portion = product.portionGrams ?? null;
  const factor = portion && portion > 0 ? quantity / portion : quantity;
  return {
    ...base,
    quantity,
    quantityUnit: unit ?? (portion ? "g" : "portion"),
    nutrition: scaleNutritionTotals(base.nutrition, factor)
  };
}

function recipeSummaryToItem(recipe: RecipeSummary, servingsCount?: number): MealPlanItem {
  const servings = servingsCount && servingsCount > 0 ? servingsCount : 1;
  const totals = scaleNutritionTotals(recipe.nutritionPerServing, servings);

  return {
    type: "recipe",
    ref: `recipe:${recipe.slug}`,
    title: recipe.title,
    portionGrams: null,
    servings,
    nutrition: totals,
    source: { kind: "recipe", slug: recipe.slug, fileName: recipe.fileName }
  };
}

export async function loadMealPlanDay(
  vaultHandle: FileSystemDirectoryHandle,
  date: string
): Promise<MealPlanDay> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);

  let fileHandle: FileSystemFileHandle;
  try {
    fileHandle = await daysDir.getFileHandle(fileName, { create: false });
  } catch (error) {
    if ((error as DOMException)?.name !== "NotFoundError") {
      throw error;
    }
    fileHandle = await daysDir.getFileHandle(fileName, { create: true });
    const emptyDay = createEmptyDay(isoDate);
    await writeDayFile(fileHandle, emptyDay);
    return emptyDay;
  }

  return readDayFile(fileHandle, isoDate);
}

export async function addProductToMealPlan(
  vaultHandle: FileSystemDirectoryHandle,
  date: string,
  product: ProductSummary,
  options?: { sectionId?: string; sectionName?: string; quantity?: number; unit?: string }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);
  const fileHandle = await daysDir.getFileHandle(fileName, { create: true });

  let day: MealPlanDay;
  try {
    day = await readDayFile(fileHandle, isoDate);
  } catch (error) {
    console.error("Failed to read meal plan day, recreating", error);
    day = createEmptyDay(isoDate);
  }

  const sectionId = options?.sectionId ?? product.mealTime ?? "flex";
  const sectionName = options?.sectionName ?? product.mealTimeLabel ?? undefined;

  const section = findOrCreateSection(day, sectionId, sectionName);
  section.items.push(withScaledProductItem(product, options?.quantity, options?.unit));

  recalculateDayTotals(day);
  await writeDayFile(fileHandle, day);
  return { day };
}

export async function addRecipeToMealPlan(
  vaultHandle: FileSystemDirectoryHandle,
  date: string,
  recipe: RecipeSummary,
  options?: { sectionId?: string; sectionName?: string; servings?: number }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);
  const fileHandle = await daysDir.getFileHandle(fileName, { create: true });

  let day: MealPlanDay;
  try {
    day = await readDayFile(fileHandle, isoDate);
  } catch (error) {
    console.error("Failed to read meal plan day, recreating", error);
    day = createEmptyDay(isoDate);
  }

  const sectionId = options?.sectionId ?? "flex";
  const sectionName = options?.sectionName;
  const section = findOrCreateSection(day, sectionId, sectionName);
  section.items.push(recipeSummaryToItem(recipe, options?.servings));

  recalculateDayTotals(day);
  await writeDayFile(fileHandle, day);
  return { day };
}
