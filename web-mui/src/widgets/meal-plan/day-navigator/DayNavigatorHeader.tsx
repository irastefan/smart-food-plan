import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Button, IconButton, Paper, Popover, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import { isRtlLanguage } from "../../../shared/i18n/languages";
import { getTodayIsoDateLocal, parseIsoDate, shiftIsoDate } from "../dayNavigation";

type DayNavigatorHeaderProps = {
  locale: string;
  selectedDate: string;
  todayLabel: string;
  selectDayLabel: string;
  onDateChange: (date: string) => void;
};

export function DayNavigatorHeader({
  locale,
  selectedDate,
  todayLabel,
  selectDayLabel,
  onDateChange
}: DayNavigatorHeaderProps) {
  const { language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const previousIcon = isRtl ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />;
  const nextIcon = isRtl ? <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />;
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const selected = parseIsoDate(selectedDate);
  const isToday = selectedDate === getTodayIsoDateLocal();

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "long",
    day: "numeric"
  }).format(selected);

  return (
    <Stack direction="row" spacing={{ xs: 0.75, md: 1 }} alignItems="center">
      <IconButton
        onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
        sx={{
          width: { xs: 36, md: 40 },
          height: { xs: 36, md: 40 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50%",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
          flexShrink: 0
        }}
      >
        {previousIcon}
      </IconButton>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 1, md: 1.25 },
          py: { xs: 0.75, md: 0.9 },
          borderRadius: 999,
          border: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)"
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton
            onClick={(event) => setCalendarAnchor(event.currentTarget)}
            sx={{
              width: { xs: 28, md: 30 },
              height: { xs: 28, md: 30 },
              border: "1px solid",
              borderColor: "rgba(16,185,129,0.24)",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(14,165,233,0.12))",
              color: "primary.main",
              flexShrink: 0
            }}
          >
            <CalendarMonthRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Stack spacing={0.05} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: 13, md: 15 }, fontWeight: 800, lineHeight: 1.15 }} noWrap>
              {dateLabel}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <IconButton
        onClick={() => onDateChange(shiftIsoDate(selectedDate, 1))}
        sx={{
          width: { xs: 36, md: 40 },
          height: { xs: 36, md: 40 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50%",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(31, 36, 54, 0.92)" : "rgba(255,255,255,0.86)",
          flexShrink: 0
        }}
      >
        {nextIcon}
      </IconButton>

      <Button
        variant="text"
        onClick={() => onDateChange(getTodayIsoDateLocal())}
        sx={{
          minWidth: "auto",
          minHeight: { xs: 36, md: 40 },
          px: { xs: 1.15, md: 1.35 },
          py: 0.45,
          borderRadius: 999,
          border: "1px solid",
          borderColor: isToday ? "primary.main" : "divider",
          color: isToday ? "primary.contrastText" : "text.primary",
          background: (theme) =>
            isToday
              ? theme.palette.primary.main
              : theme.palette.mode === "dark"
                ? "rgba(31, 36, 54, 0.92)"
                : "rgba(255,255,255,0.86)",
          boxShadow: isToday ? "0 10px 22px rgba(16, 185, 129, 0.14)" : "none",
          fontSize: { xs: 12, md: 13 },
          fontWeight: 700,
          whiteSpace: "nowrap",
          flexShrink: 0
        }}
      >
        {todayLabel}
      </Button>

      <Popover
        open={Boolean(calendarAnchor)}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: isRtl ? "right" : "left" }}
        transformOrigin={{ vertical: "top", horizontal: isRtl ? "right" : "left" }}
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
