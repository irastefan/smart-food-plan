import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import { getTodayIsoDateLocal, shiftIsoDate } from "../dayNavigation";

type DayNavigatorHeaderProps = {
  locale: string;
  selectedDate: string;
  selectedLabel: Date;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  todayLabel: string;
  weekLabel: string;
  onDateChange: (date: string) => void;
};

export function DayNavigatorHeader({
  locale,
  selectedDate,
  selectedLabel,
  weekStart,
  weekEnd,
  weekNumber,
  todayLabel,
  weekLabel,
  onDateChange
}: DayNavigatorHeaderProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
      flexWrap="wrap"
      spacing={1.5}
    >
      <Paper
        elevation={0}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.25, md: 1.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(20, 31, 45, 0.82)" : "rgba(255,255,255,0.74)"
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,165,233,0.12))",
              color: "primary.main"
            }}
          >
            <CalendarMonthRoundedIcon />
          </Box>
          <Stack spacing={0.25}>
            <Typography variant="h4" sx={{ fontSize: { xs: 24, md: 28 } }}>
              {new Intl.DateTimeFormat(locale, {
                month: "long",
                year: "numeric"
              }).format(selectedLabel)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {weekLabel} {weekNumber} •{" "}
              {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekStart)} -{" "}
              {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekEnd)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(20, 31, 45, 0.82)" : "rgba(255,255,255,0.86)"
        }}
      >
        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
          sx={{ borderRadius: 0, width: { xs: 58, md: 68 }, height: { xs: 56, md: 62 } }}
        >
          <ChevronLeftRoundedIcon />
        </IconButton>
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minWidth: { xs: 98, md: 128 },
            height: { xs: 56, md: 62 },
            borderLeft: "1px solid",
            borderRight: "1px solid",
            borderColor: "divider"
          }}
        >
          <Typography variant="h4" sx={{ fontSize: { xs: 18, md: 22 } }}>
            {todayLabel}
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<RemoveRoundedIcon />}
          onClick={() => onDateChange(getTodayIsoDateLocal())}
          sx={{
            minWidth: { xs: 110, md: 142 },
            height: { xs: 56, md: 62 },
            borderRadius: 0,
            px: 2.25,
            background: "linear-gradient(135deg, #60d5b0 0%, #10b981 55%, #0ea5e9 100%)"
          }}
        >
          {todayLabel}
        </Button>
      </Paper>
    </Stack>
  );
}
