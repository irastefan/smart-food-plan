import { listMcpTools } from "./mcpApi";
import { runAgentTurn, type AgentImageInput, type AgentMessage } from "./openaiAgentApi";
import { buildRecipeAssistantPrompt } from "../model/recipeAssistantPrompt";
import type { RecipeDetail, RecipeFormIngredient, RecipeFormValues } from "../../recipes/model/recipeTypes";
import { normalizeRecipeCategory } from "../../recipes/model/recipeCategories";

export type RecipeAssistantDraft = RecipeFormValues;

export type RecipeAssistantResult = {
  assistantMessage: AgentMessage;
  draft: RecipeAssistantDraft | null;
  needsConfirmation: boolean;
  intent: "create" | "update";
};

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

function toNumber(input: unknown, fallback = 0): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string" && input.trim()) {
    const parsed = Number.parseFloat(input.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sanitizeDraft(value: unknown): RecipeAssistantDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const title = typeof source.title === "string" ? source.title.trim() : "";
  if (!title) {
    return null;
  }

  const ingredientsSource = Array.isArray(source.ingredients) ? source.ingredients : [];
  const ingredients: RecipeFormIngredient[] = [];

  ingredientsSource.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const item = entry as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) {
      return;
    }

    ingredients.push({
      id: String(crypto.randomUUID()),
      isManual: true,
      name,
      amount: Math.max(0.1, toNumber(item.amount, 100)),
      unit: typeof item.unit === "string" && item.unit.trim() ? item.unit.trim() : "g",
      kcal100: Math.max(0, toNumber(item.kcal100)),
      protein100: Math.max(0, toNumber(item.protein100)),
      fat100: Math.max(0, toNumber(item.fat100)),
      carbs100: Math.max(0, toNumber(item.carbs100))
    });
  });

  if (!ingredients.length) {
    return null;
  }

  const steps = (Array.isArray(source.steps) ? source.steps : [])
    .map((step) => (typeof step === "string" ? step.trim() : ""))
    .filter(Boolean);

  return {
    title,
    description: typeof source.description === "string" ? source.description.trim() : "",
    category: String(normalizeRecipeCategory(typeof source.category === "string" ? source.category : "main")),
    servings: Math.max(1, Math.round(toNumber(source.servings, 2))),
    ingredients,
    steps: steps.length > 0 ? steps : [""]
  };
}

export async function runRecipeAssistant(input: {
  apiKey: string;
  model: string;
  history: AgentMessage[];
  userText: string;
  userInstructions?: string;
  images?: AgentImageInput[];
  currentRecipe?: RecipeDetail | null;
}): Promise<RecipeAssistantResult> {
  const tools = await listMcpTools();
  const result = await runAgentTurn({
    apiKey: input.apiKey,
    tools,
    history: input.history,
    userText: input.userText.trim() || "Help me create a recipe draft.",
    images: input.images,
    model: input.model,
    userInstructions: input.userInstructions,
    systemPrompt: buildRecipeAssistantPrompt({
      userInstructions: input.userInstructions,
      currentRecipe: input.currentRecipe
    })
  });

  const rawText = result.assistantMessage.text;
  const parsed = JSON.parse(extractJson(rawText)) as {
    message?: unknown;
    needsConfirmation?: unknown;
    intent?: unknown;
    draft?: unknown;
  };

  const draft = sanitizeDraft(parsed.draft);
  const message =
    typeof parsed.message === "string" && parsed.message.trim()
      ? parsed.message.trim()
      : rawText || "No response generated.";

  return {
    assistantMessage: {
      ...result.assistantMessage,
      text: message
    },
    draft,
    needsConfirmation: typeof parsed.needsConfirmation === "boolean" ? parsed.needsConfirmation : true,
    intent: parsed.intent === "update" ? "update" : "create"
  };
}
