import type { AgentImageInput, AgentMessage } from "./openaiAgentApi";
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

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function extractResponseText(payload: OpenAiResponse): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputText = (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

  return outputText;
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
  sectionTitle: string;
  existingItems: string[];
  accessMode: AiAgentSettings["accessMode"];
  userText: string;
  userInstructions?: string;
  images?: AgentImageInput[];
}): Promise<MealPlanAssistantResult> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.model?.trim() || "gpt-5-mini",
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: buildMealPlanAssistantPrompt({
            sectionTitle: input.sectionTitle,
            existingItems: input.existingItems,
            accessMode: input.accessMode,
            userInstructions: input.userInstructions
          })
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: input.userText.trim() || "Suggest a suitable item for this slot." },
            ...(input.images ?? []).map((image) => ({
              type: "input_image" as const,
              image_url: image.dataUrl,
              detail: "auto" as const
            }))
          ]
        }
      ]
    })
  });

  const payload = (await response.json()) as OpenAiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message?.trim() || "Meal plan AI request failed.");
  }

  const rawText = extractResponseText(payload);
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
      id: crypto.randomUUID(),
      role: "assistant",
      text: message
    },
    proposal,
    needsConfirmation
  };
}
