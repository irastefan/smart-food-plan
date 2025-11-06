import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/messages";
import {
  loadMealPlanHistory,
  type MealPlanDay
} from "@/utils/vaultDays";
import { ensureDirectoryAccess } from "@/utils/vaultProducts";
import { clearVaultDirectoryHandle, loadVaultDirectoryHandle } from "@/utils/vaultStorage";
import styles from "./StatisticsScreen.module.css";

type RangeOption = 7 | 14 | 30 | 0;

type MacroKey = "protein" | "fat" | "carbs";

type MacroSegment = {
  key: MacroKey;
  value: number;
};

type MacroBar = {
  label: string;
  total: number;
  segments: MacroSegment[];
};

type CalorieBar = {
  label: string;
  value: number;
};

type WeightPoint = {
  label: string;
  value: number;
};

const HISTORY_LIMIT = 120;

const MACRO_SEGMENT_LABEL: Record<MacroKey, TranslationKey> = {
  protein: "statistics.macros.legend.protein",
  fat: "statistics.macros.legend.fat",
  carbs: "statistics.macros.legend.carbs"
};

const MACRO_SEGMENT_CLASS: Record<MacroKey, string> = {
  protein: styles.macroSegmentProtein,
  fat: styles.macroSegmentFat,
  carbs: styles.macroSegmentCarbs
};

const RANGE_OPTIONS: { value: RangeOption; labelKey: TranslationKey }[] = [
  { value: 7, labelKey: "statistics.range.7" },
  { value: 14, labelKey: "statistics.range.14" },
  { value: 30, labelKey: "statistics.range.30" },
  { value: 0, labelKey: "statistics.range.all" }
];

function formatDayLabel(date: string, locale: string): string {
  try {
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.valueOf())) {
      return date;
    }
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parsed);
  } catch {
    return date;
  }
}

function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number.isInteger(value)
    ? value.toString()
    : value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

