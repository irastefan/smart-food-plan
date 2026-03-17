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
          {segments.map((segment) => (
            <RecipeMacroRing
              key={segment.key}
              label={segment.label}
              value={segment.value}
              color={segment.color}
              percent={(segment.value / totalMacros) * 100}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function RecipeMacroRing({
  label,
  value,
  color,
  percent
}: {
  label: string;
  value: number;
  color: string;
  percent: number;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography fontWeight={700} textAlign="center" sx={{ color, mb: 1 }}>
        {label}
      </Typography>
      <Stack alignItems="center" spacing={1}>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <Box
            sx={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              border: "10px solid",
              borderColor: "rgba(148, 163, 184, 0.14)"
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center"
            }}
          >
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800} lineHeight={1}>
                {value.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                g
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `conic-gradient(${color} 0 ${Math.max(4, percent)}%, transparent ${Math.max(4, percent)}% 100%)`,
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 10px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 10px))"
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
