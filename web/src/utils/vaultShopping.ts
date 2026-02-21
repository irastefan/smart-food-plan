import { apiRequest } from "@/utils/apiClient";

export type ShoppingListItem = {
  id: string;
  title: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  category?: string | null;
  completed?: boolean;
  source?: {
    kind: "recipe" | "product" | "custom";
    recipeSlug?: string;
    recipeTitle?: string;
    ingredientId?: string;
    productSlug?: string;
    productTitle?: string;
  };
};

export type ShoppingList = {
  updatedAt: string;
  items: ShoppingListItem[];
};

type BackendShoppingItem = {
  id: string;
  name?: string;
  title?: string;
  customName?: string;
  amount?: number;
  qty?: number;
  unit?: string;
  note?: string;
  notes?: string;
  isDone?: boolean;
  completed?: boolean;
  categoryId?: string;
  category?: string;
  categoryName?: string;
  productId?: string;
  product?: {
    id?: string;
    name?: string;
  };
};

type BackendShoppingList = {
  id?: string;
  title?: string;
  categories?: Array<{ id: string; name: string }>;
  items?: BackendShoppingItem[];
  updatedAt?: string;
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

function mapItem(item: BackendShoppingItem): ShoppingListItem {
  return {
    id: item.id,
    title: item.name ?? item.title ?? item.customName ?? item.product?.name ?? "Item",
    quantity: toNumber(item.amount ?? item.qty),
    unit: item.unit ?? null,
    notes: item.note ?? item.notes ?? null,
    category: item.categoryId ?? item.category ?? item.categoryName ?? null,
    completed: Boolean(item.isDone ?? item.completed),
    source: item.productId
      ? {
          kind: "product",
          productSlug: item.product?.name,
          productTitle: item.product?.name
        }
      : { kind: "custom" }
  };
}

function mapList(payload: BackendShoppingList): ShoppingList {
  return {
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    items: (payload.items ?? []).map(mapItem)
  };
}

export async function loadShoppingList(_vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  const payload = await apiRequest<BackendShoppingList>("/v1/shopping-list");
  return mapList(payload);
}

export async function addItemsToShoppingList(
  _vaultHandle: FileSystemDirectoryHandle,
  items: ShoppingListItem[]
): Promise<ShoppingList> {
  if (items.length === 0) {
    return loadShoppingList({} as FileSystemDirectoryHandle);
  }

  for (const item of items) {
    const body: Record<string, unknown> = {
      amount: item.quantity ?? undefined,
      unit: item.unit ?? undefined,
      note: item.notes ?? undefined,
      categoryId: item.category ?? undefined
    };

    if (item.source?.kind === "product" && item.source.productSlug) {
      body.productId = item.source.productSlug;
    } else {
      body.customName = item.title;
    }

    await apiRequest("/v1/shopping-list/items", {
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  return loadShoppingList({} as FileSystemDirectoryHandle);
}

export async function clearCompletedShoppingItems(
  _vaultHandle: FileSystemDirectoryHandle
): Promise<ShoppingList> {
  const list = await loadShoppingList({} as FileSystemDirectoryHandle);
  const completed = list.items.filter((item) => item.completed);
  for (const item of completed) {
    await apiRequest(`/v1/shopping-list/items/${item.id}`, { method: "DELETE" });
  }
  return loadShoppingList({} as FileSystemDirectoryHandle);
}

export async function updateShoppingItem(
  _vaultHandle: FileSystemDirectoryHandle,
  itemId: string,
  updates: {
    title?: string;
    quantity?: number | null;
    unit?: string | null;
    category?: string | null;
    notes?: string | null;
    completed?: boolean;
  }
): Promise<ShoppingList> {
  if (typeof updates.completed === "boolean") {
    await apiRequest(`/v1/shopping-list/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ isDone: updates.completed })
    });
    return loadShoppingList({} as FileSystemDirectoryHandle);
  }

  if (updates.title || updates.quantity !== undefined || updates.unit !== undefined || updates.notes !== undefined || updates.category !== undefined) {
    await apiRequest(`/v1/shopping-list/items/${itemId}`, { method: "DELETE" });
    await apiRequest("/v1/shopping-list/items", {
      method: "POST",
      body: JSON.stringify({
        customName: updates.title ?? "Item",
        amount: updates.quantity,
        unit: updates.unit,
        note: updates.notes,
        categoryId: updates.category
      })
    });
  }

  return loadShoppingList({} as FileSystemDirectoryHandle);
}

export async function removeShoppingItem(
  _vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  await apiRequest(`/v1/shopping-list/items/${itemId}`, { method: "DELETE" });
  return loadShoppingList({} as FileSystemDirectoryHandle);
}

export async function clearShoppingList(_vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  const list = await loadShoppingList({} as FileSystemDirectoryHandle);
  for (const item of list.items) {
    await apiRequest(`/v1/shopping-list/items/${item.id}`, { method: "DELETE" });
  }
  return loadShoppingList({} as FileSystemDirectoryHandle);
}
