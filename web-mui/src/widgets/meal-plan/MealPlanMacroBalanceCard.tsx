import { Card, CardContent, Typography } from "@mui/material";
import { MacroRingRow } from "../nutrition/MacroRingRow";

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
  const preparedItems = items.map((item) => {
    const difference = (item.target ?? 0) - item.value;
    const statusLabel = difference >= 0 ? leftLabel : overLabel;
    return {
      ...item,
      footer: `${formatNumber(Math.abs(difference))}g ${statusLabel}`
    };
  });

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
        <MacroRingRow items={preparedItems} variant="dashboard" />
      </CardContent>
    </Card>
  );
}
