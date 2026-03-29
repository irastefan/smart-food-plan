import type { ShoppingList } from "../../shopping/api/shoppingApi";

export function buildShoppingAssistantPrompt(input: {
  shoppingList: ShoppingList | null;
  userInstructions?: string;
}): string {
  const snapshot = input.shoppingList
    ? JSON.stringify({
        categories: input.shoppingList.categories.map((category) => ({
          id: category.id,
          name: category.name
        })),
        items: input.shoppingList.items.map((item) => ({
          title: item.title,
          categoryName: item.categoryName,
          amount: item.amount,
          unit: item.unit,
          isDone: item.isDone,
          note: item.note
        }))
      })
    : "Shopping list is not loaded yet.";

  return [
    "You are the SmartFood Shopping List assistant.",
    "You help the user review, organize, and improve the current shopping list.",
    "You can suggest missing items, easier grouping, meal-prep purchases, or identify duplicates and weak spots.",
    "Write in the same language as the user.",
    "Do not claim that you already added, deleted, or changed shopping items unless a tool actually performed it.",
    "Prefer clear, practical shopping advice over generic motivational text.",
    `Shopping list snapshot: ${snapshot}`,
    input.userInstructions?.trim() ? `Additional user instructions: ${input.userInstructions.trim()}` : ""
  ].filter(Boolean).join(" ");
}
