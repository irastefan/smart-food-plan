import { Box, Card, CardContent, CircularProgress, Grid, Stack, Typography } from "@mui/material";

type MacroItem = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type MealPlanMacroBalanceCardProps = {
  title: string;
  items: MacroItem[];
  total: number;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MealPlanMacroBalanceCard({ title, items, total }: MealPlanMacroBalanceCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          {title}
        </Typography>
        <Grid container spacing={1.5}>
          {items.map((macro) => (
            <Grid key={macro.key} size={{ xs: 12, sm: 6, xl: 12 }}>
              <MealPlanMacroRing
                label={macro.label}
                value={macro.value}
                unit="g"
                color={macro.color}
                percent={Math.min(100, total > 0 ? (macro.value / total) * 100 : 0)}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function MealPlanMacroRing({
  label,
  value,
  unit,
  color,
  percent
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  percent: number;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(19,30,45,0.95), rgba(16,25,39,0.95))"
            : "#ffffff"
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={92}
              thickness={6}
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
              }}
            />
            <CircularProgress
              variant="determinate"
              value={percent}
              size={92}
              thickness={6}
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
              <Typography variant="h6" fontWeight={800}>
                {formatNumber(percent)}%
              </Typography>
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>
              {formatNumber(value)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
