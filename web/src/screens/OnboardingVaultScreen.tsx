import { FormEvent, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/i18n/I18nProvider";
import { createSessionBackendHandle, setSessionVaultDirectoryHandle } from "@/utils/vaultStorage";
import { isAuthenticated, login, register } from "@/utils/apiClient";
import styles from "./OnboardingVaultScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

export function OnboardingVaultScreen(): JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const title = useMemo(
    () => (mode === "login" ? "Вход в SmartFood Backend" : "Создать аккаунт SmartFood Backend"),
    [mode]
  );

  const handleContinue = useCallback(() => {
    const handle = createSessionBackendHandle();
    setSessionVaultDirectoryHandle(handle);
    window.location.hash = "#/meal-plan";
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email.trim() || !password.trim()) {
        setStatus({ type: "error", message: "Введите email и пароль" });
        return;
      }

      setIsLoading(true);
      setStatus(null);
      try {
        if (mode === "login") {
          await login(email.trim(), password);
        } else {
          await register(email.trim(), password);
        }
        setStatus({ type: "success", message: "Авторизация успешна" });
        handleContinue();
      } catch (error) {
        const message = (error as { message?: string }).message ?? "Ошибка авторизации";
        setStatus({ type: "error", message });
      } finally {
        setIsLoading(false);
      }
    },
    [email, handleContinue, mode, password]
  );

  return (
    <div className={styles.root}>
      <section className={styles.content}>
        <Card title={title}>
          <div className={styles.statusRow}>
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {isAuthenticated() && (
            <div className={styles.status}>
              <p>Токен уже сохранён. Можно продолжать работу с backend.</p>
              <Button onClick={handleContinue}>Продолжить</Button>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Пароль</span>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </label>

            {status && <div className={styles.status}>{status.message}</div>}

            <div className={styles.actions}>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
                disabled={isLoading}
              >
                {mode === "login" ? "Нужен аккаунт" : "Уже есть аккаунт"}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}
