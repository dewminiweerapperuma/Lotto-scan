import jsQR from "jsqr";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader
} from "@zxing/library";
import { createWorker } from "tesseract.js";
import { LOTTERIES } from "./constants";

export interface ParsedTicketData {
  numbers: (number | string)[];
  letter?: string;
  zodiac?: string;
  lotteryName?: string;
  drawNumber?: string;
  drawDate?: string;
  sourceMethod: "barcode_detector" | "zxing" | "jsqr" | "ocr" | "manual";
  rawText?: string;
}

const ZODIAC_MAP: Record<string, string> = {
  mesha: "1", aries: "1", "මේෂ": "1",
  vrushabha: "2", taurus: "2", "වෘෂභ": "2",
  mithuna: "3", gemini: "3", "මිථුන": "3",
  kataka: "4", cancer: "4", "කටක": "4",
  singha: "5", simha: "5", leo: "5", "සිංහ": "5",
  kanya: "6", virgo: "6", "කන්‍යා": "6",
  thula: "7", tula: "7", libra: "7", "තුලා": "7",
  vrushchika: "8", vrischika: "8", scorpio: "8", "වෘශ්චික": "8",
  dhanu: "9", sagittarius: "9", "ධනු": "9",
  makara: "10", capricorn: "10", "මකර": "10",
  kumbha: "11", aquarius: "11", "කුම්භ": "11",
  meena: "12", pisces: "12", "මීන": "12",
};

/**
 * Robust parser for Sri Lankan NLB & DLB ticket payloads (1D/2D barcodes & OCR text)
 */
