"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";

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

  const totalPrize = dailyData?.totalPrizeAmount || 0;
  const totalClaimsCount = dailyData?.totalClaimsCount || claimsList.length || 0;

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16 text-text-primary">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ─── Top Agency Profile Header ─── */}
        <div className="bg-white border border-border-default rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-gold to-blue-600" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gold-light border-2 border-gold flex items-center justify-center text-3xl shadow-sm shrink-0">
                🏢
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-display font-extrabold text-text-primary">
                    {agencyName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {agentCode}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    boardAffiliation === "NLB"
                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                      : boardAffiliation === "DLB"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  }`}>
                    {boardAffiliation === "BOTH"
                      ? t("agent_dual_dealer")
                      : boardAffiliation === "NLB"
                      ? t("agent_nlb_dealer")
                      : t("agent_dlb_dealer")}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    ● {t("agent_verified_active")}
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-body mt-1">
                  📍 {location} • {t("agent_official_id")}: <code className="font-mono text-text-primary">{user?.id || user?.userId || "agn-master"}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <LanguageToggle variant="compact" />
              <Button
                variant="secondary"
                size="sm"
                onClick={loadDashboardData}
                loading={dataLoading}
                className="text-xs font-bold"
              >
                🔄 {t("agent_refresh")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200"
              >
                🚪 {t("agent_sign_out")}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Operational Live KPI Bar ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("agent_payouts_today")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-gold-dark mt-1">
                Rs. {totalPrize.toLocaleString()}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{totalClaimsCount} {t("agent_tickets_paid_count")}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("agent_claims_paid")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                {totalClaimsCount} <span className="text-xs font-body font-semibold text-text-muted">{t("agent_claims_tickets")}</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{t("agent_recorded_payouts")}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              🎟️
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("agent_registered_staff")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {employees.length} <span className="text-xs font-body font-semibold text-text-muted">{t("agent_staff_count")}</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{t("agent_assigned_branches")}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shrink-0">
              👥
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("agent_settlement_date")}
              </p>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-text-primary mt-1">
                {todayStr}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{t("agent_active_cycle")}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-brand-section border border-border-default flex items-center justify-center text-xl shrink-0">
              📅
            </div>
          </Card>
        </div>

        {/* ─── Operations Command Center (Quick Launch Hub) ─── */}
        <div className="space-y-3">
          <h2 className="text-sm font-display font-extrabold uppercase tracking-wider text-text-secondary">
            {t("agent_command_hub")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1: Bulk Scanner */}
            <Link
              href="/scan"
              className="p-5 rounded-2xl bg-white border border-border-default hover:border-gold shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-light border border-gold-border flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <h3 className="font-display font-extrabold text-base text-text-primary group-hover:text-gold-dark transition-colors">
                  {t("agent_bulk_scanner_title")}
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  {t("agent_bulk_scanner_desc")}
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-gold-dark flex items-center gap-1">
                <span>{t("agent_launch_scanner")}</span>
                <span>→</span>
              </div>
            </Link>

            {/* Action 2: Daily Orders & Reconciliation */}
            <Link
              href="/admin/orders"
              className="p-5 rounded-2xl bg-white border border-border-default hover:border-blue-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  📋
                </div>
                <h3 className="font-display font-extrabold text-base text-text-primary group-hover:text-blue-700 transition-colors">
                  {t("orders_page_title")}
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  {t("agent_orders_desc")}
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>{t("agent_manage_orders")}</span>
                <span>→</span>
              </div>
            </Link>

            {/* Action 3: Counter Staff Management */}
            <Link
              href="/admin/reports"
              className="p-5 rounded-2xl bg-white border border-border-default hover:border-emerald-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  👥
                </div>
                <h3 className="font-display font-extrabold text-base text-text-primary group-hover:text-emerald-700 transition-colors">
                  {t("agent_staff_title")}
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  {t("agent_staff_desc")}
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span>{t("agent_view_staff")}</span>
                <span>→</span>
              </div>
            </Link>

            {/* Action 4: Winning Claims Audit */}
            <Link
              href="/admin/reports"
              className="p-5 rounded-2xl bg-white border border-border-default hover:border-purple-400 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                  💰
                </div>
                <h3 className="font-display font-extrabold text-base text-text-primary group-hover:text-purple-700 transition-colors">
                  {t("agent_claims_audit_title")}
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  {t("agent_claims_audit_desc")}
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
                <span>{t("agent_audit_claims")}</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ─── Recent Claims Ledger ─── */}
        <Card className="bg-white border border-border-default shadow-sm p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-default">
            <div>
              <h3 className="text-base font-display font-extrabold text-text-primary">
                {t("agent_recent_payouts_title")}
              </h3>
              <p className="text-xs text-text-secondary">
                {t("agent_recent_payouts_desc")} ({agentCode})
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-gold-dark hover:underline"
            >
              {t("agent_full_ledger")}
            </Link>
          </div>

          {claimsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted font-body">
              <div className="text-3xl mb-2">🎟️</div>
              <p className="font-bold text-text-secondary">{t("agent_no_payouts_today")}</p>
              <p className="text-[11px] mt-0.5">{t("agent_no_payouts_hint")}</p>
              <Link href="/scan" className="inline-block mt-3 px-4 py-2 bg-gold text-white font-bold rounded-xl text-xs">
                ⚡ {t("agent_launch_scanner")}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-body">
                <thead>
                  <tr className="bg-brand-section text-text-secondary font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                    <th className="py-2.5 px-3">{t("table_serial")}</th>
                    <th className="py-2.5 px-3">{t("table_lottery")}</th>
                    <th className="py-2.5 px-3">{t("table_board")}</th>
                    <th className="py-2.5 px-3">{t("table_tier")}</th>
                    <th className="py-2.5 px-3">{t("table_counter_staff")}</th>
                    <th className="py-2.5 px-3 text-right">{t("table_prize")}</th>
                    <th className="py-2.5 px-3 text-center">{t("table_status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/60">
                  {claimsList.slice(0, 5).map((claim, idx) => (
                    <tr key={claim.id || idx} className="hover:bg-brand-section/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold">{claim.ticket_serial || claim.ticketSerial}</td>
                      <td className="py-2.5 px-3 font-extrabold">{tLottery(claim.lottery_name || claim.lotteryName)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          claim.board === "NLB" ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"
                        }`}>
                          {claim.board || "NLB"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">{claim.matched_tier || claim.matchedTier}</td>
                      <td className="py-2.5 px-3">{claim.employee_name || claim.employeeName || "Counter Staff"}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-win">
                        Rs. {Number(claim.prize_amount || claim.prizeAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                          {t("table_paid")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
