import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { AddProductForm, type ProductFormValues } from "@/components/AddProductForm";
import { useTranslation } from "@/i18n/I18nProvider";
import { EDIT_PRODUCT_STORAGE_KEY } from "@/constants/storage";
import {
  ensureDirectoryAccess,
  isPermissionError,
  persistProductMarkdown,
  loadProductDetail,
  updateProductMarkdown,
  type ProductFormData
} from "@/utils/vaultProducts";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./AddProductScreen.module.css";

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

type EditingState = {
  fileName: string;
  slug: string;
  title: string;
  modelLabel?: string;
  mealTimeLabel?: string;
  createdAt?: string;
};

function toFormValues(data: ProductFormData | null): ProductFormValues | null {
  if (!data) {
    return null;
  }
  return {
    model: data.model ?? "",
    productName: data.productName ?? "",
    portion: data.portion ?? "",
    mealTime: data.mealTime ?? "",
    calories: data.calories ?? "",
    protein: data.protein ?? "",
    fat: data.fat ?? "",
    carbs: data.carbs ?? "",
    notes: data.notes ?? ""
  };
}

export function AddProductScreen(): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSelectingVault, setIsSelectingVault] = useState<boolean>(false);
  const [defaultValues, setDefaultValues] = useState<ProductFormValues | null>(null);
  const [formKey, setFormKey] = useState<string>("new");
  const [editing, setEditing] = useState<EditingState | null>(null);

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

  const vaultLabel = vaultHandle?.name
    ? t("addProduct.vault.label", { folder: vaultHandle.name })
    : t("addProduct.vault.label.unselected");

  const vaultHint = vaultHandle
    ? t("addProduct.vault.hint.selected")
    : t("addProduct.vault.hint.missing");

  const clearEditing = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(EDIT_PRODUCT_STORAGE_KEY);
    }
    setEditing(null);
    setDefaultValues(null);
    setFormKey(`new-${Date.now()}`);
  }, []);

  useEffect(() => {
    if (status?.type === "info" || status?.type === "success") {
      if (typeof window === "undefined") {
        return;
      }
      const timeout = window.setTimeout(() => {
        setStatus((current) => (current?.type === status.type ? null : current));
      }, 4000);
      return () => {
        window.clearTimeout(timeout);
      };
    }
    return undefined;
  }, [status]);

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
            setStatus({ type: "error", message: t("addProduct.status.permissionRevoked") });
          }
          return;
        }

        if (!cancelled) {
          setVaultHandle(handle);
          setStatus({
            type: "success",
            message: t("addProduct.status.connected", { folder: handle.name })
          });
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
  }, [t]);

  useEffect(() => {
    if (!vaultHandle || typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(EDIT_PRODUCT_STORAGE_KEY);
    if (!stored) {
      setEditing(null);
      setDefaultValues(null);
      setFormKey("new");
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      try {
        const payload = JSON.parse(stored) as { fileName: string; slug?: string };
        if (!payload?.fileName) {
          throw new Error("Invalid edit payload");
        }
        const detail = await loadProductDetail(vaultHandle, payload.fileName);
        if (cancelled) {
          return;
        }
        setEditing({
          fileName: detail.fileName,
          slug: detail.slug,
          title: detail.title,
          modelLabel: detail.modelLabel,
          mealTimeLabel: detail.mealTimeLabel,
          createdAt: detail.createdAt
        });
        setDefaultValues(toFormValues(detail.formData));
        setFormKey(detail.slug ?? detail.fileName);
        setStatus({ type: "info", message: t("addProduct.status.editing", { title: detail.title }) });
      } catch (error) {
        console.error("Failed to load product detail for editing", error);
        window.sessionStorage.removeItem(EDIT_PRODUCT_STORAGE_KEY);
        setStatus({ type: "error", message: t("addProduct.status.genericError") });
        setEditing(null);
        setDefaultValues(null);
        setFormKey("new");
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [vaultHandle, t]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("addProduct.status.browserUnsupported") });
      return;
    }

    try {
      setIsSelectingVault(true);
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }

      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("addProduct.status.permissionError") });
        return;
      }

      setVaultHandle(handle);
      setStatus({ type: "success", message: t("addProduct.status.connected", { folder: handle.name }) });

      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("addProduct.status.genericError") });
    } finally {
      setIsSelectingVault(false);
    }
  }, [t]);

  const handleSubmit = useCallback(
    async (data: Record<string, string>) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("addProduct.status.noVault") });
        return;
      }

      const modelValue = data.model ?? "";
      const mealTimeValue = data.mealTime ?? "";
      const payload: ProductFormData = {
        ...data,
        modelLabel: modelLabels[modelValue as keyof typeof modelLabels] ?? editing?.modelLabel ?? "",
        mealTimeLabel:
          mealTimeLabels[mealTimeValue as keyof typeof mealTimeLabels] ?? editing?.mealTimeLabel ?? "",
        createdAt: editing?.createdAt ?? ""
      };

      try {
        setIsSaving(true);
        if (editing) {
          await updateProductMarkdown(vaultHandle, editing.fileName, editing.slug, payload);
          setStatus({ type: "success", message: t("addProduct.status.updated") });
          clearEditing();
          window.location.hash = "#/products";
        } else {
          await persistProductMarkdown(vaultHandle, payload);
          setStatus({ type: "success", message: t("addProduct.status.created") });
          setDefaultValues(null);
          setFormKey(`new-${Date.now()}`);
        }
      } catch (error) {
        console.error("Failed to save product", error);
        if (isPermissionError(error)) {
          setVaultHandle(null);
          await clearVaultDirectoryHandle();
          setStatus({ type: "error", message: t("addProduct.status.permissionRevoked") });
        } else {
          setStatus({ type: "error", message: t("addProduct.status.genericError") });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [vaultHandle, t, modelLabels, mealTimeLabels, editing, clearEditing]
  );

  const handleCancelEdit = useCallback(() => {
    clearEditing();
    setStatus({ type: "info", message: t("addProduct.status.loaded") });
  }, [clearEditing, t]);

  const handleBackToList = useCallback(() => {
    window.location.hash = "#/products";
  }, []);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("nav.addProduct")}</h1>
          <p className={styles.subtitle}>{t("addProduct.subtitle")}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outlined" onClick={handleBackToList}>
            {t("addProduct.goToList")}
          </Button>
        </div>
      </header>

      <Card className={styles.card}>
        <div className={styles.vaultControls}>
          <div>
            <span className={styles.vaultLabel}>{vaultLabel}</span>
            <p className={styles.vaultHint}>{vaultHint}</p>
          </div>
          <Button variant="outlined" onClick={handleSelectVault} disabled={isSelectingVault || isSaving}>
            {vaultHandle ? t("addProduct.vault.button.change") : t("addProduct.vault.button.choose")}
          </Button>
        </div>

        {status && <div className={clsx(styles.status, styles[`status-${status.type}`])}>{status.message}</div>}

        {vaultHandle ? (
          <AddProductForm
            onSubmit={handleSubmit}
            isSubmitting={isSaving}
            defaultValues={defaultValues}
            submitLabel={editing ? t("addProduct.form.submitEdit") : undefined}
            formKey={formKey}
            footerSlot={
              editing ? (
                <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                  {t("addProduct.cancelEdit")}
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={styles.placeholder}>{t("addProduct.status.noVault")}</div>
        )}
      </Card>
    </div>
  );
}
