import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import MonitorWeightRoundedIcon from "@mui/icons-material/MonitorWeightRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { Alert, Avatar, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { type PropsWithChildren, useEffect, useState } from "react";
import type { UserActivityLevel, UserGoal, UserProfile, UserSex } from "../../features/settings/api/settingsApi";
import { formatCalorieDelta, getDefaultCalorieDelta, parseCalorieDelta } from "../../features/settings/model/profileDefaults";
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
  const [deltaInput, setDeltaInput] = useState(formatCalorieDelta(value.calorieDelta));
  const selectedFormula = value.availableTargetFormulas.find((option) => option.value === value.targetFormula);
  const isMaintainGoal = value.goal === "MAINTAIN";
  const calorieDeltaHintKey = isMaintainGoal
    ? "settings.profile.calorieDeltaHint.maintain"
    : value.goal === "GAIN"
      ? "settings.profile.calorieDeltaHint.gain"
      : "settings.profile.calorieDeltaHint.lose";

  useEffect(() => {
    setDeltaInput(formatCalorieDelta(value.calorieDelta));
  }, [value.calorieDelta]);

  function update<K extends keyof UserProfile>(key: K, nextValue: UserProfile[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  function handleGoalChange(goal: UserGoal) {
    onChange({
      ...value,
      goal,
      calorieDelta: getDefaultCalorieDelta(goal)
    });
    setDeltaInput(formatCalorieDelta(getDefaultCalorieDelta(goal)));
  }

  function handleDeltaChange(nextValue: string) {
    setDeltaInput(nextValue);
    const parsed = parseCalorieDelta(nextValue);
    if (parsed != null || nextValue.trim() === "") {
      update("calorieDelta", parsed);
    }
  }

  return (
    <Stack spacing={3}>
      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

      <Stack spacing={2.5}>
        <FormGroupBlock
          icon={<PersonRoundedIcon fontSize="small" />}
          title={t("settings.profile.group.personal.title")}
          description={t("settings.profile.group.personal.description")}
        >
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
        </FormGroupBlock>

        <FormGroupBlock
          icon={<MonitorWeightRoundedIcon fontSize="small" />}
          title={t("settings.profile.group.body.title")}
          description={t("settings.profile.group.body.description")}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label={t("settings.profile.heightCm")} type="text" inputProps={{ inputMode: "decimal" }} value={value.heightCm ?? ""} onChange={(event) => update("heightCm", event.target.value === "" ? null : Number(event.target.value.replace(",", ".")))} fullWidth />
            <TextField label={t("settings.profile.weightKg")} type="text" inputProps={{ inputMode: "decimal" }} value={value.weightKg ?? ""} onChange={(event) => update("weightKg", event.target.value === "" ? null : Number(event.target.value.replace(",", ".")))} fullWidth />
          </Stack>
        </FormGroupBlock>

        <FormGroupBlock
          icon={<DirectionsRunRoundedIcon fontSize="small" />}
          title={t("settings.profile.group.targets.title")}
          description={t("settings.profile.group.targets.description")}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField select label={t("settings.profile.activityLevel")} value={value.activityLevel} onChange={(event) => update("activityLevel", event.target.value as UserActivityLevel)} fullWidth>
              <MenuItem value="">{t("settings.profile.activity.unspecified")}</MenuItem>
              <MenuItem value="SEDENTARY">{t("settings.profile.activity.sedentary")}</MenuItem>
              <MenuItem value="LIGHT">{t("settings.profile.activity.light")}</MenuItem>
              <MenuItem value="MODERATE">{t("settings.profile.activity.moderate")}</MenuItem>
              <MenuItem value="VERY_ACTIVE">{t("settings.profile.activity.veryActive")}</MenuItem>
            </TextField>
            <TextField select label={t("settings.profile.goal")} value={value.goal} onChange={(event) => handleGoalChange(event.target.value as UserGoal)} fullWidth>
              <MenuItem value="">{t("settings.profile.goal.unspecified")}</MenuItem>
              <MenuItem value="MAINTAIN">{t("settings.profile.goal.maintain")}</MenuItem>
              <MenuItem value="LOSE">{t("settings.profile.goal.lose")}</MenuItem>
              <MenuItem value="GAIN">{t("settings.profile.goal.gain")}</MenuItem>
            </TextField>
          </Stack>

          <TextField
            select
            label={t("settings.profile.targetFormula")}
            value={value.targetFormula}
            onChange={(event) => update("targetFormula", event.target.value)}
            helperText={selectedFormula?.description || t("settings.profile.targetFormulaHint")}
            fullWidth
          >
            {value.availableTargetFormulas.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
                {option.isDefault ? ` (${t("settings.profile.targetFormulaDefault")})` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t("settings.profile.calorieDelta")}
            value={deltaInput}
            onChange={(event) => handleDeltaChange(event.target.value)}
            placeholder={t("settings.profile.calorieDeltaPlaceholder")}
            helperText={t(calorieDeltaHintKey)}
            inputProps={{ inputMode: "decimal" }}
            disabled={isMaintainGoal}
            fullWidth
          />
        </FormGroupBlock>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="flex-end"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ alignSelf: { md: "flex-end" } }}
      >
        <Button
          onClick={onRecalculate}
          variant="outlined"
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <RestartAltRoundedIcon />}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {t("settings.recalculate")}
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          disabled={isSubmitting}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {t("settings.save")}
        </Button>
      </Stack>
    </Stack>
  );
}

function FormGroupBlock({
  icon,
  title,
  description,
  children
}: PropsWithChildren<{ icon: React.ReactNode; title: string; description: string }>) {
  return (
    <Paper sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Avatar sx={{ width: 32, height: 32, bgcolor: "background.paper", color: "primary.main" }}>
            {icon}
          </Avatar>
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>
        </Stack>
        <Stack spacing={2}>{children}</Stack>
      </Stack>
    </Paper>
  );
}
