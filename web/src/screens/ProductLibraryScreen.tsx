import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ProductList } from "@/components/ProductList";
import { AddToMealPlanDialog } from "@/components/AddToMealPlanDialog";
import { useTranslation } from "@/i18n/I18nProvider";
import { EDIT_PRODUCT_STORAGE_KEY, SELECT_PRODUCT_FOR_PLAN_KEY, VIEW_PRODUCT_STORAGE_KEY } from "@/constants/storage";
import {
  deleteProduct,
  ensureDirectoryAccess,
  loadProductSummaries,
  type ProductSummary
} from "@/utils/vaultProducts";
import { addProductToMealPlan } from "@/utils/vaultDays";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./ProductLibraryScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

type ProductLibraryScreenProps = {
  onNavigateAddProduct?: () => void;
  onNavigateViewProduct?: () => void;
};

export function ProductLibraryScreen({
  onNavigateAddProduct,
  onNavigateViewProduct
}: ProductLibraryScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [pendingPlanDate, setPendingPlanDate] = useState<string | null>(null);
  const [planProduct, setPlanProduct] = useState<ProductSummary | null>(null);

  const refreshProducts = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setProducts([]);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        const list = await loadProductSummaries(handle);
        setProducts(list);
      } catch (error) {
        console.error("Failed to load products", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const planRequest = window.sessionStorage.getItem(SELECT_PRODUCT_FOR_PLAN_KEY);
      if (planRequest) {
        try {
          const payload = JSON.parse(planRequest) as { date?: string };
          if (payload?.date) {
            setPendingPlanDate(payload.date);
            setStatus({ type: "info", message: t("productList.planMode", { date: payload.date }) });
          }
        } catch (error) {
          console.warn("Failed to parse plan request", error);
          window.sessionStorage.removeItem(SELECT_PRODUCT_FOR_PLAN_KEY);
        }
      }
    }
  }, [t]);

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
          void refreshProducts(handle);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
        if (!cancelled) {
          setStatus({ type: "error", message: t("addProduct.status.restoreError") });
        }
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [refreshProducts, t]);

  const handleAddProduct = useCallback(() => {
    if (pendingPlanDate && typeof window !== "undefined") {
      window.sessionStorage.removeItem(SELECT_PRODUCT_FOR_PLAN_KEY);
      setPendingPlanDate(null);
    }
    onNavigateAddProduct?.();
  }, [onNavigateAddProduct, pendingPlanDate]);

  const handleAddToMealPlan = useCallback(
    (product: ProductSummary) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("addProduct.status.genericError") });
        return;
      }
      setPlanProduct(product);
    },
    [t, vaultHandle]
  );

  const handleConfirmAdd = useCallback(
    async ({
      sectionId,
      sectionName,
      quantity,
      unit
    }: {
      sectionId: string;
      sectionName: string;
      quantity: number;
      unit: string;
    }) => {
      if (!vaultHandle || !planProduct) {
        setStatus({ type: "error", message: t("addProduct.status.genericError") });
        return;
      }

      const targetDate = pendingPlanDate ?? new Date().toISOString().slice(0, 10);
      try {
        await addProductToMealPlan(vaultHandle, targetDate, planProduct, {
          sectionId,
          sectionName,
          quantity,
          unit
        });
        setStatus({
          type: "success",
          message: t("mealPlan.status.added", {
            title: planProduct.title,
            section: sectionName ?? sectionId
          })
        });
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(SELECT_PRODUCT_FOR_PLAN_KEY);
        }
        setPendingPlanDate(null);
        setPlanProduct(null);
        if (pendingPlanDate && typeof window !== "undefined") {
          window.location.hash = "#/meal-plan";
        }
      } catch (error) {
        console.error("Failed to add product to plan", error);
        setStatus({ type: "error", message: t("mealPlan.status.error") });
      }
    },
    [pendingPlanDate, planProduct, t, vaultHandle]
  );

  const handleEditProduct = useCallback(
    (product: ProductSummary) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("addProduct.status.genericError") });
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          EDIT_PRODUCT_STORAGE_KEY,
          JSON.stringify({ fileName: product.fileName, slug: product.slug })
        );
      }

      onNavigateAddProduct?.();
    },
    [onNavigateAddProduct, t, vaultHandle]
  );

  const handleViewProduct = useCallback(
    (product: ProductSummary) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          VIEW_PRODUCT_STORAGE_KEY,
          JSON.stringify({ fileName: product.fileName, slug: product.slug })
        );
      }
      onNavigateViewProduct?.();
    },
    [onNavigateViewProduct]
  );

  const handleDeleteProduct = useCallback(
    async (product: ProductSummary) => {
      if (!vaultHandle) {
        return;
      }

      const confirmed = window.confirm(t("productList.deleteConfirm", { title: product.title }));
      if (!confirmed) {
        return;
      }

      try {
        await deleteProduct(vaultHandle, product.fileName);
        setStatus({ type: "success", message: t("productList.status.deleted") });
        await refreshProducts(vaultHandle);
      } catch (error) {
        console.error("Failed to delete product", error);
        setStatus({ type: "error", message: t("productList.status.deleteError") });
      }
    },
    [refreshProducts, t, vaultHandle]
  );

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{t("productList.title")}</h1>
          <p className={styles.subtitle}>{t("addProduct.subtitle")}</p>
        </div>
        <div className={styles.headerActions}>
          <Button onClick={handleAddProduct}>{t("nav.addProduct")}</Button>
        </div>
      </header>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      <Card className={styles.listCard}>
        <ProductList
          products={products}
          isLoading={isLoading}
          hasError={hasError}
          onRefresh={() => {
            void refreshProducts(vaultHandle);
          }}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
          onAddToMealPlan={handleAddToMealPlan}
          onDeleteProduct={handleDeleteProduct}
          disableManageActions={false}
          disableAddActions={false}
        />
      </Card>
      {planProduct && (
        <AddToMealPlanDialog
          product={planProduct}
          onCancel={() => setPlanProduct(null)}
          onConfirm={handleConfirmAdd}
        />
      )}
    </div>
  );
}
