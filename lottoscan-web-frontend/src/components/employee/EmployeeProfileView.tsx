"use client";

import React, { useState, useEffect } from "react";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SessionSlipView, { SessionSlipData } from "@/components/scanner/SessionSlipView";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/ui/LanguageToggle";

interface EmployeeProfileViewProps {
  employeeId: string;
  onClose?: () => void;
  onStartSessionForEmployee?: (employeeName: string, counterName: string) => void;
}

export default function EmployeeProfileView({
  employeeId,
  onClose,
  onStartSessionForEmployee,
}: EmployeeProfileViewProps) {
  const { t, tLottery } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"sessions" | "breakdown" | "claims">("sessions");
  const [selectedSessionSlip, setSelectedSessionSlip] = useState<SessionSlipData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await agentApi.getEmployeeProfile(employeeId);
        if (isMounted && res.data?.data) {
          setProfile(res.data.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load employee profile.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (employeeId) fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-text-secondary">Loading Employee Profile &amp; Sessions...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm font-bold text-red-500">{error || "Employee not found."}</p>
        {onClose && (
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  const emp = profile.employee || {};
  const stats = profile.stats || {};
  const today = stats.today || {};
  const sessions = profile.recentSessions || [];
  const claims = profile.claims || [];
  const tierSummary = profile.tierSummary || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-zinc-900 to-emerald-950 text-white p-6 rounded-2xl shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-heading font-black tracking-tight">{emp.name}</h1>
                <Badge variant="green">
                  {t("emp_active_staff")}
                </Badge>
              </div>
              <p className="text-sm text-emerald-200/80 font-medium">
                📍 {emp.counterName || "Main Counter"} {emp.phone ? `• 📞 ${emp.phone}` : ""}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Staff ID: <span className="font-mono text-zinc-300">{emp.id}</span> • Commission: <span className="text-emerald-400 font-bold">{emp.commissionRate || 2.5}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <LanguageToggle variant="compact" />
            {onStartSessionForEmployee && (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-900/30"
                onClick={() => onStartSessionForEmployee(emp.name, emp.counterName)}
              >
                ⚡ {t("emp_start_session")}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-300 hover:text-white">
                ✕ Close
              </Button>
            )}
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-zinc-400 block text-[11px]">Sessions Completed</span>
            <span className="text-lg font-heading font-black text-white">{stats.totalSessions || 0}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-zinc-400 block text-[11px]">{t("emp_lifetime_scanned")}</span>
            <span className="text-lg font-heading font-black text-cyan-400">{stats.totalTicketsScanned || 0}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-zinc-400 block text-[11px]">Winning Tickets</span>
            <span className="text-lg font-heading font-black text-emerald-400">{stats.totalWinningTickets || 0}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-zinc-400 block text-[11px]">{t("emp_lifetime_payouts")}</span>
            <span className="text-base font-heading font-black text-emerald-300">
              Rs. {(stats.totalWinningAmount || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-zinc-400 block text-[11px]">Returns / Shortages</span>
            <span className="text-base font-heading font-black text-rose-400">
              - Rs. {(stats.totalReturnShortage || 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm p-3 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-300 block text-[11px] font-bold">Net Payout Total</span>
            <span className="text-base font-heading font-black text-amber-300">
              Rs. {(stats.totalNetPayout || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Quick Bar */}
      {today.sessionsCount > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <span className="text-base">📅</span>
            <span>
              <strong>Today&apos;s Activity:</strong> {today.sessionsCount} session(s) • {today.ticketsScanned} tickets scanned ({today.winningTickets} winners)
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-900 dark:text-emerald-200">
            <span>Gross: <strong className="font-mono text-emerald-700 dark:text-emerald-300">Rs. {today.winningAmount.toLocaleString()}</strong></span>
            <span>Net Disbursed: <strong className="font-mono text-emerald-800 dark:text-amber-300">Rs. {today.netPayout.toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-default pb-2">
        <button
          onClick={() => setActiveTab("sessions")}
          type="button"
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "sessions"
              ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
              : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
          }`}
        >
          📋 {t("emp_tab_sessions")} ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("breakdown")}
          type="button"
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "breakdown"
              ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
              : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
          }`}
        >
          🧾 {t("emp_tab_breakdown")}
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          type="button"
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "claims"
              ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
              : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
          }`}
        >
          🏆 {t("emp_tab_claims")} ({claims.length})
        </button>
      </div>

      {/* Tab 1: Sessions History */}
      {activeTab === "sessions" && (
        <Card className="overflow-hidden p-0">
          <div className="p-4 bg-brand-section border-b border-border-default flex items-center justify-between">
            <h3 className="font-heading font-black text-sm text-text-primary">
              Completed Scan Sessions for {emp.name}
            </h3>
            <span className="text-xs text-text-muted font-medium">
              Click &quot;View Slip&quot; to print settlement voucher
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center text-text-muted space-y-2">
              <span className="text-3xl block">🎟️</span>
              <p className="text-sm font-semibold">No scanning sessions recorded for this employee yet.</p>
              <p className="text-xs">Start a bulk scanning session from the Scanner page to see results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-brand-section/50 border-b border-border-default text-text-secondary font-bold">
                    <th className="py-2.5 px-3">Session #</th>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3 text-center">Tickets</th>
                    <th className="py-2.5 px-3 text-center">Winners</th>
                    <th className="py-2.5 px-3 text-right">Winning Total</th>
                    <th className="py-2.5 px-3 text-right">Return / Shortage</th>
                    <th className="py-2.5 px-3 text-right">Net Total</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {sessions.map((ses: any) => {
                    const dateStr = (ses.startedAt || "").slice(0, 10);
                    const timeStr = ses.startedAt ? new Date(ses.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
                    return (
                      <tr key={ses.id} className="hover:bg-brand-section/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-brand-primary">
                          {ses.sessionNumber || ses.id.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary">
                          {dateStr} <span className="text-[10px] text-text-muted">{timeStr}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{ses.totalTickets}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold">
                            {ses.winningTickets}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {(ses.totalWinningAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-500 font-semibold">
                          {ses.returnShortageAmount > 0 ? `- Rs. ${ses.returnShortageAmount.toLocaleString()}` : "Rs. 0"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-text-primary text-sm">
                          Rs. {(ses.netTotalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-[11px] py-1 px-2.5 font-bold"
                            onClick={() => {
                              setSelectedSessionSlip({
                                sessionNumber: ses.sessionNumber,
                                employeeName: ses.employeeName,
                                counterName: ses.counterName,
                                date: dateStr,
                                time: timeStr,
                                totalTickets: ses.totalTickets,
                                winningTickets: ses.winningTickets,
                                tiers: ses.prizeBreakdown?.tiers || [],
                                totalWinningAmount: ses.totalWinningAmount,
                                returnShortageAmount: ses.returnShortageAmount,
                                netTotalAmount: ses.netTotalAmount,
                                notes: ses.notes,
                              });
                            }}
                          >
                            🧾 View Slip
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Prize Tier Matrix Breakdown */}
      {activeTab === "breakdown" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-black text-base text-text-primary">
                Cumulative Multiplier Tier Breakdown
              </h3>
              <p className="text-xs text-text-secondary">
                Aggregated winning tickets cashed by {emp.name} across all sessions
              </p>
            </div>
            <Badge variant="blue">Matching Physical Slip</Badge>
          </div>

          <div className="overflow-hidden border border-border-default rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-brand-section border-b border-border-default font-bold text-text-secondary">
                  <th className="py-2.5 px-4">Tier Multiplier</th>
                  <th className="py-2.5 px-4 text-center">Total Quantity Cashed</th>
                  <th className="py-2.5 px-4 text-right">Subtotal Payout (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default font-mono">
                {tierSummary.map((item: any) => (
                  <tr
                    key={item.prize}
                    className={item.count > 0 ? "bg-emerald-50/50 dark:bg-emerald-950/20 font-bold" : "hover:bg-brand-section/20"}
                  >
                    <td className="py-2.5 px-4 text-text-primary font-bold">
                      {item.prize} *
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold">
                      {item.count > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                          {item.count}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="bg-brand-section border-t-2 border-border-default font-heading font-black text-sm">
                  <td className="py-3 px-4 text-text-primary">TOTAL CUMULATIVE WINS</td>
                  <td className="py-3 px-4 text-center text-text-primary">
                    {stats.totalWinningTickets || 0} tickets
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    Rs. {(stats.totalWinningAmount || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: All Claimed Winning Tickets */}
      {activeTab === "claims" && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-brand-section border-b border-border-default flex items-center justify-between">
            <h3 className="font-heading font-black text-sm text-text-primary">
              All Winning Claims Credited to {emp.name}
            </h3>
            <span className="text-xs text-text-muted">Total: {claims.length} claims</span>
          </div>

          {claims.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <p className="text-sm font-semibold">No winning claims recorded for this employee yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-brand-section shadow-sm">
                  <tr className="border-b border-border-default text-text-secondary font-bold">
                    <th className="py-2 px-3">Ticket Serial</th>
                    <th className="py-2 px-3">Lottery</th>
                    <th className="py-2 px-3">Board</th>
                    <th className="py-2 px-3">Draw #</th>
                    <th className="py-2 px-3">Matched Tier</th>
                    <th className="py-2 px-3 text-right">Prize (Rs.)</th>
                    <th className="py-2 px-3 text-right">Claim Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {claims.map((claim: any) => (
                    <tr key={claim.id} className="hover:bg-brand-section/30 font-mono">
                      <td className="py-2 px-3 font-bold text-brand-primary">{claim.ticketSerial || "—"}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-text-primary">{claim.lotteryName}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          claim.board === "NLB" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          {claim.board}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-text-muted">{claim.drawNumber || "—"}</td>
                      <td className="py-2 px-3 font-sans text-text-secondary">{claim.matchedTier || "Winning Match"}</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        Rs. {(claim.prizeAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-text-muted text-[11px]">
                        {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Slip Modal View */}
      {selectedSessionSlip && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-h-[90vh] overflow-y-auto w-full max-w-md">
            <SessionSlipView
              data={selectedSessionSlip}
              onClose={() => setSelectedSessionSlip(null)}
              showPrintButton={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
