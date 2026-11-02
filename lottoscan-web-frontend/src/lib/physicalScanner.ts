/**
 * Physical Barcode Scanner Engine for LottoScan
 * Handles hardware USB HID Keyboard Wedge, Bluetooth barcode guns,
 * and direct serial/kiosk barcode scanner devices.
 */

export interface ScannerEvent {
  rawData: string;
  cleanData: string;
  type: "qr" | "barcode_1d" | "serial" | "unknown";
  charCount: number;
  durationMs: number;
  averageInterKeyMs: number;
  timestamp: number;
  source: "keyboard_wedge" | "serial_port" | "manual_test";
}

export interface ScannerSettings {
  enabled: boolean;
  maxInterKeyDelayMs: number; // Max ms between keystrokes to count as scanner burst (default: 45ms)
  minBarcodeLength: number; // Minimum characters to consider a valid scan (default: 4)
  stripAimSymbology: boolean; // Auto-strip ]C1, ]Q1 etc. identifiers (default: true)
  playBeepSound: boolean; // Play hardware chirp on scan (default: true)
  autoSubmitOnEnter: boolean; // Auto submit on Enter / CR (default: true)
  baudRate: number; // For Serial COM port scanner machines (default: 9600)
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  enabled: true,
  maxInterKeyDelayMs: 45,
  minBarcodeLength: 4,
  stripAimSymbology: true,
  playBeepSound: true,
  autoSubmitOnEnter: true,
  baudRate: 9600,
};

const SETTINGS_KEY = "lottoscan_scanner_settings";

export function getScannerSettings(): ScannerSettings {
  if (typeof window === "undefined") return DEFAULT_SCANNER_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SCANNER_SETTINGS;
    return { ...DEFAULT_SCANNER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCANNER_SETTINGS;
  }
}

export function saveScannerSettings(settings: ScannerSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Dispatch storage event so all hooks across components sync immediately
    window.dispatchEvent(new Event("lottoscan_scanner_settings_changed"));
  } catch {}
}

/**
 * Strips hardware scanner preambles, AIM code symbology IDs, and control characters.
 * Example AIM prefixes:
 *   ]C0, ]C1 = Code 128
 *   ]Q1, ]Q2 = QR Code
 *   ]I0, ]I1 = Interleaved 2 of 5
 *   ]d1      = Data Matrix
 *   ]A0      = Code 39
 *   ]E0      = EAN-13
 */
export function cleanBarcodeString(raw: string, stripAim = true): string {
  if (!raw) return "";

  let cleaned = raw;

  // 1. Strip AIM symbology identifier (] followed by single letter and digit)
  if (stripAim) {
    cleaned = cleaned.replace(/^\][A-Za-z0-9]{2}/, "");
  }

  // 2. Strip non-printable ASCII control characters (STX \x02, ETX \x03, etc.)
  // Preserve standard printable characters, space, and Sinhala unicode
  cleaned = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");

  // 3. Trim whitespace, CR, LF
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Classify barcode into specific Sri Lankan lottery formats
 */
export function classifyBarcode(clean: string): ScannerEvent["type"] {
  if (!clean) return "unknown";

  // Check for 2D QR structure (delimiters, JSON, URLs, space-delimited lottery tokens)
  if (
    clean.includes("|") ||
    clean.includes(";") ||
    clean.startsWith("{") ||
    clean.includes("http://") ||
    clean.includes("https://") ||
    /r\.(nlb|dlb)\.lk/i.test(clean) ||
    /GOVISETHA|MAHAJANA|SAMPATHA|SUBA|DAWASA|KOTIPATHI|SHANIDA|LAGNA|MEGA|KAPRUKA|HANDAHANA/i.test(clean)
  ) {
    return "qr";
  }

  // Pure ticket serial number (10 to 18 digits or standard prefix)
  if (/^\d{10,18}$/.test(clean) || /^(NLB|DLB|NL|DL)[A-Z0-9]{8,}$/i.test(clean)) {
    return "serial";
  }

  // Standard 1D barcode with numbers or structured code (e.g. Code 128 ticket token)
  if (/^[A-Z0-9\-_]{4,}$/i.test(clean) || /^[0-9\s\-]{4,}$/.test(clean)) {
    return "barcode_1d";
  }

  return "unknown";
}

// Global scanner event bus for diagnostics and status monitors
type ScannerListener = (event: ScannerEvent) => void;
const listeners = new Set<ScannerListener>();

export function subscribeToScannerEvents(listener: ScannerListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastScannerEvent(event: ScannerEvent) {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (err) {
      console.warn("[ScannerBus] Listener error:", err);
    }
  });
}
