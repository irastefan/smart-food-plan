import {
  buildMarkdownDocument,
  parseMarkdownDocument,
  upsertAutoBlock,
  type JsonValue
} from "@/utils/markdown";
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

const DAYS_DIRECTORY_NAME = "days";

const DEFAULT_SECTION_IDS = ["breakfast", "lunch", "snack", "dinner"] as const;

const EMPTY_TOTALS: NutritionTotals = {
  caloriesKcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
  sugarG: 0,
  fiberG: 0
};

const DEFAULT_QUANTITY_UNIT = "g";

function ensureDaysDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(DAYS_DIRECTORY_NAME, { create: true });
}

function countDecimals(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return value % 1 === 0 ? 0 : 1;
}

function normalizeNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptionalNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  if (Number.isFinite(parsed)) {
    return Number.parseFloat(parsed.toFixed(2));
  }
  return null;
}

function readNumeric(
  record: Record<string, unknown>,
  ...keys: string[]
): number | string | null | undefined {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const value = record[key];
      if (
        typeof value === "number" ||
        typeof value === "string" ||
        value === null ||
        value === undefined
      ) {
        return value as number | string | null | undefined;
      }
    }
  }
  return undefined;
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

function formatDateHeading(date: string): string {
  try {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.valueOf())) {
      return date;
    }
    return parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return date;
  }
}

function cloneTotals(source?: NutritionTotals): NutritionTotals {
  return {
    caloriesKcal: source?.caloriesKcal ?? 0,
    proteinG: source?.proteinG ?? 0,
    fatG: source?.fatG ?? 0,
    carbsG: source?.carbsG ?? 0,
    sugarG: source?.sugarG ?? 0,
    fiberG: source?.fiberG ?? 0
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

function recalculateSectionTotals(section: MealPlanSection): void {
  section.totals = section.items.reduce(
    (acc, item) => addTotals(acc, item.nutrition),
    cloneTotals()
  );
}

function recalculateDayTotals(day: MealPlanDay): void {
  day.sections.forEach(recalculateSectionTotals);
  day.totals = day.sections.reduce((acc, section) => addTotals(acc, section.totals), cloneTotals());
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
    targetsSnapshot: null,
    wellness: null,
    updatedAt: new Date().toISOString(),
    meta: {}
  };
}

function buildNutritionObject(totals: NutritionTotals): Record<string, JsonValue> {
  return {
    kcal: Number.parseFloat(totals.caloriesKcal.toFixed(2)),
    protein_g: Number.parseFloat(totals.proteinG.toFixed(2)),
    fat_g: Number.parseFloat(totals.fatG.toFixed(2)),
    carbs_g: Number.parseFloat(totals.carbsG.toFixed(2)),
    sugar_g: Number.parseFloat((totals.sugarG ?? 0).toFixed(2)),
    fiber_g: Number.parseFloat((totals.fiberG ?? 0).toFixed(2))
  };
}

function buildTargetsObject(targets?: NutritionTargetsSnapshot | null): Record<string, JsonValue> | null {
  if (!targets) {
    return null;
  }
  const entries: Record<string, JsonValue> = {};
  if (targets.caloriesKcal !== undefined && targets.caloriesKcal !== null) {
    entries.kcal = Number.parseFloat(Number(targets.caloriesKcal).toFixed(0));
  }
  if (targets.proteinG !== undefined && targets.proteinG !== null) {
    entries.protein_g = Number.parseFloat(Number(targets.proteinG).toFixed(1));
  }
  if (targets.fatG !== undefined && targets.fatG !== null) {
    entries.fat_g = Number.parseFloat(Number(targets.fatG).toFixed(1));
  }
  if (targets.carbsG !== undefined && targets.carbsG !== null) {
    entries.carbs_g = Number.parseFloat(Number(targets.carbsG).toFixed(1));
  }
  if (targets.sugarG !== undefined && targets.sugarG !== null) {
    entries.sugar_g = Number.parseFloat(Number(targets.sugarG).toFixed(1));
  }
  if (targets.fiberG !== undefined && targets.fiberG !== null) {
    entries.fiber_g = Number.parseFloat(Number(targets.fiberG).toFixed(1));
  }
  return Object.keys(entries).length > 0 ? entries : null;
}

function serializeDayMeta(meta?: MealPlanDayMeta | null): Record<string, JsonValue> | null {
  if (!meta) {
    return null;
  }

  const entries: Record<string, JsonValue> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (key === "weightKg") {
      continue;
    }
    if (value !== undefined) {
      entries[key] = value as JsonValue;
    }
  }

  if (Object.prototype.hasOwnProperty.call(meta, "weightKg")) {
    const weight = meta.weightKg;
    entries.weight_kg =
      weight === null || weight === undefined
        ? null
        : Number.parseFloat(Number(weight).toFixed(1));
  }

  return Object.keys(entries).length > 0 ? entries : null;
}

