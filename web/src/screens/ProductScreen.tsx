import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ActionIconButton } from "@/components/ActionIconButton";
import { AddToMealPlanDialog } from "@/components/AddToMealPlanDialog";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  EDIT_PRODUCT_STORAGE_KEY,
  SELECT_PRODUCT_FOR_PLAN_KEY,
  VIEW_PRODUCT_STORAGE_KEY
} from "@/constants/storage";
import {
  ensureDirectoryAccess,
  loadProductDetail,
  loadProductSummaries,
  type ProductDetail
} from "@/utils/vaultProducts";
import { addProductToMealPlan } from "@/utils/vaultDays";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./ProductScreen.module.css";

function formatNumber(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined) {
    return "—";
  }
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return "—";
  }
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(fractionDigits);
}

function getMacroPercentages(
  nutrition: ProductDetail["nutritionPerPortion"] | null | undefined
):
  | { protein: number; fat: number; carbs: number }
  | null {
  if (!nutrition) {
    return null;
  }
  const protein = nutrition.proteinG ?? 0;
  const fat = nutrition.fatG ?? 0;
  const carbs = nutrition.carbsG ?? 0;
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

type ProductScreenProps = {
  onNavigateEdit?: () => void;
  onNavigateBackToPlan?: () => void;
};

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

export function ProductScreen({ onNavigateEdit, onNavigateBackToPlan }: ProductScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [planDate, setPlanDate] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const loadProduct = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle || typeof window === "undefined") {
        return;
      }
      const payloadRaw = window.sessionStorage.getItem(VIEW_PRODUCT_STORAGE_KEY);
      if (!payloadRaw) {
        return;
      }
      let parsed: { fileName?: string; slug?: string } | null = null;
      try {
        parsed = JSON.parse(payloadRaw) as { fileName?: string; slug?: string };
      } catch (error) {
        console.warn("Failed to parse product view payload", error);
        window.sessionStorage.removeItem(VIEW_PRODUCT_STORAGE_KEY);
      }

      if (!parsed) {
        return;
      }

      try {
        let fileName = parsed.fileName;
        if (!fileName && parsed.slug) {
          const summaries = await loadProductSummaries(handle);
          const match = summaries.find((entry) => entry.slug === parsed.slug);
          if (match?.fileName) {
            fileName = match.fileName;
            window.sessionStorage.setItem(
              VIEW_PRODUCT_STORAGE_KEY,
              JSON.stringify({ fileName, slug: match.slug })
            );
          }
        }

        if (!fileName) {
          window.sessionStorage.removeItem(VIEW_PRODUCT_STORAGE_KEY);
          setStatus({ type: "error", message: t("productDetail.status.loadError") });
          return;
        }

        setIsLoading(true);
        const detail = await loadProductDetail(handle, fileName);
        setProduct(detail);
      } catch (error) {
        console.error("Failed to load product detail", error);
        window.sessionStorage.removeItem(VIEW_PRODUCT_STORAGE_KEY);
        setStatus({ type: "error", message: t("productDetail.status.loadError") });
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const planRequest = window.sessionStorage.getItem(SELECT_PRODUCT_FOR_PLAN_KEY);
      if (planRequest) {
        try {
          const payload = JSON.parse(planRequest) as { date?: string };
          if (payload?.date) {
            setPlanDate(payload.date);
          }
        } catch (error) {
          console.warn("Failed to parse plan request", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
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
          void loadProduct(handle);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
        setStatus({ type: "error", message: t("productDetail.status.restoreError") });
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadProduct, t]);

  const nutrition = useMemo(() => product?.nutritionPerPortion ?? null, [product]);
  const macroPercentages = useMemo(() => getMacroPercentages(nutrition), [nutrition]);
  const heroInitial = product?.title?.trim().charAt(0).toUpperCase() ?? "🍽";

  const handleEdit = useCallback(() => {
    if (typeof window !== "undefined" && product) {
      window.sessionStorage.setItem(
        EDIT_PRODUCT_STORAGE_KEY,
        JSON.stringify({ fileName: product.fileName, slug: product.slug })
      );
    }
    onNavigateEdit?.();
  }, [onNavigateEdit, product]);

  const handleAddToPlanConfirm = useCallback(
    async ({ sectionId, sectionName, quantity, unit }: { sectionId: string; sectionName: string; quantity: number; unit: string }) => {
      if (!vaultHandle || !product) {
        setStatus({ type: "error", message: t("productDetail.status.noVault") });
        return;
      }

      try {
        const targetDate = planDate ?? new Date().toISOString().slice(0, 10);
        await addProductToMealPlan(vaultHandle, targetDate, product, {
          sectionId,
          sectionName,
          quantity,
          unit
        });
        setStatus({ type: "success", message: t("productDetail.status.added", { date: targetDate }) });
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(SELECT_PRODUCT_FOR_PLAN_KEY);
        }
        setPlanDate(null);
        setShowDialog(false);
        onNavigateBackToPlan?.();
      } catch (error) {
        console.error("Failed to add product to plan", error);
        setStatus({ type: "error", message: t("productDetail.status.addError") });
      }
    },
    [onNavigateBackToPlan, planDate, product, t, vaultHandle]
  );

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("productDetail.status.browserUnsupported") });
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("productDetail.status.permissionError") });
        return;
      }

      setVaultHandle(handle);
      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
      void loadProduct(handle);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("productDetail.status.genericError") });
    }
  }, [loadProduct, t]);

  return (
    <div className={styles.root}>
      <section className={styles.heroCard}>
        <div className={styles.heroMeta}>
          <div className={styles.heroAvatar} aria-hidden="true">
            <span>{heroInitial}</span>
          </div>
          <div>
            <div className={styles.heroBadge}>{product?.modelLabel ?? t("productDetail.subtitle")}</div>
            <h1 className={styles.title}>{product?.title ?? t("productDetail.title")}</h1>
            <div className={styles.metaChips}>
              {product?.portionGrams && (
                <span className={styles.metaChip}>
                  {t("productDetail.portion", { value: String(product.portionGrams), unit: t("mealPlan.units.grams") })}
                </span>
              )}
              {product?.mealTimeLabel && <span className={styles.metaChip}>{product.mealTimeLabel}</span>}
            </div>
          </div>
        </div>
        <div className={styles.heroActions}>
          <Button variant="outlined" onClick={() => setShowDialog(true)} disabled={!product}>
            {t("productDetail.addToDay")}
          </Button>
          <ActionIconButton
            action="edit"
            label={t("productDetail.edit")}
            onClick={handleEdit}
            disabled={!product}
          />
          <Button variant="ghost" onClick={handleSelectVault}>
            {t("productDetail.changeVault")}
          </Button>
        </div>
      </section>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      <section className={styles.nutritionSection}>
        {isLoading && <div className={styles.loadingCard}>{t("productDetail.loading")}</div>}
        {product && (
          <div className={styles.nutritionCard}>
            <div className={styles.nutritionChart}>
              <div className={styles.calorieCenter}>
                <div className={styles.calorieNumber}>{formatNumber(nutrition?.caloriesKcal, 0)}</div>
                <div className={styles.calorieLabel}>{t("mealPlan.units.kcal")}</div>
                <div className={styles.servingHint}>{t("productDetail.perPortion")}</div>
              </div>
              {macroPercentages && (
                <svg className={styles.nutritionRing} viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#4ECDC4"
                    strokeWidth="8"
                    strokeDasharray={`${macroPercentages.carbs * 2.51} 251.2`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#45B7D1"
                    strokeWidth="8"
                    strokeDasharray={`${macroPercentages.fat * 2.51} 251.2`}
                    strokeDashoffset={`-${macroPercentages.carbs * 2.51}`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#FFA726"
                    strokeWidth="8"
                    strokeDasharray={`${macroPercentages.protein * 2.51} 251.2`}
                    strokeDashoffset={`-${(macroPercentages.carbs + macroPercentages.fat) * 2.51}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              )}
            </div>

            <div className={styles.macroBreakdown}>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{macroPercentages?.carbs ?? 0}%</span>
                <span className={styles.macroAmount}>
                  {formatNumber(nutrition?.carbsG)} {t("addProduct.form.nutrients.macrosUnit")}
                </span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.carbs")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{macroPercentages?.fat ?? 0}%</span>
                <span className={styles.macroAmount}>
                  {formatNumber(nutrition?.fatG)} {t("addProduct.form.nutrients.macrosUnit")}
                </span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.fat")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{macroPercentages?.protein ?? 0}%</span>
                <span className={styles.macroAmount}>
                  {formatNumber(nutrition?.proteinG)} {t("addProduct.form.nutrients.macrosUnit")}
                </span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.protein")}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {product?.notes && (
        <section className={styles.notesCard}>
          <h2>{t("productDetail.notesTitle")}</h2>
          <p>{product.notes}</p>
        </section>
      )}

      {showDialog && product && (
        <AddToMealPlanDialog
          product={product}
          onCancel={() => setShowDialog(false)}
          onConfirm={handleAddToPlanConfirm}
        />
      )}
    </div>
  );
}
