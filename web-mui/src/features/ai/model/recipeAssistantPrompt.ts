import type { Language } from "../../../shared/i18n/messages";
import { getAiLanguageName } from "../../../shared/i18n/languages";
import type { RecipeDetail } from "../../recipes/model/recipeTypes";

function buildRecipeSnapshot(recipe: RecipeDetail): string {
  return JSON.stringify({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ingredient) => ({
      title: ingredient.title,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      nutrition: ingredient.totals
    })),
    steps: recipe.steps
  });
}

export function buildRecipeAssistantPrompt(input: { userInstructions?: string; currentRecipe?: RecipeDetail | null; responseLanguage: Language }): string {
  return [
    "You are a recipe creation assistant inside SmartFood.",
    input.currentRecipe
      ? "You are currently working inside a specific recipe page and may need to modify the current recipe."
      : "You are currently working inside the recipes page and may need to create a new recipe.",
    "Your job is to turn the user's message or food photo into a practical recipe draft.",
    `Write the response message in ${getAiLanguageName(input.responseLanguage)}.`,
    "If the user provides a dish idea, ingredient list, spoken dictation, or photo, propose a realistic recipe draft.",
    "When the user sends a photo, identify the likely dish and infer a practical home-style recipe from it.",
    input.currentRecipe
      ? "If the user refers to this recipe, asks to improve it, change ingredients, update servings, rewrite steps, or alter nutrition, prepare an updated draft for the current recipe."
      : "If the user asks for a recipe idea or food photo conversion, prepare a new recipe draft.",
    "If some details are missing, make reasonable assumptions instead of blocking, unless the dish is too ambiguous.",
    "Use a concise assistant message that explains what draft you prepared.",
    "The recipe draft should contain: title, short description, category, servings, ingredients, and steps.",
    "All ingredients in the draft must be manual ingredients, not linked products.",
    "For each ingredient, return per-100 nutrition estimates as kcal100, protein100, fat100, carbs100.",
    "Ingredient names should be clean and user-facing.",
    "Use one of these recipe categories: breakfast, lunch, dinner, snack, dessert, salad, soup, main, side, drink.",
    "If the best category is unclear, use main.",
    "Prefer a small practical number of ingredients and short step list.",
    "If the user asks for a rough draft, make sensible assumptions and do not ask unnecessary follow-up questions.",
    "Only ask a short clarifying question if the request is too ambiguous to produce a useful draft.",
    "You must return JSON only, with no markdown.",
    "JSON shape:",
    '{"message":"string","needsConfirmation":true,"intent":"create","draft":{"title":"string","description":"string","category":"main","servings":2,"ingredients":[{"name":"string","amount":100,"unit":"g","kcal100":100,"protein100":10,"fat100":5,"carbs100":15}],"steps":["string"]}|null}',
    input.currentRecipe
      ? 'If the user is modifying the current recipe, set intent="update". Otherwise set intent="create".'
      : 'Set intent="create" unless a current recipe context is explicitly provided.',
    "Use draft=null if you only need clarification and cannot create a useful draft yet.",
    input.currentRecipe ? `Current recipe snapshot: ${buildRecipeSnapshot(input.currentRecipe)}` : "",
    input.userInstructions?.trim() ? `Additional user instructions: ${input.userInstructions.trim()}` : ""
  ].filter(Boolean).join(" ");
}
