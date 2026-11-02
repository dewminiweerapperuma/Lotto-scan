"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  QrCode,
  ClipboardList,
  Users,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Building2,
  Calendar,
  Wallet,
  Ticket,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock
} from "lucide-react";

export default function AgentDashboardPage() {
  const { user, loading, isAgent, isAdmin, logout } = useAuth();
  const { t, tLottery } = useLanguage();
  const router = useRouter();

  const [dailyData, setDailyData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!loading && !isAgent && !isAdmin) {
      router.push("/agent/login");
    }
  }, [loading, isAgent, isAdmin, router]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const agentId = user.id || user.userId || "default-agent";
      const [reportRes, empRes, claimsRes] = await Promise.all([
        agentApi.getDailyReport(todayStr, agentId),
        agentApi.getEmployees(agentId),
        agentApi.getClaims(todayStr, agentId)
      ]);

      setDailyData(reportRes.data?.data || null);
      setEmployees(empRes.data?.data || []);
      setClaimsList(claimsRes.data?.data || []);
    } catch (err) {
      console.warn("Could not load agent dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [user, todayStr]);

  useEffect(() => {
    if (isAgent || isAdmin) {
      loadDashboardData();
    }
  }, [isAgent, isAdmin, loadDashboardData]);

  if (loading || (!isAgent && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const agencyName = user?.agencyName || "Lanka Mega Lottery Agency (Pettah Central)";
  const agentCode = user?.agentCode || "AGN-001";
  const boardAffiliation = user?.boardAffiliation || "BOTH";
  const location = user?.location || "Pettah Main Bus Stand, Colombo 11";

  // Derive NLB and DLB IDs accurately based on board affiliation
  const rawCode = (user?.agentCode || "AGN-001").trim();
  const cleanCode = rawCode.replace(/^(NLB|DLB)[-_/]?/i, "");
  const nlbId = (user as any)?.nlbId || (rawCode.toUpperCase().startsWith("NLB") ? rawCode.toUpperCase() : `NLB-${cleanCode}`);
  const dlbId = (user as any)?.dlbId || (rawCode.toUpperCase().startsWith("DLB") ? rawCode.toUpperCase() : `DLB-${cleanCode}`);

  const totalPrize = dailyData?.totalPrizeAmount || 0;
  const totalClaimsCount = dailyData?.totalClaimsCount || claimsList.length || 0;

  return (
    <div className="min-h-screen relative pt-24 pb-16 overflow-hidden bg-slate-950 text-slate-100">
      {/* Background photo - clearly visible with gentle cinematic vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-background.jpg"
          alt="LottoScan Agency Dashboard Background"
          fill
          priority
          quality={100}
          className="object-cover object-center select-none pointer-events-none opacity-90 scale-100"
        />
        {/* Subtle dark tint to maintain high text legibility without obscuring the background visual */}
        <div className="absolute inset-0 bg-slate-950/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/40 pointer-events-none" />
      </div>

      <div className="container relative z-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ─── Modern Dashboard Two-Column Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ══════════════════════════════════════════════════════════════════
              LEFT SIDE: AGENCY OPERATIONS COMMAND HUB (Reduced Width & Level Alignment)
          ══════════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-4">
            
            {/* Command Hub Sidebar Container */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-gold to-blue-500" />

              {/* Sidebar Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700/80">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                <h2 className="text-xs font-display font-extrabold uppercase tracking-wider text-slate-200">
                  {t("agent_command_hub")}
                </h2>
              </div>

              {/* Operations Navigation Modules */}
              <div className="space-y-2.5">
                {/* 1. Continuous Bulk Scanner */}
                <Link
                  href="/scan"
                  className="group block p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/70 hover:border-amber-400/80 transition-all shadow-md hover:shadow-amber-500/10"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display font-extrabold text-xs text-slate-100 group-hover:text-amber-400 transition-colors">
                          {t("agent_bulk_scanner_title")}
                        </h3>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-300 font-body mt-0.5 line-clamp-2 leading-snug">
                        {t("agent_bulk_scanner_desc")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <span>{t("agent_launch_scanner")}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 2. Daily Orders & Commission */}
                <Link
                  href="/admin/orders"
                  className="group block p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/70 hover:border-blue-400/80 transition-all shadow-md hover:shadow-blue-500/10"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      📋
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display font-extrabold text-xs text-slate-100 group-hover:text-blue-400 transition-colors">
                          {t("orders_page_title")}
                        </h3>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-300 font-body mt-0.5 line-clamp-2 leading-snug">
                        {t("agent_orders_desc")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-blue-400">
                        <span>{t("agent_manage_orders")}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 3. Counter Staff & Sellers */}
                <Link
                  href="/admin/reports"
                  className="group block p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/70 hover:border-emerald-400/80 transition-all shadow-md hover:shadow-emerald-500/10"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      👥
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display font-extrabold text-xs text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {t("agent_staff_title")}
                        </h3>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-300 font-body mt-0.5 line-clamp-2 leading-snug">
                        {t("agent_staff_desc")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <span>{t("agent_view_staff")}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 4. Winning Claims Audit */}
                <Link
                  href="/admin/reports"
                  className="group block p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800/95 border border-slate-700/70 hover:border-purple-400/80 transition-all shadow-md hover:shadow-purple-500/10"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      💰
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display font-extrabold text-xs text-slate-100 group-hover:text-purple-400 transition-colors">
                          {t("agent_claims_audit_title")}
                        </h3>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-300 font-body mt-0.5 line-clamp-2 leading-snug">
                        {t("agent_claims_audit_desc")}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-purple-400">
                        <span>{t("agent_audit_claims")}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Operational Status Pill */}
              <div className="pt-2.5 border-t border-slate-700/80 text-[10px] text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>System Engine</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live Synced
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Session</span>
                  <span className="font-mono text-slate-200 font-semibold">{todayStr}</span>
                </div>
              </div>
            </div>
          </aside>


          {/* ══════════════════════════════════════════════════════════════════
              RIGHT SIDE: MAIN AGENCY METRICS & SETTLEMENT DASHBOARD
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-6">

            {/* ─── Top Agency Profile Header Card ─── */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-gold to-blue-500" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-sm shrink-0">
                    🏢
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                        {agencyName}
                      </h1>
                      
                      {/* Separate Board IDs badges */}
                      {boardAffiliation === "BOTH" ? (
                        <>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-sans">NLB:</span>
                            {nlbId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-amber-400 font-sans">DLB:</span>
                            {dlbId}
                          </span>
                        </>
                      ) : boardAffiliation === "NLB" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-blue-400 font-sans">NLB:</span>
                          {nlbId}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-amber-400 font-sans">DLB:</span>
                          {dlbId}
                        </span>
                      )}

                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase ${
                        boardAffiliation === "NLB"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : boardAffiliation === "DLB"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}>
                        {boardAffiliation === "BOTH"
                          ? t("agent_dual_dealer")
                          : boardAffiliation === "NLB"
                          ? t("agent_nlb_dealer")
                          : t("agent_dlb_dealer")}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ● {t("agent_verified_active")}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-body mt-2 flex items-center gap-2 flex-wrap">
                      <span>📍 {location}</span>
                      <span>•</span>
                      {boardAffiliation === "BOTH" ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-400">Official Board IDs:</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-200 font-mono text-[11px] font-bold">
                            <span className="text-[9px] text-blue-400 font-sans font-black">NLB</span>
                            {nlbId}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-200 font-mono text-[11px] font-bold">
                            <span className="text-[9px] text-amber-400 font-sans font-black">DLB</span>
                            {dlbId}
                          </span>
                        </div>
                      ) : boardAffiliation === "NLB" ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Official NLB ID:</span>
                          <code className="font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/40 font-bold">{nlbId}</code>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Official DLB ID:</span>
                          <code className="font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 font-bold">{dlbId}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Quick Actions (NO WHITE) */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <LanguageToggle variant="compact" />
                  <button
                    onClick={loadDashboardData}
                    disabled={dataLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${dataLoading ? "animate-spin" : ""}`} />
                    <span>{t("agent_refresh")}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 transition-all shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t("agent_sign_out")}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Operational Live KPI Bar (Dark Translucent Glass, High Contrast) ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Payouts Handled Today */}
              <div className="p-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 shadow-xl rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-body font-bold uppercase tracking-wider">
                    {t("agent_payouts_today")}
                  </p>
                  <p className="text-xl sm:text-2xl font-display font-extrabold text-amber-400 mt-1">
                    Rs. {totalPrize.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{totalClaimsCount} {t("agent_tickets_paid_count")}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shrink-0">
                  💰
                </div>
              </div>

              {/* Winning Claims Paid */}
              <div className="p-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 shadow-xl rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-body font-bold uppercase tracking-wider">
                    {t("agent_claims_paid")}
                  </p>
                  <p className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400 mt-1">
                    {totalClaimsCount} <span className="text-xs font-body font-semibold text-slate-400">{t("agent_claims_tickets")}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t("agent_recorded_payouts")}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg shrink-0">
                  🎟️
                </div>
              </div>

              {/* Registered Staff & Counters */}
              <div className="p-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 shadow-xl rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-body font-bold uppercase tracking-wider">
                    {t("agent_registered_staff")}
                  </p>
                  <p className="text-xl sm:text-2xl font-display font-extrabold text-slate-100 mt-1">
                    {employees.length} <span className="text-xs font-body font-semibold text-slate-400">{t("agent_staff_count")}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t("agent_assigned_branches")}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-lg shrink-0">
                  👥
                </div>
              </div>

              {/* Settlement Date */}
              <div className="p-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 shadow-xl rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-body font-bold uppercase tracking-wider">
                    {t("agent_settlement_date")}
                  </p>
                  <p className="text-lg sm:text-xl font-display font-extrabold text-slate-200 mt-1">
                    {todayStr}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t("agent_active_cycle")}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                  📅
                </div>
              </div>
            </div>

            {/* ─── Recent Claims Ledger (Live Activity Table) ─── */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 shadow-2xl p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/80">
                <div>
                  <h3 className="text-base font-display font-extrabold text-white">
                    {t("agent_recent_payouts_title")}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {t("agent_recent_payouts_desc")} ({agentCode})
                  </p>
                </div>
                <Link
                  href="/admin/reports"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <span>{t("agent_full_ledger")}</span>
                  <span>→</span>
                </Link>
              </div>

              {claimsList.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400 font-body">
                  <div className="text-3xl mb-2">🎟️</div>
                  <p className="font-bold text-slate-200 text-sm">{t("agent_no_payouts_today")}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{t("agent_no_payouts_hint")}</p>
                  <Link
                    href="/scan"
                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <span>⚡ {t("agent_launch_scanner")}</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-body">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 font-bold text-[11px] uppercase tracking-wider border-b border-slate-700/80">
                        <th className="py-2.5 px-3">{t("table_serial")}</th>
                        <th className="py-2.5 px-3">{t("table_lottery")}</th>
                        <th className="py-2.5 px-3">{t("table_board")}</th>
                        <th className="py-2.5 px-3">{t("table_tier")}</th>
                        <th className="py-2.5 px-3">{t("table_counter_staff")}</th>
                        <th className="py-2.5 px-3 text-right">{t("table_prize")}</th>
                        <th className="py-2.5 px-3 text-center">{t("table_status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {claimsList.slice(0, 8).map((claim, idx) => (
                        <tr key={claim.id || idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{claim.ticket_serial || claim.ticketSerial}</td>
                          <td className="py-2.5 px-3 font-extrabold text-white">{tLottery(claim.lottery_name || claim.lotteryName)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              claim.board === "NLB" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}>
                              {claim.board || "NLB"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{claim.matched_tier || claim.matchedTier}</td>
                          <td className="py-2.5 px-3 text-slate-300">{claim.employee_name || claim.employeeName || "Counter Staff"}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-400">
                            Rs. {Number(claim.prize_amount || claim.prizeAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                              {t("table_paid")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
