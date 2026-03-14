import { AuthForm } from "../features/auth/components/AuthForm";
import { useAuthPage } from "../features/auth/hooks/useAuthPage";

export function LoginPage() {
  const { currentUser, errorMessage, isSubmitting, submit } = useAuthPage("login");

  return (
    <AuthForm
      mode="login"
      currentUser={currentUser}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    />
  );
}
