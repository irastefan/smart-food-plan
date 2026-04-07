import { Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";

type NutritionInlineSummaryProps = {
  prefix: string;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fontSize?: { xs?: string | number; sm?: string | number; md?: string | number } | string | number;
};

function formatNumber(value: number): string {
  return String(Math.round(value));
}

export function NutritionInlineSummary({
  prefix,
  proteinG,
  fatG,
  carbsG,
  fontSize = { xs: "0.72rem", sm: "0.82rem" }
}: NutritionInlineSummaryProps) {
  const { t } = useLanguage();

  return (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ fontSize, minWidth: 0 }}
    >
      {`${prefix} · ${t("mealPlan.macro.protein")} ${formatNumber(proteinG)}${t("units.short.g" as never)} · ${t("mealPlan.macro.fat")} ${formatNumber(fatG)}${t("units.short.g" as never)} · ${t("mealPlan.macro.carbs")} ${formatNumber(carbsG)}${t("units.short.g" as never)}`}
    </Typography>
  );
}
