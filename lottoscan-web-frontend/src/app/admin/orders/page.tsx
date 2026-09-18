"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { agent as agentApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface LotteryRow {
  name: string;
  board: string;
}

interface Employee {
  id: string;
  name: string;
  counterName: string;
  commissionRate: number;
}

export default function DailyOrdersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // Selected Date (defaults to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [lotteries, setLotteries] = useState<LotteryRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [returns, setReturns] = useState<Record<string, number>>({});
  const [commissionRates, setCommissionRates] = useState<Record<string, number>>({});
  
  const [dataLoading, setDataLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add Employee Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [deleteTargetEmp, setDeleteTargetEmp] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [empForm, setEmpForm] = useState({
    name: "",
    phone: "",
    email: "",
    counterName: "Route Seller",
    commissionRate: "2.5"
  });
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empError, setEmpError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  // Load Daily Orders Matrix from API
  const loadDailyOrders = useCallback(async (date: string) => {
    setDataLoading(true);
    setSaveStatusMsg(null);
    try {
      const res = await agentApi.getDailyOrders(date);
      const data = res.data?.data;
      if (data) {
        setLotteries(data.lotteries || []);
        setEmployees(data.employees || []);
        setMatrix(data.matrix || {});
        setReturns(data.returns || {});
        setCommissionRates(data.employeeCommissionRates || {});
      }
    } catch (err) {
      console.error("Error loading daily orders:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDailyOrders(selectedDate);
    }
  }, [isAdmin, selectedDate, loadDailyOrders]);

  // Handle cell value change for ticket quantity
  const handleCellChange = (lotteryName: string, empId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setMatrix(prev => ({
      ...prev,
      [lotteryName]: {
        ...(prev[lotteryName] || {}),
        [empId]: num
      }
    }));
  };

  // Handle Return tickets change
  const handleReturnChange = (empId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setReturns(prev => ({
      ...prev,
      [empId]: num
    }));
  };

  // Handle Commission Rate change
  const handleCommissionRateChange = (empId: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setCommissionRates(prev => ({
      ...prev,
      [empId]: num
    }));
  };

  // Save changes to backend
  const handleSaveOrders = async () => {
    setSaveLoading(true);
    setSaveStatusMsg(null);
    try {
      await agentApi.saveDailyOrders({
        date: selectedDate,
        matrix,
        returns,
        employeeCommissionRates: commissionRates
      });
      setSaveStatusMsg({ type: "success", text: "Daily order sheet saved successfully!" });
      setTimeout(() => setSaveStatusMsg(null), 4000);
    } catch (err: any) {
      setSaveStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to save daily order sheet." });
    } finally {
      setSaveLoading(false);
    }
  };

  // Add new employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpSubmitting(true);
    setEmpError("");
    try {
      const parsedRate = parseFloat(empForm.commissionRate) || 2.5;
      await agentApi.createEmployee({
        ...empForm,
        commissionRate: parsedRate
      });
      setIsEmpModalOpen(false);
      setEmpForm({ name: "", phone: "", email: "", counterName: "Route Seller", commissionRate: "2.5" });
      await loadDailyOrders(selectedDate);
      setSaveStatusMsg({ type: "success", text: `Seller "${empForm.name}" added successfully.` });
      setTimeout(() => setSaveStatusMsg(null), 4000);
    } catch (err: any) {
      setEmpError(err.response?.data?.message || "Failed to register employee");
    } finally {
      setEmpSubmitting(false);
    }
  };

  // Delete employee handler
  const handleDeleteEmployee = async () => {
    if (!deleteTargetEmp) return;
    setDeleteLoading(true);
    try {
      await agentApi.deleteEmployee(deleteTargetEmp.id);
      const targetName = deleteTargetEmp.name;
      const targetId = deleteTargetEmp.id;

      // Update local state without full reload
      setEmployees(prev => prev.filter(e => e.id !== targetId));
      setMatrix(prev => {
        const nextMatrix: Record<string, Record<string, number>> = {};
        Object.keys(prev).forEach(lot => {
          const row = { ...prev[lot] };
          delete row[targetId];
          nextMatrix[lot] = row;
        });
        return nextMatrix;
      });
      setReturns(prev => {
        const nextRet = { ...prev };
        delete nextRet[targetId];
        return nextRet;
      });
      setCommissionRates(prev => {
        const nextRates = { ...prev };
        delete nextRates[targetId];
        return nextRates;
      });

      setSaveStatusMsg({ type: "success", text: `Employee "${targetName}" removed successfully.` });
      setTimeout(() => setSaveStatusMsg(null), 4000);
      setDeleteTargetEmp(null);
    } catch (err: any) {
      setSaveStatusMsg({ type: "error", text: err.response?.data?.message || "Failed to delete employee." });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Quick Date Selectors
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Real-time Calculations
  // 1. Row Totals: Sum of tickets per lottery across all employees
  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    lotteries.forEach(lot => {
      let sum = 0;
      employees.forEach(emp => {
        sum += matrix[lot.name]?.[emp.id] || 0;
      });
      totals[lot.name] = sum;
    });
    return totals;
  }, [lotteries, employees, matrix]);

  // 2. Column Calculations per Employee
  const colTotals = useMemo(() => {
    const totalOrdered: Record<string, number> = {};
    const netSold: Record<string, number> = {};
    const commissionAmounts: Record<string, number> = {};
    const totalPayable: Record<string, number> = {};

    employees.forEach(emp => {
      let orderedSum = 0;
      lotteries.forEach(lot => {
        orderedSum += matrix[lot.name]?.[emp.id] || 0;
      });
      totalOrdered[emp.id] = orderedSum;

      const ret = returns[emp.id] || 0;
      const net = Math.max(0, orderedSum - ret);
      netSold[emp.id] = net;

      const rate = commissionRates[emp.id] !== undefined ? commissionRates[emp.id] : emp.commissionRate || 2.5;
      commissionAmounts[emp.id] = net * rate;
      totalPayable[emp.id] = orderedSum * 35; // Total tickets of that person * 35
    });

    return { totalOrdered, netSold, commissionAmounts, totalPayable };
  }, [lotteries, employees, matrix, returns, commissionRates]);

  // 3. Grand Totals
  const grandTotals = useMemo(() => {
    const totalOrdered = Object.values(rowTotals).reduce((a, b) => a + b, 0);
    const totalReturns = Object.values(returns).reduce((a, b) => a + b, 0);
    const totalNetSold = Object.values(colTotals.netSold).reduce((a, b) => a + b, 0);
    const totalCommission = Object.values(colTotals.commissionAmounts).reduce((a, b) => a + b, 0);
    const totalPayable = totalOrdered * 35; // Total tickets across all employees * 35

    return { totalOrdered, totalReturns, totalNetSold, totalCommission, totalPayable };
  }, [rowTotals, returns, colTotals]);

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

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16 print:pt-2 print:pb-2 print:bg-white text-text-primary">
      {/* ─── Printable Header (Shown Only on Print) ─── */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-3 text-center">
        <h1 className="text-xl font-black uppercase tracking-wider">LottoScan — Agency Lottery Distribution & Daily Order Sheet</h1>
        <h2 className="text-sm font-extrabold mt-0.5">EMPLOYEE DAILY TICKET ALLOCATIONS & COMMISSION RECONCILIATION</h2>
        <div className="flex justify-between text-xs mt-2 px-2 font-mono font-bold">
          <span>Agency: Central Regional Distribution Agency</span>
          <span>Order Date: {selectedDate}</span>
          <span>Total Employees: {employees.length}</span>
        </div>
      </div>

      <div className="container max-w-full px-4 sm:px-6 lg:px-8">
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
                Daily Orders & Commission
              </h1>
            </div>
            <p className="text-text-secondary font-body text-xs font-semibold mt-1">
              Create day-by-day ticket order allocations for sellers and calculate commissions automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManageModalOpen(true)}
              className="border-border-default bg-white text-text-primary font-bold text-xs shadow-sm hover:border-red-400 hover:text-red-700"
            >
              👥 Manage / Delete Sellers ({employees.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmpModalOpen(true)}
              className="border-border-default bg-white text-text-primary font-bold text-xs shadow-sm hover:border-gold"
            >
              ➕ Add Seller
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveOrders}
              loading={saveLoading}
              className="px-5 text-xs shadow-sm font-bold bg-gold hover:bg-gold-dark text-white"
            >
              💾 Save Order Sheet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-border-default bg-white text-text-secondary hover:text-text-primary font-bold text-xs shadow-sm"
            >
              🖨️ Export / Print Sheet
            </Button>
          </div>
        </div>

        {/* ─── Save Status Notification Banner ─── */}
        {saveStatusMsg && (
          <div
            className={`mb-5 p-3 rounded-xl text-xs font-bold flex items-center justify-between print:hidden shadow-sm ${
              saveStatusMsg.type === "success"
                ? "bg-win-light text-win border border-green-200"
                : "bg-lose-light text-lose border border-red-200"
            }`}
          >
            <span>{saveStatusMsg.type === "success" ? "✅" : "⚠️"} {saveStatusMsg.text}</span>
            <button onClick={() => setSaveStatusMsg(null)} className="text-sm font-bold opacity-75 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ─── Date Picker & Quick Filters ─── */}
        <Card className="bg-white border border-border-default shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                Select Order Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
                Viewing Sheet For: <strong className="text-text-primary">{selectedDate}</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* ─── KPI Metric Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Ordered Tickets
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {grandTotals.totalOrdered.toLocaleString()} <span className="text-xs font-body font-semibold text-text-muted">Tickets</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xl shrink-0">
              📦
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Unsold Returns
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-red-600 mt-1">
                {grandTotals.totalReturns.toLocaleString()} <span className="text-xs font-body font-semibold text-text-muted">Tickets</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-xl shrink-0">
              ↩️
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Net Sold Tickets
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                {grandTotals.totalNetSold.toLocaleString()} <span className="text-xs font-body font-semibold text-text-muted">Sold</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              ✅
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Payable (Value @ Rs. 35)
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                Rs. {grandTotals.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>
        </div>

        {/* ─── 2D Day-by-Day Order Matrix Table ─── */}
        <Card className="bg-white border border-border-default shadow-md overflow-hidden mb-8">
          <div className="p-4 bg-brand-section/50 border-b border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-display font-extrabold text-text-primary">
                Daily Order Allocation Sheet ({selectedDate})
              </h2>
              <p className="text-xs text-text-secondary font-body">
                Enter ticket order counts for each employee per lottery. The rightmost column aggregates total tickets for each lottery automatically.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-border-default rounded-md text-text-secondary">
              {employees.length} Employees Active
            </span>
          </div>

          {dataLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-body text-text-muted">Loading order allocation matrix...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-body text-text-secondary mb-3">No employees registered yet.</p>
              <Button size="sm" onClick={() => setIsEmpModalOpen(true)} className="bg-gold text-white text-xs">
                ➕ Add First Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[750px] relative">
              <table className="w-full text-left border-collapse border border-gray-300 text-xs">
                {/* ── Table Header: Employees ── */}
                <thead className="sticky top-0 z-20 bg-amber-400 text-gray-900 uppercase font-extrabold shadow-sm">
                  <tr>
                    {/* Sticky Lottery Name Column */}
                    <th className="sticky left-0 z-30 bg-amber-400 border border-gray-300 p-2.5 text-left min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      <span className="block text-xs font-black">Lottery Game</span>
                      <span className="block text-[10px] font-semibold text-gray-800">Board Type</span>
                    </th>

                    {/* Employee Columns */}
                    {employees.map((emp) => {
                      const currentRate = commissionRates[emp.id] !== undefined ? commissionRates[emp.id] : emp.commissionRate || 2.5;
                      return (
                        <th
                          key={emp.id}
                          className="relative group border border-gray-300 p-2 text-center min-w-[100px] max-w-[130px] bg-amber-300/80 hover:bg-amber-300 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setDeleteTargetEmp(emp)}
                            title={`Remove ${emp.name}`}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow cursor-pointer"
                          >
                            ✕
                          </button>
                          <div className="font-extrabold text-xs truncate text-gray-950" title={emp.name}>
                            {emp.name}
                          </div>
                          <div className="text-[10px] font-mono text-gray-700 truncate" title={emp.counterName}>
                            {emp.counterName.replace(/Counter \d+ - /i, "")}
                          </div>
                          <div className="mt-0.5 inline-block bg-white/90 text-amber-900 border border-amber-400 px-1 py-0.2 rounded text-[9px] font-mono font-black">
                            Rs. {currentRate.toFixed(2)}/tkt
                          </div>
                        </th>
                      );
                    })}

                    {/* Rightmost Total Column */}
                    <th className="sticky right-0 z-30 bg-amber-500 text-gray-950 border border-gray-400 p-2 text-center min-w-[110px] font-black shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      <span className="block text-xs">TOTAL TICKETS</span>
                      <span className="block text-[9px] font-medium text-gray-900">(Lottery Total)</span>
                    </th>
                  </tr>
                </thead>

                {/* ── Table Body: 16 Lottery Rows ── */}
                <tbody className="divide-y divide-gray-200 font-body">
                  {lotteries.map((lot, lIdx) => {
                    const rowTotal = rowTotals[lot.name] || 0;
                    const isDLB = lot.board === "DLB";
                    const isEven = lIdx % 2 === 0;

                    return (
                      <tr
                        key={lot.name}
                        className={`hover:bg-amber-50/50 transition-colors ${
                          isEven ? "bg-white" : "bg-gray-50/70"
                        }`}
                      >
                        {/* Sticky Left Lottery Column */}
                        <td className={`sticky left-0 z-10 border border-gray-300 p-2 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                          isEven ? "bg-white" : "bg-gray-50"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-text-primary truncate">
                              {lIdx + 1}. {lot.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                                isDLB
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-blue-100 text-blue-900 border border-blue-300"
                              }`}
                            >
                              {lot.board}
                            </span>
                          </div>
                        </td>

                        {/* Interactive Cell per Employee */}
                        {employees.map((emp) => {
                          const val = matrix[lot.name]?.[emp.id] ?? 0;
                          return (
                            <td
                              key={emp.id}
                              className="border border-gray-300 p-1 text-center font-mono"
                            >
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={val === 0 ? "" : val}
                                placeholder="0"
                                onChange={(e) => handleCellChange(lot.name, emp.id, e.target.value)}
                                className={`w-full text-center font-mono font-bold text-xs py-1 rounded border transition-all ${
                                  val > 0
                                    ? "bg-amber-50/70 text-gray-950 border-amber-300 font-extrabold"
                                    : "bg-transparent text-gray-400 border-transparent hover:border-gray-300 focus:bg-white focus:border-gold"
                                } focus:outline-none focus:ring-1 focus:ring-gold`}
                              />
                            </td>
                          );
                        })}

                        {/* Rightmost Total Column for this Lottery */}
                        <td className="sticky right-0 z-10 border border-gray-300 p-2 text-center font-mono font-black text-xs bg-amber-100/90 text-amber-950 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {rowTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* ── Table Footer: Calculations matching user's spreadsheet ── */}
                <tfoot className="sticky bottom-0 z-20 font-mono font-bold text-xs shadow-md">
                  {/* Row 1: Total Ordered per employee */}
                  <tr className="bg-amber-200 text-gray-950 border-t-2 border-amber-400">
                    <td className="sticky left-0 z-30 bg-amber-200 border border-gray-300 p-2.5 font-black uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      TOTAL ORDERED
                    </td>
                    {employees.map((emp) => (
                      <td key={emp.id} className="border border-gray-300 p-2 text-center font-black text-sm">
                        {(colTotals.totalOrdered[emp.id] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="sticky right-0 z-30 bg-amber-300 text-gray-950 border border-gray-400 p-2 text-center font-black text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      {grandTotals.totalOrdered.toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 2: Unsold Returns */}
                  <tr className="bg-red-600 text-white border-y border-red-700">
                    <td className="sticky left-0 z-30 bg-red-600 text-white border border-red-700 p-2 font-black uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      UNSOLD RETURNS
                    </td>
                    {employees.map((emp) => {
                      const retVal = returns[emp.id] ?? 0;
                      return (
                        <td key={emp.id} className="border border-red-700 p-1 text-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={retVal === 0 ? "" : retVal}
                            placeholder="0"
                            onChange={(e) => handleReturnChange(emp.id, e.target.value)}
                            className="w-full text-center font-mono font-black text-xs py-1 rounded bg-red-700/80 text-white placeholder-red-300 border border-red-500 focus:outline-none focus:bg-red-800 focus:border-white"
                          />
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-30 bg-red-700 text-white border border-red-800 p-2 text-center font-black text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      {grandTotals.totalReturns.toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 3: Net Sold */}
                  <tr className="bg-emerald-100 text-emerald-950 border-b border-emerald-300">
                    <td className="sticky left-0 z-30 bg-emerald-100 border border-gray-300 p-2 font-black uppercase text-emerald-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      NET SOLD
                    </td>
                    {employees.map((emp) => (
                      <td key={emp.id} className="border border-gray-300 p-2 text-center font-extrabold text-emerald-900">
                        {(colTotals.netSold[emp.id] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="sticky right-0 z-30 bg-emerald-200 text-emerald-950 border border-emerald-400 p-2 text-center font-black text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      {grandTotals.totalNetSold.toLocaleString()}
                    </td>
                  </tr>

                  {/* Row 4: Commission Rate Input (Rs. 2.50 or 2.00) */}
                  <tr className="bg-sky-50 text-sky-950 border-b border-sky-200">
                    <td className="sticky left-0 z-30 bg-sky-50 border border-gray-300 p-2 font-black uppercase text-sky-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      COMMISSION RATE (Rs./Tkt)
                    </td>
                    {employees.map((emp) => {
                      const rate = commissionRates[emp.id] !== undefined ? commissionRates[emp.id] : emp.commissionRate || 2.5;
                      return (
                        <td key={emp.id} className="border border-gray-300 p-1 text-center">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={rate}
                            onChange={(e) => handleCommissionRateChange(emp.id, e.target.value)}
                            className="w-16 text-center font-mono font-bold text-xs py-1 rounded bg-sky-100/90 text-sky-950 border border-sky-300 focus:outline-none focus:border-sky-600 focus:bg-white"
                          />
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-30 bg-sky-200 text-sky-950 border border-sky-300 p-2 text-center font-extrabold text-[10px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      CUSTOM / TKT
                    </td>
                  </tr>

                  {/* Row 5: Seller Commission (Rs.) */}
                  <tr className="bg-emerald-50 text-emerald-950 border-b border-emerald-200">
                    <td className="sticky left-0 z-30 bg-emerald-50 border border-gray-300 p-2 font-black uppercase text-emerald-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      SELLER COMMISSION (Rs.)
                    </td>
                    {employees.map((emp) => {
                      const comm = colTotals.commissionAmounts[emp.id] || 0;
                      return (
                        <td key={emp.id} className="border border-gray-300 p-2 text-center font-bold text-emerald-800">
                          Rs. {comm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-30 bg-emerald-200 text-emerald-950 border border-emerald-300 p-2 text-center font-black text-xs shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      Rs. {grandTotals.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  {/* Row 6: Total Payable (Value of Tickets @ Rs. 35) */}
                  <tr className="bg-amber-100 text-amber-950 border-t-2 border-amber-400">
                    <td className="sticky left-0 z-30 bg-amber-100 border border-gray-300 p-2.5 font-black uppercase text-amber-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      TOTAL PAYABLE (@ Rs. 35)
                    </td>
                    {employees.map((emp) => {
                      const payable = colTotals.totalPayable[emp.id] || 0;
                      return (
                        <td key={emp.id} className="border border-gray-300 p-2 text-center font-black text-win text-sm">
                          Rs. {payable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-30 bg-amber-300 text-amber-950 border border-amber-500 p-2 text-center font-black text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                      Rs. {grandTotals.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* ─── Printable Dispatch & Settlement Signature Section ─── */}
        <div className="hidden print:grid grid-cols-3 gap-8 mt-10 pt-6 border-t border-black text-center text-xs">
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">Stock Dispatcher Signature</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">Area Agent Approval & Seal</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 pb-8" />
            <p className="font-bold">Accounts / Cash Settlement</p>
          </div>
        </div>
      </div>

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
              Add New Employee / Seller
            </h3>
            <p className="text-xs text-text-secondary font-body mb-4">
              Enter seller details and set their commission rate (e.g. Rs. 2.50 or Rs. 2.00 per sold ticket).
            </p>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs font-body">
              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  Employee / Seller Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wijethunga / Nimal"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  Counter / Route Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter 04 - Pettah or Route Seller A"
                  value={empForm.counterName}
                  onChange={(e) => setEmpForm({ ...empForm, counterName: e.target.value })}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  Commission Rate per Ticket (Rs.) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    placeholder="2.5"
                    value={empForm.commissionRate}
                    onChange={(e) => setEmpForm({ ...empForm, commissionRate: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-mono font-bold text-sm focus:outline-none focus:border-gold"
                  />
                  <span className="text-text-muted font-bold text-xs whitespace-nowrap">Rs. / ticket</span>
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Common rates: <strong>Rs. 2.50</strong> (Standard) or <strong>Rs. 2.00</strong> (Special)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-text-secondary mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="077-1234567"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-mono focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-text-secondary mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="seller@lottoscan.lk"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {empError && (
                <div className="p-2.5 rounded-lg text-xs font-semibold bg-lose-light text-lose border border-red-200">
                  {empError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsEmpModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={empSubmitting} className="bg-gold text-white font-bold">
                  Register Seller
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Manage Sellers Modal (List & Delete) ─── */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-2xl w-full p-6 border border-border-default shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsManageModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-lg"
            >
              ✕
            </button>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-display font-extrabold text-text-primary">
                Manage Active Sellers ({employees.length})
              </h3>
            </div>
            <p className="text-xs text-text-secondary font-body mb-4">
              View all registered sellers, their assigned commission rates, or remove sellers who no longer work with the agency.
            </p>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 border border-border-default rounded-xl mb-4 text-xs font-body">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs">
                  No sellers registered yet.
                </div>
              ) : (
                employees.map((emp) => {
                  const rate = commissionRates[emp.id] !== undefined ? commissionRates[emp.id] : emp.commissionRate || 2.5;
                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-brand-card-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center justify-center text-xs">
                          👤
                        </div>
                        <div>
                          <p className="font-extrabold text-text-primary text-sm">
                            {emp.name}
                          </p>
                          <p className="text-text-secondary text-[11px]">
                            {emp.counterName || "Route Seller"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-mono font-bold text-xs">
                          Rs. {rate.toFixed(2)}/tkt
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetEmp(emp);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsManageModalOpen(false);
                  setIsEmpModalOpen(true);
                }}
                className="text-xs font-bold border-gold-border text-gold-dark bg-gold-light"
              >
                ➕ Add New Seller
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManageModalOpen(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTargetEmp && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full p-6 border border-red-200 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-4 mx-auto">
              ⚠️
            </div>
            <h3 className="text-lg font-display font-extrabold text-text-primary text-center mb-1">
              Delete Employee / Seller?
            </h3>
            <p className="text-xs text-text-secondary font-body text-center mb-5">
              Are you sure you want to remove <strong className="text-text-primary">{deleteTargetEmp.name}</strong> ({deleteTargetEmp.counterName})? This will exclude them from the daily order allocation sheet.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTargetEmp(null)}
                className="w-full text-xs font-bold border border-border-default"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                loading={deleteLoading}
                onClick={handleDeleteEmployee}
                className="w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                🗑️ Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
