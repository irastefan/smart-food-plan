import { runAgentTurn } from "./openaiAgentApi";
import { buildMealPlanAnalysisPrompt } from "../model/mealPlanAnalysisPrompt";
import type { MealPlanDay, MealPlanSection } from "../../meal-plan/api/mealPlanApi";

type NutritionTargets = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

function round(value: number): number {
  return Math.round(value);
}

function serializeSection(section: MealPlanSection) {
  return {
    title: section.title,
    totals: {
      calories: round(section.totals.caloriesKcal),
      protein: round(section.totals.proteinG),
      fat: round(section.totals.fatG),
      carbs: round(section.totals.carbsG)
    },
    items: section.items.map((item) => ({
      title: item.title,
      type: item.type,
      amount: item.type === "recipe" ? item.servings ?? 1 : round(item.amount ?? 0),
      unit: item.type === "recipe" ? "servings" : item.unit ?? "g",
      calories: round(item.nutritionTotal.caloriesKcal),
      protein: round(item.nutritionTotal.proteinG),
      fat: round(item.nutritionTotal.fatG),
      carbs: round(item.nutritionTotal.carbsG)
    }))
  };
}

export async function runMealPlanNutritionAnalysis(input: {
  apiKey: string;
  model: string;
  scope: "day" | "section";
  label: string;
  responseLanguage: "en" | "ru";
  day?: MealPlanDay | null;
  section?: MealPlanSection | null;
  targets?: NutritionTargets;
  userInstructions?: string;
}): Promise<string> {
  const context =
    input.scope === "day"
      ? {
          date: input.day?.date,
          totals: {
            calories: round(input.day?.totals.caloriesKcal ?? 0),
            protein: round(input.day?.totals.proteinG ?? 0),
            fat: round(input.day?.totals.fatG ?? 0),
            carbs: round(input.day?.totals.carbsG ?? 0)
          },
          targets: input.targets,
          sections: (input.day?.sections ?? []).map(serializeSection)
        }
      : {
          label: input.label,
          section: input.section ? serializeSection(input.section) : null,
          dayTargets: input.targets
        };

  const result = await runAgentTurn({
    apiKey: input.apiKey,
    tools: [],
    history: [],
    userText: `Analyze this nutrition context and give a soft dietitian-style review:\n${JSON.stringify(context, null, 2)}`,
    model: input.model,
    userInstructions: input.userInstructions,
    systemPrompt: buildMealPlanAnalysisPrompt({
      scope: input.scope,
      label: input.label,
      responseLanguage: input.responseLanguage,
      userInstructions: input.userInstructions
    })
  });

  return result.assistantMessage.text;
}
