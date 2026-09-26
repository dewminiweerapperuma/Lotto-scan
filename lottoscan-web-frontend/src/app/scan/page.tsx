"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { lottery as lotteryApi, agent as agentApi } from "@/lib/api";
import { LOTTERIES } from "@/lib/constants";
import { scanTicketImage, parseTicketText, ParsedTicketData } from "@/lib/ticketScanner";
import { parseLotteryQR, isValidQRData } from "@/lib/qrParser";
import NumberBall from "@/components/ui/NumberBall";
import ZodiacBall from "@/components/ui/ZodiacBall";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getZodiacInfo } from "@/lib/zodiac";
import LaptopQrScanner from "@/components/scanner/LaptopQrScanner";
import soundEffects from "@/lib/soundEffects";

interface ScannedTicketItem {
  id: string;
  serial: string;
  lotteryName: string;
  cleanLotteryName: string;
  board: "NLB" | "DLB";
  numbers: (number | string)[];
  letter?: string;
  zodiac?: string;
  drawNumber?: string;
  drawDate?: string;
  promotionalNumber?: string;
  isFutureDraw?: boolean;
  isWinner?: boolean;
  isExpired?: boolean;
  canClaimPrize?: boolean;
  expiryDate?: string;
  daysRemaining?: number;
  validityMessage?: string;
  prizeAmount?: number;
  prizeAmountFormatted?: string;
  prizeCategory?: string;
  matchedCount?: number;
  matchedNumbers?: number[];
  matchedLetter?: boolean;
  sourceMethod: string;
  status: "evaluating" | "ready" | "error";
  errorMsg?: string;
  claimed?: boolean;
}

