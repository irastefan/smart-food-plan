import { recipeCategoryKeys } from "../../features/recipes/model/recipeCategories";
import type { RecipeCategoryKey } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { FilterChipRow } from "../../shared/ui/FilterChipRow";

type RecipeCategoryTabsProps = {
  value: RecipeCategoryKey;
  onChange: (value: RecipeCategoryKey) => void;
};

export function RecipeCategoryTabs({ value, onChange }: RecipeCategoryTabsProps) {
  const { t } = useLanguage();

  return (
    <FilterChipRow
      value={value}
      onChange={(nextValue) => onChange(nextValue as RecipeCategoryKey)}
      items={recipeCategoryKeys.map((category) => ({
        value: category,
        label: t(`recipes.categories.${category}` as never)
      }))}
    />
  );
}
