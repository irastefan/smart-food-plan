import {
  buildMarkdownDocument,
  parseMarkdownDocument,
  upsertAutoBlock,
  type JsonValue
} from "@/utils/markdown";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";

const SHOPPING_DIRECTORY_NAME = "shopping";
const SHOPPING_FILE_NAME = "shopping-list.md";

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

type ShoppingFrontMatter = {
  updated_at: string;
  items: Array<{
    id: string;
    name: string;
    qty?: number | null;
    unit?: string | null;
    category?: string | null;
    notes?: string | null;
    checked: boolean;
    source?: ShoppingListItem["source"] | null;
  }>;
};

function ensureShoppingDirectory(vaultHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(SHOPPING_DIRECTORY_NAME, { create: true });
}

function createEmptyList(): ShoppingList {
  return {
    updatedAt: new Date().toISOString(),
    items: []
  };
}

function serializeShoppingList(list: ShoppingList): { frontMatter: Record<string, JsonValue>; body: string } {
  const frontMatter: ShoppingFrontMatter = {
    updated_at: list.updatedAt,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.title,
      qty: typeof item.quantity === "number" && Number.isFinite(item.quantity) ? Number.parseFloat(item.quantity.toFixed(2)) : null,
      unit: item.unit ?? null,
      category: item.category ?? null,
      notes: item.notes ?? null,
      checked: Boolean(item.completed),
      source: item.source ?? null
    }))
  };

  const serialized: Record<string, JsonValue> = {
    updated_at: frontMatter.updated_at,
    items: frontMatter.items.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty ?? null,
      unit: item.unit ?? null,
      category: item.category ?? null,
      notes: item.notes ?? null,
      checked: item.checked,
      source: item.source ?? null
    }))
  };

  const body = buildShoppingBody(list);

  return { frontMatter: serialized, body };
}

function buildShoppingBody(list: ShoppingList): string {
  const heading = "# Shopping List";
  const checklist = buildShoppingChecklist(list.items);
  return upsertAutoBlock(`${heading}\n`, "SHOPPING", checklist);
}

function buildShoppingChecklist(items: ShoppingListItem[]): string {
  if (items.length === 0) {
    return "_Пока пусто — добавьте ингредиенты из рецептов или вручную._";
  }

  return items
    .map((item) => {
      const checkbox = item.completed ? "[x]" : "[ ]";
      const quantity =
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? `${Number.parseFloat(item.quantity.toFixed(item.quantity % 1 === 0 ? 0 : 1))}${item.unit ? ` ${item.unit}` : ""}`
          : item.unit
          ? `(${item.unit})`
          : "";
      const category = item.category ? ` — ${item.category}` : "";
      return `- ${checkbox} ${item.title}${quantity ? ` (${quantity})` : ""}${category}`;
    })
    .join("  \n");
}

function parseShoppingList(data: Record<string, JsonValue>, body: string): ShoppingList {
  const updatedAt = typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString();
  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items: ShoppingListItem[] = [];
  for (const entry of itemsRaw) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    items.push({
      id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
      title: typeof record.name === "string" ? record.name : "Item",
      quantity:
        typeof record.qty === "number"
          ? Number.parseFloat(record.qty.toFixed(2))
          : typeof record.quantity === "number"
          ? Number.parseFloat(record.quantity.toFixed(2))
          : null,
      unit: typeof record.unit === "string" ? record.unit : null,
      category: typeof record.category === "string" ? record.category : null,
      notes: typeof record.notes === "string" ? record.notes : null,
      completed: Boolean(record.checked ?? record.completed),
      source: typeof record.source === "object" ? (record.source as ShoppingListItem["source"]) : undefined
    });
  }

  const list: ShoppingList = {
    updatedAt,
    items
  };

  // Preserve any manual notes outside auto-block
  const manualNotes = extractManualNotes(body);
  if (manualNotes && manualNotes.length > 0) {
    list.items = list.items.map((item) =>
      item.notes
        ? item
        : {
            ...item,
            notes: manualNotes
          }
    );
  }

  return list;
}

function extractManualNotes(body: string): string {
  const startToken = "<!-- AUTO:SHOPPING START -->";
  const endToken = "<!-- AUTO:SHOPPING END -->";
  let manualPart = body;

  const startIndex = manualPart.indexOf(startToken);
  const endIndex = manualPart.indexOf(endToken);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = manualPart.slice(0, startIndex);
    const after = manualPart.slice(endIndex + endToken.length);
    manualPart = `${before}\n${after}`;
  }

  const cleaned = manualPart
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .join(" ")
    .trim();

  return cleaned;
}

