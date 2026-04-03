import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { type SelfCareSlot, type SelfCareWeekdayKey, selfCareWeekdayOrder } from "../../features/self-care/api/selfCareApi";

type SelfCareSlotDialogProps = {
  open: boolean;
  initialWeekday: SelfCareWeekdayKey;
  slot?: SelfCareSlot | null;
  onClose: () => void;
  onSubmit: (input: { weekday: SelfCareWeekdayKey; name: string }) => Promise<void> | void;
};

export function SelfCareSlotDialog({ open, initialWeekday, slot, onClose, onSubmit }: SelfCareSlotDialogProps) {
  const { t, language } = useLanguage();
  const [weekday, setWeekday] = useState<SelfCareWeekdayKey>(initialWeekday);
  const [name, setName] = useState("");
  const orderedWeekdays = useMemo(
    () => (language === "he" ? [...selfCareWeekdayOrder.slice(-1), ...selfCareWeekdayOrder.slice(0, -1)] : selfCareWeekdayOrder),
    [language]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setWeekday(slot?.weekday ?? initialWeekday);
    setName(slot?.name ?? "");
  }, [initialWeekday, open, slot]);

  async function handleSubmit() {
    await onSubmit({ weekday, name: name.trim() });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{slot ? t("selfCare.slotDialog.editTitle") : t("selfCare.slotDialog.createTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label={t("selfCare.slotDialog.weekday")}
            value={weekday}
            onChange={(event) => setWeekday(event.target.value as SelfCareWeekdayKey)}
          >
            {orderedWeekdays.map((weekdayOption) => (
              <MenuItem key={weekdayOption} value={weekdayOption}>
                {t(`selfCare.weekday.${weekdayOption.toLowerCase()}` as never)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("selfCare.slotDialog.name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("selfCare.slotDialog.namePlaceholder")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={name.trim().length === 0}>
          {slot ? t("common.save") : t("common.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
