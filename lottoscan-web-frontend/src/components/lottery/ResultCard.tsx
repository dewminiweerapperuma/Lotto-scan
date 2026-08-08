import Link from "next/link";
import { LotteryResult } from "@/types";
import NumberBall from "@/components/ui/NumberBall";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function ResultCard({ result }: { result: LotteryResult }) {
  const numbers = [result.number_1, result.number_2, result.number_3, result.number_4, result.number_5].filter(n => n > 0);
  return (
    <Card hover className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-display font-semibold truncate">{result.lottery_name}</p>
          <p className="text-white/40 text-xs font-body mt-0.5">Draw #{result.draw_number}</p>
        </div>
        <Badge variant="gold">{result.draw_date}</Badge>
      </div>
      <div className="space-y-2">
        <p className="text-white/40 text-xs font-body uppercase tracking-widest">Winning Numbers</p>
        <div className="flex gap-2 flex-wrap">
          {numbers.map((n, i) => <NumberBall key={i} number={n} size="md"/>)}
        </div>
      </div>
      {(result.letter || result.zodiac) && (
        <div className="flex gap-2">
          {result.letter && <Badge variant="blue">Letter: {result.letter}</Badge>}
          {result.zodiac && <Badge variant="grey">Zodiac: {result.zodiac}</Badge>}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <span className="text-white/25 text-xs font-body">{result.uploaded_by}</span>
        <Link href={`/check?date=${result.draw_date}`} className="text-gold text-sm font-body hover:text-gold/80 transition-colors">
          Check if you won →
        </Link>
      </div>
    </Card>
  );
}
