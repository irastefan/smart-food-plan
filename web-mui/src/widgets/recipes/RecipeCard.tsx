import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import { Box, Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getRecipeCategoryLabel } from "../../features/recipes/model/recipeCategories";
import { getMacroColor } from "../../shared/theme/macroColors";

type RecipeCardProps = {
  recipe: RecipeSummary;
  onDelete?: (recipe: RecipeSummary) => void;
};

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const hasDarkSurface = Boolean(recipe.photoUrl) || theme.palette.mode === "dark";

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
          height: recipe.photoUrl ? 220 : { xs: 132, sm: 168, md: 220 },
          position: "relative",
          background: (theme) =>
            recipe.photoUrl
              ? `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.72)), url(${recipe.photoUrl})`
              : theme.palette.mode === "dark"
                ? "linear-gradient(180deg, rgba(34,197,94,0.10), rgba(14,165,233,0.08) 35%, rgba(15,23,42,0.86) 100%)"
                : "linear-gradient(180deg, rgba(241,245,249,0.98), rgba(232,240,248,0.96) 46%, rgba(221,232,243,0.94) 100%)",
          backgroundSize: recipe.photoUrl ? "cover" : undefined,
          backgroundPosition: recipe.photoUrl ? "center" : undefined
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: "absolute", top: 16, insetInlineStart: 16, insetInlineEnd: 16, justifyContent: "space-between" }}
        >
          <Chip
            label={getRecipeCategoryLabel(recipe.category, t)}
            sx={{
              backdropFilter: "blur(10px)",
              backgroundColor: hasDarkSurface ? "rgba(255,255,255,0.14)" : "rgba(248,250,252,0.96)",
              color: hasDarkSurface ? "common.white" : "text.primary",
              fontWeight: 700,
              border: "1px solid",
              borderColor: hasDarkSurface ? "rgba(255,255,255,0.14)" : "rgba(148,163,184,0.2)",
              boxShadow: hasDarkSurface ? "none" : "0 6px 18px rgba(15,23,42,0.08)"
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
                fontSize: { xs: "1.5rem", sm: "1.62rem" },
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
            <MacroStat label={t("recipe.macros.protein")} value={recipe.nutritionPerServing.proteinG} color={getMacroColor("protein")} />
            <MacroStat label={t("recipe.macros.fat")} value={recipe.nutritionPerServing.fatG} color={getMacroColor("fat")} />
            <MacroStat label={t("recipe.macros.carbs")} value={recipe.nutritionPerServing.carbsG} color={getMacroColor("carbs")} />
          </Stack>

          {onDelete ? (
            <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
              <Tooltip title={t("recipe.edit")}>
                <IconButton
                  size="small"
                  component={RouterLink}
                  to={`/recipes/${recipe.id}/edit`}
                  sx={{ color: "text.secondary" }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("recipe.delete")}>
                <IconButton size="small" color="error" onClick={() => onDelete(recipe)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
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
        {Math.round(value)}g
      </Typography>
    </Box>
  );
}
