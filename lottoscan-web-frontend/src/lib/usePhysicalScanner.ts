"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getScannerSettings,
  saveScannerSettings,
  cleanBarcodeString,
  classifyBarcode,
  broadcastScannerEvent,
  ScannerSettings,
  ScannerEvent,
} from "./physicalScanner";
import { serialScanner } from "./serialScannerDriver";
import soundEffects from "./soundEffects";

interface UsePhysicalScannerOptions {
  onScan: (cleanBarcode: string, event: ScannerEvent) => void;
  enabled?: boolean;
  allowInInputs?: boolean;
}

export function usePhysicalScanner({
  onScan,
  enabled = true,
  allowInInputs = true,
}: UsePhysicalScannerOptions) {
  const [settings, setSettingsState] = useState<ScannerSettings>(() => getScannerSettings());
  const [lastScan, setLastScan] = useState<ScannerEvent | null>(null);
  const [isScanningBurst, setIsScanningBurst] = useState(false);
  const [serialStatus, setSerialStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");

  const bufferRef = useRef<string>("");
  const keyTimestampsRef = useRef<number[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Sync settings when changed from other components or storage
  useEffect(() => {
    const handleSettingsChange = () => {
      setSettingsState(getScannerSettings());
    };
    window.addEventListener("lottoscan_scanner_settings_changed", handleSettingsChange);
    return () => window.removeEventListener("lottoscan_scanner_settings_changed", handleSettingsChange);
  }, []);

  // Subscribe to serial scanner machine status & events
  useEffect(() => {
    const unsub = serialScanner.subscribeStatus(setSerialStatus);
    return unsub;
  }, []);

  const processCompleteBuffer = useCallback(
    (rawBuffer: string, timestamps: number[], source: ScannerEvent["source"] = "keyboard_wedge") => {
      if (rawBuffer.length < settings.minBarcodeLength) {
        bufferRef.current = "";
        keyTimestampsRef.current = [];
        return;
      }

      const totalDuration = timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 1;
      const avgInterval = timestamps.length > 1 ? totalDuration / (timestamps.length - 1) : 0;

      // Validate that it was indeed a hardware scanner burst (not human typing slowly)
      const isHardwareBurst = avgInterval <= settings.maxInterKeyDelayMs || source === "serial_port";

      if (!isHardwareBurst && source === "keyboard_wedge") {
        // Human typed slowly - ignore as scanner input
        bufferRef.current = "";
        keyTimestampsRef.current = [];
        return;
      }

      const clean = cleanBarcodeString(rawBuffer, settings.stripAimSymbology);
      if (clean.length < settings.minBarcodeLength) {
        bufferRef.current = "";
        keyTimestampsRef.current = [];
        return;
      }

      const eventType = classifyBarcode(clean);

      const scannerEvt: ScannerEvent = {
        rawData: rawBuffer,
        cleanData: clean,
        type: eventType,
        charCount: clean.length,
        durationMs: Math.max(1, Math.round(totalDuration)),
        averageInterKeyMs: Number(avgInterval.toFixed(1)),
        timestamp: Date.now(),
        source,
      };

      // Play hardware confirmation chirp
      if (settings.playBeepSound) {
        soundEffects.playScannerBeep();
      }

      // Update state and broadcast
      setLastScan(scannerEvt);
      broadcastScannerEvent(scannerEvt);
      onScan(clean, scannerEvt);

      // Clear buffer
      bufferRef.current = "";
      keyTimestampsRef.current = [];
      setIsScanningBurst(false);
    },
    [settings, onScan]
  );

  // Keyboard Wedge Listener for USB & Bluetooth barcode guns
  useEffect(() => {
    if (!enabled || !settings.enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional control keys
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "CapsLock"
      ) {
        return;
      }

      // Check active element: if user is typing in a standard form input,
      // allow scanner bursts to intercept, but ignore slow human keystrokes.
      const activeEl = document.activeElement as HTMLElement | null;
      const isTextInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      const now = performance.now();

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Check if previous keystroke was long ago (> 200ms) - reset buffer
      if (keyTimestampsRef.current.length > 0) {
        const lastTime = keyTimestampsRef.current[keyTimestampsRef.current.length - 1];
        if (now - lastTime > 200) {
          bufferRef.current = "";
          keyTimestampsRef.current = [];
        }
      }

      // 1. Enter or Tab indicates standard barcode gun suffix
      if (e.key === "Enter" || e.key === "Tab") {
        if (bufferRef.current.length >= settings.minBarcodeLength) {
          // If in an input field, prevent submitting the form twice
          if (isTextInput && !allowInInputs) {
            // Keep native behavior
          } else {
            e.preventDefault();
            e.stopPropagation();
          }
          processCompleteBuffer(bufferRef.current, keyTimestampsRef.current, "keyboard_wedge");
        }
        return;
      }

      // 2. Regular printable characters from the physical scanner
      if (e.key.length === 1) {
        bufferRef.current += e.key;
        keyTimestampsRef.current.push(now);

        if (!isScanningBurst && bufferRef.current.length > 2) {
          setIsScanningBurst(true);
        }

        // Set trailing timeout in case scanner has NO Enter suffix configured
        debounceTimerRef.current = setTimeout(() => {
          if (bufferRef.current.length >= settings.minBarcodeLength) {
            const timestamps = [...keyTimestampsRef.current];
            const raw = bufferRef.current;
            processCompleteBuffer(raw, timestamps, "keyboard_wedge");
          }
        }, 70);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, settings, allowInInputs, processCompleteBuffer, isScanningBurst]);

  const updateSettings = useCallback((newSettings: Partial<ScannerSettings>) => {
    const updated = { ...getScannerSettings(), ...newSettings };
    saveScannerSettings(updated);
    setSettingsState(updated);
  }, []);

  const connectSerial = useCallback(async () => {
    try {
      await serialScanner.connect(settings.baudRate, (clean, raw) => {
        const evt: ScannerEvent = {
          rawData: raw,
          cleanData: clean,
          type: classifyBarcode(clean),
          charCount: clean.length,
          durationMs: 5,
          averageInterKeyMs: 0.2,
          timestamp: Date.now(),
          source: "serial_port",
        };
        if (settings.playBeepSound) {
          soundEffects.playScannerBeep();
        }
        setLastScan(evt);
        broadcastScannerEvent(evt);
        onScan(clean, evt);
      });
    } catch (err) {
      console.warn("[SerialScanner] Connect error:", err);
      throw err;
    }
  }, [settings, onScan]);

  const disconnectSerial = useCallback(async () => {
    await serialScanner.disconnect();
  }, []);

  return {
    settings,
    updateSettings,
    lastScan,
    isScanningBurst,
    serialStatus,
    isSerialSupported: serialScanner.isSupported(),
    connectSerial,
    disconnectSerial,
  };
}
