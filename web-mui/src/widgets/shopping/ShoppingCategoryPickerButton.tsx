import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Snackbar,
  Tooltip,
  Stack
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { ShoppingCategorySelector } from "./ShoppingCategorySelector";

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
    const trimmedCategoryName = newCategoryName.trim();
    const nextCategoryName = trimmedCategoryName || selectedCategory;

    if (!nextCategoryName) {
      return;
    }

    try {
      setIsSubmitting(true);
      if (trimmedCategoryName) {
        await onCreateCategory(trimmedCategoryName);
      }
      await onAdd(nextCategoryName);
      setFeedback({ type: "success", message: t("shopping.status.added") });
      setPickerOpen(false);
    } catch (error) {
      console.error("Failed to add shopping item", error);
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
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ShoppingCategorySelector
              categories={uniqueCategories}
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              isCreatingCategory={isCreatingCategory}
              onToggleCreateCategory={() => setIsCreatingCategory((current) => !current)}
              newCategoryName={newCategoryName}
              onNewCategoryNameChange={setNewCategoryName}
              disabled={isSubmitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t("shopping.dialog.cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={isSubmitting || (!selectedCategory && newCategoryName.trim().length === 0)}
          >
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
