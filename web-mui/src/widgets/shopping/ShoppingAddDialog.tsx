import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from "@mui/material";
import { useMemo, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { ProductSummary } from "../../features/products/api/productsApi";

type ShoppingAddDialogProps = {
  open: boolean;
  products: ProductSummary[];
  categories: string[];
  isSubmitting: boolean;
  onClose: () => void;
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
  onSubmit
}: ShoppingAddDialogProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [categoryName, setCategoryName] = useState("");
  const [note, setNote] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.title.toLowerCase() === inputValue.trim().toLowerCase()),
    [inputValue, products]
  );

  function reset() {
    setInputValue("");
    setAmount("1");
    setUnit("pcs");
    setCategoryName("");
    setNote("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    onSubmit({
      mode: selectedProduct ? "product" : "custom",
      product: selectedProduct,
      customName: selectedProduct ? undefined : inputValue.trim(),
      amount: amount.trim().length > 0 ? Number(amount) : undefined,
      unit,
      categoryName,
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

          <Autocomplete
            freeSolo
            options={categories}
            value={categoryName}
            onInputChange={(_, value) => setCategoryName(value)}
            onChange={(_, value) => setCategoryName(typeof value === "string" ? value : "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("shopping.dialog.category")}
                placeholder={t("shopping.dialog.categoryPlaceholder")}
              />
            )}
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
        <Button onClick={handleClose}>{t("shopping.dialog.cancel")}</Button>
        <Button onClick={handleSubmit} variant="contained" startIcon={<AddShoppingCartRoundedIcon />} disabled={isSubmitting || inputValue.trim().length === 0}>
          {t("shopping.dialog.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
