import { ChangeEvent } from "react";
import clsx from "clsx";
import { Card } from "@/components/Card";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/messages";
import type { MealPlanDay } from "@/utils/vaultDays";
import styles from "./MealPlanDay.module.css";

type MealPlanDayProps = {
  day: MealPlanDay | null;
  isLoading: boolean;
  isUpdating: boolean;
  error?: string | null;
  selectedDate: string;
  onDateChange?: (value: string) => void;
};

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function sectionHasItems(daySection: MealPlanDay["sections"][number]): boolean {
  return daySection.items.length > 0;
}

export function MealPlanDayCard({
  day,
  isLoading,
  isUpdating,
  error,
  selectedDate,
  onDateChange
}: MealPlanDayProps): JSX.Element {
  const { t } = useTranslation();
  const total = day?.totals;

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    onDateChange?.(event.target.value);
  };

  const formattedDate = new Date(selectedDate);
  const isDateValid = !Number.isNaN(formattedDate.valueOf());
  const humanDate = isDateValid
    ? new Intl.DateTimeFormat(t("mealPlan.locale"), {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(formattedDate)
    : selectedDate;

  return (
    <Card className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("mealPlan.title")}</h2>
          <p className={styles.subtitle}>{humanDate}</p>
        </div>
        <label className={styles.datePicker}>
          <span className={styles.dateLabel}>{t("mealPlan.selectDate")}</span>
          <input
            className={styles.dateInput}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            disabled={isLoading || isUpdating}
          />
        </label>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t("mealPlan.totals.calories")}</span>
          <span className={styles.metricValue}>
            {total ? formatNumber(total.caloriesKcal) : "—"}{" "}
            <span className={styles.metricUnit}>{t("mealPlan.units.kcal")}</span>
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t("mealPlan.totals.protein")}</span>
          <span className={styles.metricValue}>
            {total ? formatNumber(total.proteinG) : "—"}{" "}
            <span className={styles.metricUnit}>{t("mealPlan.units.grams")}</span>
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t("mealPlan.totals.fat")}</span>
          <span className={styles.metricValue}>
            {total ? formatNumber(total.fatG) : "—"}{" "}
            <span className={styles.metricUnit}>{t("mealPlan.units.grams")}</span>
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>{t("mealPlan.totals.carbs")}</span>
          <span className={styles.metricValue}>
            {total ? formatNumber(total.carbsG) : "—"}{" "}
            <span className={styles.metricUnit}>{t("mealPlan.units.grams")}</span>
          </span>
        </div>
      </div>

      <div
        className={clsx(styles.stateMessage, {
          [styles.visibleState]: isLoading || isUpdating || !!error
        })}
        aria-live="polite"
      >
        {isLoading && <span>{t("mealPlan.state.loading")}</span>}
        {!isLoading && isUpdating && <span>{t("mealPlan.state.updating")}</span>}
        {!isLoading && !isUpdating && error && <span>{t("mealPlan.state.error")}</span>}
      </div>

      <div className={styles.sections}>
        {day && day.sections.some(sectionHasItems) ? (
          day.sections.map((section) => (
            <section key={section.id} className={styles.sectionCard}>
              <header className={styles.sectionHeader}>
                {(() => {
                  const key = `mealTime.${section.id}` as unknown as TranslationKey;
                  const translated = t(key);
                  const title =
                    section.name ??
                    (translated.startsWith("mealTime.") ? section.id : translated);
                  return <h3 className={styles.sectionTitle}>{title}</h3>;
                })()}
                <span className={styles.sectionTotal}>
                  {t("mealPlan.sectionTotal", {
                    value: formatNumber(section.totals.caloriesKcal),
                    unit: t("mealPlan.units.kcal")
                  })}
                </span>
              </header>
              <ul className={styles.items}>
                {section.items.map((item) => (
                  <li key={`${section.id}-${item.ref}-${item.title}`} className={styles.itemRow}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemMeta}>
                      {formatNumber(item.nutrition.caloriesKcal)} {t("mealPlan.units.kcal")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <div className={styles.emptyState}>{t("mealPlan.empty")}</div>
        )}
      </div>

      {day && (
        <footer className={styles.footerTotals}>
          <span>
            {t("mealPlan.totalSummary", {
              kcal: formatNumber(day.totals.caloriesKcal),
              protein: formatNumber(day.totals.proteinG),
              fat: formatNumber(day.totals.fatG),
              carbs: formatNumber(day.totals.carbsG)
            })}
          </span>
        </footer>
      )}
    </Card>
  );
}
