import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Box, Card, CardContent, Chip, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { RecipeSummary } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { RecipeNutritionCard } from "./RecipeNutritionCard";

type RecipeCardProps = {
  recipe: RecipeSummary;
  onDelete?: (recipe: RecipeSummary) => void;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { t } = useLanguage();
  const hasDarkSurface = Boolean(recipe.photoUrl) || useTheme().palette.mode === "dark";

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
          minHeight: recipe.photoUrl ? 220 : "auto",
          position: "relative",
          background:
            recipe.photoUrl
              ? `linear-gradient(180deg, rgba(4,16,12,0.10) 0%, rgba(4,16,12,0.76) 55%, rgba(4,16,12,0.92) 100%), url(${recipe.photoUrl})`
              : "transparent",
          backgroundSize: recipe.photoUrl ? "cover" : undefined,
          backgroundPosition: recipe.photoUrl ? "center" : undefined,
          p: 2.25,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <Box sx={{ pt: recipe.photoUrl ? { xs: 3.25, sm: 4.5 } : 0 }}>
          <Typography
            component={RouterLink}
            to={`/recipes/${recipe.id}`}
            sx={{
              display: "inline-block",
              textDecoration: "none",
              color: hasDarkSurface ? "common.white" : "text.primary",
              fontSize: { xs: "1.45rem", sm: "1.62rem" },
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              mb: 0.25,
              "&:hover": {
                color: hasDarkSurface ? "rgba(255,255,255,0.9)" : "primary.main"
              }
            }}
          >
            {recipe.title}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ px: 2.5, pt: 0.75, pb: 2.25 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {recipe.cookTimeMinutes ? <Chip icon={<AccessTimeRoundedIcon />} label={t("recipes.minutes", { value: recipe.cookTimeMinutes })} variant="outlined" /> : null}
          </Stack>

          <RecipeNutritionCard recipe={recipe} showTitle={false} compact />
        </Stack>
      </CardContent>
    </Card>
  );
}
