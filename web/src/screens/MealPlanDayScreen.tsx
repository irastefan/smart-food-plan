import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { MealPlanDayCard } from "@/components/MealPlanDay";
import { SELECT_PRODUCT_FOR_PLAN_KEY } from "@/constants/storage";
import { useTranslation } from "@/i18n/I18nProvider";
import { loadMealPlanDay, type MealPlanDay } from "@/utils/vaultDays";
import { clearVaultDirectoryHandle, loadVaultDirectoryHandle } from "@/utils/vaultStorage";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import styles from "./MealPlanDayScreen.module.css";

type MealPlanDayScreenProps = {
  onNavigateToProducts?: () => void;
};

export function MealPlanDayScreen({ onNavigateToProducts }: MealPlanDayScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dayPlan, setDayPlan] = useState<MealPlanDay | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);
  const [dayError, setDayError] = useState<string | null>(null);

  const loadDayPlan = useCallback(
    async (handle: FileSystemDirectoryHandle | null, date: string) => {
      if (!handle) {
        setDayPlan(null);
        return;
      }
      setIsLoadingDay(true);
      setDayError(null);
      try {
        const day = await loadMealPlanDay(handle, date);
        setDayPlan(day);
      } catch (error) {
        console.error("Failed to load meal plan day", error);
        setDayError("mealPlan.state.error");
        setDayPlan(null);
      } finally {
        setIsLoadingDay(false);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return;
    }

    let cancelled = false;

    const restoreHandle = async () => {
      try {
        const handle = await loadVaultDirectoryHandle();
        if (!handle) {
          return;
        }

        const hasAccess = await ensureDirectoryAccess(handle);
        if (!hasAccess) {
          await clearVaultDirectoryHandle();
          return;
        }

        if (!cancelled) {
          setVaultHandle(handle);
          void loadDayPlan(handle, selectedDate);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadDayPlan, selectedDate]);

  useEffect(() => {
    void loadDayPlan(vaultHandle, selectedDate);
  }, [vaultHandle, selectedDate, loadDayPlan]);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleNavigate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        SELECT_PRODUCT_FOR_PLAN_KEY,
        JSON.stringify({ date: selectedDate })
      );
    }
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else if (typeof window !== "undefined") {
      window.location.hash = "#/products";
    }
  }, [selectedDate, onNavigateToProducts]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("mealPlan.title")}</h1>
          <p className={styles.subtitle}>{t("mealPlan.description")}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outlined" onClick={handleNavigate}>
            {t("productList.addToMealPlan")}
          </Button>
        </div>
      </header>

      <MealPlanDayCard
        day={dayPlan}
        isLoading={isLoadingDay}
        isUpdating={false}
        error={dayError}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
