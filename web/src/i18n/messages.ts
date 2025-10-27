import { en } from "./locales/en";
import type { TranslationKey as EnTranslationKey } from "./locales/en";
import { ru } from "./locales/ru";

export type TranslationKey = EnTranslationKey;
export type Messages = Record<TranslationKey, string>;

export const messages = {
  en,
  ru
} satisfies Record<string, Messages>;

export type Language = keyof typeof messages;
