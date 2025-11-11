import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/i18n/I18nProvider";
import { EDIT_RECIPE_STORAGE_KEY } from "@/constants/storage";
import { ensureDirectoryAccess, loadProductSummaries, persistProductMarkdown, type ProductSummary } from "@/utils/vaultProducts";
import { saveImageToVault, deleteImageFromVault, getImageFromVault } from "@/utils/vaultImages";
import {
  loadRecipeDetail,
  persistRecipe,
  updateRecipe,
  type RecipeDetail,
  type RecipeFormData,
  type RecipeIngredientDraft
} from "@/utils/vaultRecipes";
import { scaleNutritionTotals, type NutritionTotals } from "@/utils/vaultDays";
import {
  clearVaultDirectoryHandle,
  loadVaultDirectoryHandle,
  saveVaultDirectoryHandle
} from "@/utils/vaultStorage";
import styles from "./AddRecipeScreen.module.css";

type IngredientDraft = {
  id: string;
  source: "product" | "custom";
  title: string;
  quantity: number;
  unit: string;
  referenceAmount: number;
  referenceUnit: string;
  macros: NutritionTotals;
  product?: ProductSummary;
  saveToProducts?: boolean;
};

type StatusState =
  | {
      type: "info" | "success" | "error";
      message: string;
    }
  | null;

const ZERO_TOTALS: NutritionTotals = {
  caloriesKcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0
};

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function sumTotals(values: NutritionTotals[]): NutritionTotals {
  return values.reduce(
    (acc, current) => ({
      caloriesKcal: Number(acc.caloriesKcal + (current.caloriesKcal ?? 0)),
      proteinG: Number(acc.proteinG + (current.proteinG ?? 0)),
      fatG: Number(acc.fatG + (current.fatG ?? 0)),
      carbsG: Number(acc.carbsG + (current.carbsG ?? 0))
    }),
    { ...ZERO_TOTALS }
  );
}

function ingredientTotals(ingredient: IngredientDraft): NutritionTotals {
  const factor = ingredient.referenceAmount > 0 ? ingredient.quantity / ingredient.referenceAmount : 1;
  return scaleNutritionTotals(ingredient.macros, factor || 0);
}

function createProductDraft(product: ProductSummary): IngredientDraft {
  const portion = product.portionGrams && product.portionGrams > 0 ? product.portionGrams : 100;
  const unit = product.portionGrams ? "g" : "portion";
  const referenceUnit = unit;
  const macros = {
    caloriesKcal: product.nutritionPerPortion?.caloriesKcal ?? 0,
    proteinG: product.nutritionPerPortion?.proteinG ?? 0,
    fatG: product.nutritionPerPortion?.fatG ?? 0,
    carbsG: product.nutritionPerPortion?.carbsG ?? 0
  } satisfies NutritionTotals;
  return {
    id: generateId("ingredient"),
    source: "product",
    title: product.title,
    quantity: portion,
    unit,
    referenceAmount: portion,
    referenceUnit,
    macros,
    product
  };
}

function createCustomDraft(): IngredientDraft {
  return {
    id: generateId("ingredient"),
    source: "custom",
    title: "",
    quantity: 100,
    unit: "g",
    referenceAmount: 100,
    referenceUnit: "g",
    macros: { ...ZERO_TOTALS },
    saveToProducts: false
  };
}

function detailIngredientToDraft(
  ingredient: RecipeDetail["ingredients"][number],
  products: ProductSummary[]
): IngredientDraft {
  const matchedProduct = ingredient.product
    ? products.find((p) => p.slug === ingredient.product?.slug || p.fileName === ingredient.product?.fileName)
    : undefined;
  return {
    id: ingredient.id ?? generateId("ingredient"),
    source: matchedProduct ? "product" : "custom",
    title: ingredient.title,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    referenceAmount: ingredient.referenceAmount,
    referenceUnit: ingredient.referenceUnit,
    macros: ingredient.macros,
    product: matchedProduct,
    saveToProducts: false
  };
}

