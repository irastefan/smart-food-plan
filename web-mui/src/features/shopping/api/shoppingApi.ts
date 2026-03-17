import { apiRequest } from "../../../shared/api/http";
import type { MealPlanItem } from "../../meal-plan/api/mealPlanApi";
import type { ProductSummary } from "../../products/api/productsApi";
import type { RecipeDetail } from "../../recipes/model/recipeTypes";

export type ShoppingCategory = {
  id: string;
  name: string;
};

export type ShoppingItem = {
  id: string;
  title: string;
  amount: number | null;
  unit: string;
  note?: string;
  isDone: boolean;
  categoryId?: string | null;
  categoryName: string;
  productId?: string | null;
};

export type ShoppingList = {
  id: string;
  title: string;
  categories: ShoppingCategory[];
  items: ShoppingItem[];
};

type BackendCategory = {
  id?: string;
  name?: string | null;
};

type BackendItem = {
  id?: string;
  title?: string | null;
  name?: string | null;
  customName?: string | null;
  amount?: number | null;
  unit?: string | null;
  note?: string | null;
  isDone?: boolean | null;
  productId?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  category?: BackendCategory | null;
  product?: {
    id?: string;
    name?: string | null;
  } | null;
};

type BackendList = {
  id?: string;
  title?: string | null;
  categories?: BackendCategory[] | null;
  items?: BackendItem[] | null;
};

export type AddShoppingItemInput = {
  productId?: string;
  customName?: string;
  amount?: number;
  unit?: string;
  note?: string;
  categoryId?: string;
  categoryName?: string;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapCategory(category: BackendCategory, index: number): ShoppingCategory {
  return {
    id: category.id ?? `category-${index}`,
    name: (category.name ?? "Other").trim() || "Other"
  };
}

function mapItem(item: BackendItem, index: number): ShoppingItem {
  const title =
    item.product?.name ??
    item.title ??
    item.name ??
    item.customName ??
    "Item";
  const categoryName = item.category?.name ?? item.categoryName ?? "Other";

  return {
    id: item.id ?? `item-${index}`,
    title: title.trim() || "Item",
    amount: toNumber(item.amount),
    unit: item.unit ?? "pcs",
    note: item.note ?? undefined,
    isDone: Boolean(item.isDone),
    productId: item.productId ?? item.product?.id ?? null,
    categoryId: item.categoryId ?? item.category?.id ?? null,
    categoryName: categoryName.trim() || "Other"
  };
}

function mapList(response: BackendList): ShoppingList {
  return {
    id: response.id ?? "shopping-list",
    title: response.title ?? "Shopping list",
    categories: (response.categories ?? []).map(mapCategory),
    items: (response.items ?? []).map(mapItem)
  };
}

function toItemPayload(input: AddShoppingItemInput) {
  return {
    productId: input.productId || undefined,
    customName: input.customName || undefined,
    amount: input.amount ?? undefined,
    unit: input.unit || undefined,
    note: input.note || undefined,
    categoryId: input.categoryId || undefined,
    categoryName: input.categoryName || undefined
  };
}

export async function getShoppingList(): Promise<ShoppingList> {
  const response = await apiRequest<BackendList>("/v1/shopping-list");
  return mapList(response);
}

export async function addShoppingCategory(name: string): Promise<ShoppingCategory> {
  const response = await apiRequest<BackendCategory>("/v1/shopping-list/categories", {
    method: "POST",
    body: JSON.stringify({ name })
  });

  return mapCategory(response, 0);
}

export async function removeShoppingCategory(categoryId: string): Promise<ShoppingList> {
  const response = await apiRequest<BackendList>(`/v1/shopping-list/categories/${categoryId}`, {
    method: "DELETE"
  });
  return mapList(response);
}

export async function addShoppingItem(input: AddShoppingItemInput): Promise<ShoppingList> {
  const response = await apiRequest<BackendList>("/v1/shopping-list/items", {
    method: "POST",
    body: JSON.stringify(toItemPayload(input))
  });
  return mapList(response);
}

export async function setShoppingItemState(itemId: string, isDone: boolean): Promise<ShoppingList> {
  const response = await apiRequest<BackendList>(`/v1/shopping-list/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ isDone })
  });
  return mapList(response);
}

export async function removeShoppingItem(itemId: string): Promise<ShoppingList> {
  const response = await apiRequest<BackendList>(`/v1/shopping-list/items/${itemId}`, {
    method: "DELETE"
  });
  return mapList(response);
}

export async function addProductToShoppingList(
  product: ProductSummary,
  input?: { amount?: number; unit?: string; categoryName?: string }
): Promise<ShoppingList> {
  return addShoppingItem({
    productId: product.id,
    amount: input?.amount ?? 100,
    unit: input?.unit ?? "g",
    categoryName: input?.categoryName ?? "Products"
  });
}

export async function addRecipeToShoppingList(
  recipe: RecipeDetail,
  input?: { multiplier?: number; categoryName?: string }
): Promise<ShoppingList> {
  const multiplier = input?.multiplier ?? 1;
  let nextList: ShoppingList | null = null;

  for (const ingredient of recipe.ingredients) {
    nextList = await addShoppingItem({
      productId: ingredient.productId,
      customName: ingredient.productId ? undefined : ingredient.title,
      amount: ingredient.quantity * multiplier,
      unit: ingredient.unit,
      categoryName: input?.categoryName ?? recipe.title
    });
  }

  return nextList ?? getShoppingList();
}

export async function addMealPlanItemToShoppingList(
  item: MealPlanItem,
  options?: { categoryName?: string }
): Promise<ShoppingList> {
  if (item.type === "product") {
    return addShoppingItem({
      productId: item.refId ?? undefined,
      customName: item.refId ? undefined : item.title,
      amount: item.amount ?? 100,
      unit: item.unit ?? "g",
      categoryName: options?.categoryName ?? "Meal plan"
    });
  }

  return addShoppingItem({
    customName: item.title,
    amount: item.servings ?? 1,
    unit: "servings",
    categoryName: options?.categoryName ?? "Meal plan"
  });
}
