import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ShoppingCategorySelectorProps = {
  categories: string[];
  selectedCategory: string;
  onSelectedCategoryChange: (value: string) => void;
  isCreatingCategory: boolean;
  onToggleCreateCategory: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  disabled?: boolean;
};

export function ShoppingCategorySelector({
  categories,
  selectedCategory,
  onSelectedCategoryChange,
  isCreatingCategory,
  onToggleCreateCategory,
  newCategoryName,
  onNewCategoryNameChange,
  disabled = false
}: ShoppingCategorySelectorProps) {
  const { t } = useLanguage();

  return (
    <Stack spacing={2}>
      <FormControl fullWidth size="small" disabled={disabled || categories.length === 0}>
        <InputLabel id="shopping-category-selector-label">{t("shopping.dialog.category")}</InputLabel>
        <Select
          labelId="shopping-category-selector-label"
          value={selectedCategory}
          label={t("shopping.dialog.category")}
          onChange={(event) => onSelectedCategoryChange(event.target.value)}
        >
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {categories.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("shopping.picker.noCategories")}
        </Typography>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
        <Button
          variant="outlined"
          size="small"
          onClick={onToggleCreateCategory}
          disabled={disabled}
          sx={{ flexShrink: 0, minHeight: 40 }}
        >
          {t("shopping.addCategory")}
        </Button>
        {isCreatingCategory ? (
          <TextField
            fullWidth
            size="small"
            label={t("shopping.categoryDialog.name")}
            value={newCategoryName}
            onChange={(event) => onNewCategoryNameChange(event.target.value)}
            disabled={disabled}
            autoFocus
            sx={{ "& .MuiInputBase-root": { minHeight: 40 } }}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
