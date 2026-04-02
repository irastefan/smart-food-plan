import { Box, Stack, Typography } from "@mui/material";
import { parseIsoDate } from "../dayNavigation";

type DayNavigatorTimelineProps = {
  days: string[];
  selectedDate: string;
  isToday: (isoDate: string) => boolean;
  locale: string;
};

export function DayNavigatorTimeline({ days, selectedDate, isToday, locale }: DayNavigatorTimelineProps) {
  return (
    <Box sx={{ display: { xs: "none", md: "block" }, px: 2 }}>
      <Box
        sx={{
          position: "relative",
          height: 76,
          maxWidth: 980,
          mx: "auto"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 18,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            borderTop: "2px dotted",
            borderColor: "rgba(148, 163, 184, 0.25)"
          }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          {days.map((day) => {
            const active = day === selectedDate;
            const today = isToday(day);
            const date = parseIsoDate(day);

            return (
              <Stack key={`timeline-${day}`} alignItems="center" spacing={0.9} sx={{ minWidth: 78 }}>
                <Box
                  sx={{
                    width: active ? 20 : today ? 16 : 14,
                    height: active ? 20 : today ? 16 : 14,
                    borderRadius: "50%",
                    border: "4px solid",
                    borderColor: active ? "rgba(255,255,255,0.9)" : "transparent",
                    background: active
                      ? "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)"
                      : today
                        ? "rgba(16,185,129,0.75)"
                        : "rgba(203, 213, 225, 0.72)",
                    boxShadow: active ? "0 10px 20px rgba(16,185,129,0.24)" : "none"
                  }}
                />
                <Stack spacing={0.15} alignItems="center">
                  <Typography
                    variant="body2"
                    fontWeight={active ? 800 : 700}
                    color={active ? "text.primary" : "text.secondary"}
                  >
                    {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: active ? 17 : 13,
                      fontWeight: active ? 800 : 700,
                      lineHeight: 1.05,
                      color: active ? "text.primary" : "text.secondary"
                    }}
                  >
                    {new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Intl.DateTimeFormat(locale, { month: "short" }).format(date)}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
