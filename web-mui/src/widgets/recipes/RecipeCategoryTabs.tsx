import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { recipeCategoryKeys } from "../../features/recipes/model/recipeCategories";
import type { RecipeCategoryKey } from "../../features/recipes/model/recipeTypes";
import { useLanguage } from "../../app/providers/LanguageProvider";

type RecipeCategoryTabsProps = {
  value: RecipeCategoryKey;
  onChange: (value: RecipeCategoryKey) => void;
};

export function RecipeCategoryTabs({ value, onChange }: RecipeCategoryTabsProps) {
  const { t } = useLanguage();

  return (
    <Stack sx={{ overflowX: "auto", pb: 0.5 }}>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_event, nextValue: RecipeCategoryKey | null) => {
          if (nextValue) {
            onChange(nextValue);
          }
        }}
        sx={{
          width: "max-content",
          p: 0.75,
          gap: 0.75,
          borderRadius: 2,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) => theme.shadows[1]
        }}
      >
        {recipeCategoryKeys.map((category) => (
          <ToggleButton
            key={category}
            value={category}
            sx={{
              px: 2,
              py: 1,
              border: "none",
              borderRadius: 2,
              color: "text.secondary",
              fontWeight: 700,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&.Mui-selected": {
                background: "linear-gradient(135deg, rgba(96,213,176,0.18), rgba(14,165,233,0.12))",
                color: "text.primary",
                boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.24)"
              }
            }}
          >
            {t(`recipes.categories.${category}` as never)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}
