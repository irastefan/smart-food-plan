import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useOutletContext, useParams } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProduct, type ProductDetail } from "../features/products/api/productsApi";
import { addProductToShoppingList } from "../features/shopping/api/shoppingApi";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ProductNutritionCard } from "../widgets/products/ProductNutritionCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function ProductDetailsPage() {
  const { productId } = useParams();
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [shoppingStatus, setShoppingStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!productId) {
        return;
      }
      try {
        setIsLoading(true);
        setStatus(null);
        const detail = await getProduct(productId);
        if (!cancelled) {
          setProduct(detail);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load product", error);
          setStatus(t("products.status.loadOneError"));
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
  }, [productId, t]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (status || !product) {
    return <Alert severity="error">{status ?? t("products.status.loadOneError")}</Alert>;
  }

  async function handleAddToShopping() {
    const currentProduct = product;
    if (!currentProduct) {
      return;
    }
    try {
      setShoppingStatus(null);
      await addProductToShoppingList(currentProduct);
      setShoppingStatus({ type: "success", message: t("shopping.status.addedFromProduct") });
    } catch (error) {
      console.error("Failed to add product to shopping list", error);
      setShoppingStatus({ type: "error", message: t("shopping.status.addError") });
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={product.title} subtitle={product.brand || t("products.noBrand")} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Button component={RouterLink} to="/products" startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
          {t("product.back")}
        </Button>
        <Button component={RouterLink} to={`/products/${product.id}/edit`} startIcon={<EditRoundedIcon />} variant="contained" sx={{ alignSelf: "flex-start" }}>
          {t("product.edit")}
        </Button>
        <Button onClick={handleAddToShopping} startIcon={<AddShoppingCartRoundedIcon />} variant="outlined" sx={{ alignSelf: "flex-start" }}>
          {t("shopping.addFromProduct")}
        </Button>
      </Stack>

      {shoppingStatus ? <Alert severity={shoppingStatus.type}>{shoppingStatus.message}</Alert> : null}

      <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider", flex: 1 }}>
          <Stack spacing={2.5}>
            <Typography variant="h5" fontWeight={800}>{t("products.summary")}</Typography>
            <Row label={t("product.form.title")} value={product.title} />
            <Row label={t("product.form.brand")} value={product.brand || t("products.noBrand")} />
            <Row label={t("products.per100g")} value={`${Math.round(product.nutritionPer100g.caloriesKcal)} kcal`} />
          </Stack>
        </Paper>

        <Stack sx={{ flex: 1, minWidth: { xl: 360 } }}>
          <ProductNutritionCard nutrition={product.nutritionPer100g} />
        </Stack>
      </Stack>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={700} textAlign="right">{value}</Typography>
    </Stack>
  );
}
