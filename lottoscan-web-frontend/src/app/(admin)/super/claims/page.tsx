"use client";

import { useEffect, useState } from "react";
import { superAdmin } from "@/lib/api";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Lock,
  Eye,
  FileText
} from "lucide-react";

interface Occurrence {
  id: string;
  agentId: string;
  employeeName: string;
  lotteryName: string;
  board: string;
  drawNumber: string;
  drawDate: string;
  ticketSerial: string;
  matchedTier: string;
  prizeAmount: number;
  payoutStatus: string;
  claimedAt: string;
}

interface DuplicateGroup {
  ticketSerial: string;
  totalAttempts: number;
  distinctAgenciesCount: number;
  isInterAgencyClash: boolean;
  severity: "HIGH_RISK_FRAUD" | "SUSPICIOUS_REPEAT";
  firstClaimedAt: string;
  latestAttemptAt: string;
  occurrences: Occurrence[];
}

export default function SuperAdminClaimsPage() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await superAdmin.getDuplicateClaims();
      if (res.data?.success) {
        setDuplicateGroups(res.data.duplicateGroups || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to scan duplicate claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const filteredGroups = duplicateGroups.filter(
    (g) =>
      g.ticketSerial.toLowerCase().includes(search.toLowerCase()) ||
      g.occurrences.some(
        (o) =>
          o.lotteryName.toLowerCase().includes(search.toLowerCase()) ||
          o.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          o.agentId.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>Inter-Agency Fraud & Duplicate Claims Scanner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heuristic detection of identical ticket barcode serials presented across multiple independent agencies.
          </p>
        </div>

        <button
          onClick={fetchDuplicates}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Rescan Database</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-rose-300">Flagged Duplicate Serials</span>
            <p className="text-2xl font-bold font-display text-rose-400 mt-0.5">
              {duplicateGroups.length}
            </p>
          </div>
          <AlertTriangle className="w-7 h-7 text-rose-400/60" />
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300">Inter-Agency Clashes</span>
            <p className="text-2xl font-bold font-display text-amber-400 mt-0.5">
              {duplicateGroups.filter((g) => g.isInterAgencyClash).length}
            </p>
          </div>
          <Building2 className="w-7 h-7 text-amber-400/60" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Blocked Payout Losses</span>
            <p className="text-2xl font-bold font-display text-white mt-0.5">
              LKR {duplicateGroups.reduce((acc, g) => acc + (g.occurrences[0]?.prizeAmount || 0), 0).toLocaleString()}
            </p>
          </div>
          <Lock className="w-7 h-7 text-slate-500" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Serial Number, Counter Staff, or Agency..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Clashes Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-5 py-3.5">Ticket Serial</th>
                <th className="px-5 py-3.5">Clash Severity</th>
                <th className="px-5 py-3.5">Agencies Involved</th>
                <th className="px-5 py-3.5">Attempts</th>
                <th className="px-5 py-3.5">First / Latest Claim</th>
                <th className="px-5 py-3.5 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Scanning winning_claims across all agencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <span>Clean scan! No unauthorized duplicate serial redemptions detected.</span>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    {/* Ticket Serial */}
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-mono font-bold text-amber-300 text-sm">
                          {group.ticketSerial}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {group.occurrences[0]?.lotteryName} • Draw #{group.occurrences[0]?.drawNumber}
                        </p>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          group.severity === "HIGH_RISK_FRAUD"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                        {group.severity === "HIGH_RISK_FRAUD" ? "Inter-Agency Conflict" : "Repeated Scan"}
                      </span>
                    </td>

                    {/* Agencies Involved */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200">
                          {group.distinctAgenciesCount} Independent Agency Dealers
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(group.occurrences.map((o) => o.agentId))).map((aid, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300"
                            >
                              {aid}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Attempts */}
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-white text-sm">
                        {group.totalAttempts}x
                      </span>
                      <span className="text-slate-400 text-[11px] block">Attempts recorded</span>
                    </td>

                    {/* Timestamps */}
                    <td className="px-5 py-4 text-[11px] font-mono text-slate-400 space-y-0.5">
                      <div>Latest: {new Date(group.latestAttemptAt).toLocaleTimeString()}</div>
                      <div>Initial: {new Date(group.firstClaimedAt).toLocaleTimeString()}</div>
                    </td>

                    {/* Audit Button */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Clash</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Occurrence Inspector Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Fraud Investigation: Serial {selectedGroup.ticketSerial}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete chronological redemption attempts across all registered lottery agencies.
                </p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {selectedGroup.occurrences.map((occ, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    occ.payoutStatus === "paid"
                      ? "bg-slate-950/70 border-emerald-500/30"
                      : "bg-rose-950/20 border-rose-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      Dealer: {occ.agentId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                        occ.payoutStatus === "paid"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      Status: {occ.payoutStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                    <div>Counter Staff: <strong className="text-slate-200">{occ.employeeName}</strong></div>
                    <div>Prize Tier: <strong className="text-slate-200">{occ.matchedTier} (LKR {occ.prizeAmount})</strong></div>
                    <div>Draw Number: <strong className="text-slate-200">{occ.drawNumber}</strong></div>
                    <div>Timestamp: <strong className="text-slate-200 font-mono">{new Date(occ.claimedAt).toLocaleString()}</strong></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
