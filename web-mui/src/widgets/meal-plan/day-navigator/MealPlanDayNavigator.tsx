import { Paper } from "@mui/material";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import { getLanguageDateLocale } from "../../../shared/i18n/languages";
import { DayNavigatorHeader } from "./DayNavigatorHeader";
import type { MealPlanDayNavigatorProps } from "./types";

export function MealPlanDayNavigator({ selectedDate, onDateChange }: MealPlanDayNavigatorProps) {
  const { language, t } = useLanguage();
  const locale = getLanguageDateLocale(language);

  return (
    <Paper
      sx={{
        height: "100%",
        p: { xs: 1.1, md: 1.25 },
        borderRadius: 1,
        overflow: "visible",
        position: "relative",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,251,0.98))",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.12)" : "rgba(226, 232, 240, 0.95)",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 24px 60px rgba(2, 8, 23, 0.28)"
            : "0 24px 60px rgba(148, 163, 184, 0.18)",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: (theme) =>
            `${theme.direction === "rtl" ? "radial-gradient(circle at right bottom, rgba(14,165,233,0.10), transparent 28%)" : "radial-gradient(circle at left bottom, rgba(14,165,233,0.10), transparent 28%)"}, radial-gradient(circle at center, rgba(16,185,129,0.08), transparent 20%)`,
          pointerEvents: "none"
        }
      }}
    >
      <DayNavigatorHeader
        locale={locale}
        selectedDate={selectedDate}
        todayLabel={t("mealPlan.dayNav.today")}
        selectDayLabel={t("mealPlan.dayNav.selectDay")}
        onDateChange={onDateChange}
      />
    </Paper>
  );
}
