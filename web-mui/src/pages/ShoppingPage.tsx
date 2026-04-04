import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, Box, CircularProgress, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { AppFeedbackToast } from "../shared/ui/AppFeedbackToast";
import { FilterChipRow } from "../shared/ui/FilterChipRow";
import { PageActionButton } from "../shared/ui/PageActionButton";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ShoppingAddDialog } from "../widgets/shopping/ShoppingAddDialog";
import { ShoppingAssistantDialog } from "../widgets/shopping/ShoppingAssistantDialog";
import { ShoppingCategoryDialog } from "../widgets/shopping/ShoppingCategoryDialog";
import { ShoppingCategorySection } from "../widgets/shopping/ShoppingCategorySection";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageAgentAction: (action: (() => void) | null) => void;
  clearPageAgentAction: () => void;
  registerPageAgentOpen: (value: boolean) => void;
  clearPageAgentOpen: () => void;
  registerPageAddAction: (action: (() => void) | null) => void;
  clearPageAddAction: () => void;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function ShoppingPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageAgentAction, clearPageAgentAction, registerPageAgentOpen, clearPageAgentOpen, registerPageAddAction, clearPageAddAction, registerPageLoading, clearPageLoading } =
    useOutletContext<LayoutContext>();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [pendingItemStateId, setPendingItemStateId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "item"; item: ShoppingItem }
    | { type: "category"; categoryId: string; categoryName: string }
    | null
  >(null);

  const loadShoppingData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [list, productList] = await Promise.all([getShoppingList(), getProducts()]);
      setShoppingList(list);
      setProducts(productList);
    } catch (error) {
      console.error("Failed to load shopping list", error);
      setLoadError(t("shopping.status.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    registerPageAgentAction(() => setAssistantOpen((current) => !current));
    return () => {
      clearPageAgentAction();
    };
  }, [clearPageAgentAction, registerPageAgentAction]);

  useEffect(() => {
    registerPageAgentOpen(assistantOpen);
    return () => {
      clearPageAgentOpen();
    };
  }, [assistantOpen, clearPageAgentOpen, registerPageAgentOpen]);

  useEffect(() => {
    registerPageAddAction(() => setDialogOpen(true));
    return () => {
      clearPageAddAction();
    };
  }, [clearPageAddAction, registerPageAddAction]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  useEffect(() => {
    async function load() {
      await loadShoppingData();
    }

    void load();
  }, [loadShoppingData]);

  const handleCloseAssistant = useCallback(() => {
    setAssistantOpen(false);
  }, []);

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
      setPendingItemStateId(item.id);
      setIsMutating(true);
      const nextList = await setShoppingItemState(item.id, !item.isDone);
      setShoppingList(nextList);
    } catch (error) {
      console.error("Failed to toggle shopping item", error);
      setFeedback({ type: "error", message: t("shopping.status.toggleError") });
    } finally {
      setPendingItemStateId(null);
      setIsMutating(false);
    }
  }

  async function handleDeleteItem(item: ShoppingItem) {
    try {
      setIsMutating(true);
      const nextList = await removeShoppingItem(item.id);
      setShoppingList(nextList);
      setPendingDelete(null);
      setFeedback({ type: "success", message: t("shopping.status.deleted") });
    } catch (error) {
      console.error("Failed to remove shopping item", error);
      setFeedback({ type: "error", message: t("shopping.status.deleteError") });
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
      setFeedback({ type: "success", message: t("shopping.status.added") });
    } catch (error) {
      console.error("Failed to add shopping item", error);
      setFeedback({ type: "error", message: t("shopping.status.addError") });
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAddCategory(name: string) {
    try {
      setIsMutating(true);
      await addShoppingCategory(name);
      const nextList = await getShoppingList();
      setShoppingList(nextList);
      setCategoryDialogOpen(false);
      setFeedback({ type: "success", message: t("shopping.status.categoryAdded") });
    } catch (error) {
      console.error("Failed to add shopping category", error);
      setFeedback({ type: "error", message: t("shopping.status.categoryAddError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCreateCategorySilently(name: string) {
    await addShoppingCategory(name);
  }

  async function handleDeleteCategory(categoryId: string, categoryName: string) {
    try {
      setIsMutating(true);
      await removeShoppingCategory(categoryId);
      const nextList = await getShoppingList();
      setShoppingList(nextList);
      if (filter === categoryName) {
        setFilter("all");
      }
      setFeedback({ type: "success", message: t("shopping.status.categoryDeleted") });
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to delete shopping category", error);
      setFeedback({ type: "error", message: t("shopping.status.categoryDeleteError") });
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ pb: { xs: 11, md: 9 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("shopping.title")} subtitle={t("shopping.subtitle")} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <PageTitle title={t("shopping.title")} />
        {isDesktop ? (
          <Stack direction="row" spacing={1}>
            <PageActionButton icon={<AddRoundedIcon fontSize="small" />} label={t("shopping.add")} onClick={() => setDialogOpen(true)} />
            <PageActionButton icon={<SmartToyRoundedIcon fontSize="small" />} label={t("aiAgent.title")} onClick={() => setAssistantOpen(true)} variant="agent" />
          </Stack>
        ) : null}
      </Stack>

      <FilterChipRow
        value={filter}
        onChange={setFilter}
        wrapOnDesktop
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

      {loadError ? <Alert severity="error">{loadError}</Alert> : null}

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
        <Box
          sx={{
            columnCount: { xs: 1, xl: 2 },
            columnGap: { xs: 0, xl: 10 }
          }}
        >
          {groupedItems.map(([categoryName, items]) => (
            <Box
              key={categoryName}
              sx={{
                breakInside: "avoid",
                WebkitColumnBreakInside: "avoid",
                mb: { xs: 1.4, md: 2 }
              }}
            >
              <ShoppingCategorySection
                title={categoryName}
                items={items}
                onDeleteCategory={
                  categoryByName.get(categoryName)
                    ? () => setPendingDelete({ type: "category", categoryId: categoryByName.get(categoryName)!.id, categoryName })
                    : undefined
                }
                onToggleDone={handleToggleDone}
                onDelete={(item) => setPendingDelete({ type: "item", item })}
                pendingItemId={pendingItemStateId}
              />
            </Box>
          ))}
        </Box>
      )}

      <ShoppingAddDialog
        open={dialogOpen}
        products={products}
        categories={categoryNames}
        isSubmitting={isMutating}
        onClose={() => setDialogOpen(false)}
        onCreateCategory={handleCreateCategorySilently}
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

      <AppFeedbackToast feedback={feedback} onClose={() => setFeedback(null)} autoHideDuration={2500} />

      <ShoppingAssistantDialog
        open={assistantOpen}
        shoppingList={shoppingList}
        onDataChanged={loadShoppingData}
        onClose={handleCloseAssistant}
      />
    </Stack>
  );
}
