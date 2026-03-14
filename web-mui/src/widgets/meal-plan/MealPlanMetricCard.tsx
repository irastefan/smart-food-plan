import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type MealPlanMetricCardProps = {
  title: string;
  value: string;
  unit: string;
  icon: ReactNode;
  accent: string;
};

export function MealPlanMetricCard({ title, value, unit, icon, accent }: MealPlanMetricCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent
        sx={{
          p: 3,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `linear-gradient(180deg, rgba(19,30,45,0.98), rgba(16,25,39,0.98)), ${accent}`
              : `linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.98)), ${accent}`,
          backgroundBlendMode: "soft-light"
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography color="text.secondary">{title}</Typography>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              background: accent
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h4">{value}</Typography>
          <Typography color="text.secondary">{unit}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
