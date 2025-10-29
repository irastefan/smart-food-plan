import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/i18n/I18nProvider";
import { SELECT_RECIPE_FOR_PLAN_KEY, VIEW_RECIPE_STORAGE_KEY } from "@/constants/storage";
import { ensureDirectoryAccess, loadProductSummaries, type ProductSummary } from "@/utils/vaultProducts";
import { addProductToMealPlan, addRecipeToMealPlan } from "@/utils/vaultDays";
import { loadRecipeSummaries, type RecipeSummary } from "@/utils/vaultRecipes";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./AddRecipeToDayScreen.module.css";

type SelectedRecipe = {
  kind: "recipe";
  summary: RecipeSummary;
  servings: number;
};

type SelectedProduct = {
  kind: "product";
  summary: ProductSummary;
  quantity: number;
  unit: string;
};

type SelectedItem = SelectedRecipe | SelectedProduct;

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

type AddRecipeToDayScreenProps = {
  onNavigateBack?: () => void;
  onNavigateToRecipe?: () => void;
};

export function AddRecipeToDayScreen({ onNavigateBack, onNavigateToRecipe }: AddRecipeToDayScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"recipes" | "products">("recipes");
  const [search, setSearch] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [status, setStatus] = useState<StatusState>(null);
  const [targetSection, setTargetSection] = useState<string>("flex");
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const payloadRaw = window.sessionStorage.getItem(SELECT_RECIPE_FOR_PLAN_KEY);
      if (payloadRaw) {
        try {
          const payload = JSON.parse(payloadRaw) as { date?: string; sectionId?: string };
          if (payload.date) {
            setTargetDate(payload.date);
          }
          if (payload.sectionId) {
            setTargetSection(payload.sectionId);
          }
        } catch (error) {
          console.warn("Failed to parse plan selection", error);
        }
      }
    }
  }, []);

  const refreshData = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setRecipes([]);
        setProducts([]);
        return;
      }
      try {
        const [recipeList, productList] = await Promise.all([loadRecipeSummaries(handle), loadProductSummaries(handle)]);
        setRecipes(recipeList);
        setProducts(productList);
      } catch (error) {
        console.error("Failed to load data", error);
        setStatus({ type: "error", message: t("addToDay.status.loadError") });
      }
    },
    [t]
  );

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
          await refreshData(handle);
        }
      } catch (error) {
        console.error("Failed to restore handle", error);
        setStatus({ type: "error", message: t("addToDay.status.restoreError") });
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [refreshData, t]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("addToDay.status.browserUnsupported") });
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("addToDay.status.permissionError") });
        return;
      }
      setVaultHandle(handle);
      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
      await refreshData(handle);
      setStatus({ type: "success", message: t("addToDay.status.connected", { folder: handle.name }) });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("addToDay.status.genericError") });
    }
  }, [refreshData, t]);

  const filteredRecipes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return recipes;
    }
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(term));
  }, [recipes, search]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter((product) => product.title.toLowerCase().includes(term));
  }, [products, search]);

  const handleSelectRecipe = useCallback(
    (recipe: RecipeSummary) => {
      setSelectedItems((current) => {
        const exists = current.some((item) => item.kind === "recipe" && item.summary.fileName === recipe.fileName);
        if (exists) {
          return current;
        }
        return [...current, { kind: "recipe", summary: recipe, servings: 1 }];
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          VIEW_RECIPE_STORAGE_KEY,
          JSON.stringify({ fileName: recipe.fileName, slug: recipe.slug })
        );
      }
      onNavigateToRecipe?.();
    },
    [onNavigateToRecipe]
  );

  const handleSelectProduct = useCallback((product: ProductSummary) => {
    setSelectedItems((current) => {
      const exists = current.some((item) => item.kind === "product" && item.summary.fileName === product.fileName);
      if (exists) {
        return current;
      }
      const quantity = product.portionGrams && product.portionGrams > 0 ? product.portionGrams : 100;
      const unit = product.portionGrams ? t("mealPlan.units.grams") : t("units.portion", "portion");
      return [...current, { kind: "product", summary: product, quantity, unit }];
    });
  }, [t]);

  const handleRemoveSelected = useCallback((index: number) => {
    setSelectedItems((current) => current.filter((_, idx) => idx !== index));
  }, []);

  const handleUpdateSelected = useCallback((index: number, patch: Partial<SelectedItem>) => {
    setSelectedItems((current) =>
      current.map((item, idx) => {
        if (idx !== index) {
          return item;
        }
        return { ...item, ...patch } as SelectedItem;
      })
    );
  }, []);

  const handleAddToDay = useCallback(async () => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("addToDay.status.noVault") });
      return;
    }
    if (selectedItems.length === 0) {
      setStatus({ type: "error", message: t("addToDay.status.emptySelection") });
      return;
    }
    setIsSaving(true);
    try {
      for (const item of selectedItems) {
        if (item.kind === "recipe") {
          await addRecipeToMealPlan(vaultHandle, targetDate, item.summary, {
            sectionId: targetSection,
            servings: item.servings
          });
        } else {
          await addProductToMealPlan(vaultHandle, targetDate, item.summary, {
            sectionId: targetSection,
            quantity: item.quantity,
            unit: item.unit
          });
        }
      }
      setStatus({ type: "success", message: t("addToDay.status.success", { count: selectedItems.length }) });
      setSelectedItems([]);
      onNavigateBack?.();
    } catch (error) {
      console.error("Failed to add selection", error);
      setStatus({ type: "error", message: t("addToDay.status.error") });
    } finally {
      setIsSaving(false);
    }
  }, [onNavigateBack, selectedItems, t, targetDate, targetSection, vaultHandle]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t("addToDay.title")}</h1>
          <p>{t("addToDay.subtitle", { date: targetDate })}</p>
        </div>
        <Button variant="outlined" onClick={handleSelectVault}>
          {t("addToDay.changeVault")}
        </Button>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "recipes" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("recipes")}
        >
          {t("addToDay.tabRecipes")}
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "products" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("products")}
        >
          {t("addToDay.tabProducts")}
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder={t("addToDay.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      {activeTab === "recipes" ? (
        <div className={styles.list}>
          {filteredRecipes.map((recipe) => (
            <article key={recipe.fileName} className={styles.card}>
              <div className={styles.cardTitle}>{recipe.title}</div>
              <div className={styles.cardMeta}>
                {t("recipes.perServing", {
                  kcal: recipe.nutritionPerServing.caloriesKcal?.toFixed(0) ?? "0",
                  protein: recipe.nutritionPerServing.proteinG?.toFixed(1) ?? "0",
                  fat: recipe.nutritionPerServing.fatG?.toFixed(1) ?? "0",
                  carbs: recipe.nutritionPerServing.carbsG?.toFixed(1) ?? "0"
                })}
              </div>
              <Button onClick={() => handleSelectRecipe(recipe)}>{t("addToDay.addRecipe")}</Button>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {filteredProducts.map((product) => (
            <article key={product.fileName} className={styles.card}>
              <div className={styles.cardTitle}>{product.title}</div>
              <div className={styles.cardMeta}>
                {product.nutritionPerPortion?.caloriesKcal ?? "—"} {t("mealPlan.units.kcal")}
              </div>
              <Button onClick={() => handleSelectProduct(product)}>{t("addToDay.addProduct")}</Button>
            </article>
          ))}
        </div>
      )}

      <section className={styles.selectionPanel}>
        <div>
          <label>{t("recipe.add.date")}</label>
          <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
        </div>
        <div>
          <label>{t("recipe.add.section")}</label>
          <select value={targetSection} onChange={(event) => setTargetSection(event.target.value)}>
            <option value="breakfast">{t("mealTime.breakfast")}</option>
            <option value="lunch">{t("mealTime.lunch")}</option>
            <option value="dinner">{t("mealTime.dinner")}</option>
            <option value="snack">{t("mealTime.snack")}</option>
            <option value="flex">{t("mealTime.flex")}</option>
          </select>
        </div>

        <div className={styles.selectionList}>
          {selectedItems.map((item, index) => (
            <div key={`${item.kind}-${item.summary.fileName}`} className={styles.selectionItem}>
              <span className={styles.selectionTitle}>{item.summary.title}</span>
              {item.kind === "recipe" ? (
                <input
                  type="number"
                  min="1"
                  value={item.servings}
                  onChange={(event) =>
                    handleUpdateSelected(index, {
                      servings: Math.max(1, Number.parseInt(event.target.value, 10) || 1)
                    } as SelectedRecipe)
                  }
                />
              ) : (
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    handleUpdateSelected(index, {
                      quantity: Math.max(1, Number.parseFloat(event.target.value) || 1)
                    } as SelectedProduct)
                  }
                />
              )}
              <Button variant="ghost" onClick={() => handleRemoveSelected(index)}>
                {t("addToDay.remove")}
              </Button>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onNavigateBack}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleAddToDay} disabled={isSaving}>
            {t("addToDay.confirm")}
          </Button>
        </div>
      </section>
    </div>
  );
}