function formatDelta(value: number, fractionDigits = 1): string {
  const formatted = formatNumber(Math.abs(value), fractionDigits);
  if (value > 0) {
    return `+${formatted}`;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function StatisticsScreen(): JSX.Element {
  const { t } = useTranslation();
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [history, setHistory] = useState<MealPlanDay[]>([]);
  const [range, setRange] = useState<RangeOption>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<TranslationKey | null>(null);

  const locale = t("mealPlan.locale");

  const handleRangeChange = useCallback((value: RangeOption) => {
    setRange(value);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return;
    }

    let cancelled = false;

    const restoreHandle = async () => {
      try {
        const handle = await loadVaultDirectoryHandle();
        if (!handle) {
          if (!cancelled) {
            setVaultHandle(null);
            setHistory([]);
          }
          return;
        }

        const hasAccess = await ensureDirectoryAccess(handle);
        if (!hasAccess) {
          await clearVaultDirectoryHandle();
          if (!cancelled) {
            setVaultHandle(null);
            setHistory([]);
          }
          return;
        }

        if (!cancelled) {
          setVaultHandle(handle);
        }
      } catch (err) {
        console.error("Failed to restore vault handle for statistics", err);
      }
    };

    void restoreHandle();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vaultHandle) {
      setHistory([]);
      setError("statistics.state.noVault");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadHistory = async () => {
      try {
        const days = await loadMealPlanHistory(vaultHandle, { limit: HISTORY_LIMIT });
        if (!cancelled) {
          setHistory(days);
        }
      } catch (err) {
        console.error("Failed to load statistics history", err);
        if (!cancelled) {
          setError("statistics.state.loadError");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [vaultHandle]);

  const visibleDays = useMemo(() => {
    if (range > 0) {
      return history.slice(-range);
    }
    return history;
  }, [history, range]);

  const calorieBars: CalorieBar[] = useMemo(
    () =>
      visibleDays.map((day) => ({
        label: formatDayLabel(day.date, locale),
        value: Math.max(0, day.totals.caloriesKcal)
      })),
    [locale, visibleDays]
  );

  const maxCalories = calorieBars.reduce((acc, bar) => Math.max(acc, bar.value), 0);
  const averageCalories = calorieBars.length
    ? calorieBars.reduce((acc, bar) => acc + bar.value, 0) / calorieBars.length
    : 0;

  const macroBars: MacroBar[] = useMemo(
    () =>
      visibleDays.map((day) => {
        const segments: MacroSegment[] = [
          { key: "protein", value: Math.max(0, day.totals.proteinG) },
          { key: "fat", value: Math.max(0, day.totals.fatG) },
          { key: "carbs", value: Math.max(0, day.totals.carbsG) }
        ];
        const total = segments.reduce((sum, segment) => sum + segment.value, 0);
        return {
          label: formatDayLabel(day.date, locale),
          total,
          segments
        };
      }),
    [locale, visibleDays]
  );

  const maxMacroTotal = macroBars.reduce((acc, bar) => Math.max(acc, bar.total), 0);

  const weightPoints: WeightPoint[] = useMemo(() => {
    const points: WeightPoint[] = [];
    for (const day of visibleDays) {
      const weight = day.meta?.weightKg;
      if (typeof weight === "number" && Number.isFinite(weight)) {
        points.push({ label: formatDayLabel(day.date, locale), value: weight });
      }
    }
    return points;
  }, [locale, visibleDays]);

  const hasWeightData = weightPoints.length > 0;
  const weightMin = hasWeightData
    ? weightPoints.reduce((acc, point) => Math.min(acc, point.value), weightPoints[0].value)
    : null;
  const weightMax = hasWeightData
    ? weightPoints.reduce((acc, point) => Math.max(acc, point.value), weightPoints[0].value)
    : null;
  const weightBase = weightMin ?? 0;
  const weightRange = hasWeightData
    ? Math.max(0.1, (weightMax ?? weightBase) - weightBase)
    : 1;
  const latestWeight = hasWeightData ? weightPoints[weightPoints.length - 1].value : null;
  const weightChange = weightPoints.length >= 2
    ? weightPoints[weightPoints.length - 1].value - weightPoints[0].value
    : 0;

  const weightPlotPoints = weightPoints.map((point, index) => {
    const x = weightPoints.length > 1 ? (index / (weightPoints.length - 1)) * 100 : 50;
    const normalized = (point.value - weightBase) / weightRange;
    const y = 100 - Math.max(0, Math.min(1, normalized)) * 100;
    return { x: Number.parseFloat(x.toFixed(2)), y: Number.parseFloat(y.toFixed(2)) };
  });

  const weightPolyline = weightPlotPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const weightFillPath = weightPlotPoints.length
    ? [
        `M ${weightPlotPoints[0].x} ${weightPlotPoints[0].y}`,
        ...weightPlotPoints.slice(1).map((point) => `L ${point.x} ${point.y}`),
        `L ${weightPlotPoints[weightPlotPoints.length - 1].x} 100`,
        `L ${weightPlotPoints[0].x} 100`,
        "Z"
      ].join(" ")
    : "";

  const hasData = visibleDays.length > 0;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{t("statistics.title")}</h1>
          <p className={styles.subtitle}>{t("statistics.subtitle")}</p>
        </div>
        <div className={styles.rangeToggle}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={clsx(styles.rangeButton, range === option.value && styles.rangeButtonActive)}
              onClick={() => handleRangeChange(option.value)}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <div className={styles.statusMessage}>{t("statistics.state.loading")}</div>}
      {error && <div className={clsx(styles.statusMessage, styles.statusError)}>{t(error)}</div>}

      {!isLoading && !error && !hasData && (
        <div className={styles.statusMessage}>{t("statistics.state.noData")}</div>
      )}

      {hasData && (
        <section className={styles.cardsGrid}>
          <article className={clsx(styles.chartCard, styles.cardCalories)}>
            <header className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>{t("statistics.section.calories")}</h2>
                <p className={styles.chartMeta}>
                  {t("statistics.calories.average", { value: formatNumber(averageCalories, 0) })}
                </p>
              </div>
              <span className={styles.rangeSummary}>
                {t("statistics.rangeLabel", { count: String(visibleDays.length) })}
              </span>
            </header>
            <div className={styles.chartScroller}>
              <div className={styles.barChart}>
                {calorieBars.map((bar) => {
                  const height = maxCalories > 0 ? (bar.value / maxCalories) * 100 : 0;
                  return (
                    <div key={bar.label} className={styles.barColumn}>
                      <span className={styles.barValue}>{formatNumber(bar.value, 0)}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ height: `${height}%` }}></div>
                      </div>
                      <span className={styles.barLabel}>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className={clsx(styles.chartCard, styles.cardMacros)}>
            <header className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>{t("statistics.section.macros")}</h2>
                <p className={styles.chartMeta}>{t("statistics.macros.subtitle")}</p>
              </div>
            </header>
            <div className={styles.chartScroller}>
              <div className={styles.barChart}>
                {macroBars.map((bar) => {
                  const height = maxMacroTotal > 0 ? (bar.total / maxMacroTotal) * 100 : 0;
                  return (
                    <div key={bar.label} className={styles.barColumn}>
                      <span className={styles.barValue}>{formatNumber(bar.total, 0)} g</span>
                      <div className={styles.barTrack}>
                        <div className={styles.macroStack} style={{ height: `${height}%` }}>
                          {bar.segments.map((segment) => {
                            const percent = bar.total > 0 ? (segment.value / bar.total) * 100 : 0;
                            return (
                              <div
                                key={segment.key}
                                className={clsx(styles.macroSegment, MACRO_SEGMENT_CLASS[segment.key])}
                                style={{ height: `${percent}%` }}
                                title={`${t(MACRO_SEGMENT_LABEL[segment.key])}: ${formatNumber(segment.value, 0)} g`}
                              ></div>
                            );
                          })}
                        </div>
                      </div>
                      <span className={styles.barLabel}>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.macroLegend}>
              <span className={clsx(styles.legendItem, styles.legendProtein)}>
                <span className={styles.legendSwatch}></span>
                {t("statistics.macros.legend.protein")}
              </span>
              <span className={clsx(styles.legendItem, styles.legendFat)}>
                <span className={styles.legendSwatch}></span>
                {t("statistics.macros.legend.fat")}
              </span>
              <span className={clsx(styles.legendItem, styles.legendCarbs)}>
                <span className={styles.legendSwatch}></span>
                {t("statistics.macros.legend.carbs")}
              </span>
            </div>
          </article>

          <article className={clsx(styles.chartCard, styles.cardWeight)}>
            <header className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>{t("statistics.section.weight")}</h2>
                {latestWeight !== null ? (
                  <p className={styles.chartMeta}>
                    {t("statistics.weight.latest", { value: formatNumber(latestWeight, 1) })}
                  </p>
                ) : (
                  <p className={styles.chartMeta}>{t("statistics.weight.notEnough")}</p>
                )}
              </div>
              {weightPoints.length >= 2 && (
                <span className={styles.weightChange}>
                  {t("statistics.weight.change", { value: formatDelta(weightChange, 1) })}
                </span>
              )}
            </header>
            {weightPoints.length > 0 ? (
              <div className={styles.lineChart}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.lineSvg}>
                  {weightFillPath && <path d={weightFillPath} className={styles.lineFill} />}
                  {weightPolyline && <polyline points={weightPolyline} className={styles.lineStroke} />}
                </svg>
                <div className={styles.lineLabels}>
                  {weightPoints.map((point) => (
                    <span key={`${point.label}-${point.value}`} className={styles.lineLabel}>
                      <strong>{formatNumber(point.value, 1)}</strong>
                      <span>{point.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.statusMessage}>{t("statistics.weight.notEnough")}</div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}
