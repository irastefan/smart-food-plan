import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ActionIconButton } from "@/components/ActionIconButton";
import { useTranslation } from "@/i18n/I18nProvider";
import { EDIT_RECIPE_STORAGE_KEY, VIEW_RECIPE_STORAGE_KEY } from "@/constants/storage";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import {
  deleteRecipe,
  loadRecipeSummaries,
  type RecipeSummary
} from "@/utils/vaultRecipes";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import { getImageFromVault } from "@/utils/vaultImages";
import styles from "./RecipesListScreen.module.css";

type RecipesListScreenProps = {
  onNavigateAddRecipe?: () => void;
  onNavigateViewRecipe?: () => void;
};

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

export function RecipesListScreen({ onNavigateAddRecipe, onNavigateViewRecipe }: RecipesListScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusState>(null);
  const [search, setSearch] = useState<string>("");
  const [recipeImages, setRecipeImages] = useState<Map<string, string>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "calories" | "recent">("recent");

  const refreshRecipes = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setRecipes([]);
        setRecipeImages(new Map());
        return;
      }
      try {
        setIsLoading(true);
        const list = await loadRecipeSummaries(handle);
        setRecipes(list);
        
        // Load images for recipes that have them
        const imageMap = new Map<string, string>();
        for (const recipe of list) {
          if (recipe.photoUrl && recipe.photoUrl.startsWith('images/')) {
            try {
              const imageUrl = await getImageFromVault(handle, recipe.photoUrl);
              if (imageUrl) {
                imageMap.set(recipe.fileName, imageUrl);
              }
            } catch (error) {
              console.error(`Failed to load image for recipe ${recipe.title}:`, error);
            }
          } else if (recipe.photoUrl) {
            // Legacy base64 or external URL
            imageMap.set(recipe.fileName, recipe.photoUrl);
          }
        }
        setRecipeImages(imageMap);
      } catch (error) {
        console.error("Failed to load recipes", error);
        setStatus({ type: "error", message: t("recipes.status.loadError") });
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
          void refreshRecipes(handle);
          setStatus({ type: "success", message: t("recipes.status.connected", { folder: handle.name }) });
        }
      } catch (error) {
        console.error("Failed to restore handle", error);
        setStatus({ type: "error", message: t("recipes.status.restoreError") });
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [refreshRecipes, t]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("recipes.status.browserUnsupported") });
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("recipes.status.permissionError") });
        return;
      }

      setVaultHandle(handle);
      setStatus({ type: "success", message: t("recipes.status.connected", { folder: handle.name }) });

      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }

      void refreshRecipes(handle);
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("recipes.status.genericError") });
    }
  }, [refreshRecipes, t]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;
    
    // Filter by search query
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      filtered = filtered.filter((recipe) => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((recipe) => 
        recipe.tags?.includes(selectedCategory)
      );
    }
    
    // Sort recipes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "calories":
          return (b.nutritionPerServing.caloriesKcal ?? 0) - (a.nutritionPerServing.caloriesKcal ?? 0);
        case "recent":
        default:
          return (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || "");
      }
    });
    
    return filtered;
  }, [recipes, search, selectedCategory, sortBy]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => categories.add(tag));
    });
    return Array.from(categories).sort();
  }, [recipes]);

  const handleViewRecipe = useCallback(
    (recipe: RecipeSummary) => {
      if (typeof window === "undefined") {
        return;
      }
      window.sessionStorage.setItem(
        VIEW_RECIPE_STORAGE_KEY,
        JSON.stringify({ fileName: recipe.fileName, slug: recipe.slug })
      );
      onNavigateViewRecipe?.();
    },
    [onNavigateViewRecipe]
  );

  const handleEditRecipe = useCallback(
    (recipe: RecipeSummary) => {
      if (typeof window === "undefined") {
        return;
      }
      window.sessionStorage.setItem(
        EDIT_RECIPE_STORAGE_KEY,
        JSON.stringify({ fileName: recipe.fileName, slug: recipe.slug })
      );
      onNavigateAddRecipe?.();
    },
    [onNavigateAddRecipe]
  );

  const handleDeleteRecipe = useCallback(
    async (recipe: RecipeSummary) => {
      if (!vaultHandle) {
        setStatus({ type: "error", message: t("recipes.status.noVault") });
        return;
      }
      const confirmed = window.confirm(t("recipes.deleteConfirm", { title: recipe.title }));
      if (!confirmed) {
        return;
      }
      try {
        await deleteRecipe(vaultHandle, recipe.fileName);
        setStatus({ type: "success", message: t("recipes.status.deleted") });
        await refreshRecipes(vaultHandle);
      } catch (error) {
        console.error("Failed to delete recipe", error);
        setStatus({ type: "error", message: t("recipes.status.deleteError") });
      }
    },
    [refreshRecipes, t, vaultHandle]
  );

  const getNutritionPercentages = useCallback((recipe: RecipeSummary) => {
    const { proteinG = 0, fatG = 0, carbsG = 0 } = recipe.nutritionPerServing;
    const total = proteinG + fatG + carbsG;
    
    if (total === 0) return null;
    
    return {
      protein: Math.round((proteinG / total) * 100),
      fat: Math.round((fatG / total) * 100),
      carbs: Math.round((carbsG / total) * 100)
    };
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <div>{t("recipes.status.loading")}</div>
        </div>
      );
    }
    if (!filteredRecipes.length) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍽️</div>
          <h3>{search ? t("recipes.noSearchResults") : t("recipes.empty")}</h3>
          <p>{search ? t("recipes.tryDifferentSearch") : t("recipes.emptyDescription")}</p>
          {!search && (
            <Button onClick={onNavigateAddRecipe}>
              {t("recipes.createFirst")}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className={styles.listGrid}>
        {filteredRecipes.map((recipe) => {
          const calories = recipe.nutritionPerServing.caloriesKcal ?? 0;
          const nutritionPercentages = getNutritionPercentages(recipe);
          const imageUrl = recipeImages.get(recipe.fileName);
          
          return (
            <article key={recipe.fileName} className={styles.card} onClick={() => handleViewRecipe(recipe)}>
              <div className={styles.cardImage}>
                {imageUrl ? (
                  <img src={imageUrl} alt={recipe.title} className={styles.recipeImage} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <div className={styles.placeholderIcon}>🍽️</div>
                  </div>
                )}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className={styles.recipeTag}>
                    {recipe.tags[0]}
                  </div>
                )}
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{recipe.title}</h2>
                  {recipe.description && (
                    <p className={styles.cardDescription}>{recipe.description}</p>
                  )}
                </div>
                
                <div className={styles.nutritionSummary}>
                  <div className={styles.caloriesBadge}>
                    <span className={styles.caloriesNumber}>{calories.toFixed(0)}</span>
                    <span className={styles.caloriesLabel}>{t("mealPlan.units.kcal")}</span>
                  </div>
                  
                  {nutritionPercentages && (
                    <div className={styles.macroIndicators}>
                      <div className={styles.macroBar}>
                        <div 
                          className={styles.macroSegment} 
                          style={{ 
                            width: `${nutritionPercentages.carbs}%`, 
                            backgroundColor: '#4ECDC4' 
                          }}
                        />
                        <div 
                          className={styles.macroSegment} 
                          style={{ 
                            width: `${nutritionPercentages.fat}%`, 
                            backgroundColor: '#45B7D1' 
                          }}
                        />
                        <div 
                          className={styles.macroSegment} 
                          style={{ 
                            width: `${nutritionPercentages.protein}%`, 
                            backgroundColor: '#FFA726' 
                          }}
                        />
                      </div>
                      <div className={styles.macroLabels}>
                        <span style={{ color: '#4ECDC4' }}>
                          {recipe.nutritionPerServing.carbsG?.toFixed(1) ?? "0"}г {t("recipe.macros.carbs")}
                        </span>
                        <span style={{ color: '#45B7D1' }}>
                          {recipe.nutritionPerServing.fatG?.toFixed(1) ?? "0"}г {t("recipe.macros.fat")}
                        </span>
                        <span style={{ color: '#FFA726' }}>
                          {recipe.nutritionPerServing.proteinG?.toFixed(1) ?? "0"}г {t("recipe.macros.protein")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>👥</span>
                    <span>{recipe.servings} {t("recipe.serving")}</span>
                  </div>
                  {(recipe as any).cookTimeMinutes && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaIcon}>⏱</span>
                      <span>{(recipe as any).cookTimeMinutes} {t("recipe.minutes")}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardActions}>
                  <ActionIconButton
                    action="edit"
                    label={t("recipes.edit")}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditRecipe(recipe);
                    }}
                  />
                  <ActionIconButton
                    action="delete"
                    label={t("recipes.delete")}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteRecipe(recipe);
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t("recipes.title")}</h1>
          <p className={styles.subtitle}>
            {recipes.length > 0 
              ? `${recipes.length} ${t("recipes.count")}`
              : t("recipes.subtitle")
            }
          </p>
        </div>
        <div className={styles.headerActions}>
          <select 
            className={styles.sortSelect}
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as "name" | "calories" | "recent")}
          >
            <option value="recent">{t("recipes.sort.recent")}</option>
            <option value="name">{t("recipes.sort.name")}</option>
            <option value="calories">{t("recipes.sort.calories")}</option>
          </select>
          <Button variant="outlined" onClick={handleSelectVault}>
            {vaultHandle ? t("recipes.changeVault") : t("recipes.chooseVault")}
          </Button>
          <Button onClick={onNavigateAddRecipe}>{t("recipes.add")}</Button>
        </div>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchIcon}>🔍</div>
          <input
            className={styles.searchInput}
            type="search"
            value={search}
            placeholder={t("recipes.searchPlaceholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {availableCategories.length > 0 && (
          <div className={styles.categoryFilters}>
            <button
              className={`${styles.categoryButton} ${!selectedCategory ? styles.active : ''}`}
              onClick={() => setSelectedCategory("")}
            >
              {t("recipes.allCategories")}
            </button>
            {availableCategories.map(category => (
              <button
                key={category}
                className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        {(search || selectedCategory) && (
          <div className={styles.searchResults}>
            {search && selectedCategory 
              ? `${filteredRecipes.length} ${t("recipes.searchResults")} "${search}" в ${selectedCategory}`
              : search 
                ? `${filteredRecipes.length} ${t("recipes.searchResults")} "${search}"`
                : `${filteredRecipes.length} ${t("recipes.count")} в ${selectedCategory}`
            }
          </div>
        )}
      </div>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      {renderContent()}
    </div>
  );
}
