"use client";

import { useEffect, useState } from "react";
import { lottery, superAdmin } from "@/lib/api";
import {
  Trophy,
  PlusCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Sliders
} from "lucide-react";

interface DrawItem {
  name: string;
  topPrize: string;
  board: string;
  drawNumber: string;
  letter: string;
  winningNumbers: string[];
  updatedAt: string;
}

export default function SuperAdminDrawsPage() {
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Emergency Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lotteryName: "Govisetha",
    board: "NLB",
    drawNumber: "",
    drawDate: new Date().toISOString().slice(0, 10),
    winningNumbers: "",
    letter: "",
    zodiac: "",
    promotionalCode: "",
    topPrize: "Rs. 75,000,000",
  });

  const fetchDraws = async () => {
    try {
      setLoading(true);
      const res = await lottery.getLivePrizes();
      if (Array.isArray(res.data)) {
        setDraws(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load live draws.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraws();
  }, []);

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lotteryName || !formData.drawNumber) {
      setError("Lottery Name and Draw Number are mandatory.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await superAdmin.overrideDraw({
        lotteryName: formData.lotteryName,
        drawNumber: formData.drawNumber,
        drawDate: formData.drawDate,
        winningNumbers: formData.winningNumbers,
        letter: formData.letter,
        zodiac: formData.zodiac,
        promotionalCode: formData.promotionalCode,
        topPrize: formData.topPrize,
        board: formData.board,
      });

      if (res.data?.success) {
        setMessage(`Emergency override published for ${formData.lotteryName} #${formData.drawNumber}!`);
        setModalOpen(false);
        fetchDraws();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish manual draw override.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const filteredDraws = draws.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.drawNumber.includes(search) ||
      (d.board && d.board.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Draws & Manual Override Console</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of official winning balls, letters, zodiac symbols, and instant emergency publish latch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDraws}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emergency Manual Entry</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by Lottery Name or Draw Number..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Draws Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
            <p className="text-xs">Fetching verified winning draws from QuestDB...</p>
          </div>
        ) : filteredDraws.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No live draw records matched your query.
          </div>
        ) : (
          filteredDraws.map((d, i) => (
            <div
              key={`${d.name}-${d.drawNumber}-${i}`}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        d.board === "NLB"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {d.board || "NLB"}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      Draw #{d.drawNumber}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-white mt-1">
                    {d.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Top Jackpot</span>
                  <span className="text-xs font-bold text-amber-400">{d.topPrize || "Grand Prize"}</span>
                </div>
              </div>

              {/* Winning Numbers & Letter Display */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {d.letter && (
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/20">
                    {d.letter}
                  </div>
                )}
                {Array.isArray(d.winningNumbers) &&
                  d.winningNumbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center"
                    >
                      {String(num).padStart(2, "0")}
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                <span>Updated: {d.updatedAt ? new Date(d.updatedAt).toLocaleTimeString() : "Live"}</span>
                <span className="text-emerald-400 font-bold">● Active in Engine</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Emergency Manual Draw Override Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Emergency Manual Draw Publisher</h3>
                  <p className="text-[11px] text-slate-400">Instantly override or insert winning balls in QuestDB</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleManualOverride} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Lottery Board</label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="NLB">NLB (National Lotteries Board)</option>
                    <option value="DLB">DLB (Development Lotteries Board)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Lottery Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lotteryName}
                    onChange={(e) => setFormData({ ...formData, lotteryName: e.target.value })}
                    placeholder="e.g. Govisetha or Ada Kotipathi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Draw Number</label>
                  <input
                    type="text"
                    required
                    value={formData.drawNumber}
                    onChange={(e) => setFormData({ ...formData, drawNumber: e.target.value })}
                    placeholder="e.g. 4562"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Draw Date</label>
                  <input
                    type="date"
                    value={formData.drawDate}
                    onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">
                  Winning Numbers (space or comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.winningNumbers}
                  onChange={(e) => setFormData({ ...formData, winningNumbers: e.target.value })}
                  placeholder="e.g. 12 34 56 78"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Winning Letter</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.letter}
                    onChange={(e) => setFormData({ ...formData, letter: e.target.value.toUpperCase() })}
                    placeholder="e.g. A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Zodiac (if astrological)</label>
                  <input
                    type="text"
                    value={formData.zodiac}
                    onChange={(e) => setFormData({ ...formData, zodiac: e.target.value })}
                    placeholder="e.g. Makara or Capricorn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Promotional Code (4 digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.promotionalCode}
                    onChange={(e) => setFormData({ ...formData, promotionalCode: e.target.value })}
                    placeholder="e.g. 7482"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-mono tracking-wider mb-1 block">Top Prize / Jackpot</label>
                  <input
                    type="text"
                    value={formData.topPrize}
                    onChange={(e) => setFormData({ ...formData, topPrize: e.target.value })}
                    placeholder="e.g. Rs. 80,000,000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Publishing to QuestDB..." : "Publish Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
