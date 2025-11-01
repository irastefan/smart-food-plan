import {
  buildMarkdownDocument,
  parseMarkdownDocument,
  upsertAutoBlock,
  type JsonValue
} from "@/utils/markdown";

const PRODUCTS_DIRECTORY_NAME = "products";
const DEFAULT_SERVING_UNIT = "g";

export const productDirectoryName = PRODUCTS_DIRECTORY_NAME;

export type ProductFormData = {
  productName?: string;
  brand?: string;
  barcode?: string;
  model?: string;
  modelLabel?: string;
  portion?: string;
  portionUnit?: string;
  mealTime?: string;
  mealTimeLabel?: string;
  calories?: string;
  protein?: string;
  fat?: string;
  carbs?: string;
  sugar?: string;
  fiber?: string;
  tags?: string;
  notes?: string;
  createdAt?: string;
  [key: string]: string | undefined;
};

export type ProductSummary = {
  fileName: string;
  slug: string;
  title: string;
  brand?: string;
  model?: string;
  modelLabel?: string;
  portionGrams?: number | null;
  portionUnit?: string | null;
  mealTime?: string;
  mealTimeLabel?: string;
  nutritionPerPortion?: {
    caloriesKcal?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    carbsG?: number | null;
    sugarG?: number | null;
    fiberG?: number | null;
  };
  nutritionPer100g?: {
    caloriesKcal?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    carbsG?: number | null;
    sugarG?: number | null;
    fiberG?: number | null;
  };
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  notes?: string;
};

export type ProductDetail = ProductSummary & {
  formData: ProductFormData;
};

type ProductFrontMatter = {
  id: string;
  title: string;
  brand?: string;
  barcode?: string;
  model?: string;
  model_label?: string;
  meal_time?: string;
  meal_time_label?: string;
  serving?: {
    default_qty?: number | null;
    default_unit?: string | null;
  };
  nutrition_per_portion?: {
    kcal?: number | null;
    protein_g?: number | null;
    fat_g?: number | null;
    carbs_g?: number | null;
    sugar_g?: number | null;
    fiber_g?: number | null;
  };
  nutrition_per_100g?: {
    kcal?: number | null;
    protein_g?: number | null;
    fat_g?: number | null;
    carbs_g?: number | null;
    sugar_g?: number | null;
    fiber_g?: number | null;
  };
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

export async function ensureDirectoryAccess(handle: FileSystemDirectoryHandle): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) {
    return true;
  }

  const descriptor: FileSystemPermissionDescriptor = { mode: "readwrite" };
  const permission = await handle.queryPermission(descriptor);

  if (permission === "granted") {
    return true;
  }

  if (permission === "denied") {
    return false;
  }

  const requestResult = await handle.requestPermission(descriptor);
  return requestResult === "granted";
}

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined) {
    return null;
  }
  return parsed;
}

function toNumberZeroIfAbsent(value: unknown): number {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined || parsed === null) {
    return 0;
  }
  return parsed;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value
    .map((entry) => toStringValue(entry).trim())
    .filter((entry) => entry.length > 0);
}

function normalizeNumberLiteral(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Number.isInteger(parsed) ? parsed : Number.parseFloat(parsed.toFixed(2));
}

function normalizeMacroLiteral(value: string | undefined): number | null {
  const parsed = normalizeNumberLiteral(value);
  if (parsed === null) {
    return null;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function ensureProductsDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(PRODUCTS_DIRECTORY_NAME, {
    create: true
  });
}

function computeNutritionPer100g(
  nutritionPerPortion: ProductFrontMatter["nutrition_per_portion"],
  portionGrams: number | null | undefined
): ProductFrontMatter["nutrition_per_100g"] {
  if (!portionGrams || portionGrams <= 0) {
    return {
      kcal: toOptionalNumber(nutritionPerPortion?.kcal) ?? null,
      protein_g: toOptionalNumber(nutritionPerPortion?.protein_g) ?? null,
      fat_g: toOptionalNumber(nutritionPerPortion?.fat_g) ?? null,
      carbs_g: toOptionalNumber(nutritionPerPortion?.carbs_g) ?? null,
      sugar_g: toOptionalNumber(nutritionPerPortion?.sugar_g) ?? null,
      fiber_g: toOptionalNumber(nutritionPerPortion?.fiber_g) ?? null
    };
  }

  const scale = 100 / portionGrams;
  const scaleValue = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return Number.parseFloat((value * scale).toFixed(2));
  };

  return {
    kcal: scaleValue(nutritionPerPortion?.kcal ?? null),
    protein_g: scaleValue(nutritionPerPortion?.protein_g ?? null),
    fat_g: scaleValue(nutritionPerPortion?.fat_g ?? null),
    carbs_g: scaleValue(nutritionPerPortion?.carbs_g ?? null),
    sugar_g: scaleValue(nutritionPerPortion?.sugar_g ?? null),
    fiber_g: scaleValue(nutritionPerPortion?.fiber_g ?? null)
  };
}

