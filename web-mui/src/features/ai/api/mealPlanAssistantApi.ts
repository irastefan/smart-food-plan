import { listMcpTools } from "./mcpApi";
import { runAgentTurn, type AgentImageInput, type AgentMessage } from "./openaiAgentApi";
import { buildMealPlanAssistantPrompt } from "../model/mealPlanAssistantPrompt";
import type { Language } from "../../../shared/i18n/messages";

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
  items: MealPlanAssistantProposal[];
  needsConfirmation: boolean;
};

function containsCyrillic(value: string): boolean {
  return /[А-Яа-яЁё]/.test(value);
}

function roundToWhole(value: number): number {
  return Math.round(value);
}

function normalizeUnitKey(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "g" || normalized === "gr" || normalized === "gram" || normalized === "grams" || normalized === "г" || normalized === "гр") {
    return "g";
  }
  if (normalized === "ml" || normalized === "мл") {
    return "ml";
  }
  return normalized;
}

function isPerItemUnit(unit: string): boolean {
  const normalized = normalizeUnitKey(unit);
  return normalized !== "" && normalized !== "g" && normalized !== "gr" && normalized !== "gram" && normalized !== "grams" && normalized !== "ml";
}

function buildPortionNutritionLine(message: string, proposal: MealPlanAssistantProposal): string {
  const factor = isPerItemUnit(proposal.unit) ? proposal.amount : proposal.amount / 100;
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

function isPackagingUnit(unit: string): boolean {
  const normalized = unit.trim().toLowerCase();
  return [
    "bag",
    "bags",
    "pack",
    "packs",
    "package",
    "packages",
    "packet",
    "packets",
    "pkg",
    "пачка",
    "пачки",
    "пакет",
    "пакета",
    "упаковка",
    "упаковки"
  ].includes(normalized);
}

function extractWeightFromMessage(message: string): { amount: number; unit: "g" | "ml" } | null {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|gram|grams|г|гр|ml|мл)\b/i);
  if (!match) {
    return null;
  }

  const amount = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const rawUnit = match[2].toLowerCase();
  const unit = rawUnit === "ml" || rawUnit === "мл" ? "ml" : "g";
  return { amount, unit };
}

function normalizeProposalFromMessage(proposal: MealPlanAssistantProposal | null, message: string): MealPlanAssistantProposal | null {
  if (!proposal || !isPackagingUnit(proposal.unit)) {
    return proposal;
  }

  const detectedWeight = extractWeightFromMessage(message);
  if (!detectedWeight) {
    return proposal;
  }

  return {
    ...proposal,
    amount: detectedWeight.amount,
    unit: detectedWeight.unit
  };
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

function sanitizeProposalList(value: unknown): MealPlanAssistantProposal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => sanitizeProposal(entry))
    .filter((entry): entry is MealPlanAssistantProposal => Boolean(entry));
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
  userText: string;
  userInstructions?: string;
  images?: AgentImageInput[];
  responseLanguage: Language;
  onToolStart?: (toolName: string) => void;
  onToolEnd?: () => void;
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
    responseLanguage: input.responseLanguage,
    onToolStart: input.onToolStart,
    onToolEnd: input.onToolEnd,
    systemPrompt: buildMealPlanAssistantPrompt({
      sectionTitle: input.sectionTitle,
      existingItems: input.existingItems,
      responseLanguage: input.responseLanguage,
      userInstructions: input.userInstructions
    })
  });

  const rawText = result.assistantMessage.text;
  const parsed = JSON.parse(extractJson(rawText)) as {
    message?: unknown;
    needsConfirmation?: unknown;
    proposal?: unknown;
    items?: unknown;
  };

  const messageBase = typeof parsed.message === "string" && parsed.message.trim() ? parsed.message.trim() : rawText || "No response generated.";
  const proposal = normalizeProposalFromMessage(sanitizeProposal(parsed.proposal), messageBase);
  const items = proposal ? [] : sanitizeProposalList(parsed.items);
  const message = enrichMessageWithNutrition(messageBase, proposal);
  const needsConfirmation = typeof parsed.needsConfirmation === "boolean"
    ? parsed.needsConfirmation
    : true;

  return {
    assistantMessage: {
      ...result.assistantMessage,
      text: message
    },
    proposal,
    items,
    needsConfirmation
  };
}
