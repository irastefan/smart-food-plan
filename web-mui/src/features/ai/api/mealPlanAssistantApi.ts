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
  const alreadyHasNutrition =
    normalized.includes("kcal") ||
    normalized.includes("кал") ||
    normalized.includes("protein") ||
    normalized.includes("бел") ||
    normalized.includes("fat") ||
    normalized.includes("жир") ||
    normalized.includes("carb") ||
    normalized.includes("углев");

  if (alreadyHasNutrition) {
    return message;
  }

  return `${message}\n\n${proposal.amount} ${proposal.unit} · ${proposal.kcal100} kcal/100 · Protein ${proposal.protein100}g · Fat ${proposal.fat100}g · Carbs ${proposal.carbs100}g`;
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