function buildFrontMatterFromForm(
  data: ProductFormData,
  slug: string,
  timestamps: { createdAt: string; updatedAt: string }
): ProductFrontMatter {
  const productName = data.productName?.trim() || "New product";
  const brand = data.brand?.trim();
  const barcode = data.barcode?.trim();
  const model = data.model?.trim();
  const modelLabel = data.modelLabel?.trim();
  const mealTime = data.mealTime?.trim();
  const mealTimeLabel = data.mealTimeLabel?.trim();
  const tags = data.tags
    ?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const portionQty = normalizeNumberLiteral(data.portion) ?? null;
  const portionUnit = data.portionUnit?.trim() || DEFAULT_SERVING_UNIT;

  const nutritionPerPortion: ProductFrontMatter["nutrition_per_portion"] = {
    kcal: normalizeMacroLiteral(data.calories),
    protein_g: normalizeMacroLiteral(data.protein),
    fat_g: normalizeMacroLiteral(data.fat),
    carbs_g: normalizeMacroLiteral(data.carbs),
    sugar_g: normalizeMacroLiteral(data.sugar),
    fiber_g: normalizeMacroLiteral(data.fiber)
  };

  const nutritionPer100g = computeNutritionPer100g(nutritionPerPortion, portionQty);

  const frontMatter: ProductFrontMatter = {
    id: `product:${slug}`,
    title: productName,
    created_at: timestamps.createdAt,
    updated_at: timestamps.updatedAt
  };

  if (brand) {
    frontMatter.brand = brand;
  }
  if (barcode) {
    frontMatter.barcode = barcode;
  }
  if (model) {
    frontMatter.model = model;
  }
  if (modelLabel) {
    frontMatter.model_label = modelLabel;
  }
  if (mealTime) {
    frontMatter.meal_time = mealTime;
  }
  if (mealTimeLabel) {
    frontMatter.meal_time_label = mealTimeLabel;
  }
  if (tags && tags.length > 0) {
    frontMatter.tags = tags;
  }

  frontMatter.serving = {
    default_qty: portionQty,
    default_unit: portionUnit
  };

  frontMatter.nutrition_per_portion = nutritionPerPortion;
  frontMatter.nutrition_per_100g = nutritionPer100g;

  return frontMatter;
}

function serializeFrontMatter(frontMatter: ProductFrontMatter): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {};

  for (const [key, value] of Object.entries(frontMatter)) {
    if (value === undefined) {
      continue;
    }

    if (value === null) {
      result[key] = null;
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value as JsonValue;
      continue;
    }

    if (typeof value === "object") {
      const nestedEntries = Object.entries(value).filter(([, nestedValue]) => nestedValue !== undefined);
      const nestedObject: Record<string, JsonValue> = {};
      nestedEntries.forEach(([nestedKey, nestedValue]) => {
        nestedObject[nestedKey] = (nestedValue ?? null) as JsonValue;
      });
      result[key] = nestedObject;
      continue;
    }

    result[key] = value as JsonValue;
  }

  return result;
}

function formatNumber(value: number | null | undefined, options?: { decimals?: number }): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  const decimals = options?.decimals ?? (value % 1 === 0 ? 0 : 1);
  return Number.parseFloat(value.toFixed(decimals)).toString();
}

function formatMacro(value: number | null | undefined, unit: string): string {
  const formatted = formatNumber(value, { decimals: 1 });
  if (formatted === "—") {
    return formatted;
  }
  return `${formatted} ${unit}`;
}

