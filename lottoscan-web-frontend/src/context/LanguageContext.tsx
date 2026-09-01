"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, getTranslation, getLotteryName } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  tLottery: (item?: string | { name?: string; nameSi?: string; lottery_name?: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = "lottoscan_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (saved === "en" || saved === "si") {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {}
  };

  const toggleLanguage = () => {
    const nextLang: Language = language === "en" ? "si" : "en";
    setLanguage(nextLang);
  };

  const t = (key: string) => getTranslation(key, language);
  const tLottery = (item?: string | { name?: string; nameSi?: string; lottery_name?: string }) => getLotteryName(item, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, tLottery }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: "en" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string) => getTranslation(key, "en"),
      tLottery: (item?: string | { name?: string; nameSi?: string; lottery_name?: string }) =>
        typeof item === "string" ? item : item?.name || item?.lottery_name || "",
    };
  }
  return context;
}
