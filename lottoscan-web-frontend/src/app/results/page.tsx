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

const QUICK_DATES = [
  { label: "Today (24 Sep)", value: "2026-09-24" },
  { label: "Yesterday (23 Sep)", value: "2026-09-23" },
  { label: "22 Sep", value: "2026-09-22" },
  { label: "21 Sep", value: "2026-09-21" },
  { label: "20 Sep", value: "2026-09-20" },
  { label: "19 Sep", value: "2026-09-19" },
  { label: "All Recent Draws", value: "" },
];

export default function ResultsPage() {
  const { t, tLottery } = useLanguage();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("2026-09-24");
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [from, setFrom] = useState("2026-09-19");
  const [to, setTo] = useState("2026-09-24");
  const [search, setSearch] = useState("");
  const [filterLottery, setFilterLottery] = useState("");

  useEffect(() => {
    setLoading(true);
    const lotteryParam = filterLottery?.trim() || undefined;

    let request;
    if (!isRangeMode && selectedDate) {
      // Query specific single date
      request = lotteryApi.getAllDraws(undefined, undefined, lotteryParam, selectedDate);
    } else if (isRangeMode) {
      // Query date range
      const fromParam = from?.trim() || undefined;
      const toParam = to?.trim() || undefined;
      request = lotteryApi.getAllDraws(fromParam, toParam, lotteryParam);
    } else {
      // Query all recent draws
      request = lotteryApi.getAllDraws(undefined, undefined, lotteryParam);
    }

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
  }, [selectedDate, isRangeMode, from, to, filterLottery]);

  const filtered = results.filter((r) => {
    if (filterLottery && r.lottery_name !== filterLottery) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = r.lottery_name?.toLowerCase().includes(q);
      const matchDraw = r.draw_number?.toString().toLowerCase().includes(q);
      if (!matchName && !matchDraw) return false;
    }
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
            {QUICK_DATES.map((d, idx) => {
              const isActive = !isRangeMode && selectedDate === d.value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.value);
                    setIsRangeMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gold text-white shadow-sm shadow-gold/30 scale-105"
                      : "bg-brand-section text-text-secondary hover:text-text-primary hover:bg-gold-light/40 border border-border-default/60"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsRangeMode(!isRangeMode)}
              className={`px-3 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap transition-all border ${
                isRangeMode
                  ? "bg-gold text-white border-gold shadow-sm"
                  : "bg-white text-text-secondary hover:text-text-primary border-border-default"
              }`}
            >
              📆 {isRangeMode ? "Range Active" : "Custom Range"}
            </button>
          </div>

          {/* Search and Dropdowns Row */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                Search Name
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by lottery name..."
                className="input-dark text-sm w-full"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
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

            {/* Single Date or Date Range Input */}
            {!isRangeMode ? (
              <div className="w-full sm:w-auto">
                <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                  Draw Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-dark text-sm w-full"
                />
              </div>
            ) : (
              <>
                <div className="w-full sm:w-auto">
                  <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="input-dark text-sm w-full"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="input-dark text-sm w-full"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                setSearch("");
                setFilterLottery("");
                setSelectedDate("2026-09-24");
                setIsRangeMode(false);
                setFrom("2026-09-19");
                setTo("2026-09-24");
              }}
              className="text-gold-dark hover:text-gold hover:underline text-sm font-body font-bold transition-colors px-4 py-3 shrink-0"
            >
              Clear Filters
            </button>
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
          <div className="bg-white border-2 border-dashed border-border-default rounded-[24px] text-center p-16 max-w-xl mx-auto mt-8 shadow-sm">
            <div className="text-6xl mb-4 select-none">📭</div>
            <h3 className="text-text-primary font-display font-extrabold text-2xl mb-2">
              No Results Found
            </h3>
            <p className="text-text-secondary font-body text-base leading-relaxed">
              No official draws match your selected date or search filter.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("2026-09-24");
                  setIsRangeMode(false);
                  setSearch("");
                  setFilterLottery("");
                }}
                className="px-5 py-2.5 bg-gold text-white font-display font-bold text-sm rounded-xl shadow-sm hover:bg-gold-dark transition-all"
              >
                View Today's Results (24 Sep)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("");
                  setIsRangeMode(false);
                }}
                className="px-5 py-2.5 bg-white border border-border-default text-text-primary font-display font-bold text-sm rounded-xl shadow-sm hover:border-gold transition-all"
              >
                View All Recent Draws
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
