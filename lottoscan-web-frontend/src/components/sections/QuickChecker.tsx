"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import NumberBall from "@/components/ui/NumberBall";
import Card from "@/components/ui/Card";
import ZodiacSelector from "@/components/ui/ZodiacSelector";
import soundEffects from "@/lib/soundEffects";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import { lottery as lotteryApi } from "@/lib/api";
import { formatPrize, getToday } from "@/lib/utils";
import { LOTTERIES } from "@/lib/constants";
import { getLotteryConfig } from "@/lib/lotteryConfig";

export default function QuickChecker() {
  const [lotteryName, setLotteryName] = useState("");
  const [numbers, setNumbers] = useState<string[]>(["", "", "", "", ""]);
  const [letter, setLetter] = useState("");
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const config = getLotteryConfig(lotteryName);

  useEffect(() => {
    setNumbers((prev) => {
      const targetLength = config.digitCount;
      if (prev.length === targetLength) return prev;
      if (prev.length < targetLength) {
        return [...prev, ...Array(targetLength - prev.length).fill("")];
      }
      return prev.slice(0, targetLength);
    });
  }, [lotteryName, config.digitCount]);

  const handleNumber = (i: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");

    if (i === 0 && cleaned.length === 4 && numbers.slice(1).every((n) => !n)) {
      const digits = cleaned.split("");
      const next = [...numbers];
      digits.forEach((d, idx) => {
        if (idx < 5) next[idx] = d;
      });
      setNumbers(next);
      const lastInput = document.getElementById(`quick-num-3`);
      if (lastInput) (lastInput as HTMLInputElement).focus();
      return;
    }

    const v = cleaned.slice(0, 4);
    const next = [...numbers];
    next[i] = v;
    setNumbers(next);
    if (v.length === 2 && i < 4) {
      const nextInput = document.getElementById(`quick-num-${i + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleCheck = async () => {
    const parsedNums: number[] = [];

    numbers.forEach((val) => {
      if (!val) return;
      const isPyramidLot = lotteryName && (
        lotteryName.toLowerCase().includes("ada sampatha") ||
        lotteryName.toLowerCase().includes("jaya sampatha") ||
        lotteryName.toLowerCase().includes("nlb jaya")
      );
      if (val.length === 4 && isPyramidLot) {
        val.split("").forEach((d) => parsedNums.push(Number(d)));
      } else {
        const num = Number(val);
        if (!isNaN(num)) parsedNums.push(num);
      }
    });

    const parsed = parsedNums.filter((n) => !isNaN(n) && n >= 0);

    if (parsed.length === 0) { setError("Enter your ticket numbers"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await lotteryApi.checkTicket(parsed, date, lotteryName || undefined, letter || undefined);
      setResult(res.data);

      soundEffects.playResultFeedback({
        isWinner: res.data.isWinner,
        prizeAmount: Number(res.data.prizeAmount) || 0,
        isExpired: res.data.isExpired,
        isFutureDraw: res.data.isFutureDraw,
      });
    } catch (err: any) {
      soundEffects.playWarningSound();
      setError(err.response?.data?.error || "Failed to check. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <section className="py-24 bg-panel/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-gold text-sm font-body uppercase tracking-widest mb-3">Quick Check</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-4">Enter Your Numbers</h2>
          <p className="text-white/40 font-body text-lg">Type the numbers from your ticket below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Input */}
          <Card padding="lg">
            <h3 className="font-display font-semibold text-lg mb-4">Your Ticket Numbers</h3>

            {/* Lottery Selector */}
            <div className="mb-5">
              <label className="text-white/40 text-xs font-body block mb-1.5 font-medium">Select Lottery (optional)</label>
              <select
                value={lotteryName}
                onChange={(e) => setLotteryName(e.target.value)}
                className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-gold/50 transition-all"
              >
                <option value="">Auto-detect Lottery</option>
                {LOTTERIES.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2.5 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <input
                  key={i}
                  id={`quick-num-${i}`}
                  type="text"
                  inputMode="numeric"
                  value={numbers[i] || ""}
                  onChange={(e) => handleNumber(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !numbers[i] && i > 0) {
                      const prevInput = document.getElementById(`quick-num-${i - 1}`);
                      if (prevInput) (prevInput as HTMLInputElement).focus();
                    }
                  }}
                  placeholder="0"
                  maxLength={4}
                  className="w-full aspect-square text-center font-mono font-bold text-lg sm:text-xl bg-dark border border-white/10 rounded-2xl text-white focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <ZodiacSelector
                value={letter}
                onChange={setLetter}
                label="Lagna / Letter (optional)"
              />
              <div>
                <label className="text-white/40 text-xs font-body block mb-1.5">Draw Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 text-white font-body focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-loss text-sm font-body mb-4 text-center">{error}</p>}

            <Button onClick={handleCheck} loading={loading} fullWidth size="lg">
              Check My Numbers
            </Button>

            <button
              onClick={() => { setNumbers(["","","","",""]); setLetter(""); setResult(null); setError(""); }}
              className="w-full mt-3 text-white/30 text-sm font-body hover:text-white/50 transition-colors"
            >
              Clear All
            </button>
          </Card>

          {/* Result */}
          <div>
            {!result && !loading && (
              <Card className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="text-6xl mb-4 opacity-30">🎫</div>
                <p className="text-white/30 font-body">Enter your numbers to check</p>
                <p className="text-white/20 font-body text-sm mt-2">Your result will appear here</p>
              </Card>
            )}

            {loading && (
              <Card className="h-full flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/50 font-body">Checking your numbers...</p>
              </Card>
            )}

            {result && !loading && (
              <Card glow={result.isWinner && !result.isExpired ? "gold" : "none"} padding="lg" className={`animate-slide-up ${result.isExpired ? "border-rose-500/40 bg-rose-950/20" : ""}`}>
                {result.isWinner ? (
                  <div className="text-center space-y-4">
                    <div className="text-5xl">{result.isExpired ? "⏳" : "🏆"}</div>
                    {result.isExpired ? (
                      <>
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Expired Ticket (&gt; 6 Months)
                        </span>
                        <h3 className="font-display font-extrabold text-2xl text-rose-400">Claim Period Expired</h3>
                        <p className="font-display font-extrabold text-3xl text-white/30 line-through">
                          {formatPrize(result.prizeAmount)}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-display font-extrabold text-3xl text-gold">You Won!</h3>
                        <p className="font-display font-extrabold text-4xl text-white">
                          {formatPrize(result.prizeAmount)}
                        </p>
                      </>
                    )}
                    <p className="text-white/40 font-body text-sm">{result.prizeCategory}</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {(result.ticketNumbers || []).map((n: number, i: number) => (
                        <NumberBall key={i} number={n} variant={result.matchedNumbers?.includes(n) ? "matched" : "unmatched"} />
                      ))}
                    </div>
                    <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 text-left space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/40">Lottery</span><span className="text-white">{result.lotteryName}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Draw #</span><span className="text-white">{result.drawNumber}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Matches</span><span className="text-gold font-bold">{result.matchedCount} numbers</span></div>
                      {result.expiryDate && (
                        <div className="flex justify-between"><span className="text-white/40">Claim Deadline</span><span className={result.isExpired ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{result.expiryDate}</span></div>
                      )}
                    </div>
                    {result.isExpired ? (
                      <p className="text-rose-400 text-xs font-body font-semibold">
                        ⚠️ Ticket Expired: NLB &amp; DLB law limits prize redemption to 6 months from draw.
                      </p>
                    ) : (
                      <p className="text-gold/80 text-xs font-body">
                        🏦 Claim within 6 months ({result.daysRemaining !== undefined ? `${result.daysRemaining} days left` : "180 days"}) at any NLB/DLB branch
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-5xl opacity-50">😔</div>
                    <h3 className="font-display font-bold text-2xl text-white/60">No Match</h3>
                    <p className="text-white/40 font-body text-sm">
                      {result.message || "Your numbers did not match this draw"}
                    </p>
                    {result.winningNumbers && result.winningNumbers.length > 0 && (
                      <div>
                        <p className="text-white/30 text-xs font-body mb-2">Winning Numbers</p>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {result.winningNumbers.map((n: number, i: number) => (
                            <NumberBall key={i} number={n} variant="unmatched" size="sm" />
                          ))}
                        </div>
                      </div>
                    )}
                    <Button variant="secondary" fullWidth onClick={() => { setNumbers(["","","","",""]); setResult(null); }}>
                      Try Again
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
