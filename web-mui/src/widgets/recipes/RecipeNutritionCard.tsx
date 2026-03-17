import { Box, Paper, Stack, Typography } from "@mui/material";
import type { NutritionTotals } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { MacroRingRow } from "../nutrition/MacroRingRow";

type RecipeNutritionCardProps = {
  totals: NutritionTotals;
};

export function RecipeNutritionCard({ totals }: RecipeNutritionCardProps) {
  const { t } = useLanguage();
  const totalMacros = Math.max(1, totals.proteinG + totals.fatG + totals.carbsG);

  const segments = [
    { key: "protein", label: t("recipe.macros.protein"), value: totals.proteinG, color: "#ffb547" },
    { key: "fat", label: t("recipe.macros.fat"), value: totals.fatG, color: "#d58bff" },
    { key: "carbs", label: t("recipe.macros.carbs"), value: totals.carbsG, color: "#4dd6e3" }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800}>
          {t("recipe.nutrition")}
        </Typography>
        <Box sx={{ px: 1.5, py: 1.25, borderRadius: 1.25, bgcolor: "action.hover", minWidth: 92 }}>
          <Typography variant="caption" color="text.secondary">
            kcal / serving
          </Typography>
          <Typography variant="h3" fontWeight={800}>
            {Math.round(totals.caloriesKcal)}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
          <MacroRingRow
            items={segments.map((segment) => ({
              ...segment,
              footer: `${Math.round((segment.value / totalMacros) * 100)}%`
            }))}
            variant="detail"
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
