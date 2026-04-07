import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Button, Checkbox, CircularProgress, FormControlLabel, Radio, RadioGroup, Stack, Typography } from "@mui/material";
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

function toggleArrayValue<T extends string>(values: T[], nextValue: T, maxCount?: number): T[] {
  if (values.includes(nextValue)) {
    return values.filter((value) => value !== nextValue);
  }

  if (typeof maxCount === "number" && values.length >= maxCount) {
    return values;
  }

  return [...values, nextValue];
}

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
      <Stack spacing={1}>
        <Typography fontWeight={700}>{t("settings.preferences.mealPlanSummaryMetric")}</Typography>
        <RadioGroup
          value={draft.mealPlanSummaryMetric}
          onChange={(event) =>
            setDraft({
              ...draft,
              mealPlanSummaryMetric: event.target.value as AppPreferences["mealPlanSummaryMetric"]
            })
          }
        >
          {MEAL_PLAN_SUMMARY_OPTIONS.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={t(`settings.preferences.mealPlanSummaryMetric.${option}` as never)}
            />
          ))}
        </RadioGroup>
      </Stack>

      <Stack spacing={1}>
        <Typography fontWeight={700}>{t("settings.preferences.mobileQuickNavItems")}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {t("settings.preferences.mobileQuickNavItemsHint")}
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          columnGap={3}
          rowGap={0.25}
        >
          {MOBILE_NAV_OPTIONS.map((item) => {
            const checked = draft.mobileQuickNavItems.includes(item);
            const disabled = !checked && draft.mobileQuickNavItems.length >= 4;

            return (
              <FormControlLabel
                key={item}
                sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" }, mr: 0 }}
                control={
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        mobileQuickNavItems: toggleArrayValue(draft.mobileQuickNavItems, item, 4) as AppPreferences["mobileQuickNavItems"]
                      })
                    }
                  />
                }
                label={t(`settings.preferences.mobileQuickNavItems.${item}` as never)}
              />
            );
          })}
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography fontWeight={700}>{t("settings.preferences.visibleBodyMetricFields")}</Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          columnGap={3}
          rowGap={0.25}
        >
          {BODY_METRIC_FIELD_OPTIONS.map((field) => (
            <FormControlLabel
              key={field}
              sx={{ width: { xs: "100%", sm: "calc(50% - 12px)" }, mr: 0 }}
              control={
                <Checkbox
                  checked={draft.visibleBodyMetricFields.includes(field)}
                  onChange={() =>
                    setDraft({
                      ...draft,
                      visibleBodyMetricFields: toggleArrayValue(draft.visibleBodyMetricFields, field) as AppPreferences["visibleBodyMetricFields"]
                    })
                  }
                />
              }
              label={t(`settings.preferences.visibleBodyMetricFields.${field}` as never)}
            />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography fontWeight={700}>{t("settings.preferences.bodyMetricsHistoryDays")}</Typography>
        <RadioGroup
          value={String(draft.bodyMetricsHistoryDays)}
          onChange={(event) =>
            setDraft({
              ...draft,
              bodyMetricsHistoryDays: Number(event.target.value) as AppPreferences["bodyMetricsHistoryDays"]
            })
          }
        >
          {BODY_METRICS_HISTORY_OPTIONS.map((value) => (
            <FormControlLabel
              key={value}
              value={String(value)}
              control={<Radio />}
              label={t("settings.preferences.bodyMetricsHistoryDays.option" as never, { value })}
            />
          ))}
        </RadioGroup>
      </Stack>

      <Stack sx={{ alignSelf: { md: "flex-end" }, width: { xs: "100%", md: "auto" } }}>
        <Button
          onClick={() => onSave(draft)}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {t("settings.preferences.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
