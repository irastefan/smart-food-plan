import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Button, Checkbox, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { AppPreferences } from "../../shared/config/appPreferences";

type AppPreferencesCardProps = {
  value: AppPreferences;
  isSubmitting: boolean;
  onSave: (value: AppPreferences) => void;
};

const MEAL_PLAN_SUMMARY_OPTIONS: Array<AppPreferences["mealPlanSummaryMetric"]> = ["remaining", "food"];
const BODY_METRICS_HISTORY_OPTIONS: Array<AppPreferences["bodyMetricsHistoryDays"]> = [30, 60, 90, 180];
const MOBILE_NAV_OPTIONS: AppPreferences["mobileQuickNavItems"] = ["meal-plan", "recipes", "products", "shopping", "self-care", "settings"];
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

export function AppPreferencesCard({ value, isSubmitting, onSave }: AppPreferencesCardProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <TuneRoundedIcon color="primary" />
        <div>
          <Typography variant="h6" fontWeight={800}>{t("settings.preferences.title")}</Typography>
          <Typography color="text.secondary">{t("settings.preferences.subtitle")}</Typography>
        </div>
      </Stack>

      <TextField
        select
        label={t("settings.preferences.mealPlanSummaryMetric")}
        value={draft.mealPlanSummaryMetric}
        onChange={(event) =>
          setDraft({
            ...draft,
            mealPlanSummaryMetric: event.target.value as AppPreferences["mealPlanSummaryMetric"]
          })
        }
        fullWidth
      >
        {MEAL_PLAN_SUMMARY_OPTIONS.map((option) => (
          <MenuItem key={option} value={option}>
            {t(`settings.preferences.mealPlanSummaryMetric.${option}` as never)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("settings.preferences.mobileQuickNavItems")}
        value={draft.mobileQuickNavItems}
        onChange={(event) =>
          setDraft({
            ...draft,
            mobileQuickNavItems:
              (typeof event.target.value === "string"
                ? event.target.value.split(",")
                : event.target.value as string[]).slice(0, 4) as AppPreferences["mobileQuickNavItems"]
          })
        }
        SelectProps={{
          multiple: true,
          renderValue: (selected) =>
            (selected as AppPreferences["mobileQuickNavItems"])
              .map((item) => t(`settings.preferences.mobileQuickNavItems.${item}` as never))
              .join(", ")
        }}
        helperText={t("settings.preferences.mobileQuickNavItemsHint")}
        fullWidth
      >
        {MOBILE_NAV_OPTIONS.map((item) => (
          <MenuItem key={item} value={item}>
            <Checkbox checked={draft.mobileQuickNavItems.includes(item)} />
            <ListItemText primary={t(`settings.preferences.mobileQuickNavItems.${item}` as never)} />
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("settings.preferences.visibleBodyMetricFields")}
        value={draft.visibleBodyMetricFields}
        onChange={(event) =>
          setDraft({
            ...draft,
            visibleBodyMetricFields: typeof event.target.value === "string" ? event.target.value.split(",") as AppPreferences["visibleBodyMetricFields"] : event.target.value as AppPreferences["visibleBodyMetricFields"]
          })
        }
        SelectProps={{
          multiple: true,
          renderValue: (selected) =>
            (selected as AppPreferences["visibleBodyMetricFields"])
              .map((field) => t(`settings.preferences.visibleBodyMetricFields.${field}` as never))
              .join(", ")
        }}
        fullWidth
      >
        {BODY_METRIC_FIELD_OPTIONS.map((field) => (
          <MenuItem key={field} value={field}>
            <Checkbox checked={draft.visibleBodyMetricFields.includes(field)} />
            <ListItemText primary={t(`settings.preferences.visibleBodyMetricFields.${field}` as never)} />
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("settings.preferences.bodyMetricsHistoryDays")}
        value={draft.bodyMetricsHistoryDays}
        onChange={(event) =>
          setDraft({
            ...draft,
            bodyMetricsHistoryDays: Number(event.target.value) as AppPreferences["bodyMetricsHistoryDays"]
          })
        }
        fullWidth
      >
        {BODY_METRICS_HISTORY_OPTIONS.map((value) => (
          <MenuItem key={value} value={value}>
            {t("settings.preferences.bodyMetricsHistoryDays.option" as never, { value })}
          </MenuItem>
        ))}
      </TextField>

      <Button onClick={() => onSave(draft)} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
        {t("settings.preferences.save")}
      </Button>
    </Stack>
  );
}
