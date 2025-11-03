import { useMemo } from "react";
import { Button } from "@/components/Button";
import { ActionIconButton } from "@/components/ActionIconButton";
import { useTranslation } from "@/i18n/I18nProvider";
import type { ProductSummary } from "@/utils/vaultProducts";
import styles from "./ProductList.module.css";

type ProductListProps = {
  products: ProductSummary[];
  isLoading: boolean;
  hasError: boolean;
  onRefresh: () => void;
  onAddToMealPlan?: (product: ProductSummary) => void;
  disableAddActions?: boolean;
  onViewProduct?: (product: ProductSummary) => void;
  onEditProduct?: (product: ProductSummary) => void;
  onDeleteProduct?: (product: ProductSummary) => void;
  disableManageActions?: boolean;
};

function formatNumber(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined) {
    return "—";
  }
  const normalized = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(normalized)) {
    return "—";
  }
  return Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(fractionDigits);
}

function sanitizeNotes(notes: string | undefined): string {
  if (!notes) {
    return "";
  }
  return notes.replace(/[_*`]+/g, "");
}

function getMacroPercentages(macros: ProductSummary["nutritionPerPortion"]):
  | { protein: number; fat: number; carbs: number }
  | null {
  if (!macros) {
    return null;
  }
  const protein = macros.proteinG ?? 0;
  const fat = macros.fatG ?? 0;
  const carbs = macros.carbsG ?? 0;
  const total = protein + fat + carbs;
  if (total <= 0) {
    return null;
  }
  return {
    protein: Math.round((protein / total) * 100),
    fat: Math.round((fat / total) * 100),
    carbs: Math.round((carbs / total) * 100)
  };
}

export function ProductList({
  products,
  isLoading,
  hasError,
  onRefresh,
  onAddToMealPlan,
  disableAddActions = false,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  disableManageActions = false
}: ProductListProps): JSX.Element {
  const { t } = useTranslation();

  const listContent = useMemo(() => {
    if (hasError) {
      return <div className={styles.statusMessage}>{t("productList.error")}</div>;
    }

    if (isLoading) {
      return <div className={styles.statusMessage}>{t("productList.loading")}</div>;
    }

    if (products.length === 0) {
      return <div className={styles.statusMessage}>{t("productList.empty")}</div>;
    }

    return (
      <ul className={styles.list}>
        {products.map((product) => {
          const portion = product.portionGrams
            ? `${formatNumber(product.portionGrams)} ${t("addProduct.form.portionUnit")}`
            : "—";
          const macros = product.nutritionPerPortion;
          const macroPercentages = getMacroPercentages(macros);
          const notes = sanitizeNotes(product.notes);

          return (
            <li key={product.fileName} className={styles.item}>
              <div className={styles.itemHeader}>
                <div>
                  <span className={styles.itemTitle}>{product.title}</span>
                  {product.modelLabel && <span className={styles.itemBadge}>{product.modelLabel}</span>}
                </div>
                <div className={styles.itemMeta}>
                  <span>
                    <strong>{t("productList.portion")}:</strong> {portion}
                  </span>
                  {product.mealTimeLabel && (
                    <span>
                      <strong>{t("productList.meal")}:</strong> {product.mealTimeLabel}
                    </span>
                  )}
                </div>
              </div>
              {macros && (
                <div className={styles.nutritionRow}>
                  <div className={styles.energyBadge}>
                    <span className={styles.energyValue}>
                      {formatNumber(macros.caloriesKcal, 0)}
                    </span>
                    <span className={styles.energyLabel}>{t("mealPlan.units.kcal")}</span>
                  </div>
                  {macroPercentages ? (
                    <div className={styles.macroSummary}>
                      <div className={styles.macroBar} aria-hidden="true">
                        <div
                          className={styles.macroSegment}
                          style={{ width: `${macroPercentages.carbs}%`, backgroundColor: "#4ECDC4" }}
                        />
                        <div
                          className={styles.macroSegment}
                          style={{ width: `${macroPercentages.fat}%`, backgroundColor: "#45B7D1" }}
                        />
                        <div
                          className={styles.macroSegment}
                          style={{ width: `${macroPercentages.protein}%`, backgroundColor: "#FFA726" }}
                        />
                      </div>
                      <div className={styles.macroLabels}>
                        <span style={{ color: "#4ECDC4" }}>
                          {formatNumber(macros.carbsG)}{t("addProduct.form.nutrients.macrosUnit")} {t("recipe.macros.carbs")}
                        </span>
                        <span style={{ color: "#45B7D1" }}>
                          {formatNumber(macros.fatG)}{t("addProduct.form.nutrients.macrosUnit")} {t("recipe.macros.fat")}
                        </span>
                        <span style={{ color: "#FFA726" }}>
                          {formatNumber(macros.proteinG)}{t("addProduct.form.nutrients.macrosUnit")} {t("recipe.macros.protein")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.macroFallback}>
                      <span>
                        {t("productList.macros")}: {formatNumber(macros.proteinG)} / {formatNumber(macros.fatG)} / {formatNumber(macros.carbsG)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {notes && (
                <p className={styles.itemNotes}>
                  <strong>{t("productList.notes")}:</strong> {notes}
                </p>
              )}
              <div className={styles.actions}>
                {onAddToMealPlan && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      onAddToMealPlan(product);
                    }}
                    disabled={disableAddActions}
                  >
                    {t("productList.addToMealPlan")}
                  </Button>
                )}
                {onViewProduct && (
                  <ActionIconButton
                    action="view"
                    label={t("productList.view")}
                    onClick={() => onViewProduct(product)}
                  />
                )}
                {(onEditProduct || onDeleteProduct) && (
                  <div className={styles.manageGroup}>
                    {onEditProduct && (
                      <ActionIconButton
                        action="edit"
                        label={t("productList.edit")}
                        onClick={() => onEditProduct(product)}
                        disabled={disableManageActions}
                      />
                    )}
                    {onDeleteProduct && (
                      <ActionIconButton
                        action="delete"
                        label={t("productList.delete")}
                        onClick={() => onDeleteProduct(product)}
                        disabled={disableManageActions}
                      />
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }, [
    hasError,
    isLoading,
    products,
    t,
    onAddToMealPlan,
    disableAddActions,
    onEditProduct,
    onDeleteProduct,
    disableManageActions
  ]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("productList.title")}</h2>
        <Button variant="ghost" onClick={onRefresh} disabled={isLoading}>
          {t("productList.refresh")}
        </Button>
      </div>
      {listContent}
    </div>
  );
}
