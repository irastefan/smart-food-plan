import type { Language } from "../../../shared/i18n/messages";
import { getAiLanguageName } from "../../../shared/i18n/languages";
import type { MealPlanDay } from "../../meal-plan/api/mealPlanApi";

export function buildMealPlanPageAssistantPrompt(input: {
  date: string;
  day: MealPlanDay | null;
  responseLanguage: Language;
  userInstructions?: string;
}): string {
  const snapshot = input.day
    ? JSON.stringify({
        date: input.day.date,
        totals: input.day.totals,
        sections: input.day.sections.map((section) => ({
          title: section.title,
          totals: section.totals,
          items: section.items.map((item) => ({
            title: item.title,
            type: item.type,
            isManual: item.isManual,
            amount: item.amount,
            unit: item.unit,
            servings: item.servings,
            nutritionTotal: item.nutritionTotal
          }))
        }))
      })
    : "No meal plan data is loaded for this date yet.";

  return [
    "You are the SmartFood Meal Plan assistant.",
    `The selected date is ${input.date}.`,
    "You work specifically with the user's meal plan screen.",
    "Help the user analyze the day, improve meal composition, suggest edits, suggest missing meals, or explain macro balance.",
    `Write the response in ${getAiLanguageName(input.responseLanguage)}.`,
    "Do not pretend that you already changed the meal plan unless a tool actually did it.",
    "Prefer concise, practical answers with clear food suggestions.",
    "When suggesting foods, include rough calories, protein, fat, and carbs for the proposed portion if helpful.",
    "Use the meal plan snapshot below as the source of truth.",
    `Meal plan snapshot: ${snapshot}`,
    input.userInstructions?.trim() ? `Additional user instructions: ${input.userInstructions.trim()}` : ""
  ].filter(Boolean).join(" ");
}
