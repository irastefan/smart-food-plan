import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import MonitorWeightRoundedIcon from "@mui/icons-material/MonitorWeightRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { Alert, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { getRecipe, getRecipes } from "../features/recipes/api/recipesApi";
import type { RecipeSummary } from "../features/recipes/model/recipeTypes";
import {
  addMealPlanItemToShoppingList,
  addRecipeToShoppingList
} from "../features/shopping/api/shoppingApi";
import {
  addProductToMealPlan,
  addRecipeToMealPlan,
  getMealCompletion,
  getMacroDistribution,
  removeMealPlanItem,
  type MealPlanItem,
  updateMealPlanItem
} from "../features/meal-plan/api/mealPlanApi";
import { useMealPlanDashboard } from "../features/meal-plan/hooks/useMealPlanDashboard";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { MealPlanDayNavigator } from "../widgets/meal-plan/day-navigator";
import { MealPlanItemDialog } from "../widgets/meal-plan/MealPlanItemDialog";
import { MealPlanMacroBalanceCard } from "../widgets/meal-plan/MealPlanMacroBalanceCard";
import { MealPlanMetricCard } from "../widgets/meal-plan/MealPlanMetricCard";
import { MealPlanSectionsCard } from "../widgets/meal-plan/MealPlanSectionsCard";
import { MealPlanSummaryCard } from "../widgets/meal-plan/MealPlanSummaryCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MealPlanDashboardPage() {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const { selectedDate, setSelectedDate, day, setDay, isLoading, errorMessage } = useMealPlanDashboard();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [dialogState, setDialogState] = useState<{
    mode: "add" | "edit";
    sectionId: string;
    sectionTitle: string;
    item?: MealPlanItem | null;
  } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [shoppingStatus, setShoppingStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReferences() {
      try {
        const [recipesList, productsList] = await Promise.all([getRecipes(), getProducts()]);
        if (!cancelled) {
          setRecipes(recipesList);
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Failed to load meal plan references", error);
      }
    }

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">{t("mealPlan.loading")}</Typography>
      </Stack>
    );
  }

  const macroDistribution = day ? getMacroDistribution(day) : [];
  const completion = day ? getMealCompletion(day) : 0;
  const totalMeals = day?.sections.reduce((acc, section) => acc + section.items.length, 0) ?? 0;
  const activeSlots = day?.sections.filter((section) => section.items.length > 0).length ?? 0;
  const macroTotal = (day?.totals.proteinG ?? 0) + (day?.totals.fatG ?? 0) + (day?.totals.carbsG ?? 0);

  async function handleSubmitDialog(payload: {
    type: "product" | "recipe";
    product?: ProductSummary;
    recipe?: RecipeSummary;
    quantity?: number;
    servings?: number;
  }) {
    if (!dialogState) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);

      let nextDay = day;
      if (dialogState.mode === "add") {
        nextDay =
          payload.type === "product" && payload.product
            ? await addProductToMealPlan(selectedDate, dialogState.sectionId, payload.product, {
                quantity: payload.quantity,
                unit: "g"
              })
            : payload.recipe
              ? await addRecipeToMealPlan(selectedDate, dialogState.sectionId, payload.recipe, {
                  servings: payload.servings
                })
              : day;
      } else if (dialogState.item) {
        nextDay = await updateMealPlanItem(selectedDate, dialogState.sectionId, dialogState.item, {
          quantity: payload.type === "product" ? payload.quantity : undefined,
          unit: payload.type === "product" ? "g" : undefined,
          servings: payload.type === "recipe" ? payload.servings : undefined
        });
      }

      setDay(nextDay);
      setDialogState(null);
    } catch (error) {
      console.error("Failed to update meal plan item", error);
      setMutationError(t("mealPlan.dialog.saveError"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete(_sectionId: string, item: MealPlanItem) {
    try {
      setIsMutating(true);
      setMutationError(null);
      const nextDay = await removeMealPlanItem(selectedDate, item);
      setDay(nextDay);
    } catch (error) {
      console.error("Failed to delete meal plan item", error);
      setMutationError(t("mealPlan.dialog.deleteError"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAddMealPlanItemToShopping(_sectionId: string, item: MealPlanItem) {
    try {
      setIsMutating(true);
      setShoppingStatus(null);

      if (item.type === "recipe" && item.refId) {
        const recipe = await getRecipe(item.refId);
        await addRecipeToShoppingList(recipe, { multiplier: item.servings ?? 1, categoryName: item.title });
      } else {
        await addMealPlanItemToShoppingList(item, { categoryName: item.slot });
      }

      setShoppingStatus({ type: "success", message: t("shopping.status.addedFromMealPlan") });
    } catch (error) {
      console.error("Failed to add meal plan item to shopping list", error);
      setShoppingStatus({ type: "error", message: t("shopping.status.addError") });
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <Stack spacing={3} flex={1}>
      <DashboardTopbar
        onOpenSidebar={openSidebar}
        title={t("mealPlan.dashboard.title")}
        subtitle={t("mealPlan.dashboard.subtitle")}
      />
      <MealPlanDayNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}
      {shoppingStatus ? <Alert severity={shoppingStatus.type}>{shoppingStatus.message}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MealPlanMetricCard
            title={t("mealPlan.cards.totalCalories")}
            value={`${formatNumber(day?.totals.caloriesKcal ?? 0)}`}
            unit="kcal"
            icon={<LocalFireDepartmentRoundedIcon />}
            accent="linear-gradient(135deg, rgba(16,185,129,0.22), rgba(14,165,233,0.10))"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MealPlanMetricCard
            title={t("mealPlan.cards.totalMeals")}
            value={`${totalMeals}`}
            unit={t("mealPlan.cards.items")}
            icon={<RestaurantRoundedIcon />}
            accent="linear-gradient(135deg, rgba(14,165,233,0.20), rgba(59,130,246,0.12))"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MealPlanMetricCard
            title={t("mealPlan.cards.completion")}
            value={`${completion}`}
            unit="%"
            icon={<AccessTimeRoundedIcon />}
            accent="linear-gradient(135deg, rgba(245,158,11,0.22), rgba(249,115,22,0.10))"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MealPlanMetricCard
            title={t("mealPlan.cards.activeSlots")}
            value={`${activeSlots}`}
            unit={t("mealPlan.cards.slots")}
            icon={<MonitorWeightRoundedIcon />}
            accent="linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.10))"
          />
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <MealPlanSectionsCard
            day={day}
            title={t("mealPlan.section.dailyFlow")}
            subtitle={t("mealPlan.section.dailyFlowHint")}
            itemsLabel={t("mealPlan.cards.items")}
            servingsLabel={t("mealPlan.servings")}
            emptyLabel={t("mealPlan.emptySection")}
            addLabel={t("mealPlan.actions.add")}
            editLabel={t("mealPlan.actions.edit")}
            deleteLabel={t("mealPlan.actions.delete")}
            addToShoppingLabel={t("shopping.addFromMealPlan")}
            onAddItem={(sectionId, sectionTitle) => setDialogState({ mode: "add", sectionId, sectionTitle })}
            onEditItem={(sectionId, sectionTitle, item) => setDialogState({ mode: "edit", sectionId, sectionTitle, item })}
            onDeleteItem={handleDelete}
            onAddToShoppingItem={handleAddMealPlanItemToShopping}
          />
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2.5}>
            <MealPlanMacroBalanceCard
              title={t("mealPlan.section.macroBalance")}
              items={macroDistribution}
              total={macroTotal}
            />

            <MealPlanSummaryCard
              title={t("mealPlan.section.summary")}
              completion={completion}
              completionLabel={t("mealPlan.cards.completion")}
              proteinLabel={t("mealPlan.macro.protein")}
              fatLabel={t("mealPlan.macro.fat")}
              carbsLabel={t("mealPlan.macro.carbs")}
              proteinValue={day?.totals.proteinG ?? 0}
              fatValue={day?.totals.fatG ?? 0}
              carbsValue={day?.totals.carbsG ?? 0}
            />
          </Stack>
        </Grid>
      </Grid>

      <MealPlanItemDialog
        open={Boolean(dialogState)}
        mode={dialogState?.mode ?? "add"}
        sectionTitle={dialogState?.sectionTitle ?? ""}
        initialItemType={dialogState?.item?.type ?? "product"}
        item={dialogState?.item}
        recipes={recipes}
        products={products}
        isSubmitting={isMutating}
        errorMessage={mutationError}
        onClose={() => {
          setDialogState(null);
          setMutationError(null);
        }}
        onSubmit={handleSubmitDialog}
      />
    </Stack>
  );
}
