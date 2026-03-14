import { useState } from "react";
import { Alert, Button, Link, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import type { AuthUser } from "../api/authApi";
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
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
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

  const isLogin = mode === "login";
  const title = isLogin ? t("auth.login.title") : t("auth.register.title");
  const subtitleLabel = isLogin ? t("auth.login.subtitle") : t("auth.register.subtitle");
  const subtitleLink = isLogin ? t("auth.login.link") : t("auth.register.link");
  const subtitleHref = isLogin ? "/register" : "/login";
  const submitLabel = isLogin ? t("auth.login.submit") : t("auth.register.submit");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onSubmit({ email: email.trim(), password });
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
