import { Alert, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { getRecipe, getRecipes } from "../features/recipes/api/recipesApi";
import type { RecipeSummary } from "../features/recipes/model/recipeTypes";
import { getCurrentUserSettings } from "../features/settings/api/settingsApi";
import {
  addMealPlanItemToShoppingList,
  addRecipeToShoppingList
} from "../features/shopping/api/shoppingApi";
import {
  addProductToMealPlan,
  addRecipeToMealPlan,
  removeMealPlanItem,
  type MealPlanItem,
  updateMealPlanItem
} from "../features/meal-plan/api/mealPlanApi";
import { useMealPlanDashboard } from "../features/meal-plan/hooks/useMealPlanDashboard";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { MealPlanDayNavigator } from "../widgets/meal-plan/day-navigator";
import { MealPlanItemDialog } from "../widgets/meal-plan/MealPlanItemDialog";
import { MealPlanMacroBalanceCard } from "../widgets/meal-plan/MealPlanMacroBalanceCard";
import { MealPlanSectionsCard } from "../widgets/meal-plan/MealPlanSectionsCard";
import { MealPlanSummaryCard } from "../widgets/meal-plan/MealPlanSummaryCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

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
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [targetMacros, setTargetMacros] = useState({ protein: 0, fat: 0, carbs: 0 });

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

  useEffect(() => {
    let cancelled = false;

    async function loadUserTargets() {
      try {
        const settings = await getCurrentUserSettings();
        if (!cancelled) {
          setTargetCalories(settings.profile.targetCalories ?? 0);
          setTargetMacros({
            protein: settings.profile.targetProteinG ?? 0,
            fat: settings.profile.targetFatG ?? 0,
            carbs: settings.profile.targetCarbsG ?? 0
          });
        }
      } catch (error) {
        console.error("Failed to load user targets", error);
      }
    }

    void loadUserTargets();

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

  const macroDistribution = [
    {
      key: "protein",
      label: t("mealPlan.macro.protein"),
      value: day?.totals.proteinG ?? 0,
      target: targetMacros.protein,
      color: "#ffb547"
    },
    {
      key: "fat",
      label: t("mealPlan.macro.fat"),
      value: day?.totals.fatG ?? 0,
      target: targetMacros.fat,
      color: "#d58bff"
    },
    {
      key: "carbs",
      label: t("mealPlan.macro.carbs"),
      value: day?.totals.carbsG ?? 0,
      target: targetMacros.carbs,
      color: "#4dd6e3"
    }
  ];
  const usedCalories = day?.totals.caloriesKcal ?? 0;
  const remainingCalories = targetCalories - usedCalories;

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
        <Grid size={{ xs: 12, lg: 7 }}>
          <MealPlanSummaryCard
            title={t("mealPlan.cards.totalCalories")}
            goalValue={targetCalories}
            usedValue={usedCalories}
            remainingValue={remainingCalories}
            goalLabel={t("mealPlan.cards.goal")}
            usedLabel={t("mealPlan.cards.used")}
            remainingLabel={t("mealPlan.cards.remaining")}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <MealPlanMacroBalanceCard
            title={t("mealPlan.section.macroBalance")}
            items={macroDistribution}
            leftLabel={t("mealPlan.macro.left")}
            overLabel={t("mealPlan.macro.over")}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
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
