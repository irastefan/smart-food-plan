import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { getBodyMetricsDay, getBodyMetricsHistory, upsertBodyMetrics, type BodyMetricsEntry } from "../features/body-metrics/api/bodyMetricsApi";
import { getProducts, type ProductSummary } from "../features/products/api/productsApi";
import { getRecipes } from "../features/recipes/api/recipesApi";
import type { RecipeSummary } from "../features/recipes/model/recipeTypes";
import { getCurrentUserSettings } from "../features/settings/api/settingsApi";
import {
  addMealPlanItemToShoppingList,
  addShoppingCategory,
  getShoppingList
} from "../features/shopping/api/shoppingApi";
import {
  addManualItemToMealPlan,
  addManualItemsToMealPlan,
  addProductToMealPlan,
  addRecipeToMealPlan,
  copyMealPlanSectionToDate,
  removeMealPlanItem,
  saveMealPlanSectionAsRecipe,
  type MealPlanHistoryItem,
  type MealPlanItem,
  type MealPlanSection,
  updateMealPlanItem
} from "../features/meal-plan/api/mealPlanApi";
import { useMealPlanDashboard } from "../features/meal-plan/hooks/useMealPlanDashboard";
import { getAppPreferences } from "../shared/config/appPreferences";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { PageActionButton } from "../shared/ui/PageActionButton";
import { PageTitle } from "../shared/ui/PageTitle";
import { getMacroColor } from "../shared/theme/macroColors";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { MealPlanAnalysisDialog } from "../widgets/meal-plan/MealPlanAnalysisDialog";
import { MealPlanAssistantDialog } from "../widgets/meal-plan/MealPlanAssistantDialog";
import { MealPlanBodyMetricsCard } from "../widgets/meal-plan/MealPlanBodyMetricsCard";
import { MealPlanDayNavigator } from "../widgets/meal-plan/day-navigator";
import { MealPlanItemDialog } from "../widgets/meal-plan/MealPlanItemDialog";
import { MealPlanMacroBalanceCard } from "../widgets/meal-plan/MealPlanMacroBalanceCard";
import { MealPlanSectionsCard } from "../widgets/meal-plan/MealPlanSectionsCard";
import { MealPlanSummaryCard } from "../widgets/meal-plan/MealPlanSummaryCard";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageAgentAction: (action: (() => void) | null) => void;
  clearPageAgentAction: () => void;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

type BodyMetricsDraft = {
  weightKg: string;
  neckCm: string;
  bustCm: string;
  underbustCm: string;
  waistCm: string;
  hipsCm: string;
  bicepsCm: string;
  forearmCm: string;
  thighCm: string;
  calfCm: string;
};

function emptyBodyMetricsDraft(): BodyMetricsDraft {
  return {
    weightKg: "",
    neckCm: "",
    bustCm: "",
    underbustCm: "",
    waistCm: "",
    hipsCm: "",
    bicepsCm: "",
    forearmCm: "",
    thighCm: "",
    calfCm: ""
  };
}

function toDraft(entry: BodyMetricsEntry | null): BodyMetricsDraft {
  return {
    weightKg: entry?.weightKg != null ? String(entry.weightKg) : "",
    neckCm: entry?.measurements?.neckCm != null ? String(entry.measurements.neckCm) : "",
    bustCm: entry?.measurements?.bustCm != null ? String(entry.measurements.bustCm) : "",
    underbustCm: entry?.measurements?.underbustCm != null ? String(entry.measurements.underbustCm) : "",
    waistCm: entry?.measurements?.waistCm != null ? String(entry.measurements.waistCm) : "",
    hipsCm: entry?.measurements?.hipsCm != null ? String(entry.measurements.hipsCm) : "",
    bicepsCm: entry?.measurements?.bicepsCm != null ? String(entry.measurements.bicepsCm) : "",
    forearmCm: entry?.measurements?.forearmCm != null ? String(entry.measurements.forearmCm) : "",
    thighCm: entry?.measurements?.thighCm != null ? String(entry.measurements.thighCm) : "",
    calfCm: entry?.measurements?.calfCm != null ? String(entry.measurements.calfCm) : ""
  };
}

