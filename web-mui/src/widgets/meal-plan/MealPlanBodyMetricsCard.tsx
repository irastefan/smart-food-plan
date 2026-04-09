import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MonitorWeightRoundedIcon from "@mui/icons-material/MonitorWeightRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { BodyMetricsEntry } from "../../features/body-metrics/api/bodyMetricsApi";
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
  onPreferencesChange: (value: Pick<AppPreferences, "bodyMetricsHistoryDays" | "visibleBodyMetricFields">) => void;
};

const HISTORY_DAY_OPTIONS: Array<AppPreferences["bodyMetricsHistoryDays"]> = [30, 60, 90, 180];
const BODY_METRIC_FIELD_OPTIONS: AppPreferences["visibleBodyMetricFields"] = [
  "weightKg",
  "neckCm",
  "bustCm",
  "underbustCm",
  "waistCm",
  "hipsCm",
  "bicepsCm",
  "forearmCm",
  "thighCm",
  "calfCm"
];

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

function getDisplayPrecision(key: MetricKey): number {
  return key === "weightKg" ? 0 : 0;
}

function getTooltipPrecision(key: MetricKey): number {
  return key === "weightKg" ? 1 : 1;
}

function formatMetricValue(value: number, key: MetricKey, mode: "compact" | "exact" = "compact"): string {
  const precision = mode === "exact" ? getTooltipPrecision(key) : getDisplayPrecision(key);
  return Number(value).toFixed(precision);
}

function formatTickDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function formatEntryDate(language: string, date: string): string {
  try {
    return new Intl.DateTimeFormat(language === "he" ? "he-IL" : language === "ru" ? "ru-RU" : "en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
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
  emptyLabel,
  metricKey
}: {
  points: Array<{ date: string; value: number }>;
  lineColor: string;
  emptyLabel: string;
  metricKey: MetricKey;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const height = isMobile ? 164 : 188;

  if (points.length === 0) {
    return (
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {emptyLabel}
        </Typography>
      </Box>
    );
  }

  const xData = points.map((point) => point.date);
  const yData = points.map((point) => point.value);
  const yAxisBounds = getYAxisBounds(points);
  const visibleTickStep = isMobile ? Math.max(1, Math.ceil(xData.length / 4)) : Math.max(1, Math.ceil(xData.length / 6));

  return (
    <Box sx={{ width: "100%", height, overflow: "hidden" }}>
      <LineChart
        height={height}
        margin={{
          top: 10,
          right: isMobile ? 6 : 14,
          bottom: isMobile ? 22 : 28,
          left: isMobile ? 2 : 20
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
            tickInterval: (_value: string, index: number) => index === 0 || index === xData.length - 1 || index % visibleTickStep === 0,
            tickLabelStyle: {
              fontSize: isMobile ? 9 : 11,
              fill: "rgba(148,163,184,0.82)"
            },
            valueFormatter: (value) => formatTickDate(String(value))
          }
        ]}
        yAxis={[
          {
            id: "values",
            width: isMobile ? 10 : 20,
            min: yAxisBounds.min,
            max: yAxisBounds.max,
            tickNumber: 4,
            tickLabelStyle: {
              fontSize: isMobile ? 8 : 10,
              fill: "rgba(148,163,184,0.82)"
            },
            valueFormatter: (value: number) => formatMetricValue(value, metricKey)
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
              return `${formatMetricValue(Number(value), metricKey, "exact")} · ${date}`;
            }
          }
        ]}
        grid={{ horizontal: true }}
        axisHighlight={{ x: isMobile ? "line" : "none", y: "none" }}
        hideLegend
        sx={{
          "& .MuiLineElement-root": {
            strokeWidth: isMobile ? 2.15 : 2.5
          },
          "& .MuiMarkElement-root": {
            stroke: lineColor,
            fill: lineColor,
            strokeWidth: isMobile ? 1 : 1.5,
            r: isMobile ? 2.5 : 4
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

export function MealPlanBodyMetricsCard({
  date,
  draft,
  history,
  historyDays,
  visibleFields,
  isSaving = false,
  onChange,
  onSave,
  onPreferencesChange
}: MealPlanBodyMetricsCardProps) {
  const { t, language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEntriesDialogOpen, setIsEntriesDialogOpen] = useState(false);

  const allFields = fieldConfig((key) => t(key as never));
  const fields = allFields.filter((field) => visibleFields.includes(field.key));
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(visibleFields[0] ?? "weightKg");
  const [settingsDraft, setSettingsDraft] = useState<{
    historyDays: AppPreferences["bodyMetricsHistoryDays"];
    visibleFields: AppPreferences["visibleBodyMetricFields"];
  }>({
    historyDays,
    visibleFields
  });

  useEffect(() => {
    if (!visibleFields.includes(selectedMetric)) {
      setSelectedMetric(visibleFields[0] ?? "weightKg");
    }
  }, [selectedMetric, visibleFields]);

  useEffect(() => {
    setSettingsDraft({ historyDays, visibleFields });
  }, [historyDays, visibleFields]);

  if (visibleFields.length === 0) {
    return null;
  }

  const selectedField = fields.find((field) => field.key === selectedMetric) ?? fields[0] ?? allFields[0];
  const chartPoints = history
    .map((entry) => ({ date: entry.date, value: getMetricValue(entry, selectedMetric) }))
    .filter((entry): entry is { date: string; value: number } => entry.value !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
  const entries = chartPoints.slice().reverse();
  const valueUnit = selectedMetric === "weightKg" ? t("units.short.kg" as never) : t("units.short.cm" as never);

  return (
    <>
      <Card
        sx={{
          background: (currentTheme) =>
            currentTheme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
              : "linear-gradient(180deg, #ffffff, #f5f7fb)"
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Stack spacing={0.35}>
                <Typography variant="h5" sx={{ fontSize: { xs: "1.2rem", sm: "1.45rem" } }}>
                  {selectedField?.short ?? t("bodyMetrics.title")}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}>
                  {t("bodyMetrics.lastDays", { value: historyDays })}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  onClick={() => setIsEntriesDialogOpen(true)}
                  sx={{ width: 36, height: 36, color: "text.secondary" }}
                >
                  <HistoryRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => setIsSettingsOpen(true)}
                  sx={{ width: 36, height: 36, color: "text.secondary" }}
                >
                  <SettingsRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => setIsDialogOpen(true)}
                  sx={{ width: 36, height: 36, color: "text.primary" }}
                >
                  <AddRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>

            <FilterChipRow
              value={selectedMetric}
              items={fields.map((field) => ({
                value: field.key,
                label: field.short
              }))}
              onChange={(value) => setSelectedMetric(value as MetricKey)}
            />

            <Box sx={{ width: "100%", maxWidth: "100%", px: { xs: 0.25, sm: 0 } }}>
              <MiniMetricChart
                points={chartPoints}
                lineColor="#10b981"
                emptyLabel={t("bodyMetrics.emptyChart")}
                metricKey={selectedMetric}
              />
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
                    type="text"
                    inputProps={{ inputMode: "decimal" }}
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

      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("bodyMetrics.settings" as never)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Stack spacing={1}>
              <Typography fontWeight={700}>{t("settings.preferences.bodyMetricsHistoryDays")}</Typography>
              <RadioGroup
                value={String(settingsDraft.historyDays)}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    historyDays: Number(event.target.value) as AppPreferences["bodyMetricsHistoryDays"]
                  }))
                }
              >
                {HISTORY_DAY_OPTIONS.map((value) => (
                  <FormControlLabel
                    key={value}
                    value={String(value)}
                    control={<Radio />}
                    label={t("settings.preferences.bodyMetricsHistoryDays.option" as never, { value })}
                  />
                ))}
              </RadioGroup>
            </Stack>

            <Stack spacing={1}>
              <Typography fontWeight={700}>{t("settings.preferences.visibleBodyMetricFields")}</Typography>
              <Stack direction="row" flexWrap="wrap" columnGap={3} rowGap={0.25}>
                {BODY_METRIC_FIELD_OPTIONS.map((field) => (
                  <FormControlLabel
                    key={field}
                    sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" }, mr: 0 }}
                    control={
                      <Checkbox
                        checked={settingsDraft.visibleFields.includes(field)}
                        onChange={() =>
                          setSettingsDraft((current) => ({
                            ...current,
                            visibleFields: current.visibleFields.includes(field)
                              ? current.visibleFields.filter((value) => value !== field) as AppPreferences["visibleBodyMetricFields"]
                              : [...current.visibleFields, field] as AppPreferences["visibleBodyMetricFields"]
                          }))
                        }
                      />
                    }
                    label={t(`settings.preferences.visibleBodyMetricFields.${field}` as never)}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsSettingsOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => {
              onPreferencesChange({
                bodyMetricsHistoryDays: settingsDraft.historyDays,
                visibleBodyMetricFields: settingsDraft.visibleFields
              });
              setIsSettingsOpen(false);
            }}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isEntriesDialogOpen} onClose={() => setIsEntriesDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("bodyMetrics.entries" as never)}</DialogTitle>
        <DialogContent>
          <Stack spacing={0} sx={{ pt: 1 }}>
            {entries.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1 }}>
                {t("bodyMetrics.emptyHistory")}
              </Typography>
            ) : (
              entries.map((entry, index) => (
                <Box key={`${entry.date}-${index}`}>
                  <Stack spacing={0.35} sx={{ py: 1.4 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 16 } }}>
                      {formatEntryDate(language, entry.date)}
                    </Typography>
                    <Typography color="text.secondary">
                      {`${formatMetricValue(entry.value, selectedMetric, "exact")} ${valueUnit}`}
                    </Typography>
                  </Stack>
                  {index < entries.length - 1 ? <Divider /> : null}
                </Box>
              ))
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsEntriesDialogOpen(false)}>{t("common.cancel")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