export function AddRecipeScreen({ onSaved }: { onSaved?: () => void } = {}): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const productsRef = useRef<ProductSummary[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [servings, setServings] = useState<number>(4);
  const [steps, setSteps] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number>(30);
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<StatusState>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editing, setEditing] = useState<{ fileName: string; slug?: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const totals = useMemo(() => sumTotals(ingredients.map(ingredientTotals)), [ingredients]);
  const perServing = useMemo(() => {
    const safeServings = servings > 0 ? servings : 1;
    return scaleNutritionTotals(totals, 1 / safeServings);
  }, [servings, totals]);

  const clearEditingState = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(EDIT_RECIPE_STORAGE_KEY);
    }
    setEditing(null);
    setTitle("");
    setDescription("");
    setServings(4);
    setSteps("");
    setPhotoUrl("");
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setCookTimeMinutes(30);
    setCategory("");
    setIngredients([]);
    setStatus(null);
  }, []);

  const loadProducts = useCallback(
    async (handle: FileSystemDirectoryHandle | null) => {
      if (!handle) {
        productsRef.current = [];
        setProducts([]);
        return;
      }
      try {
        const list = await loadProductSummaries(handle);
        productsRef.current = list;
        setProducts(list);
      } catch (error) {
        console.error("Failed to load products", error);
      }
    },
    []
  );

  const loadRecipeForEditing = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      if (typeof window === "undefined") {
        return;
      }
      const raw = window.sessionStorage.getItem(EDIT_RECIPE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      try {
        const payload = JSON.parse(raw) as { fileName: string; slug?: string };
        if (!payload?.fileName) {
          return;
        }
        setIsLoading(true);
        const detail = await loadRecipeDetail(handle, payload.fileName);
        setEditing({ fileName: detail.fileName, slug: detail.slug });
        setTitle(detail.title);
        setDescription(detail.description ?? "");
        setServings(detail.servings ?? 1);
        setSteps(detail.stepsMarkdown ?? "");
        setPhotoUrl(detail.photoUrl ?? "");
        setCookTimeMinutes((detail as any).cookTimeMinutes ?? 30);
        setCategory(detail.tags?.[0] ?? "");
        
        // Load image preview if it exists and is a vault path
        if (detail.photoUrl && detail.photoUrl.startsWith('images/')) {
          const imageUrl = await getImageFromVault(handle, detail.photoUrl);
          if (imageUrl) {
            setPhotoPreviewUrl(imageUrl);
          }
        } else if (detail.photoUrl) {
          // Legacy base64 or external URL
          setPhotoPreviewUrl(detail.photoUrl);
        }
        const productList = productsRef.current;
        setIngredients(detail.ingredients.map((ingredient) => detailIngredientToDraft(ingredient, productList)));
        setStatus({ type: "info", message: t("addRecipe.status.editing", { title: detail.title }) });
      } catch (error) {
        console.error("Failed to load recipe detail", error);
        setStatus({ type: "error", message: t("addRecipe.status.loadError") });
      } finally {
        setIsLoading(false);
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
          await loadProducts(handle);
          await loadRecipeForEditing(handle);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
        setStatus({ type: "error", message: t("addRecipe.status.restoreError") });
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadProducts, loadRecipeForEditing, t]);

  const handleSelectVault = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setStatus({ type: "error", message: t("addRecipe.status.browserUnsupported") });
      return;
    }
    try {
      const handle = await window.showDirectoryPicker();
      if (!handle) {
        return;
      }
      const hasAccess = await ensureDirectoryAccess(handle);
      if (!hasAccess) {
        setStatus({ type: "error", message: t("addRecipe.status.permissionError") });
        return;
      }
      setVaultHandle(handle);
      if ("indexedDB" in window) {
        await saveVaultDirectoryHandle(handle);
      }
      await loadProducts(handle);
      await loadRecipeForEditing(handle);
      setStatus({ type: "success", message: t("addRecipe.status.connected", { folder: handle.name }) });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }
      console.error("Failed to select vault", error);
      setStatus({ type: "error", message: t("addRecipe.status.genericError") });
    }
  }, [loadProducts, loadRecipeForEditing, t]);

  const updateIngredient = useCallback((id: string, patch: Partial<IngredientDraft>) => {
    setIngredients((current) => current.map((ingredient) => (ingredient.id === id ? { ...ingredient, ...patch } : ingredient)));
  }, []);

  const handleAddIngredient = useCallback(() => {
    setIngredients((current) => [...current, createCustomDraft()]);
  }, []);

  const handleRemoveIngredient = useCallback((id: string) => {
    setIngredients((current) => current.filter((ingredient) => ingredient.id !== id));
  }, []);

  const handleSelectProductForIngredient = useCallback(
    (id: string, fileName: string) => {
      const product = productsRef.current.find((item) => item.fileName === fileName);
      if (!product) {
        return;
      }
      setIngredients((current) =>
        current.map((ingredient) => (ingredient.id === id ? { ...createProductDraft(product), id } : ingredient))
      );
    },
    []
  );

  const handleToggleMode = useCallback(
    (id: string, mode: "product" | "custom") => {
      if (mode === "product") {
        setIngredients((current) =>
          current.map((ingredient) =>
            ingredient.id === id
              ? { ...createCustomDraft(), id, source: "product", title: ingredient.title }
              : ingredient
          )
        );
      } else {
        setIngredients((current) =>
          current.map((ingredient) =>
            ingredient.id === id
              ? { ...createCustomDraft(), id, title: ingredient.title }
              : ingredient
          )
        );
      }
    },
    []
  );

  const buildRecipePayload = useCallback((): RecipeFormData => {
    const ingredientDrafts: RecipeIngredientDraft[] = ingredients.map((ingredient) => ({
      id: ingredient.id,
      title: ingredient.title || t("addRecipe.ingredient.untitled"),
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      referenceAmount: ingredient.referenceAmount,
      referenceUnit: ingredient.referenceUnit,
      macros: ingredient.macros,
      product: ingredient.product
        ? {
            slug: ingredient.product.slug,
            title: ingredient.product.title,
            fileName: ingredient.product.fileName
          }
        : undefined
    }));

    return {
      title,
      description,
      servings,
      photoUrl,
      cookTimeMinutes,
      tags: category ? [category] : [],
      stepsMarkdown: steps,
      ingredients: ingredientDrafts
    };
  }, [description, ingredients, servings, steps, t, title, photoUrl, cookTimeMinutes, category]);

  const persistCustomProducts = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      const customIngredients = ingredients.filter((ingredient) => ingredient.source === "custom" && ingredient.saveToProducts);
      for (const ingredient of customIngredients) {
        const portion = ingredient.referenceAmount || ingredient.quantity || 100;
        const productData = {
          productName: ingredient.title,
          portion: String(portion),
          calories: String(ingredient.macros.caloriesKcal ?? 0),
          protein: String(ingredient.macros.proteinG ?? 0),
          fat: String(ingredient.macros.fatG ?? 0),
          carbs: String(ingredient.macros.carbsG ?? 0),
          notes: t("addRecipe.generatedProductNote", { recipe: title })
        } satisfies Record<string, string>;
        try {
          await persistProductMarkdown(handle, productData);
        } catch (error) {
          console.error("Failed to persist generated product", error);
        }
      }
    },
    [ingredients, t, title]
  );

  const handleSave = useCallback(async () => {
    if (!vaultHandle) {
      setStatus({ type: "error", message: t("addRecipe.status.noVault") });
      return;
    }
    if (!title.trim()) {
      setStatus({ type: "error", message: t("addRecipe.status.validation") });
      return;
    }
    setIsSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      
      // Save new image if uploaded
      if (photoFile && title.trim()) {
        const recipeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        finalPhotoUrl = await saveImageToVault(vaultHandle, photoFile, recipeSlug);
      }
      
      const payload = { ...buildRecipePayload(), photoUrl: finalPhotoUrl };
      
      if (editing) {
        // Delete old image if we're replacing it
        if (photoFile && photoUrl && photoUrl.startsWith('images/')) {
          await deleteImageFromVault(vaultHandle, photoUrl);
        }
        await updateRecipe(vaultHandle, editing.fileName, { ...payload, slug: editing.slug });
        setStatus({ type: "success", message: t("addRecipe.status.updated") });
        clearEditingState();
        onSaved?.();
      } else {
        const result = await persistRecipe(vaultHandle, payload);
        setStatus({ type: "success", message: t("addRecipe.status.saved") });
        clearEditingState();
        onSaved?.();
      }
      await persistCustomProducts(vaultHandle);
    } catch (error) {
      console.error("Failed to save recipe", error);
      setStatus({ type: "error", message: t("addRecipe.status.error") });
    } finally {
      setIsSaving(false);
    }
  }, [buildRecipePayload, editing, onSaved, persistCustomProducts, t, title, vaultHandle, clearEditingState, photoUrl, photoFile]);

  const handleGenerateWithAI = useCallback(() => {
    setStatus({ type: "info", message: t("addRecipe.ai.placeholder") });
  }, [t]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviewUrl(previewUrl);
    }
  }, []);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {editing ? t("addRecipe.editTitle", { title: editing.fileName }) : t("addRecipe.title")}
          </h1>
          {editing && (
            <p className={styles.subtitle}>{t("addRecipe.editSubtitle")}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          {editing && (
            <Button variant="ghost" onClick={clearEditingState}>
              {t("addRecipe.newRecipe")}
            </Button>
          )}
          <Button variant="outlined" onClick={handleSelectVault}>
            {t("addRecipe.selectVault")}
          </Button>
        </div>
      </header>

      {status && <div className={styles.statusMessage}>{status.message}</div>}

      <section className={styles.formCard}>
        {isLoading && <div>{t("addRecipe.loading")}</div>}
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label htmlFor="recipe-title">{t("addRecipe.fields.title")}</label>
            <input id="recipe-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="recipe-description">{t("addRecipe.fields.description")}</label>
            <textarea
              id="recipe-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="recipe-servings">{t("addRecipe.fields.servings")}</label>
            <input
              id="recipe-servings"
              type="number"
              min="1"
              value={servings}
              onChange={(event) => setServings(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="recipe-cooking-time">{t("recipe.cookingTime")}</label>
            <input
              id="recipe-cooking-time"
              type="number"
              min="1"
              value={cookTimeMinutes}
              onChange={(event) => setCookTimeMinutes(Math.max(1, Number.parseInt(event.target.value, 10) || 30))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="recipe-category">{t("recipe.category")}</label>
            <select
              id="recipe-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">{t("addRecipe.chooseCategory")}</option>
              <option value={t("recipe.categories.breakfast")}>{t("recipe.categories.breakfast")}</option>
              <option value={t("recipe.categories.lunch")}>{t("recipe.categories.lunch")}</option>
              <option value={t("recipe.categories.dinner")}>{t("recipe.categories.dinner")}</option>
              <option value={t("recipe.categories.snack")}>{t("recipe.categories.snack")}</option>
              <option value={t("recipe.categories.dessert")}>{t("recipe.categories.dessert")}</option>
              <option value={t("recipe.categories.salad")}>{t("recipe.categories.salad")}</option>
              <option value={t("recipe.categories.soup")}>{t("recipe.categories.soup")}</option>
              <option value={t("recipe.categories.main")}>{t("recipe.categories.main")}</option>
              <option value={t("recipe.categories.side")}>{t("recipe.categories.side")}</option>
              <option value={t("recipe.categories.drink")}>{t("recipe.categories.drink")}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>{t("addRecipe.fields.photo")}</label>
            <div className={styles.photoUpload}>
              <div className={styles.photoContainer}>
                <div 
                  className={styles.photoPreview}
                  onClick={handleImageClick}
                >
                  {photoPreviewUrl || photoUrl ? (
                    <img src={photoPreviewUrl || photoUrl} alt="Recipe preview" className={styles.photoImage} />
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      <div className={styles.photoIcon}>📷</div>
                      <span>{t("addRecipe.uploadPhoto")}</span>
                    </div>
                  )}
                </div>
                {(photoPreviewUrl || photoUrl) && (
                  <button
                    type="button"
                    className={styles.removePhotoButton}
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreviewUrl("");
                      setPhotoUrl("");
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.hiddenFileInput}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="recipe-steps">{t("addRecipe.fields.steps")}</label>
            <textarea
              id="recipe-steps"
              rows={6}
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
            />
          </div>
        </div>

        <div>
          <div className={styles.summaryBar}>
            <div className={styles.summaryItem}>
              <span>{t("mealPlan.totals.calories")}</span>
              <strong>{totals.caloriesKcal.toFixed(0)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{t("mealPlan.totals.protein")}</span>
              <strong>{totals.proteinG.toFixed(1)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{t("mealPlan.totals.fat")}</span>
              <strong>{totals.fatG.toFixed(1)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{t("mealPlan.totals.carbs")}</span>
              <strong>{totals.carbsG.toFixed(1)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{t("addRecipe.perServing")}</span>
              <strong>{perServing.caloriesKcal.toFixed(0)} {t("mealPlan.units.kcal")}</strong>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.ingredientActions}>
            <Button variant="ghost" onClick={handleAddIngredient}>
              + {t("addRecipe.addIngredient")}
            </Button>
          </div>

          <div className={styles.ingredientsList}>
            {ingredients.map((ingredient) => (
              <div key={ingredient.id} className={styles.ingredientRow}>
                <div className={styles.ingredientHeader}>
                  <div className={styles.field}>
                    <label>{t("addRecipe.fields.ingredientName")}</label>
                    <input
                      value={ingredient.title}
                      onChange={(event) => updateIngredient(ingredient.id, { title: event.target.value })}
                    />
                  </div>
                  <div className={styles.ingredientActions}>
                    <Button variant="ghost" onClick={() => handleToggleMode(ingredient.id, ingredient.source === "product" ? "custom" : "product")}>
                      {ingredient.source === "product" ? t("addRecipe.switchToCustom") : t("addRecipe.switchToProduct")}
                    </Button>
                    <Button variant="ghost" onClick={() => handleRemoveIngredient(ingredient.id)}>
                      {t("addRecipe.removeIngredient")}
                    </Button>
                  </div>
                </div>

                <div className={styles.ingredientControls}>
                  {ingredient.source === "product" && (
                    <div className={styles.field}>
                      <label>{t("addRecipe.chooseProduct")}</label>
                      <select
                        value={ingredient.product?.fileName ?? ""}
                        onChange={(event) => handleSelectProductForIngredient(ingredient.id, event.target.value)}
                      >
                        <option value="">{t("addRecipe.productPlaceholder")}</option>
                        {products.map((product) => (
                          <option key={product.fileName} value={product.fileName}>
                            {product.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>{t("addRecipe.fields.quantity")}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={ingredient.quantity}
                      onChange={(event) => updateIngredient(ingredient.id, { quantity: Number.parseFloat(event.target.value) || 0 })}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>{t("addRecipe.fields.unit")}</label>
                    <input
                      value={ingredient.unit}
                      onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value })}
                    />
                  </div>

                  {ingredient.source === "custom" && (
                    <>
                      <div className={styles.field}>
                        <label>{t("addRecipe.fields.referenceAmount")}</label>
                        <input
                          type="number"
                          min="1"
                          value={ingredient.referenceAmount}
                          onChange={(event) => updateIngredient(ingredient.id, { referenceAmount: Number.parseFloat(event.target.value) || 100 })}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("addRecipe.fields.referenceUnit")}</label>
                        <input
                          value={ingredient.referenceUnit}
                          onChange={(event) => updateIngredient(ingredient.id, { referenceUnit: event.target.value })}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("mealPlan.totals.calories")}</label>
                        <input
                          type="number"
                          value={ingredient.macros.caloriesKcal}
                          onChange={(event) =>
                            updateIngredient(ingredient.id, {
                              macros: { ...ingredient.macros, caloriesKcal: Number.parseFloat(event.target.value) || 0 }
                            })
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("mealPlan.totals.protein")}</label>
                        <input
                          type="number"
                          value={ingredient.macros.proteinG}
                          onChange={(event) =>
                            updateIngredient(ingredient.id, {
                              macros: { ...ingredient.macros, proteinG: Number.parseFloat(event.target.value) || 0 }
                            })
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("mealPlan.totals.fat")}</label>
                        <input
                          type="number"
                          value={ingredient.macros.fatG}
                          onChange={(event) =>
                            updateIngredient(ingredient.id, {
                              macros: { ...ingredient.macros, fatG: Number.parseFloat(event.target.value) || 0 }
                            })
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t("mealPlan.totals.carbs")}</label>
                        <input
                          type="number"
                          value={ingredient.macros.carbsG}
                          onChange={(event) =>
                            updateIngredient(ingredient.id, {
                              macros: { ...ingredient.macros, carbsG: Number.parseFloat(event.target.value) || 0 }
                            })
                          }
                        />
                      </div>
                      <div className={styles.field}>
                        <label>
                          <input
                            type="checkbox"
                            checked={ingredient.saveToProducts ?? false}
                            onChange={(event) => updateIngredient(ingredient.id, { saveToProducts: event.target.checked })}
                          />
                          {t("addRecipe.saveAsProduct")}
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={handleGenerateWithAI}>
            {t("addRecipe.generateAI")}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={clearEditingState}>
              {t("addRecipe.cancelEdit")}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {editing ? t("addRecipe.update") : t("addRecipe.save")}
          </Button>
        </div>
      </section>
    </div>
  );
}
