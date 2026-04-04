import { Navigate, createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../widgets/auth/AuthLayout";
import { DashboardLayout } from "../widgets/dashboard/DashboardLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { MealPlanDashboardPage } from "../pages/MealPlanDashboardPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { ProductEditorPage } from "../pages/ProductEditorPage";
import { ProductsPage } from "../pages/ProductsPage";
import { RecipeDetailsPage } from "../pages/RecipeDetailsPage";
import { RecipeEditorPage } from "../pages/RecipeEditorPage";
import { RecipesPage } from "../pages/RecipesPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ShoppingPage } from "../pages/ShoppingPage";
import { SelfCarePage } from "../pages/SelfCarePage";
import { ProtectedRoute, PublicOnlyRoute } from "./routerGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/welcome",
    element: <LandingPage />
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <LoginPage />
          },
          {
            path: "register",
            element: <RegisterPage />
          }
        ]
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "meal-plan",
            element: <MealPlanDashboardPage />
          },
          {
            path: "recipes",
            element: <RecipesPage />
          },
          {
            path: "recipes/new",
            element: <RecipeEditorPage />
          },
          {
            path: "recipes/:recipeId",
            element: <RecipeDetailsPage />
          },
          {
            path: "recipes/:recipeId/edit",
            element: <RecipeEditorPage />
          },
          {
            path: "products",
            element: <ProductsPage />
          },
          {
            path: "products/new",
            element: <ProductEditorPage />
          },
          {
            path: "products/:productId",
            element: <ProductDetailsPage />
          },
          {
            path: "products/:productId/edit",
            element: <ProductEditorPage />
          },
          {
            path: "shopping",
            element: <ShoppingPage />
          },
          {
            path: "self-care",
            element: <SelfCarePage />
          },
          {
            path: "ai-agent",
            element: <Navigate to="/meal-plan" replace />
          },
          {
            path: "settings",
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
], {
  basename: import.meta.env.BASE_URL
});
