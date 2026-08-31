import Link from "next/link";
import type { LotteryResult } from "@/types";
import NumberBall from "./NumberBall";
import Badge from "./Badge";

interface ResultCardProps { result: LotteryResult; }

export default function ResultCard({ result }: ResultCardProps) {
  const numbers = [result.number_1, result.number_2, result.number_3, result.number_4, result.number_5].filter(n => n > 0);

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-3xl p-6 hover:border-white/10 hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-display font-semibold text-base">{result.lottery_name}</h3>
          <p className="text-white/30 text-xs font-body mt-0.5">Draw #{result.draw_number} · {result.draw_date}</p>
        </div>
        <Badge variant="gold">
          {result.day_of_week || "Daily"}
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-white/30 text-xs font-body mb-2 uppercase tracking-wider">Winning Numbers</p>
        {result.lottery_name?.toLowerCase().includes("jaya sampatha") && numbers.length >= 4 ? (
          <div className="flex flex-col gap-2 font-mono">
            {/* Tier 1: 2-Digit Match */}
            <div className="flex items-center gap-2">
              {numbers.slice(-2).map((n, i) => (
                <span key={i} className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none">
                  {n}
                </span>
              ))}
            </div>
            {/* Tier 2: 3-Digit Match */}
            <div className="flex items-center gap-2">
              {numbers.slice(-3).map((n, i) => (
                <span key={i} className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none">
                  {n}
                </span>
              ))}
            </div>
            {/* Tier 3: 4-Digit Match + Super Letter */}
            <div className="flex items-center gap-2">
              {numbers.slice(-4).map((n, i) => (
                <span key={i} className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none">
                  {n}
                </span>
              ))}
              {result.letter && (
                <span className="w-7 h-7 rounded-md bg-black text-white font-display font-black text-xs flex items-center justify-center shadow-md select-none border border-black">
                  {result.letter}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            {numbers.map((n, i) => <NumberBall key={i} number={n} variant="gold" size="sm" />)}
            {result.letter && (
              <span className="w-7 h-7 rounded-full bg-gold text-white font-display font-black text-xs flex items-center justify-center shadow-sm select-none">
                {result.letter}
              </span>
            )}
          </div>
        )}
      </div>

      {(result.zodiac || (!result.lottery_name?.toLowerCase().includes("jaya sampatha") && result.letter)) && (
        <div className="flex gap-2 mb-4">
          {!result.lottery_name?.toLowerCase().includes("jaya sampatha") && result.letter && <Badge variant="gold">Letter: {result.letter}</Badge>}
          {result.zodiac && <Badge variant="grey">Zodiac: {result.zodiac}</Badge>}
        </div>
      )}

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-white/25 text-xs font-body">{result.uploaded_by}</span>
        <Link href={`/check?date=${result.draw_date}&lottery=${encodeURIComponent(result.lottery_name)}`}
          className="text-[#F5C518] text-sm font-body hover:underline">
          Check if you won →
        </Link>
      </div>
    </div>
  );
}
