import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
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

  const refreshRecipes = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        setRecipes([]);
        return;
      }
      try {
        setIsLoading(true);
        const list = await loadRecipeSummaries(handle);
        setRecipes(list);
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
    if (!search.trim()) {
      return recipes;
    }
    const query = search.trim().toLowerCase();
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(query));
  }, [recipes, search]);

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

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.statusMessage}>{t("recipes.status.loading")}</div>;
    }
    if (!filteredRecipes.length) {
      return <div className={styles.emptyState}>{t("recipes.empty")}</div>;
    }

    return (
      <div className={styles.listGrid}>
        {filteredRecipes.map((recipe) => {
          const calories = recipe.nutritionPerServing.caloriesKcal ?? 0;
          return (
            <article key={recipe.fileName} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{recipe.title}</h2>
                <span>{t("recipes.servings", { count: recipe.servings })}</span>
              </div>
              <div className={styles.cardMeta}>
                <span>
                  {t("recipes.perServing", {
                    kcal: calories.toFixed(0),
                    protein: recipe.nutritionPerServing.proteinG?.toFixed(1) ?? "0",
                    fat: recipe.nutritionPerServing.fatG?.toFixed(1) ?? "0",
                    carbs: recipe.nutritionPerServing.carbsG?.toFixed(1) ?? "0"
                  })}
                </span>
                <span>
                  {t("recipes.totalKcal", { value: recipe.nutritionTotal.caloriesKcal?.toFixed(0) ?? "0" })}
                </span>
              </div>
              <div className={styles.cardActions}>
                <Button variant="outlined" onClick={() => handleViewRecipe(recipe)}>
                  {t("recipes.view")}
                </Button>
                <Button variant="ghost" onClick={() => handleEditRecipe(recipe)}>
                  {t("recipes.edit")}
                </Button>
                <Button variant="ghost" onClick={() => handleDeleteRecipe(recipe)}>
                  {t("recipes.delete")}
                </Button>
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
        <div>
          <h1 className={styles.title}>{t("recipes.title")}</h1>
          <p className={styles.subtitle}>{t("recipes.subtitle")}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outlined" onClick={handleSelectVault}>
            {vaultHandle ? t("recipes.changeVault") : t("recipes.chooseVault")}
          </Button>
          <Button onClick={onNavigateAddRecipe}>{t("recipes.add")}</Button>
        </div>
      </header>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="search"
          value={search}
          placeholder={t("recipes.searchPlaceholder")}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      {renderContent()}

      <Button className={styles.fabButton} onClick={onNavigateAddRecipe}>
        + {t("recipes.add")}
      </Button>
    </div>
  );
}
