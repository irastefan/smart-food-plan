import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { type SelfCareSlot, type SelfCareWeekdayKey, selfCareWeekdayOrder } from "../../features/self-care/api/selfCareApi";

type SelfCareCopySlotDialogProps = {
  open: boolean;
  slot: SelfCareSlot | null;
  onClose: () => void;
  onSubmit: (weekdays: SelfCareWeekdayKey[]) => Promise<void> | void;
};

export function SelfCareCopySlotDialog({ open, slot, onClose, onSubmit }: SelfCareCopySlotDialogProps) {
  const { t, language } = useLanguage();
  const orderedWeekdays = useMemo(
    () => (language === "he" ? [...selfCareWeekdayOrder.slice(-1), ...selfCareWeekdayOrder.slice(0, -1)] : selfCareWeekdayOrder),
    [language]
  );
  const [selectedWeekdays, setSelectedWeekdays] = useState<SelfCareWeekdayKey[]>([]);

  const availableWeekdays = orderedWeekdays.filter((weekday) => weekday !== slot?.weekday);

  function toggleWeekday(weekday: SelfCareWeekdayKey) {
    setSelectedWeekdays((current) =>
      current.includes(weekday) ? current.filter((value) => value !== weekday) : [...current, weekday]
    );
  }

  async function handleSubmit() {
    await onSubmit(selectedWeekdays);
    setSelectedWeekdays([]);
  }

  function handleClose() {
    setSelectedWeekdays([]);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("selfCare.copyDialog.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            {slot
              ? t("selfCare.copyDialog.subtitle", {
                  slot: slot.name,
                  weekday: t(`selfCare.weekday.${slot.weekday.toLowerCase()}` as never)
                } as never)
              : ""}
          </Typography>
          <Stack spacing={0.25}>
            {availableWeekdays.map((weekday) => (
              <FormControlLabel
                key={weekday}
                control={<Checkbox checked={selectedWeekdays.includes(weekday)} onChange={() => toggleWeekday(weekday)} />}
                label={t(`selfCare.weekday.${weekday.toLowerCase()}` as never)}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={selectedWeekdays.length === 0}>
          {t("selfCare.copyDialog.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
