import React from "react";

interface PyramidResultsProps {
  numbers: (number | string)[];
  letter?: string;
  className?: string;
}

export function isPyramidLottery(name?: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    (n.includes("ada sampatha") || n.includes("jaya sampatha") || n.includes("sampatha")) &&
    !n.includes("mahajana") &&
    !n.includes("supiri")
  );
}

export default function PyramidResults({ numbers, letter, className = "" }: PyramidResultsProps) {
  if (!numbers || numbers.length < 4) return null;

  const validNumbers = numbers.slice(-4);

  return (
    <div className={`flex flex-col gap-2 py-1 items-start font-mono ${className}`}>
      {/* Tier 1: 2-Digit Match (Last 2 digits) */}
      <div className="flex items-center gap-2">
        {validNumbers.slice(-2).map((num, idx) => (
          <span
            key={idx}
            className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md select-none border border-amber-400"
          >
            {num}
          </span>
        ))}
      </div>

      {/* Tier 2: 3-Digit Match (Last 3 digits) */}
      <div className="flex items-center gap-2">
        {validNumbers.slice(-3).map((num, idx) => (
          <span
            key={idx}
            className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md select-none border border-amber-400"
          >
            {num}
          </span>
        ))}
      </div>

      {/* Tier 3: 4-Digit Match (All 4 digits) + Super Letter */}
      <div className="flex items-center gap-2">
        {validNumbers.map((num, idx) => (
          <span
            key={idx}
            className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md select-none border border-amber-400"
          >
            {num}
          </span>
        ))}
        {letter && (
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md select-none border border-blue-400">
            {letter}
          </span>
        )}
      </div>
    </div>
  );
}