function serializeDay(day: MealPlanDay): { frontMatter: Record<string, JsonValue>; body: string } {
  const sections = day.sections.map((section) => ({
    id: section.id,
    title: section.name ?? null,
    totals: buildNutritionObject(section.totals),
    items: section.items.map((item) => ({
      type: item.type,
      ref: item.ref,
      title: item.title,
      portion_grams: item.portionGrams ?? null,
      quantity: item.quantity ?? null,
      unit: item.quantityUnit ?? null,
      servings: item.servings ?? null,
      nutrition: buildNutritionObject(item.nutrition),
      source: item.source
        ? {
            kind: item.source.kind,
            slug: item.source.slug ?? null,
            file_name: item.source.fileName ?? null
          }
        : null
    }))
  }));

  const frontMatter: Record<string, JsonValue> = {
    date: day.date,
    sections,
    totals: buildNutritionObject(day.totals),
    updated_at: day.updatedAt ?? new Date().toISOString()
  };

  const targetsObject = buildTargetsObject(day.targetsSnapshot);
  if (targetsObject) {
    frontMatter.targets_snapshot = targetsObject;
  }

  if (day.wellness) {
    const wellness: Record<string, JsonValue> = {};
    if (day.wellness.mood) {
      wellness.mood = day.wellness.mood;
    }
    if (day.wellness.sleepHours !== undefined && day.wellness.sleepHours !== null) {
      wellness.sleep_hours = Number.parseFloat(day.wellness.sleepHours.toFixed(1));
    }
    if (day.wellness.steps !== undefined && day.wellness.steps !== null) {
      wellness.steps = Math.round(day.wellness.steps);
    }
    if (day.wellness.notes) {
      wellness.notes = day.wellness.notes;
    }
    if (Object.keys(wellness).length > 0) {
      frontMatter.wellness = wellness;
    }
  }

  const serializedMeta = serializeDayMeta(day.meta);
  if (serializedMeta) {
    frontMatter.meta = serializedMeta;
  }

  const body = buildDayBody(day);

  return {
    frontMatter,
    body
  };
}

function buildDayBody(day: MealPlanDay): string {
  const heading = `# План на ${formatDateHeading(day.date)}`;
  const autoSummary = buildDayAutoSummary(day);
  return upsertAutoBlock(`${heading}\n`, "SUMMARY", autoSummary);
}

function buildDayAutoSummary(day: MealPlanDay): string {
  const lines: string[] = [];
  for (const section of day.sections) {
    const hasItems = section.items.length > 0;
    const title = section.name || section.id;
    lines.push(`## ${title}`);
    if (!hasItems) {
      lines.push("_Пока пусто_");
    } else {
      for (const item of section.items) {
        if (item.type === "recipe") {
          const servings = item.servings && item.servings > 0 ? item.servings : 1;
          lines.push(`- 🥗 ${item.title} — ${servings} порция(и)`);
        } else {
          const quantity = item.quantity ?? item.portionGrams ?? null;
          const unit = item.quantityUnit ?? DEFAULT_QUANTITY_UNIT;
          const formattedQuantity =
            quantity !== null ? `${Number.parseFloat(quantity.toFixed(countDecimals(quantity)))} ${unit}` : "";
          lines.push(`- 🥣 ${item.title}${formattedQuantity ? ` — ${formattedQuantity}` : ""}`);
        }
      }
    }
    lines.push("");
  }

  lines.push("## Итог дня");
  const targets = day.targetsSnapshot;
  const kcalLine = targets?.caloriesKcal
    ? `**Ккал:** ${Number.parseFloat(day.totals.caloriesKcal.toFixed(0))} из ${Math.round(targets.caloriesKcal)}`
    : `**Ккал:** ${Number.parseFloat(day.totals.caloriesKcal.toFixed(0))}`;
  const macrosLine = [
    `**Б:** ${Number.parseFloat(day.totals.proteinG.toFixed(1))} г`,
    `**Ж:** ${Number.parseFloat(day.totals.fatG.toFixed(1))} г`,
    `**У:** ${Number.parseFloat(day.totals.carbsG.toFixed(1))} г`
  ].join(" · ");

  lines.push(`${kcalLine} · ${macrosLine}`);

  if (day.wellness) {
    const wellnessPieces: string[] = [];
    if (day.wellness.mood) {
      wellnessPieces.push(`Настроение: ${day.wellness.mood}`);
    }
    if (day.wellness.sleepHours !== undefined && day.wellness.sleepHours !== null) {
      wellnessPieces.push(`Сон: ${Number.parseFloat(day.wellness.sleepHours.toFixed(1))} ч`);
    }
    if (day.wellness.steps !== undefined && day.wellness.steps !== null) {
      wellnessPieces.push(`Шаги: ${Math.round(day.wellness.steps).toLocaleString("ru-RU")}`);
    }
    if (wellnessPieces.length > 0) {
      lines.push(wellnessPieces.join(" · "));
    }
  }

  return lines.join("\n");
}

