import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ShoppingCategoryDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function ShoppingCategoryDialog({ open, isSubmitting, onClose, onSubmit }: ShoppingCategoryDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");

  function handleClose() {
    setName("");
    onClose();
  }

  function handleSubmit() {
    const value = name.trim();
    if (!value) {
      return;
    }
    onSubmit(value);
    setName("");
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("shopping.categoryDialog.title")}</DialogTitle>
      <DialogContent>
        <Stack sx={{ pt: 1 }}>
          <TextField
            label={t("shopping.categoryDialog.name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose}>{t("shopping.dialog.cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<AddRoundedIcon />} disabled={isSubmitting || name.trim().length === 0}>
          {t("shopping.categoryDialog.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
