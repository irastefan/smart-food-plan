import { Box, Card, CardContent, CircularProgress, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

type MacroItem = {
  key: string;
  label: string;
  value: number;
  target: number;
  color: string;
};

type MealPlanMacroBalanceCardProps = {
  title: string;
  items: MacroItem[];
  leftLabel: string;
  overLabel: string;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MealPlanMacroBalanceCard({ title, items, leftLabel, overLabel }: MealPlanMacroBalanceCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Typography variant="h5" mb={{ xs: 1.35, sm: 2.5 }} sx={{ fontSize: { xs: "1.12rem", sm: "1.32rem" } }}>
          {title}
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 0.9, sm: 2 }}
          alignItems="stretch"
          justifyContent="space-between"
          sx={{ px: { xs: 0.35, sm: 0 } }}
        >
          {items.map((macro) => (
            <MealPlanMacroRing
              key={macro.key}
              label={macro.label}
              value={macro.value}
              target={macro.target}
              unit="g"
              color={macro.color}
              percent={Math.min(100, macro.target > 0 ? (macro.value / macro.target) * 100 : 0)}
              leftLabel={leftLabel}
              overLabel={overLabel}
              compact={isMobile}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MealPlanMacroRing({
  label,
  value,
  target,
  unit,
  color,
  percent,
  leftLabel,
  overLabel,
  compact
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  percent: number;
  leftLabel: string;
  overLabel: string;
  compact: boolean;
}) {
  const difference = target - value;
  const statusLabel = difference >= 0 ? leftLabel : overLabel;
  const statusValue = Math.abs(difference);
  const ringSize = compact ? 87 : 104;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: { xs: 0.1, sm: 1.5 },
        py: { xs: 0.15, sm: 1 },
        borderRadius: 4
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        textAlign="center"
        sx={{ color, mb: { xs: 0.5, sm: 0.8 }, fontSize: { xs: "0.96rem", sm: "0.96rem" } }}
      >
        {label}
      </Typography>
      <Stack alignItems="center" spacing={{ xs: 0.55, sm: 1.5 }}>
        <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={ringSize}
            thickness={3}
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
            }}
          />
          <CircularProgress
            variant="determinate"
            value={percent}
            size={ringSize}
            thickness={3}
            sx={{
              color,
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
              <Typography variant="h4" fontWeight={800} lineHeight={1} sx={{ fontSize: { xs: "1.18rem", sm: "1.42rem" } }}>
                {formatNumber(value)}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.76rem", sm: "0.74rem" } }}>
                /{formatNumber(target)}
                {unit}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ fontSize: { xs: "0.82rem", sm: "0.78rem" } }}>
          {formatNumber(statusValue)}
          {unit} {statusLabel}
        </Typography>
      </Stack>
    </Box>
  );
}
