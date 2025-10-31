import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { AddToMealPlanDialog } from "@/components/AddToMealPlanDialog";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  EDIT_PRODUCT_STORAGE_KEY,
  SELECT_PRODUCT_FOR_PLAN_KEY,
  VIEW_PRODUCT_STORAGE_KEY
} from "@/constants/storage";
import { ensureDirectoryAccess, loadProductDetail, type ProductDetail } from "@/utils/vaultProducts";
import { addProductToMealPlan } from "@/utils/vaultDays";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./ProductScreen.module.css";

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
      try {
        const payload = JSON.parse(payloadRaw) as { fileName?: string };
        if (!payload.fileName) {
          throw new Error("Missing fileName");
        }
        setIsLoading(true);
        const detail = await loadProductDetail(handle, payload.fileName);
        setProduct(detail);
      } catch (error) {
        console.error("Failed to load product detail", error);
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
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{product?.title ?? t("productDetail.title")}</h1>
          <div className={styles.meta}>
            <span>{product?.modelLabel}</span>
            {product?.portionGrams && (
              <span>
                {t("productDetail.portion", { value: String(product.portionGrams), unit: t("mealPlan.units.grams") })}
              </span>
            )}
            {product?.mealTimeLabel && <span>{product.mealTimeLabel}</span>}
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="outlined" onClick={() => setShowDialog(true)} disabled={!product}>
            {t("productDetail.addToDay")}
          </Button>
          <Button variant="ghost" onClick={handleEdit} disabled={!product}>
            {t("productDetail.edit")}
          </Button>
          <Button variant="ghost" onClick={handleSelectVault}>
            {t("productDetail.changeVault")}
          </Button>
        </div>
      </header>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      <section className={styles.card}>
        {isLoading && <div>{t("productDetail.loading")}</div>}
        {product && (
          <>
            <div className={styles.macroGrid}>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.calories")}</span>
                <span className={styles.macroValue}>{nutrition?.caloriesKcal ?? "—"}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.protein")}</span>
                <span className={styles.macroValue}>{nutrition?.proteinG ?? "—"}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.fat")}</span>
                <span className={styles.macroValue}>{nutrition?.fatG ?? "—"}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.carbs")}</span>
                <span className={styles.macroValue}>{nutrition?.carbsG ?? "—"}</span>
              </div>
            </div>
            <p className={styles.notes}>{product.notes}</p>
          </>
        )}
      </section>

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
