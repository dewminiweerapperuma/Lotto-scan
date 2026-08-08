"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { lottery as lotteryApi } from "@/lib/api";
import Card from "@/components/ui/Card";

export default function LogsPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    lotteryApi
      .getScrapeLogs(50)
      .then((r) => setLogs(r.data.logs || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [isAdmin]);

  const statusStyle: Record<string, string> = {
    success: "text-win bg-win-light border-green-200",
    failed: "text-lose bg-lose-light border-red-200",
    empty: "text-gold-dark bg-gold-light/40 border-gold-border",
  };
  const statusIcon: Record<string, string> = { success: "🟢", failed: "🔴", empty: "🟡" };

  const fmt = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("en-LK", {
        timeZone: "Asia/Colombo",
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return ts;
    }
  };

  const successCount = logs.filter((l) => l.status === "success").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;
  const emptyCount = logs.filter((l) => l.status === "empty").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16">
      <div className="container max-w-3xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="text-text-secondary hover:text-text-primary transition-colors font-body text-sm font-bold border border-border-default px-3 py-1.5 rounded-lg bg-white shadow-sm"
          >
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-text-primary leading-tight">
              Scrape Logs
            </h1>
            <p className="text-text-secondary font-body text-xs font-semibold mt-0.5">
              Auto-fetch scraping history
            </p>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Success", count: successCount, color: "text-win" },
            { label: "Failed", count: failedCount, color: "text-lose" },
            { label: "Empty", count: emptyCount, color: "text-gold-dark" },
          ].map((s) => (
            <Card key={s.label} padding="sm" className="text-center bg-white border border-border-default shadow-sm p-4">
              <p className={`text-3xl font-display font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-text-secondary font-body text-xs font-bold uppercase tracking-wider mt-1">
                {s.label}
              </p>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card className="mb-6 bg-gold-light/20 border border-gold-border p-4">
          <p className="text-gold-dark text-sm font-body leading-relaxed font-semibold">
            🕐 Auto-scrape runs at <span className="font-mono bg-white px-2 py-0.5 rounded border border-gold-border/30">11:15 PM</span> (primary) and <span className="font-mono bg-white px-2 py-0.5 rounded border border-gold-border/30">11:45 PM</span> (backup) Sri Lanka time daily.
          </p>
        </Card>

        {/* Logs List */}
        {logsLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="text-center py-16 bg-white border border-border-default shadow-sm">
            <div className="text-5xl mb-4 select-none">📋</div>
            <h3 className="text-text-primary font-display font-bold text-xl mb-2">No Logs Yet</h3>
            <p className="text-text-secondary font-body text-sm">
              Logs appear after 11:15 PM or after triggering a manual fetch.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <Card key={i} padding="sm" className="bg-white border border-border-default shadow-sm p-4 hover:border-gold-border">
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0 select-none">{statusIcon[log.status] || "🟢"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-text-primary font-body font-bold text-sm">
                        {log.source}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border font-body font-bold uppercase tracking-wide ${
                          statusStyle[log.status] || "text-text-secondary bg-brand-section border-border-default"
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.status === "success" && (
                        <span className="text-win text-xs font-body font-bold">
                          🎉 {log.results_count} results saved
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs font-mono mt-1.5">{fmt(log.ts)}</p>
                    {log.error_message && (
                      <p className="text-lose text-xs font-body font-semibold mt-2 bg-lose-light/30 border border-red-150 p-2.5 rounded-xl break-all">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
