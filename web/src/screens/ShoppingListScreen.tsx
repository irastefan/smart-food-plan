import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
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

  const hasItems = (shoppingList?.items.length ?? 0) > 0;

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
        return;
      }
      setIsLoading(true);
      try {
        const list = await loadShoppingList(handle);
        setShoppingList(list);
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

  const handleAddCustom = useCallback(async () => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("shopping.status.noVault") });
      return;
    }
    const title = window.prompt(t("shopping.prompt.title"));
    if (!title || !title.trim()) {
      return;
    }
    const quantityRaw = window.prompt(t("shopping.prompt.quantity"));
    const quantity = quantityRaw ? Number.parseFloat(quantityRaw.replace(",", ".")) : null;
    const unit = window.prompt(t("shopping.prompt.unit"));

    setIsMutating(true);
    try {
      const list = await addItemsToShoppingList(vaultHandle, [
        {
          id: crypto.randomUUID(),
          title: title.trim(),
          quantity: Number.isFinite(quantity) ? quantity ?? null : null,
          unit: unit?.trim() || null,
          completed: false,
          source: { kind: "custom" }
        }
      ]);
      setShoppingList(list);
      setStatus({ type: "success", message: t("shopping.status.added") });
    } catch (error) {
      console.error("Failed to add custom shopping item", error);
      setStatus({ type: "error", message: t("shopping.status.updateError") });
    } finally {
      setIsMutating(false);
    }
  }, [t, vaultHandle]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("shopping.title")}</h1>
          <p className={styles.subtitle}>{t("shopping.subtitle")}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outlined" onClick={handleSelectVault} disabled={isMutating}>
            {t("shopping.changeVault")}
          </Button>
          <Button variant="ghost" onClick={handleAddCustom} disabled={isMutating || !vaultHandle}>
            {t("shopping.addCustom")}
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={!vaultHandle || !hasItems || isMutating}>
            {t("shopping.clearAll")}
          </Button>
        </div>
      </header>

      <section className={styles.vaultInfo}>
        <span className={styles.vaultLabel}>{vaultLabel}</span>
        <span className={styles.vaultHint}>{t("shopping.vault.hint")}</span>
      </section>

      {status && <div className={styles.statusMessage}>{status.message}</div>}
      {isLoading && <div className={styles.statusMessage}>{t("shopping.status.loading")}</div>}

      <section className={styles.listCard}>
        {hasItems ? (
          shoppingList?.items.map((item) => (
            <article key={item.id} className={styles.listItem}>
              <div className={styles.itemMain}>
                <Checkbox
                  id={`shopping-${item.id}`}
                  label={item.title}
                  checked={Boolean(item.completed)}
                  onChange={(checked) => handleToggleItem(item, checked)}
                />
                <div className={styles.itemMeta}>
                  {item.quantity ? (
                    <span>
                      {item.quantity} {item.unit ?? ""}
                    </span>
                  ) : null}
                  {item.source?.recipeTitle ? (
                    <span className={styles.itemSource}>
                      {t("shopping.item.fromRecipe", { title: item.source.recipeTitle })}
                    </span>
                  ) : null}
                </div>
              </div>
              <Button variant="ghost" onClick={() => handleRemoveItem(item)} disabled={isMutating}>
                {t("shopping.remove")}
              </Button>
            </article>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h2>{t("shopping.empty.title")}</h2>
            <p>{t("shopping.empty.hint")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
