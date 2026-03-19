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
  initialItemType?: "product" | "recipe" | "manual";
  item?: MealPlanItem | null;
  recipes: RecipeSummary[];
  products: ProductSummary[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    type: "product" | "recipe" | "manual";
    product?: ProductSummary;
    recipe?: RecipeSummary;
    quantity?: number;
    servings?: number;
    name?: string;
    unit?: string;
    kcal100?: number;
    protein100?: number;
    fat100?: number;
    carbs100?: number;
  }) => void;
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
  const [type, setType] = useState<"product" | "recipe" | "manual">(item?.isManual ? "manual" : item?.type ?? initialItemType);
  const [selectedProductId, setSelectedProductId] = useState(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
  const [selectedRecipeId, setSelectedRecipeId] = useState(item?.type === "recipe" ? item.recipeId ?? "" : "");
  const [quantity, setQuantity] = useState(item?.type === "product" ? item.amount ?? 100 : 100);
  const [servings, setServings] = useState(item?.type === "recipe" ? item.servings ?? 1 : 1);
  const [manualName, setManualName] = useState(item?.isManual ? item.title : "");
  const [manualUnit, setManualUnit] = useState(item?.isManual ? item.unit ?? "g" : "g");
  const [manualKcal100, setManualKcal100] = useState(item?.isManual ? item.nutritionPer100?.caloriesKcal ?? 0 : 0);
  const [manualProtein100, setManualProtein100] = useState(item?.isManual ? item.nutritionPer100?.proteinG ?? 0 : 0);
  const [manualFat100, setManualFat100] = useState(item?.isManual ? item.nutritionPer100?.fatG ?? 0 : 0);
  const [manualCarbs100, setManualCarbs100] = useState(item?.isManual ? item.nutritionPer100?.carbsG ?? 0 : 0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setType(item?.isManual ? "manual" : item?.type ?? initialItemType);
    setSelectedProductId(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
    setSelectedRecipeId(item?.type === "recipe" ? item.recipeId ?? "" : "");
    setQuantity(item?.type === "product" ? item.amount ?? 100 : 100);
    setServings(item?.type === "recipe" ? item.servings ?? 1 : 1);
    setManualName(item?.isManual ? item.title : "");
    setManualUnit(item?.isManual ? item.unit ?? "g" : "g");
    setManualKcal100(item?.isManual ? item.nutritionPer100?.caloriesKcal ?? 0 : 0);
    setManualProtein100(item?.isManual ? item.nutritionPer100?.proteinG ?? 0 : 0);
    setManualFat100(item?.isManual ? item.nutritionPer100?.fatG ?? 0 : 0);
    setManualCarbs100(item?.isManual ? item.nutritionPer100?.carbsG ?? 0 : 0);
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
    if (type === "manual") {
      if (!manualName.trim()) {
        return;
      }
      onSubmit({
        type,
        name: manualName.trim(),
        quantity,
        unit: manualUnit || "g",
        kcal100: manualKcal100,
        protein100: manualProtein100,
        fat100: manualFat100,
        carbs100: manualCarbs100
      });
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
            onChange={(_event, nextValue: "product" | "recipe" | "manual" | null) => {
              if (nextValue) {
                setType(nextValue);
              }
            }}
            sx={{ alignSelf: "flex-start" }}
          >
            <ToggleButton value="product">{t("mealPlan.dialog.product")}</ToggleButton>
            <ToggleButton value="recipe">{t("mealPlan.dialog.recipe")}</ToggleButton>
            <ToggleButton value="manual">{t("mealPlan.dialog.manual")}</ToggleButton>
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
          ) : type === "recipe" ? (
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
          ) : (
            <>
              <TextField label={t("mealPlan.dialog.name")} value={manualName} onChange={(event) => setManualName(event.target.value)} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label={t("mealPlan.dialog.quantity")}
                  type="number"
                  inputProps={{ min: 0.1, step: 0.1 }}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(0.1, Number(event.target.value) || 0.1))}
                  fullWidth
                />
                <TextField label={t("mealPlan.dialog.unit")} value={manualUnit} onChange={(event) => setManualUnit(event.target.value || "g")} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label={t("recipe.form.caloriesPer100")} type="number" value={manualKcal100} onChange={(event) => setManualKcal100(Number(event.target.value) || 0)} fullWidth />
                <TextField label={t("recipe.form.proteinPer100")} type="number" value={manualProtein100} onChange={(event) => setManualProtein100(Number(event.target.value) || 0)} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label={t("recipe.form.fatPer100")} type="number" value={manualFat100} onChange={(event) => setManualFat100(Number(event.target.value) || 0)} fullWidth />
                <TextField label={t("recipe.form.carbsPer100")} type="number" value={manualCarbs100} onChange={(event) => setManualCarbs100(Number(event.target.value) || 0)} fullWidth />
              </Stack>
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
