import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/i18n/I18nProvider";
import { SELECT_RECIPE_FOR_PLAN_KEY, VIEW_RECIPE_STORAGE_KEY } from "@/constants/storage";
import { ensureDirectoryAccess, loadProductSummaries, type ProductSummary } from "@/utils/vaultProducts";
import {
  addProductToMealPlan,
  addRecipeToMealPlan,
  scaleNutritionTotals,
  type NutritionTotals
} from "@/utils/vaultDays";
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

type TranslateFn = ReturnType<typeof useTranslation>["t"];

type MacroDisplay = {
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

type AvailableRecipeItem = {
  kind: "recipe";
  id: string;
  title: string;
  description?: string;
  macros: MacroDisplay | null;
  summary: RecipeSummary;
};

type AvailableProductItem = {
  kind: "product";
  id: string;
  title: string;
  description?: string;
  macros: MacroDisplay | null;
  summary: ProductSummary;
};

type AvailableListItem = AvailableRecipeItem | AvailableProductItem;

type TabKey = "all" | "recipes" | "products";

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

function formatNumber(value: number | null | undefined, fractionDigits = 1): string {
  if (value === null || value === undefined) {
    return "—";
  }
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(numeric)) {
    return "—";
  }
  const fixed = numeric.toFixed(fractionDigits);
  if (fractionDigits > 0) {
    const trimmed = Number.parseFloat(fixed);
    if (Number.isFinite(trimmed)) {
      return trimmed.toString();
    }
  }
  return fixed;
}

function normalizeProductNutrition(
  macros: ProductSummary["nutritionPerPortion"] | null | undefined
): Partial<NutritionTotals> | null {
  if (!macros) {
    return null;
  }
  return {
    caloriesKcal: macros.caloriesKcal ?? undefined,
    proteinG: macros.proteinG ?? undefined,
    fatG: macros.fatG ?? undefined,
    carbsG: macros.carbsG ?? undefined,
    sugarG: macros.sugarG ?? undefined,
    fiberG: macros.fiberG ?? undefined
  };
}

function scaleProductMacros(product: ProductSummary, quantity: number): Partial<NutritionTotals> | null {
  const base = normalizeProductNutrition(product.nutritionPerPortion);
  if (!base) {
    return null;
  }
  const portion = product.portionGrams ?? null;
  const rawFactor = portion && portion > 0 ? quantity / portion : quantity || 1;
  const factor = Number.isFinite(rawFactor) && rawFactor > 0 ? rawFactor : 1;

  const scaleValue = (value: number | null | undefined): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }
    return Number.parseFloat((value * factor).toFixed(2));
  };

  return {
    caloriesKcal: scaleValue(base.caloriesKcal),
    proteinG: scaleValue(base.proteinG),
    fatG: scaleValue(base.fatG),
    carbsG: scaleValue(base.carbsG),
    sugarG: scaleValue(base.sugarG),
    fiberG: scaleValue(base.fiberG)
  };
}

function toMacroDisplay(macros: Partial<NutritionTotals> | null | undefined): MacroDisplay | null {
  const values: MacroDisplay = {
    calories: formatNumber(macros?.caloriesKcal ?? null, 0),
    protein: formatNumber(macros?.proteinG ?? null),
    fat: formatNumber(macros?.fatG ?? null),
    carbs: formatNumber(macros?.carbsG ?? null)
  };
  return Object.values(values).every((value) => value === "—") ? null : values;
}

function getProductPortionLabel(product: ProductSummary, translate: TranslateFn): string | null {
  const portion = product.portionGrams ?? null;
  const unit = product.portionUnit ?? (portion ? translate("units.grams") : null);
  if (portion && portion > 0 && unit) {
    const digits = Number.isInteger(portion) ? 0 : 1;
    const formatted = formatNumber(portion, digits);
    if (formatted !== "—") {
      return translate("addToDay.productPortion", { value: formatted, unit });
    }
  }

  if (!portion && product.portionUnit) {
    return translate("addToDay.productPortion", { value: "1", unit: product.portionUnit });
  }

  if (product.brand) {
    return product.brand;
  }

  if (product.modelLabel) {
    return product.modelLabel;
  }

  return null;
}

