import { AppShell } from "@/components/AppShell";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useHashNavigation } from "@/routes/navigation";
import { AddProductScreen } from "@/screens/AddProductScreen";
import { MealPlanDayScreen } from "@/screens/MealPlanDayScreen";
import { OnboardingVaultScreen } from "@/screens/OnboardingVaultScreen";
import { ProductLibraryScreen } from "@/screens/ProductLibraryScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

function App(): JSX.Element {
  const { route, navigate } = useHashNavigation();

  const content = (() => {
    switch (route) {
      case "products":
        return <ProductLibraryScreen onNavigateAddProduct={() => navigate("add-product")} />;
      case "meal-plan":
        return <MealPlanDayScreen onNavigateToProducts={() => navigate("products")} />;
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
