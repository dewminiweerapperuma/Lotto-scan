"use client";

import { useEffect, useState } from "react";
import { superAdmin } from "@/lib/api";
import {
  Building2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  ShieldCheck,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock
} from "lucide-react";

interface AgentItem {
  id: string;
  userId?: string;
  agencyName: string;
  agentCode: string;
  email: string;
  phone: string;
  boardAffiliation: string;
  location: string;
  status: "active" | "suspended" | "pending" | "terminated";
  createdAt: string;
  activeSellersCount?: number;
}

export default function SuperAdminAgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Status Change Modal State
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await superAdmin.getAgents();
      if (res.data?.success) {
        setAgents(res.data.agents || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load area agents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedAgent || !targetStatus) return;
    try {
      setUpdating(true);
      const res = await superAdmin.updateAgentStatus(selectedAgent.id, targetStatus);
      if (res.data?.success) {
        setFeedback(`Successfully changed status of ${selectedAgent.agencyName} to ${targetStatus.toUpperCase()}`);
        setSelectedAgent(null);
        fetchAgents();
      }
    } catch (err: any) {
      setFeedback("Failed to update status: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
      setTimeout(() => setFeedback(""), 5000);
    }
  };

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.agencyName.toLowerCase().includes(search.toLowerCase()) ||
      agent.agentCode.toLowerCase().includes(search.toLowerCase()) ||
      agent.email.toLowerCase().includes(search.toLowerCase()) ||
      agent.location.toLowerCase().includes(search.toLowerCase());

    const matchesDistrict =
      filterDistrict === "ALL" || agent.location.toLowerCase().includes(filterDistrict.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || agent.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const districts = ["ALL", "Colombo", "Gampaha", "Kandy", "Galle", "Kurunegala", "Jaffna", "Matara"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Area Agencies Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Governing regional dealerships, counter seller licenses, and operational status across Sri Lanka.
          </p>
        </div>
        <button
          onClick={fetchAgents}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

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
            placeholder="Search by Agency Name, Agent Code, Email, or District..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              {districts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  District: {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-white">Active</option>
              <option value="pending" className="bg-slate-900 text-white">Pending Approval</option>
              <option value="suspended" className="bg-slate-900 text-white">Suspended</option>
              <option value="terminated" className="bg-slate-900 text-white">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-5 py-3.5">Agency / Dealer Code</th>
                <th className="px-5 py-3.5">Location & Contact</th>
                <th className="px-5 py-3.5">Board Affiliation</th>
                <th className="px-5 py-3.5">Active Staff</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Loading registered agencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No Area Agencies matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Agency Info */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-100 text-sm">{agent.agencyName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                            {agent.agentCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Joined {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location & Contact */}
                    <td className="px-5 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{agent.location || "Western Province"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                    </td>

                    {/* Board Affiliation */}
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        agent.boardAffiliation === "BOTH"
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                          : agent.boardAffiliation === "NLB"
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                      }`}>
                        {agent.boardAffiliation || "BOTH"}
                      </span>
                    </td>

                    {/* Active Staff */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-bold">{agent.activeSellersCount || 21}</span>
                        <span className="text-slate-400 text-[11px]">counters</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                        agent.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : agent.status === "suspended"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : agent.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-slate-700 text-slate-300 border border-slate-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === "active" ? "bg-emerald-400" : agent.status === "suspended" ? "bg-rose-400" : "bg-amber-400"
                        }`} />
                        {agent.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {agent.status !== "active" && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setTargetStatus("active");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                          >
                            Approve / Activate
                          </button>
                        )}
                        {agent.status === "active" && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setTargetStatus("suspended");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {agent.status !== "terminated" && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setTargetStatus("terminated");
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-[11px] transition-colors"
                            title="Terminate Agreement"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal Confirmation */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Confirm Status Modification</span>
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to transition the status of agency{" "}
              <strong className="text-amber-300">{selectedAgent.agencyName}</strong> (Code:{" "}
              <span className="font-mono text-white">{selectedAgent.agentCode}</span>) to{" "}
              <span className={`font-bold uppercase ${targetStatus === "active" ? "text-emerald-400" : "text-rose-400"}`}>
                {targetStatus}
              </span>
              ? This action is logged immediately in the national security audit ledger.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  targetStatus === "active"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                }`}
              >
                {updating ? "Committing..." : `Confirm ${targetStatus.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
