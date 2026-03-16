import { Box, Paper, Stack, Typography } from "@mui/material";
import type { NutritionTotals } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";

type RecipeNutritionCardProps = {
  totals: NutritionTotals;
};

export function RecipeNutritionCard({ totals }: RecipeNutritionCardProps) {
  const { t } = useLanguage();
  const totalMacros = Math.max(1, totals.proteinG + totals.fatG + totals.carbsG);

  const segments = [
    { key: "protein", label: t("recipe.macros.protein"), value: totals.proteinG, color: "#22c55e" },
    { key: "fat", label: t("recipe.macros.fat"), value: totals.fatG, color: "#f59e0b" },
    { key: "carbs", label: t("recipe.macros.carbs"), value: totals.carbsG, color: "#38bdf8" }
  ];

  let offset = 0;
  const gradient = segments
    .map((segment) => {
      const portion = (segment.value / totalMacros) * 100;
      const start = offset;
      offset += portion;
      return `${segment.color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <Paper sx={{ p: 3, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800}>
          {t("recipe.nutrition")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
          <Box sx={{ position: "relative", width: 210, height: 210, borderRadius: "50%", background: `conic-gradient(${gradient})`, display: "grid", placeItems: "center" }}>
            <Box sx={{ width: 142, height: 142, borderRadius: "50%", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", display: "grid", placeItems: "center", textAlign: "center" }}>
              <Typography variant="h3" fontWeight={800}>{Math.round(totals.caloriesKcal)}</Typography>
              <Typography color="text.secondary">kcal</Typography>
            </Box>
          </Box>
          <Stack spacing={1.5} sx={{ flex: 1, width: "100%" }}>
            {segments.map((segment) => (
              <Stack key={segment.key} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 1.25, bgcolor: "action.hover" }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: segment.color }} />
                  <Typography fontWeight={700}>{segment.label}</Typography>
                </Stack>
                <Typography color="text.secondary">{segment.value.toFixed(1)} g</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
