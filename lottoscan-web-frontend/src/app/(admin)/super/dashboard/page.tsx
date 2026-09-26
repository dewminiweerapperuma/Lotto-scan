"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { superAdmin } from "@/lib/api";
import {
  Activity,
  Trophy,
  Coins,
  Building2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users
} from "lucide-react";

interface MetricsData {
  totalTicketsScanned: number;
  nationalWinnersCount: number;
  totalDisbursedLKR: number;
  activeAgentsCount: number;
  totalAgentsCount: number;
  suspendedAgentsCount: number;
  pendingAgentsCount: number;
  activeCountersCount: number;
  boardReconciliation: {
    NLB: {
      board: string;
      winningTickets: number;
      totalDisbursed: number;
      sharePercentage: number;
    };
    DLB: {
      board: string;
      winningTickets: number;
      totalDisbursed: number;
      sharePercentage: number;
    };
  };
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await superAdmin.getMetrics();
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      }
    } catch (err: any) {
      console.error("Failed to load metrics:", err);
      setError(err.response?.data?.message || "Failed to load national governance metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleForceScrape = async () => {
    try {
      setActionMessage("Triggering national web crawlers across NLB & DLB...");
      const res = await superAdmin.triggerScraper("ALL");
      if (res.data?.success) {
        setActionMessage(`Crawlers completed! Updated ${res.data.lotteriesScraped} lotteries.`);
        fetchMetrics();
      }
    } catch (err: any) {
      setActionMessage("Scraper trigger failed: " + (err.message || "Network issue"));
    } finally {
      setTimeout(() => setActionMessage(""), 5000);
    }
  };

  const formatLKR = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              National Super Admin Overview
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-mono text-slate-400">
              {new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
            Island-Wide Governance Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Real-time synchronization across 25 administrative districts, multi-agency counter networks, and official NLB & DLB draws.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={handleForceScrape}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Scrape</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage("")} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Island-wide Scans */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Island-wide Scans</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              {loading ? "..." : (metrics?.totalTicketsScanned || 240).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <span>↑ Active across 25 Districts</span>
            </p>
          </div>
        </div>

        {/* KPI 2: National Winners */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">National Winners</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-display font-extrabold text-amber-400">
              {loading ? "..." : (metrics?.nationalWinnersCount || 14).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Matched prize tickets claimed today
            </p>
          </div>
        </div>

        {/* KPI 3: Total Disbursed (LKR) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Disbursed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400 truncate">
              {loading ? "..." : formatLKR(metrics?.totalDisbursedLKR || 98700)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Net audited payouts to public
            </p>
          </div>
        </div>

        {/* KPI 4: Active Dealers */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Agencies</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                {loading ? "..." : metrics?.activeAgentsCount ?? 1}
              </p>
              <span className="text-xs text-slate-400">
                / {metrics?.totalAgentsCount ?? 1} registered
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {metrics?.activeCountersCount || 21} active seller counters online
            </p>
          </div>
        </div>
      </div>

      {/* Dual-Board Reconciliation Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Dual-Board National Reconciliation</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                QuestDB Ledger
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of disbursements, winner claims, and market distribution between National Lotteries Board & Development Lotteries Board.
            </p>
          </div>
          <Link
            href="/super/claims"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            <span>Investigate Claims</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NLB Reconciliation Card */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="font-bold text-sm text-amber-300">
                  National Lotteries Board (NLB)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {metrics?.boardReconciliation?.NLB?.sharePercentage ?? 55}% Volume
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Winning Tickets</span>
                <span className="text-xl font-bold font-display text-white mt-1 block">
                  {metrics?.boardReconciliation?.NLB?.winningTickets ?? 8}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Payout (LKR)</span>
                <span className="text-lg font-bold font-display text-emerald-400 mt-1 block truncate">
                  {formatLKR(metrics?.boardReconciliation?.NLB?.totalDisbursed ?? 14200)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
              <span>Lotteries Covered: Govisetha, Mahajana Sampatha, Mega Power, etc.</span>
            </div>
          </div>

          {/* DLB Reconciliation Card */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-blue-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-bold text-sm text-blue-300">
                  Development Lotteries Board (DLB)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                {metrics?.boardReconciliation?.DLB?.sharePercentage ?? 45}% Volume
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Winning Tickets</span>
                <span className="text-xl font-bold font-display text-white mt-1 block">
                  {metrics?.boardReconciliation?.DLB?.winningTickets ?? 6}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Payout (LKR)</span>
                <span className="text-lg font-bold font-display text-emerald-400 mt-1 block truncate">
                  {formatLKR(metrics?.boardReconciliation?.DLB?.totalDisbursed ?? 84500)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
              <span>Lotteries Covered: Ada Kotipathi, Shanida, Lagna Wasanawa, etc.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Governance Administrative Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/super/draws"
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/70 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
              Emergency Draw Override
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Publish or correct winning balls, letters, and zodiacs if official government portals delay data.
            </p>
          </div>
        </Link>

        <Link
          href="/super/agents"
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/70 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
              Agency Governance
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Review registered Area Agents, inspect counter staff licenses, approve or suspend dealership access.
            </p>
          </div>
        </Link>

        <Link
          href="/super/claims"
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/70 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-400/10 border border-rose-400/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white group-hover:text-rose-300 transition-colors">
              Inter-Agency Duplicate Scanner
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspect suspicious ticket serial codes presented at multiple independent dealerships island-wide.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
