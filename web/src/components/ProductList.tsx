import { useMemo } from "react";
import { Button } from "@/components/Button";
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
  onEditProduct?: (product: ProductSummary) => void;
  onDeleteProduct?: (product: ProductSummary) => void;
  disableManageActions?: boolean;
};

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function sanitizeNotes(notes: string | undefined): string {
  if (!notes) {
    return "";
  }
  return notes.replace(/[_*`]+/g, "");
}

export function ProductList({
  products,
  isLoading,
  hasError,
  onRefresh,
  onAddToMealPlan,
  disableAddActions = false,
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
          const macrosText = macros
            ? `${formatNumber(macros.caloriesKcal)} ${t(
                "addProduct.form.nutrients.caloriesUnit"
              )} / ${formatNumber(macros.proteinG)}${t(
                "addProduct.form.nutrients.macrosUnit"
              )} / ${formatNumber(macros.fatG)}${t(
                "addProduct.form.nutrients.macrosUnit"
              )} / ${formatNumber(macros.carbsG)}${t("addProduct.form.nutrients.macrosUnit")}`
            : "—";
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
                  <span>
                    <strong>{t("productList.macros")}:</strong> {macrosText}
                  </span>
                </div>
              </div>
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
                {(onEditProduct || onDeleteProduct) && (
                  <div className={styles.manageGroup}>
                    {onEditProduct && (
                      <Button
                        variant="ghost"
                        onClick={() => onEditProduct(product)}
                        disabled={disableManageActions}
                      >
                        {t("productList.edit")}
                      </Button>
                    )}
                    {onDeleteProduct && (
                      <Button
                        variant="ghost"
                        className={styles.deleteButton}
                        onClick={() => onDeleteProduct(product)}
                        disabled={disableManageActions}
                      >
                        {t("productList.delete")}
                      </Button>
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