function buildProductAutoSummary(frontMatter: ProductFrontMatter): string {
  const per100 = frontMatter.nutrition_per_100g ?? {};
  const perPortion = frontMatter.nutrition_per_portion ?? {};
  const serving = frontMatter.serving ?? {};
  const portionQty = toOptionalNumber(serving.default_qty) ?? null;
  const portionUnit = serving.default_unit ?? DEFAULT_SERVING_UNIT;

  const lines: string[] = [
    "## Пищевая ценность (на 100 г)",
    "| Ккал | Белки | Жиры | Углеводы | Сахара | Клетчатка |",
    "|---:|---:|---:|---:|---:|---:|",
    `| ${formatNumber(per100.kcal)} | ${formatMacro(per100.protein_g, "г")} | ${formatMacro(
      per100.fat_g,
      "г"
    )} | ${formatMacro(per100.carbs_g, "г")} | ${formatMacro(per100.sugar_g, "г")} | ${formatMacro(
      per100.fiber_g,
      "г"
    )} |`
  ];

  const portionSummary: string[] = [];
  portionSummary.push("**Стандартная порция:**");
  if (portionQty !== null) {
    portionSummary.push(`${formatNumber(portionQty, { decimals: 0 })} ${portionUnit}`);
  } else {
    portionSummary.push("—");
  }

  const details: string[] = [];
  if (perPortion.kcal !== null && perPortion.kcal !== undefined) {
    details.push(`${formatNumber(perPortion.kcal, { decimals: 0 })} ккал`);
  }
  if (perPortion.protein_g !== null && perPortion.protein_g !== undefined) {
    details.push(`Б ${formatMacro(perPortion.protein_g, "г")}`);
  }
  if (perPortion.fat_g !== null && perPortion.fat_g !== undefined) {
    details.push(`Ж ${formatMacro(perPortion.fat_g, "г")}`);
  }
  if (perPortion.carbs_g !== null && perPortion.carbs_g !== undefined) {
    details.push(`У ${formatMacro(perPortion.carbs_g, "г")}`);
  }

  if (details.length > 0) {
    portionSummary.push("→");
    portionSummary.push(details.join(", "));
  }

  lines.push("");
  lines.push(portionSummary.join(" "));

  return lines.join("\n");
}

function buildProductBody(frontMatter: ProductFrontMatter, notes: string): string {
  const title = frontMatter.title || "Новый продукт";
  const cleanNotes = notes.trim().length > 0 ? notes.trim() : "_Комментариев нет_";
  const baseBody = `# ${title}\n\n${cleanNotes}\n`;
  const autoSummary = buildProductAutoSummary(frontMatter);
  return upsertAutoBlock(baseBody, "NUTRITION", autoSummary);
}

function extractNotesFromBody(body: string, expectedTitle: string): string {
  const startToken = "<!-- AUTO:NUTRITION START -->";
  const endToken = "<!-- AUTO:NUTRITION END -->";
  let manualPart = body;

  const startIndex = manualPart.indexOf(startToken);
  const endIndex = manualPart.indexOf(endToken);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = manualPart.slice(0, startIndex);
    const after = manualPart.slice(endIndex + endToken.length);
    manualPart = `${before}\n${after}`;
  }

  const lines = manualPart.split(/\r?\n/);
  const filtered: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) {
      filtered.push("");
      continue;
    }
    if (trimmed.startsWith("# ")) {
      continue;
    }
    filtered.push(trimmed);
  }

  const cleaned = filtered.join("\n").trim();
  if (!cleaned || cleaned === "_Комментариев нет_") {
    return "";
  }
  return cleaned;
}

function parseFrontMatter(data: Record<string, JsonValue>): ProductFrontMatter {
  const servingRaw = data.serving;
  const nutritionPerPortionRaw = data.nutrition_per_portion;
  const nutritionPer100Raw = data.nutrition_per_100g;

  const serving: ProductFrontMatter["serving"] =
    typeof servingRaw === "object" && servingRaw !== null
      ? {
          default_qty: toNumberOrNull((servingRaw as Record<string, unknown>).default_qty),
          default_unit: toStringValue((servingRaw as Record<string, unknown>).default_unit) || DEFAULT_SERVING_UNIT
        }
      : undefined;

  const mapNutrition = (source: unknown): ProductFrontMatter["nutrition_per_portion"] => {
    if (typeof source !== "object" || source === null) {
      return undefined;
    }
    const record = source as Record<string, unknown>;
    return {
      kcal: toNumberZeroIfAbsent(record.kcal),
      protein_g: toNumberZeroIfAbsent(record.protein_g),
      fat_g: toNumberZeroIfAbsent(record.fat_g),
      carbs_g: toNumberZeroIfAbsent(record.carbs_g),
      sugar_g: toNumberZeroIfAbsent(record.sugar_g),
      fiber_g: toNumberZeroIfAbsent(record.fiber_g)
    };
  };

  return {
    id: toStringValue(data.id) || "",
    title: toStringValue(data.title) || "Untitled product",
    brand: toStringValue(data.brand) || undefined,
    barcode: toStringValue(data.barcode) || undefined,
    model: toStringValue(data.model) || undefined,
    model_label: toStringValue(data.model_label) || undefined,
    meal_time: toStringValue(data.meal_time) || undefined,
    meal_time_label: toStringValue(data.meal_time_label) || undefined,
    serving,
    nutrition_per_portion: mapNutrition(nutritionPerPortionRaw),
    nutrition_per_100g: mapNutrition(nutritionPer100Raw),
    tags: toStringArray(data.tags),
    created_at: toStringValue(data.created_at) || undefined,
    updated_at: toStringValue(data.updated_at) || undefined
  };
}

