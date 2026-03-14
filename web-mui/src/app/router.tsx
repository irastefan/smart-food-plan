import { Navigate, createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "../widgets/auth/AuthLayout";
import { DashboardLayout } from "../widgets/dashboard/DashboardLayout";
import { LoginPage } from "../pages/LoginPage";
import { MealPlanDashboardPage } from "../pages/MealPlanDashboardPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { ProductEditorPage } from "../pages/ProductEditorPage";
import { ProductsPage } from "../pages/ProductsPage";
import { AiAgentPage } from "../pages/AiAgentPage";
import { RecipeDetailsPage } from "../pages/RecipeDetailsPage";
import { RecipeEditorPage } from "../pages/RecipeEditorPage";
import { RecipesPage } from "../pages/RecipesPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ShoppingPage } from "../pages/ShoppingPage";
import { ProtectedRoute, PublicOnlyRoute } from "./routerGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicOnlyRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />
      },
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
            path: "ai-agent",
            element: <AiAgentPage />
          },
          {
            path: "settings",
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
]);
