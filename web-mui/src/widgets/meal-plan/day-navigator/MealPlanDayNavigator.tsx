import { Box, Paper, Stack } from "@mui/material";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import { buildDayWindow, getTodayIsoDateLocal, getWeekNumber, getWeekRange, parseIsoDate } from "../dayNavigation";
import { DayNavigatorDayCard } from "./DayNavigatorDayCard";
import { DayNavigatorHeader } from "./DayNavigatorHeader";
import { DayNavigatorTimeline } from "./DayNavigatorTimeline";
import type { MealPlanDayNavigatorProps } from "./types";

function isToday(isoDate: string): boolean {
  return isoDate === getTodayIsoDateLocal();
}

export function MealPlanDayNavigator({ selectedDate, onDateChange }: MealPlanDayNavigatorProps) {
  const { language, t } = useLanguage();
  const days = buildDayWindow(selectedDate, 3);
  const locale = language === "ru" ? "ru-RU" : "en-US";
  const selected = parseIsoDate(selectedDate);
  const weekRange = getWeekRange(selectedDate);
  const weekStart = parseIsoDate(weekRange.start);
  const weekEnd = parseIsoDate(weekRange.end);
  const weekNumber = getWeekNumber(selectedDate);

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2.25 },
        borderRadius: { xs: 1, md: 1 },
        overflow: "hidden",
        position: "relative",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(18,29,43,0.98), rgba(13,22,34,0.99))"
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
          background:
            "radial-gradient(circle at left bottom, rgba(14,165,233,0.10), transparent 28%), radial-gradient(circle at center, rgba(16,185,129,0.08), transparent 20%)",
          pointerEvents: "none"
        }
      }}
    >
      <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ position: "relative", zIndex: 1 }}>
        <DayNavigatorHeader
          locale={locale}
          selectedDate={selectedDate}
          selectedLabel={selected}
          weekStart={weekStart}
          weekEnd={weekEnd}
          weekNumber={weekNumber}
          todayLabel={t("mealPlan.dayNav.today")}
          weekLabel={t("mealPlan.dayNav.week")}
          onDateChange={onDateChange}
        />

        <Box sx={{ overflowX: "auto", pb: 0.5 }}>
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 1.5 }}
            sx={{
              width: "max-content",
              minWidth: "100%",
              justifyContent: "center",
              alignItems: "center",
              px: { xs: 0.5, md: 1.5 },
              mx: "auto"
            }}
          >
            {days.map((day) => (
              <DayNavigatorDayCard
                key={day}
                day={day}
                locale={locale}
                active={day === selectedDate}
                today={isToday(day)}
                todayLabel={t("mealPlan.dayNav.today")}
                selectedLabel={t("mealPlan.dayNav.selected")}
                todayShortLabel={t("mealPlan.dayNav.todayShort")}
                onSelect={onDateChange}
              />
            ))}
          </Stack>
        </Box>

        <DayNavigatorTimeline days={days} selectedDate={selectedDate} isToday={isToday} locale={locale} />
      </Stack>
    </Paper>
  );
}
