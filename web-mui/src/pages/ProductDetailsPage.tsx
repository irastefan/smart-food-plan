import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Alert, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { deleteProduct, getProduct, type ProductDetail } from "../features/products/api/productsApi";
import { addProductToShoppingList, addShoppingCategory, getShoppingList } from "../features/shopping/api/shoppingApi";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ProductNutritionCard } from "../widgets/products/ProductNutritionCard";
import { ShoppingCategoryPickerButton } from "../widgets/shopping/ShoppingCategoryPickerButton";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function ProductDetailsPage() {
  const { productId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [shoppingCategories, setShoppingCategories] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleAddToShopping(categoryName: string) {
    const currentProduct = product;
    if (!currentProduct) {
      return;
    }
    await addProductToShoppingList(currentProduct, { categoryName });
  }

  async function handleCreateShoppingCategory(name: string) {
    await addShoppingCategory(name);
    setShoppingCategories((current) => Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b)));
  }

  async function handleDelete() {
    if (!product) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
      navigate("/products");
    } catch (error) {
      console.error("Failed to delete product", error);
      setStatus(t("products.status.deleteError"));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={product.title} subtitle={product.brand || t("products.noBrand")} />
      <PageTitle title={product.title} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Button component={RouterLink} to="/products" startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
          {t("product.back")}
        </Button>
        <Button component={RouterLink} to={`/products/${product.id}/edit`} startIcon={<EditRoundedIcon />} variant="contained" sx={{ alignSelf: "flex-start" }}>
          {t("product.edit")}
        </Button>
        {product.isPublic ? null : (
          <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setDeleteOpen(true)} sx={{ alignSelf: "flex-start" }}>
            {t("products.delete")}
          </Button>
        )}
        <ShoppingCategoryPickerButton
          categories={shoppingCategories}
          iconOnly
          tooltip={t("shopping.tooltip.addToList")}
          startIcon={<AddShoppingCartRoundedIcon />}
          onAdd={handleAddToShopping}
          onCreateCategory={handleCreateShoppingCategory}
        />
      </Stack>
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

      {product.isPublic ? null : (
        <ConfirmActionDialog
          open={deleteOpen}
          title={t("products.delete")}
          message={t("products.confirmDelete", { name: product.title })}
          isSubmitting={isDeleting}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      )}
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
