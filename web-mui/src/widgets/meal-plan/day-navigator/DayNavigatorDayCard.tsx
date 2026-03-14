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
        minWidth: active ? { xs: 106, sm: 114, md: 122 } : { xs: 88, sm: 96, md: 104 },
        width: active ? { xs: 106, sm: 114, md: 122 } : { xs: 88, sm: 96, md: 104 },
        //minHeight: active ? { xs: 146, sm: 152, md: 160 } : { xs: 124, sm: 134, md: 146 },
        px: active ? 1.6 : 1.35,
        py: active ? 1.55 : 1.35,
        borderRadius: active ? 1.5 : 1,
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
          fontSize: active ? { xs: 11, md: 12 } : { xs: 9, md: 10 },
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
          mt: 0.45,
          fontSize: active ? { xs: 40, sm: 42, md: 46 } : { xs: 28, sm: 30, md: 34 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date)}
      </Typography>
      <Typography
        variant={active ? "h5" : "body2"}
        color="text.secondary"
        sx={{
          mt: active ? 0.55 : 0.5,
          fontSize: active ? { xs: 13, md: 14 } : { xs: 11, md: 12 }
        }}
      >
        {new Intl.DateTimeFormat(locale, { month: "short" }).format(date)}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {active ? (
        <Box
          sx={{
            alignSelf: "center",
            px: 1.15,
            py: 0.45,
            borderRadius: 999,
            background: "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)",
            color: "primary.contrastText",
            fontSize: 12,
            fontWeight: 800
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
            minHeight: 20
          }}
        >
          {today ? (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 999,
                backgroundColor: "rgba(16,185,129,0.12)",
                color: "primary.main",
                fontSize: 11,
                fontWeight: 800
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
