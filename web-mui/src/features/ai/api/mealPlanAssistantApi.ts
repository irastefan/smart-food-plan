import { listMcpTools } from "./mcpApi";
import { runAgentTurn, type AgentImageInput, type AgentMessage } from "./openaiAgentApi";
import { buildMealPlanAssistantPrompt } from "../model/mealPlanAssistantPrompt";
import type { AiAgentSettings } from "../../../shared/config/aiAgent";

export type MealPlanAssistantProposal = {
  name: string;
  amount: number;
  unit: string;
  kcal100: number;
  protein100: number;
  fat100: number;
  carbs100: number;
};

export type MealPlanAssistantResult = {
  assistantMessage: AgentMessage;
  proposal: MealPlanAssistantProposal | null;
  needsConfirmation: boolean;
};

function containsCyrillic(value: string): boolean {
  return /[А-Яа-яЁё]/.test(value);
}

function roundToWhole(value: number): number {
  return Math.round(value);
}

function buildPortionNutritionLine(message: string, proposal: MealPlanAssistantProposal): string {
  const factor = proposal.amount / 100;
  const calories = roundToWhole(proposal.kcal100 * factor);
  const protein = roundToWhole(proposal.protein100 * factor);
  const fat = roundToWhole(proposal.fat100 * factor);
  const carbs = roundToWhole(proposal.carbs100 * factor);
  const isRu = containsCyrillic(message) || containsCyrillic(proposal.name);

  if (isRu) {
    return `Порция ${roundToWhole(proposal.amount)} ${proposal.unit} · ${calories} ккал · Белки ${protein}г · Жиры ${fat}г · Углеводы ${carbs}г`;
  }

  return `Portion ${roundToWhole(proposal.amount)} ${proposal.unit} · ${calories} kcal · Protein ${protein}g · Fat ${fat}g · Carbs ${carbs}g`;
}

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

function sanitizeProposal(value: unknown): MealPlanAssistantProposal | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const name = typeof source.name === "string" ? source.name.trim() : "";
  if (!name) {
    return null;
  }

  const toNumber = (input: unknown) => {
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (typeof input === "string" && input.trim()) {
      const parsed = Number.parseFloat(input.replace(",", "."));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  return {
    name,
    amount: Math.max(0.1, toNumber(source.amount) || 100),
    unit: typeof source.unit === "string" && source.unit.trim() ? source.unit.trim() : "g",
    kcal100: Math.max(0, toNumber(source.kcal100)),
    protein100: Math.max(0, toNumber(source.protein100)),
    fat100: Math.max(0, toNumber(source.fat100)),
    carbs100: Math.max(0, toNumber(source.carbs100))
  };
}

function enrichMessageWithNutrition(message: string, proposal: MealPlanAssistantProposal | null): string {
  if (!proposal) {
    return message;
  }

  const normalized = message.toLowerCase();
  const nutritionLine = buildPortionNutritionLine(message, proposal);
  const alreadyHasPortionNutrition =
    (normalized.includes("protein") || normalized.includes("бел")) &&
    (normalized.includes("fat") || normalized.includes("жир")) &&
    (normalized.includes("carb") || normalized.includes("углев")) &&
    !normalized.includes("kcal/100") &&
    !normalized.includes("ккал/100") &&
    !normalized.includes("per 100") &&
    !normalized.includes("на 100");

  if (alreadyHasPortionNutrition) {
    return message;
  }

  return `${message}\n\n${nutritionLine}`;
}

export async function runMealPlanAssistant(input: {
  apiKey: string;
  model: string;
  history: AgentMessage[];
  sectionTitle: string;
  existingItems: string[];
  accessMode: AiAgentSettings["accessMode"];
  userText: string;
  userInstructions?: string;
  images?: AgentImageInput[];
}): Promise<MealPlanAssistantResult> {
  const tools = await listMcpTools();
  const result = await runAgentTurn({
    apiKey: input.apiKey,
    tools,
    history: input.history,
    userText: input.userText.trim() || "Suggest a suitable item for this slot.",
    images: input.images,
    model: input.model,
    userInstructions: input.userInstructions,
    systemPrompt: buildMealPlanAssistantPrompt({
      sectionTitle: input.sectionTitle,
      existingItems: input.existingItems,
      accessMode: input.accessMode,
      userInstructions: input.userInstructions
    })
  });

  const rawText = result.assistantMessage.text;
  const parsed = JSON.parse(extractJson(rawText)) as {
    message?: unknown;
    needsConfirmation?: unknown;
    proposal?: unknown;
  };

  const proposal = sanitizeProposal(parsed.proposal);
  const messageBase = typeof parsed.message === "string" && parsed.message.trim() ? parsed.message.trim() : rawText || "No response generated.";
  const message = enrichMessageWithNutrition(messageBase, proposal);
  const needsConfirmation = typeof parsed.needsConfirmation === "boolean"
    ? parsed.needsConfirmation
    : input.accessMode === "limited";

  return {
    assistantMessage: {
      ...result.assistantMessage,
      text: message
    },
    proposal,
    needsConfirmation
  };
}