function toOptionalNumber(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return undefined;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function MealPlanDashboardPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageAgentAction, clearPageAgentAction, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const { selectedDate, setSelectedDate, day, setDay, isLoading, errorMessage, refresh } = useMealPlanDashboard();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [dialogState, setDialogState] = useState<{
    mode: "add" | "edit";
    sectionId: string;
    sectionTitle: string;
    item?: MealPlanItem | null;
  } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [shoppingCategories, setShoppingCategories] = useState<string[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [targetMacros, setTargetMacros] = useState({ protein: 0, fat: 0, carbs: 0 });
  const [pendingDelete, setPendingDelete] = useState<{ sectionId: string; item: MealPlanItem } | null>(null);
  const [pendingSaveRecipe, setPendingSaveRecipe] = useState<MealPlanSection | null>(null);
  const [recipeTitle, setRecipeTitle] = useState("");
  const [pendingCopySection, setPendingCopySection] = useState<MealPlanSection | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState(selectedDate);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [bodyMetricsDraft, setBodyMetricsDraft] = useState<BodyMetricsDraft>(emptyBodyMetricsDraft());
  const [bodyMetricsHistory, setBodyMetricsHistory] = useState<BodyMetricsEntry[]>([]);
  const [isBodyMetricsSaving, setIsBodyMetricsSaving] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<
    | { scope: "day"; label: string }
    | { scope: "section"; label: string; section: MealPlanSection }
    | null
  >(null);
  const [pageAssistantOpen, setPageAssistantOpen] = useState(false);

  function handleClosePageAssistant() {
    setPageAssistantOpen(false);
  }

  useEffect(() => {
    registerPageAgentAction(() => setPageAssistantOpen(true));
    return () => {
      clearPageAgentAction();
    };
  }, [clearPageAgentAction, registerPageAgentAction]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

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

  useEffect(() => {
    setCopyTargetDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;

    async function loadBodyMetrics() {
      try {
        const preferences = getAppPreferences();
        const [daily, history] = await Promise.all([
          getBodyMetricsDay(selectedDate),
          getBodyMetricsHistory({ toDate: selectedDate, limitDays: preferences.bodyMetricsHistoryDays })
        ]);

        if (!cancelled) {
          setBodyMetricsDraft(toDraft(daily));
          setBodyMetricsHistory(history);
        }
      } catch (error) {
        console.error("Failed to load body metrics", error);
      }
    }

    void loadBodyMetrics();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

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
      color: getMacroColor("protein")
    },
    {
      key: "fat",
      label: t("mealPlan.macro.fat"),
      value: day?.totals.fatG ?? 0,
      target: targetMacros.fat,
      color: getMacroColor("fat")
    },
    {
      key: "carbs",
      label: t("mealPlan.macro.carbs"),
      value: day?.totals.carbsG ?? 0,
      target: targetMacros.carbs,
      color: getMacroColor("carbs")
    }
  ];
  const usedCalories = day?.totals.caloriesKcal ?? 0;
  const remainingCalories = targetCalories - usedCalories;
  const hasAnyMealItems = Boolean(day?.sections.some((section) => section.items.length > 0));
  const appPreferences = getAppPreferences();
  const mealPlanSummaryMetric = appPreferences.mealPlanSummaryMetric;
  const summaryCenterValue = mealPlanSummaryMetric === "food" ? usedCalories : remainingCalories;
  const summaryCenterLabel = mealPlanSummaryMetric === "food" ? t("mealPlan.cards.used") : t("mealPlan.cards.remaining");

  async function handleSubmitDialog(payload: {
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
            : payload.type === "manual" && payload.name
              ? await addManualItemToMealPlan(selectedDate, dialogState.sectionId, {
                  name: payload.name,
                  amount: payload.quantity ?? 100,
                  unit: payload.unit ?? "g",
                  kcal100: payload.kcal100 ?? 0,
                  protein100: payload.protein100 ?? 0,
                  fat100: payload.fat100 ?? 0,
                  carbs100: payload.carbs100 ?? 0
                })
            : payload.recipe
              ? await addRecipeToMealPlan(selectedDate, dialogState.sectionId, payload.recipe, {
                  servings: payload.servings
                })
              : day;
      } else if (dialogState.item) {
        nextDay = await updateMealPlanItem(selectedDate, dialogState.sectionId, dialogState.item, {
          quantity: payload.type === "product" || payload.type === "manual" ? payload.quantity : undefined,
          unit: payload.type === "product" || payload.type === "manual" ? payload.unit ?? "g" : undefined,
          servings: payload.type === "recipe" ? payload.servings : undefined,
          name: payload.type === "manual" ? payload.name : undefined,
          kcal100: payload.type === "manual" ? payload.kcal100 : undefined,
          protein100: payload.type === "manual" ? payload.protein100 : undefined,
          fat100: payload.type === "manual" ? payload.fat100 : undefined,
          carbs100: payload.type === "manual" ? payload.carbs100 : undefined
        });
      }

      setDay(nextDay);
      setDialogState(null);
      setFeedback({ type: "success", message: t("mealPlan.status.itemAdded") });
    } catch (error) {
      console.error("Failed to update meal plan item", error);
      setMutationError(t("mealPlan.dialog.saveError"));
      setFeedback({ type: "error", message: t("mealPlan.dialog.saveError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSubmitMultipleManualItems(
    items: Array<{
      name: string;
      amount: number;
      unit: string;
      kcal100: number;
      protein100: number;
      fat100: number;
      carbs100: number;
    }>
  ) {
    if (!dialogState || items.length === 0) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);
      const nextDay = await addManualItemsToMealPlan(selectedDate, dialogState.sectionId, items);
      setDay(nextDay);
      setDialogState(null);
      setFeedback({ type: "success", message: t("mealPlan.status.itemsAdded") });
    } catch (error) {
      console.error("Failed to add multiple meal plan items", error);
      setMutationError(t("mealPlan.dialog.saveError"));
      setFeedback({ type: "error", message: t("mealPlan.dialog.saveError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAppendManualItems(
    items: Array<{
      name: string;
      amount: number;
      unit: string;
      kcal100: number;
      protein100: number;
      fat100: number;
      carbs100: number;
    }>
  ) {
    if (!dialogState || items.length === 0) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);
      const nextDay = await addManualItemsToMealPlan(selectedDate, dialogState.sectionId, items);
      setDay(nextDay);
      setFeedback({ type: "success", message: t("mealPlan.status.itemAdded") });
    } catch (error) {
      console.error("Failed to append meal plan items", error);
      setMutationError(t("mealPlan.dialog.saveError"));
      setFeedback({ type: "error", message: t("mealPlan.dialog.saveError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSubmitHistoryItem(item: MealPlanHistoryItem) {
    if (!dialogState) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);

      const nextDay =
        item.type === "recipe" && item.recipeId
          ? await addRecipeToMealPlan(
              selectedDate,
              dialogState.sectionId,
              {
                id: item.recipeId,
                slug: item.recipeId,
                title: item.title,
                category: "all",
                servings: item.servings ?? 1,
                nutritionTotal: item.nutritionTotal,
                nutritionPerServing: item.nutritionTotal
              },
              { servings: item.servings ?? 1 }
            )
          : item.type === "product" && !item.isManual && item.productId
            ? await addProductToMealPlan(
                selectedDate,
                dialogState.sectionId,
                {
                  id: item.productId,
                  slug: item.productId,
                  title: item.title,
                  nutritionPer100g: item.nutritionPer100 ?? {
                    caloriesKcal: 0,
                    proteinG: 0,
                    fatG: 0,
                    carbsG: 0
                  }
                },
                {
                  quantity: item.amount ?? 100,
                  unit: item.unit ?? "g"
                }
              )
            : await addManualItemToMealPlan(selectedDate, dialogState.sectionId, {
                name: item.title,
                amount: item.amount ?? 100,
                unit: item.unit ?? "g",
                kcal100: item.nutritionPer100?.caloriesKcal ?? 0,
                protein100: item.nutritionPer100?.proteinG ?? 0,
                fat100: item.nutritionPer100?.fatG ?? 0,
                carbs100: item.nutritionPer100?.carbsG ?? 0
              });

      setDay(nextDay);
      setDialogState(null);
      setFeedback({ type: "success", message: t("mealPlan.status.itemAdded") });
    } catch (error) {
      console.error("Failed to add meal plan history item", error);
      setMutationError(t("mealPlan.dialog.saveError"));
      setFeedback({ type: "error", message: t("mealPlan.dialog.saveError") });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!pendingDelete) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);
      const nextDay = await removeMealPlanItem(selectedDate, pendingDelete.item);
      setDay(nextDay);
    } catch (error) {
      console.error("Failed to delete meal plan item", error);
      setMutationError(t("mealPlan.dialog.deleteError"));
    } finally {
      setIsMutating(false);
      setPendingDelete(null);
    }
  }

  async function handleAddMealPlanItemToShopping(_sectionId: string, item: MealPlanItem, categoryName: string) {
    setIsMutating(true);
    try {
      await addMealPlanItemToShoppingList(item, { categoryName });
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCreateShoppingCategory(name: string) {
    await addShoppingCategory(name);
    setShoppingCategories((current) => Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b)));
  }

  async function handleSaveSectionAsRecipe() {
    if (!pendingSaveRecipe || !recipeTitle.trim()) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);
      await saveMealPlanSectionAsRecipe(pendingSaveRecipe, recipeTitle);
      setPendingSaveRecipe(null);
      setRecipeTitle("");
    } catch (error) {
      console.error("Failed to save meal plan section as recipe", error);
      setMutationError(t("mealPlan.status.saveRecipeError"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCopySection() {
    if (!pendingCopySection || !copyTargetDate) {
      return;
    }

    try {
      setIsMutating(true);
      setMutationError(null);
      await copyMealPlanSectionToDate(pendingCopySection, copyTargetDate);
      setPendingCopySection(null);
      if (copyTargetDate === selectedDate) {
        await refresh();
      } else {
        setSelectedDate(copyTargetDate);
      }
    } catch (error) {
      console.error("Failed to copy meal plan section", error);
      setMutationError(t("mealPlan.status.copyMealError"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSaveBodyMetrics() {
    try {
      setIsBodyMetricsSaving(true);
      const saved = await upsertBodyMetrics({
        date: selectedDate,
        weightKg: toOptionalNumber(bodyMetricsDraft.weightKg),
        neckCm: toOptionalNumber(bodyMetricsDraft.neckCm),
        bustCm: toOptionalNumber(bodyMetricsDraft.bustCm),
        underbustCm: toOptionalNumber(bodyMetricsDraft.underbustCm),
        waistCm: toOptionalNumber(bodyMetricsDraft.waistCm),
        hipsCm: toOptionalNumber(bodyMetricsDraft.hipsCm),
        bicepsCm: toOptionalNumber(bodyMetricsDraft.bicepsCm),
        forearmCm: toOptionalNumber(bodyMetricsDraft.forearmCm),
        thighCm: toOptionalNumber(bodyMetricsDraft.thighCm),
        calfCm: toOptionalNumber(bodyMetricsDraft.calfCm)
      });

      setBodyMetricsDraft(toDraft(saved));
      const preferences = getAppPreferences();
      const history = await getBodyMetricsHistory({ toDate: selectedDate, limitDays: preferences.bodyMetricsHistoryDays });
      setBodyMetricsHistory(history);
      setFeedback({ type: "success", message: t("bodyMetrics.saved") });
    } catch (error) {
      console.error("Failed to save body metrics", error);
      setFeedback({ type: "error", message: t("bodyMetrics.saveError") });
    } finally {
      setIsBodyMetricsSaving(false);
    }
  }

  return (
    <Stack spacing={{ xs: 1, md: 3 }} flex={1} sx={{ mt: { xs: -1.1, md: 0 } }}>
      <DashboardTopbar
        onOpenSidebar={openSidebar}
        title={t("mealPlan.dashboard.title")}
        subtitle={t("mealPlan.dashboard.subtitle")}
      />
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
        spacing={2}
        sx={{ mt: { xs: 0, md: 0 } }}
      >
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <PageTitle title={t("mealPlan.dashboard.title")} />
        </Box>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ xs: "stretch", lg: "stretch" }} sx={{ width: { xs: "100%", lg: "auto" }, ml: { lg: "auto" } }}>
          <Box sx={{ width: { xs: "100%", lg: 420 }, maxWidth: { lg: "100%" } }}>
            <MealPlanDayNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </Box>
          <Box sx={{ display: { xs: "none", lg: "flex" }, alignSelf: "stretch" }}>
            <PageActionButton
              icon={<SmartToyRoundedIcon fontSize="small" />}
              label={t("aiAgent.title")}
              onClick={() => setPageAssistantOpen(true)}
              variant="agent"
              sx={{ minHeight: "100%", px: 1.6 }}
            />
          </Box>
        </Stack>
      </Stack>

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {mutationError ? <Alert severity="error">{mutationError}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <MealPlanSummaryCard
            title={t("mealPlan.cards.totalCalories")}
            goalValue={targetCalories}
            usedValue={usedCalories}
            remainingValue={remainingCalories}
            centerValue={summaryCenterValue}
            centerLabel={summaryCenterLabel}
            goalLabel={t("mealPlan.cards.goal")}
            usedLabel={t("mealPlan.cards.used")}
            remainingLabel={t("mealPlan.cards.remaining")}
            showAnalyze={hasAnyMealItems}
            onAnalyze={() => setAnalysisTarget({ scope: "day", label: t("mealPlan.analysis.dayLabel") })}
          />
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <MealPlanMacroBalanceCard
            title={t("mealPlan.section.macroBalance")}
            items={macroDistribution}
            leftLabel={t("mealPlan.macro.left")}
            overLabel={t("mealPlan.macro.over")}
          />
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <MealPlanBodyMetricsCard
            date={selectedDate}
            draft={bodyMetricsDraft}
            history={bodyMetricsHistory}
            historyDays={appPreferences.bodyMetricsHistoryDays}
            visibleFields={appPreferences.visibleBodyMetricFields}
            isSaving={isBodyMetricsSaving}
            onChange={setBodyMetricsDraft}
            onSave={() => void handleSaveBodyMetrics()}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <MealPlanSectionsCard
            day={day}
            shoppingCategories={shoppingCategories}
            title={t("mealPlan.section.dailyFlow")}
            subtitle={t("mealPlan.section.dailyFlowHint")}
            itemsLabel={t("mealPlan.cards.items")}
            servingsLabel={t("mealPlan.servings")}
            emptyLabel={t("mealPlan.emptySection")}
            addLabel={t("mealPlan.actions.add")}
            editLabel={t("mealPlan.actions.edit")}
            deleteLabel={t("mealPlan.actions.delete")}
            onCreateShoppingCategory={handleCreateShoppingCategory}
            onAddItem={(sectionId, sectionTitle) => setDialogState({ mode: "add", sectionId, sectionTitle })}
            onEditItem={(sectionId, sectionTitle, item) => setDialogState({ mode: "edit", sectionId, sectionTitle, item })}
            onDeleteItem={(sectionId, item) => setPendingDelete({ sectionId, item })}
            onAddToShoppingItem={handleAddMealPlanItemToShopping}
            onAnalyzeSection={(section) => setAnalysisTarget({ scope: "section", label: section.title, section })}
            onSaveSectionAsRecipe={(section) => {
              setRecipeTitle(`${section.title} ${selectedDate}`);
              setPendingSaveRecipe(section);
            }}
            onCopySection={(section) => {
              setCopyTargetDate(selectedDate);
              setPendingCopySection(section);
            }}
          />
        </Grid>
      </Grid>

      <MealPlanItemDialog
        open={Boolean(dialogState)}
        mode={dialogState?.mode ?? "add"}
        sectionTitle={dialogState?.sectionTitle ?? ""}
        initialItemType={dialogState?.item?.isManual ? "manual" : dialogState?.item?.type ?? "product"}
        anchorDate={selectedDate}
        item={dialogState?.item}
        recipes={recipes}
        products={products}
        existingItems={day?.sections.find((section) => section.id === dialogState?.sectionId)?.items.map((entry) => entry.title) ?? []}
        isSubmitting={isMutating}
        errorMessage={mutationError}
        onClose={() => {
          setDialogState(null);
          setMutationError(null);
        }}
        onSubmitMultipleManualItems={handleSubmitMultipleManualItems}
        onAppendManualItems={handleAppendManualItems}
        onSubmitHistoryItem={handleSubmitHistoryItem}
        onSubmit={handleSubmitDialog}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        title={t("mealPlan.actions.delete")}
        message={t("mealPlan.confirmDelete", { name: pendingDelete?.item.title ?? "" })}
        isSubmitting={isMutating}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDeleteConfirmed()}
      />

      <Dialog open={Boolean(pendingSaveRecipe)} onClose={isMutating ? undefined : () => setPendingSaveRecipe(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t("mealPlan.actions.saveAsRecipe")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {t("mealPlan.saveRecipe.description", { section: pendingSaveRecipe?.title ?? "" })}
            </Typography>
            <TextField
              autoFocus
              label={t("recipe.form.title")}
              value={recipeTitle}
              onChange={(event) => setRecipeTitle(event.target.value)}
              disabled={isMutating}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPendingSaveRecipe(null)} disabled={isMutating}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={() => void handleSaveSectionAsRecipe()} disabled={isMutating || recipeTitle.trim().length === 0}>
            {t("recipe.form.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pendingCopySection)} onClose={isMutating ? undefined : () => setPendingCopySection(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t("mealPlan.actions.copyMeal")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {t("mealPlan.copyMeal.description", { section: pendingCopySection?.title ?? "" })}
            </Typography>
            <TextField
              type="date"
              label={t("mealPlan.dayNav.selectDay")}
              value={copyTargetDate}
              onChange={(event) => setCopyTargetDate(event.target.value)}
              disabled={isMutating}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPendingCopySection(null)} disabled={isMutating}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={() => void handleCopySection()} disabled={isMutating || !copyTargetDate}>
            {t("mealPlan.copyMeal.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={2500} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={feedback?.type ?? "success"} onClose={() => setFeedback(null)} sx={{ width: "100%" }}>
          {feedback?.message}
        </Alert>
      </Snackbar>

      <MealPlanAnalysisDialog
        open={Boolean(analysisTarget)}
        scope={analysisTarget?.scope ?? "day"}
        label={analysisTarget?.label ?? ""}
        day={analysisTarget?.scope === "day" ? day : undefined}
        section={analysisTarget?.scope === "section" ? analysisTarget.section : undefined}
        targets={{
          calories: targetCalories,
          protein: targetMacros.protein,
          fat: targetMacros.fat,
          carbs: targetMacros.carbs
        }}
        onClose={() => setAnalysisTarget(null)}
      />
      <MealPlanAssistantDialog
        open={pageAssistantOpen}
        date={selectedDate}
        day={day}
        onDataChanged={refresh}
        onClose={handleClosePageAssistant}
      />
    </Stack>
  );
}