function parseNutritionTotals(source: unknown): NutritionTotals {
  if (typeof source !== "object" || source === null) {
    return cloneTotals();
  }
  const record = source as Record<string, unknown>;
  return {
    caloriesKcal: normalizeNumber(readNumeric(record, "caloriesKcal", "kcal")),
    proteinG: normalizeNumber(readNumeric(record, "proteinG", "protein_g")),
    fatG: normalizeNumber(readNumeric(record, "fatG", "fat_g")),
    carbsG: normalizeNumber(readNumeric(record, "carbsG", "carbs_g")),
    sugarG: normalizeNumber(readNumeric(record, "sugarG", "sugar_g") ?? 0),
    fiberG: normalizeNumber(readNumeric(record, "fiberG", "fiber_g") ?? 0)
  };
}

function parseTargetsSnapshot(source: unknown): NutritionTargetsSnapshot | null {
  if (typeof source !== "object" || source === null) {
    return null;
  }
  const record = source as Record<string, unknown>;
  return {
    caloriesKcal: normalizeOptionalNumber(readNumeric(record, "kcal", "caloriesKcal")),
    proteinG: normalizeOptionalNumber(readNumeric(record, "protein_g", "proteinG")),
    fatG: normalizeOptionalNumber(readNumeric(record, "fat_g", "fatG")),
    carbsG: normalizeOptionalNumber(readNumeric(record, "carbs_g", "carbsG")),
    sugarG: normalizeOptionalNumber(readNumeric(record, "sugar_g", "sugarG")),
    fiberG: normalizeOptionalNumber(readNumeric(record, "fiber_g", "fiberG"))
  };
}

function parseDayMeta(source: unknown): MealPlanDayMeta {
  const meta: MealPlanDayMeta = {};
  if (typeof source !== "object" || source === null) {
    return meta;
  }

  const record = source as Record<string, unknown>;
  const weightValue = readNumeric(record, "weight_kg", "weightKg");
  if (weightValue !== undefined) {
    meta.weightKg = normalizeOptionalNumber(weightValue);
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "weight_kg" || key === "weightKg") {
      continue;
    }
    meta[key] = value;
  }

  return meta;
}

