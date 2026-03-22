import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { ProductSummary } from "../../features/products/api/productsApi";
import { ShoppingCategorySelector } from "./ShoppingCategorySelector";

type ShoppingAddDialogProps = {
  open: boolean;
  products: ProductSummary[];
  categories: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreateCategory: (name: string) => Promise<void> | void;
  onSubmit: (payload: {
    mode: "product" | "custom";
    product?: ProductSummary;
    customName?: string;
    amount?: number;
    unit?: string;
    categoryName?: string;
    note?: string;
  }) => void;
};

export function ShoppingAddDialog({
  open,
  products,
  categories,
  isSubmitting,
  onClose,
  onCreateCategory,
  onSubmit
}: ShoppingAddDialogProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [note, setNote] = useState("");

  const uniqueCategories = useMemo(
    () => Array.from(new Set(categories)).sort((left, right) => left.localeCompare(right)),
    [categories]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.title.toLowerCase() === inputValue.trim().toLowerCase()),
    [inputValue, products]
  );

  useEffect(() => {
    setSelectedCategory((current) => {
      if (current && uniqueCategories.includes(current)) {
        return current;
      }
      return uniqueCategories[0] ?? "";
    });
  }, [uniqueCategories]);

  function reset() {
    setInputValue("");
    setAmount("1");
    setUnit("pcs");
    setSelectedCategory("");
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setNote("");
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }
    reset();
    onClose();
  }

  async function handleSubmit() {
    const trimmedCategoryName = newCategoryName.trim();
    const nextCategoryName = trimmedCategoryName || selectedCategory;

    if (trimmedCategoryName) {
      await onCreateCategory(trimmedCategoryName);
    }

    await onSubmit({
      mode: selectedProduct ? "product" : "custom",
      product: selectedProduct,
      customName: selectedProduct ? undefined : inputValue.trim(),
      amount: amount.trim().length > 0 ? Number(amount) : undefined,
      unit,
      categoryName: nextCategoryName,
      note
    });
    reset();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("shopping.dialog.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Autocomplete
            freeSolo
            options={products.map((product) => product.title)}
            value={inputValue}
            onInputChange={(_, value) => setInputValue(value)}
            onChange={(_, value) => setInputValue(typeof value === "string" ? value : "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("shopping.dialog.item")}
                placeholder={t("shopping.dialog.itemPlaceholder")}
              />
            )}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label={t("shopping.dialog.amount")}
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              fullWidth
            />
            <TextField label={t("shopping.dialog.unit")} value={unit} onChange={(event) => setUnit(event.target.value)} fullWidth />
          </Stack>

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

          <TextField
            label={t("shopping.dialog.note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>{t("shopping.dialog.cancel")}</Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddShoppingCartRoundedIcon />}
          disabled={isSubmitting || inputValue.trim().length === 0 || (!selectedCategory && newCategoryName.trim().length === 0)}
        >
          {t("shopping.dialog.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
