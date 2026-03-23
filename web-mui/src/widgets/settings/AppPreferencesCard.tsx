import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { AiAgentSettings } from "../../shared/config/aiAgent";
import { useLanguage } from "../../app/providers/LanguageProvider";

type AppPreferencesCardProps = {
  value: Pick<AiAgentSettings, "mealPlanSummaryMetric">;
  isSubmitting: boolean;
  onSave: (value: Pick<AiAgentSettings, "mealPlanSummaryMetric">) => void;
};

const MEAL_PLAN_SUMMARY_OPTIONS: Array<AiAgentSettings["mealPlanSummaryMetric"]> = ["remaining", "food"];

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
            mealPlanSummaryMetric: event.target.value as AiAgentSettings["mealPlanSummaryMetric"]
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

      <Button onClick={() => onSave(draft)} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
        {t("settings.preferences.save")}
      </Button>
    </Stack>
  );
}
