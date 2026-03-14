import { apiRequest } from "../../../shared/api/http";

export type ProductNutrition = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  brand?: string;
  nutritionPer100g: ProductNutrition;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductDetail = ProductSummary;

export type ProductFormValues = {
  title: string;
  brand: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
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
  createdAt?: string;
  updatedAt?: string;
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

function mapProduct(item: BackendProduct): ProductSummary {
  const title = (item.name ?? item.title ?? "Product").trim() || "Product";

  return {
    id: item.id,
    slug: createSlug(title) || item.id,
    title,
    brand: item.brand,
    nutritionPer100g: {
      caloriesKcal: toNumber(item.kcal100),
      proteinG: toNumber(item.protein100),
      fatG: toNumber(item.fat100),
      carbsG: toNumber(item.carbs100)
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function fetchProducts(): Promise<BackendProduct[]> {
  try {
    return await apiRequest<BackendProduct[]>("/v1/me/products");
  } catch {
    return apiRequest<BackendProduct[]>("/v1/products", undefined, { auth: false });
  }
}

export async function getProducts(): Promise<ProductSummary[]> {
  const products = await fetchProducts();
  return products.map(mapProduct).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getProduct(productId: string): Promise<ProductDetail> {
  const products = await fetchProducts();
  const found = products.find((item) => item.id === productId);
  if (!found) {
    throw new Error("Product not found");
  }
  return mapProduct(found);
}

function toPayload(values: ProductFormValues) {
  return {
    name: values.title,
    brand: values.brand || undefined,
    kcal100: values.calories,
    protein100: values.protein,
    fat100: values.fat,
    carbs100: values.carbs,
    isPublic: false
  };
}

export async function createProduct(values: ProductFormValues): Promise<ProductDetail> {
  const created = await apiRequest<BackendProduct>("/v1/products", {
    method: "POST",
    body: JSON.stringify(toPayload(values))
  });
  return mapProduct(created);
}

export async function updateProduct(productId: string, values: ProductFormValues): Promise<ProductDetail> {
  const updated = await apiRequest<BackendProduct>(`/v1/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(toPayload(values))
  });
  return mapProduct(updated);
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiRequest(`/v1/products/${productId}`, { method: "DELETE" });
}
