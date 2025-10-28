const PRODUCTS_DIRECTORY_NAME = "products";

export const productDirectoryName = PRODUCTS_DIRECTORY_NAME;

export type ProductFormData = Record<string, string>;

export type ProductSummary = {
  fileName: string;
  slug: string;
  title: string;
  model?: string;
  modelLabel?: string;
  portionGrams?: number | null;
  mealTime?: string;
  mealTimeLabel?: string;
  nutritionPerPortion?: {
    caloriesKcal?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    carbsG?: number | null;
  };
  createdAt?: string;
  notes?: string;
};

export type ProductDetail = ProductSummary & {
  formData: ProductFormData;
};

type ParsedFrontMatter = {
  data: Record<string, unknown>;
  body: string;
};

const YAML_DIVIDER = "---";

async function ensureProductsDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(PRODUCTS_DIRECTORY_NAME, {
    create: true
  });
}

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

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function normalizeNumberLiteral(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "null";
  }
  const normalized = trimmed.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return "null";
  }
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
}

export function createSlug(source: string): string {
  return source
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё\\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fileExists(
  directory: FileSystemDirectoryHandle,
  fileName: string
): Promise<boolean> {
  try {
    await directory.getFileHandle(fileName, { create: false });
    return true;
  } catch (error) {
    if ((error as DOMException)?.name === "NotFoundError") {
      return false;
    }
    throw error;
  }
}

async function createUniqueFile(
  directory: FileSystemDirectoryHandle,
  baseName: string
): Promise<{ handle: FileSystemFileHandle; fileName: string }> {
  let attempt = 0;
  while (attempt < 1000) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const fileName = `${baseName}${suffix}.md`;
    const exists = await fileExists(directory, fileName);
    if (!exists) {
      const handle = await directory.getFileHandle(fileName, { create: true });
      return { handle, fileName };
    }
    attempt += 1;
  }
  throw new Error("Unable to choose a unique file name for the product.");
}

export function buildProductMarkdown(data: ProductFormData, slug: string): string {
  const productName = data.productName?.trim() || "New product";
  const modelValue = data.model ?? "";
  const mealTimeValue = data.mealTime ?? "";
  const createdAt = data.createdAt && data.createdAt.length > 0 ? data.createdAt : new Date().toISOString();

  const frontMatter: string[] = [
    YAML_DIVIDER,
    `id: "product:${slug}"`,
    `title: "${escapeYamlString(productName)}"`,
    `model: "${escapeYamlString(modelValue)}"`
  ];

  if (data.modelLabel) {
    frontMatter.push(`model_label: "${escapeYamlString(data.modelLabel)}"`);
  }

  frontMatter.push(`portion_grams: ${normalizeNumberLiteral(data.portion)}`);

  frontMatter.push(`meal_time: "${escapeYamlString(mealTimeValue)}"`);
  if (data.mealTimeLabel) {
    frontMatter.push(`meal_time_label: "${escapeYamlString(data.mealTimeLabel)}"`);
  }

  frontMatter.push("nutrition_per_portion:");
  frontMatter.push(`  calories_kcal: ${normalizeNumberLiteral(data.calories)}`);
  frontMatter.push(`  protein_g: ${normalizeNumberLiteral(data.protein)}`);
  frontMatter.push(`  fat_g: ${normalizeNumberLiteral(data.fat)}`);
  frontMatter.push(`  carbs_g: ${normalizeNumberLiteral(data.carbs)}`);
  frontMatter.push(`created_at: "${createdAt}"`);
  frontMatter.push(YAML_DIVIDER);

  const notes = data.notes?.trim();
  const body = notes && notes.length > 0 ? `${notes}\n` : "_Комментариев нет_\n";

  return `${frontMatter.join("\n")}\n\n${body}`;
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
  const content = buildProductMarkdown(data, slug);
  const writable = await handle.createWritable({ keepExistingData: false });

  try {
    await writable.write(`${content.trim()}\n`);
  } finally {
    await writable.close();
  }

  return { fileName, slug };
}

