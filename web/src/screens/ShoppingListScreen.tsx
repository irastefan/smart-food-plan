import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { AddItemModal } from "@/components/AddItemModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  addItemsToShoppingList,
  clearShoppingList,
  loadShoppingList,
  removeShoppingItem,
  updateShoppingItem,
  type ShoppingList,
  type ShoppingListItem
} from "@/utils/vaultShopping";
import { loadUserSettings } from "@/utils/vaultUser";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./ShoppingListScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

export function ShoppingListScreen(): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const hasItems = (shoppingList?.items.length ?? 0) > 0;

  const groupedItems = useMemo(() => {
    if (!shoppingList?.items) return {};
    
    const groups: Record<string, ShoppingListItem[]> = {};
    
    shoppingList.items.forEach(item => {
      const categoryId = item.category || "uncategorized";
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(item);
    });
    
    return groups;
  }, [shoppingList?.items]);

  const getCategoryName = useCallback((categoryId: string) => {
    if (categoryId === "uncategorized") {
      return t("shopping.uncategorized");
    }
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  }, [categories, t]);

  const vaultLabel = useMemo(() => {
    if (!vaultHandle) {
      return t("shopping.vault.empty");
    }
    return t("shopping.vault.selected", { folder: vaultHandle.name });
  }, [t, vaultHandle]);

  const loadList = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setShoppingList(null);
        setCategories([]);
        return;
      }
      setIsLoading(true);
      try {
        const [list, settings] = await Promise.all([
          loadShoppingList(handle),
          loadUserSettings(handle)
        ]);
        setShoppingList(list);
        setCategories(settings.shopping.categories || []);
      } catch (error) {
        console.error("Failed to load shopping list", error);
        setStatus({ type: "error", message: t("shopping.status.loadError") });
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return;
    }

    let cancelled = false;

    const restoreHandle = async () => {
      try {
        const handle = await loadVaultDirectoryHandle();
        if (!handle) {
          return;
        }
        const hasAccess = await ensureDirectoryAccess(handle);
        if (!hasAccess) {
          await clearVaultDirectoryHandle();
          return;
        }
        if (!cancelled) {
          setVaultHandle(handle);
          void loadList(handle);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadList]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("shopping.status.browserUnsupported") });
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("shopping.status.permissionError") });
        return;
      }
      setVaultHandle(handle);
      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
      setStatus({ type: "success", message: t("shopping.status.connected", { folder: handle.name }) });
      void loadList(handle);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("shopping.status.genericError") });
    }
  }, [loadList, t]);

  const handleToggleItem = useCallback(
    async (item: ShoppingListItem, checked: boolean) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("shopping.status.noVault") });
        return;
      }
      setIsMutating(true);
      try {
        const list = await updateShoppingItem(vaultHandle, item.id, { completed: checked });
        setShoppingList(list);
      } catch (error) {
        console.error("Failed to update shopping item", error);
        setStatus({ type: "error", message: t("shopping.status.updateError") });
      } finally {
        setIsMutating(false);
      }
    },
    [t, vaultHandle]
  );

  const handleRemoveItem = useCallback(
    async (item: ShoppingListItem) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("shopping.status.noVault") });
        return;
      }
      setIsMutating(true);
      try {
        const list = await removeShoppingItem(vaultHandle, item.id);
        setShoppingList(list);
        setStatus({ type: "success", message: t("shopping.status.removed") });
      } catch (error) {
        console.error("Failed to remove shopping item", error);
        setStatus({ type: "error", message: t("shopping.status.updateError") });
      } finally {
        setIsMutating(false);
      }
    },
    [t, vaultHandle]
  );

  const handleClear = useCallback(async () => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("shopping.status.noVault") });
      return;
    }
    setIsMutating(true);
    try {
      const list = await clearShoppingList(vaultHandle);
      setShoppingList(list);
      setStatus({ type: "success", message: t("shopping.status.cleared") });
    } catch (error) {
      console.error("Failed to clear shopping list", error);
      setStatus({ type: "error", message: t("shopping.status.updateError") });
    } finally {
      setIsMutating(false);
    }
  }, [t, vaultHandle]);

  const handleAddItem = useCallback(async (itemData: Omit<ShoppingListItem, "id">) => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("shopping.status.noVault") });
      return;
    }
    setIsMutating(true);
    try {
      const list = await addItemsToShoppingList(vaultHandle, [
        {
          id: crypto.randomUUID(),
          ...itemData
        }
      ]);
      setShoppingList(list);
      setStatus({ type: "success", message: t("shopping.status.added") });
    } catch (error) {
      console.error("Failed to add shopping item", error);
      setStatus({ type: "error", message: t("shopping.status.updateError") });
    } finally {
      setIsMutating(false);
    }
  }, [t, vaultHandle]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t("shopping.title")}</h1>
          <p className={styles.subtitle}>
            {hasItems 
              ? t("shopping.itemCount", { count: String(shoppingList?.items.length || 0) })
              : t("shopping.subtitle")
            }
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outlined" onClick={handleSelectVault} disabled={isMutating}>
            {vaultHandle ? t("shopping.changeVault") : t("shopping.chooseVault")}
          </Button>
          <Button onClick={() => setShowAddModal(true)} disabled={!vaultHandle}>
            + {t("shopping.addItem")}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowClearModal(true)} 
            disabled={!vaultHandle || !hasItems || isMutating}
            className={styles.clearButton}
          >
            {t("shopping.clearAll")}
          </Button>
        </div>
      </header>

      {status && <div className={styles.statusMessage}>{status.message}</div>}
      {isLoading && <div className={styles.loadingState}>{t("shopping.status.loading")}</div>}

      {hasItems ? (
        <div className={styles.categoriesContainer}>
          {Object.entries(groupedItems).map(([categoryId, items]) => (
            <section key={categoryId} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                {getCategoryName(categoryId)}
                <span className={styles.categoryCount}>({items.length})</span>
              </h2>
              
              <div className={styles.itemsGrid}>
                {items.map((item) => (
                  <article key={item.id} className={`${styles.itemCard} ${item.completed ? styles.completed : ''}`}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemCheckbox}>
                        <Checkbox
                          id={`shopping-${item.id}`}
                          label=""
                          checked={Boolean(item.completed)}
                          onChange={(checked) => handleToggleItem(item, checked)}
                        />
                      </div>
                      <div className={styles.itemContent}>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                        <div className={styles.itemMeta}>
                          {item.quantity && (
                            <span className={styles.itemQuantity}>
                              {item.quantity} {item.unit || ""}
                            </span>
                          )}
                          {item.source?.recipeTitle && (
                            <span className={styles.itemSource}>
                              {t("shopping.item.fromRecipe", { title: item.source.recipeTitle })}
                            </span>
                          )}
                          {item.notes && (
                            <span className={styles.itemNotes}>{item.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveItem(item)} 
                      disabled={isMutating}
                      title={t("shopping.remove")}
                    >
                      ✕
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2 className={styles.emptyTitle}>{t("shopping.empty.title")}</h2>
          <p className={styles.emptyDescription}>{t("shopping.empty.hint")}</p>
          <Button onClick={() => setShowAddModal(true)} disabled={!vaultHandle}>
            {t("shopping.addFirstItem")}
          </Button>
        </div>
      )}

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        categories={categories}
        isLoading={isMutating}
      />

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClear}
        title={t("shopping.clearList.title")}
        message={t("shopping.clearList.message")}
        confirmText={t("shopping.clearList.confirm")}
        variant="danger"
        isLoading={isMutating}
      />
    </div>
  );
}
