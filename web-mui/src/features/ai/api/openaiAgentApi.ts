import { callMcpTool, type McpTool } from "./mcpApi";
import { buildAgentSystemPrompt } from "../model/agentSystemPrompt";
import type { Language } from "../../../shared/i18n/messages";

export type AgentMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  toolName?: string;
  toolAction?: AgentToolAction;
  toolEntity?: string | null;
  images?: AgentImageInput[];
};

export type AgentToolAction =
  | "add"
  | "remove"
  | "update"
  | "create"
  | "analyze"
  | "copy"
  | "load"
  | "generic";

export type AgentImageInput = {
  name: string;
  dataUrl: string;
};

type OpenAiResponse = {
  id?: string;
  output_text?: string;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
  output?: Array<{
    type?: string;
    name?: string;
    arguments?: string;
    call_id?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type AgentResult = {
  assistantMessage: AgentMessage;
  toolMessages: AgentMessage[];
};

type OpenAiFunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict: false;
};

function extractErrorMessage(response: OpenAiResponse): string | null {
  if (typeof response.error?.message === "string" && response.error.message.trim().length > 0) {
    return response.error.message.trim();
  }

  if (typeof response.output_text === "string" && response.output_text.trim().length > 0) {
    return response.output_text.trim();
  }

  return null;
}

function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function buildToolMap(tools: McpTool[]) {
  const entries = tools.map((tool) => [sanitizeToolName(tool.name), tool] as const);
  return new Map(entries);
}

function toOpenAiTools(tools: McpTool[]): OpenAiFunctionTool[] {
  return tools.map((tool) => ({
    type: "function",
    name: sanitizeToolName(tool.name),
    description: tool.description ?? tool.name,
    parameters:
      tool.inputSchema && typeof tool.inputSchema === "object"
        ? tool.inputSchema
        : { type: "object", properties: {}, additionalProperties: false },
    strict: false
  }));
}

function extractAssistantText(response: OpenAiResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim().length > 0) {
    return response.output_text.trim();
  }

  const text = (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

  return text || "";
}

function serializeHistoryMessage(message: AgentMessage) {
  if (message.role === "tool") {
    const action = message.toolAction ?? "generic";
    const entitySuffix = message.toolEntity ? ` "${message.toolEntity}"` : "";
    return {
      role: "assistant" as const,
      content: `[Tool result] Action: ${action}${entitySuffix}\n${message.text}`
    };
  }

  return {
    role: message.role,
    content: message.text
  };
}

export async function runAgentTurn(input: {
  apiKey: string;
  tools: McpTool[];
  history: AgentMessage[];
  userText: string;
  images?: AgentImageInput[];
  model?: string;
  userInstructions?: string;
  responseLanguage?: Language;
  systemPrompt?: string;
  onToolStart?: (tool: { name: string; action: AgentToolAction; entity: string | null }) => void;
  onToolEnd?: () => void;
}): Promise<AgentResult> {
  const toolMap = buildToolMap(input.tools);
  const openAiTools = toOpenAiTools(input.tools);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${input.apiKey}`
  };

  const systemPrompt = input.systemPrompt?.trim() || buildAgentSystemPrompt(input.userInstructions, input.responseLanguage);

  const baseInput = [
    { role: "system", content: systemPrompt },
    ...input.history.map(serializeHistoryMessage),
    {
      role: "user",
      content: [
        { type: "input_text", text: input.userText },
        ...(input.images ?? []).map((image) => ({
          type: "input_image" as const,
          image_url: image.dataUrl,
          detail: "auto" as const
        }))
      ]
    }
  ];
  const toolMessages: AgentMessage[] = [];
  const seenToolCalls = new Set<string>();
  let previousResponseId: string | undefined;
  let currentInput: unknown = baseInput;
  let latestPayload: OpenAiResponse | null = null;

  for (let step = 0; step < 3; step += 1) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: input.model?.trim() || "gpt-5-mini",
        input: currentInput,
        previous_response_id: previousResponseId,
        tools: openAiTools,
        reasoning: { effort: "low" }
      })
    });

    const payload = (await response.json()) as OpenAiResponse;
    latestPayload = payload;

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload) ?? "OpenAI request failed.");
    }

    const functionCalls = (payload.output ?? []).filter((item) => item.type === "function_call" && item.name && item.call_id);
    if (functionCalls.length === 0) {
      break;
    }

    const toolOutputs = [] as Array<{ type: "function_call_output"; call_id: string; output: string }>;

    for (const call of functionCalls) {
      const tool = toolMap.get(String(call.name));
      if (!tool) {
        continue;
      }

      const parsedArgs = call.arguments ? (JSON.parse(call.arguments) as Record<string, unknown>) : {};
      const callSignature = JSON.stringify({ name: tool.name, args: parsedArgs });
      const toolAction = inferToolAction(tool.name);
      let toolEntity = inferToolEntity(parsedArgs);
      let output: string;

      if (seenToolCalls.has(callSignature)) {
        output = JSON.stringify({
          skipped: true,
          reason: "Duplicate tool call blocked to prevent loops."
        }, null, 2);
      } else {
        seenToolCalls.add(callSignature);
        input.onToolStart?.({ name: tool.name, action: toolAction, entity: toolEntity });
        try {
          const result = await callMcpTool(tool.name, parsedArgs);
          toolEntity = toolEntity ?? inferToolEntity(result);
          output = JSON.stringify(result, null, 2);
        } finally {
          input.onToolEnd?.();
        }
      }

      toolMessages.push({
        id: crypto.randomUUID(),
        role: "tool",
        toolName: tool.name,
        toolAction,
        toolEntity,
        text: output
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: String(call.call_id),
        output
      });
    }

    if (toolOutputs.every((entry) => entry.output.includes("\"skipped\": true"))) {
      break;
    }

    previousResponseId = payload.id;
    currentInput = toolOutputs;
  }

  if (!latestPayload) {
    throw new Error("OpenAI request failed.");
  }

  const assistantText = extractAssistantText(latestPayload).trim() || buildToolOnlyFallback(toolMessages, input.responseLanguage);

  return {
    assistantMessage: {
      id: crypto.randomUUID(),
      role: "assistant",
      text: assistantText
    },
    toolMessages
  };
}

function buildToolOnlyFallback(toolMessages: AgentMessage[], language?: Language): string {
  if (toolMessages.length === 0) {
    return getLocalizedNoResponseFallback(language);
  }

  const localized = toolMessages
    .slice(-3)
    .map((message) => localizeToolAction(message.toolAction ?? "generic", message.toolEntity, language));

  if (language === "ru") {
    return localized.length === 1
      ? `${localized[0]}.`
      : `Готово.\n\n${localized.map((line) => `• ${line}`).join("\n")}`;
  }

  if (language === "he") {
    return localized.length === 1
      ? `${localized[0]}.`
      : `בוצע.\n\n${localized.map((line) => `• ${line}`).join("\n")}`;
  }

  return localized.length === 1
    ? `${localized[0]}.`
    : `Done.\n\n${localized.map((line) => `• ${line}`).join("\n")}`;
}

function getLocalizedNoResponseFallback(language?: Language): string {
  if (language === "ru") {
    return "Запрос выполнен.";
  }
  if (language === "he") {
    return "הבקשה הושלמה.";
  }
  return "Request completed.";
}

function localizeToolAction(action: AgentToolAction, entity: string | null | undefined, language?: Language): string {
  const item = entity?.trim();

  if (language === "ru") {
    switch (action) {
      case "add":
        return item ? `Добавлено: ${item}` : "Добавление выполнено";
      case "remove":
        return item ? `Удалено: ${item}` : "Удаление выполнено";
      case "update":
        return item ? `Обновлено: ${item}` : "Обновление выполнено";
      case "create":
        return item ? `Создано: ${item}` : "Создание выполнено";
      case "analyze":
        return item ? `Проанализировано: ${item}` : "Анализ выполнен";
      case "copy":
        return item ? `Скопировано: ${item}` : "Копирование выполнено";
      case "load":
        return item ? `Загружено: ${item}` : "Загрузка выполнена";
      default:
        return item ? `Выполнено: ${item}` : "Действие выполнено";
    }
  }

  if (language === "he") {
    switch (action) {
      case "add":
        return item ? `נוסף: ${item}` : "ההוספה בוצעה";
      case "remove":
        return item ? `הוסר: ${item}` : "ההסרה בוצעה";
      case "update":
        return item ? `עודכן: ${item}` : "העדכון בוצע";
      case "create":
        return item ? `נוצר: ${item}` : "היצירה בוצעה";
      case "analyze":
        return item ? `נותח: ${item}` : "הניתוח בוצע";
      case "copy":
        return item ? `הועתק: ${item}` : "ההעתקה בוצעה";
      case "load":
        return item ? `נטען: ${item}` : "הטעינה בוצעה";
      default:
        return item ? `בוצע: ${item}` : "הפעולה בוצעה";
    }
  }

  switch (action) {
    case "add":
      return item ? `Added: ${item}` : "Add completed";
    case "remove":
      return item ? `Removed: ${item}` : "Removal completed";
    case "update":
      return item ? `Updated: ${item}` : "Update completed";
    case "create":
      return item ? `Created: ${item}` : "Creation completed";
    case "analyze":
      return item ? `Analyzed: ${item}` : "Analysis completed";
    case "copy":
      return item ? `Copied: ${item}` : "Copy completed";
    case "load":
      return item ? `Loaded: ${item}` : "Load completed";
    default:
      return item ? `Completed: ${item}` : "Action completed";
  }
}

function inferToolAction(toolName: string): AgentToolAction {
  const normalized = toolName.toLowerCase();

  if (/(add|append|insert)/.test(normalized)) return "add";
  if (/(delete|remove|clear)/.test(normalized)) return "remove";
  if (/(update|edit|modify|patch|save)/.test(normalized)) return "update";
  if (/(create|generate|draft)/.test(normalized)) return "create";
  if (/(analy[sz]e|review|inspect)/.test(normalized)) return "analyze";
  if (/(copy|duplicate)/.test(normalized)) return "copy";
  if (/(get|list|fetch|load|read|history)/.test(normalized)) return "load";
  return "generic";
}

function inferToolEntity(value: unknown): string | null {
  return inferToolEntityFromUnknown(value);
}

function inferToolEntityFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    return sanitizeEntityCandidate(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = inferToolEntityFromUnknown(entry);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const priorityKeys = [
    "name",
    "title",
    "itemName",
    "productName",
    "recipeName",
    "mealName",
    "displayName",
    "productTitle",
    "recipeTitle",
    "label",
    "slot",
    "item",
    "product",
    "recipe"
  ];

  for (const key of priorityKeys) {
    const candidate = inferToolEntityFromUnknown(record[key]);
    if (candidate) {
      return candidate;
    }
  }

  for (const candidate of Object.values(record)) {
    const resolved = inferToolEntityFromUnknown(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function sanitizeEntityCandidate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  if ([
    "text",
    "message",
    "content",
    "input",
    "output",
    "result",
    "item",
    "product",
    "recipe",
    "meal",
    "slot",
    "id"
  ].includes(normalized)) {
    return null;
  }

  if (looksLikeTechnicalId(trimmed)) {
    return null;
  }

  return trimmed;
}

function looksLikeTechnicalId(value: string): boolean {
  const normalized = value.trim();

  if (/^[a-f0-9]{24,}$/i.test(normalized)) {
    return true;
  }

  if (/^[a-z0-9]{20,}$/i.test(normalized) && /[0-9]/.test(normalized)) {
    return true;
  }

  if (/^[a-z]+[0-9][a-z0-9]{10,}$/i.test(normalized)) {
    return true;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    return true;
  }

  if (/^[A-Z0-9_-]{12,}$/i.test(normalized) && !/\s/.test(normalized)) {
    return true;
  }

  return false;
}
