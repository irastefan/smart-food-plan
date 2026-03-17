import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Alert, Box, Button, CircularProgress, Grid, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { getRecipe, getRecipes } from "../features/recipes/api/recipesApi";
import type { RecipeCategoryKey, RecipeSummary } from "../features/recipes/model/recipeTypes";
import { useLanguage } from "../app/providers/LanguageProvider";
import { addRecipeToShoppingList } from "../features/shopping/api/shoppingApi";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { RecipeCard } from "../widgets/recipes/RecipeCard";
import { RecipeCategoryTabs } from "../widgets/recipes/RecipeCategoryTabs";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function RecipesPage() {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [shoppingStatus, setShoppingStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategoryKey>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setStatus(null);
        const list = await getRecipes();
        if (!cancelled) {
          setRecipes(list);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load recipes", error);
          setStatus(t("recipes.status.loadError"));
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
  }, [t]);

  const filteredRecipes = useMemo(() => {
    const term = query.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const categoryMatch = category === "all" ? true : recipe.category === category;
      const searchMatch =
        term.length === 0
          ? true
          : recipe.title.toLowerCase().includes(term) ||
            recipe.description?.toLowerCase().includes(term) ||
            recipe.category.toLowerCase().includes(term);

      return categoryMatch && searchMatch;
    });
  }, [category, query, recipes]);

  async function handleAddToShopping(recipe: RecipeSummary) {
    try {
      setShoppingStatus(null);
      const detail = await getRecipe(recipe.id);
      await addRecipeToShoppingList(detail);
      setShoppingStatus({ type: "success", message: t("shopping.status.addedFromRecipe") });
    } catch (error) {
      console.error("Failed to add recipe to shopping list", error);
      setShoppingStatus({ type: "error", message: t("shopping.status.addError") });
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: { xs: 10, md: 8 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("recipes.title")} subtitle={t("recipes.subtitle")} />

      <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.25, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("recipes.searchPlaceholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              )
            }}
          />
          <RecipeCategoryTabs value={category} onChange={setCategory} />
        </Stack>
      </Paper>

      {status ? <Alert severity="error">{status}</Alert> : null}
      {shoppingStatus ? <Alert severity={shoppingStatus.type}>{shoppingStatus.message}</Alert> : null}

      {isLoading ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Paper>
      ) : filteredRecipes.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 1.25, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{t("recipes.emptyTitle")}</Typography>
          <Typography color="text.secondary">{query ? t("recipes.emptySearch") : t("recipes.empty")}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredRecipes.map((recipe) => (
            <Grid key={recipe.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <RecipeCard recipe={recipe} onAddToShopping={handleAddToShopping} />
            </Grid>
          ))}
        </Grid>
      )}

      <Box
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
          zIndex: 1200
        }}
      >
        <Button component={RouterLink} to="/recipes/new" variant="contained" startIcon={<AddRoundedIcon />}>
          {t("recipes.add")}
        </Button>
      </Box>
    </Stack>
  );
}
