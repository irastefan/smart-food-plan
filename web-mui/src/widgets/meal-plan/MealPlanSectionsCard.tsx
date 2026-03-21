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

function getItemHref(item: MealPlanItem): string | null {
  if (item.type === "product" && item.productId) {
    return `/products/${item.productId}`;
  }

  if (item.type === "recipe" && item.recipeId) {
    return `/recipes/${item.recipeId}`;
  }

  return null;
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
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" mb={0.5} sx={{ fontSize: { xs: "1.55rem", sm: "1.75rem" } }}>
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${t("mealPlan.macro.protein")} ${formatNumber(section.totals.proteinG)}g · ${t("mealPlan.macro.fat")} ${formatNumber(section.totals.fatG)}g · ${t("mealPlan.macro.carbs")} ${formatNumber(section.totals.carbsG)}g`}
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.72rem", sm: "0.82rem" }, minWidth: 0 }}
                      >
                        {`${
                          item.type === "recipe"
                            ? `${formatNumber(item.servings ?? 1)} ${servingsLabel}`
                            : `${formatNumber(item.amount ?? 0)} ${item.unit ?? "g"}`
                        } · ${t("mealPlan.macro.protein")} ${formatNumber(item.nutritionTotal.proteinG)}g · ${t("mealPlan.macro.fat")} ${formatNumber(item.nutritionTotal.fatG)}g · ${t("mealPlan.macro.carbs")} ${formatNumber(item.nutritionTotal.carbsG)}g`}
                      </Typography>
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
                        <IconButton size="small" onClick={() => onEditItem(section.id, section.title, item)} title={editLabel}>
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
                  <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => onAddItem(section.id, section.title)}>
                    {addLabel}
                  </Button>
                  <Tooltip title={t("mealPlan.analysis.tooltip.section", { section: section.title })}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<InsightsRoundedIcon fontSize="small" />}
                      onClick={() => onAnalyzeSection(section)}
                      sx={{ px: 1 }}
                    >
                      {t("mealPlan.actions.analyzeWithAi")}
                    </Button>
                  </Tooltip>
                </Stack>
                <IconButton
                  size="small"
                  onClick={(event) => setMenuState({ sectionId: section.id, anchorEl: event.currentTarget })}
                  title={t("mealPlan.actions.more")}
                >
                  <MoreHorizRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
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
