import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Box, Button, Card, Divider, IconButton, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import {
  getCurrentWeekdayKey,
  selfCareWeekdayOrder,
  type SelfCareItem,
  type SelfCareRoutineWeek,
  type SelfCareSlot,
  type SelfCareWeekday,
  type SelfCareWeekdayKey
} from "../../features/self-care/api/selfCareApi";

type SelfCareWeekBoardProps = {
  week: SelfCareRoutineWeek | null;
  onAddSlot: (weekday: SelfCareWeekdayKey) => void;
  onEditSlot: (slot: SelfCareSlot) => void;
  onDeleteSlot: (slot: SelfCareSlot) => void;
  onCopySlot: (slot: SelfCareSlot) => void;
  onAddItem: (slot: SelfCareSlot) => void;
  onEditItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onDeleteItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onOpenAgent: (context?: { weekday: SelfCareWeekdayKey | null }) => void;
};

function DayColumn({
  weekday,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onCopySlot,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenAgent,
  isCurrentDay = false
}: {
  weekday: SelfCareWeekday;
  onAddSlot: (weekday: SelfCareWeekdayKey) => void;
  onEditSlot: (slot: SelfCareSlot) => void;
  onDeleteSlot: (slot: SelfCareSlot) => void;
  onCopySlot: (slot: SelfCareSlot) => void;
  onAddItem: (slot: SelfCareSlot) => void;
  onEditItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onDeleteItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onOpenAgent: (context?: { weekday: SelfCareWeekdayKey | null }) => void;
  isCurrentDay?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <Paper
      sx={{
        p: 1.25,
        borderRadius: 1,
        height: "100%",
        position: "relative",
        border: "1px solid",
        borderColor: isCurrentDay ? "rgba(16,185,129,0.45)" : "divider",
        boxShadow: isCurrentDay
          ? "0 20px 44px rgba(16,185,129,0.14)"
          : undefined,
        background: (theme) =>
          isCurrentDay
            ? theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(16,38,36,0.98), rgba(19,28,39,0.98))"
              : "linear-gradient(180deg, rgba(236,253,245,0.98), rgba(245,249,251,0.98))"
            : theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,251,0.98))"
      }}
    >
      <Stack spacing={1.25} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35 }}>
              <Typography variant="h6" fontWeight={800} sx={{ textAlign: "start" }}>
                {t(`selfCare.weekday.${weekday.weekday.toLowerCase()}` as never)}
              </Typography>
              {isCurrentDay ? (
                <Box
                  sx={{
                    px: 0.9,
                    py: 0.15,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1.6,
                    color: "#065f46",
                    backgroundColor: "rgba(16,185,129,0.14)"
                  }}
                >
                  {t("selfCare.today")}
                </Box>
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {weekday.slots.length === 0
                ? t("selfCare.day.emptyShort")
                : t("selfCare.day.slotCount", { count: weekday.slots.length } as never)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Button
              size="small"
              variant="text"
              startIcon={<SmartToyRoundedIcon fontSize="small" />}
              onClick={() => onOpenAgent({ weekday: weekday.weekday })}
              sx={{
                minWidth: 0,
                px: 0.9,
                whiteSpace: "nowrap"
              }}
            >
              {t("selfCare.actions.useAiAgent")}
            </Button>
            <IconButton size="small" onClick={() => onAddSlot(weekday.weekday)} title={t("selfCare.actions.addSlot")}>
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack spacing={1.1} sx={{ flex: 1 }}>
          {weekday.slots.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1,
                borderStyle: "dashed",
                textAlign: "start"
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                {t("selfCare.day.empty")}
              </Typography>
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddSlot(weekday.weekday)}>
                {t("selfCare.actions.addSlot")}
              </Button>
            </Paper>
          ) : (
            weekday.slots.map((slot) => (
              <Card
                key={slot.id}
                sx={{
                  borderRadius: 1,
                  overflow: "hidden",
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(180deg, rgba(19,25,37,0.96), rgba(14,20,31,0.96))"
                      : "linear-gradient(180deg, #ffffff, #f8fafc)"
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{ fontSize: { xs: "1.08rem", md: "1.14rem" }, lineHeight: 1.25 }}
                      >
                        {slot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.69rem", md: "0.73rem" } }}>
                        {slot.items.length === 0
                          ? t("selfCare.slot.emptyShort")
                          : t("selfCare.slot.stepCount", { count: slot.items.length } as never)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.25}>
                      <IconButton size="small" onClick={() => onEditSlot(slot)} title={t("common.edit")}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDeleteSlot(slot)} title={t("common.delete")}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>

                <Divider />

                <Stack spacing={0}>
                  {slot.items.length === 0 ? (
                    <Typography color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                      {t("selfCare.slot.empty")}
                    </Typography>
                  ) : (
                    slot.items.map((item) => (
                      <Box key={item.id} sx={{ px: 2, py: 1.35, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              sx={{ fontSize: { xs: "0.92rem", md: "0.98rem" }, lineHeight: 1.35 }}
                            >
                              {item.title}
                            </Typography>
                            {item.description ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.35, fontSize: { xs: "0.8rem", md: "0.875rem" }, lineHeight: 1.45 }}
                              >
                                {item.description}
                              </Typography>
                            ) : null}
                            {item.note ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 0.4, display: "block", fontSize: { xs: "0.68rem", md: "0.73rem" }, lineHeight: 1.45 }}
                              >
                                {item.note}
                              </Typography>
                            ) : null}
                          </Box>
                          <Stack direction="row" spacing={0.25}>
                            <IconButton size="small" onClick={() => onEditItem(slot, item)} title={t("common.edit")}>
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDeleteItem(slot, item)} title={t("common.delete")}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>

                <Divider />

                <Box sx={{ px: 2, py: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddItem(slot)}>
                      {t("selfCare.actions.addStep")}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ContentCopyRoundedIcon fontSize="small" />}
                      onClick={() => onCopySlot(slot)}
                    >
                      {t("selfCare.actions.copySlot")}
                    </Button>
                  </Stack>
                </Box>
              </Card>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function SelfCareWeekBoard({
  week,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onCopySlot,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenAgent
}: SelfCareWeekBoardProps) {
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const todayWeekday = getCurrentWeekdayKey();
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const orderedWeekdays = useMemo(
    () => (language === "he" ? [...selfCareWeekdayOrder.slice(-1), ...selfCareWeekdayOrder.slice(0, -1)] : selfCareWeekdayOrder),
    [language]
  );
  const orderedWeek = useMemo(
    () => orderedWeekdays
      .map((weekdayKey) => week?.weekdays.find((weekday) => weekday.weekday === weekdayKey) ?? null)
      .filter((weekday): weekday is SelfCareWeekday => Boolean(weekday)),
    [orderedWeekdays, week]
  );

  useEffect(() => {
    if (!isMobile || !week) {
      return;
    }

    const node = dayRefs.current[todayWeekday];
    if (!node) {
      return;
    }

    const timer = window.setTimeout(() => {
      node.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isMobile, todayWeekday, week]);

  if (!week) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ px: { xs: 0.5, md: 0 } }}>
        <Typography variant="h5" mb={0.5}>
          {t("selfCare.board.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("selfCare.board.subtitle")}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          gap: 2
        }}
      >
        {orderedWeek.map((weekday) => (
          <Box
            key={weekday.weekday}
            ref={(node) => {
              dayRefs.current[weekday.weekday] = node as HTMLDivElement | null;
            }}
          >
            <DayColumn
              weekday={weekday}
              onAddSlot={onAddSlot}
              onEditSlot={onEditSlot}
              onDeleteSlot={onDeleteSlot}
              onCopySlot={onCopySlot}
              onAddItem={onAddItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onOpenAgent={onOpenAgent}
              isCurrentDay={weekday.weekday === todayWeekday}
            />
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
