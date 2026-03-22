import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Alert, Button, CircularProgress, Paper, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { createProduct, getProduct, type ProductFormValues, updateProduct } from "../features/products/api/productsApi";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { ProductForm } from "../widgets/products/ProductForm";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

const emptyForm: ProductFormValues = {
  title: "",
  brand: "",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0
};

export function ProductEditorPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        if (isEdit && productId) {
          const product = await getProduct(productId);
          if (!cancelled) {
            setForm({
              title: product.title,
              brand: product.brand || "",
              calories: product.nutritionPer100g.caloriesKcal,
              protein: product.nutritionPer100g.proteinG,
              fat: product.nutritionPer100g.fatG,
              carbs: product.nutritionPer100g.carbsG
            });
          }
        }
      } catch (error) {
        console.error("Failed to load product editor", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t(isEdit ? "product.form.status.loadEditError" : "product.form.status.loadCreateError") });
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
  }, [isEdit, productId, t]);

  const submitLabel = useMemo(() => (isEdit ? t("product.form.update") : t("product.form.create")), [isEdit, t]);

  async function handleSubmit() {
    if (!form.title.trim()) {
      setStatus({ type: "error", message: t("product.form.status.validationTitle") });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      const saved = isEdit && productId ? await updateProduct(productId, form) : await createProduct(form);
      navigate(`/products/${saved.id}`);
    } catch (error) {
      console.error("Failed to save product", error);
      setStatus({ type: "error", message: t("product.form.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar
        onOpenSidebar={openSidebar}
        title={isEdit ? t("product.form.editTitle") : t("product.form.createTitle")}
        subtitle={isEdit ? t("product.form.editSubtitle") : t("product.form.createSubtitle")}
      />
      <PageTitle title={isEdit ? t("product.form.editTitle") : t("product.form.createTitle")} />

      <Button component={RouterLink} to={isEdit && productId ? `/products/${productId}` : "/products"} startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
        {t("product.back")}
      </Button>

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : (
        <ProductForm
          value={form}
          isSubmitting={isSubmitting}
          status={null}
          submitLabel={submitLabel}
          onChange={setForm}
          onSubmit={handleSubmit}
        />
      )}
    </Stack>
  );
}
