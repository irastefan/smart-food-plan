import {
  buildMarkdownDocument,
  parseMarkdownDocument,
  upsertAutoBlock,
  type JsonValue
} from "@/utils/markdown";
import { messages, type Language, type TranslationKey } from "@/i18n/messages";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { loadUserSettings, type UserSettings } from "@/utils/vaultUser";

const SHOPPING_DIRECTORY_NAME = "shopping";
const SHOPPING_FILE_NAME = "shopping-list.md";

type ShoppingCategory = UserSettings["shopping"]["categories"][number];

type ShoppingSerializeContext = {
  categories: ShoppingCategory[];
  language: Language;
  sortUnpurchasedFirst: boolean;
};

type TranslationValues = Record<string, string>;

const FALLBACK_LANGUAGE: Language = "en";

function formatTemplate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }
  return Object.keys(values).reduce((result, key) => {
    const pattern = new RegExp(`{{${key}}}`, "g");
    return result.replace(pattern, values[key]);
  }, template);
}

function translate(language: Language, key: TranslationKey, values?: TranslationValues): string {
  const table = messages[language] ?? messages[FALLBACK_LANGUAGE];
  const fallbackTable = messages[FALLBACK_LANGUAGE];
  const template = table[key] ?? fallbackTable[key] ?? key;
  return formatTemplate(template, values);
}

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
    category_name?: string | null;
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

async function loadShoppingContext(
  vaultHandle: FileSystemDirectoryHandle
): Promise<ShoppingSerializeContext> {
  const settings = await loadUserSettings(vaultHandle);
  return {
    categories: settings.shopping.categories ?? [],
    sortUnpurchasedFirst: Boolean(settings.shopping.sortUnpurchasedFirst),
    language: (settings.ui.language as Language) ?? FALLBACK_LANGUAGE
  };
}

function serializeShoppingList(
  list: ShoppingList,
  context: ShoppingSerializeContext
): { frontMatter: Record<string, JsonValue>; body: string } {
  const frontMatter: ShoppingFrontMatter = {
    updated_at: list.updatedAt,
    items: list.items.map((item) => {
      const qty =
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? Number.parseFloat(item.quantity.toFixed(2))
          : null;
      const categoryId = item.category ?? null;
      const categoryName = resolveCategoryName(categoryId, context);
      return {
        id: item.id,
        name: item.title,
        qty,
        unit: item.unit ?? null,
        category: categoryId,
        category_name: categoryName,
        notes: item.notes ?? null,
        checked: Boolean(item.completed),
        source: item.source ?? null
      };
    })
  };

  const serialized: Record<string, JsonValue> = {
    updated_at: frontMatter.updated_at,
    items: frontMatter.items.map((item) => ({
      id: item.id,
      name: item.name,
      qty: item.qty ?? null,
      unit: item.unit ?? null,
      category: item.category ?? null,
      category_name: item.category_name ?? null,
      notes: item.notes ?? null,
      checked: item.checked,
      source: item.source ?? null
    }))
  };

  const body = buildShoppingBody(list, context);

  return { frontMatter: serialized, body };
}

function buildShoppingBody(list: ShoppingList, context: ShoppingSerializeContext): string {
  const heading = `# ${translate(context.language, "shopping.title")}`;
  const sections = buildShoppingSections(list.items, context);
  return upsertAutoBlock(`${heading}\n\n`, "SHOPPING", sections);
}

function buildShoppingSections(items: ShoppingListItem[], context: ShoppingSerializeContext): string {
  if (items.length === 0) {
    return translate(context.language, "shopping.markdown.empty");
  }

  const groups = groupItemsByCategory(items);
  const orderedIds = orderCategoryIds(groups, context);
  const sections: string[] = [];

  for (const categoryId of orderedIds) {
    const categoryItems = groups.get(categoryId);
    if (!categoryItems || categoryItems.length === 0) {
      continue;
    }
    const categoryName = resolveCategoryName(categoryId, context);
    const sectionTitle = translate(context.language, "shopping.markdown.section", {
      name: categoryName,
      count: String(categoryItems.length)
    });
    const renderedItems = renderItems(categoryItems, context);
    sections.push(`## ${sectionTitle}\n\n${renderedItems}`);
  }

  return sections.join("\n\n").trim();
}

function groupItemsByCategory(items: ShoppingListItem[]): Map<string, ShoppingListItem[]> {
  const groups = new Map<string, ShoppingListItem[]>();
  for (const item of items) {
    const categoryId = normalizeCategoryId(item.category);
    if (!groups.has(categoryId)) {
      groups.set(categoryId, []);
    }
    groups.get(categoryId)!.push(item);
  }
  return groups;
}

function normalizeCategoryId(raw: string | null | undefined): string {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed.length > 0 ? trimmed : "uncategorized";
}

function orderCategoryIds(
  groups: Map<string, ShoppingListItem[]>,
  context: ShoppingSerializeContext
): string[] {
  const groupIds = Array.from(groups.keys());
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const category of context.categories) {
    if (groups.has(category.id)) {
      ordered.push(category.id);
      seen.add(category.id);
    }
  }

  const extras = groupIds.filter((id) => id !== "uncategorized" && !seen.has(id));
  const locale = context.language === "ru" ? "ru" : "en";
  extras.sort((a, b) =>
    resolveCategoryName(a, context).localeCompare(resolveCategoryName(b, context), locale, {
      sensitivity: "base"
    })
  );
  ordered.push(...extras);

  if (groups.has("uncategorized")) {
    ordered.push("uncategorized");
  }

  return ordered;
}

