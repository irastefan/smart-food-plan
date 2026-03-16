import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";

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
        <Typography variant="h5" mb={{ xs: 1.75, sm: 2.5 }} sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="stretch" justifyContent="space-between">
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
  overLabel
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  percent: number;
  leftLabel: string;
  overLabel: string;
}) {
  const difference = target - value;
  const statusLabel = difference >= 0 ? leftLabel : overLabel;
  const statusValue = Math.abs(difference);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: { xs: 1.25, sm: 1.5 },
        py: { xs: 0.875, sm: 1 },
        borderRadius: 4,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(9, 14, 25, 0.22)" : "rgba(241, 245, 249, 0.75)"
      }}
    >
      <Typography
        variant="h6"
        fontWeight={700}
        textAlign="center"
        sx={{ color, mb: 1, fontSize: { xs: "0.92rem", sm: "1.25rem" } }}
      >
        {label}
      </Typography>
      <Stack alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={104}
            thickness={3.6}
            sx={{
              width: { xs: 84, sm: 104 },
              height: { xs: 84, sm: 104 },
              color: (theme) =>
                theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
            }}
          />
          <CircularProgress
            variant="determinate"
            value={percent}
            size={104}
            thickness={3.6}
            sx={{
              width: { xs: 84, sm: 104 },
              height: { xs: 84, sm: 104 },
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
              <Typography variant="h4" fontWeight={800} lineHeight={1} sx={{ fontSize: { xs: "1.3rem", sm: "2.125rem" } }}>
                {formatNumber(value)}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.72rem", sm: "1rem" } }}>
                /{formatNumber(target)}
                {unit}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ fontSize: { xs: "0.72rem", sm: "1rem" } }}>
          {formatNumber(statusValue)}
          {unit} {statusLabel}
        </Typography>
      </Stack>
    </Box>
  );
}
