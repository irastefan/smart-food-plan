import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "../../features/products/api/productsApi";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import type { MealPlanItem } from "../../features/meal-plan/api/mealPlanApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { runMealPlanAssistant, type MealPlanAssistantProposal } from "../../features/ai/api/mealPlanAssistantApi";
import { getAiAgentSettings } from "../../shared/config/aiAgent";
import { AiAssistantPanel } from "../ai/AiAssistantPanel";

type MealPlanItemDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  sectionTitle: string;
  initialItemType?: "product" | "recipe" | "manual";
  item?: MealPlanItem | null;
  recipes: RecipeSummary[];
  products: ProductSummary[];
  existingItems?: string[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onDataChanged?: () => void;
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

type DialogTab = "ai" | "product" | "recipe" | "manual";

function inferManualNutritionPer100(item?: MealPlanItem | null) {
  if (!item?.isManual || item.type !== "product") {
    return { kcal100: 0, protein100: 0, fat100: 0, carbs100: 0 };
  }

  if (item.nutritionPer100) {
    return {
      kcal100: item.nutritionPer100.caloriesKcal ?? 0,
      protein100: item.nutritionPer100.proteinG ?? 0,
      fat100: item.nutritionPer100.fatG ?? 0,
      carbs100: item.nutritionPer100.carbsG ?? 0
    };
  }

  const amount = item.amount ?? 0;
  const factor = amount > 0 ? 100 / amount : 0;

  return {
    kcal100: Math.round(item.nutritionTotal.caloriesKcal * factor),
    protein100: Math.round(item.nutritionTotal.proteinG * factor),
    fat100: Math.round(item.nutritionTotal.fatG * factor),
    carbs100: Math.round(item.nutritionTotal.carbsG * factor)
  };
}

export function MealPlanItemDialog({
  open,
  mode,
  sectionTitle,
  initialItemType = "product",
  item,
  recipes,
  products,
  existingItems = [],
  isSubmitting,
  errorMessage,
  onClose,
  onDataChanged,
  onSubmit
}: MealPlanItemDialogProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const agentSettings = getAiAgentSettings();
  const [activeTab, setActiveTab] = useState<DialogTab>("ai");
  const [accessMode, setAccessMode] = useState(agentSettings.accessMode);

  const [selectedProductId, setSelectedProductId] = useState(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
  const [selectedRecipeId, setSelectedRecipeId] = useState(item?.type === "recipe" ? item.recipeId ?? "" : "");
  const [quantity, setQuantity] = useState(item?.type === "product" ? item.amount ?? 100 : 100);
  const [servings, setServings] = useState(item?.type === "recipe" ? item.servings ?? 1 : 1);
  const initialManualNutrition = inferManualNutritionPer100(item);
  const [manualName, setManualName] = useState(item?.isManual ? item.title : "");
  const [manualUnit, setManualUnit] = useState(item?.isManual ? item.unit ?? "g" : "g");
  const [manualKcal100, setManualKcal100] = useState(item?.isManual ? initialManualNutrition.kcal100 : 0);
  const [manualProtein100, setManualProtein100] = useState(item?.isManual ? initialManualNutrition.protein100 : 0);
  const [manualFat100, setManualFat100] = useState(item?.isManual ? initialManualNutrition.fat100 : 0);
  const [manualCarbs100, setManualCarbs100] = useState(item?.isManual ? initialManualNutrition.carbs100 : 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab(mode === "edit" ? (item?.isManual ? "manual" : item?.type ?? initialItemType) : "ai");
    setAccessMode(getAiAgentSettings().accessMode);
    setSelectedProductId(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
    setSelectedRecipeId(item?.type === "recipe" ? item.recipeId ?? "" : "");
    setQuantity(item?.type === "product" ? item.amount ?? 100 : 100);
    setServings(item?.type === "recipe" ? item.servings ?? 1 : 1);
    setManualName(item?.isManual ? item.title : "");
    setManualUnit(item?.isManual ? item.unit ?? "g" : "g");
    const nextManualNutrition = inferManualNutritionPer100(item);
    setManualKcal100(item?.isManual ? nextManualNutrition.kcal100 : 0);
    setManualProtein100(item?.isManual ? nextManualNutrition.protein100 : 0);
    setManualFat100(item?.isManual ? nextManualNutrition.fat100 : 0);
    setManualCarbs100(item?.isManual ? nextManualNutrition.carbs100 : 0);
  }, [initialItemType, item, mode, open]);

  const selectedProduct = useMemo(() => products.find((entry) => entry.id === selectedProductId) ?? null, [products, selectedProductId]);
  const selectedRecipe = useMemo(() => recipes.find((entry) => entry.id === selectedRecipeId) ?? null, [recipes, selectedRecipeId]);

  function submitProduct() {
    if (!selectedProduct) return;
    onSubmit({ type: "product", product: selectedProduct, quantity });
  }

  function submitRecipe() {
    if (!selectedRecipe) return;
    onSubmit({ type: "recipe", recipe: selectedRecipe, servings });
  }

  function submitManual(nextProposal?: MealPlanAssistantProposal | null) {
    const source = nextProposal ?? {
      name: manualName.trim(),
      amount: quantity,
      unit: manualUnit,
      kcal100: manualKcal100,
      protein100: manualProtein100,
      fat100: manualFat100,
      carbs100: manualCarbs100
    };

    if (!source.name.trim()) {
      return;
    }

    onSubmit({
      type: "manual",
      name: source.name.trim(),
      quantity: source.amount,
      unit: source.unit || "g",
      kcal100: source.kcal100,
      protein100: source.protein100,
      fat100: source.fat100,
      carbs100: source.carbs100
    });
  }

  const title = mode === "add" ? t("mealPlan.dialog.addTitle", { section: sectionTitle }) : t("mealPlan.dialog.editTitle", { section: sectionTitle });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: isMobile
          ? undefined
          : {
              width: "76vw",
              maxWidth: 1180,
              height: "84vh",
              maxHeight: "84vh",
              borderRadius: 1.5,
              overflow: "hidden"
            }
      }}
    >
      <DialogTitle sx={{ pr: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={onClose} edge="start" size="small">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography component="span" variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 0, md: 2 }, pb: 0 }}>
        <Stack sx={{ height: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={(_event, nextValue: DialogTab) => setActiveTab(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ px: { xs: 1, md: 0 }, borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Tab value="ai" label={t("mealPlan.dialog.ai")} icon={<AutoAwesomeRoundedIcon fontSize="small" />} iconPosition="start" />
            <Tab value="product" label={t("mealPlan.dialog.product")} />
            <Tab value="recipe" label={t("mealPlan.dialog.recipe")} />
            <Tab value="manual" label={t("mealPlan.dialog.manual")} />
          </Tabs>

          <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2, md: 0 }, py: 2.5 }}>
            {activeTab === "ai" ? (
              <Stack spacing={2.5} sx={{ maxWidth: 980, mx: "auto" }}>
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                <AiAssistantPanel
                  speechLanguage={agentSettings.speechLanguage}
                  showToolOutput={false}
                  placeholder={t("aiAgent.placeholder")}
                  submitLabel={t("aiAgent.send")}
                  missingApiKeyMessage={t("aiAgent.status.missingApiKey")}
                  onRun={async ({ apiKey, payload, messages }) => {
                    const normalizedText = payload.text.trim();
                    const userText =
                      normalizedText.length > 0
                        ? normalizedText
                        : payload.images.length > 0
                          ? t("aiAgent.imageOnlyPrompt")
                          : "";

                    const result = await runMealPlanAssistant({
                      apiKey,
                      model: agentSettings.model,
                      history: messages,
                      sectionTitle,
                      existingItems,
                      accessMode,
                      userText,
                      images: payload.images,
                      userInstructions: agentSettings.userInstructions
                    });

                    return {
                      appendedMessages: [result.assistantMessage],
                      extra: result
                    };
                  }}
                  onExtraResult={(result) => {
                    const nextProposal = result?.proposal ?? null;

                    if (nextProposal) {
                      setManualName(nextProposal.name);
                      setQuantity(nextProposal.amount);
                      setManualUnit(nextProposal.unit);
                      setManualKcal100(nextProposal.kcal100);
                      setManualProtein100(nextProposal.protein100);
                      setManualFat100(nextProposal.fat100);
                      setManualCarbs100(nextProposal.carbs100);

                      if (result?.needsConfirmation) {
                        setActiveTab("manual");
                      }
                    }

                    if (result?.proposal && !result.needsConfirmation && accessMode === "full") {
                      submitManual(result.proposal);
                      onDataChanged?.();
                    }
                  }}
                  renderTop={() => (
                    <Stack spacing={2.5}>
                      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
                        <Stack spacing={0.5}>
                          <Typography variant="h6" fontWeight={800}>{t("mealPlan.ai.title")}</Typography>
                          <Typography color="text.secondary">{t("mealPlan.ai.subtitle")}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
                          <Typography variant="body2" color="text.secondary">{t("mealPlan.ai.accessMode")}</Typography>
                          <Typography variant="body2" color={accessMode === "limited" ? "text.primary" : "text.secondary"}>
                            {t("mealPlan.ai.mode.limited")}
                          </Typography>
                          <Switch
                            checked={accessMode === "full"}
                            onChange={(event) => setAccessMode(event.target.checked ? "full" : "limited")}
                          />
                          <Typography variant="body2" color={accessMode === "full" ? "text.primary" : "text.secondary"}>
                            {t("mealPlan.ai.mode.full")}
                          </Typography>
                        </Stack>
                      </Stack>

                    </Stack>
                  )}
                />
              </Stack>
            ) : null}

            {activeTab === "product" ? (
              <Stack spacing={2.5} sx={{ maxWidth: 760, mx: "auto" }}>
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
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
                <Box>
                  <Button onClick={submitProduct} variant="contained" disabled={isSubmitting || !selectedProduct}>
                    {mode === "add" ? t("mealPlan.dialog.addAction") : t("mealPlan.dialog.saveAction")}
                  </Button>
                </Box>
              </Stack>
            ) : null}

            {activeTab === "recipe" ? (
              <Stack spacing={2.5} sx={{ maxWidth: 760, mx: "auto" }}>
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
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
                <Box>
                  <Button onClick={submitRecipe} variant="contained" disabled={isSubmitting || !selectedRecipe}>
                    {mode === "add" ? t("mealPlan.dialog.addAction") : t("mealPlan.dialog.saveAction")}
                  </Button>
                </Box>
              </Stack>
            ) : null}

            {activeTab === "manual" ? (
              <Stack spacing={2.5} sx={{ maxWidth: 760, mx: "auto" }}>
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
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
                <Box>
                  <Button onClick={() => submitManual()} variant="contained" disabled={isSubmitting || !manualName.trim()}>
                    {mode === "add" ? t("mealPlan.dialog.addAction") : t("mealPlan.dialog.saveAction")}
                  </Button>
                </Box>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
