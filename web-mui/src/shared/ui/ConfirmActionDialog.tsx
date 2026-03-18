import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel,
  isSubmitting = false,
  onClose,
  onConfirm
}: ConfirmActionDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={isSubmitting}>
          {confirmLabel ?? t("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
