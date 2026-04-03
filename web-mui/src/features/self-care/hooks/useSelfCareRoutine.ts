import { useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/http";
import { getSelfCareRoutineWeek, type SelfCareRoutineWeek } from "../api/selfCareApi";

export function useSelfCareRoutine(): {
  week: SelfCareRoutineWeek | null;
  setWeek: (value: SelfCareRoutineWeek | null) => void;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
} {
  const [week, setWeek] = useState<SelfCareRoutineWeek | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextWeek = await getSelfCareRoutineWeek();
      setWeek(nextWeek);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("selfCare.status.loadError");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return { week, setWeek, isLoading, errorMessage, refresh };
}
