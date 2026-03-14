import { useEffect, useState } from "react";
import { getMe, type AuthUser } from "../../features/auth/api/authApi";

export function useDashboardUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser({ id: me.id, email: me.email });
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
