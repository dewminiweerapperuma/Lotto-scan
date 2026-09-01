"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LOTTERIES, LOTTERY_EMOJIS, LotteryInfo } from "@/lib/constants";
import { lottery as lotteryApi } from "@/lib/api";
import ZodiacBall, { ZodiacBadge } from "@/components/ui/ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import { useLanguage } from "@/context/LanguageContext";

export default function LotteryGrid() {
  const { t, tLottery } = useLanguage();
  const [items, setItems] = useState<LotteryInfo[]>(LOTTERIES);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    lotteryApi.getLivePrizes()
      .then((res) => {
        if (isMounted && res.data?.prizes && Array.isArray(res.data.prizes)) {
          const liveData = res.data.prizes;

          // Build lookup by name (case-insensitive)
          const map = new Map<string, LotteryInfo>();
          liveData.forEach((p: Record<string, unknown>) => {
            const name = (p.name || p.lottery_name) as string;
            if (name) {
              let nums: number[] = [];
              if (Array.isArray(p.winningNumbers)) nums = p.winningNumbers as number[];
              else if (typeof p.winningNumbers === 'string') {
                try { nums = JSON.parse(p.winningNumbers as string); } catch { nums = []; }
              }

              map.set(name, {
                name,
                topPrize: (p.topPrize || p.top_prize || '—') as string,
                board: (p.board || '') as string,
                drawNumber: (p.drawNumber || p.draw_number || '') as string,
                letter: (p.letter || '') as string,
                winningNumbers: nums,
              });
            }
          });

          // Merge live data into our static list
          const updated = LOTTERIES.map((item) => {
            const fetched = map.get(item.name);
            if (fetched) {
              return {
                ...item,
                topPrize: fetched.topPrize || item.topPrize,
                drawNumber: fetched.drawNumber || item.drawNumber,
                letter: fetched.letter || item.letter,
                winningNumbers: (fetched.winningNumbers && fetched.winningNumbers.length > 0)
                  ? fetched.winningNumbers
                  : item.winningNumbers,
              };
            }
            return item;
          });

          setItems(updated);
          setIsLive(true);
        }
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, []);

  return (
    <section className="section bg-brand-section">
      <div className="container">
        <div className="text-center mb-14 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gold-light border border-gold-border rounded-full px-4 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold-dark text-xs font-display font-bold uppercase tracking-widest">
              {isLive ? t("grid_tag_live") : t("grid_tag_official")}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">
            {t("grid_title")}
          </h2>
          <p className="text-text-secondary font-body text-base">
            {t("grid_subtitle")}
          </p>
        </div>

        {loading && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border-default shadow-sm">
              <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary text-sm font-body">{t("grid_loading")}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {items.map((lottery) => (
            <Card
              key={lottery.name}
              hover
              padding="sm"
              className="flex flex-col gap-3 border border-border-default hover:border-gold-border"
            >
              {/* Row 1: Emoji + Board Badge */}
              <div className="flex items-center justify-between">
                <span className="text-3xl select-none">{LOTTERY_EMOJIS[lottery.name] || "🎫"}</span>
                <Badge variant={lottery.board === "NLB" ? "blue" : "gold"}>
                  {lottery.board}
                </Badge>
              </div>

              {/* Row 2: Lottery Name */}
              <h3 className="text-text-primary font-display font-extrabold text-base leading-snug min-h-[1.5rem]" title={lottery.name}>
                {tLottery(lottery.name)}
              </h3>

              {/* Row 3: Today's Winning Prize */}
              <div className="bg-brand-section border border-border-default rounded-xl px-3 py-2.5">
                <p className="text-text-secondary text-[10px] font-body uppercase tracking-wider font-bold mb-0.5">
                  {t("grid_prize_label")}
                </p>
                <p className="text-gold font-mono font-extrabold text-base leading-tight">
                  {lottery.topPrize || "—"}
                </p>
              </div>

              {/* Row 4: Winning Results */}
              <div className="pt-1 border-t border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-[10px] font-body uppercase tracking-wider font-bold">
                    {t("grid_results_label")}
                  </span>
                  {lottery.drawNumber && (
                    <span className="text-text-muted text-[10px] font-mono">
                      #{lottery.drawNumber}
                    </span>
                  )}
                </div>
                {isPyramidLottery(lottery.name) && lottery.winningNumbers && lottery.winningNumbers.length >= 4 ? (
                  <PyramidResults numbers={lottery.winningNumbers} letter={lottery.letter} />
                ) : (
                  /* Standard Lottery Format */
                  <div className="flex flex-wrap items-center gap-1.5">
                    {lottery.winningNumbers && lottery.winningNumbers.length > 0 ? (
                      <>
                        {lottery.winningNumbers.map((num, idx) => (
                          <span
                            key={idx}
                            className="w-7 h-7 rounded-full bg-brand-section text-text-primary font-mono font-bold text-[11px] flex items-center justify-center border border-border-default select-none"
                          >
                            {typeof num === 'number' && num < 10 ? `0${num}` : num}
                          </span>
                        ))}
                        {lottery.letter && (
                          <ZodiacBall value={lottery.letter} size="md" />
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-text-muted font-body italic">
                        {loading ? "Loading…" : "Pending"}
                      </span>
                    )}
                  </div>
                )}
                {lottery.letter && getZodiacInfo(lottery.letter) && (
                  <div className="mt-2.5 pt-2 border-t border-border-default/40">
                    <ZodiacBadge value={lottery.letter} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