function parseDay(data: Record<string, JsonValue>, body: string, fallbackDate: string): MealPlanDay {
  const date = typeof data.date === "string" ? ensureIsoDate(data.date) : ensureIsoDate(fallbackDate);
  const sectionsRaw = Array.isArray(data.sections) ? data.sections : [];
  const sections: MealPlanSection[] = [];
  for (const entry of sectionsRaw) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const itemsRaw = Array.isArray(record.items) ? record.items : [];
    const items: MealPlanItem[] = [];

    for (const itemEntry of itemsRaw) {
      if (typeof itemEntry !== "object" || itemEntry === null) {
        continue;
      }
      const itemRecord = itemEntry as Record<string, unknown>;
      const type: MealPlanItem["type"] = (itemRecord.type as string) === "recipe" ? "recipe" : "product";
      const sourceRaw = itemRecord.source;
      const source =
        typeof sourceRaw === "object" && sourceRaw !== null
          ? (() => {
              const sourceRecord = sourceRaw as Record<string, unknown>;
              const kind: "recipe" | "product" =
                sourceRecord.kind === "recipe" ? "recipe" : "product";
              return {
                kind,
                slug:
                  typeof sourceRecord.slug === "string"
                    ? (sourceRecord.slug as string)
                    : undefined,
                fileName:
                  typeof sourceRecord.file_name === "string"
                    ? (sourceRecord.file_name as string)
                    : typeof sourceRecord.fileName === "string"
                    ? (sourceRecord.fileName as string)
                    : undefined
              };
            })()
          : undefined;

      const portionGrams = normalizeOptionalNumber(
        readNumeric(itemRecord, "portion_grams", "portionGrams")
      );
      const quantityValue = normalizeOptionalNumber(readNumeric(itemRecord, "quantity"));
      const servingsValue = normalizeOptionalNumber(readNumeric(itemRecord, "servings"));
      const quantityUnitValue =
        typeof itemRecord.unit === "string"
          ? itemRecord.unit
          : typeof itemRecord.quantityUnit === "string"
          ? itemRecord.quantityUnit
          : null;

      items.push({
        type,
        ref: typeof itemRecord.ref === "string" ? itemRecord.ref : "",
        title: typeof itemRecord.title === "string" ? itemRecord.title : "",
        portionGrams,
        quantity: quantityValue,
        quantityUnit: quantityUnitValue,
        servings: servingsValue,
        nutrition: parseNutritionTotals(itemRecord.nutrition),
        source
      });
    }

    sections.push({
      id: typeof record.id === "string" ? record.id : "custom",
      name: typeof record.title === "string" ? record.title : undefined,
      items,
      totals: parseNutritionTotals(record.totals)
    });
  }

  const totals = parseNutritionTotals(data.totals);
  const targetsSnapshot = parseTargetsSnapshot(data.targets_snapshot);
  const wellness =
    typeof data.wellness === "object" && data.wellness !== null
      ? {
          mood: typeof (data.wellness as Record<string, unknown>).mood === "string"
            ? ((data.wellness as Record<string, unknown>).mood as string)
            : undefined,
          sleepHours: normalizeOptionalNumber(
            readNumeric(data.wellness as Record<string, unknown>, "sleep_hours", "sleepHours")
          ),
          steps: normalizeOptionalNumber(readNumeric(data.wellness as Record<string, unknown>, "steps")),
          notes: typeof (data.wellness as Record<string, unknown>).notes === "string"
            ? ((data.wellness as Record<string, unknown>).notes as string)
            : null
        }
      : null;

  const updatedAt = typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString();
  const meta = parseDayMeta(data.meta);

  const day: MealPlanDay = {
    date,
    sections,
    totals,
    targetsSnapshot,
    wellness,
    updatedAt,
    meta
  };

  if (day.sections.length === 0) {
    day.sections = createEmptyDay(date).sections;
  }

  recalculateDayTotals(day);
  day.updatedAt = updatedAt;

  return day;
}

async function writeDayFile(
  fileHandle: FileSystemFileHandle,
  day: MealPlanDay
): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  const { frontMatter, body } = serializeDay(day);
  const content = buildMarkdownDocument(frontMatter, body);
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function readDayFile(fileHandle: FileSystemFileHandle, date: string): Promise<MealPlanDay> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  const { data, body } = parseMarkdownDocument(text);
  return parseDay(data, body, date);
}

function formatDateToFileName(date: string): string {
  return `${date}.md`;
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
    totals: cloneTotals()
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
      carbsG: normalizeNumber(nutrition.carbsG),
      sugarG: normalizeNumber((product.nutritionPerPortion?.sugarG ?? 0) || 0),
      fiberG: normalizeNumber((product.nutritionPerPortion?.fiberG ?? 0) || 0)
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
    carbsG: Number.parseFloat((nutrition.carbsG * factor).toFixed(2)),
    sugarG: Number.parseFloat(((nutrition.sugarG ?? 0) * factor).toFixed(2)),
    fiberG: Number.parseFloat(((nutrition.fiberG ?? 0) * factor).toFixed(2))
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
    quantityUnit: unit ?? (portion ? "g" : null),
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

export async function updateMealPlanDayMeta(
  vaultHandle: FileSystemDirectoryHandle,
  date: string,
  updates: { weightKg?: number | null }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);
  const fileHandle = await daysDir.getFileHandle(fileName, { create: true });

  let day: MealPlanDay;
  try {
    day = await readDayFile(fileHandle, isoDate);
  } catch (error) {
    console.error("Failed to read meal plan day for meta update, recreating", error);
    day = createEmptyDay(isoDate);
  }

  const nextMeta: MealPlanDayMeta = { ...(day.meta ?? {}) };

  if (Object.prototype.hasOwnProperty.call(updates, "weightKg")) {
    const value = updates.weightKg;
    if (value === null || value === undefined) {
      delete nextMeta.weightKg;
    } else if (Number.isFinite(value)) {
      nextMeta.weightKg = Number.parseFloat(Number(value).toFixed(1));
    }
  }

  day.meta = nextMeta;
  day.updatedAt = new Date().toISOString();

  await writeDayFile(fileHandle, day);
  return { day };
}

