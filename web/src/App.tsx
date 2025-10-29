import { AppShell } from "@/components/AppShell";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useHashNavigation } from "@/routes/navigation";
import { AddProductScreen } from "@/screens/AddProductScreen";
import { AddRecipeScreen } from "@/screens/AddRecipeScreen";
import { AddRecipeToDayScreen } from "@/screens/AddRecipeToDayScreen";
import { MealPlanDayScreen } from "@/screens/MealPlanDayScreen";
import { OnboardingVaultScreen } from "@/screens/OnboardingVaultScreen";
import { ProductLibraryScreen } from "@/screens/ProductLibraryScreen";
import { ProductScreen } from "@/screens/ProductScreen";
import { RecipeScreen } from "@/screens/RecipeScreen";
import { RecipesListScreen } from "@/screens/RecipesListScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

function App(): JSX.Element {
  const { route, navigate } = useHashNavigation();

  const content = (() => {
    switch (route) {
      case "meal-plan":
        return (
          <MealPlanDayScreen
            onNavigateToAddFood={() => navigate("add-recipe-to-day")}
            onNavigateToProducts={() => navigate("products")}
            onNavigateToRecipes={() => navigate("recipes")}
            onNavigateToRecipe={() => navigate("recipe")}
            onNavigateToProduct={() => navigate("product")}
          />
        );
      case "add-recipe-to-day":
        return (
          <AddRecipeToDayScreen
            onNavigateBack={() => navigate("meal-plan")}
            onNavigateToRecipe={() => navigate("recipe")}
          />
        );
      case "recipes":
        return (
          <RecipesListScreen
            onNavigateAddRecipe={() => navigate("add-recipe")}
            onNavigateViewRecipe={() => navigate("recipe")}
          />
        );
      case "add-recipe":
        return <AddRecipeScreen onSaved={() => navigate("recipes")} />;
      case "recipe":
        return (
          <RecipeScreen
            onNavigateEdit={() => navigate("add-recipe")}
            onNavigateAddToDay={() => navigate("add-recipe-to-day")}
            onNavigateBackToPlan={() => navigate("meal-plan")}
          />
        );
      case "products":
        return (
          <ProductLibraryScreen
            onNavigateAddProduct={() => navigate("add-product")}
            onNavigateViewProduct={() => navigate("product")}
          />
        );
      case "product":
        return (
          <ProductScreen
            onNavigateEdit={() => navigate("add-product")}
            onNavigateBackToPlan={() => navigate("meal-plan")}
          />
        );
      case "onboarding":
        return <OnboardingVaultScreen />;
      case "add-product":
      default:
        return <AddProductScreen />;
    }
  })();

  return (
    <I18nProvider>
      <ThemeProvider>
        <AppShell currentRoute={route} onNavigate={navigate}>
          {content}
        </AppShell>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
