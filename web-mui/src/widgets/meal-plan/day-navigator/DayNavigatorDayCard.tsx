import { Box, Typography } from "@mui/material";
import { parseIsoDate } from "../dayNavigation";

type DayNavigatorDayCardProps = {
  day: string;
  locale: string;
  active: boolean;
  today: boolean;
  todayLabel: string;
  selectedLabel: string;
  todayShortLabel: string;
  onSelect: (date: string) => void;
};

export function DayNavigatorDayCard({
  day,
  locale,
  active,
  today,
  todayLabel,
  selectedLabel,
  todayShortLabel,
  onSelect
}: DayNavigatorDayCardProps) {
  const date = parseIsoDate(day);

  return (
    <Box
      onClick={() => onSelect(day)}
      sx={{
        minWidth: active ? { xs: 82, sm: 96, md: 112 } : { xs: 70, sm: 82, md: 96 },
        width: active ? { xs: 82, sm: 96, md: 112 } : { xs: 70, sm: 82, md: 96 },
        px: active ? { xs: 1.05, sm: 1.25 } : { xs: 0.85, sm: 1.05 },
        py: active ? { xs: 1.05, sm: 1.2 } : { xs: 0.9, sm: 1.05 },
        borderRadius: active ? 1.25 : 1,
        border: "1px solid",
        borderColor: active ? "primary.main" : today ? "rgba(16, 185, 129, 0.5)" : "divider",
        background: (theme) =>
          active
            ? theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(223, 248, 238, 0.10), rgba(16,185,129,0.16))"
              : "linear-gradient(180deg, rgba(239, 251, 246, 0.98), rgba(214, 245, 232, 0.96))"
            : today
              ? theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))"
                : "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))"
              : theme.palette.mode === "dark"
                ? "rgba(18,29,43,0.82)"
                : "#ffffff",
        cursor: "pointer",
        transition: "all 160ms ease",
        boxShadow: active
          ? "0 14px 28px rgba(16, 185, 129, 0.14)"
          : today
            ? "0 6px 18px rgba(16, 185, 129, 0.08)"
            : "none",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        justifyContent: "flex-start",
        overflow: "visible",
        scrollSnapAlign: { xs: "start", md: "unset" },
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-1px)"
        }
      }}
    >
      <Typography
        variant={active ? "body1" : "caption"}
        color={active || today ? "primary.main" : "text.secondary"}
        fontWeight={800}
        sx={{
          fontSize: active ? { xs: 9, md: 12 } : { xs: 8, md: 10 },
          letterSpacing: -0.2
        }}
      >
        {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)}
      </Typography>
      <Typography
        variant={active ? "h3" : "h5"}
        fontWeight={800}
        sx={{
          lineHeight: 1.05,
          mt: 0.2,
          fontSize: active ? { xs: 28, sm: 34, md: 42 } : { xs: 22, sm: 26, md: 32 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date)}
      </Typography>
      <Typography
        variant={active ? "h5" : "body2"}
        color="text.secondary"
        sx={{
          mt: 0.2,
          fontSize: active ? { xs: 10, md: 14 } : { xs: 9, md: 12 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { month: "short" }).format(date)}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {active ? (
        <Box
          sx={{
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 0.7, md: 1.15 },
            minHeight: { xs: 18, md: 22 },
            borderRadius: 999,
            background: "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)",
            color: "primary.contrastText",
            fontSize: { xs: 10, md: 12 },
            fontWeight: 800,
            lineHeight: 1
          }}
        >
          {today ? todayLabel : selectedLabel}
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: { xs: 22, md: 22 },
            pt: 0.25,
            pb: 0.25
          }}
        >
          {today ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 0.7, md: 1 },
                minHeight: { xs: 18, md: 20 },
                borderRadius: 999,
                backgroundColor: "rgba(16,185,129,0.12)",
                color: "primary.main",
                fontSize: { xs: 9, md: 11 },
                fontWeight: 800,
                lineHeight: 1
              }}
            >
              {todayShortLabel}
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
