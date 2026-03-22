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
        minWidth: active ? { xs: 72, sm: 82, md: 90 } : { xs: 64, sm: 72, md: 80 },
        width: active ? { xs: 72, sm: 82, md: 90 } : { xs: 64, sm: 72, md: 80 },
        minHeight: active ? { xs: 82, md: 92 } : { xs: 74, md: 84 },
        px: { xs: 0.8, sm: 0.95 },
        py: { xs: 0.7, sm: 0.8 },
        borderRadius: 1.15,
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
                ? "rgba(31,36,54,0.92)"
                : "#ffffff",
        cursor: "pointer",
        position: "relative",
        transition: "all 160ms ease",
        boxShadow: active
          ? "0 14px 28px rgba(16, 185, 129, 0.14)"
          : today
            ? "0 6px 18px rgba(16, 185, 129, 0.08)"
            : "none",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        justifyContent: "center",
        overflow: "visible",
        scrollSnapAlign: { xs: "start", md: "unset" },
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-1px)"
        }
      }}
    >
      {(active || today) ? (
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: active ? { xs: 0.55, md: 0.8 } : { xs: 0.45, md: 0.65 },
            minHeight: { xs: 16, md: 18 },
            borderRadius: 999,
            background: active
              ? "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)"
              : "rgba(16,185,129,0.12)",
            color: active ? "primary.contrastText" : "primary.main",
            fontSize: { xs: 8, md: 9 },
            fontWeight: 800,
            lineHeight: 1,
            zIndex: 1
          }}
        >
          {active ? (today ? todayLabel : selectedLabel) : todayShortLabel}
        </Box>
      ) : null}

      <Typography
        variant={active ? "body1" : "caption"}
        color={active || today ? "primary.main" : "text.secondary"}
        fontWeight={800}
        sx={{
          fontSize: active ? { xs: 8, md: 10 } : { xs: 7.5, md: 9 },
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
          mt: 0.05,
          fontSize: active ? { xs: 24, sm: 28, md: 32 } : { xs: 20, sm: 22, md: 26 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date)}
      </Typography>
      <Typography
        variant={active ? "h5" : "body2"}
        color="text.secondary"
        sx={{
          mt: 0.1,
          fontSize: active ? { xs: 9, md: 11 } : { xs: 8, md: 10 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { month: "short" }).format(date)}
      </Typography>
    </Box>
  );
}
