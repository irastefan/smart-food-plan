import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./NutritionSummary.module.css";

const DEFAULT_COLORS: Record<string, string> = {
  calories: "var(--color-warning)",
  protein: "var(--color-success)",
  fat: "#F6A85F",
  carbs: "var(--color-accent)"
};

function coerceNumber(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number | null | undefined, precision = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  if (precision <= 0) {
    return Math.round(value).toString();
  }
  const fixed = value.toFixed(precision);
  return fixed.replace(/\.0+$/, "");
}

export type NutritionSummaryMetric = {
  key: string;
  label: string;
  value: number | null | undefined;
  unit?: string;
  target?: number | null | undefined;
  color?: string;
  precision?: number;
};

type NutritionSummaryProps = {
  metrics: NutritionSummaryMetric[];
  variant?: "inline" | "cards" | "rings";
  mainMetricKey?: string;
  className?: string;
};

type PreparedMetric = NutritionSummaryMetric & {
  numericValue: number;
  color: string;
  precision: number;
};

function prepareMetrics(metrics: NutritionSummaryMetric[]): PreparedMetric[] {
  return metrics.map((metric) => ({
    ...metric,
    numericValue: coerceNumber(metric.value),
    color: metric.color ?? DEFAULT_COLORS[metric.key] ?? "var(--color-accent)",
    precision: metric.precision ?? (metric.key === "calories" ? 0 : 1)
  }));
}

export function NutritionSummary({
  metrics,
  variant = "cards",
  mainMetricKey = "calories",
  className
}: NutritionSummaryProps): JSX.Element | null {
  if (!metrics || metrics.length === 0) {
    return null;
  }
  const prepared = prepareMetrics(metrics);

  if (variant === "inline") {
    return renderInline(prepared, className);
  }

  if (variant === "rings") {
    return renderRings(prepared, mainMetricKey, className);
  }

  return renderCards(prepared, className);
}

function renderInline(metrics: PreparedMetric[], className?: string): JSX.Element {
  return (
    <div className={clsx(styles.root, styles.inlineRoot, className)}>
      {metrics.map((metric) => (
        <div key={metric.key} className={styles.inlineItem}>
          <span className={styles.inlineLabel}>{metric.label}</span>
          <span className={styles.inlineValue}>
            {formatNumber(metric.numericValue, metric.precision)}
            {metric.unit ? <span className={styles.inlineUnit}> {metric.unit}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderCards(metrics: PreparedMetric[], className?: string): JSX.Element {
  return (
    <div className={clsx(styles.root, styles.cardsRoot, className)}>
      {metrics.map((metric) => {
        const target = metric.target ?? null;
        const numericTarget = target !== null ? coerceNumber(target) : null;
        const hasTarget = numericTarget !== null && numericTarget > 0;
        const progress = hasTarget ? Math.min(metric.numericValue / (numericTarget ?? 1), 1) : null;
        const percent = progress !== null ? Math.round(progress * 100) : null;
        return (
          <article
            key={metric.key}
            className={styles.card}
            style={{ ["--metric-color" as string]: metric.color } as CSSProperties}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>{metric.label}</span>
              {percent !== null && <span className={styles.cardPercent}>{percent}%</span>}
            </div>
            <div className={styles.cardValueRow}>
              <span className={styles.cardValue}>{formatNumber(metric.numericValue, metric.precision)}</span>
              {metric.unit ? <span className={styles.cardUnit}>{metric.unit}</span> : null}
            </div>
            {hasTarget ? (
              <span className={styles.cardTarget}>
                Target: {formatNumber(numericTarget, metric.precision)} {metric.unit ?? ""}
              </span>
            ) : null}
            {hasTarget ? (
              <div className={styles.cardProgress} aria-hidden="true">
                <div className={styles.cardProgressFill} style={{ width: `${(progress ?? 0) * 100}%` }} />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function renderRings(metrics: PreparedMetric[], mainMetricKey: string, className?: string): JSX.Element {
  const centerMetric = metrics.find((metric) => metric.key === mainMetricKey) ?? metrics[0];
  const outerMetrics = metrics.filter((metric) => metric.key !== centerMetric.key);
  const totalOuter = outerMetrics.reduce((acc, metric) => acc + Math.max(metric.numericValue, 0), 0);

  const segments =
    totalOuter > 0
      ? outerMetrics.map((metric) => ({
          ...metric,
          fraction: metric.numericValue > 0 ? metric.numericValue / totalOuter : 0,
          percent: metric.numericValue > 0 ? Math.round((metric.numericValue / totalOuter) * 100) : 0
        }))
      : outerMetrics.map((metric) => ({ ...metric, fraction: 0, percent: null }));

  let current = 0;
  const gradientStops = segments
    .map((segment) => {
      const start = current * 100;
      current += segment.fraction;
      const end = current * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className={clsx(styles.root, styles.ringsRoot, className)}>
      <div
        className={styles.ringsChart}
        role="img"
        aria-label={`${centerMetric.label}: ${formatNumber(centerMetric.numericValue, centerMetric.precision)}`}
      >
        <div
          className={styles.ringsCircle}
          style={
            totalOuter > 0
              ? ({ background: `conic-gradient(${gradientStops})` } as CSSProperties)
              : undefined
          }
        />
        <div className={styles.centerMetric}>
          <span className={styles.centerValue}>
            {formatNumber(centerMetric.numericValue, centerMetric.precision)}
          </span>
          <span className={styles.centerLabel}>{centerMetric.unit ?? centerMetric.label}</span>
        </div>
      </div>
      {segments.length > 0 ? (
        <div className={styles.legend}>
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={styles.legendItem}
              style={{ ["--metric-color" as string]: segment.color } as CSSProperties}
            >
              <span className={styles.legendSwatch} aria-hidden="true" />
              <div>
                <div className={styles.legendLabel}>{segment.label}</div>
                <div className={styles.legendValue}>
                  {formatNumber(segment.numericValue, segment.precision)}
                  {segment.unit ? ` ${segment.unit}` : ""}
                  {segment.percent !== null ? ` · ${segment.percent}%` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
