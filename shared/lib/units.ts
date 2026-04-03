export const KNOWN_UNITS = ["g", "ml", "pcs", "tsp", "tbsp", "serving", "slice"] as const;

export type KnownUnit = (typeof KNOWN_UNITS)[number];

const UNIT_ALIASES: Record<string, KnownUnit> = {
  g: "g",
  gram: "g",
  grams: "g",
  gr: "g",
  "гр": "g",
  "г": "g",
  "грамм": "g",
  "грамма": "g",
  "граммов": "g",
  ml: "ml",
  "мл": "ml",
  milliliter: "ml",
  milliliters: "ml",
  pcs: "pcs",
  pc: "pcs",
  piece: "pcs",
  pieces: "pcs",
  item: "pcs",
  items: "pcs",
  "шт": "pcs",
  "штука": "pcs",
  "штук": "pcs",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  "ч.л.": "tsp",
  "чл": "tsp",
  "чайная ложка": "tsp",
  "чайные ложки": "tsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  "ст.л.": "tbsp",
  "стл": "tbsp",
  "столовая ложка": "tbsp",
  "столовые ложки": "tbsp",
  serving: "serving",
  servings: "serving",
  portion: "serving",
  portions: "serving",
  "порция": "serving",
  "порции": "serving",
  "порций": "serving",
  slice: "slice",
  slices: "slice",
  "кусок": "slice",
  "куска": "slice",
  "кусочка": "slice",
  "кусочки": "slice"
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function normalizeUnitValue(unit: string | null | undefined): KnownUnit | null {
  if (!unit) {
    return null;
  }

  const normalized = unit.trim().toLowerCase();
  return UNIT_ALIASES[normalized] ?? null;
}

export function getUnitOptions(t: TranslateFn): Array<{ value: KnownUnit; label: string }> {
  return KNOWN_UNITS.map((unit) => ({
    value: unit,
    label: t(`units.option.${unit}`)
  }));
}

export function getLocalizedUnitLabel(t: TranslateFn, unit: string | null | undefined): string {
  const normalized = normalizeUnitValue(unit);
  if (!normalized) {
    return unit?.trim() || "";
  }

  return t(`units.short.${normalized}`);
}
