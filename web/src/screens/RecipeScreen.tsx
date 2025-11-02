import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/Button";
import { CategorySelectModal } from "@/components/CategorySelectModal";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  EDIT_RECIPE_STORAGE_KEY,
  SELECT_RECIPE_FOR_PLAN_KEY,
  VIEW_RECIPE_STORAGE_KEY
} from "@/constants/storage";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { addRecipeToMealPlan, type NutritionTotals } from "@/utils/vaultDays";
import { addItemsToShoppingList } from "@/utils/vaultShopping";
import { loadRecipeDetail, type RecipeDetail } from "@/utils/vaultRecipes";
import { loadUserSettings } from "@/utils/vaultUser";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle
} from "@/utils/vaultStorage";
import { getImageFromVault } from "@/utils/vaultImages";
import styles from "./RecipeScreen.module.css";

type RecipeScreenProps = {
  onNavigateEdit?: () => void;
  onNavigateAddToDay?: () => void;
  onNavigateBackToPlan?: () => void;
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

function extractMacroValues(macros: NutritionTotals | null | undefined) {
  return {
    calories: formatNumber(macros?.caloriesKcal ?? null, 0),
    protein: formatNumber(macros?.proteinG ?? null),
    fat: formatNumber(macros?.fatG ?? null),
    carbs: formatNumber(macros?.carbsG ?? null)
  };
}

type StatusState =
  | {
    type: "info" | "success" | "error";
    message: string;
  }
  | null;

export function RecipeScreen({ onNavigateEdit, onNavigateAddToDay, onNavigateBackToPlan }: RecipeScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAddingToShopping, setIsAddingToShopping] = useState<boolean>(false);
  const [servingsToAdd, setServingsToAdd] = useState<number>(1);
  const [targetSection, setTargetSection] = useState<string>("flex");
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeDetail["ingredients"][number] | null>(null);

  const loadRecipe = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle || typeof window === "undefined") {
        return;
      }
      const raw = window.sessionStorage.getItem(VIEW_RECIPE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      try {
        const payload = JSON.parse(raw) as { fileName: string };
        if (!payload?.fileName) {
          return;
        }
        setIsLoading(true);
        const [detail, settings] = await Promise.all([
          loadRecipeDetail(handle, payload.fileName),
          loadUserSettings(handle)
        ]);
        setRecipe(detail);
        setCategories(settings.shopping.categories || []);
        
        // Load image if it exists and is a vault path
        if (detail.photoUrl && detail.photoUrl.startsWith('images/')) {
          const imageUrl = await getImageFromVault(handle, detail.photoUrl);
          setImageUrl(imageUrl);
        } else if (detail.photoUrl) {
          // Legacy base64 or external URL
          setImageUrl(detail.photoUrl);
        }
      } catch (error) {
        console.error("Failed to load recipe detail", error);
        setStatus({ type: "error", message: t("recipe.status.loadError") });
      } finally {
        setIsLoading(false);
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
          await loadRecipe(handle);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
        setStatus({ type: "error", message: t("recipe.status.restoreError") });
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadRecipe, t]);

  const handleEdit = useCallback(() => {
    if (typeof window !== "undefined" && recipe) {
      window.sessionStorage.setItem(
        EDIT_RECIPE_STORAGE_KEY,
        JSON.stringify({ fileName: recipe.fileName, slug: recipe.slug })
      );
    }
    onNavigateEdit?.();
  }, [onNavigateEdit, recipe]);

  const handleAddToPlan = useCallback(async () => {
    if (!vaultHandle || !recipe) {
      setStatus({ type: "error", message: t("recipe.status.noVault") });
      return;
    }
    try {
      await addRecipeToMealPlan(vaultHandle, targetDate, recipe, {
        sectionId: targetSection,
        sectionName: undefined,
        servings: servingsToAdd
      });
      setStatus({ type: "success", message: t("recipe.status.added", { date: targetDate }) });
      onNavigateBackToPlan?.();
    } catch (error) {
      console.error("Failed to add recipe to plan", error);
      setStatus({ type: "error", message: t("recipe.status.addError") });
    }
  }, [onNavigateBackToPlan, recipe, servingsToAdd, t, targetDate, targetSection, vaultHandle]);

  const handleOpenAddToDay = useCallback(() => {
    if (typeof window !== "undefined" && recipe) {
      window.sessionStorage.setItem(
        SELECT_RECIPE_FOR_PLAN_KEY,
        JSON.stringify({ fileName: recipe.fileName, date: targetDate })
      );
    }
    onNavigateAddToDay?.();
  }, [onNavigateAddToDay, recipe, targetDate]);

  const handleAddIngredientToShopping = useCallback(
    (ingredient: RecipeDetail["ingredients"][number]) => {
      if (!vaultHandle || !recipe) {
        setStatus({ type: "error", message: t("recipe.status.noVault") });
        return;
      }
      const title = ingredient.title?.trim();
      if (!title) {
        setStatus({ type: "info", message: t("recipe.status.noIngredients") });
        return;
      }
      
      // Show category selection modal
      setSelectedIngredient(ingredient);
      setShowCategoryModal(true);
    },
    [recipe, t, vaultHandle]
  );

  const handleAddIngredientWithCategory = useCallback(
    async (categoryId: string | null) => {
      if (!vaultHandle || !recipe || !selectedIngredient) {
        return;
      }
      
      const title = selectedIngredient.title?.trim();
      if (!title) {
        return;
      }
      
      setIsAddingToShopping(true);
      try {
        await addItemsToShoppingList(vaultHandle, [
          {
            id: crypto.randomUUID(),
            title,
            quantity: selectedIngredient.quantity && selectedIngredient.quantity > 0 ? selectedIngredient.quantity : null,
            unit: selectedIngredient.unit || null,
            category: categoryId,
            completed: false,
            source: {
              kind: "recipe" as const,
              recipeSlug: recipe.slug,
              recipeTitle: recipe.title,
              ingredientId: selectedIngredient.id
            }
          }
        ]);
        setStatus({ type: "success", message: t("recipe.status.ingredientAdded", { title }) });
      } catch (error) {
        console.error("Failed to add ingredient to shopping list", error);
        setStatus({ type: "error", message: t("recipe.status.shoppingError") });
      } finally {
        setIsAddingToShopping(false);
        setSelectedIngredient(null);
      }
    },
    [recipe, t, vaultHandle, selectedIngredient]
  );

  const handleAddToShopping = useCallback(async () => {
    if (!vaultHandle || !recipe) {
      setStatus({ type: "error", message: t("recipe.status.noVault") });
      return;
    }
    if (recipe.ingredients.length === 0) {
      setStatus({ type: "info", message: t("recipe.status.noIngredients") });
      return;
    }
    
    // For bulk add, we'll add all ingredients without category for now
    // User can organize them later in the shopping list
    const items = recipe.ingredients.map((ingredient) => {
      const quantity = Number.isFinite(ingredient.quantity) ? ingredient.quantity : null;
      return {
        id: crypto.randomUUID(),
        title: ingredient.title,
        quantity: quantity && quantity > 0 ? quantity : null,
        unit: ingredient.unit || null,
        category: null, // No category for bulk add
        completed: false,
        source: {
          kind: "recipe" as const,
          recipeSlug: recipe.slug,
          recipeTitle: recipe.title,
          ingredientId: ingredient.id
        }
      };
    });
    const nonEmpty = items.filter((item) => item.title && item.title.trim().length > 0);
    if (nonEmpty.length === 0) {
      setStatus({ type: "info", message: t("recipe.status.noIngredients") });
      return;
    }
    setIsAddingToShopping(true);
    try {
      await addItemsToShoppingList(vaultHandle, nonEmpty);
      setStatus({ type: "success", message: t("recipe.status.shoppingAdded") });
    } catch (error) {
      console.error("Failed to add ingredients to shopping list", error);
      setStatus({ type: "error", message: t("recipe.status.shoppingError") });
    } finally {
      setIsAddingToShopping(false);
    }
  }, [recipe, t, vaultHandle]);



  const toggleIngredientCheck = useCallback((ingredientId: string) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  }, []);

  const getNutritionPercentages = useCallback(() => {
    if (!recipe?.nutritionPerServing) return null;

    const { proteinG = 0, fatG = 0, carbsG = 0 } = recipe.nutritionPerServing;
    const total = proteinG + fatG + carbsG;

    if (total === 0) return null;

    return {
      protein: Math.round((proteinG / total) * 100),
      fat: Math.round((fatG / total) * 100),
      carbs: Math.round((carbsG / total) * 100)
    };
  }, [recipe]);

  const macrosPerServing = recipe?.nutritionPerServing;
  const totals = recipe?.nutritionTotal;
  const nutritionPercentages = getNutritionPercentages();

  return (
    <div className={styles.root}>
      {/* Hero Image Section */}
      <div className={styles.heroSection}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={recipe?.title || t("recipe.title")}
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroImagePlaceholder}>
            <div className={styles.uploadIcon}>🍽️</div>
          </div>
        )}

        <div className={styles.heroContent}>
          <div className={styles.recipeTag}>
            {recipe?.tags?.[0] || t("recipe.defaultTag")}
          </div>
          <button className={styles.closeButton} onClick={() => window.history.back()}>
            ✕
          </button>
        </div>

        <div className={styles.heroTitle}>
          <h1>{recipe?.title ?? t("recipe.title")}</h1>
        </div>
      </div>

      {status && <div className={styles.statusMessage}>{status.message}</div>}
      {isLoading && <div className={styles.statusMessage}>{t("recipe.loading")}</div>}

      {recipe && (
        <>
          {/* Nutrition Summary */}
          <section className={styles.nutritionCard}>
            <div className={styles.servingInfo}>
              <span className={styles.servingLabel}>1 {t("recipe.serving")}</span>
            </div>

            <div className={styles.nutritionChart}>
              <div className={styles.calorieCenter}>
                <div className={styles.calorieNumber}>
                  {macrosPerServing?.caloriesKcal?.toFixed(0) ?? "—"}
                </div>
                <div className={styles.calorieLabel}>{t("mealPlan.units.kcal")}</div>
              </div>

              {nutritionPercentages && (
                <svg className={styles.nutritionRing} viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#4ECDC4"
                    strokeWidth="8"
                    strokeDasharray={`${nutritionPercentages.carbs * 2.51} 251.2`}
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
                    strokeDasharray={`${nutritionPercentages.fat * 2.51} 251.2`}
                    strokeDashoffset={`-${nutritionPercentages.carbs * 2.51}`}
                    transform="rotate(-90 50 50)"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#FFA726"
                    strokeWidth="8"
                    strokeDasharray={`${nutritionPercentages.protein * 2.51} 251.2`}
                    strokeDashoffset={`-${(nutritionPercentages.carbs + nutritionPercentages.fat) * 2.51}`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              )}
            </div>

            <div className={styles.macroBreakdown}>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{nutritionPercentages?.carbs ?? 0}%</span>
                <span className={styles.macroAmount}>{macrosPerServing?.carbsG?.toFixed(1) ?? "—"} г</span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.carbs")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{nutritionPercentages?.fat ?? 0}%</span>
                <span className={styles.macroAmount}>{macrosPerServing?.fatG?.toFixed(1) ?? "—"} г</span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.fat")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroPercent}>{nutritionPercentages?.protein ?? 0}%</span>
                <span className={styles.macroAmount}>{macrosPerServing?.proteinG?.toFixed(1) ?? "—"} г</span>
                <span className={styles.macroLabel}>{t("mealPlan.totals.protein")}</span>
              </div>
            </div>

            <div className={styles.recipeMetadata}>
              {(recipe as any).cookTimeMinutes && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataIcon}>⏱</span>
                  <span>{(recipe as any).cookTimeMinutes} {t("recipe.minutes")}</span>
                </div>
              )}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataIcon}>🏷️</span>
                  <span>{recipe.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </section>

          {/* Ingredients Section */}
          <section className={styles.ingredientsCard}>
            <h2 className={styles.sectionTitle}>{t("recipe.ingredients")}</h2>
            <div className={styles.ingredientSubtitle}>{t("recipe.mainList")}</div>

            <div className={styles.ingredientList}>
              {recipe.ingredients.map((ingredient, index) => {
                const macros = extractMacroValues(ingredient.totals);
                const hasNutrition = Object.values(macros).some((value) => value !== "—");

                return (
                  <div key={ingredient.id ?? index} className={styles.ingredientItem}>
                    <label className={styles.ingredientCheckbox}>
                      <input
                        type="checkbox"
                        checked={checkedIngredients.has(ingredient.id)}
                        onChange={() => toggleIngredientCheck(ingredient.id)}
                      />
                      <span className={styles.checkmark}></span>
                    </label>
                    <div className={styles.ingredientContent}>
                      <span
                        className={`${styles.ingredientTitle} ${checkedIngredients.has(ingredient.id) ? styles.checked : ""}`}
                      >
                        {ingredient.title}
                      </span>
                      <div className={styles.ingredientMeta}>
                        <span className={styles.ingredientAmount}>
                          {`${formatNumber(ingredient.quantity)}${ingredient.unit ? ` ${ingredient.unit}` : ""}`}
                        </span>
                        {hasNutrition && (
                          <div className={styles.ingredientNutrition}>
                            <span className={styles.macroChip}>
                              {macros.calories} {t("mealPlan.units.kcal")}
                            </span>
                            <span className={styles.macroChip}>
                              {t("mealPlan.totals.protein")} {macros.protein} {t("addProduct.form.nutrients.macrosUnit")}
                            </span>
                            <span className={styles.macroChip}>
                              {t("mealPlan.totals.fat")} {macros.fat} {t("addProduct.form.nutrients.macrosUnit")}
                            </span>
                            <span className={styles.macroChip}>
                              {t("mealPlan.totals.carbs")} {macros.carbs} {t("addProduct.form.nutrients.macrosUnit")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.addIngredientButton}
                      onClick={() => handleAddIngredientToShopping(ingredient)}
                      disabled={isAddingToShopping}
                      title={t("recipe.ingredient.addToShopping")}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Instructions Section */}
          {recipe.stepsMarkdown && (
            <section className={styles.instructionsCard}>
              <h2 className={styles.sectionTitle}>{t("recipe.instructions")}</h2>
              <div className={styles.instructionsContent}>
                {recipe.stepsMarkdown.split('\n').map((step, index) => (
                  step.trim() && (
                    <div key={index} className={styles.instructionStep}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepText}>{step.trim()}</span>
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button variant="outlined" onClick={handleAddToShopping} disabled={!recipe || isAddingToShopping}>
              {t("recipe.addToShopping")}
            </Button>
            <Button variant="outlined" onClick={handleOpenAddToDay} disabled={!recipe || isAddingToShopping}>
              {t("recipe.addToDay")}
            </Button>
            <Button variant="ghost" onClick={handleEdit} disabled={!recipe}>
              {t("recipe.edit")}
            </Button>
          </div>
        </>
      )}

      <CategorySelectModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedIngredient(null);
        }}
        onSelect={handleAddIngredientWithCategory}
        categories={categories}
        itemName={selectedIngredient?.title || ""}
        isLoading={isAddingToShopping}
      />
    </div>
  );
}
