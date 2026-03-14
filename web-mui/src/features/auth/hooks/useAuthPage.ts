import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../app/providers/LanguageProvider";
import { ApiError } from "../../../shared/api/http";
import type { AuthUser } from "../api/authApi";
import { getMe, login, register } from "../api/authApi";

type Mode = "login" | "register";

export function useAuthPage(mode: Mode): {
  currentUser: AuthUser | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  submit: (values: { email: string; password: string }) => Promise<void>;
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

  async function submit(values: { email: string; password: string }): Promise<void> {
    if (!values.email || !values.password) {
      setErrorMessage(t("auth.error.required"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = mode === "login" ? await login(values) : await register(values);
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
