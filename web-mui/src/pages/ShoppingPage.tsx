import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CreateNewFolderRoundedIcon from "@mui/icons-material/CreateNewFolderRounded";
import { Alert, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import {
  addShoppingCategory,
  addShoppingItem,
  getShoppingList,
  removeShoppingItem,
  setShoppingItemState,
  type ShoppingItem,
  type ShoppingList
} from "../features/shopping/api/shoppingApi";
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

  async function handleDelete(item: ShoppingItem) {
    try {
      setIsMutating(true);
      setStatus(null);
      const nextList = await removeShoppingItem(item.id);
      setShoppingList(nextList);
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

  return (
    <Stack spacing={3} sx={{ pb: { xs: 11, md: 9 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("shopping.title")} subtitle={t("shopping.subtitle")} />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={t("shopping.filters.all")} clickable color={filter === "all" ? "primary" : "default"} onClick={() => setFilter("all")} />
          {categoryNames.map((category) => (
            <Chip key={category} label={category} clickable color={filter === category ? "primary" : "default"} onClick={() => setFilter(category)} />
          ))}
        </Stack>
      </Stack>

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
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
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

      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1200,
          p: 1,
          borderRadius: 1.25,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper"
        }}
      >
        <Stack spacing={1} sx={{ minWidth: { xs: 180, md: 200 } }}>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>
            {t("shopping.add")}
          </Button>
          <Button variant="outlined" startIcon={<CreateNewFolderRoundedIcon />} onClick={() => setCategoryDialogOpen(true)}>
            {t("shopping.addCategory")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
