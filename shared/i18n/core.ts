import { defaultLanguage, type SupportedLanguage } from "./languages";
import { messages, type TranslationKey } from "./messages";

type TranslationValues = Record<string, string | number | undefined>;

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_match, rawKey) => {
    const key = String(rawKey).trim();
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
}

export function getMessage(language: SupportedLanguage, key: TranslationKey, values?: TranslationValues): string {
  const languageMessages = messages[language] ?? messages[defaultLanguage];
  const template = languageMessages[key] ?? messages[defaultLanguage][key] ?? key;
  return interpolate(template, values);
}

export function createTranslator(language: SupportedLanguage) {
  return (key: TranslationKey, values?: TranslationValues) => getMessage(language, key, values);
}
