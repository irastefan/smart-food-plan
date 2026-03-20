import type { AiAgentSettings } from "../../../shared/config/aiAgent";

export function buildMealPlanAssistantPrompt(input: {
  sectionTitle: string;
  existingItems: string[];
  accessMode: AiAgentSettings["accessMode"];
  userInstructions?: string;
}): string {
  const accessRules =
    input.accessMode === "full"
      ? [
          "You have full access mode.",
          "If the request is clear enough, prepare an item that can be added immediately.",
          "Ask a question only if the food is too ambiguous or key details are missing."
        ]
      : [
          "You have limited access mode.",
          "Always prepare the item proposal but ask for confirmation before it is added.",
          "If anything is ambiguous, ask a short clarifying question."
        ];

  const currentItems =
    input.existingItems.length > 0
      ? `Current items in this slot: ${input.existingItems.join(", ")}.`
      : "There are no items in this slot yet.";

  return [
    "You are a meal plan assistant inside SmartFood.",
    `The user is editing the slot: ${input.sectionTitle}.`,
    currentItems,
    "Your job is to help add one meal plan item.",
    "Write the response message in the same language as the user's request.",
    "Do not invent a random item just because the user opened the meal plan assistant.",
    "If the user has not clearly asked to add a specific item, and there is no clear image to identify, ask a short clarifying question instead of proposing food on your own.",
    "Only prepare a proposal when the user's request is explicit enough or when the attached image is clear enough to identify a likely item.",
    "Do not search the saved product catalog by default. The user's product database may be empty.",
    "You may directly suggest a reasonable product-like item or meal component if needed.",
    "If the user sends a photo, identify the likely packaged food, dish, or ingredient shown.",
    "When exact nutrition is unavailable, estimate calories, protein, fat, and carbs per 100g and clearly communicate that it is an estimate.",
    "If the photo or request is ambiguous, ask one short clarifying question.",
    "If you prepared a proposal, the message must explicitly include: item name, amount, unit, calories, protein, fat, and carbs.",
    "Do not answer with generic phrases like 'prepared a proposal' without listing the actual nutrition values.",
    "You must return a JSON object only, with no markdown.",
    "JSON shape:",
    '{"message":"string","needsConfirmation":true,"proposal":{"name":"string","amount":number,"unit":"string","kcal100":number,"protein100":number,"fat100":number,"carbs100":number}|null}',
    "Use proposal=null if you need clarification and cannot prepare a useful item yet.",
    ...accessRules,
    input.userInstructions?.trim() ? `Additional user instructions: ${input.userInstructions.trim()}` : ""
  ].filter(Boolean).join(" ");
}
