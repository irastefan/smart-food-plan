import { useEffect, useState } from "react";
import { ApiError } from "../../../shared/api/http";
import { getMealPlanDay, getTodayIsoDate, type MealPlanDay } from "../api/mealPlanApi";

export function useMealPlanDashboard(): {
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  day: MealPlanDay | null;
  setDay: (value: MealPlanDay | null) => void;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
} {
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate);
  const [day, setDay] = useState<MealPlanDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const dayPlan = await getMealPlanDay(selectedDate);
      setDay(dayPlan);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to load meal plan.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [selectedDate]);

  return { selectedDate, setSelectedDate, day, setDay, isLoading, errorMessage, refresh };
}
