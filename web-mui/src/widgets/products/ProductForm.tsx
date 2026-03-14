import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { ProductFormValues } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ProductFormProps = {
  value: ProductFormValues;
  isSubmitting: boolean;
  status?: { type: "error" | "success" | "info"; message: string } | null;
  submitLabel: string;
  onChange: (nextValue: ProductFormValues) => void;
  onSubmit: () => void;
};

export function ProductForm({ value, isSubmitting, status, submitLabel, onChange, onSubmit }: ProductFormProps) {
  const { t } = useLanguage();

  function update<K extends keyof ProductFormValues>(key: K, nextValue: ProductFormValues[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Stack spacing={3}>
      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={800}>{t("product.form.basics")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("product.form.title")} value={value.title} onChange={(event) => update("title", event.target.value)} fullWidth />
            <TextField label={t("product.form.brand")} value={value.brand} onChange={(event) => update("brand", event.target.value)} fullWidth />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={800}>{t("products.nutrition")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("product.form.calories")} type="number" value={value.calories} onChange={(event) => update("calories", Math.max(0, Number(event.target.value) || 0))} fullWidth />
            <TextField label={t("product.form.protein")} type="number" value={value.protein} onChange={(event) => update("protein", Math.max(0, Number(event.target.value) || 0))} fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("product.form.fat")} type="number" value={value.fat} onChange={(event) => update("fat", Math.max(0, Number(event.target.value) || 0))} fullWidth />
            <TextField label={t("product.form.carbs")} type="number" value={value.carbs} onChange={(event) => update("carbs", Math.max(0, Number(event.target.value) || 0))} fullWidth />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Metric label="kcal" value={Math.round(value.calories).toString()} />
            <Metric label={t("product.macros.protein")} value={`${value.protein.toFixed(1)} g`} />
            <Metric label={t("product.macros.fat")} value={`${value.fat.toFixed(1)} g`} />
            <Metric label={t("product.macros.carbs")} value={`${value.carbs.toFixed(1)} g`} />
          </Stack>
          <Button onClick={onSubmit} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ px: 1.5, py: 1.25, borderRadius: 2, bgcolor: "action.hover", minWidth: 92 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}
