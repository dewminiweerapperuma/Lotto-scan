"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { LOTTERIES } from "@/lib/constants";

export default function DailyReportsPage() {
  const { user, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Selected date (defaults to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [reportData, setReportData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [ordersMetrics, setOrdersMetrics] = useState({
    totalCommission: 0,
    activeStaff: 0
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"boards" | "counters" | "claims">("boards");

  // Record Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    lotteryName: "Govisetha",
    board: "NLB",
    drawNumber: "",
    drawDate: new Date().toISOString().slice(0, 10),
    ticketSerial: "",
    matchedTier: "3 Numbers Match",
    prizeAmount: "2000",
    employeeName: "Counter 01 - Pettah Central",
    employeeId: "emp-1"
  });
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");

  // Add Employee Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    name: "",
    phone: "",
    email: "",
    counterName: "Counter 03 - Branch"
  });
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empMsg, setEmpMsg] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  // Fetch Report Data for Selected Date
  const loadReport = useCallback(async (date: string) => {
    setDataLoading(true);
    try {
      const [repRes, empRes, ordersRes] = await Promise.all([
        agentApi.getDailyReport(date),
        agentApi.getEmployees(),
        agentApi.getDailyOrders(date)
      ]);
      setReportData(repRes.data?.data || null);
      const emps = empRes.data?.data || [];
      setEmployees(emps);

      const orderData = ordersRes.data?.data;
      if (orderData) {
        const oLotteries = orderData.lotteries || [];
        const oEmps = orderData.employees || [];
        const oMatrix = orderData.matrix || {};
        const oReturns = orderData.returns || {};
        const oRates = orderData.employeeCommissionRates || {};

        let commSum = 0;
        oEmps.forEach((emp: any) => {
          let ordered = 0;
          oLotteries.forEach((lot: any) => {
            ordered += oMatrix[lot.name]?.[emp.id] || 0;
          });
          const ret = oReturns[emp.id] || 0;
          const net = Math.max(0, ordered - ret);
          const rate = oRates[emp.id] !== undefined ? oRates[emp.id] : emp.commissionRate || 2.5;
          commSum += net * rate;
        });

        setOrdersMetrics({
          totalCommission: commSum,
          activeStaff: oEmps.length || emps.length
        });
      }
    } catch (err) {
      console.error("Error loading daily report:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadReport(selectedDate);
    }
  }, [isAdmin, selectedDate, loadReport]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Submit Claim
  const handleRecordClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSubmitting(true);
    setClaimMsg("");
    try {
      await agentApi.recordClaim({
        ...claimForm,
        prizeAmount: parseFloat(claimForm.prizeAmount) || 0,
        drawDate: selectedDate
      });
      setClaimMsg("Winning ticket payout recorded successfully!");
      setTimeout(() => {
        setIsClaimModalOpen(false);
        setClaimMsg("");
        loadReport(selectedDate);
      }, 1000);
    } catch (err: any) {
      setClaimMsg(err.response?.data?.message || "Failed to record claim");
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Submit Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpSubmitting(true);
    setEmpMsg("");
    try {
      await agentApi.createEmployee(empForm);
      setEmpMsg("Employee registered successfully!");
      setEmpForm({ name: "", phone: "", email: "", counterName: "Counter 03 - Branch" });
      setTimeout(() => {
        setIsEmpModalOpen(false);
        setEmpMsg("");
        loadReport(selectedDate);
      }, 1000);
    } catch (err: any) {
      setEmpMsg(err.response?.data?.message || "Failed to add employee");
    } finally {
      setEmpSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const metrics = reportData?.metrics || {
    totalTickets: 0,
    totalPayout: 0,
    estimatedCommission: 0,
    activeCounters: 0
  };

  const boardBreakdown = reportData?.boardBreakdown || {};
  const dlbData = boardBreakdown["DLB"] || { board: "DLB", totalTickets: 0, totalPayout: 0, estimatedCommission: 0, tiers: [] };
  const nlbData = boardBreakdown["NLB"] || { board: "NLB", totalTickets: 0, totalPayout: 0, estimatedCommission: 0, tiers: [] };

  const counterStaff = reportData?.employeeBreakdown || [];
  const recentClaims = reportData?.recentClaims || [];

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16 print:pt-4 print:pb-4 print:bg-white">
      {/* ─── Printable Header (Shown Only on Print) ─── */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider">LottoScan — National & Development Lotteries</h1>
        <h2 className="text-xl font-extrabold mt-1">DAILY WINNING TICKETS SUMMARY REPORT (BOARD-WISE)</h2>
        <div className="flex justify-between text-xs mt-3 px-4 font-mono font-bold">
          <span>Agency: Central Regional Lottery Agency (NLB: NLB-AG-7841 | DLB: DLB-AG-3092)</span>
          <span>Report Date: {selectedDate}</span>
        </div>
      </div>

      <div className="container max-w-7xl">
        {/* ─── Top Header Bar (Screen Only) ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="text-text-secondary hover:text-text-primary transition-colors font-body text-xs font-bold border border-border-default px-2.5 py-1 rounded-lg bg-white shadow-sm"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
                Daily Winning Summary Report
              </h1>
            </div>
            <p className="text-text-secondary font-body text-xs font-semibold mt-1">
              Area Agency: <span className="font-mono text-text-primary font-bold">NLB-AG-7841 / DLB-AG-3092</span> • Central Regional Agency
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/scan">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm px-3.5"
              >
                ⚡ Bulk Scanner
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs shadow-sm hover:bg-amber-100"
              >
                📦 Daily Order Sheet
              </Button>
            </Link>
            <Link href="/admin/reports/scan-detail">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 bg-purple-50 text-purple-900 font-bold text-xs shadow-sm hover:bg-purple-100"
              >
                📋 Agent&apos;s Scan Detail
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmpModalOpen(true)}
              className="border-border-default bg-white text-text-primary font-bold text-xs shadow-sm hover:border-gold"
            >
              👥 Add Counter Staff
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClaimModalOpen(true)}
              className="border-gold-border bg-gold-light text-gold-dark font-bold text-xs shadow-sm hover:bg-gold hover:text-white"
            >
              ➕ Record Winning Payout
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="px-4 text-xs shadow-sm font-bold"
            >
              🖨️ Export / Print Report
            </Button>
          </div>
        </div>

        {/* ─── Date Picker & Day-by-Day Filter Bar ─── */}
        <Card className="bg-white border border-border-default shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Select Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border border-border-default rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-text-primary bg-brand-section focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickDate(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-section text-text-secondary hover:text-text-primary border border-border-default transition-all"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate(2)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-section text-text-secondary hover:text-text-primary border border-border-default transition-all"
              >
                2 Days Ago
              </button>
              <span className="text-text-muted text-xs font-mono pl-2">
                Viewing: <strong className="text-text-primary">{selectedDate}</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* ─── Key Metrics KPI Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Winning Tickets
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {metrics.totalTickets} <span className="text-xs font-body font-semibold text-text-muted">Tickets</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xl shrink-0">
              🎫
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Prize Paid Out
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                Rs. {Number(metrics.totalPayout || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Agency Commission
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-gold-dark mt-1">
                Rs. {ordersMetrics.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              📈
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Active Staff Members
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {ordersMetrics.activeStaff || employees.length} <span className="text-xs font-body font-semibold text-text-muted">Sellers</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-brand-section border border-border-default flex items-center justify-center text-xl shrink-0">
              🏪
            </div>
          </Card>
        </div>

        {/* ─── Navigation Tabs (Screen Only) ─── */}
        <div className="flex border-b border-border-default mb-6 gap-2 print:hidden">
          <button
            onClick={() => setActiveTab("boards")}
            className={`py-2.5 px-4 font-body font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === "boards"
                ? "border-gold text-gold-dark bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            🏛️ Board-Wise Summary (NLB & DLB)
          </button>
          <button
            onClick={() => setActiveTab("counters")}
            className={`py-2.5 px-4 font-body font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === "counters"
                ? "border-gold text-gold-dark bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            👥 Counter / Employee Summary ({counterStaff.length})
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`py-2.5 px-4 font-body font-bold text-xs sm:text-sm border-b-2 transition-all ${
              activeTab === "claims"
                ? "border-gold text-gold-dark bg-white rounded-t-lg shadow-sm"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            📜 Individual Claims Audit ({recentClaims.length})
          </button>
        </div>

        {/* ─── TAB 1: Board-Wise Summary (DLB & NLB) ─── */}
        {(activeTab === "boards" || typeof window === "undefined") && (
          <div className="space-y-8 mb-8">
            {/* 1. Development Lotteries Board (DLB) Section */}
            <Card className="bg-white border border-border-default shadow-sm overflow-hidden">
              <div className="p-4 bg-amber-50/50 border-b border-amber-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    DLB
                  </span>
                  <div>
                    <h2 className="text-base font-display font-extrabold text-text-primary">
                      Development Lotteries Board — Winning Results Summary
                    </h2>
                    <p className="text-xs text-text-secondary font-body">
                      Breakdown of winning prizes paid for DLB lotteries (Ada Kotipathi, Shanida, Lagna, Kapruka, Sasiri, etc.)
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono font-bold text-text-secondary">
                    Total DLB Tickets: <strong className="text-text-primary">{dlbData.totalTickets}</strong>
                  </span>
                </div>
              </div>

              {dlbData.tiers.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs font-body">
                  No DLB winning payouts recorded for {selectedDate}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-section text-text-secondary font-body font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                        <th className="py-3 px-5">Winning Prize Value</th>
                        <th className="py-3 px-5 text-center">Winning Tickets (Qty)</th>
                        <th className="py-3 px-5 text-right">Total Payout Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/50 font-body text-xs">
                      {dlbData.tiers.map((tier: any, idx: number) => (
                        <tr key={idx} className="hover:bg-brand-card-hover transition-colors">
                          <td className="py-3 px-5 font-bold text-text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Rs. {Number(tier.prizeValue).toLocaleString()} Prize
                          </td>
                          <td className="py-3 px-5 text-center font-mono font-extrabold text-text-primary text-sm">
                            {tier.ticketCount} <span className="text-[10px] font-normal text-text-muted">tickets</span>
                          </td>
                          <td className="py-3 px-5 text-right font-mono font-bold text-win text-sm">
                            Rs. {Number(tier.totalAmount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50/70 font-bold text-text-primary border-t-2 border-amber-200">
                        <td className="py-3.5 px-5 uppercase text-xs text-amber-900">
                          DLB Total Subtotal:
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-sm text-amber-900">
                          {dlbData.totalTickets} Tickets
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-base text-win">
                          Rs. {Number(dlbData.totalPayout).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* 2. National Lotteries Board (NLB) Section */}
            <Card className="bg-white border border-border-default shadow-sm overflow-hidden">
              <div className="p-4 bg-blue-50/50 border-b border-blue-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    NLB
                  </span>
                  <div>
                    <h2 className="text-base font-display font-extrabold text-text-primary">
                      National Lotteries Board — Winning Results Summary
                    </h2>
                    <p className="text-xs text-text-secondary font-body">
                      Breakdown of winning prizes paid for NLB lotteries (Govisetha, Mahajana Sampatha, Mega Power, Dhana Nidhanaya, etc.)
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono font-bold text-text-secondary">
                    Total NLB Tickets: <strong className="text-text-primary">{nlbData.totalTickets}</strong>
                  </span>
                </div>
              </div>

              {nlbData.tiers.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs font-body">
                  No NLB winning payouts recorded for {selectedDate}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-section text-text-secondary font-body font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                        <th className="py-3 px-5">Winning Prize Value</th>
                        <th className="py-3 px-5 text-center">Winning Tickets (Qty)</th>
                        <th className="py-3 px-5 text-right">Total Payout Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/50 font-body text-xs">
                      {nlbData.tiers.map((tier: any, idx: number) => (
                        <tr key={idx} className="hover:bg-brand-card-hover transition-colors">
                          <td className="py-3 px-5 font-bold text-text-primary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Rs. {Number(tier.prizeValue).toLocaleString()} Prize
                          </td>
                          <td className="py-3 px-5 text-center font-mono font-extrabold text-text-primary text-sm">
                            {tier.ticketCount} <span className="text-[10px] font-normal text-text-muted">tickets</span>
                          </td>
                          <td className="py-3 px-5 text-right font-mono font-bold text-win text-sm">
                            Rs. {Number(tier.totalAmount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/70 font-bold text-text-primary border-t-2 border-blue-200">
                        <td className="py-3.5 px-5 uppercase text-xs text-blue-900">
                          NLB Total Subtotal:
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-sm text-blue-900">
                          {nlbData.totalTickets} Tickets
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono text-base text-win">
                          Rs. {Number(nlbData.totalPayout).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>

            {/* 3. Grand Agency Combined Total Banner */}
            <Card className="bg-brand-section border-2 border-gold-border p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-extrabold text-text-primary text-lg">
                    Grand Daily Winning Payout Summary
                  </h3>
                  <p className="text-text-secondary text-xs font-body mt-0.5">
                    Combined total of all winning tickets claimed across both DLB & NLB boards for {selectedDate}
                  </p>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Total Tickets</span>
                    <span className="font-mono text-xl font-extrabold text-text-primary">{metrics.totalTickets}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Total Cash Disbursed</span>
                    <span className="font-mono text-2xl font-extrabold text-win">Rs. {Number(metrics.totalPayout).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">Total Orders Commission</span>
                    <span className="font-mono text-xl font-extrabold text-gold-dark">Rs. {ordersMetrics.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── TAB 2: Counter / Employee Performance ─── */}
        {activeTab === "counters" && (
          <Card className="bg-white border border-border-default shadow-sm overflow-hidden mb-8">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-extrabold text-text-primary">
                  Counter / Staff Performance
                </h2>
                <p className="text-xs text-text-secondary font-body">
                  Summary of tickets validated and cash payouts handled per counter staff
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEmpModalOpen(true)}
                className="text-xs font-bold border-border-default"
              >
                ➕ Add Counter Staff
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-section text-text-secondary font-body font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                    <th className="py-3 px-4">Staff / Counter Name</th>
                    <th className="py-3 px-4 text-center">Tickets Checked</th>
                    <th className="py-3 px-4 text-center">Winning Tickets Paid</th>
                    <th className="py-3 px-4 text-right">Total Cash Paid Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 font-body text-xs">
                  {counterStaff.map((staff: any, idx: number) => (
                    <tr key={idx} className="hover:bg-brand-card-hover transition-colors">
                      <td className="py-3.5 px-4 font-bold text-text-primary flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xs">
                          👤
                        </span>
                        {staff.employeeName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-text-secondary">
                        {staff.ticketsChecked}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-text-primary">
                        {staff.winningTickets}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-win text-sm">
                        Rs. {Number(staff.totalPayout).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ─── TAB 3: Individual Claims Audit Log ─── */}
        {activeTab === "claims" && (
          <Card className="bg-white border border-border-default shadow-sm overflow-hidden mb-8">
            <div className="p-4 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-extrabold text-text-primary">
                  Recent Winning Claims Log
                </h2>
                <p className="text-xs text-text-secondary font-body">
                  Individual verified tickets claimed on {selectedDate}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-section text-text-secondary font-body font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                    <th className="py-3 px-4">Ticket Serial</th>
                    <th className="py-3 px-4">Board</th>
                    <th className="py-3 px-4">Lottery</th>
                    <th className="py-3 px-4">Tier Matched</th>
                    <th className="py-3 px-4">Handled By</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Prize Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50 font-body text-xs">
                  {recentClaims.map((claim: any, idx: number) => (
                    <tr key={idx} className="hover:bg-brand-card-hover transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold-dark">
                        {claim.ticketSerial}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            claim.board === "NLB"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {claim.board}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-text-primary">
                        {claim.lotteryName}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {claim.matchedTier}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-[11px]">
                        {claim.employeeName}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="green">{claim.payoutStatus || "Paid"}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-win">
                        Rs. {Number(claim.prizeAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ─── Printable Signature & Certification Footer ─── */}
        <div className="hidden print:grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-black text-center text-xs">
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">Prepared By (Counter Staff)</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">Area Agent Signature & Seal</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">NLB / DLB Official Certification</p>
          </div>
        </div>
      </div>

      {/* ─── Record Claim / Payout Modal ─── */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-lg w-full p-6 border border-border-default shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-lg"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-extrabold text-text-primary mb-1">
              Record Winning Ticket Payout
            </h3>
            <p className="text-xs text-text-secondary font-body mb-4">
              Enter details for a winning ticket paid to a customer at the counter
            </p>

            <form onSubmit={handleRecordClaim} className="space-y-4 text-xs font-body">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-secondary mb-1">Lottery & Board</label>
                  <select
                    value={claimForm.lotteryName}
                    onChange={(e) => {
                      const lot = LOTTERIES.find((l) => l.name === e.target.value);
                      setClaimForm({
                        ...claimForm,
                        lotteryName: e.target.value,
                        board: lot?.board || "NLB"
                      });
                    }}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                  >
                    {LOTTERIES.map((l) => (
                      <option key={l.id} value={l.name}>
                        {l.name} ({l.board})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-text-secondary mb-1">Winning Prize (Rs.)</label>
                  <select
                    value={claimForm.prizeAmount}
                    onChange={(e) => setClaimForm({ ...claimForm, prizeAmount: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-win font-mono font-bold text-sm focus:outline-none focus:border-gold"
                  >
                    {[40, 80, 100, 120, 200, 400, 500, 1000, 2000, 2500, 4000, 5000, 10000, 20000, 50000, 100000, 200000, 250000].map((p) => (
                      <option key={p} value={p}>
                        Rs. {p.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-secondary mb-1">Matched Tier / Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Numbers Match"
                    value={claimForm.matchedTier}
                    onChange={(e) => setClaimForm({ ...claimForm, matchedTier: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text-secondary mb-1">Ticket Serial / Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. TCK-849201"
                    value={claimForm.ticketSerial}
                    onChange={(e) => setClaimForm({ ...claimForm, ticketSerial: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-mono focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">Counter Staff / Employee</label>
                <select
                  value={claimForm.employeeName}
                  onChange={(e) => setClaimForm({ ...claimForm, employeeName: e.target.value })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={`${emp.name} (${emp.counterName})`}>
                      {emp.name} — {emp.counterName}
                    </option>
                  ))}
                </select>
              </div>

              {claimMsg && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${claimMsg.includes("success") ? "bg-win-light text-win border border-green-200" : "bg-lose-light text-lose border border-red-200"}`}>
                  {claimMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsClaimModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={claimSubmitting} className="px-6 font-bold">
                  💾 Save Payout
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Add Employee Modal ─── */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full p-6 border border-border-default shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsEmpModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-lg"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-extrabold text-text-primary mb-1">
              Add Counter Staff / Employee
            </h3>
            <p className="text-xs text-text-secondary font-body mb-4">
              Register a new counter staff or mobile seller under your agency
            </p>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs font-body">
              <div>
                <label className="block font-bold text-text-secondary mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Wickramasinghe"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">Counter / Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 03 - Kandy Main Bus Stand"
                  value={empForm.counterName}
                  onChange={(e) => setEmpForm({ ...empForm, counterName: e.target.value })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-secondary mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="077-XXXXXXX"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-text-secondary mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="staff@agency.lk"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {empMsg && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${empMsg.includes("success") ? "bg-win-light text-win border border-green-200" : "bg-lose-light text-lose border border-red-200"}`}>
                  {empMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsEmpModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={empSubmitting} className="px-6 font-bold">
                  ➕ Register Staff
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
