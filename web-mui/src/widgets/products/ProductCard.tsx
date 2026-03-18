import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { ProductSummary } from "../../features/products/api/productsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { ShoppingCategoryPickerButton } from "../shopping/ShoppingCategoryPickerButton";

type ProductCardProps = {
  product: ProductSummary;
  shoppingCategories?: string[];
  onAddToShopping?: (product: ProductSummary, categoryName: string) => Promise<void> | void;
  onCreateShoppingCategory?: (name: string) => Promise<void> | void;
  onDelete?: (product: ProductSummary) => void;
};

export function ProductCard({ product, shoppingCategories = [], onAddToShopping, onCreateShoppingCategory, onDelete }: ProductCardProps) {
  const { t } = useLanguage();

  return (
    <Card sx={{ height: "100%", borderRadius: 1.25, border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", boxShadow: (theme) => theme.shadows[2] }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
            <Box>
              <Typography
                component={RouterLink}
                to={`/products/${product.id}`}
                variant="h5"
                fontWeight={800}
                sx={{
                  display: "inline-block",
                  textDecoration: "none",
                  color: "text.primary",
                  fontSize: { xs: "1.05rem", sm: "1.3rem" },
                  "&:hover": {
                    color: "primary.main"
                  }
                }}
              >
                {product.title}
              </Typography>
              <Typography color="text.secondary">{product.brand || t("products.noBrand")}</Typography>
            </Box>
            <Chip icon={<LocalFireDepartmentRoundedIcon />} label={`${Math.round(product.nutritionPer100g.caloriesKcal)} kcal`} sx={{ ".MuiChip-icon": { color: "#fb923c" } }} />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<ScaleRoundedIcon />} label={t("products.per100g")} variant="outlined" />
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Macro label={t("product.macros.protein")} value={product.nutritionPer100g.proteinG} color="#ffb547" />
            <Macro label={t("product.macros.fat")} value={product.nutritionPer100g.fatG} color="#d58bff" />
            <Macro label={t("product.macros.carbs")} value={product.nutritionPer100g.carbsG} color="#4dd6e3" />
          </Stack>

          <Stack direction="row" spacing={0.75} justifyContent="flex-end">
            {onAddToShopping && onCreateShoppingCategory ? (
              <ShoppingCategoryPickerButton
                categories={shoppingCategories}
                iconOnly
                size="small"
                tooltip={t("shopping.tooltip.addToList")}
                startIcon={<AddShoppingCartRoundedIcon />}
                onAdd={(categoryName) => onAddToShopping(product, categoryName)}
                onCreateCategory={onCreateShoppingCategory}
              />
            ) : null}
            {onDelete ? (
              <Tooltip title={t("products.delete")}>
                <IconButton size="small" color="error" onClick={() => onDelete(product)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ px: 1.1, py: 0.85, borderRadius: 1.1, bgcolor: "action.hover", minWidth: 84 }}>
      <Typography variant="caption" sx={{ color, display: "block", mb: 0.2 }}>
        {label}
      </Typography>
      <Typography fontWeight={800} sx={{ fontSize: { xs: "0.92rem", sm: "1rem" } }}>
        {value.toFixed(1)}g
      </Typography>
    </Box>
  );
}
