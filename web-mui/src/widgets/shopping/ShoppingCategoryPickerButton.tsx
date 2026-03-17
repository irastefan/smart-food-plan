import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CreateNewFolderRoundedIcon from "@mui/icons-material/CreateNewFolderRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ShoppingCategoryPickerButtonProps = {
  categories: string[];
  disabled?: boolean;
  label?: string;
  startIcon?: ReactNode;
  iconOnly?: boolean;
  tooltip?: string;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  onAdd: (categoryName: string) => Promise<void> | void;
  onCreateCategory: (name: string) => Promise<void> | void;
};

export function ShoppingCategoryPickerButton({
  categories,
  disabled,
  label,
  startIcon,
  iconOnly = false,
  tooltip,
  variant = "outlined",
  size = "medium",
  onAdd,
  onCreateCategory
}: ShoppingCategoryPickerButtonProps) {
  const { t } = useLanguage();
  const uniqueCategories = useMemo(
    () => Array.from(new Set(categories)).sort((left, right) => left.localeCompare(right)),
    [categories]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setSelectedCategory((current) => {
      if (current && uniqueCategories.includes(current)) {
        return current;
      }
      return uniqueCategories[0] ?? "";
    });
  }, [uniqueCategories]);

  async function handleSubmit() {
    if (!selectedCategory) {
      return;
    }
    try {
      setIsSubmitting(true);
      await onAdd(selectedCategory);
      setFeedback({ type: "success", message: t("shopping.status.added") });
      setPickerOpen(false);
    } catch (error) {
      console.error("Failed to add shopping item", error);
      setFeedback({ type: "error", message: t("shopping.status.addError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCategory(name: string) {
    try {
      setIsSubmitting(true);
      await onCreateCategory(name);
      await onAdd(name);
      setPickerOpen(false);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setFeedback({ type: "success", message: t("shopping.status.added") });
    } catch (error) {
      console.error("Failed to create shopping category", error);
      setFeedback({ type: "error", message: t("shopping.status.addError") });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setPickerOpen(false);
    setIsCreatingCategory(false);
    setNewCategoryName("");
  }

  return (
    <>
      {iconOnly ? (
        <Tooltip title={tooltip ?? label ?? t("shopping.add")}>
          <span>
            <IconButton size={size === "large" ? "medium" : size} disabled={disabled || isSubmitting} onClick={() => setPickerOpen(true)}>
              {isSubmitting ? <CircularProgress size={18} /> : startIcon ?? <AddRoundedIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Button
          variant={variant}
          size={size}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : startIcon ?? <AddRoundedIcon />}
          disabled={disabled || isSubmitting}
          onClick={() => setPickerOpen(true)}
        >
          {label ?? t("shopping.add")}
        </Button>
      )}

      <Dialog open={pickerOpen} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>{t("shopping.dialog.category")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small" disabled={isSubmitting || uniqueCategories.length === 0}>
              <InputLabel id="shopping-category-picker-label">{t("shopping.dialog.category")}</InputLabel>
              <Select
                labelId="shopping-category-picker-label"
                value={selectedCategory}
                label={t("shopping.dialog.category")}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {uniqueCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("shopping.picker.noCategories")}
              </Typography>
            ) : null}
            <Button
              variant="outlined"
              size="small"
              startIcon={<CreateNewFolderRoundedIcon />}
              onClick={() => setIsCreatingCategory((current) => !current)}
              disabled={isSubmitting}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("shopping.addCategory")}
            </Button>
            <Collapse in={isCreatingCategory}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pt: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("shopping.categoryDialog.name")}
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  autoFocus={isCreatingCategory}
                  disabled={isSubmitting}
                  sx={{ "& .MuiInputBase-root": { minHeight: 40 } }}
                />
                <Button
                  variant="contained"
                  onClick={() => void handleCreateCategory(newCategoryName.trim())}
                  disabled={isSubmitting || newCategoryName.trim().length === 0}
                  sx={{ flexShrink: 0, minHeight: 40 }}
                >
                  {isSubmitting ? <CircularProgress size={16} color="inherit" /> : t("shopping.categoryDialog.add")}
                </Button>
              </Stack>
            </Collapse>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t("shopping.dialog.cancel")}
          </Button>
          <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting || !selectedCategory}>
            {isSubmitting ? <CircularProgress size={16} color="inherit" /> : t("shopping.tooltip.addToList")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(feedback)} autoHideDuration={2500} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={feedback?.type ?? "success"} onClose={() => setFeedback(null)} sx={{ width: "100%" }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
