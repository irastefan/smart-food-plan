import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ActionIconButton } from "@/components/ActionIconButton";
import { AddToMealPlanDialog } from "@/components/AddToMealPlanDialog";
import { NutritionSummary, type NutritionSummaryMetric } from "@/components/NutritionSummary";
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
  const nutritionMetrics = useMemo<NutritionSummaryMetric[]>(
    () => [
      {
        key: "calories",
        label: t("mealPlan.totals.calories"),
        value: nutrition?.caloriesKcal ?? null,
        unit: t("mealPlan.units.kcal"),
        precision: 0
      },
      {
        key: "carbs",
        label: t("mealPlan.totals.carbs"),
        value: nutrition?.carbsG ?? null,
        unit: t("addProduct.form.nutrients.macrosUnit")
      },
      {
        key: "fat",
        label: t("mealPlan.totals.fat"),
        value: nutrition?.fatG ?? null,
        unit: t("addProduct.form.nutrients.macrosUnit")
      },
      {
        key: "protein",
        label: t("mealPlan.totals.protein"),
        value: nutrition?.proteinG ?? null,
        unit: t("addProduct.form.nutrients.macrosUnit")
      }
    ],
    [nutrition, t]
  );
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
            <NutritionSummary
              metrics={nutritionMetrics}
              variant="rings"
              mainMetricKey="calories"
              className={styles.nutritionSummary}
            />
            <div className={styles.servingHint}>{t("productDetail.perPortion")}</div>
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
