import Link from "next/link";
import TicketChecker from "@/components/sections/TicketChecker";

export default function CheckPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top Mode Switcher Bar */}
      <div className="pt-20 pb-2 print:hidden">
        <div className="container max-w-4xl flex items-center justify-between gap-3 bg-white border border-border-default rounded-2xl p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-gold text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
              <span>🔍</span> Single Ticket Checker
            </span>
            <Link
              href="/scan"
              className="px-3.5 py-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-brand-section font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span>⚡</span> Bulk Ticket Scanner (Multi-Scan)
            </Link>
          </div>
          <Link
            href="/scan"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-all"
          >
            <span>📷 Scan Bulk Tickets →</span>
          </Link>
        </div>
      </div>
      <TicketChecker isFullPage={true} />
    </div>
  );
}

