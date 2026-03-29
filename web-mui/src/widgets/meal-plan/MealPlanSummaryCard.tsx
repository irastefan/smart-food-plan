import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import TimelapseRoundedIcon from "@mui/icons-material/TimelapseRounded";
import { Box, Card, CardContent, CircularProgress, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { ReactNode } from "react";

type MealPlanSummaryCardProps = {
  title: string;
  goalValue: number;
  usedValue: number;
  remainingValue: number;
  centerValue: number;
  centerLabel: string;
  goalLabel: string;
  usedLabel: string;
  remainingLabel: string;
  showAnalyze?: boolean;
  onAnalyze?: () => void;
};

function formatNumber(value: number): string {
  return String(Math.round(value));
}

export function MealPlanSummaryCard({
  title,
  goalValue,
  usedValue,
  remainingValue,
  centerValue,
  centerLabel,
  goalLabel,
  usedLabel,
  remainingLabel,
  showAnalyze = true,
  onAnalyze
}: MealPlanSummaryCardProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const progress = goalValue > 0 ? Math.min(100, (usedValue / goalValue) * 100) : 0;
  const ringSize = isMobile ? 128 : 168;
  const showFoodInCenter = centerLabel === usedLabel;
  const ringColor = "#2f6b56";

  return (
    <Card
      sx={{
        height: "100%",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
            : "linear-gradient(180deg, #ffffff, #f5f7fb)"
      }}
    >
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={0.75}>
          <Typography variant="h5" sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}>
            {title}
          </Typography>
          {onAnalyze && showAnalyze ? (
            <Tooltip title={t("mealPlan.analysis.tooltip.day")}>
              <IconButton
                size="small"
                onClick={onAnalyze}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)"
                }}
              >
                <InsightsRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={{ xs: 2, sm: 3 }} sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
          {`${remainingLabel} = ${goalLabel} - ${usedLabel}`}
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 3 }} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box sx={{ position: "relative", display: "inline-flex", alignSelf: { xs: "center", sm: "stretch" } }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={ringSize}
              thickness={3.2}
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)"
              }}
            />
            <CircularProgress
              variant="determinate"
              value={progress}
              size={ringSize}
              thickness={3.2}
              sx={{
                color: ringColor,
                position: "absolute",
                left: 0,
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round"
                }
              }}
            />
            <Box
              sx={{
                inset: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Box textAlign="center">
                <Typography variant="h2" lineHeight={1} mb={0.5} sx={{ fontSize: { xs: "1.7rem", sm: "3rem" } }}>
                  {formatNumber(centerValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.78rem", sm: "0.875rem" } }}>
                  {centerLabel}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Stack spacing={{ xs: 1.25, sm: 2 }} sx={{ flex: 1, width: "100%" }}>
            <SummaryStat
              icon={<LocalFireDepartmentRoundedIcon sx={{ color: "#fb923c" }} />}
              label={goalLabel}
              value={`${formatNumber(goalValue)} kcal`}
            />
            <SummaryStat
              icon={
                showFoodInCenter
                  ? <TimelapseRoundedIcon sx={{ color: "#8b9bff" }} />
                  : <ChecklistRoundedIcon sx={{ color: "#62b4ff" }} />
              }
              label={showFoodInCenter ? remainingLabel : usedLabel}
              value={`${formatNumber(showFoodInCenter ? remainingValue : usedValue)} kcal`}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: { xs: 34, sm: 40 },
          height: { xs: 34, sm: 40 },
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          backgroundColor: "rgba(255,255,255,0.05)"
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.78rem", sm: "0.875rem" } }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}
