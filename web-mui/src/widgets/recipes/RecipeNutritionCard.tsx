import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { Avatar, Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import type { RecipeDetail } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { getMacroColor } from "../../shared/theme/macroColors";

type RecipeNutritionCardProps = {
  recipe: Pick<RecipeDetail, "nutritionPerServing" | "cookTimeMinutes" | "servings">;
  showTitle?: boolean;
  compact?: boolean;
};

export function RecipeNutritionCard({ recipe, showTitle = true, compact = false }: RecipeNutritionCardProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const totals = recipe.nutritionPerServing;
  const totalMacros = Math.max(1, totals.proteinG + totals.fatG + totals.carbsG);
  const macroItems = [
    {
      key: "protein",
      label: t("recipe.macros.protein"),
      value: totals.proteinG,
      color: getMacroColor("protein")
    },
    {
      key: "fat",
      label: t("recipe.macros.fat"),
      value: totals.fatG,
      color: getMacroColor("fat")
    },
    {
      key: "carbs",
      label: t("recipe.macros.carbs"),
      value: totals.carbsG,
      color: getMacroColor("carbs")
    }
  ];
  return (
    <Paper
      sx={{
        width: "100%",
        height: "100%",
        p: compact ? 0 : { xs: 1.75, sm: 2.25, md: 3 },
        borderRadius: 1.25,
        border: compact ? "none" : "1px solid",
        borderColor: "divider",
        background: compact
          ? "transparent"
          : theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(28,33,52,0.98), rgba(24,29,46,1) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,249,252,0.96) 100%)",
        boxShadow: compact ? "none" : undefined
      }}
    >
      <Stack spacing={compact ? 0.75 : 2.5} sx={{ minHeight: "100%", justifyContent: "space-between" }}>
        {showTitle ? (
          <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
            <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: 18, sm: 22, md: 30 } }}>
              {t("recipe.nutrition")}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: compact ? 1.05 : 1.35,
                py: compact ? 0.55 : 0.7,
                borderRadius: 1.25,
                bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
                border: "1px solid",
                borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.18)",
                whiteSpace: "nowrap"
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: compact ? { xs: 12, md: 13 } : { xs: 14, md: 15 } }}>{recipe.servings}</Typography>
              <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: compact ? { xs: 10, md: 11 } : { xs: 11, md: 13 } }}>
                {t("recipe.servingsLabel")}
              </Typography>
            </Stack>
          </Stack>
        ) : null}

        <Stack direction="row" spacing={compact ? { xs: 0.75, sm: 1 } : { xs: 1.5, sm: 2, md: 3 }} alignItems="center" sx={{ flex: 1 }}>
          <Stack direction="row" spacing={compact ? { xs: 0.95, sm: 0.7 } : { xs: 0.5, sm: 1 }} alignItems="center" sx={{ minWidth: compact ? { xs: 108, sm: 104 } : { xs: 88, sm: 124, md: 160 }, flexShrink: 0 }}>
            <MacroCalorieRing
              calories={Math.round(totals.caloriesKcal)}
              proteinG={totals.proteinG}
              fatG={totals.fatG}
              carbsG={totals.carbsG}
              compact={compact}
            />

            <Box sx={{ minWidth: compact ? 0 : { xs: 0, sm: 8 } }} />
          </Stack>

          <Stack
            direction="row"
            spacing={compact ? { xs: 3, sm: 3 } : { xs: 1.25, sm: 1.75, md: 2.75 }}
            useFlexGap
            sx={{ flex: 1, minWidth: 0, justifyContent: compact ? "flex-start" : "flex-start" }}
          >
            {macroItems.map((item) => (
              <Stack
                key={item.key}
                spacing={compact ? 0.2 : { xs: 0.35, sm: 0.6, md: 0.75 }}
                sx={{ minWidth: 0, flex: compact ? "0 0 auto" : 1 }}
              >
                <Stack direction="row" spacing={0.85} alignItems="center" color={item.color}>
                  <Typography sx={{ color: item.color, fontWeight: 800, fontSize: compact ? { xs: 12, sm: 12 } : { xs: 10, sm: 12, md: 13 } }}>
                    {Math.round((item.value / totalMacros) * 100)}%
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: compact ? { xs: 17, sm: 17 } : { xs: 14, sm: 18, md: 22 }, lineHeight: 1, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {item.value.toFixed(1)} g
                </Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: compact ? { xs: 12, sm: 12 } : { xs: 10, sm: 12, md: 14 } }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {showTitle ? (
          <Stack direction="row" spacing={{ xs: 1.75, sm: 2.25, md: 3 }} flexWrap="wrap" useFlexGap alignItems="center">
            {recipe.cookTimeMinutes ? (
              <SummaryMeta icon={<AccessTimeRoundedIcon fontSize="small" />} label={t("recipe.cookingTime")} value={t("recipes.minutes", { value: recipe.cookTimeMinutes })} />
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}

function SummaryMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Avatar sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, bgcolor: "action.hover", color: "text.secondary" }}>
        {icon}
      </Avatar>
      <Stack spacing={0.15}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 11, md: 12 } }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 14, md: 16 } }}>{value}</Typography>
      </Stack>
    </Stack>
  );
}

function MacroCalorieRing({
  calories,
  proteinG,
  fatG,
  carbsG,
  compact = false
}: {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  compact?: boolean;
}) {
  const theme = useTheme();
  const size = compact ? 94 : 92;
  const strokeWidth = compact ? 5 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, proteinG + fatG + carbsG);
  const gap = 8;
  const segments = [
    { value: carbsG, color: getMacroColor("carbs") },
    { value: fatG, color: getMacroColor("fat") },
    { value: proteinG, color: getMacroColor("protein") }
  ];

  let offset = 0;

  return (
    <Box sx={{ position: "relative", width: compact ? size : { xs: size, md: 120 }, height: compact ? size : { xs: size, md: 120 }, display: "grid", placeItems: "center", flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.palette.mode === "dark" ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.22)"}
          strokeWidth={strokeWidth}
        />
        {segments.map((segment, index) => {
          const segmentLength = Math.max(0, (segment.value / total) * (circumference - gap * segments.length));
          const currentOffset = offset;
          offset += segmentLength + gap;
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-currentOffset}
            />
          );
        })}
      </svg>

      <Stack spacing={0.15} alignItems="center" sx={{ position: "absolute", inset: 0, justifyContent: "center" }}>
        <Typography sx={{ fontSize: compact ? { xs: 30, sm: 28 } : { xs: 24, md: 34 }, lineHeight: 1, fontWeight: 800 }}>
          {calories}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: compact ? { xs: 13, sm: 13 } : { xs: 12, md: 14 } }}>
          kcal
        </Typography>
      </Stack>
    </Box>
  );
}
