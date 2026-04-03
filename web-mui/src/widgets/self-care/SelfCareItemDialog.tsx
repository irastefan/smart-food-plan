import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { SelfCareItem } from "../../features/self-care/api/selfCareApi";

type SelfCareItemDialogProps = {
  open: boolean;
  item?: SelfCareItem | null;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string; note: string }) => Promise<void> | void;
};

export function SelfCareItemDialog({ open, item, onClose, onSubmit }: SelfCareItemDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setNote(item?.note ?? "");
  }, [item, open]);

  async function handleSubmit() {
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      note: note.trim()
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{item ? t("selfCare.itemDialog.editTitle") : t("selfCare.itemDialog.createTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("selfCare.itemDialog.title")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("selfCare.itemDialog.titlePlaceholder")}
          />
          <TextField
            label={t("selfCare.itemDialog.description")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={2}
            placeholder={t("selfCare.itemDialog.descriptionPlaceholder")}
          />
          <TextField
            label={t("selfCare.itemDialog.note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
            placeholder={t("selfCare.itemDialog.notePlaceholder")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button onClick={() => void handleSubmit()} variant="contained" disabled={title.trim().length === 0}>
          {item ? t("common.save") : t("common.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
