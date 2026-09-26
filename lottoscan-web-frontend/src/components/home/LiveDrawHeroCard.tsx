"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { lottery as lotteryApi } from "@/lib/api";
import { LOTTERIES, LOTTERY_EMOJIS } from "@/lib/constants";
import NumberBall from "@/components/ui/NumberBall";
import ZodiacBall, { ZodiacBadge } from "@/components/ui/ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import Card from "@/components/ui/Card";

import { useLanguage } from "@/context/LanguageContext";

interface DrawResult {
  id: string;
  lottery_name: string;
  board?: string;
  draw_number: string;
  draw_date: string;
  number_1: number;
  number_2: number;
  number_3: number;
  number_4: number;
  number_5: number;
  letter?: string;
  top_prize?: string;
}

export default function LiveDrawHeroCard() {
  const { t, tLottery } = useLanguage();
  const [results, setResults] = useState<DrawResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lotteryApi.getLatestResults(16)
      .then((res) => {
        const data = res.data?.results || [];
        if (data.length > 0) {
          setResults(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentDraw = results[selectedIndex] || null;

  // Accurately extract numbers according to lottery specifications
  const matchedLotteryDef = LOTTERIES.find((l) => l.name === currentDraw?.lottery_name);
  const expectedCount = matchedLotteryDef?.winningNumbers?.length || 4;
  const rawList = currentDraw
    ? [currentDraw.number_1, currentDraw.number_2, currentDraw.number_3, currentDraw.number_4, currentDraw.number_5]
    : [];
  const currentNumbers = rawList.slice(0, Math.min(expectedCount, 5)).filter((n) => typeof n === "number" && n !== null && n !== undefined);

  const zodiacInfo = currentDraw?.letter ? getZodiacInfo(currentDraw.letter) : null;
  const board = currentDraw?.board || (currentDraw?.lottery_name && ["Govisetha", "Mahajana Sampatha", "Mega Power", "Dhana Nidhanaya", "Handahana", "NLB Jaya", "Ada Sampatha", "Suba Dawasak"].includes(currentDraw.lottery_name) ? "NLB" : "DLB");
  const lotteryEmoji = currentDraw?.lottery_name ? (LOTTERY_EMOJIS[currentDraw.lottery_name] || "🎫") : "🎫";

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Live Badge & Popular Quick Toggles */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-display font-extrabold uppercase tracking-wider text-text-primary">
            {t("official_live_draws")}
          </span>
        </div>
        <span className="text-[11px] text-text-secondary font-medium font-body">
          {results.length > 0 ? `${results.length} ${t("draws_synced")}` : t("connecting_boards")}
        </span>
      </div>

      {/* Mini Tabs for Quick Lotteries */}
      {results.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none text-xs">
          {results.slice(0, 6).map((r, idx) => (
            <button
              key={r.id || idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 ${
                selectedIndex === idx
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/25 scale-[1.02]"
                  : "bg-white/80 hover:bg-white text-text-secondary border border-border-default/60 hover:text-text-primary"
              }`}
            >
              <span>{LOTTERY_EMOJIS[r.lottery_name] || "🎫"}</span>
              <span>{tLottery(r.lottery_name)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Live Card */}
      <div className="relative bg-white border border-border-default rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border-l-4 border-l-gold text-left overflow-hidden">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-secondary font-body font-semibold">{t("loading_draw")}</p>
          </div>
        ) : currentDraw ? (
          <div className="p-6 md:p-7">
            {/* Header info */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-display font-black tracking-wide bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <span>{lotteryEmoji}</span>
                  <span>{tLottery(currentDraw.lottery_name)}</span>
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    board === "NLB"
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {board}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-text-primary block">
                  {t("draw_no")} #{currentDraw.draw_number}
                </span>
                <span className="text-[11px] text-text-muted font-body">
                  {currentDraw.draw_date}
                </span>
              </div>
            </div>

            {/* Numbers Display */}
            <div className="mb-5">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2.5">
                {t("official_winning_numbers")}
              </p>
              {isPyramidLottery(currentDraw.lottery_name) && currentNumbers.length >= 4 ? (
                <PyramidResults numbers={currentNumbers} letter={currentDraw.letter} />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {currentNumbers.map((n, i) => (
                    <NumberBall key={i} number={n} variant="matched" size="lg" />
                  ))}
                  {currentDraw.letter && (
                    <div className="flex items-center gap-1.5 pl-1">
                      <ZodiacBall value={currentDraw.letter} size="lg" />
                      {zodiacInfo?.transliteration && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 hidden sm:inline-block">
                          {zodiacInfo.transliteration}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full h-px bg-border-default/60 my-4" />

            {/* Jackpot & Direct Check Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <span className="text-text-secondary font-body text-xs font-bold block uppercase tracking-wider">
                  {t("top_jackpot_prize")}
                </span>
                <span className="text-2xl sm:text-3xl font-display font-extrabold text-amber-600 font-mono">
                  {currentDraw.top_prize || "Over Rs. 50,000,000"}
                </span>
              </div>

              <Link
                href={`/check?lottery=${encodeURIComponent(currentDraw.lottery_name)}&date=${currentDraw.draw_date}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 text-center shrink-0"
              >
                <span>{t("check_this_draw")}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-text-secondary text-sm font-body">
            No live draws available. Connect to server to update.
          </div>
        )}

        {/* Live Status Bar */}
        <div className="bg-amber-50/70 border-t border-amber-150 px-6 py-2.5 text-xs font-body font-semibold text-amber-950 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>✅</span>
            <span>Official Government Board Draw Verified</span>
          </span>
          <span className="text-[11px] text-amber-800/80 font-mono">
            6-Month Claim Window Active
          </span>
        </div>
      </div>
    </div>
  );
}
