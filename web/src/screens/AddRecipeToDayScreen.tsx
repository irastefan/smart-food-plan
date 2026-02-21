import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { NutritionSummary, type NutritionSummaryMetric } from "@/components/NutritionSummary";
import { useTranslation } from "@/i18n/I18nProvider";
import { SELECT_RECIPE_FOR_PLAN_KEY, VIEW_RECIPE_STORAGE_KEY } from "@/constants/storage";
import { ensureDirectoryAccess, loadProductSummaries, type ProductSummary } from "@/utils/vaultProducts";
import {
  addProductToMealPlan,
  addRecipeToMealPlan,
  type NutritionTotals
} from "@/utils/vaultDays";
import { loadRecipeSummaries, type RecipeSummary } from "@/utils/vaultRecipes";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle
} from "@/utils/vaultStorage";
import type { TranslationKey } from "@/i18n/messages";
import styles from "./AddRecipeToDayScreen.module.css";

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

function toMacroDisplay(macros: Partial<NutritionTotals> | null | undefined): MacroDisplay | null {
  const values: MacroDisplay = {
    calories: formatNumber(macros?.caloriesKcal ?? null, 0),
    protein: formatNumber(macros?.proteinG ?? null),
    fat: formatNumber(macros?.fatG ?? null),
    carbs: formatNumber(macros?.carbsG ?? null)
  };
  return Object.values(values).every((value) => value === "—") ? null : values;
}

function getProductPortionLabel(product: ProductSummary, t: ReturnType<typeof useTranslation>["t"]): string | null {
  const portion = product.portionGrams ?? null;
  if (portion && portion > 0) {
    return t("addToDay.productPortion", { value: String(portion), unit: t("units.grams") });
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
  const [status, setStatus] = useState<StatusState>(null);
  const [targetSection, setTargetSection] = useState<string>("breakfast");
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [addingItemId, setAddingItemId] = useState<string | null>(null);

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
        const [recipeList, productList] = await Promise.all([
          loadRecipeSummaries(handle),
          loadProductSummaries(handle)
        ]);
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

  const selectedMealLabel = useMemo(() => {
    const key = `mealTime.${targetSection}` as TranslationKey;
    const label = t(key);
    return label.startsWith("mealTime.") ? targetSection : label;
  }, [targetSection, t]);

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

  const handleQuickAdd = useCallback(
    async (item: AvailableListItem) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("addToDay.status.error") });
        return;
      }

      setAddingItemId(`${item.kind}-${item.id}`);
      try {
        if (item.kind === "recipe") {
          await addRecipeToMealPlan(vaultHandle, targetDate, item.summary, {
            sectionId: targetSection,
            servings: 1
          });
        } else {
          await addProductToMealPlan(vaultHandle, targetDate, item.summary, {
            sectionId: targetSection,
            quantity: item.summary.portionGrams && item.summary.portionGrams > 0 ? item.summary.portionGrams : 100,
            unit: "g"
          });
        }

        setStatus({ type: "success", message: t("mealPlan.status.added", { title: item.title, section: selectedMealLabel }) });
      } catch (error) {
        console.error("Failed to quick add item", error);
        setStatus({ type: "error", message: t("addToDay.status.error") });
      } finally {
        setAddingItemId(null);
      }
    },
    [selectedMealLabel, t, targetDate, targetSection, vaultHandle]
  );

  const renderMacroBadges = useCallback(
    (macros: MacroDisplay | null) => {
      if (!macros) {
        return null;
      }

      const parse = (value: string): number | null => {
        if (!value || value === "—") {
          return null;
        }
        const parsed = Number.parseFloat(value.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
      };

      const metrics: NutritionSummaryMetric[] = [
        {
          key: "calories",
          label: t("addToDay.macros.calories"),
          value: parse(macros.calories),
          unit: t("mealPlan.units.kcal"),
          precision: 0
        },
        {
          key: "protein",
          label: t("addToDay.macros.protein"),
          value: parse(macros.protein),
          unit: t("addProduct.form.nutrients.macrosUnit")
        },
        {
          key: "fat",
          label: t("addToDay.macros.fat"),
          value: parse(macros.fat),
          unit: t("addProduct.form.nutrients.macrosUnit")
        },
        {
          key: "carbs",
          label: t("addToDay.macros.carbs"),
          value: parse(macros.carbs),
          unit: t("addProduct.form.nutrients.macrosUnit")
        }
      ];

      return <NutritionSummary metrics={metrics} variant="inline" className={styles.macroRow} />;
    },
    [t]
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t("addToDay.title")}</h1>
          <p className={styles.subtitle}>
            {t("addToDay.subtitle", { date: targetDate })} · {selectedMealLabel}
          </p>
        </div>
        <Button variant="ghost" onClick={onNavigateBack}>{t("common.cancel")}</Button>
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
                const itemKey = `${item.kind}-${item.id}`;
                const isAdding = addingItemId === itemKey;
                const badgeLabel = t(
                  item.kind === "recipe" ? "addToDay.badge.recipe" : "addToDay.badge.product"
                );

                return (
                  <article key={itemKey} className={styles.itemCard}>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span
                          className={`${styles.typeBadge} ${
                            item.kind === "recipe" ? styles.typeRecipe : styles.typeProduct
                          }`}
                        >
                          {badgeLabel}
                        </span>
                        {item.description && <span className={styles.itemDescription}>{item.description}</span>}
                      </div>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      {renderMacroBadges(item.macros)}
                    </div>
                    <div className={styles.itemActions}>
                      <Button
                        className={styles.addButton}
                        leadingIcon={<span className={styles.plusIcon}>+</span>}
                        onClick={() => void handleQuickAdd(item)}
                        disabled={Boolean(addingItemId)}
                      >
                        {isAdding ? t("common.processing") : t("addToDay.addButton")}
                      </Button>
                      {item.kind === "recipe" && (
                        <Button
                          variant="ghost"
                          className={styles.secondaryAction}
                          onClick={() => handleViewRecipe(item.summary)}
                          disabled={Boolean(addingItemId)}
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
      </div>
    </div>
  );
}
