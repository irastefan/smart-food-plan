import { useState } from "react";
import { Alert, Button, Link, MenuItem, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import type { AuthUser } from "../api/authApi";
import type { UserActivityLevel, UserGoal, UserProfile, UserSex } from "../../settings/api/settingsApi";
import { AuthCard } from "./AuthCard";
import { BrandMark } from "./BrandMark";
import { PasswordField } from "./PasswordField";
import { SocialRow } from "./SocialRow";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
  isSubmitting: boolean;
  errorMessage: string | null;
  currentUser: AuthUser | null;
  onSubmit: (values: { email: string; password: string; confirmPassword?: string; profile?: UserProfile }) => Promise<void>;
};

export function AuthForm({
  mode,
  isSubmitting,
  errorMessage,
  currentUser,
  onSubmit
}: AuthFormProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [email, setEmail] = useState("ira@example.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    sex: "",
    birthDate: "",
    heightCm: null,
    weightKg: null,
    activityLevel: "",
    goal: "",
    calorieDelta: null,
    targetCalories: null,
    targetProteinG: null,
    targetFatG: null,
    targetCarbsG: null
  });

  const isLogin = mode === "login";
  const title = isLogin ? t("auth.login.title") : t("auth.register.title");
  const subtitleLabel = isLogin ? t("auth.login.subtitle") : t("auth.register.subtitle");
  const subtitleLink = isLogin ? t("auth.login.link") : t("auth.register.link");
  const subtitleHref = isLogin ? "/register" : "/login";
  const submitLabel = isLogin ? t("auth.login.submit") : t("auth.register.submit");

  function updateProfile<K extends keyof UserProfile>(key: K, nextValue: UserProfile[K]) {
    setProfile((current) => ({ ...current, [key]: nextValue }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSubmit({
      email: email.trim(),
      password,
      confirmPassword: isLogin ? undefined : confirmPassword,
      profile: isLogin ? undefined : profile
    });
  }

  return (
    <AuthCard
      header={
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: isDark
                ? "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.22), rgba(14,165,233,0.10))"
                : "radial-gradient(circle at 30% 30%, rgba(31,181,122,0.16), rgba(31,181,122,0.07))"
            }}
          >
            <BrandMark />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="h5" sx={{ color: "text.primary" }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitleLabel}{" "}
              <Link component={RouterLink} to={subtitleHref} underline="hover" color="primary.main" fontWeight={800}>
                {subtitleLink}
              </Link>
            </Typography>
          </Stack>
        </Stack>
      }
    >
        <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {currentUser ? <Alert severity="success">{t("auth.currentUser", { email: currentUser.email })}</Alert> : null}

        <TextField
          label={t("auth.email")}
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          sx={{
            "& .MuiInputBase-input": {
              color: "text.primary"
            }
          }}
        />

        <Stack spacing={0.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t("auth.password")}
            </Typography>
            {isLogin ? (
              <Link component="button" type="button" underline="hover" color="text.secondary" fontSize={12}>
                {t("auth.forgotPassword")}
              </Link>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("auth.passwordHint")}
              </Typography>
            )}
          </Stack>
          <PasswordField
            label=""
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </Stack>

        {!isLogin ? (
          <>
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                {t("auth.confirmPassword")}
              </Typography>
              <PasswordField
                label=""
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Stack>

            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                {t("auth.profile.title")}
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label={t("settings.profile.firstName")} value={profile.firstName} onChange={(event) => updateProfile("firstName", event.target.value)} fullWidth />
                <TextField label={t("settings.profile.lastName")} value={profile.lastName} onChange={(event) => updateProfile("lastName", event.target.value)} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select label={t("settings.profile.sex")} value={profile.sex} onChange={(event) => updateProfile("sex", event.target.value as UserSex)} fullWidth>
                  <MenuItem value="">{t("settings.profile.sex.unspecified")}</MenuItem>
                  <MenuItem value="FEMALE">{t("settings.profile.sex.female")}</MenuItem>
                  <MenuItem value="MALE">{t("settings.profile.sex.male")}</MenuItem>
                </TextField>
                <TextField label={t("settings.profile.birthDate")} type="date" InputLabelProps={{ shrink: true }} value={profile.birthDate} onChange={(event) => updateProfile("birthDate", event.target.value)} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label={t("settings.profile.heightCm")} type="number" value={profile.heightCm ?? ""} onChange={(event) => updateProfile("heightCm", event.target.value === "" ? null : Number(event.target.value))} fullWidth />
                <TextField label={t("settings.profile.weightKg")} type="number" value={profile.weightKg ?? ""} onChange={(event) => updateProfile("weightKg", event.target.value === "" ? null : Number(event.target.value))} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select label={t("settings.profile.activityLevel")} value={profile.activityLevel} onChange={(event) => updateProfile("activityLevel", event.target.value as UserActivityLevel)} fullWidth>
                  <MenuItem value="">{t("settings.profile.activity.unspecified")}</MenuItem>
                  <MenuItem value="SEDENTARY">{t("settings.profile.activity.sedentary")}</MenuItem>
                  <MenuItem value="LIGHT">{t("settings.profile.activity.light")}</MenuItem>
                  <MenuItem value="MODERATE">{t("settings.profile.activity.moderate")}</MenuItem>
                  <MenuItem value="VERY_ACTIVE">{t("settings.profile.activity.veryActive")}</MenuItem>
                </TextField>
                <TextField select label={t("settings.profile.goal")} value={profile.goal} onChange={(event) => updateProfile("goal", event.target.value as UserGoal)} fullWidth>
                  <MenuItem value="">{t("settings.profile.goal.unspecified")}</MenuItem>
                  <MenuItem value="MAINTAIN">{t("settings.profile.goal.maintain")}</MenuItem>
                  <MenuItem value="LOSE">{t("settings.profile.goal.lose")}</MenuItem>
                  <MenuItem value="GAIN">{t("settings.profile.goal.gain")}</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{
            background: isDark
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : undefined
          }}
        >
          {submitLabel}
        </Button>

        <SocialRow />
      </Stack>
    </AuthCard>
  );
}
