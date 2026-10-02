"use client";

import React, { useRef } from "react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export interface TierItem {
  prize: number;
  count: number;
  subtotal: number;
}

export interface SessionSlipData {
  sessionNumber?: string;
  employeeName: string;
  counterName?: string;
  date?: string;
  time?: string;
  totalTickets: number;
  winningTickets: number;
  nonWinningTickets?: number;
  tiers: TierItem[];
  totalWinningAmount: number;
  returnShortageAmount: number;
  netTotalAmount: number;
  notes?: string;
}

interface SessionSlipViewProps {
  data: SessionSlipData;
  onClose?: () => void;
  editableReturn?: boolean;
  onReturnChange?: (val: number) => void;
  showPrintButton?: boolean;
}

export default function SessionSlipView({
  data,
  onClose,
  editableReturn = false,
  onReturnChange,
  showPrintButton = true,
}: SessionSlipViewProps) {
  const { t } = useLanguage();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // Standard tiers from Sri Lankan lottery slip
  const standardPrizes = [40, 80, 120, 160, 200, 240, 400, 500, 1000, 2000, 4000];

  // Map incoming tiers or fill with 0s
  const tierMap = new Map<number, number>();
  (data.tiers || []).forEach((t) => {
    tierMap.set(t.prize, t.count);
  });

  // Calculate higher / non-standard tiers if any
  const otherTiers = (data.tiers || []).filter(
    (t) => !standardPrizes.includes(t.prize) && t.count > 0
  );

  return (
    <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-w-md w-full mx-auto print:m-0 print:border-none print:shadow-none">
      {/* Header bar (screen only) */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-zinc-900 text-white print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧾</span>
          <span className="font-heading font-black text-sm uppercase tracking-wider">
            {t("slip_header_title")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🖨️ {t("slip_print_btn")}</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-white/80 hover:text-white p-1 text-sm font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Printable Paper Slip */}
      <div
        ref={printAreaRef}
        className="p-5 font-mono text-xs bg-white text-zinc-900 space-y-4 print:p-2"
        id="printable-slip"
      >
        {/* Receipt Header */}
        <div className="text-center border-b-2 border-dashed border-zinc-300 pb-3">
          <h2 className="text-base font-black tracking-widest uppercase">
            {t("slip_agency_name")}
          </h2>
          <p className="text-[11px] text-zinc-600 font-sans font-medium">
            {t("slip_voucher_sub")}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">
            {t("slip_session_label")} <span className="font-bold">{data.sessionNumber || "ACTIVE"}</span>
          </p>
        </div>

        {/* Session & Employee Metadata */}
        <div className="space-y-1 py-1 border-b border-dashed border-zinc-300 text-[11px]">
          <div className="flex justify-between">
            <span className="text-zinc-600">{t("slip_emp_label")}</span>
            <span className="font-bold text-zinc-900">{data.employeeName}</span>
          </div>
          {data.counterName && (
            <div className="flex justify-between">
              <span className="text-zinc-600">{t("slip_counter_label")}</span>
              <span className="font-semibold text-zinc-800">{data.counterName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600">{t("slip_datetime_label")}</span>
            <span>
              {data.date || new Date().toISOString().slice(0, 10)}{" "}
              {data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">{t("slip_scanned_label")}</span>
            <span className="font-bold">
              {data.totalTickets} {t("slip_total_won")} ({data.winningTickets} {t("slip_won_count")})
            </span>
          </div>
        </div>

        {/* Exact Table From Attached Slip */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-800 text-[11px] font-bold">
                <th className="py-1.5 px-3 border-r border-zinc-800">{t("slip_col_prize")}</th>
                <th className="py-1.5 px-3 border-r border-zinc-800 text-center">{t("slip_col_qty")}</th>
                <th className="py-1.5 px-3 text-right">{t("slip_col_subtotal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px]">
              {standardPrizes.map((prize) => {
                const count = tierMap.get(prize) || 0;
                const subtotal = count * prize;
                return (
                  <tr
                    key={prize}
                    className={count > 0 ? "bg-emerald-50/70 font-semibold" : "hover:bg-zinc-50"}
                  >
                    <td className="py-1.5 px-3 border-r border-zinc-800 font-bold">
                      {prize} *
                    </td>
                    <td className="py-1.5 px-3 border-r border-zinc-800 text-center font-bold">
                      {count > 0 ? count : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono">
                      {count > 0 ? subtotal.toLocaleString() : "0"}
                    </td>
                  </tr>
                );
              })}

              {/* Extra prizes if any */}
              {otherTiers.map((item) => (
                <tr key={item.prize} className="bg-amber-50 font-semibold">
                  <td className="py-1.5 px-3 border-r border-zinc-800 font-bold">
                    {item.prize.toLocaleString()} *
                  </td>
                  <td className="py-1.5 px-3 border-r border-zinc-800 text-center font-bold">
                    {item.count}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Winning Total */}
              <tr className="bg-zinc-900 text-white font-black text-xs">
                <td colSpan={2} className="py-2.5 px-3 border-r border-zinc-700">
                  <span className="text-xs uppercase tracking-wider font-extrabold">
                    {t("slip_winning_total")}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-400 font-extrabold">
                  Rs. {data.totalWinningAmount.toLocaleString()}
                </td>
              </tr>

              {/* Return / Shortage Money */}
              <tr className="bg-rose-50/80 text-zinc-900 font-bold border-t border-zinc-400">
                <td colSpan={2} className="py-2 px-3 border-r border-zinc-800">
                  <span className="text-xs font-bold text-zinc-800">
                    {t("slip_return_shortage")}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  {editableReturn ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-rose-600 font-bold">- Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={data.returnShortageAmount || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (onReturnChange) onReturnChange(val);
                        }}
                        placeholder="0"
                        className="w-20 text-right px-1.5 py-0.5 border border-rose-300 rounded bg-white text-zinc-900 font-mono font-bold text-xs"
                      />
                    </div>
                  ) : (
                    <span className="text-rose-700 font-bold">
                      - Rs. {Number(data.returnShortageAmount || 0).toLocaleString()}
                    </span>
                  )}
                </td>
              </tr>

              {/* Net Payout Amount */}
              <tr className="bg-emerald-600 text-white font-black text-sm border-t-2 border-zinc-900">
                <td colSpan={2} className="py-2.5 px-3 border-r border-emerald-700">
                  <span className="text-sm font-black uppercase tracking-wider">
                    {t("slip_net_payout_amount")}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-base font-extrabold text-amber-200">
                  Rs. {Number(data.netTotalAmount || 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Signatures */}
        <div className="pt-4 border-t border-dashed border-zinc-300 grid grid-cols-2 gap-4 text-[10px] text-center text-zinc-500">
          <div>
            <div className="border-b border-zinc-400 h-6 mb-1"></div>
            <span>{t("slip_seller_sign")}</span>
          </div>
          <div>
            <div className="border-b border-zinc-400 h-6 mb-1"></div>
            <span>{t("slip_officer_sign")}</span>
          </div>
        </div>

        <div className="text-center text-[9px] text-zinc-400 pt-1">
          {t("slip_footer_notice")}
        </div>
      </div>

      {/* Screen-only Bottom Actions */}
      {onClose && (
        <div className="p-3 bg-zinc-100 border-t border-zinc-200 flex justify-end gap-2 print:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300"
          >
            ✕ {t("slip_close_btn")}
          </Button>
          {showPrintButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              🖨️ {t("slip_print_btn")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
