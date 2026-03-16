import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { RecipeDetail } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import heroImage from "../../assets/hero.png";

type RecipeHeroProps = {
  recipe: RecipeDetail;
};

export function RecipeHero({ recipe }: RecipeHeroProps) {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        minHeight: { xs: 360, md: 460 },
        borderRadius: 1.25,
        overflow: "hidden",
        position: "relative",
        backgroundImage: `linear-gradient(180deg, rgba(4,16,12,0.10) 0%, rgba(4,16,12,0.76) 55%, rgba(4,16,12,0.92) 100%), url(${recipe.photoUrl || heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <Stack justifyContent="space-between" sx={{ position: "relative", zIndex: 1, minHeight: "100%", p: { xs: 3, md: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Chip
            label={t(`recipes.categories.${recipe.category}` as never)}
            sx={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(255,255,255,0.14)", color: "common.white", fontWeight: 700 }}
          />
          <Button component={RouterLink} to={`/recipes/${recipe.id}/edit`} startIcon={<EditRoundedIcon />} variant="contained" color="inherit" sx={{ color: "text.primary", bgcolor: "rgba(255,255,255,0.88)" }}>
            {t("recipe.edit")}
          </Button>
        </Stack>

        <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 72 }, lineHeight: 0.96, color: "common.white", fontWeight: 800, letterSpacing: -1.6 }}>
            {recipe.title}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: { xs: 18, md: 26 }, maxWidth: 620 }}>
            {recipe.description || t("recipe.noDescription")}
          </Typography>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap alignItems="center">
            <MetricBadge value={`${Math.round(recipe.nutritionPerServing.caloriesKcal)}`} label="kcal" icon={<LocalFireDepartmentRoundedIcon sx={{ color: "#f59e0b" }} />} />
            <MetricBadge value={`${recipe.servings}`} label={t("recipe.servingsLabel")} />
            {recipe.cookTimeMinutes ? <MetricBadge value={`${recipe.cookTimeMinutes}`} label={t("recipe.minutesShort")} /> : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

function MetricBadge({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1.5, py: 1, borderRadius: 1.25, backdropFilter: "blur(10px)", backgroundColor: "rgba(255,255,255,0.12)", color: "common.white" }}>
      {icon ? <Avatar sx={{ width: 30, height: 30, bgcolor: "rgba(255,255,255,0.12)" }}>{icon}</Avatar> : null}
      <Typography fontWeight={800}>{value}</Typography>
      <Typography color="rgba(255,255,255,0.72)">{label}</Typography>
    </Stack>
  );
}
