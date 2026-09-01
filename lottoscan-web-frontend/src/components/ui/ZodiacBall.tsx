import React from "react";
import { getZodiacInfo, ZodiacSign } from "@/lib/zodiac";

interface ZodiacBallProps {
  value?: string;
  sign?: ZodiacSign | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function ZodiacBall({
  value,
  sign: passedSign,
  size = "md",
  showLabel = false,
  className = "",
}: ZodiacBallProps) {
  const zodiac = passedSign || (value ? getZodiacInfo(value) : null);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-11 h-11 text-base",
  }[size];

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 24,
  }[size];

  if (!zodiac) {
    return (
      <span
        className={`rounded-full bg-amber-500 text-slate-950 font-display font-black flex items-center justify-center shadow-md select-none ${sizeClasses} ${className}`}
      >
        {value || "?"}
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2"
      title={`Zodiac: ${zodiac.nameEn} - ${zodiac.transliteration} (${zodiac.nameSi})`}
    >
      <span
        className={`rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-display font-black flex items-center justify-center shadow-md border-2 border-amber-300 select-none transition-transform hover:scale-105 ${sizeClasses} ${className}`}
      >
        <svg
          width={iconSizes}
          height={iconSizes}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        >
          <path d={zodiac.svgPath} />
        </svg>
      </span>

      {showLabel && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-amber-400/50 text-white font-display font-bold text-xs shadow-md">
          <span className="text-amber-400 font-extrabold text-sm">{zodiac.nameEn}</span>
          <span className="text-amber-200/70 text-[11px]">({zodiac.transliteration})</span>
        </span>
      )}
    </div>
  );
}

export function ZodiacBadge({ value }: { value: string }) {
  const zodiac = getZodiacInfo(value);
  if (!zodiac) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-sm">
        Letter: {value}
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-400/60 shadow-md text-slate-100 font-display text-xs"
      title={`${zodiac.nameEn} (${zodiac.transliteration} / ${zodiac.nameSi})`}
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-inner">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={zodiac.svgPath} />
        </svg>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">Zodiac:</span>
        <span className="text-white font-extrabold text-sm tracking-wide">{zodiac.nameEn}</span>
        <span className="text-amber-200/70 text-xs font-medium">({zodiac.transliteration} / {zodiac.nameSi})</span>
      </div>
    </div>
  );
}
