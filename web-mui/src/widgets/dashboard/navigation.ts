import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

export const dashboardNavigation = [
  {
    id: "meal-plan",
    labelKey: "nav.mealPlan",
    path: "/meal-plan",
    icon: CalendarMonthRoundedIcon
  },
  {
    id: "recipes",
    labelKey: "nav.recipes",
    path: "/recipes",
    icon: MenuBookRoundedIcon
  },
  {
    id: "products",
    labelKey: "nav.products",
    path: "/products",
    icon: Inventory2RoundedIcon
  },
  {
    id: "shopping",
    labelKey: "nav.shopping",
    path: "/shopping",
    icon: ShoppingCartRoundedIcon
  },
  {
    id: "ai-agent",
    labelKey: "nav.aiAgent",
    path: "/ai-agent",
    icon: SmartToyRoundedIcon
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    path: "/settings",
    icon: SettingsRoundedIcon
  }
] as const;

export type DashboardNavigationId = typeof dashboardNavigation[number]["id"];
