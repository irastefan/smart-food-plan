import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AddProductForm } from "@/components/AddProductForm";
import { ProductList } from "@/components/ProductList";
import { MealPlanDayCard } from "@/components/MealPlanDay";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/messages";
import type { ProductFormData, ProductSummary } from "@/utils/vaultProducts";
import {
  ensureDirectoryAccess,
  isPermissionError,
  loadProductSummaries,
  persistProductMarkdown
} from "@/utils/vaultProducts";
import { addProductToMealPlan, loadMealPlanDay, type MealPlanDay } from "@/utils/vaultDays";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./AddProductScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      key: TranslationKey;
      params?: Record<string, string>;
    }
  | null;

export function AddProductScreen(): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSelectingVault, setIsSelectingVault] = useState<boolean>(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [productLoadFailed, setProductLoadFailed] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dayPlan, setDayPlan] = useState<MealPlanDay | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);
  const [isUpdatingDay, setIsUpdatingDay] = useState<boolean>(false);
  const [dayError, setDayError] = useState<string | null>(null);

  const modelLabels = useMemo(
    () => ({
      balanced: t("dietModel.balanced"),
      vegan: t("dietModel.vegan"),
      fitness: t("dietModel.fitness"),
      keto: t("dietModel.keto")
    }),
    [t]
  );

  const mealTimeLabels = useMemo(
    () => ({
      breakfast: t("mealTime.breakfast"),
      lunch: t("mealTime.lunch"),
      snack: t("mealTime.snack"),
      dinner: t("mealTime.dinner")
    }),
    [t]
  );

  const vaultFolderLabel = useMemo(() => {
    if (vaultHandle?.name) {
      return t("addProduct.vault.label", { folder: vaultHandle.name });
    }
    return t("addProduct.vault.label.unselected");
  }, [t, vaultHandle]);

  const vaultHint = vaultHandle
    ? t("addProduct.vault.hint.selected")
    : t("addProduct.vault.hint.missing");

  const refreshProducts = useCallback(async (handle: FileSystemDirectoryHandle | null) => {
    if (!handle) {
      setProducts([]);
      return;
    }

    try {
      setIsLoadingProducts(true);
      setProductLoadFailed(false);
      const items = await loadProductSummaries(handle);
      setProducts(items);
    } catch (error) {
      console.error("Failed to load products", error);
      setProductLoadFailed(true);
    } finally {
      setIsLoadingProducts(false);
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
          if (!cancelled) {
            setStatus({
              type: "error",
              key: "addProduct.status.permissionRevoked"
            });
            setVaultHandle(null);
            setProducts([]);
          }
          return;
        }

        if (!cancelled) {
          setVaultHandle(handle);
          setStatus({
            type: "success",
            key: "addProduct.status.connected",
            params: { folder: handle.name }
          });
        }
      } catch (error) {
        console.error("Failed to restore vault directory handle", error);
        if (!cancelled) {
          setStatus({
            type: "error",
            key: "addProduct.status.restoreError"
          });
        }
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status?.type === "info" || status?.type === "success") {
      if (typeof window === "undefined") {
        return;
      }
      const timeout = window.setTimeout(() => {
        setStatus((current) => (current?.type === status.type ? null : current));
      }, 5000);
      return () => {
        window.clearTimeout(timeout);
      };
    }
    return undefined;
  }, [status]);

  useEffect(() => {
    void refreshProducts(vaultHandle);
  }, [vaultHandle, refreshProducts]);

  useEffect(() => {
    if (!vaultHandle) {
      setDayPlan(null);
      setDayError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingDay(true);
    setDayError(null);

    const loadDay = async () => {
      try {
        const day = await loadMealPlanDay(vaultHandle, selectedDate);
        if (!cancelled) {
          setDayPlan(day);
        }
      } catch (error) {
        console.error("Failed to load meal plan day", error);
        if (!cancelled) {
          setDayError("loadFailed");
          setDayPlan(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDay(false);
        }
      }
    };

    void loadDay();

    return () => {
      cancelled = true;
    };
  }, [vaultHandle, selectedDate]);

  useEffect(() => {
    if (!vaultHandle) {
      setProducts([]);
      return;
    }
    void refreshProducts(vaultHandle);
  }, [vaultHandle, refreshProducts]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({
        type: "error",
        key: "addProduct.status.browserUnsupported"
      });
      return;
    }

    try {
      setIsSelectingVault(true);
      setStatus(null);
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }

      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({
          type: "error",
          key: "addProduct.status.permissionError"
        });
        return;
      }

      setVaultHandle(handle);
      setStatus({
        type: "success",
        key: "addProduct.status.connected",
        params: { folder: handle.name }
      });

      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }

      console.error("Failed to select vault directory", error);
      setStatus({
        type: "error",
        key: "addProduct.status.genericError"
      });
    } finally {
      setIsSelectingVault(false);
    }
  }, [refreshProducts]);

  const handleFormSubmit = useCallback(
    async (data: ProductFormData) => {
      if (!vaultHandle) {
        setStatus({
          type: "error",
          key: "addProduct.status.noVault"
        });
        return;
      }

      try {
        setIsSaving(true);
        setStatus({
          type: "info",
          key: "addProduct.status.saving"
        });
        const modelValue = data["model"] ?? "";
        const mealTimeValue = data["mealTime"] ?? "";
        const modelLabel =
          modelLabels[modelValue as keyof typeof modelLabels] ?? modelValue;
        const mealTimeLabel =
          mealTimeLabels[mealTimeValue as keyof typeof mealTimeLabels] ?? mealTimeValue;
        const payload: ProductFormData = {
          ...data,
          modelLabel,
          mealTimeLabel
        };
        const { fileName } = await persistProductMarkdown(vaultHandle, payload);
        setStatus({
          type: "success",
          key: "addProduct.status.saved",
          params: { file: fileName }
        });
        await refreshProducts(vaultHandle);
      } catch (error) {
        console.error("Failed to save product markdown", error);

        if (isPermissionError(error)) {
          setVaultHandle(null);
          setProducts([]);
          if (typeof window !== "undefined" && "indexedDB" in window) {
            await clearVaultDirectoryHandle();
          }
          setStatus({
            type: "error",
            key: "addProduct.status.permissionRevoked"
          });
          return;
        }

        setStatus({
          type: "error",
          key: "addProduct.status.genericError"
        });
      } finally {
        setIsSaving(false);
      }
    },
    [vaultHandle, modelLabels, mealTimeLabels, refreshProducts]
  );

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleAddProductToDay = useCallback(
    async (product: ProductSummary) => {
      if (!vaultHandle) {
        setStatus({
          type: "error",
          key: "addProduct.status.noVault"
        });
        return;
      }

      try {
        setIsUpdatingDay(true);
        const sectionId = product.mealTime ?? "flex";
        const sectionLabel =
          product.mealTimeLabel ??
          mealTimeLabels[sectionId as keyof typeof mealTimeLabels] ??
          sectionId;
        const { day } = await addProductToMealPlan(vaultHandle, selectedDate, product, {
          sectionId,
          sectionName: sectionLabel
        });
        setDayPlan(day);
        setStatus({
          type: "success",
          key: "mealPlan.status.added",
          params: {
            title: product.title,
            section: sectionLabel
          }
        });
      } catch (error) {
        console.error("Failed to add product to meal plan", error);
        setStatus({
          type: "error",
          key: "mealPlan.status.error"
        });
      } finally {
        setIsUpdatingDay(false);
      }
    },
    [vaultHandle, selectedDate, mealTimeLabels]
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.badge}>{t("addProduct.badge")}</span>
          <h1 className={styles.title}>{t("addProduct.title")}</h1>
          <p className={styles.subtitle}>{t("addProduct.subtitle")}</p>
        </div>
        <ThemeToggle />
      </header>

      <main className={styles.content}>
        <Card className={styles.formCard}>
          <div className={styles.vaultControls}>
            <div className={styles.vaultInfo}>
              <span className={styles.vaultLabel}>{vaultFolderLabel}</span>
              <p className={styles.vaultHint}>{vaultHint}</p>
              <div className={styles.statusPlaceholder} aria-live="polite">
                {status && (
                  <div
                    className={clsx(styles.statusMessage, {
                      [styles.statusMessageSuccess]: status.type === "success",
                      [styles.statusMessageError]: status.type === "error",
                      [styles.statusMessageInfo]: status.type === "info"
                    })}
                  >
                    {t(status.key, status.params)}
                  </div>
                )}
              </div>
            </div>
            {typeof window !== "undefined" && (
              <Button
                variant="outlined"
                onClick={handleSelectVault}
                disabled={isSelectingVault || isSaving}
              >
                {vaultHandle
                  ? t("addProduct.vault.button.change")
                  : t("addProduct.vault.button.choose")}
              </Button>
            )}
          </div>

          <AddProductForm onSubmit={handleFormSubmit} isSubmitting={isSaving} />
        </Card>

        <aside className={styles.preview}>
          <h2 className={styles.previewTitle}>{t("addProduct.preview.title")}</h2>
          <p className={styles.previewDescription}>{t("addProduct.preview.description")}</p>
          <ul className={styles.previewList}>
            <li>
              <span className={styles.previewLabel}>{t("addProduct.preview.model")}</span>
              <span className={styles.previewValue}>{t("dietModel.balanced")}</span>
            </li>
            <li>
              <span className={styles.previewLabel}>{t("addProduct.preview.portion")}</span>
              <span className={styles.previewValue}>
                {t("addProduct.form.portionPlaceholder")} {t("addProduct.form.portionUnit")}
              </span>
            </li>
            <li>
              <span className={styles.previewLabel}>{t("addProduct.preview.nutrition")}</span>
              <span className={styles.previewValue}>132 / 18 / 7 / 12</span>
            </li>
          </ul>

          <div className={styles.tip}>
            <span className={styles.tipTitle}>{t("addProduct.tip.title")}</span>
            <p>{t("addProduct.tip.body")}</p>
          </div>
        </aside>
      </main>

      <section className={styles.listSection}>
        <Card className={styles.listCard}>
          <ProductList
            products={products}
            isLoading={isLoadingProducts}
            hasError={productLoadFailed}
            onRefresh={() => {
              void refreshProducts(vaultHandle);
            }}
            onAddToMealPlan={handleAddProductToDay}
            disableAddActions={isUpdatingDay || !vaultHandle}
          />
        </Card>
      </section>

      <section className={styles.daySection}>
        <MealPlanDayCard
          day={dayPlan}
          isLoading={isLoadingDay}
          isUpdating={isUpdatingDay}
          error={dayError ? t("mealPlan.state.error") : null}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      </section>
    </div>
  );
}
