"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Button from "@/components/ui/Button";

interface PrizeTier {
  prize: number;
  ticketCount: number;
  amount: number;
}

interface LotteryGroup {
  name: string;
  tiers: PrizeTier[];
  subtotalTickets: number;
  subtotalAmount: number;
}

interface ScanDetailBoardReport {
  board: "NLB" | "DLB" | "ALL";
  boardTitle: string;
  agentCode: string;
  agentName: string;
  printDate: string;
  reportDate: string;
  lotteries: LotteryGroup[];
  grandTotalTickets: number;
  grandTotalAmount: number;
  amountInWords: string;
}

interface ScanDetailApiResponse {
  reportDate: string;
  printDate: string;
  activeBoard: "NLB" | "DLB";
  nlb: ScanDetailBoardReport;
  dlb: ScanDetailBoardReport;
}

export default function ScanDetailReportPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [activeBoard, setActiveBoard] = useState<"NLB" | "DLB" | "BOTH">("NLB");
  const [reportResponse, setReportResponse] = useState<ScanDetailApiResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [agentCodeNLB, setAgentCodeNLB] = useState("A172");
  const [agentCodeDLB, setAgentCodeDLB] = useState("DLB-AG-3092");
  const [agentName, setAgentName] = useState("M G Thilakarathne");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  const loadReport = useCallback(async (date: string) => {
    setDataLoading(true);
    try {
      const res = await agentApi.getScanDetailReport(date);
      const data = res.data?.data || null;
      if (data) {
        setReportResponse(data);
        if (data.nlb?.agentCode) setAgentCodeNLB(data.nlb.agentCode);
        if (data.dlb?.agentCode) setAgentCodeDLB(data.dlb.agentCode);
        if (data.nlb?.agentName || data.dlb?.agentName) {
          setAgentName(data.nlb?.agentName || data.dlb?.agentName);
        }
      } else {
        setReportResponse(null);
      }
    } catch (err) {
      console.error("Error loading scan detail report:", err);
      setReportResponse(null);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadReport(selectedDate);
    }
  }, [isAdmin, selectedDate, loadReport]);

  const handlePrintActive = () => {
    window.print();
  };

  const handlePrintBoth = () => {
    setActiveBoard("BOTH");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPrintDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${d.getFullYear()} ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const nlbReport = reportResponse?.nlb;
  const dlbReport = reportResponse?.dlb;

  return (
    <>
      {/* ──────────── Bulletproof Print Styles ──────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              nav, footer, header, aside, .no-print, [class*="print:hidden"] {
                display: none !important;
              }
              html, body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                min-height: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body::before {
                display: none !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
              }
              @page {
                size: A4 portrait;
                margin: 14mm 15mm;
              }
              .print-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .page-break-after {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `,
        }}
      />

      <div className="bg-brand-bg min-h-screen pt-24 pb-16 print:pt-0 print:pb-0 print:min-h-0 print:bg-white print:w-full">
        {/* ─── Screen-Only Controls ─── */}
        <div className="container max-w-4xl print:hidden no-print">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/reports"
                  className="text-text-secondary hover:text-text-primary transition-colors font-body text-xs font-bold border border-border-default px-2.5 py-1 rounded-lg bg-white shadow-sm"
                >
                  ← Reports
                </Link>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
                  Agent&apos;s Scan Detail
                </h1>
              </div>
              <p className="text-text-secondary font-body text-xs font-semibold mt-1">
                Separate official winning reports for NLB and DLB lotteries
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrintBoth}
                className="px-4 text-xs font-bold border border-border-default bg-white"
                title="Print both NLB and DLB reports on separate pages"
              >
                📄 Print Both Reports
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintActive}
                className="px-5 text-xs shadow-sm font-bold"
              >
                🖨️ Print {activeBoard === "BOTH" ? "All" : activeBoard} Report
              </Button>
            </div>
          </div>

          {/* Board Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            {/* NLB Tab */}
            <button
              type="button"
              onClick={() => setActiveBoard("NLB")}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-display text-xs font-bold transition-all ${
                activeBoard === "NLB"
                  ? "bg-[#000080] text-white shadow-md shadow-blue-900/20 ring-2 ring-blue-900/30"
                  : "bg-white text-text-secondary border border-border-default hover:bg-brand-section hover:text-text-primary"
              }`}
            >
              <span className="text-sm">🏛️</span>
              <span>National Lotteries Board (NLB)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeBoard === "NLB"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-[#000080]"
                }`}
              >
                {nlbReport?.grandTotalTickets || 0} Tickets • Rs.{" "}
                {formatNumber(nlbReport?.grandTotalAmount || 0)}
              </span>
            </button>

            {/* DLB Tab */}
            <button
              type="button"
              onClick={() => setActiveBoard("DLB")}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-display text-xs font-bold transition-all ${
                activeBoard === "DLB"
                  ? "bg-[#C48F00] text-white shadow-md shadow-amber-800/20 ring-2 ring-amber-700/30"
                  : "bg-white text-text-secondary border border-border-default hover:bg-brand-section hover:text-text-primary"
              }`}
            >
              <span className="text-sm">🏢</span>
              <span>Development Lotteries Board (DLB)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeBoard === "DLB"
                    ? "bg-white/20 text-white"
                    : "bg-amber-50 text-[#C48F00]"
                }`}
              >
                {dlbReport?.grandTotalTickets || 0} Tickets • Rs.{" "}
                {formatNumber(dlbReport?.grandTotalAmount || 0)}
              </span>
            </button>

            {/* Both Tab */}
            <button
              type="button"
              onClick={() => setActiveBoard("BOTH")}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-display text-xs font-bold transition-all ${
                activeBoard === "BOTH"
                  ? "bg-gray-900 text-white shadow-md shadow-gray-900/20 ring-2 ring-gray-900/30"
                  : "bg-white text-text-secondary border border-border-default hover:bg-brand-section hover:text-text-primary"
              }`}
            >
              <span>📑</span>
              <span>Both Reports</span>
            </button>
          </div>

          {/* Date & Agent Settings Card */}
          <div className="bg-white border border-border-default shadow-sm rounded-2xl p-5 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-5">
              {/* Date Picker */}
              <div className="flex-1">
                <label className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-2 block font-body">
                  Report Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-border-default rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary bg-brand-section focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedDate === new Date().toISOString().slice(0, 10)
                        ? "bg-gold text-white shadow-sm"
                        : "bg-brand-section text-text-secondary hover:text-text-primary border border-border-default"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-brand-section text-text-secondary hover:text-text-primary border border-border-default transition-all"
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              {/* Agent Code NLB */}
              {(activeBoard === "NLB" || activeBoard === "BOTH") && (
                <div>
                  <label className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-2 block font-body">
                    NLB Agent Code
                  </label>
                  <input
                    type="text"
                    value={agentCodeNLB}
                    onChange={(e) => setAgentCodeNLB(e.target.value)}
                    className="border border-border-default rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary bg-brand-section focus:outline-none focus:border-gold w-32"
                  />
                </div>
              )}

              {/* Agent Code DLB */}
              {(activeBoard === "DLB" || activeBoard === "BOTH") && (
                <div>
                  <label className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-2 block font-body">
                    DLB Agent Code
                  </label>
                  <input
                    type="text"
                    value={agentCodeDLB}
                    onChange={(e) => setAgentCodeDLB(e.target.value)}
                    className="border border-border-default rounded-lg px-3 py-2 text-sm font-mono font-bold text-text-primary bg-brand-section focus:outline-none focus:border-gold w-32"
                  />
                </div>
              )}

              {/* Agent Name */}
              <div className="flex-1">
                <label className="text-text-secondary text-[11px] font-bold uppercase tracking-wider mb-2 block font-body">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="border border-border-default rounded-lg px-3 py-2 text-sm font-bold text-text-primary bg-brand-section focus:outline-none focus:border-gold w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Printable Reports ─── */}
        <div className="print-report container max-w-4xl print:max-w-none print:w-full print:p-0 print:m-0 space-y-8">
          {dataLoading ? (
            <div className="bg-white border border-border-default shadow-sm rounded-2xl p-16 text-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-text-secondary text-xs font-body">
                Loading scan detail report data...
              </p>
            </div>
          ) : (
            <>
              {/* Show NLB Report if NLB or BOTH is selected */}
              {(activeBoard === "NLB" || activeBoard === "BOTH") && nlbReport && (
                <PrintableBoardReport
                  report={nlbReport}
                  board="NLB"
                  boardTitle="National Lotteries Board"
                  agentCode={agentCodeNLB}
                  agentName={agentName}
                  selectedDate={selectedDate}
                  formatNumber={formatNumber}
                  formatPrintDate={formatPrintDate}
                  hasPageBreak={activeBoard === "BOTH"}
                />
              )}

              {/* Show DLB Report if DLB or BOTH is selected */}
              {(activeBoard === "DLB" || activeBoard === "BOTH") && dlbReport && (
                <PrintableBoardReport
                  report={dlbReport}
                  board="DLB"
                  boardTitle="Development Lotteries Board"
                  agentCode={agentCodeDLB}
                  agentName={agentName}
                  selectedDate={selectedDate}
                  formatNumber={formatNumber}
                  formatPrintDate={formatPrintDate}
                  hasPageBreak={false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Printable Board Report Sub-Component ─── */
function PrintableBoardReport({
  report,
  board,
  boardTitle,
  agentCode,
  agentName,
  selectedDate,
  formatNumber,
  formatPrintDate,
  hasPageBreak,
}: {
  report: ScanDetailBoardReport;
  board: "NLB" | "DLB";
  boardTitle: string;
  agentCode: string;
  agentName: string;
  selectedDate: string;
  formatNumber: (n: number) => string;
  formatPrintDate: (s: string) => string;
  hasPageBreak: boolean;
}) {
  const lotteries = report.lotteries || [];
  const grandTotalTickets = report.grandTotalTickets || 0;
  const grandTotalAmount = report.grandTotalAmount || 0;
  const amountInWords = report.amountInWords || "";

  return (
    <div
      className={`bg-white border border-border-default shadow-sm rounded-2xl print:border-0 print:shadow-none print:rounded-none print:p-0 overflow-hidden ${
        hasPageBreak ? "page-break-after" : ""
      }`}
    >
      {/* Report Header */}
      <div className="px-8 pt-8 pb-4 print:px-0 print:pt-0">
        <div className="text-center mb-6" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <p className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-1">
            {boardTitle}
          </p>
          <h2 className="font-bold text-xl tracking-wide text-gray-900">
            Agent&apos;s Scan Detail
          </h2>
        </div>

        <div
          className="text-sm space-y-1 mb-4"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          <div className="flex gap-4">
            <span className="font-bold text-gray-800 w-28">Agent Code</span>
            <span className="text-gray-900 font-semibold">{agentCode}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold text-gray-800 w-28">Agent Name</span>
            <span className="text-gray-900">{agentName}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-bold text-gray-800 w-28">Print Date</span>
            <span className="text-gray-900">{formatPrintDate(selectedDate)}</span>
          </div>
        </div>

        {/* Red separator line */}
        <div className="h-[2.5px] bg-[#cc0000] w-full" />
      </div>

      {/* Report Body */}
      <div className="px-8 pb-8 print:px-0 print:pb-0">
        {lotteries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm font-body">
              No winning claims recorded for {boardTitle} ({board}) on {selectedDate}.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <table
              className="w-full border-collapse"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              <thead>
                <tr className="text-sm">
                  <th className="text-left py-2 pl-2 font-bold text-gray-800 w-[36%]">
                    Lottery
                  </th>
                  <th className="text-right py-2 font-bold text-gray-800 w-[20%]">
                    Prize
                  </th>
                  <th className="text-center py-2 font-bold text-gray-800 w-[18%]">
                    Tickets
                  </th>
                  <th className="text-right py-2 pr-2 font-bold text-gray-800 w-[26%]">
                    Amount
                  </th>
                </tr>
              </thead>

              {/* Lottery Groups */}
              {lotteries.map((lottery, lIdx) => (
                <tbody key={lIdx} className="text-sm print-avoid-break">
                  {/* Lottery Name Row */}
                  <tr>
                    <td
                      colSpan={4}
                      className="pt-4 pb-1 pl-2 font-bold text-[#000080] text-sm tracking-wide"
                    >
                      {lottery.name.toUpperCase()}
                    </td>
                  </tr>

                  {/* Prize Tier Rows */}
                  {lottery.tiers.map((tier, tIdx) => (
                    <tr key={tIdx} className="hover:bg-gray-50/50">
                      <td className="py-0.5 pl-2" />
                      <td className="py-0.5 text-right text-gray-900 tabular-nums">
                        {formatNumber(tier.prize)}
                      </td>
                      <td className="py-0.5 text-center text-gray-900 tabular-nums">
                        {tier.ticketCount}
                      </td>
                      <td className="py-0.5 text-right pr-2 text-gray-900 tabular-nums">
                        {formatNumber(tier.amount)}
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr>
                    <td colSpan={3} />
                    <td className="text-right pr-2 pt-1 pb-2">
                      <div className="border-t border-gray-400 pt-0.5">
                        <span className="font-bold text-[#000080] text-sm tabular-nums">
                          {formatNumber(lottery.subtotalAmount)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ))}

              {/* Grand Total Row: in a tbody to prevent repeating across pages */}
              <tbody className="print-avoid-break">
                <tr>
                  <td className="pt-4 pb-2 pl-2 font-bold text-[#000080] text-sm">
                    Grand Total:
                  </td>
                  <td className="pt-4 pb-2" />
                  <td className="pt-4 pb-2 text-center">
                    <div className="inline-block border-t border-b border-gray-800 px-3 py-0.5 font-bold text-gray-900 text-sm tabular-nums">
                      {grandTotalTickets}
                    </div>
                  </td>
                  <td className="pt-4 pb-2 text-right pr-2">
                    <div className="inline-block border-t border-b-4 border-double border-gray-800 pt-0.5 pb-0.5 font-bold text-[#000080] text-sm tabular-nums">
                      {formatNumber(grandTotalAmount)}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Amount in words */}
            <div className="mt-8 pt-2">
              <p
                className="text-sm text-gray-900"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                <span className="font-bold">NOTE :</span> The amount of this Report is{" "}
                <span>{amountInWords}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
