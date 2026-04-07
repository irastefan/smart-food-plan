import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import type { ProductSummary } from "../../features/products/api/productsApi";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import { getMealPlanHistory, type MealPlanHistoryItem, type MealPlanItem } from "../../features/meal-plan/api/mealPlanApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { runMealPlanAssistant, type MealPlanAssistantProposal } from "../../features/ai/api/mealPlanAssistantApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { isRtlLanguage } from "../../shared/i18n/languages";
import { getLocalizedUnitLabel, getUnitOptions, normalizeUnitValue } from "../../shared/lib/units";
import { AgentWorkspace } from "../ai/AgentWorkspace";

type MealPlanItemDialogProps = {
  open: boolean;
  mode: "add" | "edit";
  sectionTitle: string;
  initialItemType?: "product" | "recipe" | "manual";
  anchorDate: string;
  item?: MealPlanItem | null;
  recipes: RecipeSummary[];
  products: ProductSummary[];
  existingItems?: string[];
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmitMultipleManualItems?: (items: MealPlanAssistantProposal[]) => void;
  onAppendManualItems?: (items: MealPlanAssistantProposal[]) => void;
  onSubmitHistoryItem?: (item: MealPlanHistoryItem) => void;
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

type DialogTab = "ai" | "history" | "product" | "recipe" | "manual";

function normalizeUnitKey(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "g" || normalized === "gr" || normalized === "gram" || normalized === "grams" || normalized === "г" || normalized === "гр") {
    return "g";
  }
  if (normalized === "ml" || normalized === "мл") {
    return "ml";
  }
  return normalized;
}

function getProposalTotals(proposal: MealPlanAssistantProposal) {
  const normalizedUnit = normalizeUnitKey(proposal.unit);
  const factor =
    normalizedUnit !== "" && normalizedUnit !== "g" && normalizedUnit !== "gr" && normalizedUnit !== "gram" && normalizedUnit !== "grams" && normalizedUnit !== "ml"
      ? proposal.amount
      : proposal.amount / 100;

  return {
    calories: Math.round(proposal.kcal100 * factor),
    protein: Math.round(proposal.protein100 * factor),
    fat: Math.round(proposal.fat100 * factor),
    carbs: Math.round(proposal.carbs100 * factor)
  };
}

function extractTotalsFromAssistantMessage(message: string): { calories: number; protein: number; fat: number; carbs: number } | null {
  const caloriesMatch = message.match(/(\d+(?:[.,]\d+)?)\s*kcal|(\d+(?:[.,]\d+)?)\s*ккал/i);
  const proteinMatch = message.match(/protein\s*(\d+(?:[.,]\d+)?)\s*g|бел(?:ки)?\s*(\d+(?:[.,]\d+)?)\s*г/i);
  const fatMatch = message.match(/fat\s*(\d+(?:[.,]\d+)?)\s*g|жир(?:ы)?\s*(\d+(?:[.,]\d+)?)\s*г/i);
  const carbsMatch = message.match(/carbs?\s*(\d+(?:[.,]\d+)?)\s*g|углевод(?:ы)?\s*(\d+(?:[.,]\d+)?)\s*г/i);

  const parseMatch = (match: RegExpMatchArray | null): number | null => {
    const raw = match?.[1] ?? match?.[2];
    if (!raw) {
      return null;
    }
    const parsed = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  };

  const calories = parseMatch(caloriesMatch);
  const protein = parseMatch(proteinMatch);
  const fat = parseMatch(fatMatch);
  const carbs = parseMatch(carbsMatch);

  if (calories === null || protein === null || fat === null || carbs === null) {
    return null;
  }

  return { calories, protein, fat, carbs };
}

