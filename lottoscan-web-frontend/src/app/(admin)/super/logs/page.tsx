"use client";

import { useEffect, useState } from "react";
import { superAdmin } from "@/lib/api";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Shield,
  User,
  Clock,
  Terminal,
  Server
} from "lucide-react";

interface AuditLogItem {
  id: string;
  actorId: string;
  actorRole: string;
  actionType: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export default function SuperAdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await superAdmin.getAuditLogs(100);
      if (res.data?.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actorId && log.actorId.toLowerCase().includes(search.toLowerCase())) ||
      (log.actionType && log.actionType.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(search));

    const matchesFilter =
      filterAction === "ALL" || log.actionType.toLowerCase() === filterAction.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-400" />
            <span>Immutable Governance Audit Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-resistant historical ledger documenting all administrative overrides, dealer status modifications, and crawler runs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Actor ID, Action Type, IP, or Event Details..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Event Types</option>
              <option value="AGENT_STATUS_UPDATE" className="bg-slate-900 text-white">AGENT_STATUS_UPDATE</option>
              <option value="DRAW_OVERRIDE" className="bg-slate-900 text-white">DRAW_OVERRIDE</option>
              <option value="SCRAPER_FORCE_TRIGGER" className="bg-slate-900 text-white">SCRAPER_FORCE_TRIGGER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor & Role</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Action Details</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2 font-body">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Reading QuestDB audit_logs table...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-body">
                    No matching audit records in the platform ledger.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Just now"}
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-slate-200 block text-xs truncate max-w-[180px]">
                          {log.actorId || "SUPER_ADMIN"}
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                          {log.actorRole || "SUPER_ADMIN"}
                        </span>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold tracking-wider ${
                          log.actionType === "DRAW_OVERRIDE"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : log.actionType === "AGENT_STATUS_UPDATE"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-5 py-4 text-slate-300 font-body text-xs max-w-md">
                      {log.details}
                    </td>

                    {/* IP */}
                    <td className="px-5 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