function frontMatterToSummary(
  fileName: string,
  frontMatter: ProductFrontMatter,
  notes: string
): ProductSummary {
  const slugFromId = frontMatter.id?.startsWith("product:")
    ? frontMatter.id.slice("product:".length)
    : null;
  const slug = slugFromId ?? fileName.replace(/\.md$/i, "");

  const portionGrams = toOptionalNumber(frontMatter.serving?.default_qty) ?? null;
  const portionUnit = frontMatter.serving?.default_unit ?? DEFAULT_SERVING_UNIT;
  const perPortion = frontMatter.nutrition_per_portion ?? {};
  const per100 = frontMatter.nutrition_per_100g ?? {};

  return {
    fileName,
    slug,
    title: frontMatter.title || slug,
    brand: frontMatter.brand,
    model: frontMatter.model,
    modelLabel: frontMatter.model_label,
    portionGrams,
    portionUnit,
    mealTime: frontMatter.meal_time,
    mealTimeLabel: frontMatter.meal_time_label,
    nutritionPerPortion: {
      caloriesKcal: toOptionalNumber(perPortion.kcal) ?? null,
      proteinG: toOptionalNumber(perPortion.protein_g) ?? null,
      fatG: toOptionalNumber(perPortion.fat_g) ?? null,
      carbsG: toOptionalNumber(perPortion.carbs_g) ?? null,
      sugarG: toOptionalNumber(perPortion.sugar_g) ?? null,
      fiberG: toOptionalNumber(perPortion.fiber_g) ?? null
    },
    nutritionPer100g: {
      caloriesKcal: toOptionalNumber(per100.kcal) ?? null,
      proteinG: toOptionalNumber(per100.protein_g) ?? null,
      fatG: toOptionalNumber(per100.fat_g) ?? null,
      carbsG: toOptionalNumber(per100.carbs_g) ?? null,
      sugarG: toOptionalNumber(per100.sugar_g) ?? null,
      fiberG: toOptionalNumber(per100.fiber_g) ?? null
    },
    createdAt: frontMatter.created_at,
    updatedAt: frontMatter.updated_at,
    tags: frontMatter.tags,
    notes
  };
}

function frontMatterToFormData(frontMatter: ProductFrontMatter, notes: string): ProductFormData {
  const perPortion = frontMatter.nutrition_per_portion ?? {};
  const portionQty = frontMatter.serving?.default_qty ?? null;
  const portionUnit = frontMatter.serving?.default_unit ?? DEFAULT_SERVING_UNIT;

  const data: ProductFormData = {
    productName: frontMatter.title ?? "",
    brand: frontMatter.brand ?? "",
    barcode: frontMatter.barcode ?? "",
    model: frontMatter.model ?? "",
    modelLabel: frontMatter.model_label ?? "",
    portion: portionQty !== null && portionQty !== undefined ? String(portionQty) : "",
    portionUnit,
    mealTime: frontMatter.meal_time ?? "",
    mealTimeLabel: frontMatter.meal_time_label ?? "",
    calories: perPortion.kcal !== null && perPortion.kcal !== undefined ? String(perPortion.kcal) : "",
    protein: perPortion.protein_g !== null && perPortion.protein_g !== undefined ? String(perPortion.protein_g) : "",
    fat: perPortion.fat_g !== null && perPortion.fat_g !== undefined ? String(perPortion.fat_g) : "",
    carbs: perPortion.carbs_g !== null && perPortion.carbs_g !== undefined ? String(perPortion.carbs_g) : "",
    sugar: perPortion.sugar_g !== null && perPortion.sugar_g !== undefined ? String(perPortion.sugar_g) : "",
    fiber: perPortion.fiber_g !== null && perPortion.fiber_g !== undefined ? String(perPortion.fiber_g) : "",
    tags: frontMatter.tags?.join(", ") ?? "",
    notes,
    createdAt: frontMatter.created_at ?? ""
  };

  return data;
}

