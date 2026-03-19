import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Typography
} from "@mui/material";
import { useMemo } from "react";
import { recipeCategoryKeys } from "../../features/recipes/model/recipeCategories";
import type { RecipeFormValues } from "../../features/recipes/model/recipeTypes";
import type { ProductSummary } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type RecipeFormProps = {
  value: RecipeFormValues;
  products: ProductSummary[];
  isSubmitting: boolean;
  status?: { type: "error" | "success" | "info"; message: string } | null;
  submitLabel: string;
  onChange: (nextValue: RecipeFormValues) => void;
  onSubmit: () => void;
};

export function RecipeForm({ value, products, isSubmitting, status, submitLabel, onChange, onSubmit }: RecipeFormProps) {
  const { t } = useLanguage();

  const totalNutrition = useMemo(() => {
    return value.ingredients.reduce(
      (acc, ingredient) => {
        const linkedProduct = ingredient.isManual ? null : products.find((item) => item.id === ingredient.productId);
        const per100 = ingredient.isManual
          ? {
              caloriesKcal: ingredient.kcal100,
              proteinG: ingredient.protein100,
              fatG: ingredient.fat100,
              carbsG: ingredient.carbs100
            }
          : linkedProduct?.nutritionPer100g;
        if (!per100) return acc;
        const factor = ingredient.amount / 100;
        return {
          caloriesKcal: acc.caloriesKcal + per100.caloriesKcal * factor,
          proteinG: acc.proteinG + per100.proteinG * factor,
          fatG: acc.fatG + per100.fatG * factor,
          carbsG: acc.carbsG + per100.carbsG * factor
        };
      },
      { caloriesKcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }
    );
  }, [products, value.ingredients]);

  function updateField<K extends keyof RecipeFormValues>(key: K, nextValue: RecipeFormValues[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function updateIngredient(index: number, patch: Partial<RecipeFormValues["ingredients"][number]>) {
    const nextIngredients = value.ingredients.map((ingredient, ingredientIndex) =>
      ingredientIndex === index ? { ...ingredient, ...patch } : ingredient
    );
    updateField("ingredients", nextIngredients);
  }

  function addIngredient() {
    updateField("ingredients", [
      ...value.ingredients,
      {
        id: crypto.randomUUID(),
        isManual: false,
        productId: "",
        name: "",
        amount: 100,
        unit: "g",
        kcal100: 0,
        protein100: 0,
        fat100: 0,
        carbs100: 0
      }
    ]);
  }

  function removeIngredient(index: number) {
    updateField(
      "ingredients",
      value.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index)
    );
  }

  function updateStep(index: number, nextText: string) {
    const nextSteps = value.steps.map((step, stepIndex) => (stepIndex === index ? nextText : step));
    updateField("steps", nextSteps);
  }

  function addStep() {
    updateField("steps", [...value.steps, ""]);
  }

  function removeStep(index: number) {
    updateField(
      "steps",
      value.steps.filter((_, stepIndex) => stepIndex !== index)
    );
  }

  return (
    <Stack spacing={3}>
      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={800}>{t("recipe.form.basics")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("recipe.form.title")} value={value.title} onChange={(event) => updateField("title", event.target.value)} fullWidth />
            <TextField
              label={t("recipe.form.category")}
              select
              value={value.category}
              onChange={(event) => updateField("category", event.target.value)}
              fullWidth
            >
              {recipeCategoryKeys.filter((item) => item !== "all").map((category) => (
                <MenuItem key={category} value={category}>
                  {t(`recipes.categories.${category}` as never)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label={t("recipe.form.description")} value={value.description} onChange={(event) => updateField("description", event.target.value)} fullWidth multiline minRows={3} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("recipe.form.servings")} type="number" inputProps={{ min: 1 }} value={value.servings} onChange={(event) => updateField("servings", Math.max(1, Number(event.target.value) || 1))} fullWidth />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={800}>{t("recipe.ingredients")}</Typography>
            <Button startIcon={<AddRoundedIcon />} onClick={addIngredient}>{t("recipe.form.addIngredient")}</Button>
          </Stack>

          <Stack spacing={2}>
            {value.ingredients.map((ingredient, index) => (
              <Paper key={ingredient.id} variant="outlined" sx={{ p: 2, borderRadius: 1.25 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>{t("recipe.form.ingredient", { index: index + 1 })}</Typography>
                    <IconButton onClick={() => removeIngredient(index)}>
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                  <ToggleButtonGroup
                    exclusive
                    value={ingredient.isManual ? "manual" : "linked"}
                    onChange={(_event, nextValue: "manual" | "linked" | null) => {
                      if (!nextValue) return;
                      updateIngredient(index, {
                        isManual: nextValue === "manual",
                        productId: nextValue === "manual" ? undefined : ingredient.productId,
                        name: nextValue === "manual" ? ingredient.name : ""
                      });
                    }}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <ToggleButton value="linked">{t("recipe.form.linkedIngredient")}</ToggleButton>
                    <ToggleButton value="manual">{t("recipe.form.manualIngredient")}</ToggleButton>
                  </ToggleButtonGroup>
                  {ingredient.isManual ? (
                    <>
                      <TextField label={t("recipe.form.name")} value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value })} fullWidth />
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField label={t("recipe.form.caloriesPer100")} type="number" value={ingredient.kcal100} onChange={(event) => updateIngredient(index, { kcal100: Number(event.target.value) || 0 })} fullWidth />
                        <TextField label={t("recipe.form.proteinPer100")} type="number" value={ingredient.protein100} onChange={(event) => updateIngredient(index, { protein100: Number(event.target.value) || 0 })} fullWidth />
                      </Stack>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <TextField label={t("recipe.form.fatPer100")} type="number" value={ingredient.fat100} onChange={(event) => updateIngredient(index, { fat100: Number(event.target.value) || 0 })} fullWidth />
                        <TextField label={t("recipe.form.carbsPer100")} type="number" value={ingredient.carbs100} onChange={(event) => updateIngredient(index, { carbs100: Number(event.target.value) || 0 })} fullWidth />
                      </Stack>
                    </>
                  ) : (
                    <Autocomplete
                      options={products}
                      value={products.find((item) => item.id === ingredient.productId) ?? null}
                      onChange={(_event, nextValue) => updateIngredient(index, { productId: nextValue?.id ?? "" })}
                      getOptionLabel={(option) => option.title}
                      renderInput={(params) => <TextField {...params} label={t("recipe.form.product")} />}
                    />
                  )}
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label={t("recipe.form.amount")} type="number" inputProps={{ min: 0.1, step: 0.1 }} value={ingredient.amount} onChange={(event) => updateIngredient(index, { amount: Math.max(0.1, Number(event.target.value) || 0.1) })} fullWidth />
                    <TextField label={t("recipe.form.unit")} value={ingredient.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value || "g" })} fullWidth />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" fontWeight={800}>{t("recipe.steps")}</Typography>
            <Button startIcon={<AddRoundedIcon />} onClick={addStep}>{t("recipe.form.addStep")}</Button>
          </Stack>
          <Stack spacing={2}>
            {value.steps.map((step, index) => (
              <Stack key={`step-${index}`} direction="row" spacing={1.5} alignItems="flex-start">
                <Typography sx={{ minWidth: 28, pt: 1.5, color: "text.secondary", fontWeight: 700 }}>{index + 1}</Typography>
                <TextField fullWidth multiline minRows={2} value={step} onChange={(event) => updateStep(index, event.target.value)} label={t("recipe.form.step")} />
                <IconButton sx={{ mt: 1 }} onClick={() => removeStep(index)}>
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SummaryMetric label="kcal" value={Math.round(totalNutrition.caloriesKcal).toString()} />
            <SummaryMetric label={t("recipe.macros.protein")} value={`${totalNutrition.proteinG.toFixed(1)} g`} />
            <SummaryMetric label={t("recipe.macros.fat")} value={`${totalNutrition.fatG.toFixed(1)} g`} />
            <SummaryMetric label={t("recipe.macros.carbs")} value={`${totalNutrition.carbsG.toFixed(1)} g`} />
          </Stack>
          <Button onClick={onSubmit} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ px: 1.5, py: 1.25, borderRadius: 1.25, bgcolor: "action.hover", minWidth: 92 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}