function parseDecimalInput(value: string, fallback: number, min = 0.1): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, parsed);
}

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
  anchorDate,
  item,
  recipes,
  products,
  existingItems = [],
  isSubmitting,
  errorMessage,
  onClose,
  onSubmitMultipleManualItems,
  onAppendManualItems,
  onSubmitHistoryItem,
  onSubmit
}: MealPlanItemDialogProps) {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRtl = isRtlLanguage(language);
  const agentSettings = getAiAgentSettings();
  const unitOptions = useMemo(() => getUnitOptions((key) => t(key as never)), [t]);
  const [activeTab, setActiveTab] = useState<DialogTab>("ai");
  const [batchItems, setBatchItems] = useState<MealPlanAssistantProposal[]>([]);
  const [singleProposal, setSingleProposal] = useState<MealPlanAssistantProposal | null>(null);
  const [singleProposalTotalsOverride, setSingleProposalTotalsOverride] = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null);
  const [historyItems, setHistoryItems] = useState<MealPlanHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [pendingUiAction, setPendingUiAction] = useState<{ kind: "single" | "batch" | "history"; key: string } | null>(null);

  const [selectedProductId, setSelectedProductId] = useState(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
  const [selectedRecipeId, setSelectedRecipeId] = useState(item?.type === "recipe" ? item.recipeId ?? "" : "");
  const [recipeServingsById, setRecipeServingsById] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(item?.type === "product" ? item.amount ?? 100 : 100);
  const [servings, setServings] = useState(item?.type === "recipe" ? item.servings ?? 1 : 1);
  const initialManualNutrition = inferManualNutritionPer100(item);
  const [manualName, setManualName] = useState(item?.isManual ? item.title : "");
  const [manualUnit, setManualUnit] = useState(item?.isManual ? normalizeUnitValue(item.unit) ?? "g" : "g");
  const [manualKcal100, setManualKcal100] = useState(item?.isManual ? initialManualNutrition.kcal100 : 0);
  const [manualProtein100, setManualProtein100] = useState(item?.isManual ? initialManualNutrition.protein100 : 0);
  const [manualFat100, setManualFat100] = useState(item?.isManual ? initialManualNutrition.fat100 : 0);
  const [manualCarbs100, setManualCarbs100] = useState(item?.isManual ? initialManualNutrition.carbs100 : 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab(mode === "edit" ? (item?.isManual ? "manual" : item?.type ?? initialItemType) : "ai");
    setBatchItems([]);
    setSingleProposal(null);
    setSingleProposalTotalsOverride(null);
    setHistoryError(null);
    setHistoryQuery("");
    setRecipeQuery("");
    setPendingActionKey(null);
    setPendingUiAction(null);
    setSelectedProductId(item?.type === "product" && !item?.isManual ? item.productId ?? "" : "");
    setSelectedRecipeId(item?.type === "recipe" ? item.recipeId ?? "" : "");
    setRecipeServingsById(item?.type === "recipe" && item.recipeId ? { [item.recipeId]: item.servings ?? 1 } : {});
    setQuantity(item?.type === "product" ? item.amount ?? 100 : 100);
    setServings(item?.type === "recipe" ? item.servings ?? 1 : 1);
    setManualName(item?.isManual ? item.title : "");
    setManualUnit(item?.isManual ? normalizeUnitValue(item.unit) ?? "g" : "g");
    const nextManualNutrition = inferManualNutritionPer100(item);
    setManualKcal100(item?.isManual ? nextManualNutrition.kcal100 : 0);
    setManualProtein100(item?.isManual ? nextManualNutrition.protein100 : 0);
    setManualFat100(item?.isManual ? nextManualNutrition.fat100 : 0);
    setManualCarbs100(item?.isManual ? nextManualNutrition.carbs100 : 0);
  }, [initialItemType, item, mode, open]);

  useEffect(() => {
    if (!open || mode !== "add") {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        setIsHistoryLoading(true);
        setHistoryError(null);
        const response = await getMealPlanHistory(anchorDate);
        if (!cancelled) {
          setHistoryItems(response);
        }
      } catch (error) {
        console.error("Failed to load meal plan history", error);
        if (!cancelled) {
          setHistoryError(t("mealPlan.history.loadError"));
          setHistoryItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [anchorDate, mode, open, t]);

  useEffect(() => {
    if (!isSubmitting) {
      if (pendingUiAction && !errorMessage) {
        if (pendingUiAction.kind === "single") {
          setSingleProposal(null);
          setSingleProposalTotalsOverride(null);
        }

        if (pendingUiAction.kind === "batch") {
          setBatchItems((current) => current.filter((entry, index) => getProposalActionKey(entry, index) !== pendingUiAction.key));
        }
      }

      setPendingActionKey(null);
      setPendingUiAction(null);
    }
  }, [errorMessage, isSubmitting, pendingUiAction]);

  const selectedProduct = useMemo(() => products.find((entry) => entry.id === selectedProductId) ?? null, [products, selectedProductId]);
  const filteredHistoryItems = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) {
      return historyItems;
    }

    return historyItems.filter((entry) => {
      const haystack = [entry.title, entry.date, entry.type, entry.unit].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [historyItems, historyQuery]);
  const filteredRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    if (!query) {
      return recipes;
    }

    return recipes.filter((entry) => {
      const haystack = [entry.title, entry.category ?? "", entry.description ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [recipeQuery, recipes]);

  function submitProduct() {
    if (!selectedProduct) return;
    onSubmit({ type: "product", product: selectedProduct, quantity });
  }

  function submitRecipeCard(recipe: RecipeSummary) {
    const recipeServings = recipeServingsById[recipe.id] ?? (selectedRecipeId === recipe.id ? servings : 1);
    onSubmit({ type: "recipe", recipe, servings: recipeServings });
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

  function submitBatch(items: MealPlanAssistantProposal[]) {
    if (!items.length) {
      return;
    }

    onSubmitMultipleManualItems?.(items);
  }

  function appendItems(items: MealPlanAssistantProposal[]) {
    if (!items.length) {
      return;
    }

    onAppendManualItems?.(items);
  }

  function getProposalActionKey(proposal: MealPlanAssistantProposal, index?: number): string {
    return `${proposal.name}-${proposal.unit}-${proposal.amount}${typeof index === "number" ? `-${index}` : ""}`;
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
      <DialogTitle dir={isRtl ? "rtl" : "ltr"} sx={{ paddingInlineEnd: 2, pb: { xs: 0.75, md: 1.5 }, textAlign: "start" }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-start"
          sx={{ width: "100%", textAlign: "start" }}
        >
          <IconButton onClick={onClose} edge="start" size="small">
            {isRtl ? <ArrowForwardRoundedIcon /> : <ArrowBackRoundedIcon />}
          </IconButton>
          <Typography component="span" variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 0, md: 2 }, pt: 0, pb: 0 }}>
        <Stack sx={{ height: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={(_event, nextValue: DialogTab) => setActiveTab(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ px: { xs: 1, md: 0 }, borderBottom: "1px solid", borderColor: "divider", minHeight: 52 }}
          >
            <Tab value="ai" label={t("mealPlan.dialog.ai")} icon={<AutoAwesomeRoundedIcon fontSize="small" />} iconPosition="start" />
            {mode === "add" ? <Tab value="history" label={t("mealPlan.dialog.history")} /> : null}
            <Tab value="manual" label={t("mealPlan.dialog.manual")} />
            <Tab value="recipe" label={t("mealPlan.dialog.recipe")} />
            <Tab value="product" label={t("mealPlan.dialog.product")} />
          </Tabs>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: { xs: 2, md: 0 },
              py: { xs: 1.5, md: 2.5 },
              paddingInlineEnd: { xs: 1.25, md: 0.5 },
              scrollbarWidth: "thin",
              scrollbarColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(148,163,184,0.34) transparent" : "rgba(100,116,139,0.24) transparent",
              "&::-webkit-scrollbar": {
                width: 10
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent"
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(148,163,184,0.28)" : "rgba(100,116,139,0.22)",
                borderRadius: 999,
                border: "3px solid transparent",
                backgroundClip: "padding-box"
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(148,163,184,0.42)" : "rgba(100,116,139,0.34)"
              }
            }}
          >
            {activeTab === "ai" ? (
              <Stack
                dir={isRtl ? "rtl" : "ltr"}
                style={{ direction: isRtl ? "rtl" : "ltr" }}
                spacing={2.5}
                sx={{ maxWidth: 980, mx: "auto", direction: isRtl ? "rtl" : "ltr" }}
              >
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                <AgentWorkspace
                  panelKey={`meal-plan-slot-agent-${open ? "open" : "closed"}-${sectionTitle}-${anchorDate}-${mode}`}
                  speechLanguage={agentSettings.speechLanguage}
                  showToolOutput={false}
                  placeholder={t("aiAgent.placeholder")}
                  submitLabel={t("aiAgent.send")}
                  missingApiKeyMessage={t("aiAgent.status.missingApiKey")}
                  onRun={async ({ apiKey, payload, messages, onToolStart, onToolEnd }) => {
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
                      userText,
                      images: payload.images,
                      userInstructions: agentSettings.userInstructions,
                      responseLanguage: resolveAiResponseLanguage(agentSettings.speechLanguage, language),
                      onToolStart,
                      onToolEnd
                    });

                    return {
                      appendedMessages: [result.assistantMessage],
                      extra: result
                    };
                  }}
                  onExtraResult={(result) => {
                    const nextProposal = result?.proposal ?? null;
                    const nextItems = result?.items ?? [];
                    setBatchItems(nextItems);
                    setSingleProposal(nextProposal);
                    setSingleProposalTotalsOverride(nextProposal && result ? extractTotalsFromAssistantMessage(result.assistantMessage.text) : null);

                    if (nextProposal) {
                      setManualName(nextProposal.name);
                      setQuantity(nextProposal.amount);
                      setManualUnit(normalizeUnitValue(nextProposal.unit) ?? "g");
                      setManualKcal100(nextProposal.kcal100);
                      setManualProtein100(nextProposal.protein100);
                      setManualFat100(nextProposal.fat100);
                      setManualCarbs100(nextProposal.carbs100);
                    }
                  }}
                  header={
                    <Stack spacing={0.5} sx={{ width: "100%", textAlign: "start", alignItems: "stretch" }}>
                      <Typography variant="h6" fontWeight={800} sx={{ textAlign: "start" }}>{t("mealPlan.ai.title")}</Typography>
                      <Typography color="text.secondary" sx={{ textAlign: "start", fontSize: { xs: 13, md: 14 }, lineHeight: 1.45 }}>{t("mealPlan.ai.subtitle")}</Typography>
                    </Stack>
                  }
                  renderTemplate={() => (
                    <Stack spacing={1.1} sx={{ pb: 1.75 }}>
                      {singleProposal ? (
                        <Box
                          sx={{
                            px: 1.4,
                            py: 1.15,
                            borderRadius: 1.5,
                            backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(20, 28, 42, 0.96)" : "rgba(255,255,255,0.98)"),
                            boxShadow: (theme) =>
                              theme.palette.mode === "dark"
                                ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                                : "0 8px 24px rgba(15,23,42,0.06)"
                          }}
                        >
                          {(() => {
                            const totals = singleProposalTotalsOverride ?? getProposalTotals(singleProposal);

                            return (
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                                    <Typography fontWeight={700} sx={{ fontSize: 14, lineHeight: 1.25 }} noWrap>
                                      {singleProposal.name}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ flexShrink: 0, fontSize: 13, lineHeight: 1.25, marginInlineStart: 1 }}>
                                      {`${Math.round(singleProposal.amount)} ${getLocalizedUnitLabel((key) => t(key as never), singleProposal.unit)}`}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: 12.5 }}>
                                    {`${totals.calories} kcal · ${t("mealPlan.macro.protein")} ${totals.protein}g · ${t("mealPlan.macro.fat")} ${totals.fat}g · ${t("mealPlan.macro.carbs")} ${totals.carbs}g`}
                                  </Typography>
                                </Box>
                                <IconButton
                                  color="primary"
                                  onClick={() => {
                                    const actionKey = getProposalActionKey(singleProposal);
                                    setPendingActionKey(actionKey);
                                    setPendingUiAction({ kind: "single", key: actionKey });
                                    appendItems([singleProposal]);
                                  }}
                                  disabled={isSubmitting}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    marginInlineStart: 0.75,
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    boxShadow: "none",
                                    "&.Mui-disabled": {
                                      bgcolor: "primary.main",
                                      color: "primary.contrastText",
                                      opacity: 0.58
                                    },
                                    "&:hover": {
                                      bgcolor: "primary.dark"
                                    }
                                  }}
                                >
                                  {pendingActionKey === getProposalActionKey(singleProposal)
                                    ? <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                                    : <AddRoundedIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </Stack>
                            );
                          })()}
                        </Box>
                      ) : null}

                      {batchItems.length > 0 ? (
                        <Stack spacing={1.25}>
                          <Typography fontWeight={700}>{t("mealPlan.ai.componentsTitle")}</Typography>
                          <Stack spacing={1}>
                            {batchItems.map((entry, index) => {
                              const totals = getProposalTotals(entry);

                              return (
                                <Box
                                  key={`${entry.name}-${index}`}
                                  sx={{
                                    px: 1.4,
                                    py: 1.1,
                                    borderRadius: 1.5,
                                    backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(20, 28, 42, 0.92)" : "rgba(255,255,255,0.98)"),
                                    boxShadow: (theme) =>
                                      theme.palette.mode === "dark"
                                        ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                                        : "0 8px 24px rgba(15,23,42,0.05)"
                                  }}
                                >
                                  <Stack direction="row" spacing={1.25} alignItems="center">
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                                        <Typography fontWeight={700} sx={{ fontSize: 14, lineHeight: 1.25 }} noWrap>
                                          {entry.name}
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ flexShrink: 0, fontSize: 13, lineHeight: 1.25, marginInlineStart: 1 }}>
                                          {`${Math.round(entry.amount)} ${getLocalizedUnitLabel((key) => t(key as never), entry.unit)}`}
                                        </Typography>
                                      </Stack>
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: 12.5 }}>
                                        {`${totals.calories} kcal · ${t("mealPlan.macro.protein")} ${totals.protein}g · ${t("mealPlan.macro.fat")} ${totals.fat}g · ${t("mealPlan.macro.carbs")} ${totals.carbs}g`}
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      color="primary"
                                      onClick={() => {
                                        const actionKey = getProposalActionKey(entry, index);
                                        setPendingActionKey(actionKey);
                                        setPendingUiAction({ kind: "batch", key: actionKey });
                                        appendItems([entry]);
                                      }}
                                      disabled={isSubmitting}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        marginInlineStart: 0.75,
                                        bgcolor: "primary.main",
                                        color: "primary.contrastText",
                                        boxShadow: "none",
                                        "&.Mui-disabled": {
                                          bgcolor: "primary.main",
                                          color: "primary.contrastText",
                                          opacity: 0.58
                                        },
                                        "&:hover": {
                                          bgcolor: "primary.dark"
                                        }
                                      }}
                                    >
                                      {pendingActionKey === getProposalActionKey(entry, index)
                                        ? <CircularProgress size={15} sx={{ color: "#ffffff" }} />
                                        : <AddRoundedIcon sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                          <Box>
                            <Button
                              variant="contained"
                              onClick={() => submitBatch(batchItems)}
                              disabled={isSubmitting || batchItems.length === 0}
                              size="small"
                              sx={{
                                px: 1.4,
                                py: 0.75,
                                borderRadius: 1.25,
                                textTransform: "none",
                                boxShadow: "none"
                              }}
                            >
                              {t("mealPlan.ai.applyMultiple", { count: batchItems.length, section: sectionTitle })}
                            </Button>
                          </Box>
                        </Stack>
                      ) : null}
                    </Stack>
                  )}
                />
              </Stack>
            ) : null}

            {activeTab === "history" ? (
              <Stack spacing={2} sx={{ maxWidth: 860, mx: "auto" }}>
                <Stack spacing={0.5}>
                  <Typography variant="h6" fontWeight={800}>{t("mealPlan.history.title")}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: { xs: 13, md: 14 }, lineHeight: 1.45 }}>{t("mealPlan.history.subtitle")}</Typography>
                </Stack>

                <TextField
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder={t("common.search")}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5
                    }
                  }}
                />

                {historyError ? <Alert severity="error">{historyError}</Alert> : null}

                {isHistoryLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : filteredHistoryItems.length === 0 ? (
                  <Typography color="text.secondary">{t("mealPlan.history.empty")}</Typography>
                ) : (
                  <Stack spacing={1}>
                    {filteredHistoryItems.map((entry) => {
                      const per100 = entry.nutritionPer100 ?? (() => {
                        if (entry.type === "product" && entry.amount && entry.amount > 0) {
                          const factor = 100 / entry.amount;
                          return {
                            caloriesKcal: entry.nutritionTotal.caloriesKcal * factor,
                            proteinG: entry.nutritionTotal.proteinG * factor,
                            fatG: entry.nutritionTotal.fatG * factor,
                            carbsG: entry.nutritionTotal.carbsG * factor
                          };
                        }

                        return null;
                      })();

                      return (
                        <Box
                          key={entry.id}
                          sx={{
                            px: 1.4,
                            py: 1.1,
                            borderRadius: 1.5,
                            backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(20, 28, 42, 0.92)" : "rgba(255,255,255,0.98)"),
                            boxShadow: (theme) =>
                              theme.palette.mode === "dark"
                                ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                                : "0 8px 24px rgba(15,23,42,0.05)"
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                                <Typography fontWeight={700} sx={{ fontSize: 14, lineHeight: 1.25 }} noWrap>
                                  {entry.title}
                                </Typography>
                                <Typography color="text.secondary" sx={{ flexShrink: 0, fontSize: 13, lineHeight: 1.25, marginInlineStart: 1 }}>
                                  {entry.type === "recipe"
                                    ? `${Math.round(entry.servings ?? 1)} ${t("units.short.serving" as never)}`
                                    : `${Math.round(entry.amount ?? 100)} ${getLocalizedUnitLabel((key) => t(key as never), entry.unit)}`}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: 12.5 }}>
                                {`${Math.round(entry.nutritionTotal.caloriesKcal)} kcal · ${t("mealPlan.macro.protein")} ${Math.round(entry.nutritionTotal.proteinG)}g · ${t("mealPlan.macro.fat")} ${Math.round(entry.nutritionTotal.fatG)}g · ${t("mealPlan.macro.carbs")} ${Math.round(entry.nutritionTotal.carbsG)}g`}
                              </Typography>
                            </Box>
                            <IconButton
                              color="primary"
                              onClick={() => {
                                const actionKey = `history-${entry.id}`;
                                setPendingActionKey(actionKey);
                                setPendingUiAction({ kind: "history", key: actionKey });
                                onSubmitHistoryItem?.({
                                  ...entry,
                                  nutritionPer100: per100
                                });
                              }}
                              disabled={isSubmitting}
                              sx={{
                                width: 40,
                                height: 40,
                                marginInlineStart: 0.75,
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                boxShadow: "none",
                                "&.Mui-disabled": {
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                  opacity: 0.58
                                },
                                "&:hover": {
                                  bgcolor: "primary.dark"
                                }
                              }}
                            >
                              {pendingActionKey === `history-${entry.id}`
                                ? <CircularProgress size={15} sx={{ color: "#ffffff" }} />
                                : <AddRoundedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
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
                <TextField
                  value={recipeQuery}
                  onChange={(event) => setRecipeQuery(event.target.value)}
                  placeholder={t("recipes.searchPlaceholder")}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1.5
                    }
                  }}
                />
                {filteredRecipes.length === 0 ? (
                  <Stack spacing={0.4}>
                    <Typography fontWeight={700}>{t("recipes.emptyTitle")}</Typography>
                    <Typography color="text.secondary">{t("recipes.emptySearch")}</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    {filteredRecipes.map((recipe) => {
                      const isSelected = recipe.id === selectedRecipeId;
                      const recipeServings = recipeServingsById[recipe.id] ?? (isSelected ? servings : 1);

                      return (
                        <Box
                          key={recipe.id}
                          onClick={() => setSelectedRecipeId(recipe.id)}
                          sx={{
                            px: 1.4,
                            py: 1.1,
                            borderRadius: 1.5,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: isSelected ? "primary.main" : "divider",
                            backgroundColor: (theme) =>
                              isSelected
                                ? theme.palette.mode === "dark"
                                  ? "rgba(16,185,129,0.12)"
                                  : "rgba(16,185,129,0.08)"
                                : theme.palette.mode === "dark"
                                  ? "rgba(20, 28, 42, 0.92)"
                                  : "rgba(255,255,255,0.98)",
                            boxShadow: (theme) =>
                              theme.palette.mode === "dark"
                                ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                                : "0 8px 24px rgba(15,23,42,0.05)"
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack spacing={0.35}>
                                <Typography
                                  component={NavLink}
                                  to={`/recipes/${recipe.id}`}
                                  onClick={(event) => event.stopPropagation()}
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: 14.5,
                                    lineHeight: 1.3,
                                    color: "text.primary",
                                    textDecoration: "none",
                                    display: "block",
                                    "&:hover": {
                                      color: "primary.main",
                                      textDecoration: "underline"
                                    }
                                  }}
                                >
                                  {recipe.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
                                  {`${Math.round(recipe.nutritionPerServing.caloriesKcal)} kcal · ${t("mealPlan.macro.protein")} ${Math.round(recipe.nutritionPerServing.proteinG)}g · ${t("mealPlan.macro.fat")} ${Math.round(recipe.nutritionPerServing.fatG)}g · ${t("mealPlan.macro.carbs")} ${Math.round(recipe.nutritionPerServing.carbsG)}g`}
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                              <TextField
                                label={t("mealPlan.dialog.servings")}
                                type="number"
                                inputProps={{ min: 0.1, step: 0.1 }}
                                value={recipeServings}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) => {
                                  const nextValue = parseDecimalInput(event.target.value, recipeServings, 0.1);
                                  setSelectedRecipeId(recipe.id);
                                  setServings(nextValue);
                                  setRecipeServingsById((current) => ({ ...current, [recipe.id]: nextValue }));
                                }}
                                size="small"
                                sx={{
                                  width: { xs: 72, sm: 82 },
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1.25
                                  }
                                }}
                              />
                              <IconButton
                                color="primary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedRecipeId(recipe.id);
                                  setServings(recipeServings);
                                  submitRecipeCard(recipe);
                                }}
                                disabled={isSubmitting}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  bgcolor: "primary.main",
                                  color: "primary.contrastText",
                                  boxShadow: "none",
                                  "&.Mui-disabled": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    opacity: 0.58
                                  },
                                  "&:hover": {
                                    bgcolor: "primary.dark"
                                  }
                                }}
                              >
                                <AddRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
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
                    <TextField
                      select
                      label={t("mealPlan.dialog.unit")}
                      value={manualUnit}
                      onChange={(event) => setManualUnit((event.target.value as typeof manualUnit) || "g")}
                      fullWidth
                    >
                    {unitOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
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