export default function BulkScanPage() {
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "gun" | "manual">("camera");
  const [scannedTickets, setScannedTickets] = useState<ScannedTicketItem[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "winners" | "nlb" | "dlb">("all");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  
  // Continuous Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [scanFlash, setScanFlash] = useState(false);
  const [lastScannedText, setLastScannedText] = useState("");
  const recentScansRef = useRef<Map<string, number>>(new Map());

  // Batch Image Upload State
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Barcode Gun Listener State
  const [gunInputBuffer, setGunInputBuffer] = useState("");
  const gunLastKeyTime = useRef<number>(0);

  // Manual Entry State
  const [manualLottery, setManualLottery] = useState("Govisetha");
  const [manualNums, setManualNums] = useState(["", "", "", "", ""]);
  const [manualLetter, setManualLetter] = useState("");
  const [manualSerial, setManualSerial] = useState("");

  // Record Claims Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpName, setSelectedEmpName] = useState("Counter 01 - Pettah Central");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);

  // Audio Beep Synthesizer (No external audio file required)
  const playBeep = useCallback((isWinner: boolean = false) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (isWinner) {
        // High-pitched winning celebratory chord (C6 -> G6)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        osc1.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.15); // G6

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      } else {
        // Short confirmation tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}
  }, []);

  // Fetch employees on mount for claiming
  useEffect(() => {
    agentApi.getEmployees()
      .then((res) => {
        const emps = res.data?.data || [];
        setEmployees(emps);
        if (emps.length > 0) {
          setSelectedEmpName(`${emps[0].name} (${emps[0].counterName})`);
        }
      })
      .catch(() => {});
  }, []);

  // Validate a single ticket payload with backend
  const evaluateTicket = useCallback(async (ticket: ScannedTicketItem) => {
    try {
      const parsedNums = ticket.numbers.map(Number).filter((n) => !isNaN(n) && n >= 0);
      const res = await lotteryApi.checkTicket(
        parsedNums,
        ticket.drawDate,
        ticket.cleanLotteryName || ticket.lotteryName,
        ticket.letter,
        {
          drawNumber: ticket.drawNumber,
          ticketSerial: ticket.serial,
          promotionalNumber: ticket.promotionalNumber,
          zodiac: ticket.zodiac,
        }
      );
      const data = res.data;

      setScannedTickets((prev) =>
        prev.map((t) => {
          if (t.id !== ticket.id) return t;
          return {
            ...t,
            status: "ready",
            isWinner: data.isWinner,
            board: data.board || t.board,
            cleanLotteryName: data.cleanLotteryName || t.cleanLotteryName,
            prizeAmount: data.prizeAmount,
            prizeAmountFormatted: data.prizeAmountFormatted || (data.prizeAmount ? `Rs. ${data.prizeAmount.toLocaleString()}` : "Rs. 0.00"),
            prizeCategory: data.prizeCategory || (data.isWinner ? "Winner" : (data.isFutureDraw ? "Future Draw (Scheduled)" : "No Match")),
            matchedCount: data.matchedCount,
            matchedNumbers: data.matchedNumbers,
            matchedLetter: data.matchedLetter,
            drawNumber: data.drawNumber || t.drawNumber,
            isFutureDraw: data.isFutureDraw || t.isFutureDraw,
            isExpired: data.isExpired,
            canClaimPrize: data.canClaimPrize,
            expiryDate: data.expiryDate,
            daysRemaining: data.daysRemaining,
            validityMessage: data.validityMessage,
          };
        })
      );

      // Play specific prize sound (e.g. Rs. 40 chime or Jackpot) or warning buzz
      soundEffects.playResultFeedback({
        isWinner: data.isWinner,
        prizeAmount: Number(data.prizeAmount) || 0,
        isExpired: data.isExpired,
        isFutureDraw: data.isFutureDraw,
      });
    } catch (err: any) {
      soundEffects.playWarningSound();
      setScannedTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "error", errorMsg: "Evaluation failed" } : t))
      );
    }
  }, []);

  // Add a newly parsed ticket into the batch list with duplicate prevention
  const addParsedTicketToBatch = useCallback((parsed: ParsedTicketData, rawSerial?: string) => {
    if (!parsed) return;

    // Minimum validation for damaged/partial string
    if (parsed.numbers.length === 0 && !parsed.letter && !parsed.zodiac) {
      setDuplicateWarning("Damaged or incomplete QR ticket data: Missing numbers or lagna.");
      setTimeout(() => setDuplicateWarning(null), 4000);
      return;
    }

    const serial = (parsed.serialNumber || rawSerial || (parsed.rawText && parsed.rawText.length < 30 ? parsed.rawText : `TCK-${Date.now().toString().slice(-6)}`)).trim();

    // Duplicate Prevention: Check against current session batch table
    if (serial && scannedTickets.some((t) => t.serial && t.serial.trim() === serial)) {
      setDuplicateWarning(`Duplicate Prevention: Ticket with serial #${serial} is already in the batch.`);
      soundEffects.playWarningSound();
      soundEffects.speak("Warning. Duplicate ticket.");
      setTimeout(() => setDuplicateWarning(null), 5000);
      return;
    }

    const lotName = parsed.lotteryName || "Govisetha";
    const board = parsed.board || (lotName.toLowerCase().includes("nlb") || ["govisetha", "mahajana sampatha", "mega power", "dhana nidhanaya", "handahana", "nlb jaya", "ada sampatha", "suba dawasak"].some(n => lotName.toLowerCase().includes(n)) ? "NLB" : "DLB");

    const newTicket: ScannedTicketItem = {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      serial,
      lotteryName: lotName,
      cleanLotteryName: lotName.replace(/^(NLB|DLB)\s+/i, ""),
      board,
      numbers: parsed.numbers,
      letter: parsed.letter,
      zodiac: parsed.zodiac,
      drawNumber: parsed.drawNumber,
      drawDate: parsed.drawDate,
      promotionalNumber: parsed.promotionalNumber,
      isFutureDraw: parsed.isFutureDraw,
      sourceMethod: parsed.sourceMethod,
      status: parsed.isFutureDraw ? "ready" : "evaluating",
      isWinner: false,
      prizeAmount: 0,
      prizeAmountFormatted: "Rs. 0.00",
      prizeCategory: parsed.isFutureDraw ? "Future Draw (Scheduled)" : undefined,
    };

    setScannedTickets((prev) => [newTicket, ...prev]);

    if (!parsed.isFutureDraw) {
      evaluateTicket(newTicket);
    }
  }, [scannedTickets, evaluateTicket, playBeep]);

  // ─── Continuous Camera Scanner QR Success Handler ───
  const handleQrScanSuccess = useCallback((decodedText: string) => {
    const raw = decodedText.trim();
    if (!raw) return;

    setLastScannedText(raw);
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 300);

    // 1. Specialized 2D QR Code Tokenizer & Normalization
    const qrData = parseLotteryQR(raw);
    if (qrData.isValid) {
      let letterVal = qrData.letter;
      if (qrData.zodiacSigns && qrData.zodiacSigns.length >= 2) {
        letterVal = `${qrData.zodiacSigns[0].nameEn || qrData.zodiacSigns[0].transliteration}, ${qrData.zodiacSigns[1].nameEn || qrData.zodiacSigns[1].transliteration}`;
      } else if (!letterVal && qrData.zodiac) {
        letterVal = qrData.zodiac.nameEn || qrData.zodiac.transliteration;
      }

      addParsedTicketToBatch({
        numbers: qrData.primaryNumbers,
        letter: letterVal,
        zodiac: qrData.zodiac ? (qrData.zodiac.nameEn || qrData.zodiac.transliteration) : undefined,
        zodiac2: qrData.zodiac2 ? (qrData.zodiac2.nameEn || qrData.zodiac2.transliteration) : undefined,
        zodiacSigns: qrData.zodiacSigns ? qrData.zodiacSigns.map((z) => z.nameEn || z.transliteration) : undefined,
        lotteryName: qrData.lotteryName,
        drawNumber: qrData.drawNumber,
        drawDate: qrData.drawDate,
        serialNumber: qrData.serialNumber,
        promotionalNumber: qrData.promotionalNumber,
        isFutureDraw: qrData.isFutureDraw,
        board: qrData.board,
        sourceMethod: "barcode_detector",
        rawText: raw,
      }, qrData.serialNumber);
      return;
    }

    // 2. Fallback to parseTicketText
    const parsed = parseTicketText(raw);
    if (parsed.numbers.length > 0 || parsed.letter) {
      parsed.sourceMethod = "barcode_detector";
      addParsedTicketToBatch(parsed, raw.slice(0, 20));
      return;
    }

    // 3. Partial or damaged string warning
    setDuplicateWarning("Damaged or incomplete QR code detected. Minimum lottery name, draw number, or numbers required.");
    setTimeout(() => setDuplicateWarning(null), 4000);
  }, [addParsedTicketToBatch]);

  // ─── Hardware Laser Barcode Gun Keyboard Listener ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing inside an input or textarea, let normal typing occur
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      const now = Date.now();
      // Hardware barcode scanners send keys in rapid bursts (< 45ms per keystroke)
      if (e.key === "Enter") {
        if (gunInputBuffer.length >= 3) {
          const raw = gunInputBuffer.trim();
          setGunInputBuffer("");
          const parsed = parseTicketText(raw);
          if (parsed.numbers.length > 0 || parsed.letter) {
            parsed.sourceMethod = "barcode_detector";
            addParsedTicketToBatch(parsed, raw);
          }
        }
      } else if (e.key.length === 1) {
        if (now - gunLastKeyTime.current > 200) {
          // Reset buffer if delay between keystrokes is too large
          setGunInputBuffer(e.key);
        } else {
          setGunInputBuffer((prev) => prev + e.key);
        }
        gunLastKeyTime.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gunInputBuffer, addParsedTicketToBatch]);

  // ─── Multi-Image Batch File Upload (Up to 50 Images) ───
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingBatch(true);
    setUploadProgress({ current: 0, total: files.length, status: "Starting multi-image OCR & barcode batch scan..." });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        current: i + 1,
        total: files.length,
        status: `Processing ticket photo ${i + 1} of ${files.length} (${file.name})...`
      });

      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = dataUrl;
        });

        const parsed = await scanTicketImage(img);
        if (parsed && (parsed.numbers.length > 0 || parsed.letter)) {
          addParsedTicketToBatch(parsed, file.name.replace(/\.[^/.]+$/, ""));
        }
      } catch (err) {
        console.warn(`Error scanning file ${file.name}:`, err);
      }
    }

    setIsUploadingBatch(false);
    setUploadProgress({ current: files.length, total: files.length, status: "Batch processing complete!" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Manual Ticket Addition ───
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = manualNums.map(Number).filter((n) => !isNaN(n) && n >= 0);
    if (nums.length === 0) return;

    const parsed: ParsedTicketData = {
      numbers: nums,
      letter: manualLetter.toUpperCase(),
      lotteryName: manualLottery,
      sourceMethod: "manual"
    };

    addParsedTicketToBatch(parsed, manualSerial || `MAN-${Date.now().toString().slice(-4)}`);
    setManualNums(["", "", "", "", ""]);
    setManualLetter("");
    setManualSerial("");
  };

  // ─── Bulk Submit Claims to Daily Winning Report ───
  const handleBulkSubmitClaims = async () => {
    // Only claim tickets within 6-month regulatory validity window
    const winners = scannedTickets.filter((t) => t.isWinner && !t.claimed && !t.isExpired);
    if (winners.length === 0) return;

    setClaimSubmitting(true);
    setClaimSuccessMsg("");
    let successCount = 0;

    for (const t of winners) {
      try {
        await agentApi.recordClaim({
          lotteryName: t.cleanLotteryName || t.lotteryName,
          board: t.board || "NLB",
          drawNumber: t.drawNumber || "N/A",
          drawDate: t.drawDate || new Date().toISOString().slice(0, 10),
          ticketSerial: t.serial,
          matchedTier: t.prizeCategory || "Winning Match",
          prizeAmount: t.prizeAmount || 0,
          employeeName: selectedEmpName,
          employeeId: "emp-scan",
          payoutStatus: "paid"
        });
        successCount++;
        setScannedTickets((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, claimed: true } : item))
        );
      } catch (err) {
        console.warn(`Claim record failed for ${t.serial}:`, err);
      }
    }

    setClaimSubmitting(false);
    setClaimSuccessMsg(`Successfully recorded ${successCount} winning ticket payouts to the Daily Summary Report!`);
    setTimeout(() => {
      setIsClaimModalOpen(false);
      setClaimSuccessMsg("");
    }, 2500);
  };

  // ─── Batch Calculations & Filtering (Grouped by Board NLB vs DLB) ───
  const summary = useMemo(() => {
    const total = scannedTickets.length;
    const allWinners = scannedTickets.filter((t) => t.isWinner);
    // 6-month validity: Only tickets within 6 calendar months can be cashed
    const validWinners = scannedTickets.filter((t) => t.isWinner && !t.isExpired);
    const expiredTickets = scannedTickets.filter((t) => t.isExpired);
    const totalPrize = validWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    // NLB Board Totals
    const nlbTickets = scannedTickets.filter((t) => t.board === "NLB");
    const nlbWinners = nlbTickets.filter((t) => t.isWinner && !t.isExpired);
    const nlbPrize = nlbWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    // DLB Board Totals
    const dlbTickets = scannedTickets.filter((t) => t.board === "DLB");
    const dlbWinners = dlbTickets.filter((t) => t.isWinner && !t.isExpired);
    const dlbPrize = dlbWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    return {
      total,
      winnersCount: validWinners.length,
      allWinnersCount: allWinners.length,
      expiredCount: expiredTickets.length,
      totalPrize,
      nlbCount: nlbTickets.length,
      dlbCount: dlbTickets.length,
      winRate: total > 0 ? ((validWinners.length / total) * 100).toFixed(1) : "0",
      nlb: {
        total: nlbTickets.length,
        winners: nlbWinners.length,
        prize: nlbPrize,
      },
      dlb: {
        total: dlbTickets.length,
        winners: dlbWinners.length,
        prize: dlbPrize,
      },
    };
  }, [scannedTickets]);

  const filteredList = useMemo(() => {
    if (filterTab === "winners") return scannedTickets.filter((t) => t.isWinner);
    if (filterTab === "nlb") return scannedTickets.filter((t) => t.board === "NLB");
    if (filterTab === "dlb") return scannedTickets.filter((t) => t.board === "DLB");
    return scannedTickets;
  }, [scannedTickets, filterTab]);

  const removeTicket = (id: string) => {
    setScannedTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllTickets = () => {
    if (confirm("Are you sure you want to clear all scanned tickets in this batch?")) {
      setScannedTickets([]);
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16 print:pt-2 print:pb-2 print:bg-white text-text-primary">
      {/* ─── Printable Header (Shown Only on Print) ─── */}
      <div className="hidden print:block mb-4 border-b-2 border-black pb-3 text-center">
        <h1 className="text-xl font-black uppercase tracking-wider">LottoScan — Bulk Scanned Lottery Batch Sheet</h1>
        <h2 className="text-sm font-extrabold mt-0.5">COUNTER DISPATCH & WINNING TICKETS AUDIT RECONCILIATION</h2>
        <div className="flex justify-between text-xs mt-2 px-2 font-mono font-bold">
          <span>Batch Date: {new Date().toISOString().slice(0, 10)}</span>
          <span>Total Scanned: {summary.total}</span>
          <span>Total Prize Amount: Rs. {summary.totalPrize.toLocaleString()}</span>
        </div>
      </div>

      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Top Header Bar ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="text-text-secondary hover:text-text-primary transition-colors font-body text-xs font-bold border border-border-default px-2.5 py-1 rounded-lg bg-white shadow-sm"
              >
                ← Single Checker
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary flex items-center gap-2">
                <span>⚡</span> Bulk Ticket Scanner
              </h1>
            </div>
            <p className="text-text-secondary font-body text-xs font-semibold mt-1">
              Rapid continuous multi-ticket camera scanner, barcode gun listener, and batch image validator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                soundEffects.setSoundEnabled(next);
                soundEffects.setVoiceEnabled(next);
              }}
              title="Toggle audio chimes and voice announcement for prizes and warnings"
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                soundOn
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                  : "bg-slate-100 text-slate-500 border-slate-300"
              }`}
            >
              <span>{soundOn ? "🔊" : "🔇"}</span>
              <span>{soundOn ? "Sound & Voice ON" : "Sound Muted"}</span>
            </button>

            {scannedTickets.some((t) => t.isWinner && !t.claimed && !t.isExpired) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsClaimModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 px-4"
              >
                📥 Record {scannedTickets.filter((t) => t.isWinner && !t.claimed && !t.isExpired).length} Winning Claims
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={scannedTickets.length === 0}
              className="border-border-default bg-white text-text-primary font-bold text-xs shadow-sm hover:border-gold"
            >
              🖨️ Export / Print Batch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllTickets}
              disabled={scannedTickets.length === 0}
              className="text-red-600 hover:bg-red-50 text-xs font-bold"
            >
              🗑️ Clear Batch
            </Button>
          </div>
        </div>

        {/* ─── KPI Live Summary Bar ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Scanned
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {summary.total} <span className="text-xs font-body font-semibold text-text-muted">Tickets</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xl shrink-0">
              🎟️
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Winning Tickets
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-win mt-1">
                {summary.winnersCount} <span className="text-xs font-body font-semibold text-text-muted">({summary.winRate}%)</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-win-light border border-green-200 flex items-center justify-center text-xl shrink-0">
              🏆
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Total Cash Payout
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-gold-dark mt-1">
                Rs. {summary.totalPrize.toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                Board Breakdown
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                  NLB: {summary.nlbCount}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  DLB: {summary.dlbCount}
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full bg-brand-section border border-border-default flex items-center justify-center text-xl shrink-0">
              📊
            </div>
          </Card>
        </div>

        {summary.expiredCount > 0 && (
          <div className="mb-6 bg-rose-50 border border-rose-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-rose-900 shadow-sm animate-slide-up">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⏳</span>
              <div>
                <span className="font-extrabold text-rose-950">
                  {summary.expiredCount} Ticket{summary.expiredCount > 1 ? "s" : ""} Over 6-Month Expiry Limit:
                </span>{" "}
                <span className="text-rose-800">
                  Under official NLB &amp; DLB regulations, winning tickets must be claimed within 6 months (180 days) of the draw date. Expired tickets are forfeited by law and cannot be redeemed for cash.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-rose-200 text-rose-900 rounded-lg font-mono font-bold text-[11px] shrink-0 ml-3">
              {summary.expiredCount} Expired
            </span>
          </div>
        )}

        {/* ─── Duplicate & Validation Alert ─── */}
        {duplicateWarning && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 font-bold text-sm flex items-center justify-between shadow-sm animate-shake">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{duplicateWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="text-amber-700 hover:text-amber-950 font-black text-sm px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── Board Breakdown (NLB vs DLB Running Totals) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* NLB Breakdown Card */}
          <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-amber-950">
                  National Lotteries Board (NLB)
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                NLB Board
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-100">
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Scanned</p>
                <p className="text-xl font-display font-black text-text-primary mt-0.5">{summary.nlb.total}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Winners</p>
                <p className="text-xl font-display font-black text-win mt-0.5">{summary.nlb.winners}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Prize Total</p>
                <p className="text-xl font-display font-black text-amber-700 mt-0.5">Rs. {summary.nlb.prize.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* DLB Breakdown Card */}
          <div className="bg-white border-2 border-blue-300/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-display font-extrabold text-xs uppercase tracking-wider text-blue-950">
                  Development Lotteries Board (DLB)
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                DLB Board
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-blue-100">
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Scanned</p>
                <p className="text-xl font-display font-black text-text-primary mt-0.5">{summary.dlb.total}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Winners</p>
                <p className="text-xl font-display font-black text-win mt-0.5">{summary.dlb.winners}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase font-bold">Prize Total</p>
                <p className="text-xl font-display font-black text-blue-700 mt-0.5">Rs. {summary.dlb.prize.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Scanner Controls & Viewfinder Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 mb-8 print:hidden">
          {/* Left: Mode Selector & Input Hub */}
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="bg-white border border-border-default p-1.5 rounded-2xl flex gap-1 shadow-sm">
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "camera"
                    ? "bg-gold text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>📷</span> Continuous Camera
              </button>
              <button
                type="button"
                onClick={() => setScanMode("upload")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "upload"
                    ? "bg-gold text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>📁</span> Batch Upload
              </button>
              <button
                type="button"
                onClick={() => setScanMode("gun")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "gun"
                    ? "bg-gold text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>🔫</span> Barcode Gun
              </button>
              <button
                type="button"
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "manual"
                    ? "bg-gold text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>⌨️</span> Manual
              </button>
            </div>

            {/* Mode 1: Continuous Camera Viewfinder (LaptopQrScanner) */}
            {scanMode === "camera" && (
              <div className="relative">
                <LaptopQrScanner onScanSuccess={handleQrScanSuccess} />
                {scanFlash && (
                  <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-sm z-30 animate-ping flex items-center justify-center rounded-2xl pointer-events-none">
                    <span className="text-3xl font-black text-white drop-shadow">✓ SCANNED!</span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Batch Image Upload (Drag & Drop) */}
            {scanMode === "upload" && (
              <Card className="bg-white border-2 border-dashed border-gold-border p-8 text-center rounded-2xl shadow-sm space-y-4">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleBatchImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {isUploadingBatch ? (
                  <div className="space-y-4 py-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <h3 className="font-display font-extrabold text-base text-text-primary">
                        Processing Batch Photos...
                      </h3>
                      <p className="text-xs text-text-secondary font-body mt-1">
                        {uploadProgress.status}
                      </p>
                    </div>
                    <div className="w-full bg-brand-section rounded-full h-2.5 overflow-hidden max-w-xs mx-auto">
                      <div
                        className="bg-gold h-full rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-3xl mx-auto">
                      📁
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-text-primary">
                        Upload Multiple Ticket Photos
                      </h3>
                      <p className="text-xs text-text-secondary font-body mt-1 max-w-xs mx-auto">
                        Select 10, 20, or up to 50 ticket images at once. LottoScan will OCR and decode every ticket in parallel.
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gold text-white font-bold text-xs px-6 shadow-sm"
                    >
                      Browse Multiple Files...
                    </Button>
                  </>
                )}
              </Card>
            )}

            {/* Mode 3: Hardware Barcode Gun Mode */}
            {scanMode === "gun" && (
              <Card className="bg-white border border-border-default p-6 rounded-2xl shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl mx-auto">
                  🔫
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-text-primary">
                    USB / Bluetooth Laser Scanner Gun Active
                  </h3>
                  <p className="text-xs text-text-secondary font-body mt-1 max-w-sm mx-auto">
                    Point your handheld barcode scanner gun at the ticket barcode and pull the trigger. Each scan will be decoded and added to the batch list automatically.
                  </p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-300 p-3 rounded-xl text-xs font-mono font-bold text-emerald-900 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Listening for hardware scanner inputs...
                </div>
              </Card>
            )}

            {/* Mode 4: Manual Batch Row Entry */}
            {scanMode === "manual" && (
              <Card className="bg-white border border-border-default p-5 rounded-2xl shadow-sm">
                <h3 className="font-display font-extrabold text-sm text-text-primary mb-1">
                  Manual Rapid Ticket Entry
                </h3>
                <p className="text-[11px] text-text-secondary font-body mb-4">
                  Quickly add tickets with damaged or unreadable barcodes manually to the batch.
                </p>

                <form onSubmit={handleAddManual} className="space-y-3 text-xs font-body">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-text-secondary mb-1">Lottery Game</label>
                      <select
                        value={manualLottery}
                        onChange={(e) => setManualLottery(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-bold text-xs"
                      >
                        {LOTTERIES.map((l) => (
                          <option key={l.id} value={l.name}>
                            {l.name} ({l.board})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-text-secondary mb-1">
                        {manualLottery.toLowerCase().includes("suba") ? "Zodiac Signs (1 or 2)" : "Lagna / Letter"}
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder={manualLottery.toLowerCase().includes("suba") ? "e.g. Capricorn, Aquarius" : "e.g. M / P"}
                        value={manualLetter}
                        onChange={(e) => setManualLetter(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-bold text-center text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Ticket Numbers</label>
                    <div className="flex gap-2">
                      {manualNums.map((val, i) => (
                        <input
                          key={i}
                          type="number"
                          min="0"
                          max="99"
                          placeholder="0"
                          value={val}
                          onChange={(e) => {
                            const next = [...manualNums];
                            next[i] = e.target.value;
                            setManualNums(next);
                          }}
                          className="w-full text-center border border-border-default rounded-lg py-1.5 bg-brand-section text-text-primary font-mono font-bold text-sm"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text-secondary mb-1">Ticket Serial (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. TCK-849201"
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-mono text-xs"
                    />
                  </div>

                  <Button type="submit" fullWidth size="sm" className="bg-gold text-white font-bold text-xs mt-2">
                    ➕ Add Ticket to Batch
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Right: Live Queue & Latest Scan Status Card */}
          <div className="space-y-4">
            <Card className="bg-white border border-border-default p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-display font-extrabold text-sm text-text-primary">
                    Live Batch Queue ({scannedTickets.length})
                  </h3>
                </div>
                <div className="flex gap-1">
                  {(["all", "winners", "nlb", "dlb"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        filterTab === tab
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "text-text-secondary hover:bg-brand-section"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scanned Items Mini Stream */}
              {scannedTickets.length === 0 ? (
                <div className="py-16 text-center text-text-muted text-xs font-body">
                  <div className="text-3xl mb-2 select-none">🎟️</div>
                  <p className="font-bold text-text-secondary">No tickets scanned yet.</p>
                  <p className="text-[11px] mt-0.5">Use the continuous camera or batch upload to start scanning tickets.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs font-body">
                  {filteredList.map((ticket, idx) => (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        ticket.isExpired
                          ? "bg-rose-50/80 border-rose-300 shadow-sm"
                          : ticket.isWinner
                          ? "bg-emerald-50/80 border-emerald-300 shadow-sm"
                          : "bg-brand-card hover:bg-brand-card-hover border-border-default"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          ticket.isExpired ? "bg-rose-600 text-white" : ticket.isWinner ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-text-primary text-xs truncate">
                              {ticket.cleanLotteryName || ticket.lotteryName}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                              ticket.board === "NLB"
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}>
                              {ticket.board}
                            </span>
                            {ticket.isExpired ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold border border-rose-300">
                                ⏳ Expired (&gt;6m)
                              </span>
                            ) : ticket.claimed ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold border border-purple-300">
                                Claimed ✓
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] font-mono text-text-secondary truncate mt-0.5">
                            {ticket.serial} • Numbers: {ticket.numbers.join(", ")} {ticket.letter ? `• [${ticket.letter}]` : ""}
                            {ticket.drawDate ? ` • ${ticket.drawDate}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ticket.status === "evaluating" ? (
                          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        ) : ticket.isExpired ? (
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-400 line-through text-xs block">
                              {ticket.prizeAmountFormatted || `Rs. ${ticket.prizeAmount}`}
                            </span>
                            <span className="text-[9px] font-bold text-rose-600 truncate block max-w-[110px]">
                              Claim Lapsed
                            </span>
                          </div>
                        ) : ticket.isWinner ? (
                          <div className="text-right">
                            <span className="font-mono font-black text-emerald-800 text-xs block">
                              {ticket.prizeAmountFormatted || `Rs. ${ticket.prizeAmount}`}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 truncate block max-w-[110px]">
                              {ticket.prizeCategory}
                            </span>
                          </div>
                        ) : ticket.isFutureDraw ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                            ⏳ Future Draw
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            No Match
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeTicket(ticket.id)}
                          title="Remove from batch"
                          className="text-text-muted hover:text-red-600 p-1 rounded transition-colors text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ─── Full Scanned Batch Table (Screen & Print) ─── */}
        <Card className="bg-white border border-border-default shadow-sm overflow-hidden mb-8">
          <div className="p-4 bg-brand-section/50 border-b border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-display font-extrabold text-text-primary">
                Itemized Scanned Ticket Audit Table ({scannedTickets.length} Items)
              </h2>
              <p className="text-xs text-text-secondary font-body">
                Detailed winning tier evaluations and board-wise payout classification for this batch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-border-default rounded-md text-text-secondary">
                {summary.winnersCount} Valid Winning / {summary.total} Scanned
              </span>
            </div>
          </div>

          {scannedTickets.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-xs font-body">
              No tickets in the batch list yet. Start scanning above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-body">
                <thead>
                  <tr className="bg-brand-section text-text-secondary font-bold text-[11px] uppercase tracking-wider border-b border-border-default">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Ticket Serial</th>
                    <th className="py-3 px-4">Board</th>
                    <th className="py-3 px-4">Lottery Game</th>
                    <th className="py-3 px-4">Ticket Numbers</th>
                    <th className="py-3 px-4">Lagna</th>
                    <th className="py-3 px-4">Result Status</th>
                    <th className="py-3 px-4">Prize Tier Detail</th>
                    <th className="py-3 px-4 text-right">Prize Amount</th>
                    <th className="py-3 px-4 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50">
                  {filteredList.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={`hover:bg-brand-card-hover transition-colors ${
                        t.isExpired
                          ? "bg-rose-50/50"
                          : t.isWinner
                          ? "bg-emerald-50/40"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-text-muted">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-text-primary">{t.serial}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          t.board === "NLB"
                            ? "bg-blue-100 text-blue-900 border border-blue-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}>
                          {t.board}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-text-primary">
                        {t.cleanLotteryName || t.lotteryName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-secondary">
                        {t.numbers.join(", ")}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {t.letter ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px]">
                            {t.letter}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {t.isExpired ? (
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              ⏳ EXPIRED (&gt;6m)
                            </span>
                            <span className="text-[10px] text-rose-600 font-semibold">
                              Draw: {t.drawDate || "Over 6m ago"}
                            </span>
                          </div>
                        ) : t.isWinner ? (
                          <div className="flex flex-col gap-0.5 items-start">
                            <Badge variant="green">🏆 WINNER</Badge>
                            {t.daysRemaining !== undefined && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                {t.daysRemaining} days left
                              </span>
                            )}
                          </div>
                        ) : t.isFutureDraw ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                            ⏳ Future Draw
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            No Match
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-[11px]">
                        {t.isExpired ? (
                          <span className="text-rose-700 font-medium">
                            {t.prizeCategory || "Match"} (Forfeited)
                          </span>
                        ) : (
                          t.prizeCategory || "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                        {t.isExpired ? (
                          <div>
                            <span className="text-slate-400 line-through text-xs block">
                              {t.prizeAmountFormatted || `Rs. ${t.prizeAmount}`}
                            </span>
                            <span className="text-[10px] text-rose-600 font-bold block">
                              Rs. 0.00 (Expired)
                            </span>
                          </div>
                        ) : t.isWinner ? (
                          <span className="text-emerald-700 font-black">
                            {t.prizeAmountFormatted || `Rs. ${t.prizeAmount}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => removeTicket(t.id)}
                          className="text-text-muted hover:text-red-600 text-xs transition-colors p-1"
                          title="Remove ticket"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 font-bold text-text-primary border-t-2 border-amber-300">
                    <td colSpan={8} className="py-3.5 px-4 uppercase text-xs text-amber-950 font-black">
                      Batch Total ({summary.total} Tickets Scanned • {summary.winnersCount} Valid Winning Claims):
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-base font-black text-emerald-700">
                      Rs. {summary.totalPrize.toLocaleString()}
                    </td>
                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Record Claims Modal (Sends batch winners directly to Daily Winning Report) ─── */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-lg w-full p-6 border border-border-default shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-lg"
            >
              ✕
            </button>
            <h3 className="text-lg font-display font-extrabold text-text-primary mb-1">
              Record Winning Claims to Daily Report
            </h3>
            <p className="text-xs text-text-secondary font-body mb-4">
              Submit {scannedTickets.filter((t) => t.isWinner && !t.claimed && !t.isExpired).length} valid winning tickets directly to your Agency Daily Winning Report (`/admin/reports`).
            </p>

            <div className="space-y-4 text-xs font-body">
              {scannedTickets.some((t) => t.isWinner && t.isExpired) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <span>⏳</span>
                  <span>
                    <strong>{scannedTickets.filter((t) => t.isWinner && t.isExpired).length} ticket(s) excluded:</strong> Ticket draw dates exceed 6 months (180 days). Payouts for expired tickets are prohibited by NLB &amp; DLB regulations.
                  </span>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>Valid Winning Tickets to Disburse:</span>
                  <span className="font-mono">{scannedTickets.filter((t) => t.isWinner && !t.claimed && !t.isExpired).length} Tickets</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>Total Winning Cash Disbursed:</span>
                  <span className="font-mono text-sm text-emerald-700 font-extrabold">
                    Rs. {scannedTickets.filter((t) => t.isWinner && !t.claimed && !t.isExpired).reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  Assign to Counter Staff / Seller
                </label>
                <select
                  value={selectedEmpName}
                  onChange={(e) => setSelectedEmpName(e.target.value)}
                  className="w-full border border-border-default rounded-lg px-3 py-2 bg-brand-section text-text-primary font-bold text-xs"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={`${emp.name} (${emp.counterName})`}>
                      {emp.name} — {emp.counterName}
                    </option>
                  ))}
                  {employees.length === 0 && (
                    <option value="Main Counter Staff">Main Counter Staff</option>
                  )}
                </select>
              </div>

              {claimSuccessMsg && (
                <div className="p-3 bg-win-light text-win border border-green-200 rounded-xl font-bold text-xs">
                  ✅ {claimSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsClaimModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={claimSubmitting}
                  onClick={handleBulkSubmitClaims}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm & Record Claims
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
