import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Avatar, Box, Chip, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import type { RecipeDetail } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getRecipeCategoryLabel } from "../../features/recipes/model/recipeCategories";

type RecipeHeroProps = {
  recipe: RecipeDetail;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RecipeHero({ recipe, onEdit, onDelete }: RecipeHeroProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const hasDarkSurface = Boolean(recipe.photoUrl) || theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: recipe.photoUrl ? { xs: 360, md: 460 } : { xs: 180, sm: 220, md: 280 },
        borderRadius: 1.25,
        overflow: "hidden",
        position: "relative",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: 1,
        background: (theme) =>
          recipe.photoUrl
            ? `linear-gradient(180deg, rgba(4,16,12,0.10) 0%, rgba(4,16,12,0.76) 55%, rgba(4,16,12,0.92) 100%), url(${recipe.photoUrl})`
            : theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(28,33,52,0.98), rgba(24,29,46,1) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,252,0.96) 100%)",
        backgroundSize: recipe.photoUrl ? "cover" : undefined,
        backgroundPosition: recipe.photoUrl ? "center" : undefined
      }}
    >
      <Stack justifyContent="space-between" sx={{ position: "relative", zIndex: 1, minHeight: "100%", p: { xs: 3, md: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={{ xs: 2.5, md: 3.5 }}>
          <Chip
            label={getRecipeCategoryLabel(recipe.category, t)}
            sx={{
              backdropFilter: "blur(10px)",
              backgroundColor: (theme) =>
                hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(248,250,252,0.96)",
              color: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.text.primary,
              fontWeight: 700,
              border: "1px solid",
              borderColor: (theme) =>
                hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(148,163,184,0.2)",
              boxShadow: (theme) =>
                hasDarkSurface || theme.palette.mode === "dark" ? "none" : "0 6px 18px rgba(15,23,42,0.08)"
            }}
          />
          <Stack direction="row" spacing={0.9} sx={{ marginInlineStart: { xs: 1, md: 2 }, flexShrink: 0 }}>
            {onEdit ? (
              <Tooltip title={t("recipe.edit")}>
                <IconButton
                  onClick={onEdit}
                  sx={{
                    color: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.text.primary,
                    bgcolor: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid",
                    borderColor: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(148,163,184,0.22)",
                    "&:hover": {
                      bgcolor: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.96)"
                    }
                  }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {onDelete ? (
              <Tooltip title={t("recipe.delete")}>
                <IconButton
                  onClick={onDelete}
                  sx={{
                    color: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "#fecaca" : theme.palette.error.main,
                    bgcolor: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(127,29,29,0.26)" : "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid",
                    borderColor: (theme) => theme.palette.mode === "dark" ? "rgba(248,113,113,0.24)" : "rgba(248,113,113,0.24)",
                    "&:hover": {
                      bgcolor: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(127,29,29,0.36)" : "rgba(255,255,255,0.96)"
                    }
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>

        <Stack
          spacing={2.25}
          sx={{
            maxWidth: { xs: "100%", md: 980 },
            width: { xs: "100%", md: "min(980px, calc(100% - 140px))" },
            pt: { xs: 1.5, md: 1.5 }
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 26, md: 42 },
              lineHeight: { xs: 1.06, md: 1.02 },
              color: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.text.primary,
              fontWeight: 800,
              letterSpacing: { xs: -0.6, md: -0.9 }
            }}
          >
            {recipe.title}
          </Typography>
          <Typography
            sx={{
              color: (theme) => hasDarkSurface || theme.palette.mode === "dark" ? "rgba(255,255,255,0.82)" : "rgba(15,23,42,0.72)",
              fontSize: { xs: 15, md: 16 },
              lineHeight: 1.45,
              maxWidth: { xs: "100%", md: 900 }
            }}
          >
            {recipe.description || t("recipe.noDescription")}
          </Typography>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap alignItems="center">
            {recipe.cookTimeMinutes ? <MetricBadge value={`${recipe.cookTimeMinutes}`} label={t("recipe.minutesShort")} darkSurface={hasDarkSurface} /> : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

function MetricBadge({ value, label, icon, darkSurface = false }: { value: string; label: string; icon?: React.ReactNode; darkSurface?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: 1.25,
        backdropFilter: "blur(10px)",
        backgroundColor: darkSurface ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.68)",
        color: darkSurface ? "common.white" : "text.primary",
        border: "1px solid",
        borderColor: darkSurface ? "rgba(255,255,255,0.14)" : "rgba(148,163,184,0.18)"
      }}
    >
      {icon ? <Avatar sx={{ width: 30, height: 30, bgcolor: darkSurface ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.82)" }}>{icon}</Avatar> : null}
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, md: 16 } }}>{value}</Typography>
      <Typography sx={{ fontSize: { xs: 13, md: 14 } }} color={darkSurface ? "rgba(255,255,255,0.72)" : "text.secondary"}>
        {label}
      </Typography>
    </Stack>
  );
}
