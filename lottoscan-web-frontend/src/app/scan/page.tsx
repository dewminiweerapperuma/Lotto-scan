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
import SessionSlipView, { SessionSlipData, TierItem } from "@/components/scanner/SessionSlipView";
import EmployeeProfileView from "@/components/employee/EmployeeProfileView";
import { useLanguage } from "@/context/LanguageContext";
import { getLotteryName } from "@/lib/i18n";

interface ScannedTicketItem {
  id: string;
  serial: string;
  rawText?: string;
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
  const { t, language } = useLanguage();
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "gun" | "manual">("camera");
  const [scannedTickets, setScannedTickets] = useState<ScannedTicketItem[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "winners" | "nlb" | "dlb">("all");
  const [rightPanelTab, setRightPanelTab] = useState<"queue" | "slip">("slip");
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  // Single-ticket-at-a-time lock and live scan status
  const [isProcessingTicket, setIsProcessingTicket] = useState(false);
  const [scanStatus, setScanStatus] = useState<"success" | "already_scanned" | "evaluating" | null>(null);
  const [scanStatusMsg, setScanStatusMsg] = useState<string>("");

  // ─── Session-Wise Scanning State ───
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<{
    id?: string;
    name: string;
    counterName?: string;
    commissionRate?: number;
  } | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [returnShortageAmount, setReturnShortageAmount] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);

