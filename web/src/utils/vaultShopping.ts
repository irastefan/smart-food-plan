import { ensureDirectoryAccess } from "@/utils/vaultProducts";

const SHOPPING_DIRECTORY_NAME = "shopping";
const SHOPPING_FILE_NAME = "shopping-list.md";

export type ShoppingListItem = {
  id: string;
  title: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
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

type FrontMatterParseResult = {
  meta: Record<string, string>;
  body: string;
};

function parseFrontMatter(source: string): FrontMatterParseResult {
  const lines = source.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return { meta: {}, body: source.trim() };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { meta: {}, body: source.trim() };
  }

  const metaLines = lines.slice(1, endIndex);
  const meta: Record<string, string> = {};
  for (const line of metaLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const [key, ...rest] = trimmed.split(":");
    if (!key) {
      continue;
    }
    meta[key.trim()] = rest.join(":").trim().replace(/^"|"$/g, "");
  }

  const body = lines.slice(endIndex + 1).join("\n").trim();
  return { meta, body };
}

function buildFrontMatter(updatedAt: string): string {
  return `---\nupdated_at: "${updatedAt}"\n---`;
}

async function ensureShoppingDirectory(vaultHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  return vaultHandle.getDirectoryHandle(SHOPPING_DIRECTORY_NAME, { create: true });
}

function createEmptyList(): ShoppingList {
  return {
    updatedAt: new Date().toISOString(),
    items: []
  };
}

async function writeShoppingList(fileHandle: FileSystemFileHandle, list: ShoppingList): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  const frontMatter = buildFrontMatter(list.updatedAt);
  const body = `${JSON.stringify({ items: list.items, updatedAt: list.updatedAt }, null, 2)}\n`;
  const content = `${frontMatter}\n${body}`;
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function readShoppingList(fileHandle: FileSystemFileHandle): Promise<ShoppingList> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  const { meta, body } = parseFrontMatter(text);
  let json: Partial<ShoppingList> = {};
  if (body) {
    try {
      json = JSON.parse(body) as Partial<ShoppingList>;
    } catch (error) {
      console.warn("Failed to parse shopping list body", error);
      json = {};
    }
  }

  const updatedAt = meta.updated_at ?? json.updatedAt ?? new Date().toISOString();
  const list: ShoppingList = {
    updatedAt,
    items: Array.isArray(json.items)
      ? json.items.map((item) => ({
          id: item.id ?? crypto.randomUUID(),
          title: item.title ?? "Item",
          quantity: typeof item.quantity === "number" ? item.quantity : item.quantity ?? null,
          unit: item.unit ?? null,
          notes: item.notes ?? null,
          completed: Boolean(item.completed),
          source: item.source
        }))
      : []
  };

  return list;
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
        quantity: Number.isFinite(nextQuantity) && nextQuantity > 0 ? nextQuantity : current.quantity,
        completed: false
      });
    } else {
      map.set(key, { ...item, completed: false });
    }
  }

  return Array.from(map.values());
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
    await writeShoppingList(fileHandle, emptyList);
    return emptyList;
  }

  return readShoppingList(fileHandle);
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
    list = await readShoppingList(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list, recreating", error);
    list = createEmptyList();
  }

  const merged = mergeItems(list.items, items);
  const next: ShoppingList = { updatedAt: new Date().toISOString(), items: merged };
  await writeShoppingList(fileHandle, next);
  return next;
}

export async function updateShoppingItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string,
  updates: Partial<Pick<ShoppingListItem, "completed" | "quantity" | "unit" | "notes">>
): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingList(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list for update, recreating", error);
    list = createEmptyList();
  }

  const items = list.items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    return { ...item, ...updates };
  });

  const next: ShoppingList = { updatedAt: new Date().toISOString(), items };
  await writeShoppingList(fileHandle, next);
  return next;
}

export async function removeShoppingItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  let list: ShoppingList;
  try {
    list = await readShoppingList(fileHandle);
  } catch (error) {
    console.error("Failed to read shopping list for removal, recreating", error);
    list = createEmptyList();
  }

  const items = list.items.filter((item) => item.id !== itemId);
  const next: ShoppingList = { updatedAt: new Date().toISOString(), items };
  await writeShoppingList(fileHandle, next);
  return next;
}

export async function clearShoppingList(vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  const next = createEmptyList();
  await writeShoppingList(fileHandle, next);
  return next;
}
