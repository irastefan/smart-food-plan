import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  EDIT_RECIPE_STORAGE_KEY,
  SELECT_RECIPE_FOR_PLAN_KEY,
  VIEW_RECIPE_STORAGE_KEY
} from "@/constants/storage";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { addRecipeToMealPlan } from "@/utils/vaultDays";
import { addItemsToShoppingList } from "@/utils/vaultShopping";
import { loadRecipeDetail, type RecipeDetail } from "@/utils/vaultRecipes";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./RecipeScreen.module.css";

type RecipeScreenProps = {
  onNavigateEdit?: () => void;
  onNavigateAddToDay?: () => void;
  onNavigateBackToPlan?: () => void;
};

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
        const detail = await loadRecipeDetail(handle, payload.fileName);
        setRecipe(detail);
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

  const macrosPerServing = recipe?.nutritionPerServing;
  const totals = recipe?.nutritionTotal;

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
    async (ingredient: RecipeDetail["ingredients"][number]) => {
      if (!vaultHandle || !recipe) {
        setStatus({ type: "error", message: t("recipe.status.noVault") });
        return;
      }
      const title = ingredient.title?.trim();
      if (!title) {
        setStatus({ type: "info", message: t("recipe.status.noIngredients") });
        return;
      }
      setIsAddingToShopping(true);
      try {
        await addItemsToShoppingList(vaultHandle, [
          {
            id: crypto.randomUUID(),
            title,
            quantity: ingredient.quantity && ingredient.quantity > 0 ? ingredient.quantity : null,
            unit: ingredient.unit || null,
            completed: false,
            source: {
              kind: "recipe" as const,
              recipeSlug: recipe.slug,
              recipeTitle: recipe.title,
              ingredientId: ingredient.id
            }
          }
        ]);
        setStatus({ type: "success", message: t("recipe.status.ingredientAdded", { title }) });
      } catch (error) {
        console.error("Failed to add ingredient to shopping list", error);
        setStatus({ type: "error", message: t("recipe.status.shoppingError") });
      } finally {
        setIsAddingToShopping(false);
      }
    },
    [recipe, t, vaultHandle]
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
    const items = recipe.ingredients.map((ingredient) => {
      const quantity = Number.isFinite(ingredient.quantity) ? ingredient.quantity : null;
      return {
        id: crypto.randomUUID(),
        title: ingredient.title,
        quantity: quantity && quantity > 0 ? quantity : null,
        unit: ingredient.unit || null,
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

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{recipe?.title ?? t("recipe.title")}</h1>
        <div className={styles.actions}>
          <Button variant="outlined" onClick={handleOpenAddToDay} disabled={!recipe || isAddingToShopping}>
            {t("recipe.addToDay")}
          </Button>
          <Button variant="outlined" onClick={handleAddToShopping} disabled={!recipe || isAddingToShopping}>
            {t("recipe.addToShopping")}
          </Button>
          <Button variant="ghost" onClick={handleAddToPlan} disabled={!recipe}>
            {t("recipe.quickAdd")}
          </Button>
          <Button variant="ghost" onClick={handleEdit} disabled={!recipe}>
            {t("recipe.edit")}
          </Button>
        </div>
      </header>

      {status && <div className={styles.statusMessage}>{status.message}</div>}
      {isLoading && <div className={styles.statusMessage}>{t("recipe.loading")}</div>}

      {recipe && (
        <>
          <section className={styles.summaryCard}>
            <div className={styles.macrosRow}>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("recipes.perServingLabel")}</span>
                <span className={styles.macroValue}>{macrosPerServing?.caloriesKcal?.toFixed(0) ?? "—"} {t("mealPlan.units.kcal")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.protein")}</span>
                <span className={styles.macroValue}>{macrosPerServing?.proteinG?.toFixed(1) ?? "—"}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.fat")}</span>
                <span className={styles.macroValue}>{macrosPerServing?.fatG?.toFixed(1) ?? "—"}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("mealPlan.totals.carbs")}</span>
                <span className={styles.macroValue}>{macrosPerServing?.carbsG?.toFixed(1) ?? "—"}</span>
              </div>
            </div>
            <div className={styles.macrosRow}>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("recipes.totalNutrition")}</span>
                <span className={styles.macroValue}>{totals?.caloriesKcal?.toFixed(0) ?? "—"} {t("mealPlan.units.kcal")}</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>{t("recipes.totalServings")}</span>
                <span className={styles.macroValue}>{recipe.servings}</span>
              </div>
            </div>
            <div className={styles.macrosRow}>
              <div className={styles.macroItem}>
                <label>{t("recipe.add.servings")}</label>
                <input
                  type="number"
                  min="1"
                  value={servingsToAdd}
                  onChange={(event) => setServingsToAdd(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                />
              </div>
              <div className={styles.macroItem}>
                <label>{t("recipe.add.date")}</label>
                <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </div>
              <div className={styles.macroItem}>
                <label>{t("recipe.add.section")}</label>
                <select value={targetSection} onChange={(event) => setTargetSection(event.target.value)}>
                  <option value="breakfast">{t("mealTime.breakfast")}</option>
                  <option value="lunch">{t("mealTime.lunch")}</option>
                  <option value="dinner">{t("mealTime.dinner")}</option>
                  <option value="snack">{t("mealTime.snack")}</option>
                  <option value="flex">{t("mealTime.flex")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.ingredientsCard}>
            <h2 className={styles.sectionTitle}>{t("recipe.ingredients")}</h2>
            <div className={styles.ingredientList}>
              {recipe.ingredients.map((ingredient, index) => (
                <div key={ingredient.id ?? index} className={styles.ingredientItem}>
                  <div className={styles.ingredientContent}>
                    <span>{ingredient.title}</span>
                    <span className={styles.ingredientMeta}>
                      {ingredient.quantity} {ingredient.unit}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleAddIngredientToShopping(ingredient)}
                    disabled={isAddingToShopping}
                  >
                    {t("recipe.ingredient.addToShopping")}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.stepsCard}>
            <h2 className={styles.sectionTitle}>{t("recipe.steps")}</h2>
            <div className={styles.stepsContent}>{recipe.stepsMarkdown}</div>
          </section>
        </>
      )}
    </div>
  );
}