  // Modals
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTargetEmployeeId, setProfileTargetEmployeeId] = useState<string | null>(null);
  const [isSessionCompleteModalOpen, setIsSessionCompleteModalOpen] = useState(false);
  const [completedSlipData, setCompletedSlipData] = useState<SessionSlipData | null>(null);
  const [saveSessionSubmitting, setSaveSessionSubmitting] = useState(false);

  // Start Session Modal Form
  const [startSessionSelectedEmpId, setStartSessionSelectedEmpId] = useState("");
  const [isNewEmployeeMode, setIsNewEmployeeMode] = useState(false);
  const [customEmpName, setCustomEmpName] = useState("");
  const [customCounterName, setCustomCounterName] = useState("Counter 01 - Pettah");
  const [startSessionReturn, setStartSessionReturn] = useState("0");
  const [sessionFormError, setSessionFormError] = useState("");

  // Continuous Camera State
  const [scanFlash, setScanFlash] = useState(false);
  const [lastScannedText, setLastScannedText] = useState("");

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

  // Audio Beep Synthesizer
  const playBeep = useCallback((isWinner: boolean = false) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (isWinner) {
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

  // Fetch employees list on mount
  useEffect(() => {
    agentApi
      .getEmployees()
      .then((res) => {
        const emps = res.data?.data || [];
        setEmployees(emps);
        if (emps.length > 0 && !startSessionSelectedEmpId) {
          setStartSessionSelectedEmpId(emps[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Restore active session from sessionStorage or prompt start
  useEffect(() => {
    const savedActive = sessionStorage.getItem("lottoscan_session_active");
    const savedEmpName = sessionStorage.getItem("lottoscan_active_emp_name");
    const savedCounter = sessionStorage.getItem("lottoscan_active_counter_name");
    const savedEmpId = sessionStorage.getItem("lottoscan_active_emp_id");
    const savedStarted = sessionStorage.getItem("lottoscan_active_started_at");
    const savedReturn = sessionStorage.getItem("lottoscan_active_return");

    if (savedActive === "true" && savedEmpName) {
      setIsSessionActive(true);
      setActiveEmployee({
        id: savedEmpId || undefined,
        name: savedEmpName,
        counterName: savedCounter || "Main Counter",
      });
      setSessionStartedAt(savedStarted || new Date().toISOString());
      if (savedReturn) setReturnShortageAmount(parseFloat(savedReturn) || 0);
    } else {
      // First step: prompt employee entry to start scanning session!
      setIsStartSessionModalOpen(true);
    }
  }, []);

  // Live session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionStartedAt) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
        setSessionSeconds(Math.max(0, diff));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartedAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${(mins % 60)
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ─── Start Session Handler ───
  const handleStartSession = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSessionFormError("");

    let empName = "";
    let empCounter = "";
    let empId: string | undefined = undefined;

    if (isNewEmployeeMode) {
      if (!customEmpName.trim()) {
        setSessionFormError("Please enter the employee's name.");
        return;
      }
      empName = customEmpName.trim();
      empCounter = customCounterName.trim() || "Main Counter";
    } else {
      const selected = employees.find((emp) => emp.id === startSessionSelectedEmpId);
      if (selected) {
        empId = selected.id;
        empName = selected.name;
        empCounter = selected.counterName;
      } else if (employees.length > 0) {
        empId = employees[0].id;
        empName = employees[0].name;
        empCounter = employees[0].counterName;
      } else {
        if (!customEmpName.trim()) {
          setSessionFormError("Please enter the employee's name.");
          return;
        }
        empName = customEmpName.trim();
        empCounter = customCounterName.trim() || "Main Counter";
      }
    }

    const initReturn = parseFloat(startSessionReturn) || 0;
    const now = new Date().toISOString();

    setIsSessionActive(true);
    setActiveEmployee({
      id: empId,
      name: empName,
      counterName: empCounter,
    });
    setSessionStartedAt(now);
    setSessionSeconds(0);
    setReturnShortageAmount(initReturn);
    setIsStartSessionModalOpen(false);

    sessionStorage.setItem("lottoscan_session_active", "true");
    sessionStorage.setItem("lottoscan_active_emp_name", empName);
    sessionStorage.setItem("lottoscan_active_counter_name", empCounter);
    if (empId) sessionStorage.setItem("lottoscan_active_emp_id", empId);
    sessionStorage.setItem("lottoscan_active_started_at", now);
    sessionStorage.setItem("lottoscan_active_return", String(initReturn));

    // Clear previous batch for new session
    setScannedTickets([]);
  };

  // ─── Live Prize Multiplier Breakdown (Matching physical voucher slip) ───
  const liveTierBreakdown = useMemo(() => {
    const standardPrizes = [40, 80, 120, 160, 200, 240, 400, 500, 1000, 2000, 4000];
    const map = new Map<number, number>();
    standardPrizes.forEach((p) => map.set(p, 0));

    const extraMap = new Map<number, number>();
    let winningTotal = 0;
    let winningTicketsCount = 0;

    scannedTickets.forEach((t) => {
      const prize = Number(t.prizeAmount) || 0;
      if (t.isWinner && !t.isExpired && prize > 0) {
        winningTotal += prize;
        winningTicketsCount += 1;
        if (map.has(prize)) {
          map.set(prize, (map.get(prize) || 0) + 1);
        } else {
          extraMap.set(prize, (extraMap.get(prize) || 0) + 1);
        }
      }
    });

    const standardTiers: TierItem[] = standardPrizes.map((prize) => ({
      prize,
      count: map.get(prize) || 0,
      subtotal: (map.get(prize) || 0) * prize,
    }));

    const extraTiers: TierItem[] = Array.from(extraMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([prize, count]) => ({
        prize,
        count,
        subtotal: count * prize,
      }));

    const netTotal = Math.max(0, winningTotal - (Number(returnShortageAmount) || 0));

    return {
      tiers: standardTiers,
      extras: extraTiers,
      allTiers: [...standardTiers, ...extraTiers],
      winningTotal,
      winningTicketsCount,
      netTotal,
    };
  }, [scannedTickets, returnShortageAmount]);

  // Evaluate single ticket payload with backend
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
            prizeAmountFormatted:
              data.prizeAmountFormatted ||
              (data.prizeAmount ? `Rs. ${data.prizeAmount.toLocaleString()}` : "Rs. 0.00"),
            prizeCategory:
              data.prizeCategory ||
              (data.isWinner
                ? "Winner"
                : data.isFutureDraw
                ? "Future Draw (Scheduled)"
                : "No Match"),
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

      soundEffects.playResultFeedback({
        isWinner: data.isWinner,
        prizeAmount: Number(data.prizeAmount) || 0,
        isExpired: data.isExpired,
        isFutureDraw: data.isFutureDraw,
      });

      setScanStatus("success");
      setScanStatusMsg(data.isWinner ? `Winner: Rs. ${data.prizeAmount}` : "Evaluated");

      // Release single-ticket processing lock after 1.2s
      setTimeout(() => {
        setIsProcessingTicket(false);
        setScanStatus(null);
      }, 1200);
    } catch (err: any) {
      soundEffects.playWarningSound();
      setScanStatus(null);
      setIsProcessingTicket(false);
      setScannedTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "error", errorMsg: "Evaluation failed" } : t))
      );
    }
  }, []);

  // Add ticket to batch with session validation & duplicate prevention
  const addParsedTicketToBatch = useCallback(
    (parsed: ParsedTicketData, rawSerial?: string) => {
      if (!parsed) return;

      // If user scans without an active session, open session modal to enter employee name first
      if (!isSessionActive) {
        setIsStartSessionModalOpen(true);
        return;
      }

      // Enforce single-ticket-at-a-time scanning
      if (isProcessingTicket) {
        return;
      }

      if (parsed.numbers.length === 0 && !parsed.letter && !parsed.zodiac) {
        setDuplicateWarning("Damaged or incomplete QR ticket data: Missing numbers or lagna.");
        setTimeout(() => setDuplicateWarning(null), 4000);
        return;
      }

      const lotName = parsed.lotteryName || "Govisetha";
      const cleanLotName = lotName.replace(/^(NLB|DLB)\s+/i, "");
      const cleanSerial = (parsed.serialNumber || rawSerial || "").trim();
      const rawTextStr = (parsed.rawText || rawSerial || "").trim();
      const numbersKey = (parsed.numbers || [])
        .map(Number)
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b)
        .join("-");
      const letterKey = (parsed.letter || "").trim().toUpperCase();
      const zodiacKey = (parsed.zodiac || "").trim().toLowerCase();
      const drawKey = (parsed.drawNumber || "").trim();

      const finalSerial =
        cleanSerial ||
        `TCK-${cleanLotName.slice(0, 3).toUpperCase()}-${drawKey || "D"}-${numbersKey || Date.now().toString().slice(-6)}`;

      // ─── Live Duplicate Rejection Check ───
      // Checks by: exact serial, exact rawText, or exact game+draw+numbers+letter/zodiac
      const isAlreadyScanned = scannedTickets.some((t) => {
        // 1. By clean serial
        if (
          cleanSerial &&
          t.serial &&
          !cleanSerial.startsWith("TCK-") &&
          !cleanSerial.startsWith("MAN-") &&
          !cleanSerial.startsWith("IMG-") &&
          !t.serial.startsWith("TCK-") &&
          !t.serial.startsWith("MAN-") &&
          !t.serial.startsWith("IMG-") &&
          cleanSerial.toLowerCase() === t.serial.trim().toLowerCase()
        ) {
          return true;
        }

        // 2. By raw QR/barcode payload
        if (rawTextStr && t.rawText && rawTextStr === t.rawText) {
          return true;
        }

        // 3. By game, numbers, draw, letter, and zodiac
        const tNumsKey = (t.numbers || [])
          .map(Number)
          .filter((n) => !isNaN(n))
          .sort((a, b) => a - b)
          .join("-");
        const tLetterKey = (t.letter || "").trim().toUpperCase();
        const tZodiacKey = (t.zodiac || "").trim().toLowerCase();
        const tDrawKey = (t.drawNumber || "").trim();
        const tCleanLotName = (t.cleanLotteryName || t.lotteryName).replace(/^(NLB|DLB)\s+/i, "");

        if (
          numbersKey &&
          tNumsKey &&
          numbersKey === tNumsKey &&
          cleanLotName.toLowerCase() === tCleanLotName.toLowerCase()
        ) {
          const drawMatches = !drawKey || !tDrawKey || drawKey === tDrawKey;
          const letterMatches = !letterKey || !tLetterKey || letterKey === tLetterKey;
          const zodiacMatches = !zodiacKey || !tZodiacKey || zodiacKey === tZodiacKey;
          if (drawMatches && letterMatches && zodiacMatches) {
            return true;
          }
        }

        return false;
      });

      if (isAlreadyScanned) {
        setDuplicateWarning(
          `Already scanned: Ticket (${cleanSerial || cleanLotName}) is already recorded in this report.`
        );
        setScanStatus("already_scanned");
        setScanStatusMsg("Already scanned");
        soundEffects.playAlreadyScannedSound();

        setTimeout(() => {
          setScanStatus(null);
        }, 2000);
        setTimeout(() => setDuplicateWarning(null), 4000);
        return;
      }

      // ─── Single-Ticket Lock Activation ───
      setIsProcessingTicket(true);
      setScanStatus("evaluating");
      setScanStatusMsg("Evaluating ticket...");

      const board =
        parsed.board ||
        (lotName.toLowerCase().includes("nlb") ||
        [
          "govisetha",
          "mahajana sampatha",
          "mega power",
          "dhana nidhanaya",
          "handahana",
          "nlb jaya",
          "ada sampatha",
          "suba dawasak",
        ].some((n) => lotName.toLowerCase().includes(n))
          ? "NLB"
          : "DLB");

      const newTicket: ScannedTicketItem = {
        id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        serial: finalSerial,
        rawText: rawTextStr,
        lotteryName: lotName,
        cleanLotteryName: cleanLotName,
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
      } else {
        setScanStatus("success");
        setTimeout(() => {
          setIsProcessingTicket(false);
          setScanStatus(null);
        }, 1200);
      }
    },
    [isSessionActive, isProcessingTicket, scannedTickets, evaluateTicket]
  );

  // QR Scan Success Handler
  const handleQrScanSuccess = useCallback(
    (decodedText: string) => {
      const raw = decodedText.trim();
      if (!raw) return;

      setLastScannedText(raw);
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 300);

      const qrData = parseLotteryQR(raw);
      if (qrData.isValid) {
        let letterVal = qrData.letter;
        if (qrData.zodiacSigns && qrData.zodiacSigns.length >= 2) {
          letterVal = `${qrData.zodiacSigns[0].nameEn || qrData.zodiacSigns[0].transliteration}, ${
            qrData.zodiacSigns[1].nameEn || qrData.zodiacSigns[1].transliteration
          }`;
        } else if (!letterVal && qrData.zodiac) {
          letterVal = qrData.zodiac.nameEn || qrData.zodiac.transliteration;
        }

        addParsedTicketToBatch(
          {
            numbers: qrData.primaryNumbers,
            letter: letterVal,
            zodiac: qrData.zodiac ? qrData.zodiac.nameEn || qrData.zodiac.transliteration : undefined,
            zodiac2: qrData.zodiac2 ? qrData.zodiac2.nameEn || qrData.zodiac2.transliteration : undefined,
            zodiacSigns: qrData.zodiacSigns
              ? qrData.zodiacSigns.map((z) => z.nameEn || z.transliteration)
              : undefined,
            lotteryName: qrData.lotteryName,
            drawNumber: qrData.drawNumber,
            drawDate: qrData.drawDate,
            serialNumber: qrData.serialNumber,
            promotionalNumber: qrData.promotionalNumber,
            isFutureDraw: qrData.isFutureDraw,
            board: qrData.board,
            sourceMethod: "barcode_detector",
            rawText: raw,
          },
          qrData.serialNumber
        );
        return;
      }

      // Fallback text parser
      const parsed = parseTicketText(raw);
      addParsedTicketToBatch(parsed, raw);
    },
    [addParsedTicketToBatch]
  );

  // Barcode Gun Hardware Listener
  useEffect(() => {
    if (scanMode !== "gun") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessingTicket) return;
      const now = Date.now();
      const timeDiff = now - gunLastKeyTime.current;
      gunLastKeyTime.current = now;

      if (e.key === "Enter") {
        if (gunInputBuffer.length >= 4) {
          e.preventDefault();
          handleQrScanSuccess(gunInputBuffer);
          setGunInputBuffer("");
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 200) {
          setGunInputBuffer(e.key);
        } else {
          setGunInputBuffer((prev) => prev + e.key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanMode, gunInputBuffer, handleQrScanSuccess]);

  // Batch Image Upload Handler
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isSessionActive) {
      setIsStartSessionModalOpen(true);
      return;
    }

    setIsUploadingBatch(true);
    setUploadProgress({ current: 0, total: files.length, status: "Starting OCR batch extraction..." });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        current: i + 1,
        total: files.length,
        status: `Processing ticket photo ${i + 1} of ${files.length}...`,
      });

      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });
        const parsed = await scanTicketImage(img);
        URL.revokeObjectURL(url);
        if (parsed) {
          addParsedTicketToBatch(parsed, `IMG-${file.name.slice(0, 10)}`);
        }
      } catch (err) {
        console.warn(`Failed to process photo: ${file.name}`);
      }
    }

    setIsUploadingBatch(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Manual Add Handler
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSessionActive) {
      setIsStartSessionModalOpen(true);
      return;
    }

    const nums = manualNums.map(Number).filter((n) => !isNaN(n) && n > 0);
    if (nums.length === 0) {
      alert("Please enter at least 1 valid lottery number.");
      return;
    }

    const isSuba = manualLottery.toLowerCase().includes("suba");
    const signs = isSuba && manualLetter ? manualLetter.split(",").map((s) => s.trim()) : undefined;

    addParsedTicketToBatch(
      {
        numbers: nums,
        letter: isSuba ? undefined : manualLetter.trim() || undefined,
        zodiacSigns: signs,
        lotteryName: manualLottery,
        serialNumber: manualSerial.trim() || `MAN-${Date.now().toString().slice(-6)}`,
        board: manualLottery.toLowerCase().includes("govisetha") ||
          manualLottery.toLowerCase().includes("mahajana") ||
          manualLottery.toLowerCase().includes("mega") ||
          manualLottery.toLowerCase().includes("dhana") ||
          manualLottery.toLowerCase().includes("handahana")
            ? "NLB"
            : "DLB",
        sourceMethod: "manual",
      },
      manualSerial
    );

    setManualNums(["", "", "", "", ""]);
    setManualLetter("");
    setManualSerial("");
  };

  // ─── Finish & Save Session to Profile ───
  const handleFinishAndSaveSession = async () => {
    if (!activeEmployee || !activeEmployee.name) {
      setIsStartSessionModalOpen(true);
      return;
    }

    setSaveSessionSubmitting(true);
    try {
      const payload = {
        agentId: "default-agent",
        employeeId: activeEmployee.id,
        employeeName: activeEmployee.name,
        counterName: activeEmployee.counterName || "Main Counter",
        startedAt: sessionStartedAt,
        endedAt: new Date().toISOString(),
        status: "completed",
        tickets: scannedTickets,
        returnShortageAmount: returnShortageAmount,
        recordClaims: true,
      };

      const res = await agentApi.createSession(payload);
      const savedSession = res.data?.data;

      // Populate completed slip for modal display and printing
      const slip: SessionSlipData = {
        sessionNumber: savedSession?.sessionNumber,
        employeeName: activeEmployee.name,
        counterName: activeEmployee.counterName,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        totalTickets: scannedTickets.length,
        winningTickets: liveTierBreakdown.winningTicketsCount,
        tiers: liveTierBreakdown.allTiers,
        totalWinningAmount: liveTierBreakdown.winningTotal,
        returnShortageAmount: returnShortageAmount,
        netTotalAmount: liveTierBreakdown.netTotal,
      };

      setCompletedSlipData(slip);
      setIsSessionCompleteModalOpen(true);

      // Reset active session state
      sessionStorage.removeItem("lottoscan_session_active");
      sessionStorage.removeItem("lottoscan_active_emp_name");
      sessionStorage.removeItem("lottoscan_active_counter_name");
      sessionStorage.removeItem("lottoscan_active_emp_id");
      sessionStorage.removeItem("lottoscan_active_started_at");
      sessionStorage.removeItem("lottoscan_active_return");
      setIsSessionActive(false);
    } catch (err: any) {
      alert("Failed to save session: " + (err.response?.data?.message || err.message));
    } finally {
      setSaveSessionSubmitting(false);
    }
  };

  // ─── Cancel / Discard Active Session ───
  const handleCancelActiveSession = () => {
    const confirmMsg = activeEmployee
      ? `Are you sure you want to cancel and discard this active scanning session for ${activeEmployee.name}? Any unsaved tickets in this session will be cleared.`
      : "Are you sure you want to cancel and discard this active scanning session?";

    if (confirm(confirmMsg)) {
      sessionStorage.removeItem("lottoscan_session_active");
      sessionStorage.removeItem("lottoscan_active_emp_name");
      sessionStorage.removeItem("lottoscan_active_counter_name");
      sessionStorage.removeItem("lottoscan_active_emp_id");
      sessionStorage.removeItem("lottoscan_active_started_at");
      sessionStorage.removeItem("lottoscan_active_return");

      setIsSessionActive(false);
      setActiveEmployee(null);
      setSessionStartedAt(null);
      setSessionSeconds(0);
      setReturnShortageAmount(0);
      setScannedTickets([]);
    }
  };

  // Summary statistics
  const summary = useMemo(() => {
    const total = scannedTickets.length;
    const validWinners = scannedTickets.filter((t) => t.isWinner && !t.isExpired);
    const expiredTickets = scannedTickets.filter((t) => t.isExpired);
    const totalPrize = validWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    const nlbTickets = scannedTickets.filter((t) => t.board === "NLB");
    const nlbWinners = nlbTickets.filter((t) => t.isWinner && !t.isExpired);
    const nlbPrize = nlbWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    const dlbTickets = scannedTickets.filter((t) => t.board === "DLB");
    const dlbWinners = dlbTickets.filter((t) => t.isWinner && !t.isExpired);
    const dlbPrize = dlbWinners.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

    return {
      total,
      winnersCount: validWinners.length,
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
      {/* ─── Hidden Printable Slip Anchor (for print mode only) ─── */}
      <div className="print-only mb-4">
        {completedSlipData ? (
          <SessionSlipView data={completedSlipData} showPrintButton={false} />
        ) : (
          <SessionSlipView
            data={{
              employeeName: activeEmployee?.name || "Counter Staff",
              counterName: activeEmployee?.counterName || "Main Counter",
              date: new Date().toISOString().slice(0, 10),
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              totalTickets: scannedTickets.length,
              winningTickets: liveTierBreakdown.winningTicketsCount,
              tiers: liveTierBreakdown.allTiers,
              totalWinningAmount: liveTierBreakdown.winningTotal,
              returnShortageAmount: returnShortageAmount,
              netTotalAmount: liveTierBreakdown.netTotal,
            }}
            showPrintButton={false}
          />
        )}
      </div>

      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 print:hidden">
        {/* ─── Top Header Bar ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="text-text-secondary hover:text-text-primary transition-colors font-body text-xs font-bold border border-border-default px-2.5 py-1 rounded-lg bg-white shadow-sm"
              >
                {t("scan_single_checker")}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary flex items-center gap-2">
                <span>⚡</span> {t("scan_title")}
              </h1>
            </div>
            <p className="text-text-secondary font-body text-xs font-semibold mt-1">
              {t("scan_subtitle")}
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
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                soundOn
                  ? "bg-win-light border-green-200 text-win"
                  : "bg-brand-section border-border-default text-text-muted"
              }`}
            >
              <span>{soundOn ? "🔊" : "🔇"}</span> {soundOn ? t("scan_sound_on") : t("scan_sound_off")}
            </button>

            {isSessionActive ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSlipModalOpen(true)}
                  className="bg-white border border-border-default shadow-sm text-xs font-bold flex items-center gap-1.5"
                >
                  <span>🧾</span> {t("scan_view_live_slip")}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setProfileTargetEmployeeId(activeEmployee?.id || null);
                    setIsProfileModalOpen(true);
                  }}
                  className="bg-white border border-border-default shadow-sm text-xs font-bold flex items-center gap-1.5"
                >
                  <span>👤</span> {t("scan_employee_profile")}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  loading={saveSessionSubmitting}
                  onClick={handleFinishAndSaveSession}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
                >
                  <span>💾</span> {t("scan_finish_save")}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsStartSessionModalOpen(true)}
                  className="text-text-secondary hover:text-text-primary text-xs font-bold"
                >
                  🔄 {t("scan_switch_staff")}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelActiveSession}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold border border-rose-200 flex items-center gap-1"
                >
                  <span>✕</span> {t("scan_cancel_session")}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsStartSessionModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
              >
                <span>⚡</span> {t("scan_start_scanning_session")}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Active Scanning Session Banner ─── */}
        {isSessionActive && activeEmployee ? (
          <div className="mb-6 bg-gradient-to-r from-emerald-900 via-zinc-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-600/40 relative overflow-hidden animate-slide-up">
            <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-zinc-950 flex items-center justify-center text-xl font-black shadow-md">
                  {activeEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {t("scan_active_session_badge")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-mono">
                      ⏱️ {formatTimer(sessionSeconds)}
                    </span>
                  </div>
                  <h2 className="text-lg font-heading font-black text-white mt-0.5">
                    {activeEmployee.name}
                  </h2>
                  <p className="text-xs text-zinc-300 font-medium">
                    📍 {activeEmployee.counterName || t("scan_main_counter")}
                  </p>
                </div>
              </div>

              {/* Running Session Financials Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">{t("scan_kpi_scanned")}</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {scannedTickets.length} ({liveTierBreakdown.winningTicketsCount} {t("scan_kpi_wins")})
                  </span>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">{t("scan_kpi_win_total")}</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    Rs. {liveTierBreakdown.winningTotal.toLocaleString()}
                  </span>
                </div>
                <div className="bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-2">
                  <div>
                    <span className="text-rose-300 block text-[10px]">{t("scan_kpi_return_shortage")}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-rose-300 font-bold">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={returnShortageAmount || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setReturnShortageAmount(val);
                          sessionStorage.setItem("lottoscan_active_return", String(val));
                        }}
                        placeholder="0"
                        className="w-16 bg-white text-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                  <span className="text-emerald-300 block text-[10px] font-bold">{t("scan_kpi_net_payout_total")}</span>
                  <span className="font-mono font-black text-base text-amber-300">
                    Rs. {liveTierBreakdown.netTotal.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCancelActiveSession}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1"
                  title="Discard and cancel active session"
                >
                  <span>✕</span> {t("scan_cancel_session")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="font-heading font-black text-sm text-amber-950">
                  {t("scan_no_session_title")}
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  {t("scan_no_session_desc")}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStartSessionModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
            >
              ⚡ {t("scan_enter_emp_start_btn")}
            </Button>
          </div>
        )}

        {/* ─── Metric Overview Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("scan_kpi_scanned")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary mt-1">
                {summary.total} <span className="text-xs font-body font-semibold text-text-muted">{t("scan_kpi_tickets")}</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-gold-light border border-gold-border flex items-center justify-center text-xl shrink-0">
              🎟️
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("scan_kpi_winning")}
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
                {t("scan_kpi_win_total")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-600 mt-1">
                Rs. {liveTierBreakdown.winningTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
          </Card>

          <Card padding="sm" className="p-4 bg-white border border-border-default shadow-sm flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                {t("scan_kpi_net_payout")}
              </p>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-amber-600 mt-1">
                Rs. {liveTierBreakdown.netTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              🧾
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
                  Under official NLB &amp; DLB regulations, winning tickets must be claimed within 6 months (180 days) of draw date. Expired tickets are excluded from payouts.
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

        {/* ─── Scanner Controls & Live Voucher Section (Split Layout) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 mb-8">
          {/* Left: Scanner Modes & Input */}
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="bg-white border border-border-default p-1.5 rounded-2xl flex gap-1 shadow-sm">
              <button
                type="button"
                onClick={() => setScanMode("camera")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "camera"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>📷</span> {t("scan_tab_camera")}
              </button>
              <button
                type="button"
                onClick={() => setScanMode("upload")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "upload"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>📁</span> {t("scan_tab_upload")}
              </button>
              <button
                type="button"
                onClick={() => setScanMode("gun")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "gun"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>🔫</span> {t("scan_tab_gun")}
              </button>
              <button
                type="button"
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-2 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === "manual"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                }`}
              >
                <span>⌨️</span> {t("scan_tab_manual")}
              </button>
            </div>

            {/* Mode 1: Continuous Camera */}
            {scanMode === "camera" && (
              <div className="relative">
                <LaptopQrScanner
                  onScanSuccess={handleQrScanSuccess}
                  disableBuiltinBeep={true}
                  isProcessing={isProcessingTicket}
                  singleTicketMode={true}
                  lastScanStatus={scanStatus}
                  statusMessage={scanStatusMsg}
                  autoCooldownMs={2000}
                />
                {scanFlash && (
                  <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-sm z-30 animate-ping flex items-center justify-center rounded-2xl pointer-events-none">
                    <span className="text-3xl font-black text-white drop-shadow">✓ {t("camera_scanned_success")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Batch Upload */}
            {scanMode === "upload" && (
              <Card className="bg-white border-2 border-dashed border-emerald-300 p-8 text-center rounded-2xl shadow-sm space-y-4">
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
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(uploadProgress.current / Math.max(1, uploadProgress.total)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl mx-auto">
                      📁
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-text-primary">
                        {t("scan_upload_title")}
                      </h3>
                      <p className="text-xs text-text-secondary font-body mt-1 max-w-xs mx-auto">
                        {t("scan_upload_desc")}
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 shadow-sm"
                    >
                      {t("scan_upload_browse_btn")}
                    </Button>
                  </>
                )}
              </Card>
            )}

            {/* Mode 3: Hardware Gun */}
            {scanMode === "gun" && (
              <Card className="bg-white border border-border-default p-6 rounded-2xl shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl mx-auto">
                  🔫
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-text-primary">
                    {t("scan_gun_title")}
                  </h3>
                  <p className="text-xs text-text-secondary font-body mt-1 max-w-sm mx-auto">
                    {t("scan_gun_desc")}
                  </p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-300 p-3 rounded-xl text-xs font-mono font-bold text-emerald-900 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  {t("scan_gun_listening")}
                </div>
              </Card>
            )}

            {/* Mode 4: Manual Entry */}
            {scanMode === "manual" && (
              <Card className="bg-white border border-border-default p-5 rounded-2xl shadow-sm">
                <h3 className="font-display font-extrabold text-sm text-text-primary mb-1">
                  {t("scan_manual_title")}
                </h3>
                <p className="text-[11px] text-text-secondary font-body mb-4">
                  Add damaged or unreadable tickets manually to {activeEmployee?.name || "this employee"}&apos;s batch.
                </p>

                <form onSubmit={handleAddManual} className="space-y-3 text-xs font-body">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-text-secondary mb-1">{t("scan_manual_game")}</label>
                      <select
                        value={manualLottery}
                        onChange={(e) => setManualLottery(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-bold text-xs"
                      >
                        {LOTTERIES.map((l) => (
                          <option key={l.id} value={l.name}>
                            {getLotteryName(l.name, language)} ({l.board})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-text-secondary mb-1">
                        {manualLottery.toLowerCase().includes("suba") ? "Zodiac Signs" : t("scan_manual_lagna")}
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder={manualLottery.toLowerCase().includes("suba") ? "e.g. Aries" : "e.g. M / P"}
                        value={manualLetter}
                        onChange={(e) => setManualLetter(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-bold text-center text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-text-secondary mb-1">{t("scan_manual_numbers")}</label>
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
                    <label className="block font-bold text-text-secondary mb-1">{t("scan_manual_serial")}</label>
                    <input
                      type="text"
                      placeholder="e.g. TCK-849201"
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      className="w-full border border-border-default rounded-lg px-2.5 py-1.5 bg-brand-section text-text-primary font-mono text-xs"
                    />
                  </div>

                  <Button type="submit" fullWidth size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2">
                    ➕ {t("scan_manual_add_btn")}
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Right: Live Voucher Settlement Slip & Live Queue Tabs */}
          <div className="space-y-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between bg-white border border-border-default p-1.5 rounded-2xl shadow-sm">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setRightPanelTab("slip")}
                  className={`px-3 py-1.5 rounded-xl font-body font-bold text-xs flex items-center gap-1.5 transition-all ${
                    rightPanelTab === "slip"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                  }`}
                >
                  <span>🧾</span> {t("scan_tab_slip")}
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("queue")}
                  className={`px-3 py-1.5 rounded-xl font-body font-bold text-xs flex items-center gap-1.5 transition-all ${
                    rightPanelTab === "queue"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-brand-section"
                  }`}
                >
                  <span>📋</span> {t("scan_tab_queue")} ({scannedTickets.length})
                </button>
              </div>

              {scannedTickets.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllTickets}
                  className="text-text-muted hover:text-rose-600 font-bold text-xs px-2"
                >
                  {t("scan_clear_all")}
                </button>
              )}
            </div>

            {/* View A: Embedded Live Settlement Slip (Matching Attached Physical Paper Voucher) */}
            {rightPanelTab === "slip" && (
              <div className="space-y-4">
                <SessionSlipView
                  data={{
                    sessionNumber: "LIVE-SESSION",
                    employeeName: activeEmployee?.name || "Counter Staff",
                    counterName: activeEmployee?.counterName || "Main Counter",
                    date: new Date().toISOString().slice(0, 10),
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    totalTickets: scannedTickets.length,
                    winningTickets: liveTierBreakdown.winningTicketsCount,
                    tiers: liveTierBreakdown.allTiers,
                    totalWinningAmount: liveTierBreakdown.winningTotal,
                    returnShortageAmount: returnShortageAmount,
                    netTotalAmount: liveTierBreakdown.netTotal,
                  }}
                  editableReturn={true}
                  onReturnChange={(val) => {
                    setReturnShortageAmount(val);
                    sessionStorage.setItem("lottoscan_active_return", String(val));
                  }}
                  showPrintButton={true}
                />

                {isSessionActive && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      fullWidth
                      loading={saveSessionSubmitting}
                      onClick={handleFinishAndSaveSession}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-2.5 shadow-md shadow-emerald-900/20"
                    >
                      💾 {t("scan_finish_save")} ({activeEmployee?.name})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* View B: Live Scanned Tickets List */}
            {rightPanelTab === "queue" && (
              <Card className="bg-white border border-border-default p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-display font-extrabold text-sm text-text-primary">
                      {t("scan_tab_queue")} ({scannedTickets.length})
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    {(["all", "winners", "nlb", "dlb"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setFilterTab(tab)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          filterTab === tab
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "text-text-secondary hover:bg-brand-section"
                        }`}
                      >
                        {tab === "all" ? t("scan_tab_all") : tab === "winners" ? t("scan_tab_winners") : tab}
                      </button>
                    ))}
                  </div>
                </div>

                {scannedTickets.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-xs font-body space-y-2">
                    <span className="text-3xl block">🎟️</span>
                    <p className="font-bold">No tickets scanned in this session yet.</p>
                    <p className="text-[11px]">Scan QR codes with your camera, laser gun, or upload images.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredList.map((ticket, idx) => (
                      <div
                        key={ticket.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                          ticket.isExpired
                            ? "bg-rose-50/70 border-rose-200"
                            : ticket.isWinner
                            ? "bg-emerald-50/80 border-emerald-300"
                            : "bg-brand-section/40 border-border-default hover:bg-brand-section"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-bold text-text-muted text-[11px] w-5 text-right">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-text-primary text-xs">
                                {ticket.cleanLotteryName || ticket.lotteryName}
                              </span>
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                  ticket.board === "NLB"
                                    ? "bg-blue-100 text-blue-900 border border-blue-200"
                                    : "bg-purple-100 text-purple-900 border border-purple-200"
                                }`}
                              >
                                {ticket.board}
                              </span>
                              {ticket.drawNumber && (
                                <span className="text-[10px] text-text-muted font-mono">
                                  #{ticket.drawNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-text-secondary truncate mt-0.5">
                              {ticket.serial} • Numbers: {ticket.numbers.join(", ")}{" "}
                              {ticket.letter ? `• [${ticket.letter}]` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ticket.status === "evaluating" ? (
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          ) : ticket.isExpired ? (
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-400 line-through text-xs block">
                                {ticket.prizeAmountFormatted || `Rs. ${ticket.prizeAmount}`}
                              </span>
                              <span className="text-[9px] font-bold text-rose-600 block">
                                Expired (&gt;6m)
                              </span>
                            </div>
                          ) : ticket.isWinner ? (
                            <div className="text-right">
                              <span className="font-mono font-black text-emerald-800 text-xs block">
                                {ticket.prizeAmountFormatted || `Rs. ${ticket.prizeAmount}`}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-600 block">
                                {ticket.prizeCategory || "Winner"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              No Match
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => removeTicket(ticket.id)}
                            className="text-text-muted hover:text-red-600 p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* ─── Full Scanned Batch Table (Detailed Reconciliation) ─── */}
        <Card className="bg-white border border-border-default shadow-sm overflow-hidden mb-8">
          <div className="p-4 bg-brand-section/50 border-b border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-display font-extrabold text-text-primary">
                {t("scan_audit_table_title")} ({scannedTickets.length})
              </h2>
              <p className="text-xs text-text-secondary font-body">
                {activeEmployee ? `Current session for ${activeEmployee.name} (${activeEmployee.counterName})` : "Active scan batch"}
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
                    <th className="py-3 px-4">{t("scan_table_serial")}</th>
                    <th className="py-3 px-4">{t("scan_table_board")}</th>
                    <th className="py-3 px-4">{t("scan_table_game")}</th>
                    <th className="py-3 px-4">{t("scan_table_numbers")}</th>
                    <th className="py-3 px-4">{t("scan_table_lagna")}</th>
                    <th className="py-3 px-4">{t("scan_table_status")}</th>
                    <th className="py-3 px-4">{t("scan_table_tier")}</th>
                    <th className="py-3 px-4 text-right">{t("scan_table_prize")}</th>
                    <th className="py-3 px-4 text-center">{t("scan_table_action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default/50">
                  {filteredList.map((tItem, idx) => (
                    <tr
                      key={tItem.id}
                      className={`hover:bg-brand-section/30 transition-colors ${
                        tItem.isExpired
                          ? "bg-rose-50/50"
                          : tItem.isWinner
                          ? "bg-emerald-50/40"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-text-muted">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-text-primary">{tItem.serial}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            tItem.board === "NLB"
                              ? "bg-blue-100 text-blue-900 border border-blue-300"
                              : "bg-purple-100 text-purple-900 border border-purple-300"
                          }`}
                        >
                          {tItem.board}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-text-primary">
                        {getLotteryName(tItem.cleanLotteryName || tItem.lotteryName, language)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-secondary">
                        {tItem.numbers.join(", ")}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {tItem.letter ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px]">
                            {tItem.letter}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {tItem.isExpired ? (
                          <Badge variant="red">{t("scan_status_expired")}</Badge>
                        ) : tItem.isWinner ? (
                          <Badge variant="green">🏆 {t("scan_status_winner")}</Badge>
                        ) : (
                          <span className="text-gray-500 font-medium">{t("scan_status_no_match")}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {tItem.prizeCategory || (tItem.isWinner ? "Match Tier" : "—")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                        {tItem.isExpired ? (
                          <span className="text-slate-400 line-through text-xs">Rs. 0.00</span>
                        ) : tItem.isWinner ? (
                          <span className="text-emerald-700 font-black">
                            {tItem.prizeAmountFormatted || `Rs. ${tItem.prizeAmount}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Rs. 0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeTicket(tItem.id)}
                          className="text-text-muted hover:text-red-600 text-xs transition-colors p-1"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 font-bold text-text-primary border-t-2 border-emerald-300">
                    <td colSpan={8} className="py-3.5 px-4 uppercase text-xs text-emerald-950 font-black">
                      Batch Total ({summary.total} Tickets Scanned • {summary.winnersCount} Winning Tickets):
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-base font-black text-emerald-700">
                      Rs. {summary.totalPrize.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ─── MODAL 1: START SCANNING SESSION (First Step: Enter Employee Name) ─── */}
      {isStartSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full p-6 border border-border-default shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setIsStartSessionModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-sm font-bold p-1 rounded-lg hover:bg-brand-section transition-colors"
              aria-label="Cancel and close dialog"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mx-auto mb-2">
                👤
              </div>
              <h3 className="text-lg font-display font-black text-text-primary">
                {t("scan_modal_start_title")}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {t("scan_modal_start_desc")}
              </p>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4 text-xs">
              {sessionFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-200">
                  ⚠️ {sessionFormError}
                </div>
              )}

              {/* Toggle: Select Existing vs Enter New */}
              <div className="flex bg-brand-section p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsNewEmployeeMode(false)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    !isNewEmployeeMode
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  {t("scan_modal_choose_existing")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewEmployeeMode(true)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    isNewEmployeeMode
                      ? "bg-white text-text-primary shadow-sm"
                      : "text-text-secondary"
                  }`}
                >
                  {t("scan_modal_enter_new")}
                </button>
              </div>

              {!isNewEmployeeMode ? (
                <div>
                  <label className="block font-bold text-text-secondary mb-1">
                    {t("scan_modal_select_staff")}
                  </label>
                  <select
                    value={startSessionSelectedEmpId}
                    onChange={(e) => setStartSessionSelectedEmpId(e.target.value)}
                    className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} — {emp.counterName} ({emp.commissionRate || 2.5}%)
                      </option>
                    ))}
                    {employees.length === 0 && (
                      <option value="">No staff registered yet — use New Employee tab</option>
                    )}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">
                      {t("scan_modal_emp_name")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kasun Bandara"
                      value={customEmpName}
                      onChange={(e) => setCustomEmpName(e.target.value)}
                      className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-text-secondary mb-1">
                      {t("scan_modal_counter_name")}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Counter 01 - Pettah"
                      value={customCounterName}
                      onChange={(e) => setCustomCounterName(e.target.value)}
                      className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-medium text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Initial Return / Shortage */}
              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  {t("scan_modal_initial_return")}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={startSessionReturn}
                  onChange={(e) => setStartSessionReturn(e.target.value)}
                  className="w-full border border-border-default rounded-xl px-3 py-2 bg-brand-section text-text-primary font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Can also be adjusted live during or at the end of the scanning session.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsStartSessionModalOpen(false)}
                  className="flex-1 font-bold"
                >
                  {t("scan_modal_cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  🚀 {t("scan_modal_start_btn")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── MODAL 2: LIVE SETTLEMENT VOUCHER SLIP (Full Preview & Print) ─── */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-h-[90vh] overflow-y-auto w-full max-w-md">
            <SessionSlipView
              data={{
                sessionNumber: "LIVE-SESSION",
                employeeName: activeEmployee?.name || "Counter Staff",
                counterName: activeEmployee?.counterName || "Main Counter",
                date: new Date().toISOString().slice(0, 10),
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                totalTickets: scannedTickets.length,
                winningTickets: liveTierBreakdown.winningTicketsCount,
                tiers: liveTierBreakdown.allTiers,
                totalWinningAmount: liveTierBreakdown.winningTotal,
                returnShortageAmount: returnShortageAmount,
                netTotalAmount: liveTierBreakdown.netTotal,
              }}
              editableReturn={true}
              onReturnChange={(val) => {
                setReturnShortageAmount(val);
                sessionStorage.setItem("lottoscan_active_return", String(val));
              }}
              onClose={() => setIsSlipModalOpen(false)}
              showPrintButton={true}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL 3: EMPLOYEE PROFILE & SESSION HISTORY ─── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-h-[90vh] overflow-y-auto w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-border-default">
            {profileTargetEmployeeId ? (
              <EmployeeProfileView
                employeeId={profileTargetEmployeeId}
                onClose={() => setIsProfileModalOpen(false)}
                onStartSessionForEmployee={(empName, counter) => {
                  setActiveEmployee({ name: empName, counterName: counter });
                  setIsProfileModalOpen(false);
                  setIsStartSessionModalOpen(true);
                }}
              />
            ) : activeEmployee?.name ? (
              <EmployeeProfileView
                employeeId={activeEmployee.name}
                onClose={() => setIsProfileModalOpen(false)}
              />
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-bold text-text-secondary">No active employee selected.</p>
                <Button size="sm" onClick={() => setIsProfileModalOpen(false)} className="mt-4">
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SESSION COMPLETED & SAVED TO PROFILE ─── */}
      {isSessionCompleteModalOpen && completedSlipData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-h-[95vh] overflow-y-auto w-full max-w-md space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-600 text-white p-4 rounded-2xl text-center shadow-lg">
              <span className="text-3xl block mb-1">🎉</span>
              <h3 className="text-lg font-heading font-black">
                {t("scan_modal_complete_title")} ({completedSlipData.employeeName})
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {t("scan_modal_complete_desc")}
              </p>
            </div>

            <SessionSlipView
              data={completedSlipData}
              onClose={() => setIsSessionCompleteModalOpen(false)}
              showPrintButton={true}
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSessionCompleteModalOpen(false)}
                className="flex-1 bg-white border border-border-default text-xs font-bold text-zinc-700"
              >
                ✕ {t("slip_close_btn")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsSessionCompleteModalOpen(false);
                  setProfileTargetEmployeeId(activeEmployee?.id || completedSlipData.employeeName);
                  setIsProfileModalOpen(true);
                }}
                className="flex-1 bg-white border border-border-default text-xs font-bold"
              >
                👤 {t("scan_modal_view_profile")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsSessionCompleteModalOpen(false);
                  setIsStartSessionModalOpen(true);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                ⚡ {t("scan_modal_next_session")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
