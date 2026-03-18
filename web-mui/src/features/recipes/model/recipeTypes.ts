export type NutritionTotals = {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

export type RecipeIngredient = {
  id: string;
  productId?: string;
  title: string;
  quantity: number;
  unit: string;
  referenceAmount: number;
  referenceUnit: string;
  macros: NutritionTotals;
  totals: NutritionTotals;
};

export type RecipeSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  category: string;
  servings: number;
  nutritionTotal: NutritionTotals;
  nutritionPerServing: NutritionTotals;
  photoUrl?: string;
  cookTimeMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type RecipeDetail = RecipeSummary & {
  steps: string[];
  ingredients: RecipeIngredient[];
};

export type RecipeFormIngredient = {
  id: string;
  productId: string;
  amount: number;
  unit: string;
};

export type RecipeFormValues = {
  title: string;
  description: string;
  category: string;
  servings: number;
  steps: string[];
  ingredients: RecipeFormIngredient[];
};

export type RecipeCategoryKey =
  | "all"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "dessert"
  | "salad"
  | "soup"
  | "main"
  | "side"
  | "drink";
