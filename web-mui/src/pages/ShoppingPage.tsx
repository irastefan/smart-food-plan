import { Alert, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import {
  addShoppingCategory,
  addShoppingItem,
  getShoppingList,
  removeShoppingCategory,
  removeShoppingItem,
  setShoppingItemState,
  type ShoppingItem,
  type ShoppingList
} from "../features/shopping/api/shoppingApi";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { FilterChipRow } from "../shared/ui/FilterChipRow";
import { FloatingActionMenu } from "../shared/ui/FloatingActionMenu";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ShoppingAddDialog } from "../widgets/shopping/ShoppingAddDialog";
import { ShoppingCategoryDialog } from "../widgets/shopping/ShoppingCategoryDialog";
import { ShoppingCategorySection } from "../widgets/shopping/ShoppingCategorySection";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function ShoppingPage() {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "item"; item: ShoppingItem }
    | { type: "category"; categoryId: string; categoryName: string }
    | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        const [list, productList] = await Promise.all([getShoppingList(), getProducts()]);
        if (!cancelled) {
          setShoppingList(list);
          setProducts(productList);
        }
      } catch (error) {
        console.error("Failed to load shopping list", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t("shopping.status.loadError") });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    (shoppingList?.categories ?? []).forEach((category) => names.add(category.name));
    (shoppingList?.items ?? []).forEach((item) => names.add(item.categoryName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [shoppingList]);

  const shoppingCategories = shoppingList?.categories ?? [];
  const categoryByName = useMemo(
    () => new Map(shoppingCategories.map((category) => [category.name, category])),
    [shoppingCategories]
  );

  const groupedItems = useMemo(() => {
    const items = shoppingList?.items ?? [];
    const source = filter === "all" ? items : items.filter((item) => item.categoryName === filter);
    const map = new Map<string, ShoppingItem[]>();

    source.forEach((item) => {
      const key = item.categoryName || "Other";
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    });

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filter, shoppingList]);

  async function handleToggleDone(item: ShoppingItem) {
    try {
      setIsMutating(true);
      setStatus(null);
      const nextList = await setShoppingItemState(item.id, !item.isDone);
      setShoppingList(nextList);
    } catch (error) {
      console.error("Failed to toggle shopping item", error);
      setStatus({ type: "error", message: t("shopping.status.toggleError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteItem(item: ShoppingItem) {
    try {
      setIsMutating(true);
      setStatus(null);
      const nextList = await removeShoppingItem(item.id);
      setShoppingList(nextList);
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to remove shopping item", error);
      setStatus({ type: "error", message: t("shopping.status.deleteError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAdd(payload: {
    mode: "product" | "custom";
    product?: ProductSummary;
    customName?: string;
    amount?: number;
    unit?: string;
    categoryName?: string;
    note?: string;
  }) {
    try {
      setIsMutating(true);
      setStatus(null);
      const nextList = await addShoppingItem({
        productId: payload.mode === "product" ? payload.product?.id : undefined,
        customName: payload.mode === "custom" ? payload.customName : undefined,
        amount: payload.amount,
        unit: payload.unit,
        categoryName: payload.categoryName,
        note: payload.note
      });
      setShoppingList(nextList);
      setDialogOpen(false);
      setStatus({ type: "success", message: t("shopping.status.added") });
    } catch (error) {
      console.error("Failed to add shopping item", error);
      setStatus({ type: "error", message: t("shopping.status.addError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAddCategory(name: string) {
    try {
      setIsMutating(true);
      setStatus(null);
      await addShoppingCategory(name);
      const nextList = await getShoppingList();
      setShoppingList(nextList);
      setCategoryDialogOpen(false);
      setStatus({ type: "success", message: t("shopping.status.categoryAdded") });
    } catch (error) {
      console.error("Failed to add shopping category", error);
      setStatus({ type: "error", message: t("shopping.status.categoryAddError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteCategory(categoryId: string, categoryName: string) {
    try {
      setIsMutating(true);
      setStatus(null);
      await removeShoppingCategory(categoryId);
      const nextList = await getShoppingList();
      setShoppingList(nextList);
      if (filter === categoryName) {
        setFilter("all");
      }
      setStatus({ type: "success", message: t("shopping.status.categoryDeleted") });
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to delete shopping category", error);
      setStatus({ type: "error", message: t("shopping.status.categoryDeleteError") });
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: { xs: 11, md: 9 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("shopping.title")} subtitle={t("shopping.subtitle")} />

      <FilterChipRow
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: t("shopping.filters.all") },
          ...categoryNames.map((category) => ({
            value: category,
            label: category,
            onDelete: categoryByName.get(category)
              ? () => setPendingDelete({ type: "category", categoryId: categoryByName.get(category)!.id, categoryName: category })
              : undefined
          }))
        ]}
        addLabel={t("shopping.addCategory")}
        onAdd={() => setCategoryDialogOpen(true)}
      />

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : groupedItems.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
            {t("shopping.emptyTitle")}
          </Typography>
          <Typography color="text.secondary">{t("shopping.empty")}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {groupedItems.map(([categoryName, items]) => (
            <ShoppingCategorySection
              key={categoryName}
              title={categoryName}
              items={items}
              doneLabel={t("shopping.done")}
              onDeleteCategory={
                categoryByName.get(categoryName)
                  ? () => setPendingDelete({ type: "category", categoryId: categoryByName.get(categoryName)!.id, categoryName })
                  : undefined
              }
              onToggleDone={handleToggleDone}
              onDelete={(item) => setPendingDelete({ type: "item", item })}
            />
          ))}
        </Stack>
      )}

      <ShoppingAddDialog
        open={dialogOpen}
        products={products}
        categories={categoryNames}
        isSubmitting={isMutating}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
      />
      <ShoppingCategoryDialog
        open={categoryDialogOpen}
        isSubmitting={isMutating}
        onClose={() => setCategoryDialogOpen(false)}
        onSubmit={handleAddCategory}
      />
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === "category" ? t("shopping.deleteCategory") : t("shopping.deleteItem")}
        message={
          pendingDelete?.type === "category"
            ? t("shopping.confirmDeleteCategory", { name: pendingDelete.categoryName })
            : t("shopping.confirmDeleteItem", { name: pendingDelete?.item.title ?? "" })
        }
        isSubmitting={isMutating}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete?.type === "category") {
            void handleDeleteCategory(pendingDelete.categoryId, pendingDelete.categoryName);
          } else if (pendingDelete?.type === "item") {
            void handleDeleteItem(pendingDelete.item);
          }
        }}
      />

      <FloatingActionMenu
        tooltip={t("shopping.add")}
        onClick={() => setDialogOpen(true)}
      />
    </Stack>
  );
}