function resolveCategoryName(
  categoryId: string | null,
  context: ShoppingSerializeContext
): string {
  const normalized = normalizeCategoryId(categoryId);
  if (normalized === "uncategorized") {
    return translate(context.language, "shopping.uncategorized");
  }
  const match = context.categories.find((category) => category.id === normalized);
  if (match) {
    if (match.builtin) {
      const key = `shopping.category.${match.id}` as TranslationKey;
      const translated = translate(context.language, key);
      if (translated && translated !== key) {
        return translated;
      }
    }
    if (match.name && match.name.trim().length > 0) {
      return match.name;
    }
  }
  return normalized;
}

function renderItems(items: ShoppingListItem[], context: ShoppingSerializeContext): string {
  const sorted = sortItemsForCategory(items, context.sortUnpurchasedFirst);
  return sorted.map((item) => renderItem(item, context)).join("\n");
}

function sortItemsForCategory(
  items: ShoppingListItem[],
  sortUnpurchasedFirst: boolean
): ShoppingListItem[] {
  if (!sortUnpurchasedFirst) {
    return [...items];
  }
  return [...items].sort((a, b) => {
    const left = Number(Boolean(a.completed));
    const right = Number(Boolean(b.completed));
    if (left === right) {
      return 0;
    }
    return left - right;
  });
}

function formatQuantity(item: ShoppingListItem): string | null {
  if (typeof item.quantity === "number" && Number.isFinite(item.quantity)) {
    const precision = item.quantity % 1 === 0 ? 0 : 2;
    const value = Number.parseFloat(item.quantity.toFixed(precision));
    const unitPart = item.unit ? ` ${item.unit}` : "";
    return `${value}${unitPart}`.trim();
  }
  if (item.unit) {
    return item.unit.trim();
  }
  return null;
}

function renderItem(item: ShoppingListItem, context: ShoppingSerializeContext): string {
  const checkbox = item.completed ? "[x]" : "[ ]";
  const title = item.title?.trim() || "Item";
  const quantity = formatQuantity(item);
  let line = `- ${checkbox} ${title}`;
  if (quantity) {
    line += ` — ${quantity}`;
  }

  const details: string[] = [];
  if (item.notes) {
    const cleanedNotes = item.notes.replace(/\r?\n/g, " ").trim();
    if (cleanedNotes.length > 0) {
      details.push(`${translate(context.language, "shopping.addItem.notes")}: ${cleanedNotes}`);
    }
  }
  if (item.source?.recipeTitle) {
    details.push(
      translate(context.language, "shopping.item.fromRecipe", {
        title: item.source.recipeTitle
      })
    );
  } else if (item.source?.productTitle) {
    details.push(
      translate(context.language, "shopping.item.fromProduct", {
        title: item.source.productTitle
      })
    );
  }

  if (details.length === 0) {
    return line;
  }

  return `${line}\n${details.map((detail) => `  - ${detail}`).join("\n")}`;
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

async function writeShoppingListToHandle(
  fileHandle: FileSystemFileHandle,
  list: ShoppingList,
  context: ShoppingSerializeContext
): Promise<void> {
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  const { frontMatter, body } = serializeShoppingList(list, context);
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
    const context = await loadShoppingContext(vaultHandle);
    await writeShoppingListToHandle(fileHandle, emptyList, context);
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

  const contextPromise = loadShoppingContext(vaultHandle);
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
  const context = await contextPromise;
  await writeShoppingListToHandle(fileHandle, list, context);
  return list;
}

async function toggleShoppingListItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  const contextPromise = loadShoppingContext(vaultHandle);
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
  const context = await contextPromise;
  await writeShoppingListToHandle(fileHandle, list, context);
  return list;
}

export async function clearCompletedShoppingItems(
  vaultHandle: FileSystemDirectoryHandle
): Promise<ShoppingList> {
  const contextPromise = loadShoppingContext(vaultHandle);
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
  const context = await contextPromise;
  await writeShoppingListToHandle(fileHandle, list, context);
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
  const contextPromise = loadShoppingContext(vaultHandle);
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
  const context = await contextPromise;
  await writeShoppingListToHandle(fileHandle, list, context);
  return list;
}

export async function removeShoppingItem(
  vaultHandle: FileSystemDirectoryHandle,
  itemId: string
): Promise<ShoppingList> {
  const contextPromise = loadShoppingContext(vaultHandle);
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
  const context = await contextPromise;
  await writeShoppingListToHandle(fileHandle, list, context);
  return list;
}

export async function clearShoppingList(vaultHandle: FileSystemDirectoryHandle): Promise<ShoppingList> {
  const context = await loadShoppingContext(vaultHandle);
  const fileHandle = await getListFileHandle(vaultHandle, { create: true });
  const list: ShoppingList = {
    updatedAt: new Date().toISOString(),
    items: []
  };
  await writeShoppingListToHandle(fileHandle, list, context);
  return list;
}
