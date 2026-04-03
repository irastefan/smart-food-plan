import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Box, Button, Card, Divider, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { SelfCareItem, SelfCareRoutineWeek, SelfCareSlot, SelfCareWeekday, SelfCareWeekdayKey } from "../../features/self-care/api/selfCareApi";

type SelfCareWeekBoardProps = {
  week: SelfCareRoutineWeek | null;
  onAddSlot: (weekday: SelfCareWeekdayKey) => void;
  onEditSlot: (slot: SelfCareSlot) => void;
  onDeleteSlot: (slot: SelfCareSlot) => void;
  onAddItem: (slot: SelfCareSlot) => void;
  onEditItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onDeleteItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onOpenAgent: () => void;
};

function DayColumn({
  weekday,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenAgent
}: {
  weekday: SelfCareWeekday;
  onAddSlot: (weekday: SelfCareWeekdayKey) => void;
  onEditSlot: (slot: SelfCareSlot) => void;
  onDeleteSlot: (slot: SelfCareSlot) => void;
  onAddItem: (slot: SelfCareSlot) => void;
  onEditItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onDeleteItem: (slot: SelfCareSlot, item: SelfCareItem) => void;
  onOpenAgent: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Paper
      sx={{
        p: 1.25,
        borderRadius: 1,
        height: "100%",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,251,0.98))"
      }}
    >
      <Stack spacing={1.25} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ textAlign: "start" }}>
              {t(`selfCare.weekday.${weekday.weekday.toLowerCase()}` as never)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weekday.slots.length === 0
                ? t("selfCare.day.emptyShort")
                : t("selfCare.day.slotCount", { count: weekday.slots.length } as never)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => onAddSlot(weekday.weekday)} title={t("selfCare.actions.addSlot")}>
            <AddRoundedIcon fontSize="small" />
          </IconButton>
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
                      <Typography variant="subtitle1" fontWeight={800}>
                        {slot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                            <Typography variant="body1" fontWeight={700}>
                              {item.title}
                            </Typography>
                            {item.description ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                                {item.description}
                              </Typography>
                            ) : null}
                            {item.note ? (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.4, display: "block" }}>
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
                    <Button size="small" startIcon={<SmartToyRoundedIcon fontSize="small" />} onClick={onOpenAgent}>
                      {t("selfCare.actions.askAi")}
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
  onAddItem,
  onEditItem,
  onDeleteItem,
  onOpenAgent
}: SelfCareWeekBoardProps) {
  const { t } = useLanguage();

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
        {week.weekdays.map((weekday) => (
          <DayColumn
            key={weekday.weekday}
            weekday={weekday}
            onAddSlot={onAddSlot}
            onEditSlot={onEditSlot}
            onDeleteSlot={onDeleteSlot}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onOpenAgent={onOpenAgent}
          />
        ))}
      </Box>
    </Stack>
  );
}
