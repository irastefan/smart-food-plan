import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import { Box, Button, Card, Divider, IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "../../app/providers/LanguageProvider";
import type { MealPlanDay, MealPlanItem, MealPlanSection } from "../../features/meal-plan/api/mealPlanApi";
import { getLocalizedUnitLabel } from "../../shared/lib/units";
import { NutritionInlineSummary } from "../../shared/ui/NutritionInlineSummary";
import { ShoppingCategoryPickerButton } from "../shopping/ShoppingCategoryPickerButton";

type MealPlanSectionsCardProps = {
  day: MealPlanDay | null;
  shoppingCategories: string[];
  itemsLabel: string;
  servingsLabel: string;
  emptyLabel: string;
  title: string;
  subtitle: string;
  addLabel: string;
  editLabel: string;
  deleteLabel: string;
  onCreateShoppingCategory: (name: string) => Promise<void> | void;
  onAddItem: (sectionId: string, sectionTitle: string) => void;
  onDeleteItem: (sectionId: string, item: MealPlanItem) => void;
  onEditItem: (sectionId: string, sectionTitle: string, item: MealPlanItem) => void;
  onAddToShoppingItem: (sectionId: string, item: MealPlanItem, categoryName: string) => void;
  onSaveSectionAsRecipe: (section: MealPlanSection) => void;
  onCopySection: (section: MealPlanSection) => void;
  onAnalyzeSection: (section: MealPlanSection) => void;
};

function formatNumber(value: number): string {
  return String(Math.round(value));
}

function formatPortion(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function getItemHref(item: MealPlanItem): string | null {
  if (item.type === "product" && item.productId) {
    return `/products/${item.productId}`;
  }

  if (item.type === "recipe" && item.recipeId) {
    return `/recipes/${item.recipeId}`;
  }

  return null;
}

function getLocalizedSectionTitle(
  t: (key: string) => string,
  sectionId: string,
  fallbackTitle: string
): string {
  const key = `mealPlan.slot.${sectionId}`;
  const translated = t(key);
  return translated === key ? fallbackTitle : translated;
}

export function MealPlanSectionsCard({
  day,
  shoppingCategories,
  servingsLabel,
  emptyLabel,
  title,
  subtitle,
  addLabel,
  editLabel,
  deleteLabel,
  onCreateShoppingCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddToShoppingItem,
  onSaveSectionAsRecipe,
  onCopySection,
  onAnalyzeSection
}: MealPlanSectionsCardProps) {
  const { t } = useLanguage();
  const [menuState, setMenuState] = useState<{ sectionId: string; anchorEl: HTMLElement } | null>(null);

  const activeSection = day?.sections.find((section) => section.id === menuState?.sectionId) ?? null;

  return (
    <Stack spacing={2}>
      <Box sx={{ px: { xs: 0.5, md: 0 } }}>
        <Typography variant="h5" mb={0.5}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
          gap: 2
        }}
      >
        {day?.sections.map((section) => (
          <Card
            key={section.id}
            sx={{
              overflow: "hidden",
              height: "100%",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgba(31,36,54,0.98), rgba(24,29,44,0.98))"
                  : "linear-gradient(180deg, #ffffff, #f8fafc)"
            }}
          >
            {(() => {
              const sectionTitle = getLocalizedSectionTitle((key) => t(key as never), section.id, section.title);
              return (
                <>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" mb={0.5} sx={{ fontSize: { xs: "1.55rem", sm: "1.75rem" } }}>
                    {sectionTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${t("mealPlan.macro.protein")} ${formatNumber(section.totals.proteinG)}${t("units.short.g" as never)} · ${t("mealPlan.macro.fat")} ${formatNumber(section.totals.fatG)}${t("units.short.g" as never)} · ${t("mealPlan.macro.carbs")} ${formatNumber(section.totals.carbsG)}${t("units.short.g" as never)}`}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.45rem", sm: "1.65rem" } }}>
                  {formatNumber(section.totals.caloriesKcal)}
                </Typography>
              </Stack>
            </Box>

            <Divider />

            <Stack divider={<Divider />}>
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <Stack key={item.id} spacing={1.1} sx={{ px: 3, py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Typography
                        component={getItemHref(item) ? RouterLink : "span"}
                        to={getItemHref(item) ?? undefined}
                        variant="h6"
                        sx={{
                          wordBreak: "break-word",
                          minWidth: 0,
                          fontSize: { xs: "0.98rem", sm: "1.25rem" },
                          textDecoration: "none",
                          color: "text.primary",
                          "&:hover": getItemHref(item)
                            ? {
                                color: "primary.main"
                              }
                            : undefined
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography fontWeight={800} sx={{ flexShrink: 0 }}>
                        {formatNumber(item.nutritionTotal.caloriesKcal)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                      <NutritionInlineSummary
                        prefix={
                          item.type === "recipe"
                            ? `${formatPortion(item.servings ?? 1)} ${servingsLabel}`
                            : `${formatNumber(item.amount ?? 0)} ${getLocalizedUnitLabel((key) => t(key as never), item.unit ?? "g")}`
                        }
                        proteinG={item.nutritionTotal.proteinG}
                        fatG={item.nutritionTotal.fatG}
                        carbsG={item.nutritionTotal.carbsG}
                      />
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                        {item.type === "product" ? (
                          <ShoppingCategoryPickerButton
                            categories={shoppingCategories}
                            iconOnly
                            size="small"
                            tooltip={t("shopping.tooltip.addToList")}
                            startIcon={<AddShoppingCartRoundedIcon fontSize="small" />}
                            onAdd={(categoryName) => onAddToShoppingItem(section.id, item, categoryName)}
                            onCreateCategory={onCreateShoppingCategory}
                          />
                        ) : null}
                        <IconButton size="small" onClick={() => onEditItem(section.id, sectionTitle, item)} title={editLabel}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onDeleteItem(section.id, item)} title={deleteLabel}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                ))
              ) : (
                <Typography color="text.secondary" sx={{ px: 3, py: 2.5 }}>
                  {emptyLabel}
                </Typography>
              )}
            </Stack>

            <Divider />

            <Box sx={{ px: 3, py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Stack direction="row" spacing={1.75} alignItems="center">
                  <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddItem(section.id, sectionTitle)}>
                    {addLabel}
                  </Button>
                  {section.items.length > 0 ? (
                    <Tooltip title={t("mealPlan.analysis.tooltip.section", { section: sectionTitle })}>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<InsightsRoundedIcon fontSize="small" />}
                        onClick={() => onAnalyzeSection({ ...section, title: sectionTitle })}
                        sx={{ px: 1 }}
                      >
                        {t("mealPlan.actions.analyzeWithAi")}
                      </Button>
                    </Tooltip>
                  ) : null}
                </Stack>
                {section.items.length > 0 ? (
                  <IconButton
                    size="small"
                    onClick={(event) => setMenuState({ sectionId: section.id, anchorEl: event.currentTarget })}
                    title={t("mealPlan.actions.more")}
                  >
                    <MoreHorizRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>
            </Box>
                </>
              );
            })()}
          </Card>
        ))}
      </Box>

      <Menu
        anchorEl={menuState?.anchorEl ?? null}
        open={Boolean(menuState)}
        onClose={() => setMenuState(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem
          disabled={!activeSection || activeSection.items.length === 0}
          onClick={() => {
            if (activeSection) {
              onSaveSectionAsRecipe(activeSection);
            }
            setMenuState(null);
          }}
        >
          {t("mealPlan.actions.saveAsRecipe")}
        </MenuItem>
        <MenuItem
          disabled={!activeSection || activeSection.items.length === 0}
          onClick={() => {
            if (activeSection) {
              onCopySection(activeSection);
            }
            setMenuState(null);
          }}
        >
          {t("mealPlan.actions.copyMeal")}
        </MenuItem>
      </Menu>
    </Stack>
  );
}
