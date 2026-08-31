"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LOTTERIES, LOTTERY_EMOJIS, LotteryInfo } from "@/lib/constants";
import { lottery as lotteryApi } from "@/lib/api";

export default function LotteryGrid() {
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
              {isLive ? "Live Today's Results" : "Official Daily Draws"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-3">
            All 16 Sri Lankan Lotteries
          </h2>
          <p className="text-text-secondary font-body text-base">
            Today&apos;s winning jackpot prizes &amp; results from official NLB &amp; DLB feeds
          </p>
        </div>

        {loading && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border-default shadow-sm">
              <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary text-sm font-body">Loading live results…</span>
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
                {lottery.name}
              </h3>

              {/* Row 3: Today's Winning Prize */}
              <div className="bg-brand-section border border-border-default rounded-xl px-3 py-2.5">
                <p className="text-text-secondary text-[10px] font-body uppercase tracking-wider font-bold mb-0.5">
                  Today&apos;s Winning Prize
                </p>
                <p className="text-gold font-mono font-extrabold text-base leading-tight">
                  {lottery.topPrize || "—"}
                </p>
              </div>

              {/* Row 4: Winning Results */}
              <div className="pt-1 border-t border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-[10px] font-body uppercase tracking-wider font-bold">
                    Today&apos;s Results
                  </span>
                  {lottery.drawNumber && (
                    <span className="text-text-muted text-[10px] font-mono">
                      #{lottery.drawNumber}
                    </span>
                  )}
                </div>
                {lottery.name.toLowerCase().includes("jaya sampatha") && lottery.winningNumbers && lottery.winningNumbers.length >= 4 ? (
                  /* Jaya Sampatha Official Pyramid Format */
                  <div className="flex flex-col gap-2 py-1 items-start font-mono">
                    {/* Tier 1: 2-Digit Match */}
                    <div className="flex items-center gap-2">
                      {lottery.winningNumbers.slice(-2).map((num, idx) => (
                        <span
                          key={idx}
                          className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                    {/* Tier 2: 3-Digit Match */}
                    <div className="flex items-center gap-2">
                      {lottery.winningNumbers.slice(-3).map((num, idx) => (
                        <span
                          key={idx}
                          className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                    {/* Tier 3: 4-Digit + Super Letter */}
                    <div className="flex items-center gap-2">
                      {lottery.winningNumbers.slice(-4).map((num, idx) => (
                        <span
                          key={idx}
                          className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs flex items-center justify-center border-2 border-blue-600 shadow-sm select-none"
                        >
                          {num}
                        </span>
                      ))}
                      {lottery.letter && (
                        <span className="w-7 h-7 rounded-md bg-black text-white font-display font-black text-xs flex items-center justify-center shadow-md select-none border border-black">
                          {lottery.letter}
                        </span>
                      )}
                    </div>
                  </div>
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
                          <span className="w-7 h-7 rounded-full bg-gold text-white font-display font-black text-xs flex items-center justify-center shadow-sm select-none">
                            {lottery.letter}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-text-muted font-body italic">
                        {loading ? "Loading…" : "Pending"}
                      </span>
                    )}
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
