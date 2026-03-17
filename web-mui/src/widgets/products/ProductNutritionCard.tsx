import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ProductNutrition } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { MacroRingRow } from "../nutrition/MacroRingRow";

type ProductNutritionCardProps = {
  nutrition: ProductNutrition;
};

export function ProductNutritionCard({ nutrition }: ProductNutritionCardProps) {
  const { t } = useLanguage();

  const metrics = [
    { key: "protein", label: t("product.macros.protein"), value: nutrition.proteinG, color: "#ffb547" },
    { key: "fat", label: t("product.macros.fat"), value: nutrition.fatG, color: "#d58bff" },
    { key: "carbs", label: t("product.macros.carbs"), value: nutrition.carbsG, color: "#4dd6e3" }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" fontWeight={800}>{t("products.nutrition")}</Typography>
        <Box sx={{ p: 2, borderRadius: 1.25, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary">kcal / 100 g</Typography>
          <Typography variant="h3" fontWeight={800}>{Math.round(nutrition.caloriesKcal)}</Typography>
        </Box>
        <MacroRingRow
          items={metrics.map((metric) => ({
            ...metric,
            footer: `${metric.value.toFixed(1)} g`
          }))}
          variant="detail"
        />
      </Stack>
    </Paper>
  );
}
