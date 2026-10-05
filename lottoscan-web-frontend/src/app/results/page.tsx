"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { lottery as lotteryApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import NumberBall from "@/components/ui/NumberBall";
import ZodiacBall, { ZodiacBadge } from "@/components/ui/ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import { LOTTERIES, LOTTERY_EMOJIS } from "@/lib/constants";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import { useLanguage } from "@/context/LanguageContext";

function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getQuickDates(baseDate = new Date()) {
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const value = formatYMD(d);
    const dayMonth = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    let label = dayMonth;
    if (i === 0) label = `Today (${dayMonth})`;
    else if (i === 1) label = `Yesterday (${dayMonth})`;
    dates.push({ label, value });
  }
  return dates;
}

export default function ResultsPage() {
  const { t, tLottery } = useLanguage();
  const [quickDates, setQuickDates] = useState<{ label: string; value: string }[]>(() => getQuickDates());
  // Default to yesterday's draw date since today's evening draw takes place around 9:00-10:00 PM
  const [selectedDate, setSelectedDate] = useState<string>(() => getQuickDates()[1].value);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLottery, setFilterLottery] = useState("");

  // Probe available draws on mount to automatically select the latest available published draw date
  useEffect(() => {
    const dynamicDates = getQuickDates();
    setQuickDates(dynamicDates);

    lotteryApi.getAllDraws().then((r) => {
      const all = Array.isArray(r.data?.draws) ? r.data.draws : [];
      const hasToday = all.some((d: any) => d.draw_date === dynamicDates[0].value);
      if (hasToday) {
        setSelectedDate(dynamicDates[0].value);
      } else {
        const latestAvailable = all[0]?.draw_date || dynamicDates[1].value;
        setSelectedDate(latestAvailable);
      }
    }).catch(() => {
      setSelectedDate(dynamicDates[1].value);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const lotteryParam = filterLottery?.trim() || undefined;

    const request = selectedDate
      ? lotteryApi.getAllDraws(undefined, undefined, lotteryParam, selectedDate)
      : lotteryApi.getAllDraws(undefined, undefined, lotteryParam);

    request
      .then((r) => {
        const raw = Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.data?.results)
          ? r.data.results
          : Array.isArray(r.data?.draws)
          ? r.data.draws
          : [];
        setResults(raw);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedDate, filterLottery]);

  const filtered = results.filter((r) => {
    if (filterLottery && r.lottery_name !== filterLottery) return false;
    return true;
  });

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page Header */}
      <header className="bg-brand-section border-b border-border-default pt-24 pb-12">
        <div className="container flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-text-primary mb-3">
              {t("results_title")}
            </h1>
            <p className="text-text-secondary font-body text-base">
              {t("results_subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <a
              href="https://lklottery.com/pdf/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-display font-bold text-sm px-5 py-2.5 rounded-[12px] shadow-md shadow-red-500/20 transition-all hover:scale-105"
            >
              <span>📄</span>
              <span>{t("download_official_pdf")}</span>
            </a>
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-[12px] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-win opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-win"></span>
              </span>
              <span className="text-text-secondary font-body text-xs font-semibold uppercase tracking-wider">
                Live official sync
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar (Sticky) */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#F3F4F6] shadow-sm py-4">
        <div className="container space-y-3">
          {/* Quick Date Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <span>📅</span> Date:
            </span>
            {quickDates.map((d, idx) => {
              const isActive = selectedDate === d.value;
              const isToday = idx === 0;
              const isYesterday = idx === 1;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(d.value)}
                  className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-gold text-white shadow-sm shadow-gold/30 scale-105"
                      : "bg-brand-section text-text-secondary hover:text-text-primary hover:bg-gold-light/40 border border-border-default/60"
                  }`}
                >
                  <span>{d.label}</span>
                  {isToday && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                    }`}>
                      Night Draw
                    </span>
                  )}
                  {isYesterday && !isActive && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                      Latest
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px] max-w-sm">
              <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                Lottery Type
              </label>
              <select
                value={filterLottery}
                onChange={(e) => setFilterLottery(e.target.value)}
                className="input-dark text-sm w-full"
              >
                <option value="">All Lotteries</option>
                {LOTTERIES.map((l) => (
                  <option key={l.name} value={l.name}>
                    {LOTTERY_EMOJIS[l.name] || "🎫"} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Single Draw Date Input */}
            <div className="w-full sm:w-auto">
              <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                Draw Date
              </label>
              <input
                type="date"
                value={selectedDate}
                max={quickDates[0]?.value}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-dark text-sm w-full"
              />
            </div>

            {(filterLottery || (quickDates[1] && selectedDate !== quickDates[1].value)) && (
              <button
                onClick={() => {
                  const latestAvailableStr = quickDates[1]?.value || formatYMD(new Date());
                  setFilterLottery("");
                  setSelectedDate(latestAvailableStr);
                }}
                className="text-gold-dark hover:text-gold hover:underline text-sm font-body font-bold transition-colors px-4 py-3 shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <section className="container py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-[24px] h-[220px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          (() => {
            const isTodaySelected = selectedDate === quickDates[0]?.value;
            const yesterdayDate = quickDates[1]?.value;

            if (isTodaySelected) {
              return (
                <div className="bg-amber-50/90 border border-amber-200 rounded-[24px] text-center p-12 max-w-xl mx-auto mt-8 shadow-sm">
                  <div className="text-5xl mb-4 select-none">⏰</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold font-display uppercase tracking-wider mb-3">
                    <span>Draws Scheduled for 9:00 PM – 10:00 PM</span>
                  </div>
                  <h3 className="text-amber-950 font-display font-extrabold text-2xl mb-2">
                    Today&apos;s Draws ({quickDates[0]?.label.replace("Today (", "").replace(")", "")}) Not Published Yet
                  </h3>
                  <p className="text-amber-800 font-body text-sm leading-relaxed mb-6 max-w-md mx-auto">
                    Official Sri Lankan lottery drawings (NLB &amp; DLB) take place every evening between <strong>9:00 PM – 10:00 PM</strong>. Today&apos;s winning results will be published here automatically right after the live draw broadcast concludes.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(yesterdayDate)}
                      className="px-6 py-3 bg-gold text-white font-display font-bold text-sm rounded-xl shadow-md hover:bg-gold-dark transition-all transform hover:-translate-y-0.5"
                    >
                      👉 View Latest Official Results ({quickDates[1]?.label})
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-white border-2 border-dashed border-border-default rounded-[24px] text-center p-16 max-w-xl mx-auto mt-8 shadow-sm">
                <div className="text-6xl mb-4 select-none">📭</div>
                <h3 className="text-text-primary font-display font-extrabold text-2xl mb-2">
                  No Results Found
                </h3>
                <p className="text-text-secondary font-body text-base leading-relaxed">
                  {filterLottery
                    ? `No official draws found for ${filterLottery} on this date.`
                    : "No official draws match your selected date or lottery filter."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(yesterdayDate)}
                    className="px-5 py-2.5 bg-brand-section border border-border-default text-text-primary font-display font-bold text-sm rounded-xl shadow-sm hover:border-gold transition-all"
                  >
                    View Latest Results ({quickDates[1]?.label})
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <>
            {/* Status Banner when viewing latest published draws */}
            {selectedDate === quickDates[1]?.value && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl px-5 py-3 text-xs md:text-sm text-amber-900 font-body">
                <div className="flex items-center gap-2">
                  <span className="text-base">ℹ️</span>
                  <span>
                    Showing <strong>latest official published results</strong> ({quickDates[1]?.label}). Today&apos;s ({quickDates[0]?.label.replace("Today (", "").replace(")", "")}) draws take place tonight around <strong>9:00 PM – 10:00 PM</strong>.
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-amber-100/80 text-amber-800 rounded-lg text-xs font-bold font-display uppercase tracking-wider">
                  Official Draw Date: {selectedDate}
                </span>
              </div>
            )}

            {/* Status Banner when viewing historical calendar date */}
            {selectedDate && selectedDate !== quickDates[0]?.value && selectedDate !== quickDates[1]?.value && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-blue-50/80 border border-blue-200 rounded-2xl px-5 py-3 text-xs md:text-sm text-blue-900 font-body">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <span>
                    Showing official draws for <strong>{new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</strong> ({filtered.length} lotteries found)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold font-display uppercase tracking-wider">
                    {selectedDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(quickDates[1]?.value || "")}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold underline ml-2"
                  >
                    Back to Latest Results
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((result, i) => {
              const matchedDef = LOTTERIES.find((l) => l.name === result.lottery_name);
              const expectedCount = matchedDef?.winningNumbers?.length || 4;
              const rawBalls = result.winningNumbers && result.winningNumbers.length > 0
                ? result.winningNumbers
                : [result.number_1, result.number_2, result.number_3, result.number_4, result.number_5];
              const balls = rawBalls.slice(0, Math.min(expectedCount, 5)).filter((n: any) => typeof n === "number" && !isNaN(n));
              const lotteryEmoji = LOTTERY_EMOJIS[result.lottery_name] || "🎫";

              return (
                <Card key={result.id || i} hover padding="md" className="flex flex-col justify-between hover:border-gold-border transition-all">
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-text-primary font-display font-extrabold text-lg leading-tight truncate flex items-center gap-1.5">
                          <span>{lotteryEmoji}</span>
                          <span>{tLottery(result.lottery_name)}</span>
                        </p>
                        <p className="text-text-secondary font-body text-xs font-semibold mt-1">
                          Draw #{result.draw_number}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(result.draw_date);
                          setIsRangeMode(false);
                        }}
                        title={`Filter results for ${result.draw_date}`}
                        className="cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <Badge variant="gold">{result.draw_date}</Badge>
                      </button>
                    </div>

                    {/* Middle Winning Numbers */}
                    <div>
                      <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider mb-2.5">
                        Official Winning Numbers
                      </p>
                      {isPyramidLottery(result.lottery_name) && balls.length >= 4 ? (
                        <PyramidResults numbers={balls} letter={result.letter} />
                      ) : (
                        <div className="flex gap-2 flex-wrap items-center">
                          {balls.map((n: number, j: number) => (
                            <NumberBall key={j} number={n} variant="gold" size="sm" />
                          ))}
                          {result.letter && (
                            <ZodiacBall value={result.letter} size="md" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Badges */}
                    {(result.zodiac || (!result.lottery_name?.toLowerCase().includes("jaya sampatha") && result.letter)) && (
                      <div className="flex gap-2.5 flex-wrap items-center">
                        {result.letter && (
                          <ZodiacBadge value={result.letter} />
                        )}
                        {result.zodiac && !getZodiacInfo(result.letter) && (
                          <ZodiacBadge value={result.zodiac} />
                        )}
                      </div>
                    )}

                    {/* Top Prize */}
                    {result.top_prize && (
                      <div className="pt-1">
                        <span className="text-[11px] text-text-muted font-bold block uppercase tracking-wider">
                          Top Jackpot Prize
                        </span>
                        <span className="text-amber-600 font-mono font-bold text-sm">
                          {result.top_prize}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border-default mt-5 pt-4 flex items-center justify-between">
                    <span className="text-text-muted text-xs font-body">by {result.uploaded_by}</span>
                    <Link
                      href={`/check?lottery=${encodeURIComponent(result.lottery_name)}&date=${result.draw_date}`}
                      className="text-gold-dark hover:text-gold font-body text-sm font-bold transition-colors flex items-center gap-1"
                    >
                      Check if you won →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
      </section>
    </div>
  );
}
