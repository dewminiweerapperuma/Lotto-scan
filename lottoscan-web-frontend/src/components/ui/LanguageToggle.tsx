"use client";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "compact";
}

export default function LanguageToggle({ className = "", variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 ${className}`}>
        <button
          onClick={() => setLanguage("en")}
          className={`px-2.5 py-1 text-xs font-bold font-display rounded-md transition-all ${
            language === "en"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("si")}
          className={`px-2.5 py-1 text-xs font-bold font-display rounded-md transition-all ${
            language === "si"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          සිංහල
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center rounded-full bg-slate-100 p-1 border border-slate-200 shadow-inner ${className}`}>
      <button
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1 px-3 py-1 text-xs font-bold font-display rounded-full transition-all ${
          language === "en"
            ? "bg-slate-900 text-amber-400 shadow-md border border-amber-400/40"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <span>🇬🇧</span>
        <span>English</span>
      </button>
      <button
        onClick={() => setLanguage("si")}
        className={`flex items-center gap-1 px-3 py-1 text-xs font-bold font-display rounded-full transition-all ${
          language === "si"
            ? "bg-slate-900 text-amber-400 shadow-md border border-amber-400/40"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        <span>🇱🇰</span>
        <span>සිංහල</span>
      </button>
    </div>
  );
}