export function AddRecipeToDayScreen({ onNavigateBack, onNavigateToRecipe }: AddRecipeToDayScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
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

  const tabOptions = useMemo(
    () => [
      { key: "all" as TabKey, label: t("addToDay.tabAll") },
      { key: "recipes" as TabKey, label: t("addToDay.tabRecipes") },
      { key: "products" as TabKey, label: t("addToDay.tabProducts") }
    ],
    [t]
  );

  const recipeItems = useMemo<AvailableRecipeItem[]>(
    () =>
      filteredRecipes.map((recipe) => ({
        kind: "recipe",
        id: recipe.fileName,
        title: recipe.title,
        description: t("addToDay.recipeServings", { count: String(recipe.servings) }),
        macros: toMacroDisplay(recipe.nutritionPerServing),
        summary: recipe
      })),
    [filteredRecipes, t]
  );

  const productItems = useMemo<AvailableProductItem[]>(
    () =>
      filteredProducts.map((product) => ({
        kind: "product",
        id: product.fileName,
        title: product.title,
        description: getProductPortionLabel(product, t) ?? undefined,
        macros: toMacroDisplay(normalizeProductNutrition(product.nutritionPerPortion)),
        summary: product
      })),
    [filteredProducts, t]
  );

  const allItems = useMemo<AvailableListItem[]>(() => {
    const locale = t("mealPlan.locale");
    return [...recipeItems, ...productItems].sort((a, b) => a.title.localeCompare(b.title, locale));
  }, [productItems, recipeItems, t]);

  const visibleItems = useMemo(() => {
    if (activeTab === "recipes") {
      return recipeItems;
    }
    if (activeTab === "products") {
      return productItems;
    }
    return allItems;
  }, [activeTab, allItems, productItems, recipeItems]);

  const handleSelectRecipe = useCallback((recipe: RecipeSummary) => {
    setSelectedItems((current) => {
      const exists = current.some((item) => item.kind === "recipe" && item.summary.fileName === recipe.fileName);
      if (exists) {
        return current;
      }
      return [...current, { kind: "recipe", summary: recipe, servings: 1 }];
    });
  }, []);

  const handleViewRecipe = useCallback(
    (recipe: RecipeSummary) => {
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
      const unit = product.portionGrams ? t("mealPlan.units.grams") : t("units.portion");
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

  const handleClearSelection = useCallback(() => {
    setSelectedItems([]);
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
      setStatus({ type: "success", message: t("addToDay.status.success", { count: String(selectedItems.length) }) });
      setSelectedItems([]);
      onNavigateBack?.();
    } catch (error) {
      console.error("Failed to add selection", error);
      setStatus({ type: "error", message: t("addToDay.status.error") });
    } finally {
      setIsSaving(false);
    }
  }, [onNavigateBack, selectedItems, t, targetDate, targetSection, vaultHandle]);

  const hasSelection = selectedItems.length > 0;
  const selectionSubtitle = hasSelection
    ? t("addToDay.selectionCount", { count: String(selectedItems.length) })
    : t("addToDay.selectionHint");

  const renderMacroBadges = useCallback(
    (macros: MacroDisplay | null, variant: "default" | "compact" = "default") => {
      if (!macros) {
        return null;
      }
      const className =
        variant === "compact"
          ? `${styles.macroRow} ${styles.macroRowCompact}`
          : styles.macroRow;
      return (
        <div className={className}>
          <div className={styles.macroCell}>
            <span className={styles.macroValue}>{macros.calories}</span>
            <span className={styles.macroLabel}>{t("addToDay.macros.calories")}</span>
          </div>
          <div className={styles.macroCell}>
            <span className={styles.macroValue}>{macros.protein}</span>
            <span className={styles.macroLabel}>{t("addToDay.macros.protein")}</span>
          </div>
          <div className={styles.macroCell}>
            <span className={styles.macroValue}>{macros.fat}</span>
            <span className={styles.macroLabel}>{t("addToDay.macros.fat")}</span>
          </div>
          <div className={styles.macroCell}>
            <span className={styles.macroValue}>{macros.carbs}</span>
            <span className={styles.macroLabel}>{t("addToDay.macros.carbs")}</span>
          </div>
        </div>
      );
    },
    [t]
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t("addToDay.title")}</h1>
          <p className={styles.subtitle}>{t("addToDay.subtitle", { date: targetDate })}</p>
        </div>
        <Button variant="outlined" onClick={handleSelectVault}>
          {t("addToDay.changeVault")}
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <label className={styles.searchField}>
            <span className={styles.srOnly}>{t("addToDay.searchPlaceholder")}</span>
            <input
              className={styles.searchInput}
              placeholder={t("addToDay.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className={styles.tabList}>
            {tabOptions.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {status && <div className={styles.statusMessage}>{status.message}</div>}
      </div>

      <div className={styles.content}>
        <section className={styles.available}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t("addToDay.availableTitle")}</h2>
              <p className={styles.sectionSubtitle}>
                {t("addToDay.itemsCount", { count: String(visibleItems.length) })}
              </p>
            </div>
          </div>
          <div className={styles.list}>
            {visibleItems.length === 0 ? (
              <div className={styles.emptyState}>{t("addToDay.emptyResults")}</div>
            ) : (
              visibleItems.map((item) => {
                const badgeLabel = t(
                  item.kind === "recipe" ? "addToDay.badge.recipe" : "addToDay.badge.product"
                );
                return (
                  <article key={`${item.kind}-${item.id}`} className={styles.itemCard}>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span
                          className={`${styles.typeBadge} ${
                            item.kind === "recipe" ? styles.typeRecipe : styles.typeProduct
                          }`}
                        >
                          {badgeLabel}
                        </span>
                        {item.description && (
                          <span className={styles.itemDescription}>{item.description}</span>
                        )}
                      </div>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      {renderMacroBadges(item.macros)}
                    </div>
                    <div className={styles.itemActions}>
                      <Button
                        className={styles.addButton}
                        leadingIcon={<span className={styles.plusIcon}>+</span>}
                        onClick={() =>
                          item.kind === "recipe"
                            ? handleSelectRecipe(item.summary)
                            : handleSelectProduct(item.summary)
                        }
                      >
                        {t("addToDay.addButton")}
                      </Button>
                      {item.kind === "recipe" && (
                        <Button
                          variant="ghost"
                          className={styles.secondaryAction}
                          onClick={() => handleViewRecipe(item.summary)}
                        >
                          {t("addToDay.viewRecipe")}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className={styles.selectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{t("addToDay.selectionTitle")}</h2>
              <p className={styles.sectionSubtitle}>{selectionSubtitle}</p>
            </div>
            {hasSelection && (
              <button type="button" className={styles.clearSelection} onClick={handleClearSelection}>
                {t("addToDay.clearSelection")}
              </button>
            )}
          </div>

          <div className={styles.selectionControls}>
            <label className={styles.inputLabel}>
              {t("recipe.add.date")}
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
            <label className={styles.inputLabel}>
              {t("recipe.add.section")}
              <select value={targetSection} onChange={(event) => setTargetSection(event.target.value)}>
                <option value="breakfast">{t("mealTime.breakfast")}</option>
                <option value="lunch">{t("mealTime.lunch")}</option>
                <option value="dinner">{t("mealTime.dinner")}</option>
                <option value="snack">{t("mealTime.snack")}</option>
                <option value="flex">{t("mealTime.flex")}</option>
              </select>
            </label>
          </div>

          <div className={styles.selectionList}>
            {selectedItems.length === 0 ? (
              <p className={styles.selectionPlaceholder}>{t("addToDay.selectionEmpty")}</p>
            ) : (
              selectedItems.map((item, index) => {
                const macrosNode =
                  item.kind === "recipe"
                    ? renderMacroBadges(
                        toMacroDisplay(
                          scaleNutritionTotals(item.summary.nutritionPerServing, item.servings)
                        ),
                        "compact"
                      )
                    : renderMacroBadges(
                        toMacroDisplay(scaleProductMacros(item.summary, item.quantity)),
                        "compact"
                      );
                const quantityLabel =
                  item.kind === "recipe"
                    ? t("mealPlan.item.servingsLabel")
                    : t("mealPlan.item.quantityLabel");
                const unitLabel = item.kind === "recipe" ? t("addToDay.unitServings") : item.unit;

                return (
                  <div key={`${item.kind}-${item.summary.fileName}`} className={styles.selectionItem}>
                    <div className={styles.selectionInfo}>
                      <div className={styles.selectionTitleRow}>
                        <span className={styles.selectionTitle}>{item.summary.title}</span>
                        <span
                          className={`${styles.typeBadge} ${
                            item.kind === "recipe" ? styles.typeRecipe : styles.typeProduct
                          }`}
                        >
                          {t(item.kind === "recipe" ? "addToDay.badge.recipe" : "addToDay.badge.product")}
                        </span>
                      </div>
                      {macrosNode}
                    </div>
                    <div className={styles.selectionQuantity}>
                      <span className={styles.quantityLabel}>{quantityLabel}</span>
                      <div className={styles.quantityControl}>
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
                        <span className={styles.quantityUnit}>{unitLabel}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className={styles.removeButton}
                      onClick={() => handleRemoveSelected(index)}
                    >
                      {t("addToDay.remove")}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.selectionActions}>
            <Button variant="ghost" onClick={onNavigateBack}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddToDay} disabled={isSaving || !hasSelection}>
              {isSaving ? t("common.processing") : t("addToDay.confirm")}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
