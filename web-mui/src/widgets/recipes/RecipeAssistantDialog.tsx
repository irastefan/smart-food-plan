import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { runRecipeAssistant, type RecipeAssistantDraft } from "../../features/ai/api/recipeAssistantApi";
import { createRecipe, updateRecipe } from "../../features/recipes/api/recipesApi";
import { getRecipeCategoryLabel } from "../../features/recipes/model/recipeCategories";
import type { RecipeDetail } from "../../features/recipes/model/recipeTypes";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { getLocalizedUnitLabel } from "../../shared/lib/units";
import { ContextAgentDialog } from "../ai/ContextAgentDialog";

type RecipeAssistantDialogProps = {
  open: boolean;
  onClose: () => void;
  recipe?: RecipeDetail | null;
  onRecipeChanged?: (recipe: RecipeDetail) => void;
};

function round(value: number): number {
  return Math.round(value);
}

function getIngredientTotals(ingredient: RecipeAssistantDraft["ingredients"][number]) {
  const factor = ingredient.amount / 100;
  return {
    calories: round(ingredient.kcal100 * factor),
    protein: round(ingredient.protein100 * factor),
    fat: round(ingredient.fat100 * factor),
    carbs: round(ingredient.carbs100 * factor)
  };
}

function getDraftTotals(draft: RecipeAssistantDraft) {
  return draft.ingredients.reduce(
    (acc, ingredient) => {
      const totals = getIngredientTotals(ingredient);
      return {
        calories: acc.calories + totals.calories,
        protein: acc.protein + totals.protein,
        fat: acc.fat + totals.fat,
        carbs: acc.carbs + totals.carbs
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
}

export function RecipeAssistantDialog({ open, onClose, recipe = null, onRecipeChanged }: RecipeAssistantDialogProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const agentSettings = getAiAgentSettings();
  const [draft, setDraft] = useState<RecipeAssistantDraft | null>(null);
  const [draftIntent, setDraftIntent] = useState<"create" | "update">("create");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const totals = useMemo(() => (draft ? getDraftTotals(draft) : null), [draft]);

  async function handleCreate() {
    if (!draft) {
      return;
    }

    try {
      setIsCreating(true);
      setStatus(null);
      if (recipe && draftIntent === "update") {
        const updated = await updateRecipe(recipe.id, draft);
        onRecipeChanged?.(updated);
        onClose();
      } else {
        const created = await createRecipe(draft);
        onClose();
        navigate(`/recipes/${created.id}`);
      }
    } catch (error) {
      console.error("Failed to save recipe from AI draft", error);
      setStatus({ type: "error", message: recipe && draftIntent === "update" ? t("recipe.ai.status.updateError") : t("recipe.ai.status.createError") });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ContextAgentDialog
      open={open}
      onClose={onClose}
      panelKey={`recipe-agent-${recipe?.id ?? "new"}-${open ? "open" : "closed"}`}
      speechLanguage={agentSettings.speechLanguage}
      showToolOutput={false}
      placeholder={t("recipe.ai.placeholder")}
      submitLabel={t("aiAgent.send")}
      missingApiKeyMessage={t("aiAgent.status.missingApiKey")}
      quickPrompts={
        recipe
          ? [
              t("recipe.ai.prompt.improveCurrent"),
              t("recipe.ai.prompt.moreProtein"),
              t("recipe.ai.prompt.reduceCalories")
            ]
          : [
              t("aiAgent.prompt.addRecipe"),
              t("aiAgent.prompt.improveMealPlan"),
              t("aiAgent.prompt.shoppingList")
            ]
      }
      outerHeader={status ? <Alert severity={status.type}>{status.message}</Alert> : null}
      onRun={async ({ apiKey, payload, messages, onToolStart, onToolEnd }) => {
        const normalizedText = payload.text.trim();
        const userText =
          normalizedText.length > 0
            ? normalizedText
            : payload.images.length > 0
              ? t("aiAgent.imageOnlyPrompt")
              : "";

        const result = await runRecipeAssistant({
          apiKey,
          model: agentSettings.model,
          history: messages,
          userText,
          images: payload.images,
          userInstructions: agentSettings.userInstructions,
          currentRecipe: recipe,
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
        setDraft(result?.draft ?? null);
        setDraftIntent(result?.intent ?? "create");
      }}
      renderTemplate={({ extra }) =>
        extra?.draft ? (
                    <Box
                      sx={{
                        mt: 1,
                        mb: 2.5,
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 1.5,
                        backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(20, 28, 42, 0.96)" : "rgba(255,255,255,0.98)"),
                        boxShadow: (theme) =>
                          theme.palette.mode === "dark"
                            ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                            : "0 8px 24px rgba(15,23,42,0.06)"
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                        >
                          <Stack spacing={0.4}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <RestaurantMenuRoundedIcon sx={{ fontSize: 18, color: "success.main" }} />
                              <Typography fontWeight={800}>{extra.draft.title}</Typography>
                            </Stack>
                            {extra.draft.description ? (
                              <Typography variant="body2" color="text.secondary">
                                {extra.draft.description}
                              </Typography>
                            ) : null}
                          </Stack>
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                            <Chip size="small" label={getRecipeCategoryLabel(extra.draft.category, t)} />
                            <Chip size="small" label={t("recipe.ai.servings", { count: extra.draft.servings })} />
                          </Stack>
                        </Stack>

                        {totals ? (
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                            <MetricChip label={`${totals.calories} kcal`} />
                            <MetricChip label={`${t("recipe.macros.protein")} ${totals.protein}g`} />
                            <MetricChip label={`${t("recipe.macros.fat")} ${totals.fat}g`} />
                            <MetricChip label={`${t("recipe.macros.carbs")} ${totals.carbs}g`} />
                          </Stack>
                        ) : null}

                        <Stack spacing={1}>
                          {extra.draft.ingredients.map((ingredient) => {
                            const ingredientTotals = getIngredientTotals(ingredient);
                            return (
                              <Box
                                key={ingredient.id}
                                sx={{
                                  p: 1.3,
                                  borderRadius: 1.5,
                                  backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(20, 28, 42, 0.92)" : "rgba(255,255,255,0.96)"),
                                  boxShadow: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
                                      : "0 8px 24px rgba(15,23,42,0.05)"
                                }}
                              >
                                <Stack spacing={0.35}>
                                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                    <Typography fontWeight={700}>{ingredient.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {round(ingredient.amount)} {getLocalizedUnitLabel((key) => t(key as never), ingredient.unit)}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">
                                    {ingredientTotals.calories} kcal · {t("recipe.macros.protein")} {ingredientTotals.protein}g · {t("recipe.macros.fat")} {ingredientTotals.fat}g · {t("recipe.macros.carbs")} {ingredientTotals.carbs}g
                                  </Typography>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Stack>

                        {extra.draft.steps.filter(Boolean).length > 0 ? (
                          <Stack spacing={0.6}>
                            <Typography fontWeight={700}>{t("recipe.steps")}</Typography>
                            <Stack spacing={0.5}>
                              {extra.draft.steps.filter(Boolean).map((step, index) => (
                                <Typography key={`${index}-${step}`} variant="body2" color="text.secondary">
                                  {index + 1}. {step}
                                </Typography>
                              ))}
                            </Stack>
                          </Stack>
                        ) : null}

                        <Box sx={{ pt: 0.5 }}>
                          <Button
                            variant="contained"
                            startIcon={<SaveRoundedIcon />}
                            onClick={() => void handleCreate()}
                            disabled={isCreating}
                            sx={{ boxShadow: "none" }}
                          >
                            {recipe && draftIntent === "update" ? t("recipe.ai.confirmUpdate") : t("recipe.ai.confirm")}
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  ) : null
      }
    />
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        fontWeight: 700,
        bgcolor: "action.hover",
        borderRadius: 1
      }}
    />
  );
}
