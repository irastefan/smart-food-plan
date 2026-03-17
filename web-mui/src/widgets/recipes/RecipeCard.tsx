import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import heroImage from "../../assets/hero.png";
import { getRecipeCategoryLabel } from "../../features/recipes/model/recipeCategories";

type RecipeCardProps = {
  recipe: RecipeSummary;
  onAddToShopping?: (recipe: RecipeSummary) => void;
};

export function RecipeCard({ recipe, onAddToShopping }: RecipeCardProps) {
  const { t } = useLanguage();

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 1.25,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxShadow: (theme) => theme.shadows[2]
      }}
    >
      <Box
        sx={{
          height: 220,
          position: "relative",
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.72)), url(${recipe.photoUrl || heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, left: 16, right: 16, justifyContent: "space-between" }}>
          <Chip
            label={getRecipeCategoryLabel(recipe.category, t)}
            sx={{
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(255,255,255,0.78)",
              color: "text.primary",
              fontWeight: 700
            }}
          />
          <Chip
            icon={<LocalFireDepartmentRoundedIcon />}
            label={`${Math.round(recipe.nutritionPerServing.caloriesKcal)} kcal`}
            sx={{
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(15,23,42,0.7)",
              color: "common.white",
              ".MuiChip-icon": { color: "#fb923c" }
            }}
          />
        </Stack>
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.75}>
          <Box>
            <Typography
              component={RouterLink}
              to={`/recipes/${recipe.id}`}
              variant="h5"
              fontWeight={800}
              sx={{
                mb: 0.75,
                display: "inline-block",
                textDecoration: "none",
                color: "text.primary",
                fontSize: { xs: "1.05rem", sm: "1.3rem" },
                "&:hover": {
                  color: "primary.main"
                }
              }}
            >
              {recipe.title}
            </Typography>
            <Typography color="text.secondary" sx={{ minHeight: 44 }}>
              {recipe.description || t("recipes.noDescription")}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<RestaurantRoundedIcon />} label={t("recipes.servings", { count: recipe.servings })} variant="outlined" />
            {recipe.cookTimeMinutes ? <Chip icon={<AccessTimeRoundedIcon />} label={t("recipes.minutes", { value: recipe.cookTimeMinutes })} variant="outlined" /> : null}
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <MacroStat label={t("recipe.macros.protein")} value={recipe.nutritionPerServing.proteinG} color="#ffb547" />
            <MacroStat label={t("recipe.macros.fat")} value={recipe.nutritionPerServing.fatG} color="#d58bff" />
            <MacroStat label={t("recipe.macros.carbs")} value={recipe.nutritionPerServing.carbsG} color="#4dd6e3" />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            {onAddToShopping ? (
              <Button
                variant="outlined"
                startIcon={<AddShoppingCartRoundedIcon />}
                onClick={() => onAddToShopping(recipe)}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("shopping.addFromRecipe")}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
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
