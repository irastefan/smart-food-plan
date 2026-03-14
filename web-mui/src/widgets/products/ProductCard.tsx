import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { ProductSummary } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type ProductCardProps = {
  product: ProductSummary;
  onAddToShopping?: (product: ProductSummary) => void;
};

export function ProductCard({ product, onAddToShopping }: ProductCardProps) {
  const { t } = useLanguage();

  return (
    <Card sx={{ height: "100%", borderRadius: 2, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", boxShadow: (theme) => theme.shadows[2] }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
            <Box>
              <Typography variant="h5" fontWeight={800}>{product.title}</Typography>
              <Typography color="text.secondary">{product.brand || t("products.noBrand")}</Typography>
            </Box>
            <Chip icon={<LocalFireDepartmentRoundedIcon />} label={`${Math.round(product.nutritionPer100g.caloriesKcal)} kcal`} sx={{ ".MuiChip-icon": { color: "#fb923c" } }} />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<ScaleRoundedIcon />} label={t("products.per100g")} variant="outlined" />
          </Stack>

          <Stack direction="row" spacing={2.5}>
            <Macro label={t("product.macros.protein")} value={product.nutritionPer100g.proteinG} color="#22c55e" />
            <Macro label={t("product.macros.fat")} value={product.nutritionPer100g.fatG} color="#f59e0b" />
            <Macro label={t("product.macros.carbs")} value={product.nutritionPer100g.carbsG} color="#38bdf8" />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button component={RouterLink} to={`/products/${product.id}`} variant="contained" sx={{ alignSelf: "flex-start" }}>
              {t("products.view")}
            </Button>
            {onAddToShopping ? (
              <Button
                variant="outlined"
                startIcon={<AddShoppingCartRoundedIcon />}
                onClick={() => onAddToShopping(product)}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("shopping.addFromProduct")}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={800} sx={{ color }}>{value.toFixed(1)}g</Typography>
    </Stack>
  );
}
