import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import { Box, Button, IconButton, Paper, Popover, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { getTodayIsoDateLocal, shiftIsoDate } from "../dayNavigation";

type DayNavigatorHeaderProps = {
  locale: string;
  selectedDate: string;
  selectedLabel: Date;
  todayLabel: string;
  selectDayLabel: string;
  onDateChange: (date: string) => void;
};

export function DayNavigatorHeader({
  locale,
  selectedDate,
  selectedLabel,
  todayLabel,
  selectDayLabel,
  onDateChange
}: DayNavigatorHeaderProps) {
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);

  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(selectedLabel);
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(selectedLabel);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "short" }).format(selectedLabel);

  return (
    <Stack
      direction={{ xs: "row", md: "column" }}
      alignItems="stretch"
      spacing={{ xs: 1, md: 0.9 }}
      sx={{ overflow: "visible" }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ order: { xs: 2, md: 1 }, flexShrink: 0 }}
      >
        <Button
          variant="text"
          onClick={() => onDateChange(getTodayIsoDateLocal())}
          startIcon={<TodayRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            minWidth: "auto",
            minHeight: { xs: 32, md: 34 },
            px: 1.1,
            py: 0.35,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            color: "text.primary",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap"
          }}
        >
          {todayLabel}
        </Button>
        <Tooltip title={selectDayLabel}>
          <IconButton
            onClick={(event) => setCalendarAnchor(event.currentTarget)}
            sx={{
              width: { xs: 34, md: 36 },
              height: { xs: 34, md: 36 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,165,233,0.12))",
              color: "primary.main"
            }}
          >
            <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        alignItems="stretch"
        sx={{ minWidth: 0, flex: 1, order: { xs: 1, md: 2 } }}
      >
        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
          sx={{
            width: { xs: 34, md: 38 },
            height: { xs: 34, md: 38 },
            alignSelf: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "50%",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            flexShrink: 0
          }}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            px: { xs: 1.15, md: 1.35 },
            py: { xs: 0.7, md: 1.1 },
            borderRadius: 1.25,
            border: "1px solid",
            borderColor: "primary.main",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(223, 248, 238, 0.10), rgba(16,185,129,0.16))"
                : "linear-gradient(180deg, rgba(239, 251, 246, 0.98), rgba(214, 245, 232, 0.96))",
            boxShadow: "0 12px 24px rgba(16, 185, 129, 0.12)",
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Stack
            direction={{ xs: "row", md: "column" }}
            justifyContent="center"
            alignItems={{ xs: "center", md: "center" }}
            textAlign={{ xs: "left", md: "center" }}
            spacing={{ xs: 0.7, md: 0 }}
            sx={{ minHeight: { xs: 34, md: 62 }, width: "100%" }}
          >
            <Box
              sx={{
                position: "absolute",
                top: { xs: 7, md: 8 },
                right: { xs: 7, md: 8 },
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 0.55, md: 0.75 },
                minHeight: { xs: 16, md: 18 },
                borderRadius: 999,
                background: "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)",
                color: "primary.contrastText",
                fontSize: { xs: 8, md: 9 },
                fontWeight: 800,
                lineHeight: 1
              }}
            >
              {todayLabel}
            </Box>
            <Typography sx={{ fontSize: { xs: 9, md: 10 }, fontWeight: 800, color: "primary.main", lineHeight: 1.1 }}>
              {weekdayLabel}
            </Typography>
            <Typography sx={{ fontSize: { xs: 20, md: 30 }, fontWeight: 800, lineHeight: 1.02 }}>
              {dayNumber}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: 10, md: 11 }, lineHeight: 1.1 }}>
              {monthLabel}
            </Typography>
          </Stack>
        </Paper>

        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, 1))}
          sx={{
            width: { xs: 34, md: 38 },
            height: { xs: 34, md: 38 },
            alignSelf: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "50%",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            flexShrink: 0
          }}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

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
