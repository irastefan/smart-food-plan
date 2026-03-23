import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ProductNutrition } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getMacroColor } from "../../shared/theme/macroColors";
import { MacroRingRow } from "../nutrition/MacroRingRow";

type ProductNutritionCardProps = {
  nutrition: ProductNutrition;
};

export function ProductNutritionCard({ nutrition }: ProductNutritionCardProps) {
  const { t } = useLanguage();

  const metrics = [
    { key: "protein", label: t("product.macros.protein"), value: nutrition.proteinG, color: getMacroColor("protein") },
    { key: "fat", label: t("product.macros.fat"), value: nutrition.fatG, color: getMacroColor("fat") },
    { key: "carbs", label: t("product.macros.carbs"), value: nutrition.carbsG, color: getMacroColor("carbs") }
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
            footer: `${Math.round(metric.value)} g`
          }))}
          variant="detail"
        />
      </Stack>
    </Paper>
  );
}
