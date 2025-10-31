import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/messages";
import {
  loadMealPlanDay,
  removeMealPlanItem,
  updateMealPlanItem,
  type MealPlanDay,
  type MealPlanItem
} from "@/utils/vaultDays";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { clearVaultDirectoryHandle, loadVaultDirectoryHandle } from "@/utils/vaultStorage";
import { SELECT_RECIPE_FOR_PLAN_KEY, VIEW_PRODUCT_STORAGE_KEY, VIEW_RECIPE_STORAGE_KEY } from "@/constants/storage";
import styles from "./MealPlanDayScreen.module.css";

type MealPlanDayScreenProps = {
  onNavigateToAddFood?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToRecipes?: () => void;
  onNavigateToRecipe?: () => void;
  onNavigateToProduct?: () => void;
};

type SectionDescriptor = {
  id: string;
  emoji: string;
};

type MacroKey = "calories" | "protein" | "fat" | "carbs";

const SECTION_METADATA: Record<string, SectionDescriptor> = {
  breakfast: { id: "breakfast", emoji: "🍳" },
  lunch: { id: "lunch", emoji: "🍝" },
  dinner: { id: "dinner", emoji: "🐟" },
  snack: { id: "snack", emoji: "🍎" }
};

const MACRO_LABEL_KEYS: Record<MacroKey, TranslationKey> = {
  calories: "mealPlan.totals.calories",
  protein: "mealPlan.totals.protein",
  fat: "mealPlan.totals.fat",
  carbs: "mealPlan.totals.carbs"
};

