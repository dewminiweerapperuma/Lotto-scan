"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Keyboard,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  getScannerSettings,
  saveScannerSettings,
  subscribeToScannerEvents,
  ScannerSettings,
  ScannerEvent,
} from "@/lib/physicalScanner";
import { serialScanner } from "@/lib/serialScannerDriver";
import soundEffects from "@/lib/soundEffects";
import { useLanguage } from "@/context/LanguageContext";

interface PhysicalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestScan?: (cleanBarcode: string) => void;
}

export default function PhysicalScannerModal({
  isOpen,
  onClose,
  onTestScan,
}: PhysicalScannerModalProps) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ScannerSettings>(() => getScannerSettings());
  const [recentScans, setRecentScans] = useState<ScannerEvent[]>([]);
  const [serialStatus, setSerialStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [serialError, setSerialError] = useState("");
  const [testInput, setTestInput] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSettings(getScannerSettings());

    // Subscribe to live scanner events
    const unsubEvents = subscribeToScannerEvents((event) => {
      setRecentScans((prev) => [event, ...prev].slice(0, 10));
    });

    // Subscribe to serial port status
    const unsubSerial = serialScanner.subscribeStatus(setSerialStatus);

    return () => {
      unsubEvents();
      unsubSerial();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = (patch: Partial<ScannerSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveScannerSettings(next);
  };

  const handleConnectSerial = async () => {
    setSerialError("");
    try {
      await serialScanner.connect(settings.baudRate, (clean, raw) => {
        if (settings.playBeepSound) soundEffects.playScannerBeep();
        if (onTestScan) onTestScan(clean);
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setSerialError(err.message || "Failed to open serial device.");
      }
    }
  };

  const handleDisconnectSerial = async () => {
    await serialScanner.disconnect();
  };

  const handleTestBeep = () => {
    soundEffects.playScannerBeep();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Physical Scanner Machine Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
                Configure USB barcode guns, Bluetooth scanners & serial POS machines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hardware Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 1. USB Keyboard Wedge (Auto Active) */}
          <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Keyboard className="w-4 h-4" />
                <span>USB HID / Bluetooth Gun</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ready & Listening
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Standard handheld laser guns (Honeywell, Zebra, Eyoyo, Sunmi). Point and trigger at any lottery ticket barcode.
            </p>
          </div>

          {/* 2. Direct Web Serial Port Scanner */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>Serial COM Scanner (Kiosk/POS)</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  serialStatus === "connected"
                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {serialStatus === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
            {serialScanner.isSupported() ? (
              <div className="flex items-center gap-2 pt-1">
                {serialStatus === "connected" ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisconnectSerial}
                    className="text-xs py-1"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={serialStatus === "connecting"}
                    onClick={handleConnectSerial}
                    className="text-xs py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    Connect COM Device
                  </Button>
                )}
                <select
                  value={settings.baudRate}
                  onChange={(e) => handleUpdate({ baudRate: Number(e.target.value) })}
                  className="px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                >
                  <option value={9600}>9600 bps</option>
                  <option value={19200}>19200 bps</option>
                  <option value={38400}>38400 bps</option>
                  <option value={57600}>57600 bps</option>
                  <option value={115200}>115200 bps</option>
                </select>
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Web Serial requires Chrome, Edge, or Opera desktop.
              </p>
            )}
            {serialError && <p className="text-[10px] text-rose-500">{serialError}</p>}
          </div>
        </div>

        {/* Live Scanner Testing Box */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>🎯</span> Live Hardware Scanner Test Console
            </span>
            <button
              type="button"
              onClick={handleTestBeep}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" /> Test Scanner Beep
            </button>
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Pull barcode gun trigger or scan ticket barcode here to test..."
              className="w-full px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              ⚡ The barcode engine automatically detects rapid hardware keystrokes (&lt; 45ms) and parses Sri Lankan NLB & DLB ticket codes.
            </p>
          </div>

          {/* Recent Scans Feed */}
          {recentScans.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-amber-500/20 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent Hardware Scans:
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px]">
                {recentScans.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="truncate flex-1">
                      <span className="font-bold text-slate-900 dark:text-white">{s.cleanData}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase">
                        {s.type}
                      </span>
                      <span className="text-slate-400">
                        {s.charCount} chars in {s.durationMs}ms ({s.averageInterKeyMs}ms/k)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hardware Tuning Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Scanner Tuning Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed Threshold */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Inter-keystroke Delay Threshold
                </span>
                <span className="font-mono font-bold text-amber-500">
                  {settings.maxInterKeyDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={settings.maxInterKeyDelayMs}
                onChange={(e) => handleUpdate({ maxInterKeyDelayMs: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Scanners type &lt; 30ms/char. High values capture slow scanners; low values reject human typing.
              </p>
            </div>

            {/* Minimum Barcode Length */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Minimum Barcode Characters
                </span>
                <span className="font-mono font-bold text-amber-500">
                  {settings.minBarcodeLength} chars
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={settings.minBarcodeLength}
                onChange={(e) => handleUpdate({ minBarcodeLength: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Disregards short accidental keystrokes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.stripAimSymbology}
                onChange={(e) => handleUpdate({ stripAimSymbology: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span>Auto-strip AIM Symbology Identifiers (e.g. ]C1, ]Q1)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.playBeepSound}
                onChange={(e) => handleUpdate({ playBeepSound: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span>Audio Beep Feedback on Hardware Scan</span>
            </label>
          </div>
        </div>

        {/* Retail Lottery Counter Guide */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>Setup Tips for Lottery Agency POS Counters:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
            <li>
              <strong>Barcode Guns:</strong> Plug your USB scanner into the PC. Most units work straight out of the box with default carriage return (`Enter`) suffix.
            </li>
            <li>
              <strong>High Throughput:</strong> You can scan tickets continuously without clicking buttons or touching the mouse. The app verifies each ticket instantly in 50ms.
            </li>
            <li>
              <strong>Ticket Types:</strong> Both 2D QR codes and 1D Serial Barcodes printed on Sri Lankan National Lotteries Board (NLB) & Development Lotteries Board (DLB) tickets are recognized.
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-6"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
