import { useMemo, useState } from "react";
import { useTranslation } from "@/i18n/I18nProvider";
import type { ProductSummary } from "@/utils/vaultProducts";
import { scaleNutritionTotals, type NutritionTotals } from "@/utils/vaultDays";
import styles from "./AddToMealPlanDialog.module.css";

type AddToMealPlanDialogProps = {
  product: ProductSummary;
  onCancel: () => void;
  onConfirm: (options: { sectionId: string; sectionName: string; quantity: number; unit: string }) => void;
};

const MEAL_SECTION_ORDER = ["breakfast", "lunch", "dinner", "snack", "flex"] as const;

function normalizeNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function computeScaledMacros(product: ProductSummary, quantity: number): NutritionTotals {
  const portion = product.portionGrams ?? null;
  const base = product.nutritionPerPortion ?? {};
  const baseTotals: NutritionTotals = {
    caloriesKcal: base.caloriesKcal ?? 0,
    proteinG: base.proteinG ?? 0,
    fatG: base.fatG ?? 0,
    carbsG: base.carbsG ?? 0
  };
  const factor = portion && portion > 0 ? quantity / portion : quantity || 1;
  return scaleNutritionTotals(baseTotals, factor || 1);
}

export function AddToMealPlanDialog({ product, onCancel, onConfirm }: AddToMealPlanDialogProps): JSX.Element {
  const { t } = useTranslation();
  const defaultQuantity = product.portionGrams && product.portionGrams > 0 ? product.portionGrams : 1;
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [unit, setUnit] = useState<string>(product.portionGrams ? t("units.grams") : t("units.portion"));
  const [sectionId, setSectionId] = useState<string>(product.mealTime ?? "breakfast");

  const sectionName = useMemo(() => {
    const key = `mealTime.${sectionId}` as const;
    const label = t(key);
    return label.startsWith("mealTime.") ? sectionId : label;
  }, [sectionId, t]);

  const macros = useMemo(() => computeScaledMacros(product, quantity), [product, quantity]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t("mealPlan.addProductTitle", { title: product.title })}</h2>
          <button type="button" className={styles.closeButton} onClick={onCancel} aria-label={t("common.close")}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label htmlFor="meal-section">{t("mealPlan.chooseMeal")}</label>
              <select
                id="meal-section"
                value={sectionId}
                onChange={(event) => setSectionId(event.target.value)}
              >
                {MEAL_SECTION_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {t(`mealTime.${id}` as const)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="quantity">{t("mealPlan.quantityLabel")}</label>
              <input
                id="quantity"
                type="number"
                step="0.5"
                min="0"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(0, normalizeNumber(event.target.value)))}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="unit">{t("mealPlan.unitLabel")}</label>
              <select id="unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
                <option value={t("units.grams")}>{t("units.grams")}</option>
                <option value={t("units.portion")}>{t("units.portion")}</option>
              </select>
            </div>
          </div>

          <div className={styles.macrosSummary}>
            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>{t("mealPlan.totals.calories")}</span>
              <span className={styles.macroValue}>{formatNumber(macros.caloriesKcal)}</span>
            </div>
            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>{t("mealPlan.totals.protein")}</span>
              <span className={styles.macroValue}>{formatNumber(macros.proteinG)}</span>
            </div>
            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>{t("mealPlan.totals.fat")}</span>
              <span className={styles.macroValue}>{formatNumber(macros.fatG)}</span>
            </div>
            <div className={styles.macroItem}>
              <span className={styles.macroLabel}>{t("mealPlan.totals.carbs")}</span>
              <span className={styles.macroValue}>{formatNumber(macros.carbsG)}</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={`${styles.overlayButton} ${styles.secondaryButton}`} onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={styles.overlayButton}
            onClick={() =>
              onConfirm({
                sectionId,
                sectionName,
                quantity: quantity || defaultQuantity,
                unit
              })
            }
            disabled={!quantity}
          >
            {t("mealPlan.addToDay")}
          </button>
        </div>
      </div>
    </div>
  );
}
