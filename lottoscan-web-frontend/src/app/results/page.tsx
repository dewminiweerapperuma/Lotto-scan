"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { lottery as lotteryApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import NumberBall from "@/components/ui/NumberBall";
import ZodiacBall, { ZodiacBadge } from "@/components/ui/ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import { LOTTERIES, LotteryInfo } from "@/lib/constants";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import { useLanguage } from "@/context/LanguageContext";

export default function ResultsPage() {
  const { t, tLottery } = useLanguage();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [filterLottery, setFilterLottery] = useState("");

  useEffect(() => {
    setLoading(true);
    lotteryApi
      .getAllDraws(from, to)
      .then((r) => setResults(r.data.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  const filtered = results.filter((r) => {
    if (filterLottery && r.lottery_name !== filterLottery) return false;
    if (search && !r.lottery_name?.toLowerCase().includes(search.toLowerCase())) return false;
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
                Auto-fetch active
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar (Sticky) */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#F3F4F6] shadow-sm py-4">
        <div className="container">
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
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
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
            <button
              onClick={() => {
                setSearch("");
                setFilterLottery("");
                setFrom(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
                setTo(new Date().toISOString().slice(0, 10));
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
          <div className="bg-white border-2 border-dashed border-border-default rounded-[24px] text-center p-20 max-w-xl mx-auto mt-8 shadow-sm">
            <div className="text-6xl mb-5 select-none">📭</div>
            <h3 className="text-text-primary font-display font-extrabold text-2xl mb-2">
              No Results Found
            </h3>
            <p className="text-text-secondary font-body text-base leading-relaxed">
              Results are published daily at 11:15 PM Sri Lanka time.
            </p>
            <p className="text-text-muted font-body text-sm mt-1">
              Try adjusting the date range filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((result, i) => {
              const balls = [result.number_1, result.number_2, result.number_3, result.number_4, result.number_5].filter((n) => n > 0);
              return (
                <Card key={i} hover padding="md" className="flex flex-col justify-between hover:border-gold-border">
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-text-primary font-display font-extrabold text-lg leading-tight truncate">
                          {tLottery(result.lottery_name)}
                        </p>
                        <p className="text-text-secondary font-body text-xs font-semibold mt-1">
                          Draw #{result.draw_number}
                        </p>
                      </div>
                      <Badge variant="gold">{result.draw_date}</Badge>
                    </div>

                    {/* Middle Winning Numbers */}
                    <div>
                      <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider mb-2.5">
                        Winning Numbers
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
