import { createSlug } from "@/utils/vaultProducts";
import type { NutritionTotals } from "@/utils/vaultDays";

const RECIPES_DIRECTORY_NAME = "recipes";

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
  updatedAt?: string;
  createdAt?: string;
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
};

type StoredRecipe = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  servings: number;
  photoUrl?: string;
  stepsMarkdown: string;
  ingredients: RecipeIngredient[];
  nutritionTotal: NutritionTotals;
  nutritionPerServing: NutritionTotals;
  createdAt: string;
  updatedAt: string;
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

function createRecipeRecord(data: RecipeFormData, slug: string): StoredRecipe {
  const createdAt = data.createdAt ?? new Date().toISOString();
  const updatedAt = data.updatedAt ?? new Date().toISOString();
  const servings = Math.max(1, Number.parseInt(String(data.servings || 1), 10));

  const ingredients = data.ingredients.map(computeIngredientTotals);
  const nutritionTotal = sumTotals(ingredients.map((ingredient) => ingredient.totals));
  const perServingFactor = servings > 0 ? 1 / servings : 0;
  const nutritionPerServing = scaleTotals(nutritionTotal, perServingFactor);

  return {
    id: `recipe:${slug}`,
    slug,
    title: data.title.trim() || "New recipe",
    description: data.description?.trim() || undefined,
    servings,
    photoUrl: data.photoUrl?.trim() || undefined,
    stepsMarkdown: data.stepsMarkdown?.trim() || "",
    ingredients,
    nutritionTotal,
    nutritionPerServing,
    createdAt,
    updatedAt
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
    const fileName = `${baseName}${suffix}.json`;
    const exists = await fileExists(directory, fileName);
    if (!exists) {
      const handle = await directory.getFileHandle(fileName, { create: true });
      return { handle, fileName };
    }
    attempt += 1;
  }
  throw new Error("Unable to create unique recipe file name");
}

async function writeRecipe(handle: FileSystemFileHandle, recipe: StoredRecipe): Promise<void> {
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    await writable.write(`${JSON.stringify(recipe, null, 2)}\n`);
  } finally {
    await writable.close();
  }
}

async function readRecipe(handle: FileSystemFileHandle): Promise<StoredRecipe> {
  const file = await handle.getFile();
  const text = await file.text();
  const json = JSON.parse(text) as Partial<StoredRecipe>;

  const base: StoredRecipe = {
    id: json.id ?? "",
    slug: json.slug ?? "",
    title: json.title ?? "Untitled recipe",
    description: json.description,
    servings: json.servings ?? 1,
    photoUrl: json.photoUrl,
    stepsMarkdown: json.stepsMarkdown ?? "",
    ingredients: (json.ingredients ?? []).map((ingredient) => ({
      id: ingredient.id,
      title: ingredient.title,
      quantity: ingredient.quantity ?? 0,
      unit: ingredient.unit ?? "g",
      referenceAmount: ingredient.referenceAmount ?? 100,
      referenceUnit: ingredient.referenceUnit ?? ingredient.unit ?? "g",
      macros: cloneTotals(ingredient.macros),
      totals: cloneTotals(ingredient.totals),
      product: ingredient.product
    })),
    nutritionTotal: cloneTotals(json.nutritionTotal),
    nutritionPerServing: cloneTotals(json.nutritionPerServing),
    createdAt: json.createdAt ?? new Date().toISOString(),
    updatedAt: json.updatedAt ?? new Date().toISOString()
  };

  return base;
}

export async function loadRecipeSummaries(
  vaultHandle: FileSystemDirectoryHandle
): Promise<RecipeSummary[]> {
  const directory = await ensureDirectory(vaultHandle);
  const summaries: RecipeSummary[] = [];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore FileSystemDirectoryHandle is iterable in browsers
  for await (const entry of directory.values() as AsyncIterable<FileSystemDirectoryHandle | FileSystemFileHandle>) {
    if ((entry as FileSystemFileHandle).kind === "file") {
      const fileHandle = entry as FileSystemFileHandle;
      const recipe = await readRecipe(fileHandle);
      summaries.push({
        fileName: fileHandle.name,
        slug: recipe.slug,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        nutritionTotal: recipe.nutritionTotal,
        nutritionPerServing: recipe.nutritionPerServing,
        photoUrl: recipe.photoUrl,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt
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
  const recipe = await readRecipe(handle);
  return {
    fileName,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    nutritionTotal: recipe.nutritionTotal,
    nutritionPerServing: recipe.nutritionPerServing,
    photoUrl: recipe.photoUrl,
    stepsMarkdown: recipe.stepsMarkdown,
    ingredients: recipe.ingredients,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };
}

export async function persistRecipe(
  vaultHandle: FileSystemDirectoryHandle,
  data: RecipeFormData
): Promise<{ fileName: string; slug: string }> {
  const directory = await ensureDirectory(vaultHandle);
  const slug = createSlug(data.title) || `recipe-${Date.now()}`;
  const { handle, fileName } = await createUniqueFile(directory, slug);
  const record = createRecipeRecord(data, slug);
  await writeRecipe(handle, record);
  return { fileName, slug };
}

export async function updateRecipe(
  vaultHandle: FileSystemDirectoryHandle,
  fileName: string,
  data: RecipeFormData & { slug?: string }
): Promise<{ fileName: string; slug: string }> {
  const directory = await ensureDirectory(vaultHandle);
  const handle = await directory.getFileHandle(fileName, { create: false });
  const slug = data.slug?.trim() || createSlug(data.title) || `recipe-${Date.now()}`;
  const record = createRecipeRecord({ ...data, updatedAt: new Date().toISOString() }, slug);
  await writeRecipe(handle, record);
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
