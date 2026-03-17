import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, Button, IconButton, Paper, Popover, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
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
  selectDayLabel: string;
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
  selectDayLabel,
  onDateChange
}: DayNavigatorHeaderProps) {
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);

  const selectedDateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "long"
  }).format(selectedLabel);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems={{ xs: "center", md: "center" }}
      flexWrap="wrap"
      spacing={1}
      sx={{ overflow: "visible" }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
          sx={{
            width: { xs: 40, md: 42 },
            height: { xs: 40, md: 42 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2.5,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)"
          }}
        >
          <ChevronLeftRoundedIcon />
        </IconButton>

        <Paper
          elevation={0}
          onClick={(event) => setCalendarAnchor(event.currentTarget)}
          sx={{
            px: { xs: 1.25, md: 1.5 },
            py: { xs: 0.9, md: 1 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.74)",
            cursor: "pointer",
            flex: 1,
            minWidth: 0
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,165,233,0.12))",
                color: "primary.main",
                flexShrink: 0
              }}
            >
              <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Stack spacing={0.15} sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 14, md: 15 }, fontWeight: 800, lineHeight: 1.2 }} noWrap>
                {selectedDateLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 11, md: 12 } }} noWrap>
                {weekLabel} {weekNumber} •{" "}
                {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekStart)} -{" "}
                {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekEnd)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, 1))}
          sx={{
            width: { xs: 40, md: 42 },
            height: { xs: 40, md: 42 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2.5,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)"
          }}
        >
          <ChevronRightRoundedIcon />
        </IconButton>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          overflow: "visible",
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          px: 0.5,
          py: 0.5,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)"
        }}
      >
        <Button
          variant="text"
          onClick={() => onDateChange(getTodayIsoDateLocal())}
          sx={{
            minWidth: "auto",
            minHeight: 32,
            px: 1.1,
            py: 0.45,
            borderRadius: 999,
            color: "text.primary",
            fontSize: 12,
            fontWeight: 700
          }}
        >
          {todayLabel}
        </Button>
      </Paper>

      <Popover
        open={Boolean(calendarAnchor)}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Stack spacing={1.25} sx={{ p: 1.5, minWidth: 220 }}>
          <Typography fontWeight={800}>{selectDayLabel}</Typography>
          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={(event) => {
              onDateChange(event.target.value);
              setCalendarAnchor(null);
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Popover>
    </Stack>
  );
}