export function parseTicketText(rawText: string): ParsedTicketData {
  let nums: (number | string)[] = [];
  let extractedLetter = "";
  let extractedZodiac = "";
  let detectedLottery = "";
  let detectedDraw = "";
  let detectedDate = "";

  if (!rawText || typeof rawText !== "string") {
    return { numbers: [], letter: "", sourceMethod: "manual", rawText: "" };
  }

  const clean = rawText.trim();

  // 1. JSON parsing
  try {
    const p = JSON.parse(clean);
    if (Array.isArray(p)) {
      nums = p.map(Number);
    } else if (typeof p === "object" && p !== null) {
      if (Array.isArray(p.numbers)) nums = p.numbers.map(Number);
      else if (Array.isArray(p.nums)) nums = p.nums.map(Number);
      if (p.letter || p.l) extractedLetter = String(p.letter || p.l).toUpperCase();
      if (p.zodiac || p.lagna) extractedZodiac = String(p.zodiac || p.lagna);
      if (p.lottery || p.lottery_name || p.name) detectedLottery = String(p.lottery || p.lottery_name || p.name);
      if (p.draw || p.draw_number || p.drawNumber) detectedDraw = String(p.draw || p.draw_number || p.drawNumber);
      if (p.date || p.draw_date || p.drawDate) detectedDate = String(p.date || p.draw_date || p.drawDate);
    }
  } catch {}

  // 2. URL parsing (NLB / DLB verify URLs)
  if (nums.length === 0 && (clean.includes("http://") || clean.includes("https://") || clean.includes("?"))) {
    try {
      const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
      const qNums = url.searchParams.get("numbers") || url.searchParams.get("nums") || url.searchParams.get("n");
      const qLetter = url.searchParams.get("letter") || url.searchParams.get("l");
      const qZodiac = url.searchParams.get("zodiac") || url.searchParams.get("lagna");
      const qDraw = url.searchParams.get("draw") || url.searchParams.get("d");
      const qLottery = url.searchParams.get("lottery") || url.searchParams.get("lot");
      const qDate = url.searchParams.get("date");
      if (qNums) nums = qNums.split(/[,-]+/).map(Number);
      if (qLetter) extractedLetter = qLetter.toUpperCase();
      if (qZodiac) extractedZodiac = qZodiac;
      if (qDraw) detectedDraw = qDraw;
      if (qLottery) detectedLottery = qLottery;
      if (qDate) detectedDate = qDate;
    } catch {}
  }

  // 3. Delimited text (e.g. NLB|4552|Govisetha|3,13,47,50|I or DLB-AK-3110-29,53,55,61-U)
  if (nums.length === 0) {
    const parts = clean.split(/[|#;,]+/);
    for (const part of parts) {
      const pTrim = part.trim();
      for (const l of LOTTERIES) {
        if (pTrim.toLowerCase().includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(pTrim.toLowerCase())) {
          detectedLottery = l.name;
        }
      }
      if (/[0-9]+[ ,-]+[0-9]+/.test(pTrim)) {
        const subNums = pTrim.split(/[ ,-]+/).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 99);
        if (subNums.length >= 2) nums = subNums;
      } else if (/^[A-Za-z]$/.test(pTrim)) {
        extractedLetter = pTrim.toUpperCase();
      } else if (/^\d{3,5}$/.test(pTrim) && !detectedDraw) {
        detectedDraw = pTrim;
      }
    }
  }

  // 4. Compact 1D Barcode formats (e.g. AK-3110-29-53-55-61-U or GS-4552-3-13-47-50-D)
  if (nums.length === 0) {
    // Check known lottery abbreviations
    const codePattern = /(?:(NLB|DLB)-)?([A-Z]{2,4})-?(\d{3,5})-([0-9,-]+)-?([A-Z])?/i;
    const matchCode = clean.match(codePattern);
    if (matchCode) {
      const abbr = matchCode[2].toUpperCase();
      const draw = matchCode[3];
      const numbersPart = matchCode[4];
      const letterPart = matchCode[5];

      detectedDraw = draw;
      if (letterPart) extractedLetter = letterPart.toUpperCase();
      
      const subNums = numbersPart.split(/[,-]+/).map(Number).filter(n => !isNaN(n));
      if (subNums.length >= 2) nums = subNums;

      // Abbreviation to lottery
      if (abbr === "AK") detectedLottery = "Ada Kotipathi";
      else if (abbr === "GS") detectedLottery = "Govisetha";
      else if (abbr === "MS") detectedLottery = "Mahajana Sampatha";
      else if (abbr === "MP") detectedLottery = "Mega Power";
      else if (abbr === "SH" || abbr === "SN") detectedLottery = "Shanida";
      else if (abbr === "LW") detectedLottery = "Lagna Wasanawa";
      else if (abbr === "KP") detectedLottery = "Kapruka";
      else if (abbr === "SB") detectedLottery = "Super Ball";
      else if (abbr === "SS") detectedLottery = "Sasiri";
      else if (abbr === "DN") detectedLottery = "Dhana Nidhanaya";
      else if (abbr === "HH") detectedLottery = "Handahana";
      else if (abbr === "AS") detectedLottery = "Ada Sampatha";
    }
  }

  // 5. Multi-line OCR Text Analysis (Tesseract OCR Output)
  if (nums.length === 0 || !detectedLottery) {
    const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
    const fullLower = clean.toLowerCase();

    // Check Lottery Name
    for (const l of LOTTERIES) {
      if (fullLower.includes(l.name.toLowerCase())) {
        detectedLottery = l.name;
        break;
      }
    }
    // Sinhala phonetic fallback
    if (!detectedLottery) {
      if (fullLower.includes("govisetha") || clean.includes("ගොවිසෙත")) detectedLottery = "Govisetha";
      else if (fullLower.includes("mahajana") || clean.includes("මහජන")) detectedLottery = "Mahajana Sampatha";
      else if (fullLower.includes("kotipathi") || clean.includes("කෝටිපති")) detectedLottery = "Ada Kotipathi";
      else if (fullLower.includes("shanida") || clean.includes("ශනිදා")) detectedLottery = "Shanida";
      else if (fullLower.includes("lagna") || clean.includes("ලග්න")) detectedLottery = "Lagna Wasanawa";
      else if (fullLower.includes("mega power") || clean.includes("මෙගා")) detectedLottery = "Mega Power";
      else if (fullLower.includes("handahana") || clean.includes("හඳහන")) detectedLottery = "Handahana";
      else if (fullLower.includes("kapruka") || clean.includes("කප්රුක")) detectedLottery = "Kapruka";
      else if (fullLower.includes("super ball") || clean.includes("සුපර්")) detectedLottery = "Super Ball";
      else if (fullLower.includes("sasiri") || clean.includes("සසිරි")) detectedLottery = "Sasiri";
      else if (fullLower.includes("dhana") || clean.includes("නිධානය")) detectedLottery = "Dhana Nidhanaya";
      else if (fullLower.includes("ada sampatha") || clean.includes("අද සම්පත")) detectedLottery = "Ada Sampatha";
    }

    // Check Zodiac/Lagna
    for (const [zKey, zVal] of Object.entries(ZODIAC_MAP)) {
      if (fullLower.includes(zKey)) {
        extractedZodiac = zVal;
        break;
      }
    }

    // Check Draw Date
    const dateMatch = clean.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})|(\d{2}[-/.]\d{2}[-/.]\d{4})/);
    if (dateMatch) {
      const dStr = dateMatch[0].replace(/\//g, "-").replace(/\./g, "-");
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) detectedDate = dStr;
      else if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
        const parts = dStr.split("-");
        detectedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Check Draw Number
    const drawMatch = clean.match(/(?:draw|no|වාරය|draw\s*no)[\s.:#-]*(\d{3,5})/i);
    if (drawMatch) detectedDraw = drawMatch[1];

    // Find ticket numbers line (e.g. "D 06 23 45 56 78" or "29 53 55 61" or "6 6 0 6 4 7")
    for (const line of lines) {
      // Line with English letter + 4-5 two-digit numbers
      const letterAndNumsMatch = line.match(/\b([A-Za-z])\b[\s,-]+(\d{1,2})[\s,-]+(\d{1,2})[\s,-]+(\d{1,2})[\s,-]+(\d{1,2})(?:[\s,-]+(\d{1,2}))?/);
      if (letterAndNumsMatch) {
        extractedLetter = letterAndNumsMatch[1].toUpperCase();
        nums = letterAndNumsMatch.slice(2).filter(Boolean).map(Number);
        break;
      }

      // 4 to 6 two-digit numbers (00-99)
      const numSequenceMatch = line.match(/\b(\d{1,2})[\s,-]+(\d{1,2})[\s,-]+(\d{1,2})[\s,-]+(\d{1,2})(?:[\s,-]+(\d{1,2}))?(?:[\s,-]+(\d{1,2}))?\b/);
      if (numSequenceMatch) {
        const extracted = numSequenceMatch.slice(1).filter(Boolean).map(Number);
        // Exclude year-like or price numbers
        if (extracted.length >= 4 && !extracted.some(n => n > 99)) {
          nums = extracted;
          // Check if there is a trailing or leading letter
          const trailingLetter = line.match(/\b([A-Za-z])\b/);
          if (trailingLetter) extractedLetter = trailingLetter[1].toUpperCase();
          break;
        }
      }
    }
  }

  // 6. Space / delimiter separated numbers fallback (e.g. "29 53 55 61 U")
  if (nums.length === 0) {
    const tokens = clean.split(/[\s,/|:_-]+/);
    for (const t of tokens) {
      const trimmed = t.trim();
      if (/^[A-Za-z]$/.test(trimmed)) {
        if (!extractedLetter) extractedLetter = trimmed.toUpperCase();
      } else if (/^\d{1,2}$/.test(trimmed)) {
        const n = Number(trimmed);
        if (n >= 0 && n <= 99) nums.push(n);
      }
    }
  }

  // 7. Compact string pattern like "D660647" or "29535561U" or "455203134750"
  if (nums.length === 0) {
    const matchLeading = clean.match(/^([A-Za-z])(\d{4,9})$/);
    if (matchLeading) {
      extractedLetter = matchLeading[1].toUpperCase();
      nums = matchLeading[2].split("").map(Number);
    }
    const matchTrailing = clean.match(/^(\d{4,9})([A-Za-z])$/);
    if (matchTrailing) {
      extractedLetter = matchTrailing[2].toUpperCase();
      nums = matchTrailing[1].split("").map(Number);
    }
  }

  return {
    numbers: nums.filter((n) => !isNaN(Number(n)) && Number(n) >= 0),
    letter: extractedLetter,
    zodiac: extractedZodiac,
    lotteryName: detectedLottery,
    drawNumber: detectedDraw,
    drawDate: detectedDate,
    sourceMethod: "barcode_detector",
    rawText: clean
  };
}

/**
 * Decode canvas using ZXing MultiFormatReader directly from RGBLuminanceSource
 */
function decodeCanvasWithZXing(canvas: HTMLCanvasElement): string | null {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const len = canvas.width * canvas.height;
    const luminances = new Uint8ClampedArray(len);
    const data = imgData.data;
    for (let i = 0; i < len; i++) {
      const offset = i * 4;
      luminances[i] = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
    }

    const luminanceSource = new RGBLuminanceSource(luminances, canvas.width, canvas.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.EAN_13,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.PDF_417,
      BarcodeFormat.CODE_93
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    const result = reader.decode(binaryBitmap, hints);
    if (result && result.getText()) {
      return result.getText();
    }
  } catch {}
  return null;
}

/**
 * Create rotated or cropped canvas copy
 */
function createTransformedCanvas(
  src: HTMLCanvasElement | HTMLImageElement,
  angleDeg: number = 0,
  crop?: { x: number; y: number; w: number; h: number },
  contrast: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const sW = crop ? crop.w : (src instanceof HTMLCanvasElement ? src.width : src.naturalWidth || src.width);
  const sH = crop ? crop.h : (src instanceof HTMLCanvasElement ? src.height : src.naturalHeight || src.height);
  const sX = crop ? crop.x : 0;
  const sY = crop ? crop.y : 0;

  if (angleDeg === 90 || angleDeg === 270) {
    canvas.width = sH;
    canvas.height = sW;
  } else {
    canvas.width = sW;
    canvas.height = sH;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (angleDeg === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (angleDeg === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (angleDeg === 270) {
    ctx.translate(0, canvas.height);
    ctx.rotate((270 * Math.PI) / 180);
  }

  ctx.drawImage(src, sX, sY, sW, sH, 0, 0, sW, sH);
  ctx.restore();

  // Contrast enhancement filter
  if (contrast) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      // High-contrast binarization
      const val = lum < 128 ? Math.max(0, lum * 0.7) : Math.min(255, lum * 1.3);
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

/**
 * Multi-Engine image scanner that processes full ticket photos, barcodes, QR codes, and OCR text
 */
export async function scanTicketImage(
  img: HTMLImageElement,
  onProgress?: (msg: string) => void
): Promise<ParsedTicketData | null> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // ─── 1. Native Hardware BarcodeDetector (Fastest & Most Accurate in Chrome/Android) ───
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    onProgress?.("Scanning with hardware barcode detector...");
    try {
      const formats = ((await (window as any).BarcodeDetector.getSupportedFormats?.()) || [
        "qr_code", "code_128", "code_39", "ean_13", "data_matrix", "itf"
      ]).filter(Boolean);
      const detector = new (window as any).BarcodeDetector({ formats });
      const detected = await detector.detect(img);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        const parsed = parseTicketText(detected[0].rawValue);
        if (parsed.numbers.length > 0 || parsed.letter || parsed.zodiac) {
          parsed.sourceMethod = "barcode_detector";
          return parsed;
        }
      }
    } catch (err) {
      console.warn("BarcodeDetector pass notice:", err);
    }
  }

  // ─── 2. Multi-Pass ZXing Barcode Engine (Rotations, Strips, Thresholds) ───
  onProgress?.("Decoding 1D barcodes & 2D QR codes...");

  // Base canvas
  const baseCanvas = document.createElement("canvas");
  const maxDim = Math.max(w, h);
  const targetMax = Math.min(maxDim, 1400);
  const scale = targetMax / maxDim;
  baseCanvas.width = Math.round(w * scale);
  baseCanvas.height = Math.round(h * scale);
  const baseCtx = baseCanvas.getContext("2d", { willReadFrequently: true });
  if (baseCtx) {
    baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

    // Try ZXing on full image (0°, 90°, 180°, 270°)
    for (const angle of [0, 90, 180, 270]) {
      const transformed = angle === 0 ? baseCanvas : createTransformedCanvas(baseCanvas, angle);
      const decoded = decodeCanvasWithZXing(transformed);
      if (decoded) {
        const parsed = parseTicketText(decoded);
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "zxing";
          return parsed;
        }
      }
    }

    // Try Horizontal Barcode Strips (Bottom 40%, Top 40%, Center 50%)
    const bW = baseCanvas.width;
    const bH = baseCanvas.height;
    const strips = [
      { x: 0, y: Math.round(bH * 0.6), w: bW, h: Math.round(bH * 0.4) }, // Bottom 40% (1D Barcode)
      { x: 0, y: 0, w: bW, h: Math.round(bH * 0.4) },                   // Top 40%
      { x: 0, y: Math.round(bH * 0.25), w: bW, h: Math.round(bH * 0.5) },// Center 50%
      { x: Math.round(bW * 0.5), y: Math.round(bH * 0.5), w: Math.round(bW * 0.5), h: Math.round(bH * 0.5) }, // Bottom Right (QR)
      { x: 0, y: Math.round(bH * 0.5), w: Math.round(bW * 0.5), h: Math.round(bH * 0.5) },                     // Bottom Left
    ];

    for (const strip of strips) {
      const stripCanvas = createTransformedCanvas(baseCanvas, 0, strip, true);
      const decoded = decodeCanvasWithZXing(stripCanvas);
      if (decoded) {
        const parsed = parseTicketText(decoded);
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "zxing";
          return parsed;
        }
      }
    }
  }

  // ─── 3. Multi-Crop JSQR Engine ───
  onProgress?.("Scanning ticket regions with QR detector...");
  const scanWithJSQR = (c: HTMLCanvasElement): string | null => {
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    try {
      const res = jsQR(imgData.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
      if (res?.data) return res.data;
    } catch {}
    return null;
  };

  if (baseCtx) {
    for (const angle of [0, 90, 270]) {
      const rotated = angle === 0 ? baseCanvas : createTransformedCanvas(baseCanvas, angle);
      const qrData = scanWithJSQR(rotated);
      if (qrData) {
        const parsed = parseTicketText(qrData);
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "jsqr";
          return parsed;
        }
      }
    }
  }

  // ─── 4. High-Precision OCR Text Recognition (Tesseract.js) ───
  onProgress?.("Reading printed ticket numbers & Lagna with OCR...");
  try {
    const worker = await createWorker("eng");
    const ocrCanvas = document.createElement("canvas");
    const ocrScale = Math.min(1600 / Math.max(w, h), 1.5);
    ocrCanvas.width = Math.round(w * ocrScale);
    ocrCanvas.height = Math.round(h * ocrScale);
    const ocrCtx = ocrCanvas.getContext("2d");
    if (ocrCtx) {
      ocrCtx.drawImage(img, 0, 0, ocrCanvas.width, ocrCanvas.height);
      const ret = await worker.recognize(ocrCanvas);
      await worker.terminate();

      if (ret?.data?.text) {
        const parsed = parseTicketText(ret.data.text);
        if (parsed.numbers.length >= 2 || parsed.letter || parsed.zodiac) {
          parsed.sourceMethod = "ocr";
          return parsed;
        }
      }
    }
  } catch (ocrErr) {
    console.warn("OCR engine notice:", ocrErr);
  }

  return null;
}