function parseProductFile(fileName: string, text: string): ProductDetail {
  const { data, body } = parseMarkdownDocument(text);
  const frontMatter = parseFrontMatter(data);
  const notes = extractNotesFromBody(body, frontMatter.title);
  const summary = frontMatterToSummary(fileName, frontMatter, notes);
  const formData = frontMatterToFormData(frontMatter, notes);

  return {
    ...summary,
    formData
  };
}

function fileExists(
  directory: FileSystemDirectoryHandle,
  fileName: string
): Promise<boolean> {
  return directory
    .getFileHandle(fileName, { create: false })
    .then(() => true)
    .catch((error) => {
      if ((error as DOMException)?.name === "NotFoundError") {
        return false;
      }
      throw error;
    });
}

async function createUniqueFile(
  directory: FileSystemDirectoryHandle,
  baseName: string
): Promise<{ handle: FileSystemFileHandle; fileName: string }> {
  let attempt = 0;
  while (attempt < 1000) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const fileName = `${baseName}${suffix}.md`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await fileExists(directory, fileName);
    if (!exists) {
      const handle = await directory.getFileHandle(fileName, { create: true });
      return { handle, fileName };
    }
    attempt += 1;
  }
  throw new Error("Unable to choose a unique file name for the product.");
}

function buildProductMarkdown(data: ProductFormData, slug: string, timestamps: { createdAt: string; updatedAt: string }): string {
  const notes = data.notes ?? "";
  const frontMatter = buildFrontMatterFromForm(data, slug, timestamps);
  const body = buildProductBody(frontMatter, notes);
  const serialized = serializeFrontMatter(frontMatter);
  return buildMarkdownDocument(serialized, body).trim() + "\n";
}

export function createSlug(source: string): string {
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

export async function persistProductMarkdown(
  vaultHandle: FileSystemDirectoryHandle,
  data: ProductFormData
): Promise<{ fileName: string; slug: string }> {
  const productName = data.productName?.trim() || "product";
  const slug = createSlug(productName) || `product-${Date.now()}`;
  const baseFileName = slug;

  const productsDir = await ensureProductsDirectory(vaultHandle);
  const { handle, fileName } = await createUniqueFile(productsDir, baseFileName);
  const now = new Date().toISOString();
  const timestamps = { createdAt: data.createdAt && data.createdAt.length > 0 ? data.createdAt : now, updatedAt: now };
  const content = buildProductMarkdown(data, slug, timestamps);
  const writable = await handle.createWritable({ keepExistingData: false });

  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }

  return { fileName, slug };
}

export async function loadProductSummaries(
  vaultHandle: FileSystemDirectoryHandle
): Promise<ProductSummary[]> {
  const productsDir = await vaultHandle.getDirectoryHandle(PRODUCTS_DIRECTORY_NAME, {
    create: true
  });

  const summaries: ProductSummary[] = [];

  for await (const [entryName, entryHandle] of productsDir.entries()) {
    if (entryHandle.kind !== "file" || !entryName.endsWith(".md")) {
      continue;
    }
    const fileHandle = entryHandle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const text = await file.text();
    const detail = parseProductFile(entryName, text);
    const { formData: _form, ...summary } = detail;
    summaries.push(summary);
  }

  return summaries.sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function isPermissionError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const domException = error as DOMException;
  return domException?.name === "NotAllowedError" || domException?.name === "SecurityError";
}

export async function loadProductDetail(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<ProductDetail> {
  const productsDir = await ensureProductsDirectory(vaultHandle);
  const handle = await productsDir.getFileHandle(fileName, { create: false });
  const file = await handle.getFile();
  const text = await file.text();
  return parseProductFile(fileName, text);
}

export async function updateProductMarkdown(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string,
  slug: string,
  data: ProductFormData
): Promise<void> {
  const productsDir = await ensureProductsDirectory(vaultHandle);
  const handle = await productsDir.getFileHandle(fileName, { create: false });
  const now = new Date().toISOString();
  const timestamps = { createdAt: data.createdAt && data.createdAt.length > 0 ? data.createdAt : now, updatedAt: now };
  const content = buildProductMarkdown(data, slug, timestamps);
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

export async function deleteProduct(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  const productsDir = await ensureProductsDirectory(vaultHandle);
  if (typeof productsDir.removeEntry !== "function") {
    throw new Error("Current browser does not support deleting files via File System Access API");
  }
  try {
    await productsDir.removeEntry(fileName);
  } catch (error) {
    if ((error as DOMException)?.name === "NotFoundError") {
      return;
    }
    throw error;
  }
}
