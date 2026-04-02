import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Box, Button, CircularProgress, Grid, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { deleteProduct, getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { addProductToShoppingList, addShoppingCategory, getShoppingList } from "../features/shopping/api/shoppingApi";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ProductCard } from "../widgets/products/ProductCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function ProductsPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [shoppingCategories, setShoppingCategories] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ProductSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        const list = await getProducts();
        if (!cancelled) {
          setProducts(list);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load products", error);
          setStatus({ type: "error", message: t("products.status.loadError") });
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

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadShoppingCategories() {
      try {
        const list = await getShoppingList();
        if (!cancelled) {
          setShoppingCategories(list.categories.map((category) => category.name));
        }
      } catch (error) {
        console.error("Failed to load shopping categories", error);
      }
    }

    void loadShoppingCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (term.length === 0) {
        return true;
      }
      return product.title.toLowerCase().includes(term) || product.brand?.toLowerCase().includes(term);
    });
  }, [products, query]);

  async function handleAddToShopping(product: ProductSummary, categoryName: string) {
    await addProductToShoppingList(product, { categoryName });
  }

  async function handleCreateShoppingCategory(name: string) {
    await addShoppingCategory(name);
    setShoppingCategories((current) => Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b)));
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteProduct(deleteTarget.id);
      setProducts((current) => current.filter((product) => product.id !== deleteTarget.id));
      setStatus({ type: "success", message: t("products.status.deleted") });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete product", error);
      setStatus({ type: "error", message: t("products.status.deleteError") });
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: { xs: 10, md: 8 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("products.title")} subtitle={t("products.subtitle")} />
      <PageTitle title={t("products.title")} />

      <TextField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("products.searchPlaceholder")}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          )
        }}
      />

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : filteredProducts.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{t("products.emptyTitle")}</Typography>
          <Typography color="text.secondary">{query ? t("products.emptySearch") : t("products.empty")}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredProducts.map((product) => (
            <Grid key={product.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <ProductCard
                product={product}
                shoppingCategories={shoppingCategories}
                onAddToShopping={handleAddToShopping}
                onCreateShoppingCategory={handleCreateShoppingCategory}
                onDelete={product.isPublic ? undefined : setDeleteTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("products.delete")}
        message={t("products.confirmDelete", { name: deleteTarget?.title ?? "" })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <Box
        sx={{
          position: "fixed",
          insetInlineEnd: { xs: 16, md: 24 },
          bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1200
        }}
      >
        <Button component={RouterLink} to="/products/new" variant="contained" startIcon={<AddRoundedIcon />}>
          {t("products.add")}
        </Button>
      </Box>
    </Stack>
  );
}
