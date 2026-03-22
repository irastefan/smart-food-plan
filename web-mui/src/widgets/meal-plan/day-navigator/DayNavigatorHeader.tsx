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
  selectedShortLabel: string;
  selectDayLabel: string;
  onDateChange: (date: string) => void;
};

export function DayNavigatorHeader({
  locale,
  selectedDate,
  selectedLabel,
  todayLabel,
  selectedShortLabel,
  selectDayLabel,
  onDateChange
}: DayNavigatorHeaderProps) {
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const isToday = selectedDate === getTodayIsoDateLocal();

  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(selectedLabel);
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(selectedLabel);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "short" }).format(selectedLabel);
  const compactLabel = `${weekdayLabel} ${dayNumber} ${monthLabel}`;

  return (
    <Stack
      direction={{ xs: "row", md: "column" }}
      alignItems="stretch"
      spacing={{ xs: 1, md: 0.9 }}
      useFlexGap
      sx={{ overflow: "visible" }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ order: { xs: 2, md: 1 }, flexShrink: 0, ml: { xs: 0.25, md: 0 } }}
      >
        <Button
          variant="text"
          onClick={() => onDateChange(getTodayIsoDateLocal())}
          startIcon={<TodayRoundedIcon sx={{ fontSize: 16 }} />}
          sx={{
            minWidth: "auto",
            minHeight: { xs: 30, md: 34 },
            px: { xs: 0.9, md: 1.1 },
            py: 0.3,
            borderRadius: 1.5,
            border: "1px solid",
            borderColor: "divider",
            color: "text.primary",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            fontSize: { xs: 11, md: 12 },
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
              width: { xs: 30, md: 36 },
              height: { xs: 30, md: 36 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,165,233,0.12))",
              color: "primary.main"
            }}
          >
            <CalendarMonthRoundedIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        alignItems="stretch"
        sx={{ minWidth: 0, flex: 1, order: { xs: 1, md: 2 }, pr: { xs: 0.25, md: 0 } }}
      >
        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
          sx={{
            width: { xs: 30, md: 38 },
            height: { xs: 30, md: 38 },
            alignSelf: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "50%",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            flexShrink: 0
          }}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
        </IconButton>

        <Paper
          elevation={0}
          sx={{
            position: "relative",
            px: { xs: 1.05, md: 1.35 },
            py: { xs: 0.6, md: 1.1 },
            borderRadius: 1.25,
            border: "1px solid",
            borderColor: "primary.main",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(223, 248, 238, 0.10), rgba(16,185,129,0.16))"
                : "linear-gradient(180deg, rgba(239, 251, 246, 0.98), rgba(214, 245, 232, 0.96))",
            boxShadow: "0 12px 24px rgba(16, 185, 129, 0.12)",
            flex: 1,
            maxWidth: { xs: 132, md: "none" },
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Stack justifyContent="center" alignItems={{ xs: "flex-start", md: "center" }} textAlign={{ xs: "left", md: "center" }} sx={{ minHeight: { xs: 28, md: 62 }, width: "100%" }}>
            <Box
              sx={{
                position: "absolute",
                top: { xs: 5, md: 8 },
                right: { xs: 5, md: 8 },
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                px: { xs: 0.42, md: 0.75 },
                minHeight: { xs: 14, md: 18 },
                borderRadius: 999,
                background: "linear-gradient(135deg, #60d5b0 0%, #10b981 100%)",
                color: "primary.contrastText",
                fontSize: { xs: 6, md: 9 },
                fontWeight: 800,
                lineHeight: 1
              }}
            >
              {isToday ? todayLabel : selectedShortLabel}
            </Box>
            <Typography
              sx={{
                display: { xs: "block", md: "none" },
                fontSize: 13,
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.1,
                pr: 4.4
              }}
            >
              {compactLabel}
            </Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 10, fontWeight: 800, color: "primary.main", lineHeight: 1.1 }}>
              {weekdayLabel}
            </Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 30, fontWeight: 800, lineHeight: 1.02 }}>
              {dayNumber}
            </Typography>
            <Typography color="text.secondary" sx={{ display: { xs: "none", md: "block" }, fontSize: 11, lineHeight: 1.1 }}>
              {monthLabel}
            </Typography>
          </Stack>
        </Paper>

        <IconButton
          onClick={() => onDateChange(shiftIsoDate(selectedDate, 1))}
          sx={{
            width: { xs: 30, md: 38 },
            height: { xs: 30, md: 38 },
            alignSelf: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "50%",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
            flexShrink: 0
          }}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
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