function parseFrontMatter(content: string): ParsedFrontMatter {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== YAML_DIVIDER) {
    return { data: {}, body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === YAML_DIVIDER) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, body: content };
  }

  const frontMatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join("\n").trim();

  const data: Record<string, unknown> = {};
  let currentObjectKey: string | null = null;

  for (const line of frontMatterLines) {
    if (!line.trim()) {
      continue;
    }

    if (line.startsWith("  ") && currentObjectKey) {
      const trimmed = line.trim();
      const [nestedKey, ...rest] = trimmed.split(":");
      if (!nestedKey) {
        continue;
      }
      const valuePart = rest.join(":").trim();
      const parsedValue = parseScalarValue(valuePart);
      if (typeof data[currentObjectKey] !== "object" || data[currentObjectKey] === null) {
        data[currentObjectKey] = {};
      }
      (data[currentObjectKey] as Record<string, unknown>)[nestedKey] = parsedValue;
      continue;
    }

    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim();
    const valuePart = rest.join(":").trim();

    if (!key) {
      continue;
    }

    if (!valuePart) {
      currentObjectKey = key;
      data[key] = {};
      continue;
    }

    currentObjectKey = null;
    data[key] = parseScalarValue(valuePart);
  }

  return { data, body };
}

function parseProductFile(fileName: string, text: string): ProductDetail {
  const { data, body } = parseFrontMatter(text);
  const slugFromId = typeof data.id === "string" ? data.id.replace(/^product:/, "") : null;
  const slug = slugFromId ?? fileName.replace(/\.md$/i, "");
  const title = typeof data.title === "string" ? data.title : slug;
  const model = typeof data.model === "string" ? data.model : undefined;
  const modelLabel = typeof data.model_label === "string" ? data.model_label : undefined;
  const mealTime = typeof data.meal_time === "string" ? data.meal_time : undefined;
  const mealTimeLabel = typeof data.meal_time_label === "string" ? data.meal_time_label : undefined;
  const portionValue = toOptionalNumber(data.portion_grams);
  const nutritionData = (data.nutrition_per_portion ?? {}) as Record<string, unknown>;
  const calories = toOptionalNumber(nutritionData.calories_kcal);
  const protein = toOptionalNumber(nutritionData.protein_g);
  const fat = toOptionalNumber(nutritionData.fat_g);
  const carbs = toOptionalNumber(nutritionData.carbs_g);
  const createdAt = typeof data.created_at === "string" ? data.created_at : undefined;
  const notesRaw = body ?? "";
  const notes = notesRaw === "_Комментариев нет_" ? "" : notesRaw;

  const summary: ProductSummary = {
    fileName,
    slug,
    title,
    model,
    modelLabel,
    portionGrams: portionValue,
    mealTime,
    mealTimeLabel,
    nutritionPerPortion: {
      caloriesKcal: calories,
      proteinG: protein,
      fatG: fat,
      carbsG: carbs
    },
    createdAt,
    notes
  };

  const formData: ProductFormData = {
    model: model ?? "",
    modelLabel: modelLabel ?? "",
    productName: title ?? "",
    portion: toStringValue(data.portion_grams),
    mealTime: mealTime ?? "",
    mealTimeLabel: mealTimeLabel ?? "",
    calories: toStringValue(nutritionData.calories_kcal ?? nutritionData.caloriesKcal),
    protein: toStringValue(nutritionData.protein_g ?? nutritionData.proteinG),
    fat: toStringValue(nutritionData.fat_g ?? nutritionData.fatG),
    carbs: toStringValue(nutritionData.carbs_g ?? nutritionData.carbsG),
    notes,
    createdAt: createdAt ?? ""
  };

  return {
    ...summary,
    formData
  };
}

function parseScalarValue(raw: string): string | number | null {
  if (!raw) {
    return null;
  }
  if (raw === "null") {
    return null;
  }
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return unescapeYamlString(raw.slice(1, -1));
  }
  const normalized = raw.replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  return raw;
}

function unescapeYamlString(value: string): string {
  return value.replace(/\\\\/g, "\\").replace(/\\"/g, '"');
}

export async function loadProductSummaries(
  vaultHandle: FileSystemDirectoryHandle
): Promise<ProductSummary[]> {
  const productsDir = await vaultHandle.getDirectoryHandle(PRODUCTS_DIRECTORY_NAME, {
    create: true
  });

  const summaries: ProductSummary[] = [];

  for await (const [entryName, entryHandle] of productsDir.entries()) {
    if (entryHandle.kind !== "file") {
      continue;
    }

    if (!entryName.endsWith(".md")) {
      continue;
    }

    const fileHandle = entryHandle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const text = await file.text();
    const detail = parseProductFile(entryName, text);
    const { formData: _unused, ...summary } = detail;
    summaries.push(summary);
  }

  summaries.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  return summaries;
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
  const content = buildProductMarkdown(data, slug);
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    await writable.write(`${content.trim()}\n`);
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
