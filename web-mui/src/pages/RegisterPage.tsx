import { AuthForm } from "../features/auth/components/AuthForm";
import { useAuthPage } from "../features/auth/hooks/useAuthPage";

export function RegisterPage() {
  const { currentUser, errorMessage, isSubmitting, submit } = useAuthPage("register");

  return (
    <AuthForm
      mode="register"
      currentUser={currentUser}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    />
  );
}
