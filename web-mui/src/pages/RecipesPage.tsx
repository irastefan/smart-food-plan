import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { Alert, CircularProgress, Grid, InputAdornment, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { deleteRecipe, getRecipes } from "../features/recipes/api/recipesApi";
import type { RecipeCategoryKey, RecipeSummary } from "../features/recipes/model/recipeTypes";
import { useLanguage } from "../app/providers/LanguageProvider";
import { ConfirmActionDialog } from "../shared/ui/ConfirmActionDialog";
import { PageActionButton } from "../shared/ui/PageActionButton";
import { PageTitle } from "../shared/ui/PageTitle";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";
import { RecipeAssistantDialog } from "../widgets/recipes/RecipeAssistantDialog";
import { RecipeCard } from "../widgets/recipes/RecipeCard";
import { RecipeCategoryTabs } from "../widgets/recipes/RecipeCategoryTabs";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
  registerPageAgentAction: (action: (() => void) | null) => void;
  clearPageAgentAction: () => void;
  registerPageAddAction: (action: (() => void) | null) => void;
  clearPageAddAction: () => void;
  registerPageLoading: (value: boolean) => void;
  clearPageLoading: () => void;
};

export function RecipesPage() {
  const { t } = useLanguage();
  const { openSidebar, registerPageAgentAction, clearPageAgentAction, registerPageAddAction, clearPageAddAction, registerPageLoading, clearPageLoading } =
    useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategoryKey>("all");
  const [deleteTarget, setDeleteTarget] = useState<RecipeSummary | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    registerPageAgentAction(() => setAssistantOpen(true));
    return () => {
      clearPageAgentAction();
    };
  }, [clearPageAgentAction, registerPageAgentAction]);

  useEffect(() => {
    registerPageAddAction(() => navigate("/recipes/new"));
    return () => {
      clearPageAddAction();
    };
  }, [clearPageAddAction, navigate, registerPageAddAction]);

  useEffect(() => {
    registerPageLoading(isLoading);
    return () => {
      clearPageLoading();
    };
  }, [clearPageLoading, isLoading, registerPageLoading]);

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
          setStatus({ type: "error", message: t("recipes.status.loadError") });
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

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteRecipe(deleteTarget.id);
      setRecipes((current) => current.filter((recipe) => recipe.id !== deleteTarget.id));
      setStatus({ type: "success", message: t("recipe.status.deleted") });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete recipe", error);
      setStatus({ type: "error", message: t("recipe.status.deleteError") });
    }
  }

  return (
    <Stack spacing={3} sx={{ pb: { xs: 10, md: 8 } }}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t("recipes.title")} subtitle={t("recipes.subtitle")} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <PageTitle title={t("recipes.title")} />
        {isDesktop ? (
          <Stack direction="row" spacing={1}>
            <PageActionButton icon={<AddRoundedIcon fontSize="small" />} label={t("recipes.add")} onClick={() => navigate("/recipes/new")} />
            <PageActionButton icon={<SmartToyRoundedIcon fontSize="small" />} label={t("recipe.ai.title")} onClick={() => setAssistantOpen(true)} variant="agent" />
          </Stack>
        ) : null}
      </Stack>

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

      {status ? <Alert severity={status.type}>{status.message}</Alert> : null}

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
              <RecipeCard recipe={recipe} onDelete={recipe.isPublic ? undefined : setDeleteTarget} />
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        title={t("recipe.delete")}
        message={t("recipe.confirmDelete", { name: deleteTarget?.title ?? "" })}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <RecipeAssistantDialog open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </Stack>
  );
}
