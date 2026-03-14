import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "../../features/products/api/productsApi";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import type { MealPlanItem } from "../../features/meal-plan/api/mealPlanApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type MealPlanItemDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  sectionTitle: string;
  initialItemType?: "product" | "recipe";
  item?: MealPlanItem | null;
  recipes: RecipeSummary[];
  products: ProductSummary[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { type: "product" | "recipe"; product?: ProductSummary; recipe?: RecipeSummary; quantity?: number; servings?: number }) => void;
};

export function MealPlanItemDialog({
  open,
  mode,
  sectionTitle,
  initialItemType = "product",
  item,
  recipes,
  products,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit
}: MealPlanItemDialogProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<"product" | "recipe">(item?.type ?? initialItemType);
  const [selectedProductId, setSelectedProductId] = useState(item?.type === "product" ? item.refId ?? "" : "");
  const [selectedRecipeId, setSelectedRecipeId] = useState(item?.type === "recipe" ? item.refId ?? "" : "");
  const [quantity, setQuantity] = useState(item?.type === "product" ? item.amount ?? 100 : 100);
  const [servings, setServings] = useState(item?.type === "recipe" ? item.servings ?? 1 : 1);

  useEffect(() => {
    if (!open) {
      return;
    }
    setType(item?.type ?? initialItemType);
    setSelectedProductId(item?.type === "product" ? item.refId ?? "" : "");
    setSelectedRecipeId(item?.type === "recipe" ? item.refId ?? "" : "");
    setQuantity(item?.type === "product" ? item.amount ?? 100 : 100);
    setServings(item?.type === "recipe" ? item.servings ?? 1 : 1);
  }, [initialItemType, item, open]);

  const selectedProduct = useMemo(() => products.find((entry) => entry.id === selectedProductId) ?? null, [products, selectedProductId]);
  const selectedRecipe = useMemo(() => recipes.find((entry) => entry.id === selectedRecipeId) ?? null, [recipes, selectedRecipeId]);

  function handleSubmit() {
    if (type === "product") {
      if (!selectedProduct) {
        return;
      }
      onSubmit({ type, product: selectedProduct, quantity });
      return;
    }
    if (!selectedRecipe) {
      return;
    }
    onSubmit({ type, recipe: selectedRecipe, servings });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "add" ? t("mealPlan.dialog.addTitle", { section: sectionTitle }) : t("mealPlan.dialog.editTitle", { section: sectionTitle })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <ToggleButtonGroup
            exclusive
            value={type}
            onChange={(_event, nextValue: "product" | "recipe" | null) => {
              if (nextValue) {
                setType(nextValue);
              }
            }}
            sx={{ alignSelf: "flex-start" }}
          >
            <ToggleButton value="product">{t("mealPlan.dialog.product")}</ToggleButton>
            <ToggleButton value="recipe">{t("mealPlan.dialog.recipe")}</ToggleButton>
          </ToggleButtonGroup>

          {type === "product" ? (
            <>
              <Autocomplete
                options={products}
                value={selectedProduct}
                onChange={(_event, nextValue) => setSelectedProductId(nextValue?.id ?? "")}
                getOptionLabel={(option) => option.title}
                renderInput={(params) => <TextField {...params} label={t("mealPlan.dialog.selectProduct")} />}
              />
              <TextField
                label={t("mealPlan.dialog.quantity")}
                type="number"
                inputProps={{ min: 0.1, step: 0.1 }}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(0.1, Number(event.target.value) || 0.1))}
              />
            </>
          ) : (
            <>
              <Autocomplete
                options={recipes}
                value={selectedRecipe}
                onChange={(_event, nextValue) => setSelectedRecipeId(nextValue?.id ?? "")}
                getOptionLabel={(option) => option.title}
                renderInput={(params) => <TextField {...params} label={t("mealPlan.dialog.selectRecipe")} />}
              />
              <TextField
                label={t("mealPlan.dialog.servings")}
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={servings}
                onChange={(event) => setServings(Math.max(1, Number(event.target.value) || 1))}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("mealPlan.dialog.cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {mode === "add" ? t("mealPlan.dialog.addAction") : t("mealPlan.dialog.saveAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
