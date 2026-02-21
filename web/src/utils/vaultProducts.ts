import { apiRequest } from "@/utils/apiClient";

const DEFAULT_SERVING_UNIT = "g";

export const productDirectoryName = "backend";

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

type BackendProduct = {
  id: string;
  name?: string;
  title?: string;
  brand?: string;
  kcal100?: number;
  protein100?: number;
  fat100?: number;
  carbs100?: number;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function maybeNumber(value: unknown): number | null {
  const num = toNumber(value, Number.NaN);
  return Number.isFinite(num) ? num : null;
}

function normalizePortion(data: { portion?: string | number | null }): number {
  const candidate = toNumber(data.portion, 100);
  return candidate > 0 ? candidate : 100;
}

function normalizeTitle(name?: string, fallback = "Product"): string {
  const title = (name ?? "").trim();
  return title.length > 0 ? title : fallback;
}

function toSummary(item: BackendProduct): ProductSummary {
  const id = item.id;
  const title = normalizeTitle(item.name ?? item.title);
  const portion = 100;

  return {
    fileName: id,
    slug: createSlug(title) || id,
    title,
    brand: item.brand,
    portionGrams: portion,
    portionUnit: DEFAULT_SERVING_UNIT,
    mealTime: "",
    mealTimeLabel: "",
    nutritionPer100g: {
      caloriesKcal: maybeNumber(item.kcal100),
      proteinG: maybeNumber(item.protein100),
      fatG: maybeNumber(item.fat100),
      carbsG: maybeNumber(item.carbs100),
      sugarG: null,
      fiberG: null
    },
    nutritionPerPortion: {
      caloriesKcal: maybeNumber(item.kcal100),
      proteinG: maybeNumber(item.protein100),
      fatG: maybeNumber(item.fat100),
      carbsG: maybeNumber(item.carbs100),
      sugarG: null,
      fiberG: null
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: [],
    notes: ""
  };
}

function toProductPayload(data: ProductFormData): {
  name: string;
  brand?: string;
  kcal100: number;
  protein100: number;
  fat100: number;
  carbs100: number;
  isPublic: boolean;
} {
  const name = normalizeTitle(data.productName, "New product");
  const brand = data.brand?.trim() || undefined;
  const portion = normalizePortion({ portion: data.portion });

  const caloriesPerPortion = toNumber(data.calories, 0);
  const proteinPerPortion = toNumber(data.protein, 0);
  const fatPerPortion = toNumber(data.fat, 0);
  const carbsPerPortion = toNumber(data.carbs, 0);

  const factor = portion > 0 ? 100 / portion : 1;

  return {
    name,
    brand,
    kcal100: Number.parseFloat((caloriesPerPortion * factor).toFixed(2)),
    protein100: Number.parseFloat((proteinPerPortion * factor).toFixed(2)),
    fat100: Number.parseFloat((fatPerPortion * factor).toFixed(2)),
    carbs100: Number.parseFloat((carbsPerPortion * factor).toFixed(2)),
    isPublic: false
  };
}

function toDetail(summary: ProductSummary): ProductDetail {
  const portion = summary.portionGrams ?? 100;
  const formData: ProductFormData = {
    productName: summary.title,
    brand: summary.brand ?? "",
    portion: String(portion),
    portionUnit: summary.portionUnit ?? DEFAULT_SERVING_UNIT,
    mealTime: summary.mealTime ?? "",
    mealTimeLabel: summary.mealTimeLabel ?? "",
    calories: String(summary.nutritionPerPortion?.caloriesKcal ?? 0),
    protein: String(summary.nutritionPerPortion?.proteinG ?? 0),
    fat: String(summary.nutritionPerPortion?.fatG ?? 0),
    carbs: String(summary.nutritionPerPortion?.carbsG ?? 0),
    notes: summary.notes ?? "",
    createdAt: summary.createdAt
  };

  return {
    ...summary,
    formData
  };
}

async function fetchMyProducts(): Promise<BackendProduct[]> {
  try {
    return await apiRequest<BackendProduct[]>("/v1/me/products");
  } catch {
    return apiRequest<BackendProduct[]>("/v1/products", undefined, { auth: false });
  }
}

export async function ensureDirectoryAccess(_handle: FileSystemDirectoryHandle): Promise<boolean> {
  return true;
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
  _vaultHandle: FileSystemDirectoryHandle,
  data: ProductFormData
): Promise<{ fileName: string; slug: string }> {
  const payload = toProductPayload(data);
  const created = await apiRequest<BackendProduct>("/v1/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const summary = toSummary(created);
  return { fileName: summary.fileName, slug: summary.slug };
}

export async function loadProductSummaries(
  _vaultHandle: FileSystemDirectoryHandle
): Promise<ProductSummary[]> {
  const list = await fetchMyProducts();
  return list.map(toSummary).sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

export function isPermissionError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const message = (error as { message?: string }).message ?? "";
  return message.includes("401") || message.toLowerCase().includes("unauthorized");
}

export async function loadProductDetail(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<ProductDetail> {
  const list = await fetchMyProducts();
  const found = list.find((item) => item.id === fileName);
  if (!found) {
    throw new Error("Product not found");
  }
  return toDetail(toSummary(found));
}

export async function updateProductMarkdown(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string,
  _slug: string,
  data: ProductFormData
): Promise<void> {
  const payload = toProductPayload(data);
  await apiRequest(`/v1/products/${fileName}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteProduct(
  _vaultHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  await apiRequest(`/v1/products/${fileName}`, {
    method: "DELETE"
  });
}
