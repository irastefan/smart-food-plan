import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Alert, Button, CircularProgress, Paper, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { createRecipe, getRecipe, updateRecipe } from "../features/recipes/api/recipesApi";
import type { RecipeFormValues } from "../features/recipes/model/recipeTypes";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { useLanguage } from "../app/providers/LanguageProvider";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { RecipeForm } from "../widgets/recipes/RecipeForm";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

const emptyForm: RecipeFormValues = {
  title: "",
  description: "",
  category: "breakfast",
  servings: 2,
  steps: [""],
  ingredients: []
};

export function RecipeEditorPage() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const isEdit = Boolean(recipeId);
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [form, setForm] = useState<RecipeFormValues>(emptyForm);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        const [productList, recipe] = await Promise.all([
          getProducts(),
          isEdit && recipeId ? getRecipe(recipeId) : Promise.resolve(null)
        ]);
        if (cancelled) {
          return;
        }
        setProducts(productList);
        if (recipe) {
          setForm({
            title: recipe.title,
            description: recipe.description ?? "",
            category: recipe.category,
            servings: recipe.servings,
            steps: recipe.steps.length > 0 ? recipe.steps : [""],
            ingredients: recipe.ingredients.map((ingredient) => ({
              id: ingredient.id,
              isManual: ingredient.isManual,
              productId: ingredient.productId,
              name: ingredient.title,
              amount: ingredient.quantity,
              unit: ingredient.unit || "g",
              kcal100: ingredient.macros.caloriesKcal,
              protein100: ingredient.macros.proteinG,
              fat100: ingredient.macros.fatG,
              carbs100: ingredient.macros.carbsG
            }))
          });
        }
      } catch (error) {
        console.error("Failed to load recipe editor", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t(isEdit ? "recipe.form.status.loadEditError" : "recipe.form.status.loadCreateError") });
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
  }, [isEdit, recipeId, t]);

  const submitLabel = useMemo(() => (isEdit ? t("recipe.form.update") : t("recipe.form.create")), [isEdit, t]);

  async function handleSubmit() {
    if (!form.title.trim()) {
      setStatus({ type: "error", message: t("recipe.form.status.validationTitle") });
      return;
    }
    if (form.ingredients.length === 0) {
      setStatus({ type: "error", message: t("recipe.form.status.validationIngredients") });
      return;
    }
    if (form.ingredients.some((ingredient) => ingredient.isManual ? !ingredient.name.trim() : !ingredient.productId)) {
      setStatus({ type: "error", message: t("recipe.form.status.validationIngredient") });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      const payload = {
        ...form,
        steps: form.steps.map((step) => step.trim()).filter(Boolean)
      };

      const saved = isEdit && recipeId ? await updateRecipe(recipeId, payload) : await createRecipe(payload);
      navigate(`/recipes/${saved.id}`);
    } catch (error) {
      console.error("Failed to save recipe", error);
      setStatus({ type: "error", message: t("recipe.form.status.saveError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar
        onOpenSidebar={openSidebar}
        title={isEdit ? t("recipe.form.editTitle") : t("recipe.form.createTitle")}
        subtitle={isEdit ? t("recipe.form.editSubtitle") : t("recipe.form.createSubtitle")}
      />

      <Button component={RouterLink} to={isEdit && recipeId ? `/recipes/${recipeId}` : "/recipes"} startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
        {t("recipe.back")}
      </Button>

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : (
        <RecipeForm
          value={form}
          products={products}
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
