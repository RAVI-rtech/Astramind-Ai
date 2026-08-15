import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, normalizeLanguage, translations, LANGUAGE_OPTIONS, Translations } from "./translations";

interface LanguageContextType {
  language: Language;
  rawLanguage: string;
  setLanguage: (lang: string) => void;
  t: (path: string, fallback?: string) => string;
  translations: Translations;
  languageOptions: typeof LANGUAGE_OPTIONS;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "astramind_language";

export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}

export function LanguageProvider({ children, initialLanguage, onLanguageChange }: LanguageProviderProps) {
  const [rawLanguage, setRawLanguageState] = useState<string>(() => {
    if (initialLanguage) return initialLanguage;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return "English (US)";
  });

  const language = normalizeLanguage(rawLanguage);

  // Sync state if prop changes from outside (e.g. user profile / settings sync)
  useEffect(() => {
    if (initialLanguage && initialLanguage !== rawLanguage) {
      setRawLanguageState(initialLanguage);
    }
  }, [initialLanguage]);

  const setLanguage = (newLang: string) => {
    setRawLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (err) {
      console.error("Failed to store language preference:", err);
    }
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  // Safe nested translation lookup (e.g. "nav.dashboard")
  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallbackObj: any = translations["en"];
        for (const fk of keys) {
          if (fallbackObj && typeof fallbackObj === "object" && fk in fallbackObj) {
            fallbackObj = fallbackObj[fk];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackObj === "string" ? fallbackObj : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        rawLanguage,
        setLanguage,
        t,
        translations: translations[language],
        languageOptions: LANGUAGE_OPTIONS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
