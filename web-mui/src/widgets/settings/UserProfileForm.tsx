import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import type { UserActivityLevel, UserGoal, UserProfile, UserSex } from "../../features/settings/api/settingsApi";
import { useLanguage } from "../../app/providers/LanguageProvider";

type UserProfileFormProps = {
  value: UserProfile;
  isSubmitting: boolean;
  status?: { type: "error" | "success" | "info"; message: string } | null;
  onChange: (value: UserProfile) => void;
  onSave: () => void;
  onRecalculate: () => void;
};

export function UserProfileForm({ value, isSubmitting, status, onChange, onSave, onRecalculate }: UserProfileFormProps) {
  const { t } = useLanguage();

  function update<K extends keyof UserProfile>(key: K, nextValue: UserProfile[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Stack spacing={3}>
      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={800}>{t("settings.profile.title")}</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("settings.profile.firstName")} value={value.firstName} onChange={(event) => update("firstName", event.target.value)} fullWidth />
            <TextField label={t("settings.profile.lastName")} value={value.lastName} onChange={(event) => update("lastName", event.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label={t("settings.profile.sex")} value={value.sex} onChange={(event) => update("sex", event.target.value as UserSex)} fullWidth>
              <MenuItem value="">{t("settings.profile.sex.unspecified")}</MenuItem>
              <MenuItem value="FEMALE">{t("settings.profile.sex.female")}</MenuItem>
              <MenuItem value="MALE">{t("settings.profile.sex.male")}</MenuItem>
            </TextField>
            <TextField label={t("settings.profile.birthDate")} type="date" InputLabelProps={{ shrink: true }} value={value.birthDate} onChange={(event) => update("birthDate", event.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("settings.profile.heightCm")} type="number" value={value.heightCm ?? ""} onChange={(event) => update("heightCm", event.target.value === "" ? null : Number(event.target.value))} fullWidth />
            <TextField label={t("settings.profile.weightKg")} type="number" value={value.weightKg ?? ""} onChange={(event) => update("weightKg", event.target.value === "" ? null : Number(event.target.value))} fullWidth />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label={t("settings.profile.activityLevel")} value={value.activityLevel} onChange={(event) => update("activityLevel", event.target.value as UserActivityLevel)} fullWidth>
              <MenuItem value="">{t("settings.profile.activity.unspecified")}</MenuItem>
              <MenuItem value="SEDENTARY">{t("settings.profile.activity.sedentary")}</MenuItem>
              <MenuItem value="LIGHT">{t("settings.profile.activity.light")}</MenuItem>
              <MenuItem value="MODERATE">{t("settings.profile.activity.moderate")}</MenuItem>
              <MenuItem value="VERY_ACTIVE">{t("settings.profile.activity.veryActive")}</MenuItem>
            </TextField>
            <TextField select label={t("settings.profile.goal")} value={value.goal} onChange={(event) => update("goal", event.target.value as UserGoal)} fullWidth>
              <MenuItem value="">{t("settings.profile.goal.unspecified")}</MenuItem>
              <MenuItem value="MAINTAIN">{t("settings.profile.goal.maintain")}</MenuItem>
              <MenuItem value="LOSE">{t("settings.profile.goal.lose")}</MenuItem>
              <MenuItem value="GAIN">{t("settings.profile.goal.gain")}</MenuItem>
            </TextField>
          </Stack>

          <TextField label={t("settings.profile.calorieDelta")} type="number" value={value.calorieDelta ?? ""} onChange={(event) => update("calorieDelta", event.target.value === "" ? null : Number(event.target.value))} fullWidth />
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end">
        <Button onClick={onRecalculate} variant="outlined" startIcon={<RestartAltRoundedIcon />} disabled={isSubmitting}>
          {t("settings.recalculate")}
        </Button>
        <Button onClick={onSave} variant="contained" startIcon={<SaveRoundedIcon />} disabled={isSubmitting}>
          {t("settings.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
