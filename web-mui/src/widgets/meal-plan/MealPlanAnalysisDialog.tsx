import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { runMealPlanNutritionAnalysis } from "../../features/ai/api/mealPlanAnalysisApi";
import type { MealPlanDay, MealPlanSection } from "../../features/meal-plan/api/mealPlanApi";
import { getAiAgentSettings, resolveAiResponseLanguage } from "../../shared/config/aiAgent";
import { getOpenAiApiKey } from "../../shared/config/openai";
import { isRtlLanguage } from "../../shared/i18n/languages";

type MealPlanAnalysisDialogProps = {
  open: boolean;
  scope: "day" | "section";
  label: string;
  day?: MealPlanDay | null;
  section?: MealPlanSection | null;
  targets: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  onClose: () => void;
};

export function MealPlanAnalysisDialog({
  open,
  scope,
  label,
  day,
  section,
  targets,
  onClose
}: MealPlanAnalysisDialogProps) {
  const { language, t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRtl = isRtlLanguage(language);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadAnalysis() {
    const apiKey = getOpenAiApiKey();
    if (!apiKey) {
      setError(t("aiAgent.status.missingApiKey"));
      setAnalysis("");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const settings = getAiAgentSettings();
      const responseLanguage = resolveAiResponseLanguage(settings.speechLanguage, language);
      const text = await runMealPlanNutritionAnalysis({
        apiKey,
        model: settings.model,
        scope,
        label,
        responseLanguage,
        day,
        section,
        targets,
        userInstructions: settings.userInstructions
      });
      setAnalysis(text);
    } catch (analysisError) {
      console.error("Failed to analyze meal plan", analysisError);
      setError(t("mealPlan.analysis.error"));
      setAnalysis("");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadAnalysis();
  }, [open, scope, label, day, section, targets.calories, targets.protein, targets.fat, targets.carbs, language]);

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: isMobile
          ? undefined
          : {
              width: "76vw",
              maxWidth: 980,
              height: "84vh",
              maxHeight: "84vh",
              borderRadius: 1.5,
              overflow: "hidden"
            }
      }}
    >
      <DialogTitle sx={{ pr: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={onClose} edge="start" size="small" disabled={isLoading}>
            {isRtl ? <ArrowForwardRoundedIcon /> : <ArrowBackRoundedIcon />}
          </IconButton>
          <InsightsRoundedIcon color="primary" />
          <Typography component="span" variant="h6" fontWeight={800}>
            {scope === "day" ? t("mealPlan.analysis.dayTitle") : t("mealPlan.analysis.sectionTitle", { section: label })}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Stack spacing={2}>
          <Paper
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
                  : "linear-gradient(180deg, #ffffff, #f8fafc)"
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {scope === "day" ? t("mealPlan.analysis.daySubtitle") : t("mealPlan.analysis.sectionSubtitle", { section: label })}
            </Typography>
          </Paper>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Paper
            sx={{
              minHeight: 220,
              p: 2,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper"
            }}
          >
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 180 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary">{t("mealPlan.analysis.loading")}</Typography>
              </Stack>
            ) : (
              <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{analysis}</Typography>
            )}
          </Paper>

          <Stack direction="row" justifyContent="flex-end">
            <Button onClick={() => void loadAnalysis()} disabled={isLoading} variant="contained">
              {t("mealPlan.analysis.retry")}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
