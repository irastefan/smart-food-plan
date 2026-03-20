import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { AiAgentSettings } from "../../shared/config/aiAgent";
import { useLanguage } from "../../app/providers/LanguageProvider";

type AiAgentSettingsCardProps = {
  value: AiAgentSettings;
  isSubmitting: boolean;
  onSave: (value: AiAgentSettings) => void;
};

const MODEL_OPTIONS = ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"];
const SPEECH_LANGUAGE_OPTIONS: Array<AiAgentSettings["speechLanguage"]> = ["interface", "en", "ru"];
const ACCESS_MODE_OPTIONS: Array<AiAgentSettings["accessMode"]> = ["limited", "full"];

export function AiAgentSettingsCard({ value, isSubmitting, onSave }: AiAgentSettingsCardProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<AiAgentSettings>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <SmartToyRoundedIcon color="primary" />
        <div>
          <Typography variant="h6" fontWeight={800}>{t("settings.agent.title")}</Typography>
          <Typography color="text.secondary">{t("settings.agent.subtitle")}</Typography>
        </div>
      </Stack>

      <TextField
        select
        label={t("settings.agent.model")}
        value={draft.model}
        onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
        fullWidth
      >
        {MODEL_OPTIONS.map((model) => (
          <MenuItem key={model} value={model}>
            {model}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("settings.agent.speechLanguage")}
        value={draft.speechLanguage}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            speechLanguage: event.target.value as AiAgentSettings["speechLanguage"]
          }))
        }
        fullWidth
      >
        {SPEECH_LANGUAGE_OPTIONS.map((languageOption) => (
          <MenuItem key={languageOption} value={languageOption}>
            {t(`settings.agent.speechLanguage.${languageOption}` as never)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t("settings.agent.accessMode")}
        value={draft.accessMode}
        onChange={(event) =>
          setDraft((current) => ({
            ...current,
            accessMode: event.target.value as AiAgentSettings["accessMode"]
          }))
        }
        helperText={t(`settings.agent.accessMode.${draft.accessMode}.hint` as never)}
        fullWidth
      >
        {ACCESS_MODE_OPTIONS.map((mode) => (
          <MenuItem key={mode} value={mode}>
            {t(`settings.agent.accessMode.${mode}` as never)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label={t("settings.agent.instructions")}
        value={draft.userInstructions}
        onChange={(event) => setDraft((current) => ({ ...current, userInstructions: event.target.value }))}
        multiline
        minRows={6}
        placeholder={t("settings.agent.instructionsPlaceholder")}
        fullWidth
      />

      <FormControlLabel
        control={
          <Switch
            checked={draft.showToolOutput}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                showToolOutput: event.target.checked
              }))
            }
          />
        }
        label={t("settings.agent.showToolOutput")}
      />

      <Button onClick={() => onSave(draft)} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
        {t("settings.agent.save")}
      </Button>
    </Stack>
  );
}
