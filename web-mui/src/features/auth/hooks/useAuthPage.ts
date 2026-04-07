import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import { ApiError } from "../../../shared/api/http";
import { saveUserProfile, type UserProfile } from "../../settings/api/settingsApi";
import type { AuthUser } from "../api/authApi";
import { getMe, login, register } from "../api/authApi";

type Mode = "login" | "register";
type AuthSubmitValues = {
  email: string;
  password: string;
  confirmPassword?: string;
  profile?: UserProfile;
};

export function useAuthPage(mode: Mode): {
  currentUser: AuthUser | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  submit: (values: AuthSubmitValues) => Promise<void>;
} {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      try {
        const me = await getMe();
        if (!cancelled) {
          setCurrentUser({ id: me.id, email: me.email });
          navigate("/meal-plan", { replace: true });
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function hasProfileData(profile?: UserProfile): boolean {
    if (!profile) {
      return false;
    }

    return Boolean(
      profile.firstName ||
        profile.lastName ||
        profile.sex ||
        profile.birthDate ||
        profile.heightCm ||
        profile.weightKg ||
        profile.activityLevel ||
        profile.goal ||
        profile.macroProfile !== "BALANCED" ||
        profile.calorieDelta
    );
  }

  async function submit(values: AuthSubmitValues): Promise<void> {
    if (!values.email || !values.password) {
      setErrorMessage(t("auth.error.required"));
      return;
    }

    if (mode === "register") {
      if (!values.confirmPassword) {
        setErrorMessage(t("auth.error.confirmRequired"));
        return;
      }

      if (values.password !== values.confirmPassword) {
        setErrorMessage(t("auth.error.passwordMismatch"));
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response =
        mode === "login"
          ? await login({ email: values.email, password: values.password })
          : await register({ email: values.email, password: values.password });

      if (mode === "register" && hasProfileData(values.profile)) {
        await saveUserProfile(values.profile!);
      }

      setCurrentUser(response.user);
      navigate("/meal-plan", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t("auth.error.unexpected"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { currentUser, errorMessage, isSubmitting, submit };
}
