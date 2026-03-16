import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ProductNutrition } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ProductNutritionCardProps = {
  nutrition: ProductNutrition;
};

export function ProductNutritionCard({ nutrition }: ProductNutritionCardProps) {
  const { t } = useLanguage();

  const metrics = [
    { key: "protein", label: t("product.macros.protein"), value: nutrition.proteinG, color: "#22c55e" },
    { key: "fat", label: t("product.macros.fat"), value: nutrition.fatG, color: "#f59e0b" },
    { key: "carbs", label: t("product.macros.carbs"), value: nutrition.carbsG, color: "#38bdf8" }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800}>{t("products.nutrition")}</Typography>
        <Box sx={{ p: 2, borderRadius: 1.25, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary">kcal / 100 g</Typography>
          <Typography variant="h3" fontWeight={800}>{Math.round(nutrition.caloriesKcal)}</Typography>
        </Box>
        <Stack spacing={1.25}>
          {metrics.map((metric) => (
            <Stack key={metric.key} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 1.25, bgcolor: "action.hover" }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: metric.color }} />
                <Typography fontWeight={700}>{metric.label}</Typography>
              </Stack>
              <Typography color="text.secondary">{metric.value.toFixed(1)} g</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