export async function loadMealPlanHistory(
  vaultHandle: FileSystemDirectoryHandle,
  options?: { limit?: number }
): Promise<MealPlanDay[]> {
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const entries: { name: string; handle: FileSystemFileHandle }[] = [];

  for await (const entry of daysDir.values()) {
    if (entry.kind === "file") {
      entries.push({ name: entry.name, handle: entry });
    }
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  const limit = options?.limit ?? entries.length;
  const startIndex = Math.max(0, entries.length - limit);
  const selected = entries.slice(startIndex);

  const days: MealPlanDay[] = [];
  for (const entry of selected) {
    const baseName = entry.name.replace(/\.md$/i, "");
    const iso = ensureIsoDate(baseName);
    try {
      const day = await readDayFile(entry.handle, iso);
      days.push(day);
    } catch (error) {
      console.error("Failed to read meal plan day while loading history", error);
    }
  }

  return days;
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
  day.updatedAt = new Date().toISOString();
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
  day.updatedAt = new Date().toISOString();
  await writeDayFile(fileHandle, day);
  return { day };
}

export async function removeMealPlanItem(
  vaultHandle: FileSystemDirectoryHandle,
  date: string,
  sectionId: string,
  itemIndex: number
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);
  const fileHandle = await daysDir.getFileHandle(fileName, { create: true });

  let day: MealPlanDay;
  try {
    day = await readDayFile(fileHandle, isoDate);
  } catch (error) {
    console.error("Failed to read meal plan day for removal, recreating", error);
    day = createEmptyDay(isoDate);
  }

  const section = day.sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return { day };
  }

  if (itemIndex < 0 || itemIndex >= section.items.length) {
    return { day };
  }

  section.items.splice(itemIndex, 1);

  recalculateDayTotals(day);
  day.updatedAt = new Date().toISOString();
  await writeDayFile(fileHandle, day);
  return { day };
}

export async function updateMealPlanItem(
  vaultHandle: FileSystemDirectoryHandle,
  date: string,
  sectionId: string,
  itemIndex: number,
  updates: { servings?: number; quantity?: number; unit?: string }
): Promise<MealPlanUpdateResult> {
  const isoDate = ensureIsoDate(date);
  const daysDir = await ensureDaysDirectory(vaultHandle);
  const fileName = formatDateToFileName(isoDate);
  const fileHandle = await daysDir.getFileHandle(fileName, { create: true });

  let day: MealPlanDay;
  try {
    day = await readDayFile(fileHandle, isoDate);
  } catch (error) {
    console.error("Failed to read meal plan day for update, recreating", error);
    day = createEmptyDay(isoDate);
  }

  const section = day.sections.find((entry) => entry.id === sectionId);
  if (!section) {
    return { day };
  }

  const item = section.items[itemIndex];
  if (!item) {
    return { day };
  }

  if (item.type === "recipe" && typeof updates.servings === "number" && Number.isFinite(updates.servings)) {
    const nextServings = Math.max(1, Math.round(updates.servings));
    const currentServings = item.servings && item.servings > 0 ? item.servings : 1;
    const factor = nextServings / currentServings;
    const totals = scaleNutritionTotals(item.nutrition, factor);

    item.servings = nextServings;
    item.nutrition = totals;
  } else if (item.type === "product" && typeof updates.quantity === "number" && Number.isFinite(updates.quantity)) {
    const nextQuantity = Math.max(0, updates.quantity);
    const currentQuantity =
      item.quantity && item.quantity > 0
        ? item.quantity
        : item.portionGrams && item.portionGrams > 0
        ? item.portionGrams
        : 1;

    const safeCurrentQuantity = currentQuantity > 0 ? currentQuantity : 1;
    const factor = nextQuantity / safeCurrentQuantity;
    const totals = scaleNutritionTotals(item.nutrition, factor);

    item.quantity = nextQuantity;
    item.quantityUnit = updates.unit ?? item.quantityUnit ?? null;
    item.nutrition = totals;
  } else {
    return { day };
  }

  recalculateDayTotals(day);
  day.updatedAt = new Date().toISOString();
  await writeDayFile(fileHandle, day);
  return { day };
}
