import React from "react";
import { ZODIAC_LIST, getZodiacInfo } from "@/lib/zodiac";

interface ZodiacSelectorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function ZodiacSelector({
  value,
  onChange,
  label = "Lagna / Letter",
  placeholder = "-- Select Lagna --",
  className = "",
}: ZodiacSelectorProps) {
  const selectedInfo = getZodiacInfo(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-white/40 text-xs font-body block font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded-xl px-3 py-3 text-white font-body text-sm focus:outline-none focus:border-gold/50 appearance-none cursor-pointer pr-8"
        >
          <option value="">{placeholder}</option>
          <optgroup label="Zodiac / Lagna Signs (ලග්න)">
            {ZODIAC_LIST.map((z) => (
              <option key={z.id} value={z.symbol}>
                {z.symbol} {z.transliteration} ({z.nameSi} / {z.nameEn})
              </option>
            ))}
          </optgroup>
          <optgroup label="English Letters (A-Z)">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
              <option key={char} value={char}>
                Letter {char}
              </option>
            ))}
          </optgroup>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
          ▼
        </div>
      </div>
      {selectedInfo && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-display mt-1">
          <span className="font-sans text-sm">{selectedInfo.symbol}</span>
          <span>Selected: {selectedInfo.transliteration} ({selectedInfo.nameSi})</span>
        </div>
      )}
    </div>
  );
}
