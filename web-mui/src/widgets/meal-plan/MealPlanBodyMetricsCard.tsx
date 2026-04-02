import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MonitorWeightRoundedIcon from "@mui/icons-material/MonitorWeightRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import { Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
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

function MiniMetricChart({
  points,
  lineColor,
  emptyLabel
}: {
  points: Array<{ date: string; value: number }>;
  lineColor: string;
  emptyLabel: string;
}) {
  const width = 320;
  const height = 160;
  const left = 26;
  const right = 22;
  const top = 16;
  const bottom = 28;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  if (points.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const paddedMin = min === max ? min - 1 : min - (max - min) * 0.15;
  const paddedMax = min === max ? max + 1 : max + (max - min) * 0.15;
  const ticks = [0, 1, 2, 3].map((index) => paddedMax - ((paddedMax - paddedMin) / 3) * index);

  const coordinates = points.map((point, index) => {
    const x = left + (points.length === 1 ? innerWidth / 2 : (innerWidth / (points.length - 1)) * index);
    const y = top + ((paddedMax - point.value) / (paddedMax - paddedMin || 1)) * innerHeight;
    return { x, y, ...point };
  });

  const linePath = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <Box sx={{ width: "100%", height, overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {ticks.map((tick, index) => {
          const y = top + (innerHeight / 3) * index;
          return (
            <g key={index}>
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="rgba(148,163,184,0.22)" strokeWidth="1" />
              <text x={left - 8} y={y + 4} textAnchor="end" fill="rgba(148,163,184,0.82)" fontSize="11">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={index === coordinates.length - 1 ? 4 : 3} fill={lineColor}>
            <title>{`${point.date} · ${point.value}`}</title>
          </circle>
        ))}

        {coordinates.map((point, index) => (
          <text
            key={`${point.date}-${index}`}
            x={point.x}
            y={height - 8}
            textAnchor="middle"
            fill={index === coordinates.length - 1 ? lineColor : "rgba(148,163,184,0.82)"}
            fontSize="11"
          >
            {formatTickDate(point.date)}
          </text>
        ))}
      </svg>
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
        .slice()
        .reverse()
        .map((entry) => ({ date: entry.date, value: getMetricValue(entry, selectedMetric) }))
        .filter((entry): entry is { date: string; value: number } => entry.value !== null),
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
