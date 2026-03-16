import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Button, CircularProgress, Grid, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { addProductToShoppingList } from "../features/shopping/api/shoppingApi";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ProductCard } from "../widgets/products/ProductCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function ProductsPage() {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [shoppingStatus, setShoppingStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");

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
          setStatus(t("products.status.loadError"));
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

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (term.length === 0) {
        return true;
      }
      return product.title.toLowerCase().includes(term) || product.brand?.toLowerCase().includes(term);
    });
  }, [products, query]);

  async function handleAddToShopping(product: ProductSummary) {
    try {
      setShoppingStatus(null);
      await addProductToShoppingList(product);
      setShoppingStatus({ type: "success", message: t("shopping.status.addedFromProduct") });
    } catch (error) {
      console.error("Failed to add product to shopping list", error);
      setShoppingStatus({ type: "error", message: t("shopping.status.addError") });
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("products.title")} subtitle={t("products.subtitle")} />

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div />
        <Button component={RouterLink} to="/products/new" variant="contained" startIcon={<AddRoundedIcon />} sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}>
          {t("products.add")}
        </Button>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
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
      </Paper>

      {status ? <Alert severity="error">{status}</Alert> : null}
      {shoppingStatus ? <Alert severity={shoppingStatus.type}>{shoppingStatus.message}</Alert> : null}

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
              <ProductCard product={product} onAddToShopping={handleAddToShopping} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