async function writeShoppingListToHandle(fileHandle: FileSystemFileHandle, list: ShoppingList): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  const { frontMatter, body } = serializeShoppingList(list);
  const content = buildMarkdownDocument(frontMatter, body);
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function readShoppingListFromHandle(fileHandle: FileSystemFileHandle): Promise<ShoppingList> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  const { data, body } = parseMarkdownDocument(text);
  return parseShoppingList(data, body);
}

async function getListFileHandle(
  vaultHandle: FileSystemDirectoryHandle,
  options: { create: boolean }
): Promise<FileSystemFileHandle> {
  const directory = await ensureShoppingDirectory(vaultHandle);
  return directory.getFileHandle(SHOPPING_FILE_NAME, { create: options.create });
}

export async function loadShoppingList(vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  await ensureDirectoryAccess(vaultHandle);
  const directory = await ensureShoppingDirectory(vaultHandle);
  let fileHandle: FileSystemFileHandle;
  try {
    fileHandle = await directory.getFileHandle(SHOPPING_FILE_NAME, { create: false });
  } catch (error) {
    if ((error as DOMException)?.name !== "NotFoundError") {
      throw error;
    }
    fileHandle = await directory.getFileHandle(SHOPPING_FILE_NAME, { create: true });
    const emptyList = createEmptyList();
    await writeShoppingListToHandle(fileHandle, emptyList);
    return emptyList;
  }

  return readShoppingListFromHandle(fileHandle);
}

function mergeItems(existing: ShoppingListItem[], incoming: ShoppingListItem[]): ShoppingListItem[] {
  const map = new Map<string, ShoppingListItem>();
  const keyOf = (item: ShoppingListItem) =>
    `${item.title.trim().toLowerCase()}__${item.unit?.trim().toLowerCase() ?? ""}`;

  for (const item of existing) {
    map.set(keyOf(item), { ...item });
  }

  for (const item of incoming) {
    const key = keyOf(item);
    const current = map.get(key);
    if (current) {
      const nextQuantity =
        (typeof current.quantity === "number" ? current.quantity : 0) +
        (typeof item.quantity === "number" ? item.quantity : 0);
      map.set(key, {
        ...current,
        quantity: Number.isFinite(nextQuantity) && nextQuantity > 0 ? Number.parseFloat(nextQuantity.toFixed(2)) : current.quantity,
        completed: false
      });
    } else {
      map.set(key, { ...item, completed: false });
    }
  }

  return Array.from(map.values());
}

export async function addItemsToShoppingList(
  vaultHandle: FileSystemDirectoryHandle,
  items: ShoppingListItem[]
): Promise<ShoppingList> {
  if (items.length === 0) {
    return loadShoppingList(vaultHandle);
  }

  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingListFromHandle(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list, recreating", error);
    list = createEmptyList();
  }

  list.items = mergeItems(list.items, items);
  list.updatedAt = new Date().toISOString();
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}

async function toggleShoppingListItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingListFromHandle(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list while toggling, recreating", error);
    list = createEmptyList();
  }

  list.items = list.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return { ...item, completed: !item.completed };
  });
  list.updatedAt = new Date().toISOString();
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}

export async function clearCompletedShoppingItems(
  vaultHandle: FileSystemDirectoryHandle
): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingListFromHandle(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list while clearing completed, recreating", error);
    list = createEmptyList();
  }

  list.items = list.items.filter((item) => !item.completed);
  list.updatedAt = new Date().toISOString();
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}

export async function updateShoppingItem(
  vaultHandle: FileSystemDirectoryHandle,
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
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingListFromHandle(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list while updating item, recreating", error);
    list = createEmptyList();
  }

  list.items = list.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return {
      ...item,
      title: updates.title?.trim() ?? item.title,
      quantity:
        typeof updates.quantity === "number" && Number.isFinite(updates.quantity)
          ? Number.parseFloat(updates.quantity.toFixed(2))
          : updates.quantity === null
          ? null
          : item.quantity,
      unit: updates.unit !== undefined ? updates.unit : item.unit,
      category: updates.category !== undefined ? updates.category : item.category,
      notes: updates.notes !== undefined ? updates.notes : item.notes,
      completed: updates.completed ?? item.completed
    };
  });
  list.updatedAt = new Date().toISOString();
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}

export async function removeShoppingItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingListFromHandle(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list while removing item, recreating", error);
    list = createEmptyList();
  }

  list.items = list.items.filter((item) => item.id !== itemId);
  list.updatedAt = new Date().toISOString();
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}

export async function clearShoppingList(vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  const list: ShoppingList = {
    updatedAt: new Date().toISOString(),
    items: []
  };
  await writeShoppingListToHandle(fileHandle, list);
  return list;
}
