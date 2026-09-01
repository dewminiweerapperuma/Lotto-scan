import Link from "next/link";
import type { LotteryResult } from "@/types";
import NumberBall from "./NumberBall";
import Badge from "./Badge";
import ZodiacBall, { ZodiacBadge } from "./ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import PyramidResults, { isPyramidLottery } from "./PyramidResults";
import { useLanguage } from "@/context/LanguageContext";

interface ResultCardProps { result: LotteryResult; }

export default function ResultCard({ result }: ResultCardProps) {
  const { tLottery } = useLanguage();
  const numbers = [result.number_1, result.number_2, result.number_3, result.number_4, result.number_5].filter(n => n > 0);

  return (
    <div className="bg-[#12121A] border border-white/5 rounded-3xl p-6 hover:border-white/10 hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-display font-semibold text-base">{tLottery(result.lottery_name)}</h3>
          <p className="text-white/30 text-xs font-body mt-0.5">Draw #{result.draw_number} · {result.draw_date}</p>
        </div>
        <Badge variant="gold">
          {result.day_of_week || "Daily"}
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-white/30 text-xs font-body mb-2 uppercase tracking-wider">Winning Numbers</p>
        {isPyramidLottery(result.lottery_name) && numbers.length >= 4 ? (
          <PyramidResults numbers={numbers} letter={result.letter} />
        ) : (
          <div className="flex gap-2 flex-wrap items-center">
            {numbers.map((n, i) => <NumberBall key={i} number={n} variant="gold" size="sm" />)}
            {result.letter && (
              <ZodiacBall value={result.letter} size="md" />
            )}
          </div>
        )}
      </div>

      {(result.zodiac || (!result.lottery_name?.toLowerCase().includes("jaya sampatha") && result.letter)) && (
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {result.letter && (
            <ZodiacBadge value={result.letter} />
          )}
          {result.zodiac && !getZodiacInfo(result.letter) && (
            <ZodiacBadge value={result.zodiac} />
          )}
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
