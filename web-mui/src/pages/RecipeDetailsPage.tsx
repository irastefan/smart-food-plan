import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Alert, Box, Button, CircularProgress, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { deleteRecipe, getRecipe } from "../features/recipes/api/recipesApi";
import { getRecipeCategoryLabel } from "../features/recipes/model/recipeCategories";
import type { RecipeDetail } from "../features/recipes/model/recipeTypes";
import { useLanguage } from "../app/providers/LanguageProvider";
import { addShoppingCategory, addShoppingItem, getShoppingList } from "../features/shopping/api/shoppingApi";
import { isRtlLanguage } from "../shared/i18n/languages";
import { getLocalizedUnitLabel } from "../shared/lib/units";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { RecipeAssistantDialog } from "../widgets/recipes/RecipeAssistantDialog";
import { RecipeHero } from "../widgets/recipes/RecipeHero";
import { RecipeNutritionCard } from "../widgets/recipes/RecipeNutritionCard";
import { ShoppingCategoryPickerButton } from "../widgets/shopping/ShoppingCategoryPickerButton";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageAgentAction: (action: (() => void) | null) => void;
  clearPageAgentAction: () => void;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function RecipeDetailsPage() {
  const { recipeId } = useParams();
  const { t, language } = useLanguage();
  const isRtl = isRtlLanguage(language);
  const navigate = useNavigate();
  const { openSidebar, registerPageAgentAction, clearPageAgentAction, registerPageLoading, clearPageLoading } = useOutletContext<LayoutContext>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [shoppingCategories, setShoppingCategories] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    registerPageAgentAction(() => setAssistantOpen(true));
    return () => {
      clearPageAgentAction();
    };
  }, [clearPageAgentAction, registerPageAgentAction]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!recipeId) {
        return;
      }
      try {
        setIsLoading(true);
        setStatus(null);
        const detail = await getRecipe(recipeId);
        if (!cancelled) {
          setRecipe(detail);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load recipe", error);
          setStatus(t("recipe.status.loadError"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [recipeId, t]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadShoppingCategories() {
      try {
        const list = await getShoppingList();
        if (!cancelled) {
          setShoppingCategories(list.categories.map((category) => category.name));
        }
      } catch (error) {
        console.error("Failed to load shopping categories", error);
      }
    }

    void loadShoppingCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Paper sx={{ p: 8, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (status || !recipe) {
    return <Alert severity="error">{status ?? t("recipe.status.loadError")}</Alert>;
  }

  async function handleAddIngredientToShopping(
    ingredient: RecipeDetail["ingredients"][number],
    categoryName: string
  ) {
    await addShoppingItem({
      productId: ingredient.productId,
      customName: ingredient.productId ? undefined : ingredient.title,
      amount: ingredient.quantity,
      unit: ingredient.unit,
      categoryName
    });
  }

  async function handleCreateShoppingCategory(name: string) {
    await addShoppingCategory(name);
    setShoppingCategories((current) => Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b)));
  }

  async function handleDelete() {
    if (!recipe) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRecipe(recipe.id);
      navigate("/recipes");
    } catch (error) {
      console.error("Failed to delete recipe", error);
      setStatus(t("recipe.status.deleteError"));
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <Stack spacing={3}>
      <DashboardTopbar
        onOpenSidebar={openSidebar}
        title={recipe.title}
        subtitle={recipe.description || t("recipe.noDescription")}
      />

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Button component={RouterLink} to="/recipes" startIcon={isRtl ? <ArrowForwardRoundedIcon /> : <ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>
          {t("recipe.back")}
        </Button>
      </Stack>
      <RecipeHero
        recipe={recipe}
        onEdit={recipe.isPublic ? undefined : () => navigate(`/recipes/${recipe.id}/edit`)}
        onDelete={recipe.isPublic ? undefined : () => setDeleteOpen(true)}
      />

      <Stack direction={{ xs: "column", xl: "row" }} spacing={3} alignItems="stretch">
        <Stack spacing={3} sx={{ flex: 1.3, minWidth: 0 }}>
          <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={2.5}>
              <Typography variant="h5" fontWeight={800}>{t("recipe.ingredients")}</Typography>
              <List disablePadding>
                {recipe.ingredients.map((ingredient, index) => (
                  <Box key={ingredient.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListItem disableGutters sx={{ py: 1.75 }}>
                      <ListItemText
                        primary={ingredient.title}
                        secondary={`${ingredient.quantity} ${getLocalizedUnitLabel((key) => t(key as never), ingredient.unit)}`}
                        primaryTypographyProps={{ fontWeight: 700 }}
                        secondaryTypographyProps={{ color: "text.secondary" }}
                      />
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Typography color="text.secondary">{Math.round(ingredient.totals.caloriesKcal)} kcal</Typography>
                        <ShoppingCategoryPickerButton
                          categories={shoppingCategories}
                          iconOnly
                          tooltip={t("shopping.tooltip.addToList")}
                          startIcon={<AddShoppingCartRoundedIcon />}
                          size="small"
                          onAdd={(categoryName) => handleAddIngredientToShopping(ingredient, categoryName)}
                          onCreateCategory={handleCreateShoppingCategory}
                        />
                      </Stack>
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={2.5}>
              <Typography variant="h5" fontWeight={800}>{t("recipe.steps")}</Typography>
              <Stack spacing={1.75}>
                {recipe.steps.map((step, index) => (
                  <Stack key={`step-${index}`} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(96,213,176,0.18), rgba(14,165,233,0.12))", color: "primary.main", fontWeight: 800, flexShrink: 0 }}>
                      {index + 1}
                    </Box>
                    <Typography sx={{ pt: 0.5 }}>{step}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={3} sx={{ flex: 0.9, minWidth: { xl: 340 } }}>
          <RecipeNutritionCard totals={recipe.nutritionPerServing} />
          <Paper sx={{ p: 3, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={1.5}>
              <Typography variant="h5" fontWeight={800}>{t("recipe.summary")}</Typography>
              <SummaryRow label={t("recipe.servingsLabel")} value={String(recipe.servings)} />
              <SummaryRow label={t("recipe.categoryLabel")} value={getRecipeCategoryLabel(recipe.category, t)} />
              {recipe.cookTimeMinutes ? <SummaryRow label={t("recipe.cookingTime")} value={t("recipes.minutes", { value: recipe.cookTimeMinutes })} /> : null}
              <SummaryRow label={t("recipe.totalCalories")} value={`${Math.round(recipe.nutritionTotal.caloriesKcal)} kcal`} />
            </Stack>
          </Paper>
        </Stack>
      </Stack>

      {recipe.isPublic ? null : (
        <ConfirmActionDialog
          open={deleteOpen}
          title={t("recipe.delete")}
          message={t("recipe.confirmDelete", { name: recipe.title })}
          isSubmitting={isDeleting}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      )}

      <RecipeAssistantDialog
        open={assistantOpen}
        recipe={recipe}
        onRecipeChanged={setRecipe}
        onClose={() => setAssistantOpen(false)}
      />
    </Stack>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={700} textAlign="right">{value}</Typography>
    </Stack>
  );
}
