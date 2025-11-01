import {
  buildMarkdownDocument,
  parseMarkdownDocument,
  upsertAutoBlock,
  type JsonValue
} from "@/utils/markdown";
import { createSlug } from "@/utils/vaultProducts";
import type { NutritionTotals } from "@/utils/vaultDays";

const RECIPES_DIRECTORY_NAME = "recipes";

type RecipeMacroTotals = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG?: number | null;
  fiberG?: number | null;
};

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

type RecipeFrontMatter = {
  id: string;
  title: string;
  description?: string;
  servings_default: number;
  photo_url?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  ingredients: Array<{
    id: string;
    title: string;
    qty: number;
    unit: string;
    reference_amount: number;
    reference_unit: string;
    macros: RecipeMacroTotals;
    totals: RecipeMacroTotals;
    product?: {
      slug?: string;
      ref?: string;
      title?: string;
      file_name?: string;
    };
  }>;
  nutrition_per_serving: RecipeMacroTotals;
  nutrition_total: RecipeMacroTotals;
};

function ensureDirectory(vaultHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(RECIPES_DIRECTORY_NAME, {
    create: true
  });
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readNumericValue(
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

function cloneTotals(input?: Partial<NutritionTotals>): NutritionTotals {
  return {
    caloriesKcal: normalizeNumber(input?.caloriesKcal),
    proteinG: normalizeNumber(input?.proteinG),
    fatG: normalizeNumber(input?.fatG),
    carbsG: normalizeNumber(input?.carbsG)
  };
}

function scaleTotals(totals: NutritionTotals, factor: number): NutritionTotals {
  return {
    caloriesKcal: Number.parseFloat((totals.caloriesKcal * factor).toFixed(2)),
    proteinG: Number.parseFloat((totals.proteinG * factor).toFixed(2)),
    fatG: Number.parseFloat((totals.fatG * factor).toFixed(2)),
    carbsG: Number.parseFloat((totals.carbsG * factor).toFixed(2))
  };
}

function sumTotals(values: NutritionTotals[]): NutritionTotals {
  return values.reduce(
    (acc, current) => ({
      caloriesKcal: Number.parseFloat((acc.caloriesKcal + current.caloriesKcal).toFixed(2)),
      proteinG: Number.parseFloat((acc.proteinG + current.proteinG).toFixed(2)),
      fatG: Number.parseFloat((acc.fatG + current.fatG).toFixed(2)),
      carbsG: Number.parseFloat((acc.carbsG + current.carbsG).toFixed(2))
    }),
    { caloriesKcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );
}

function computeIngredientTotals(draft: RecipeIngredientDraft): RecipeIngredient {
  const macros = cloneTotals(draft.macros);
  const referenceAmount = normalizeNumber(draft.referenceAmount) || 100;
  const quantity = normalizeNumber(draft.quantity);
  const factor = referenceAmount > 0 ? quantity / referenceAmount : 0;
  const totals = scaleTotals(macros, factor);

  return {
    id: draft.id,
    title: draft.title,
    quantity,
    unit: draft.unit,
    referenceAmount,
    referenceUnit: draft.referenceUnit,
    macros,
    totals,
    product: draft.product
  };
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

function buildRecipeAutoSummary(frontMatter: RecipeFrontMatter): string {
  const lines: string[] = [];

  lines.push(`## Ингредиенты (на ${frontMatter.servings_default} порции)`);
  for (const ingredient of frontMatter.ingredients) {
    const amount = formatNumber(ingredient.qty, { decimals: 0 });
    lines.push(`- ${ingredient.title} — ${amount} ${ingredient.unit}`);
  }

  lines.push("");
  lines.push("## Макро на 1 порцию");
  lines.push("| Ккал | Белки | Жиры | Углеводы |");
  lines.push("|---:|---:|---:|---:|");
  lines.push(
    `| ${formatNumber(frontMatter.nutrition_per_serving.caloriesKcal, { decimals: 0 })} | ${formatMacro(
      frontMatter.nutrition_per_serving.proteinG,
      "г"
    )} | ${formatMacro(frontMatter.nutrition_per_serving.fatG, "г")} | ${formatMacro(
      frontMatter.nutrition_per_serving.carbsG,
      "г"
    )} |`
  );

  return lines.join("\n");
}

function buildRecipeBody(frontMatter: RecipeFrontMatter, stepsMarkdown: string, description?: string): string {
  const title = frontMatter.title || "Новый рецепт";
  const cleanDescription = description?.trim();
  const descriptionSection = cleanDescription && cleanDescription.length > 0 ? `${cleanDescription}\n\n` : "";
  const baseBody = `# ${title}\n\n${descriptionSection}`.trimEnd() + "\n";
  const withAuto = upsertAutoBlock(baseBody, "SUMMARY", buildRecipeAutoSummary(frontMatter));
  const steps = stepsMarkdown.trim().length > 0 ? stepsMarkdown.trim() : "1. Соедините ингредиенты и подавайте.";
  return `${withAuto}\n\n## Как готовить\n${steps}\n`;
}

function extractStepsFromBody(body: string): { description: string; steps: string } {
  const startToken = "<!-- AUTO:SUMMARY START -->";
  const endToken = "<!-- AUTO:SUMMARY END -->";
  let manualPart = body;

  const startIndex = manualPart.indexOf(startToken);
  const endIndex = manualPart.indexOf(endToken);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = manualPart.slice(0, startIndex);
    const after = manualPart.slice(endIndex + endToken.length);
    manualPart = `${before}\n${after}`;
  }

  const lines = manualPart.split(/\r?\n/);
  const descriptionLines: string[] = [];
  const stepsLines: string[] = [];
  let inSteps = false;

  for (const line of lines) {
    if (line.trim().startsWith("# ")) {
      continue;
    }
    if (line.trim().toLowerCase() === "## как готовить") {
      inSteps = true;
      continue;
    }
    if (inSteps) {
      stepsLines.push(line);
    } else {
      descriptionLines.push(line);
    }
  }

  const description = descriptionLines.join("\n").trim();
  const steps = stepsLines.join("\n").trim();

  return {
    description,
    steps
  };
}

function recipeToFrontMatter(
  record: RecipeDetail
): RecipeFrontMatter {
  return {
    id: `recipe:${record.slug}`,
    title: record.title,
    description: record.description,
    servings_default: record.servings,
    photo_url: record.photoUrl,
    tags: record.tags,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    prep_time_minutes: null,
    cook_time_minutes: null,
    ingredients: record.ingredients.map((ingredient) => ({
      id: ingredient.id,
      title: ingredient.title,
      qty: ingredient.quantity,
      unit: ingredient.unit,
      reference_amount: ingredient.referenceAmount,
      reference_unit: ingredient.referenceUnit,
      macros: {
        caloriesKcal: ingredient.macros.caloriesKcal,
        proteinG: ingredient.macros.proteinG,
        fatG: ingredient.macros.fatG,
        carbsG: ingredient.macros.carbsG,
        sugarG: ingredient.macros.sugarG ?? null,
        fiberG: ingredient.macros.fiberG ?? null
      },
      totals: {
        caloriesKcal: ingredient.totals.caloriesKcal,
        proteinG: ingredient.totals.proteinG,
        fatG: ingredient.totals.fatG,
        carbsG: ingredient.totals.carbsG,
        sugarG: ingredient.totals.sugarG ?? null,
        fiberG: ingredient.totals.fiberG ?? null
      },
      product: ingredient.product
        ? {
            slug: ingredient.product.slug,
            ref: ingredient.product.ref,
            title: ingredient.product.title,
            file_name: ingredient.product.fileName
          }
        : undefined
    })),
    nutrition_per_serving: {
      caloriesKcal: record.nutritionPerServing.caloriesKcal,
      proteinG: record.nutritionPerServing.proteinG,
      fatG: record.nutritionPerServing.fatG,
      carbsG: record.nutritionPerServing.carbsG,
      sugarG: record.nutritionPerServing.sugarG ?? null,
      fiberG: record.nutritionPerServing.fiberG ?? null
    },
    nutrition_total: {
      caloriesKcal: record.nutritionTotal.caloriesKcal,
      proteinG: record.nutritionTotal.proteinG,
      fatG: record.nutritionTotal.fatG,
      carbsG: record.nutritionTotal.carbsG,
      sugarG: record.nutritionTotal.sugarG ?? null,
      fiberG: record.nutritionTotal.fiberG ?? null
    }
  };
}

function serializeRecipeFrontMatter(frontMatter: RecipeFrontMatter): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {
    id: frontMatter.id,
    title: frontMatter.title,
    servings_default: frontMatter.servings_default,
    ingredients: frontMatter.ingredients.map((ingredient) => ({
      id: ingredient.id,
      title: ingredient.title,
      qty: ingredient.qty,
      unit: ingredient.unit,
      reference_amount: ingredient.reference_amount,
      reference_unit: ingredient.reference_unit,
      macros: {
        caloriesKcal: ingredient.macros.caloriesKcal,
        proteinG: ingredient.macros.proteinG,
        fatG: ingredient.macros.fatG,
        carbsG: ingredient.macros.carbsG,
        sugarG: ingredient.macros.sugarG ?? null,
        fiberG: ingredient.macros.fiberG ?? null
      },
      totals: {
        caloriesKcal: ingredient.totals.caloriesKcal,
        proteinG: ingredient.totals.proteinG,
        fatG: ingredient.totals.fatG,
        carbsG: ingredient.totals.carbsG,
        sugarG: ingredient.totals.sugarG ?? null,
        fiberG: ingredient.totals.fiberG ?? null
      },
      product: ingredient.product
        ? {
            slug: ingredient.product.slug ?? null,
            ref: ingredient.product.ref ?? null,
            title: ingredient.product.title ?? null,
            file_name: ingredient.product.file_name ?? null
          }
        : null
    })),
    nutrition_per_serving: {
      caloriesKcal: frontMatter.nutrition_per_serving.caloriesKcal,
      proteinG: frontMatter.nutrition_per_serving.proteinG,
      fatG: frontMatter.nutrition_per_serving.fatG,
      carbsG: frontMatter.nutrition_per_serving.carbsG,
      sugarG: frontMatter.nutrition_per_serving.sugarG ?? null,
      fiberG: frontMatter.nutrition_per_serving.fiberG ?? null
    },
    nutrition_total: {
      caloriesKcal: frontMatter.nutrition_total.caloriesKcal,
      proteinG: frontMatter.nutrition_total.proteinG,
      fatG: frontMatter.nutrition_total.fatG,
      carbsG: frontMatter.nutrition_total.carbsG,
      sugarG: frontMatter.nutrition_total.sugarG ?? null,
      fiberG: frontMatter.nutrition_total.fiberG ?? null
    }
  };

  if (frontMatter.description) {
    result.description = frontMatter.description;
  }
  if (frontMatter.photo_url) {
    result.photo_url = frontMatter.photo_url;
  }
  if (frontMatter.tags && frontMatter.tags.length > 0) {
    result.tags = frontMatter.tags;
  }
  if (frontMatter.created_at) {
    result.created_at = frontMatter.created_at;
  }
  if (frontMatter.updated_at) {
    result.updated_at = frontMatter.updated_at;
  }
  if (frontMatter.prep_time_minutes !== undefined) {
    result.prep_time_minutes = frontMatter.prep_time_minutes ?? null;
  }
  if (frontMatter.cook_time_minutes !== undefined) {
    result.cook_time_minutes = frontMatter.cook_time_minutes ?? null;
  }

  return result;
}

function toNutritionTotals(source: unknown): NutritionTotals {
  if (typeof source !== "object" || source === null) {
    return { caloriesKcal: 0, proteinG: 0, fatG: 0, carbsG: 0 };
  }
  const record = source as Record<string, unknown>;
  return {
    caloriesKcal: normalizeNumber(readNumericValue(record, "caloriesKcal", "kcal")),
    proteinG: normalizeNumber(readNumericValue(record, "proteinG", "protein_g")),
    fatG: normalizeNumber(readNumericValue(record, "fatG", "fat_g")),
    carbsG: normalizeNumber(readNumericValue(record, "carbsG", "carbs_g")),
    sugarG: normalizeOptionalNumber(readNumericValue(record, "sugarG", "sugar_g")),
    fiberG: normalizeOptionalNumber(readNumericValue(record, "fiberG", "fiber_g"))
  };
}

function toRecipeMacroTotals(totals: NutritionTotals): RecipeMacroTotals {
  return {
    caloriesKcal: totals.caloriesKcal,
    proteinG: totals.proteinG,
    fatG: totals.fatG,
    carbsG: totals.carbsG,
    sugarG: totals.sugarG ?? null,
    fiberG: totals.fiberG ?? null
  };
}

function parseRecipeFrontMatter(data: Record<string, JsonValue>): RecipeFrontMatter {
  const createdAt = typeof data.created_at === "string" ? data.created_at : undefined;
  const updatedAt = typeof data.updated_at === "string" ? data.updated_at : undefined;
  const tags =
    Array.isArray(data.tags) && data.tags.length > 0
      ? data.tags.map((tag) => (typeof tag === "string" ? tag : String(tag ?? ""))).filter(Boolean)
      : undefined;

  const ingredients: RecipeFrontMatter["ingredients"] = [];
  if (Array.isArray(data.ingredients)) {
    for (const entry of data.ingredients as unknown[]) {
      if (typeof entry !== "object" || entry === null) {
        continue;
      }
      const record = entry as Record<string, unknown>;
      const macrosRecord = asRecord(record.macros);
      const totalsRecord = asRecord(record.totals);
      ingredients.push({
        id: String(record.id ?? ""),
        title: String(record.title ?? record.name ?? "Ингредиент"),
        qty: normalizeNumber(readNumericValue(record, "qty", "quantity")),
        unit: String(record.unit ?? "g"),
        reference_amount: normalizeNumber(
          readNumericValue(record, "reference_amount", "referenceAmount") ?? 100
        ),
        reference_unit: String(record.reference_unit ?? record.referenceUnit ?? "g"),
        macros: {
          caloriesKcal: normalizeNumber(readNumericValue(macrosRecord, "caloriesKcal", "kcal")),
          proteinG: normalizeNumber(readNumericValue(macrosRecord, "proteinG", "protein_g")),
          fatG: normalizeNumber(readNumericValue(macrosRecord, "fatG", "fat_g")),
          carbsG: normalizeNumber(readNumericValue(macrosRecord, "carbsG", "carbs_g")),
          sugarG: normalizeOptionalNumber(readNumericValue(macrosRecord, "sugarG", "sugar_g")),
          fiberG: normalizeOptionalNumber(readNumericValue(macrosRecord, "fiberG", "fiber_g"))
        },
        totals: {
          caloriesKcal: normalizeNumber(readNumericValue(totalsRecord, "caloriesKcal", "kcal")),
          proteinG: normalizeNumber(readNumericValue(totalsRecord, "proteinG", "protein_g")),
          fatG: normalizeNumber(readNumericValue(totalsRecord, "fatG", "fat_g")),
          carbsG: normalizeNumber(readNumericValue(totalsRecord, "carbsG", "carbs_g")),
          sugarG: normalizeOptionalNumber(readNumericValue(totalsRecord, "sugarG", "sugar_g")),
          fiberG: normalizeOptionalNumber(readNumericValue(totalsRecord, "fiberG", "fiber_g"))
        },
        product:
          typeof record.product === "object" && record.product !== null
            ? {
                slug: String((record.product as Record<string, unknown>).slug ?? ""),
                ref: String((record.product as Record<string, unknown>).ref ?? ""),
                title: String((record.product as Record<string, unknown>).title ?? ""),
                file_name: String((record.product as Record<string, unknown>).file_name ?? "")
              }
            : undefined
      });
    }
  }

  const nutritionPerServing = toRecipeMacroTotals(toNutritionTotals(data.nutrition_per_serving));
  const nutritionTotal = toRecipeMacroTotals(toNutritionTotals(data.nutrition_total));

  return {
    id: typeof data.id === "string" ? data.id : "",
    title: typeof data.title === "string" ? data.title : "Untitled recipe",
    description: typeof data.description === "string" ? data.description : undefined,
    servings_default:
      typeof data.servings_default === "number" && Number.isFinite(data.servings_default)
        ? Math.max(1, Math.round(data.servings_default))
        : 1,
    photo_url: typeof data.photo_url === "string" ? data.photo_url : undefined,
    tags,
    created_at: createdAt,
    updated_at: updatedAt,
    prep_time_minutes:
      typeof data.prep_time_minutes === "number" ? Number.parseInt(String(data.prep_time_minutes), 10) : null,
    cook_time_minutes:
      typeof data.cook_time_minutes === "number" ? Number.parseInt(String(data.cook_time_minutes), 10) : null,
    ingredients,
    nutrition_per_serving: nutritionPerServing,
    nutrition_total: nutritionTotal
  };
}

function frontMatterToDetail(
  fileName: string,
  frontMatter: RecipeFrontMatter,
  stepsMarkdown: string
): RecipeDetail {
  const slugFromId = frontMatter.id?.startsWith("recipe:")
    ? frontMatter.id.slice("recipe:".length)
    : null;
  const slug = slugFromId ?? fileName.replace(/\.md$/i, "");

  const ingredients: RecipeIngredient[] = frontMatter.ingredients.map((ingredient) => ({
    id: ingredient.id,
    title: ingredient.title,
    quantity: ingredient.qty,
    unit: ingredient.unit,
    referenceAmount: ingredient.reference_amount,
    referenceUnit: ingredient.reference_unit,
    macros: {
      caloriesKcal: ingredient.macros.caloriesKcal,
      proteinG: ingredient.macros.proteinG,
      fatG: ingredient.macros.fatG,
      carbsG: ingredient.macros.carbsG
    },
    totals: {
      caloriesKcal: ingredient.totals.caloriesKcal,
      proteinG: ingredient.totals.proteinG,
      fatG: ingredient.totals.fatG,
      carbsG: ingredient.totals.carbsG
    },
    product: ingredient.product
      ? {
          slug: ingredient.product.slug,
          ref: ingredient.product.ref,
          title: ingredient.product.title,
          fileName: ingredient.product.file_name
        }
      : undefined
  }));

  return {
    fileName,
    slug,
    title: frontMatter.title,
    description: frontMatter.description,
    servings: frontMatter.servings_default,
    nutritionTotal: {
      caloriesKcal: frontMatter.nutrition_total.caloriesKcal,
      proteinG: frontMatter.nutrition_total.proteinG,
      fatG: frontMatter.nutrition_total.fatG,
      carbsG: frontMatter.nutrition_total.carbsG
    },
    nutritionPerServing: {
      caloriesKcal: frontMatter.nutrition_per_serving.caloriesKcal,
      proteinG: frontMatter.nutrition_per_serving.proteinG,
      fatG: frontMatter.nutrition_per_serving.fatG,
      carbsG: frontMatter.nutrition_per_serving.carbsG
    },
    photoUrl: frontMatter.photo_url,
    updatedAt: frontMatter.updated_at,
    createdAt: frontMatter.created_at,
    stepsMarkdown,
    ingredients,
    tags: frontMatter.tags
  };
}

function createRecipeDetailFromForm(data: RecipeFormData, slug: string): RecipeDetail {
  const createdAt = data.createdAt ?? new Date().toISOString();
  const updatedAt = data.updatedAt ?? new Date().toISOString();
  const servings = Math.max(1, Number.parseInt(String(data.servings || 1), 10));
  const ingredients = data.ingredients.map(computeIngredientTotals);
  const nutritionTotal = sumTotals(ingredients.map((ingredient) => ingredient.totals));
  const perServingFactor = servings > 0 ? 1 / servings : 0;
  const nutritionPerServing = scaleTotals(nutritionTotal, perServingFactor);

  return {
    fileName: "",
    slug,
    title: data.title.trim() || "New recipe",
    description: data.description?.trim() || undefined,
    servings,
    nutritionTotal,
    nutritionPerServing,
    photoUrl: data.photoUrl?.trim() || undefined,
    stepsMarkdown: data.stepsMarkdown?.trim() || "",
    ingredients,
    createdAt,
    updatedAt,
    tags: data.tags ?? []
  };
}

async function fileExists(directory: FileSystemDirectoryHandle, fileName: string): Promise<boolean> {
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
  throw new Error("Unable to create unique recipe file name");
}

function buildRecipeMarkdown(detail: RecipeDetail): string {
  const frontMatter = recipeToFrontMatter(detail);
  const serialized = serializeRecipeFrontMatter(frontMatter);
  const body = buildRecipeBody(frontMatter, detail.stepsMarkdown, detail.description);
  return buildMarkdownDocument(serialized, body).trim() + "\n";
}

async function readRecipe(handle: FileSystemFileHandle): Promise<{ frontMatter: RecipeFrontMatter; steps: string }> {
  const file = await handle.getFile();
  const text = await file.text();
  const { data, body } = parseMarkdownDocument(text);
  const frontMatter = parseRecipeFrontMatter(data);
  const { description, steps } = extractStepsFromBody(body);
  frontMatter.description = frontMatter.description ?? description;
  return { frontMatter, steps };
}

export async function loadRecipeSummaries(
  vaultHandle: FileSystemDirectoryHandle
): Promise<RecipeSummary[]> {
  const directory = await ensureDirectory(vaultHandle);
  const summaries: RecipeSummary[] = [];

  for await (const entry of directory.values() as AsyncIterable<FileSystemDirectoryHandle | FileSystemFileHandle>) {
    if ((entry as FileSystemFileHandle).kind === "file" && (entry as FileSystemFileHandle).name.endsWith(".md")) {
      const fileHandle = entry as FileSystemFileHandle;
      const { frontMatter, steps } = await readRecipe(fileHandle);
      const detail = frontMatterToDetail(fileHandle.name, frontMatter, steps);
      summaries.push({
        fileName: fileHandle.name,
        slug: detail.slug,
        title: detail.title,
        description: detail.description,
        servings: detail.servings,
        nutritionTotal: detail.nutritionTotal,
        nutritionPerServing: detail.nutritionPerServing,
        photoUrl: detail.photoUrl,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
        tags: detail.tags
      });
    }
  }

  return summaries.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function loadRecipeDetail(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<RecipeDetail & { fileName: string }> {
  const directory = await ensureDirectory(vaultHandle);
  const handle = await directory.getFileHandle(fileName, { create: false });
  const { frontMatter, steps } = await readRecipe(handle);
  const detail = frontMatterToDetail(fileName, frontMatter, steps);
  return {
    ...detail,
    fileName
  };
}

export async function persistRecipe(
  vaultHandle: FileSystemDirectoryHandle,
  data: RecipeFormData
): Promise<{ fileName: string; slug: string }> {
  const directory = await ensureDirectory(vaultHandle);
  const slug = createSlug(data.title) || `recipe-${Date.now()}`;
  const { handle, fileName } = await createUniqueFile(directory, slug);
  const detail = createRecipeDetailFromForm(data, slug);
  const content = buildRecipeMarkdown({ ...detail, fileName });
  await writeRecipe(handle, content);
  return { fileName, slug };
}

async function writeRecipe(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

export async function updateRecipe(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string,
  data: RecipeFormData & { slug?: string }
): Promise<{ fileName: string; slug: string }> {
  const directory = await ensureDirectory(vaultHandle);
  const handle = await directory.getFileHandle(fileName, { create: false });
  const slug = data.slug?.trim() || createSlug(data.title) || `recipe-${Date.now()}`;
  const detail = createRecipeDetailFromForm({ ...data, updatedAt: new Date().toISOString() }, slug);
  const content = buildRecipeMarkdown({ ...detail, fileName });
  await writeRecipe(handle, content);
  return { fileName, slug };
}

export async function deleteRecipe(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  const directory = await ensureDirectory(vaultHandle);
  if (typeof directory.removeEntry !== "function") {
    throw new Error("Current browser does not support removing files");
  }
  await directory.removeEntry(fileName, { recursive: false });
}