function formatNumber(value: number | null | undefined): string {
  if (!value) {
    return "0";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function getSectionInfo(sectionId: string): SectionDescriptor {
  return SECTION_METADATA[sectionId] ?? { id: sectionId, emoji: "🥗" };
}

function resolveSectionTitle(
  sectionId: string,
  fallbackName: string | undefined,
  t: ReturnType<typeof useTranslation>["t"]
): string {
  const key = `mealTime.${sectionId}` as TranslationKey;
  const translated = t(key);
  if (!translated.startsWith("mealTime.")) {
    return `${translated}`;
  }
  return fallbackName ?? sectionId;
}

function buildItemMeta(item: MealPlanItem, t: ReturnType<typeof useTranslation>["t"]): string {
  const parts: string[] = [];
  if (item.quantity && item.quantityUnit) {
    parts.push(`${formatNumber(item.quantity)} ${item.quantityUnit}`);
  }
  if (item.servings) {
    parts.push(
      t("mealPlan.servingsLabel", {
        count: formatNumber(item.servings)
      })
    );
  }
  parts.push(`${formatNumber(item.nutrition.caloriesKcal)} ${t("mealPlan.units.kcal")}`);
  return parts.join(" • ");
}

export function MealPlanDayScreen({
  onNavigateToAddFood,
  onNavigateToProducts,
  onNavigateToRecipes,
  onNavigateToRecipe,
  onNavigateToProduct
}: MealPlanDayScreenProps): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dayPlan, setDayPlan] = useState<MealPlanDay | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);
  const [dayError, setDayError] = useState<TranslationKey | null>(null);
  const [editingItem, setEditingItem] = useState<{
    sectionId: string;
    itemIndex: number;
    type: MealPlanItem["type"];
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const loadDayPlan = useCallback(
    async (handle: FileSystemDirectoryHandle | null, date: string) => {
      if (!handle) {
        setDayPlan(null);
        return;
      }
      setIsLoadingDay(true);
      setDayError(null);
      try {
        const day = await loadMealPlanDay(handle, date);
        setDayPlan(day);
      } catch (error) {
        console.error("Failed to load meal plan day", error);
        setDayError("mealPlan.state.error");
        setDayPlan(null);
      } finally {
        setIsLoadingDay(false);
      }
    },
    []
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
          setTimeout(() => {
            void loadDayPlan(handle, selectedDate);
          }, 0);
        }
      } catch (error) {
        console.error("Failed to restore vault handle", error);
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, [loadDayPlan, selectedDate]);

  useEffect(() => {
    void loadDayPlan(vaultHandle, selectedDate);
  }, [vaultHandle, selectedDate, loadDayPlan]);

  useEffect(() => {
    setEditingItem(null);
    setEditValue("");
  }, [selectedDate]);

  useEffect(() => {
    if (!dayPlan) {
      setEditingItem(null);
      setEditValue("");
    }
  }, [dayPlan]);

  const handleDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  }, []);

  const handleAddFood = useCallback(
    (sectionId: string, sectionName?: string) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          SELECT_RECIPE_FOR_PLAN_KEY,
          JSON.stringify({ date: selectedDate, sectionId, sectionName })
        );
      }
      onNavigateToAddFood?.();
    },
    [onNavigateToAddFood, selectedDate]
  );

  const handleStartEdit = useCallback(
    (sectionId: string, itemIndex: number) => {
      const section = dayPlan?.sections.find((entry) => entry.id === sectionId);
      const item = section?.items[itemIndex];
      if (!item) {
        return;
      }
      setEditingItem({ sectionId, itemIndex, type: item.type });
      if (item.type === "recipe") {
        setEditValue(String(item.servings ?? 1));
      } else {
        setEditValue(String(item.quantity ?? item.portionGrams ?? 0));
      }
      setDayError(null);
    },
    [dayPlan]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
    setEditValue("");
    setDayError(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem) {
      return;
    }
    if (!vaultHandle) {
      setDayError("mealPlan.state.noVault");
      return;
    }
    const parsed =
      editingItem.type === "recipe" ? Number.parseInt(editValue, 10) : Number.parseFloat(editValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDayError("mealPlan.item.invalidValue");
      return;
    }

    setIsMutating(true);
    setDayError(null);
    try {
      if (editingItem.type === "recipe") {
        const result = await updateMealPlanItem(
          vaultHandle,
          selectedDate,
          editingItem.sectionId,
          editingItem.itemIndex,
          { servings: parsed }
        );
        setDayPlan(result.day);
      } else {
        const result = await updateMealPlanItem(
          vaultHandle,
          selectedDate,
          editingItem.sectionId,
          editingItem.itemIndex,
          { quantity: parsed }
        );
        setDayPlan(result.day);
      }
      setEditingItem(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to update meal plan item", error);
      setDayError("mealPlan.item.updateError");
    } finally {
      setIsMutating(false);
    }
  }, [editValue, editingItem, selectedDate, vaultHandle]);

  const handleRemoveItem = useCallback(
    async (sectionId: string, itemIndex: number) => {
      if (!vaultHandle) {
        setDayError("mealPlan.state.noVault");
        return;
      }
      setIsMutating(true);
      setDayError(null);
      try {
        const result = await removeMealPlanItem(vaultHandle, selectedDate, sectionId, itemIndex);
        setDayPlan(result.day);
        setEditingItem(null);
        setEditValue("");
      } catch (error) {
        console.error("Failed to remove meal plan item", error);
        setDayError("mealPlan.item.deleteError");
      } finally {
        setIsMutating(false);
      }
    },
    [selectedDate, vaultHandle]
  );

  const handleOpenItem = useCallback(
    (item: MealPlanItem) => {
      if (!item.source || typeof window === "undefined") {
        return;
      }
      if (item.type === "product") {
        window.sessionStorage.setItem(
          VIEW_PRODUCT_STORAGE_KEY,
          JSON.stringify({ fileName: item.source.fileName, slug: item.source.slug })
        );
        onNavigateToProduct?.();
      } else {
        window.sessionStorage.setItem(
          VIEW_RECIPE_STORAGE_KEY,
          JSON.stringify({ fileName: item.source.fileName, slug: item.source.slug })
        );
        onNavigateToRecipe?.();
      }
    },
    [onNavigateToProduct, onNavigateToRecipe]
  );

  const formattedDate = useMemo(() => {
    const parsed = new Date(selectedDate);
    if (Number.isNaN(parsed.valueOf())) {
      return selectedDate;
    }
    return new Intl.DateTimeFormat(t("mealPlan.locale"), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(parsed);
  }, [selectedDate, t]);

  const totals = dayPlan?.totals;
  const macroCards: { key: MacroKey; value: number; unit: string }[] = [
    { key: "calories", value: totals?.caloriesKcal ?? 0, unit: t("mealPlan.units.kcal") },
    { key: "protein", value: totals?.proteinG ?? 0, unit: t("mealPlan.units.grams") },
    { key: "fat", value: totals?.fatG ?? 0, unit: t("mealPlan.units.grams") },
    { key: "carbs", value: totals?.carbsG ?? 0, unit: t("mealPlan.units.grams") }
  ];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t("mealPlan.dailyTitle")}</h1>
          <p className={styles.subtitle}>{formattedDate}</p>
        </div>
        <div className={styles.datePicker}>
          <label htmlFor="day-picker">{t("mealPlan.selectDate")}</label>
          <input id="day-picker" type="date" value={selectedDate} onChange={handleDateChange} className={styles.dateInput} />
        </div>
      </header>

      <section className={styles.metricsGrid}>
        {macroCards.map((card) => (
          <div key={card.key} className={styles.metricCard}>
            <span className={styles.metricLabel}>{t(MACRO_LABEL_KEYS[card.key])}</span>
            <span className={styles.metricValue}>
              {formatNumber(card.value)} {card.unit}
            </span>
          </div>
        ))}
      </section>

      {isLoadingDay && <div className={styles.statusMessage}>{t("mealPlan.state.loading")}</div>}
      {dayError && <div className={styles.statusMessage}>{t(dayError)}</div>}

      <section className={styles.sectionsGrid}>
        {(dayPlan?.sections ?? []).map((section) => {
          const sectionInfo = getSectionInfo(section.id);
          const sectionTitle = `${sectionInfo.emoji} ${resolveSectionTitle(section.id, section.name, t)}`;
          return (
            <article key={section.id} className={styles.sectionCard}>
              <header className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
                <span className={styles.sectionTotal}>
                  {t("mealPlan.sectionTotal", {
                    value: formatNumber(section.totals.caloriesKcal),
                    unit: t("mealPlan.units.kcal")
                  })}
                </span>
              </header>

              <div className={styles.itemsList}>
                {section.items.length > 0 ? (
                  section.items.map((item, index) => {
                    const isEditing =
                      editingItem?.sectionId === section.id && editingItem.itemIndex === index;
                    const editLabel =
                      item.type === "recipe"
                        ? t("mealPlan.item.servingsLabel")
                        : t("mealPlan.item.quantityLabel");
                    const rowClassName = isEditing
                      ? `${styles.itemRow} ${styles.itemRowEditing}`
                      : styles.itemRow;
                    return (
                      <div
                        key={`${section.id}-${item.ref}-${index}`}
                        className={rowClassName}
                      >
                        <div className={styles.itemInfo}>
                          <span className={styles.itemTitle}>{item.title}</span>
                          {isEditing ? (
                            <label className={styles.editField}>
                              <span className={styles.editLabel}>{editLabel}</span>
                              <input
                                className={styles.editInput}
                                type="number"
                                min={item.type === "recipe" ? 1 : 0.1}
                                step={item.type === "recipe" ? 1 : 0.1}
                                value={editValue}
                                onChange={(event) => setEditValue(event.target.value)}
                                disabled={isMutating}
                              />
                            </label>
                          ) : (
                            <span className={styles.itemMeta}>{buildItemMeta(item, t)}</span>
                          )}
                        </div>
                        <div className={styles.itemActions}>
                          {isEditing ? (
                            <>
                              <Button variant="ghost" onClick={handleCancelEdit} disabled={isMutating}>
                                {t("common.cancel")}
                              </Button>
                              <Button onClick={handleSaveEdit} disabled={isMutating}>
                                {t("mealPlan.item.save")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={styles.itemButton}
                                onClick={() => handleOpenItem(item)}
                                disabled={isMutating}
                              >
                                {t("mealPlan.openItem")}
                              </button>
                              <button
                                type="button"
                                className={styles.itemButton}
                                onClick={() => handleStartEdit(section.id, index)}
                                disabled={isMutating}
                              >
                                {t("mealPlan.item.edit")}
                              </button>
                              <button
                                type="button"
                                className={styles.itemButton}
                                onClick={() => handleRemoveItem(section.id, index)}
                                disabled={isMutating}
                              >
                                {t("mealPlan.item.delete")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className={styles.emptyState}>{t("mealPlan.emptySection")}</span>
                )}
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={() => handleAddFood(section.id, section.name)}
              >
                + {t("mealPlan.addFood")}
              </button>
            </article>
          );
        })}
      </section>

      <section className={styles.summaryPanel}>
        <div className={styles.summaryMetric}>
          <span className={styles.summaryLabel}>{t("mealPlan.totalEnergy")}</span>
          <span className={styles.summaryValue}>
            {formatNumber(dayPlan?.totals.caloriesKcal ?? 0)} {t("mealPlan.units.kcal")}
          </span>
        </div>
        <div className={styles.summaryMetric}>
          <span className={styles.summaryLabel}>{t("mealPlan.totalMacros")}</span>
          <span className={styles.summaryValue}>
            {formatNumber(dayPlan?.totals.proteinG ?? 0)} / {formatNumber(dayPlan?.totals.fatG ?? 0)} / {formatNumber(dayPlan?.totals.carbsG ?? 0)}
            {t("mealPlan.units.grams")}
          </span>
        </div>
        <div className={styles.wellnessRow}>
          <span className={styles.chip}>😌 {t("mealPlan.wellness.mood")}</span>
          <span className={styles.chip}>😴 {t("mealPlan.wellness.sleep")}</span>
          <span className={styles.chip}>💆 {t("mealPlan.wellness.stress")}</span>
        </div>
      </section>

      <footer>
        <Button variant="outlined" onClick={onNavigateToRecipes}>
          {t("mealPlan.viewRecipes")}
        </Button>
        <Button variant="ghost" onClick={onNavigateToProducts}>
          {t("mealPlan.viewProducts")}
        </Button>
      </footer>
    </div>
  );
}
