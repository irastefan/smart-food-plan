import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MonitorWeightRoundedIcon from "@mui/icons-material/MonitorWeightRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import { Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Grid, IconButton, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useMemo, useState } from "react";
import type { BodyMetricsEntry } from "../../features/body-metrics/api/bodyMetricsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { AppPreferences } from "../../shared/config/appPreferences";
import { FilterChipRow } from "../../shared/ui/FilterChipRow";

type BodyMetricsDraft = {
  weightKg: string;
  neckCm: string;
  bustCm: string;
  underbustCm: string;
  waistCm: string;
  hipsCm: string;
  bicepsCm: string;
  forearmCm: string;
  thighCm: string;
  calfCm: string;
};

type MetricKey = AppPreferences["visibleBodyMetricFields"][number];

type MealPlanBodyMetricsCardProps = {
  date: string;
  draft: BodyMetricsDraft;
  history: BodyMetricsEntry[];
  historyDays: AppPreferences["bodyMetricsHistoryDays"];
  visibleFields: AppPreferences["visibleBodyMetricFields"];
  isSaving?: boolean;
  onChange: (value: BodyMetricsDraft) => void;
  onSave: () => void;
};

function fieldConfig(t: (key: string) => string) {
  return [
    { key: "weightKg", label: t("bodyMetrics.weightKg"), short: t("settings.preferences.visibleBodyMetricFields.weightKg"), help: t("bodyMetrics.help.weightKg"), icon: <MonitorWeightRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "waistCm", label: t("bodyMetrics.waistCm"), short: t("settings.preferences.visibleBodyMetricFields.waistCm"), help: t("bodyMetrics.help.waistCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "hipsCm", label: t("bodyMetrics.hipsCm"), short: t("settings.preferences.visibleBodyMetricFields.hipsCm"), help: t("bodyMetrics.help.hipsCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "thighCm", label: t("bodyMetrics.thighCm"), short: t("settings.preferences.visibleBodyMetricFields.thighCm"), help: t("bodyMetrics.help.thighCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "neckCm", label: t("bodyMetrics.neckCm"), short: t("settings.preferences.visibleBodyMetricFields.neckCm"), help: t("bodyMetrics.help.neckCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "bustCm", label: t("bodyMetrics.bustCm"), short: t("settings.preferences.visibleBodyMetricFields.bustCm"), help: t("bodyMetrics.help.bustCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "underbustCm", label: t("bodyMetrics.underbustCm"), short: t("settings.preferences.visibleBodyMetricFields.underbustCm"), help: t("bodyMetrics.help.underbustCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "bicepsCm", label: t("bodyMetrics.bicepsCm"), short: t("settings.preferences.visibleBodyMetricFields.bicepsCm"), help: t("bodyMetrics.help.bicepsCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "forearmCm", label: t("bodyMetrics.forearmCm"), short: t("settings.preferences.visibleBodyMetricFields.forearmCm"), help: t("bodyMetrics.help.forearmCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> },
    { key: "calfCm", label: t("bodyMetrics.calfCm"), short: t("settings.preferences.visibleBodyMetricFields.calfCm"), help: t("bodyMetrics.help.calfCm"), icon: <StraightenRoundedIcon sx={{ fontSize: 16 }} /> }
  ] as const;
}

function getMetricValue(entry: BodyMetricsEntry, key: MetricKey): number | null {
  if (key === "weightKg") {
    return entry.weightKg;
  }
  return entry.measurements?.[key] ?? null;
}

function formatTickDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function getValuePrecision(points: Array<{ date: string; value: number }>): number {
  if (points.length <= 1) {
    return 1;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.abs(max - min);

  if (range >= 8) {
    return 0;
  }
  if (range >= 2) {
    return 1;
  }
  return 2;
}

function getYAxisBounds(points: Array<{ date: string; value: number }>): { min: number; max: number } {
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const padding = Math.max(Math.abs(minValue) * 0.02, 0.5);
    return {
      min: minValue - padding,
      max: maxValue + padding
    };
  }

  const range = maxValue - minValue;
  const padding = Math.max(range * 0.18, 0.2);

  return {
    min: minValue - padding,
    max: maxValue + padding
  };
}

function MiniMetricChart({
  points,
  lineColor,
  emptyLabel
}: {
  points: Array<{ date: string; value: number }>;
  lineColor: string;
  emptyLabel: string;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const height = isMobile ? 160 : 184;

  if (points.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  const precision = getValuePrecision(points);
  const xData = points.map((point) => point.date);
  const yData = points.map((point) => point.value);
  const yAxisBounds = getYAxisBounds(points);

  return (
    <Box sx={{ width: "100%", height, overflow: "hidden" }}>
      <LineChart
        height={height}
        margin={{
          top: 10,
          right: isMobile ? 8 : 14,
          bottom: isMobile ? 24 : 28,
          left: isMobile ? 24 : 40
        }}
        slotProps={{
          tooltip: {
            trigger: isMobile ? "axis" : "item"
          }
        }}
        xAxis={[
          {
            id: "dates",
            scaleType: "point",
            data: xData,
            tickLabelStyle: {
              fontSize: isMobile ? 10 : 11,
              fill: "rgba(148,163,184,0.82)"
            },
            valueFormatter: (value) => formatTickDate(String(value))
          }
        ]}
        yAxis={[
          {
            id: "values",
            min: yAxisBounds.min,
            max: yAxisBounds.max,
            tickNumber: 4,
            tickLabelStyle: {
              fontSize: isMobile ? 9 : 11,
              fill: "rgba(148,163,184,0.82)"
            },
            valueFormatter: (value: number) => Number(value).toFixed(precision)
          }
        ]}
        series={[
          {
            id: "metric",
            type: "line",
            data: yData,
            label: "",
            color: lineColor,
            curve: "linear",
            showMark: true,
            area: false,
            valueFormatter: (value, context) => {
              const date = xData[context.dataIndex] ?? "";
              return `${Number(value).toFixed(precision)} · ${date}`;
            }
          }
        ]}
        grid={{ horizontal: true }}
        axisHighlight={{ x: isMobile ? "line" : "none", y: "none" }}
        hideLegend
        sx={{
          "& .MuiLineElement-root": {
            strokeWidth: isMobile ? 2.25 : 2.5
          },
          "& .MuiMarkElement-root": {
            stroke: lineColor,
            fill: lineColor,
            strokeWidth: isMobile ? 1 : 1.5,
            r: isMobile ? 3 : 4
          },
          "& .MuiChartsAxisHighlight-root": {
            stroke: "rgba(16,185,129,0.35)"
          },
          "& .MuiChartsAxis-line": {
            stroke: "rgba(148,163,184,0.18)"
          },
          "& .MuiChartsAxis-tick": {
            stroke: "rgba(148,163,184,0.18)"
          },
          "& .MuiChartsGrid-line": {
            stroke: "rgba(148,163,184,0.18)"
          }
        }}
      />
    </Box>
  );
}

export function MealPlanBodyMetricsCard({ date, draft, history, historyDays, visibleFields, isSaving = false, onChange, onSave }: MealPlanBodyMetricsCardProps) {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const allFields = fieldConfig((key) => t(key as never));
  const fields = allFields.filter((field) => visibleFields.includes(field.key));
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(visibleFields[0] ?? "weightKg");

  useEffect(() => {
    if (!visibleFields.includes(selectedMetric)) {
      setSelectedMetric(visibleFields[0] ?? "weightKg");
    }
  }, [selectedMetric, visibleFields]);

  const selectedField = fields.find((field) => field.key === selectedMetric) ?? fields[0] ?? allFields[0];
  const chartPoints = useMemo(
    () =>
      history
        .map((entry) => ({ date: entry.date, value: getMetricValue(entry, selectedMetric) }))
        .filter((entry): entry is { date: string; value: number } => entry.value !== null)
        .sort((left, right) => left.date.localeCompare(right.date)),
    [history, selectedMetric]
  );
  const latestValue = chartPoints.length > 0 ? chartPoints[chartPoints.length - 1].value : null;

  return (
    <>
      <Card
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
              : "linear-gradient(180deg, #ffffff, #f5f7fb)"
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Stack spacing={0.3}>
                <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.45rem" } }}>
                  {selectedField?.short ?? t("bodyMetrics.title")}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.82rem", sm: "0.9rem" } }}>
                  {t("bodyMetrics.lastDays", { value: historyDays })}
                </Typography>
                {latestValue !== null ? (
                  <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                    {`${Math.round(latestValue)} ${selectedMetric === "weightKg" ? t("units.short.kg" as never) : t("units.short.cm" as never)} · ${date}`}
                  </Typography>
                ) : null}
              </Stack>

              <IconButton
                onClick={() => setIsDialogOpen(true)}
                sx={{
                  width: 36,
                  height: 36,
                  color: "text.primary"
                }}
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>

            <FilterChipRow
              value={selectedMetric}
              items={fields.map((field) => ({
                value: field.key,
                label: field.short
              }))}
              onChange={(value) => setSelectedMetric(value as MetricKey)}
            />

            <Box sx={{ width: "100%", maxWidth: 760, marginInlineEnd: "auto" }}>
              <MiniMetricChart points={chartPoints} lineColor="#10b981" emptyLabel={t("bodyMetrics.emptyChart")} />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onClose={isSaving ? undefined : () => setIsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{t("bodyMetrics.dialogTitle", { date })}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Typography color="text.secondary">{t("bodyMetrics.help.summary")}</Typography>
            <Grid container spacing={1.5}>
              {fields.map((field) => (
                <Grid key={field.key} size={{ xs: 6, md: field.key === "weightKg" ? 3 : 2.25 }}>
                  <TextField
                    label={field.label}
                    helperText={field.help}
                    type="number"
                    value={draft[field.key]}
                    onChange={(event) => onChange({ ...draft, [field.key]: event.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: field.icon
                    }}
                  />
                </Grid>
              ))}
            </Grid>

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={() => {
                  onSave();
                  setIsDialogOpen(false);
                }}
                disabled={isSaving}
              >
                {t("bodyMetrics.save")}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
