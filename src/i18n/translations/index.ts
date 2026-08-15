import { en, Translations } from "./en";
import { hi } from "./hi";
import { te } from "./te";

export type { Translations };
export type Language = "en" | "hi" | "te";

export const LANGUAGE_OPTIONS: { code: Language; label: string; name: string }[] = [
  { code: "en", label: "English (US)", name: "English" },
  { code: "hi", label: "हिंदी (Hindi)", name: "Hindi" },
  { code: "te", label: "తెలుగు (Telugu)", name: "Telugu" },
];

export function normalizeLanguage(lang?: string): Language {
  if (!lang) return "en";
  const lower = lang.toLowerCase();
  if (lower.includes("te") || lower.includes("telugu") || lower.includes("తెలుగు")) {
    return "te";
  }
  if (lower.includes("hi") || lower.includes("hindi") || lower.includes("हिंदी")) {
    return "hi";
  }
  return "en";
}

export const translations: Record<Language, Translations> = {
  en,
  hi,
  te,
};
