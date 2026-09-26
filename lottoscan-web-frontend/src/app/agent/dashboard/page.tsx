"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AgentDashboardPage() {
  const { user, loading, isAgent, isAdmin, logout } = useAuth();
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
                    {boardAffiliation === "BOTH" ? "Dual Dealer (NLB & DLB)" : `${boardAffiliation} Dealer`}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    ● Verified Active
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-body mt-1">
                  📍 {location} • Official Agent ID: <code className="font-mono text-text-primary">{user?.id || user?.userId || "agn-master"}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadDashboardData}
                loading={dataLoading}
                className="text-xs font-bold"
              >
                🔄 Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200"
              >
                🚪 Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Operational Live KPI Bar ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Payouts Handled Today
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-gold-dark mt-1">
                Rs. {totalPrize.toLocaleString()}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{totalClaimsCount} winning tickets paid</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Winning Claims Paid
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                {totalClaimsCount} <span className="text-xs font-body font-semibold text-text-muted">Tickets</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Recorded counter payouts</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              🎟️
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Registered Staff & Counters
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {employees.length} <span className="text-xs font-body font-semibold text-text-muted">Staff</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Assigned to counter branches</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shrink-0">
              👥
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Settlement Date
              </p>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-text-primary mt-1">
                {todayStr}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">Active Reconciliation Cycle</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-brand-section border border-border-default flex items-center justify-center text-xl shrink-0">
              📅
            </div>
          </Card>
        </div>

        {/* ─── Operations Command Center (Quick Launch Hub) ─── */}
        <div className="space-y-3">
          <h2 className="text-sm font-display font-extrabold uppercase tracking-wider text-text-secondary">
            Agency Operations Command Hub
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
                  Continuous Bulk Scanner
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  High-speed camera & laser barcode gun scanning with 2.5s latch & live duplicate rejection
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-gold-dark flex items-center gap-1">
                <span>Launch Scanner</span>
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
                  Daily Orders & Indents
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  Counter-wise ticket distribution matrix, daily returns, and sales commission calculations
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
                <span>Manage Orders</span>
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
                  Counter Staff & Sellers
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  Roster of ticket sellers, counter branch locations, commission rates, and payouts
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span>View Staff Roster</span>
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
                  Winning Claims Audit
                </h3>
                <p className="text-xs text-text-secondary font-body mt-1">
                  Reconcile paid ticket serials against QuestDB with duplicate claim fraud protection
                </p>
              </div>
              <div className="pt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
                <span>Audit Claims</span>
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
                Recent Winning Ticket Payouts Processed
              </h3>
              <p className="text-xs text-text-secondary">
                Verified ticket serials recorded under your agency code ({agentCode})
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-gold-dark hover:underline"
            >
              Full Payout Ledger →
            </Link>
          </div>

          {claimsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted font-body">
              <div className="text-3xl mb-2">🎟️</div>
              <p className="font-bold text-text-secondary">No ticket payouts recorded today yet.</p>
              <p className="text-[11px] mt-0.5">Use the Bulk Scanner or Record Claim tool to verify customer tickets.</p>
              <Link href="/scan" className="inline-block mt-3 px-4 py-2 bg-gold text-white font-bold rounded-xl text-xs">
                ⚡ Open Bulk Scanner
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-body">
                <thead>
                  <tr className="bg-brand-section text-text-secondary font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                    <th className="py-2.5 px-3">Serial</th>
                    <th className="py-2.5 px-3">Lottery</th>
                    <th className="py-2.5 px-3">Board</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Counter Staff</th>
                    <th className="py-2.5 px-3 text-right">Prize (Rs.)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/60">
                  {claimsList.slice(0, 5).map((claim, idx) => (
                    <tr key={claim.id || idx} className="hover:bg-brand-section/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold">{claim.ticket_serial || claim.ticketSerial}</td>
                      <td className="py-2.5 px-3 font-extrabold">{claim.lottery_name || claim.lotteryName}</td>
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
                          Paid ✓
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
