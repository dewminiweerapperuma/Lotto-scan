"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { lottery as lotteryApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NumberBall from "@/components/ui/NumberBall";

export default function DashboardPage() {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    setDataLoading(true);
    Promise.all([
      lotteryApi.getLatestResults(10),
      lotteryApi.getScrapeLogs(5),
      lotteryApi.getStatistics(),
    ])
      .then(([r, l, s]) => {
        setResults(r.data.results || []);
        setLogs(l.data.logs || []);
        setStats(s.data);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [isAdmin]);

  const handleFetch = async () => {
    setFetchLoading(true);
    setFetchMsg("");
    setFetchErr("");
    try {
      const res = await lotteryApi.fetchToday();
      setFetchMsg(res.data.message || "Fetch completed successfully!");
      const r = await lotteryApi.getLatestResults(10);
      setResults(r.data.results || []);
    } catch (err: any) {
      setFetchErr(err.response?.data?.error || "Fetch failed");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/admin");
  };

  const statusStyle: Record<string, string> = {
    success: "text-win bg-win-light border-green-200",
    failed: "text-lose bg-lose-light border-red-200",
    empty: "text-gold-dark bg-gold-light/40 border-gold-border",
  };
  const statusIcon: Record<string, string> = { success: "🟢", failed: "🔴", empty: "🟡" };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const resultsToday = results.filter((r) => r.draw_date === todayDateStr).length;

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-border-default shadow-sm py-5 mb-8 -mt-8">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-text-primary">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary font-body text-xs font-semibold mt-0.5">
              Logged in as: <span className="text-text-primary font-mono">{user?.email}</span>
            </p>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="border border-border-default">
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {[
            { label: "Ticket Checks", value: stats?.checks_count || 142, icon: "🔍", iconColor: "text-blue-500" },
            { 
              label: "Scrape Status", 
              value: logs[0]?.status === "success" ? "Active" : "Issues", 
              icon: logs[0]?.status === "success" ? "✅" : "⚠️", 
              isBadge: true 
            },
          ].map((s, i) => (
            <Card key={i} padding="sm" className="flex items-center justify-between p-5 bg-white border border-border-default shadow-sm">
              <div className="space-y-1">
                <p className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider">
                  {s.label}
                </p>
                {s.isBadge ? (
                  <div className="pt-1">
                    <Badge variant={s.value === "Active" ? "green" : "red"}>
                      {s.value}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-3xl font-display font-extrabold text-text-primary">
                    {s.value}
                  </p>
                )}
              </div>
              <div className="text-3xl p-2 select-none shrink-0">{s.icon}</div>
            </Card>
          ))}
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8">
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Fetch Today Results Card */}
            <Card className="bg-white border border-border-default shadow-sm p-6">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shadow-sm shrink-0">
                    🔄
                  </div>
                  <div>
                    <h3 className="text-text-primary font-display font-extrabold text-lg">
                      Fetch Today's Results
                    </h3>
                    <p className="text-text-secondary font-body text-sm">
                      Auto-scrape results directly from NLB & DLB websites
                    </p>
                  </div>
                </div>

                {fetchLoading && (
                  <div className="space-y-2.5">
                    <div className="w-full h-2.5 bg-brand-section rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full animate-pulse-gold w-3/4" />
                    </div>
                    <p className="text-text-secondary text-xs font-body animate-pulse">
                      Contacting official servers, extracting draws data...
                    </p>
                  </div>
                )}

                <div className="flex gap-3 items-center">
                  <Button onClick={handleFetch} loading={fetchLoading} variant="primary" className="px-8 shadow-sm">
                    🔄 Fetch Now
                  </Button>
                  <p className="text-text-secondary text-xs font-body font-semibold">
                    Last check: <span className="font-mono text-text-primary">Today at 11:15 PM</span>
                  </p>
                </div>

                {fetchMsg && (
                  <div className="bg-win-light border border-green-200 rounded-xl p-3">
                    <p className="text-win text-sm font-body font-semibold">✅ {fetchMsg}</p>
                  </div>
                )}
                {fetchErr && (
                  <div className="bg-lose-light border border-red-200 rounded-xl p-3">
                    <p className="text-lose text-sm font-body font-semibold">❌ {fetchErr}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/orders" className="block">
                <Card hover className="flex items-center gap-3 p-4 h-full border-2 border-amber-300 hover:border-gold bg-amber-50/40 shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                  <div>
                    <p className="text-text-primary font-body font-bold text-sm leading-snug">
                      Daily Orders Sheet
                    </p>
                    <p className="text-text-secondary text-[11px] font-body mt-0.5">
                      Seller allocations & commissions
                    </p>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/reports" className="block">
                <Card hover className="flex items-center gap-3 p-4 h-full border border-border-default hover:border-gold-border bg-white shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
                    📊
                  </div>
                  <div>
                    <p className="text-text-primary font-body font-bold text-sm leading-snug">
                      Daily Winning Report
                    </p>
                    <p className="text-text-secondary text-[11px] font-body mt-0.5">
                      Board-wise payout summary
                    </p>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/upload" className="block">
                <Card hover className="flex items-center gap-3 p-4 h-full border border-border-default hover:border-gold-border bg-white shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xl shrink-0">
                    📤
                  </div>
                  <div>
                    <p className="text-text-primary font-body font-bold text-sm leading-snug">
                      Upload PDF
                    </p>
                    <p className="text-text-secondary text-[11px] font-body mt-0.5">
                      Manual draw sheets
                    </p>
                  </div>
                </Card>
              </Link>
              <Link href="/admin/logs" className="block">
                <Card hover className="flex items-center gap-3 p-4 h-full border border-border-default hover:border-gold-border bg-white shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-brand-section border border-border-default flex items-center justify-center text-xl shrink-0">
                    📋
                  </div>
                  <div>
                    <p className="text-text-primary font-body font-bold text-sm leading-snug">
                      Scrape Logs
                    </p>
                    <p className="text-text-secondary text-[11px] font-body mt-0.5">
                      Automated scraping status
                    </p>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Recent Results Table */}
            <Card padding="sm" className="bg-white border border-border-default shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4 px-4 pt-4">
                <h3 className="text-text-primary font-display font-extrabold text-base">
                  Recent Results
                </h3>
                <Link
                  href="/results"
                  className="text-gold-dark hover:text-gold text-xs font-body font-bold"
                >
                  View All Results →
                </Link>
              </div>

              {dataLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-xl" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="text-text-secondary text-sm font-body text-center py-10">
                  No draw results uploaded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-section text-text-secondary font-body font-bold text-[10px] uppercase tracking-wider border-y border-border-default">
                        <th className="py-3.5 px-4">Lottery</th>
                        <th className="py-3.5 px-4">Draw #</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Numbers</th>
                        <th className="py-3.5 px-4">Source</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const balls = [r.number_1, r.number_2, r.number_3, r.number_4, r.number_5].filter((n) => n > 0);
                        return (
                          <tr
                            key={i}
                            className={`border-b border-border-default/45 text-sm font-body last:border-0 hover:bg-brand-card-hover transition-colors ${
                              i % 2 === 0 ? "bg-white" : "bg-brand-bg/30"
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-text-primary">{r.lottery_name}</td>
                            <td className="py-3 px-4 text-text-secondary font-mono">{r.draw_number}</td>
                            <td className="py-3 px-4 text-text-secondary whitespace-nowrap">{r.draw_date}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {balls.map((n, j) => (
                                  <div
                                    key={j}
                                    className="w-7 h-7 rounded-full bg-brand-section text-gold-dark font-mono font-bold text-xs flex items-center justify-center border border-border-default"
                                  >
                                    {n}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={r.uploaded_by === "auto-scraper" ? "blue" : "gold"}>
                                {r.uploaded_by === "auto-scraper" ? "Auto" : "Manual"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/check?lottery=${encodeURIComponent(r.lottery_name)}&date=${r.draw_date}`}
                                className="text-gold-dark hover:text-gold font-bold text-xs"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-6">
            {/* Scrape Logs Sidebar Card */}
            <Card className="bg-white border border-border-default shadow-sm p-6">
              <div className="flex items-center justify-between mb-5 border-b border-border-default/50 pb-3">
                <h3 className="text-text-primary font-display font-extrabold text-base">
                  Recent Scrapes
                </h3>
                <Link href="/admin/logs" className="text-gold-dark hover:text-gold text-xs font-bold font-body">
                  View Logs →
                </Link>
              </div>

              {logs.length === 0 ? (
                <p className="text-text-secondary text-sm font-body text-center py-6">
                  No scrapers executed yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-border-default/30 pb-3 last:border-0 last:pb-0">
                      <span className="text-base shrink-0 select-none">{statusIcon[log.status] || "🟢"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-text-primary font-body text-xs font-bold truncate">
                            {log.source}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-body font-bold border ${
                              statusStyle[log.status] || ""
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-text-muted text-[10px] font-mono mt-1">
                          {new Date(log.ts).toLocaleTimeString("en-LK", {
                            timeZone: "Asia/Colombo",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {log.error_message && (
                          <p className="text-lose text-[11px] font-body mt-1 bg-lose-light/30 px-2 py-1 rounded border border-red-100 truncate">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Daily Schedule Card */}
            <Card className="bg-white border border-border-default shadow-sm p-6">
              <h3 className="text-text-primary font-display font-extrabold text-base mb-5 border-b border-border-default/50 pb-3">
                Daily Schedule
              </h3>
              <div className="relative border-l border-border-default pl-4 ml-2 space-y-6 py-1">
                {[
                  { time: "11:00 PM", label: "Draws completed", dotColor: "bg-gold" },
                  { time: "11:15 PM", label: "Primary scrape", dotColor: "bg-win" },
                  { time: "11:45 PM", label: "Backup scrape", dotColor: "bg-blue-500" },
                  { time: "11:55 PM", label: "Admin alert", dotColor: "bg-lose" },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${item.dotColor}`} />
                    <div>
                      <p className="text-gold-dark font-mono text-xs font-extrabold leading-none">
                        {item.time}
                      </p>
                      <p className="text-text-secondary font-body text-xs font-medium mt-1">
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
