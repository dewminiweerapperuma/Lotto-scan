import jsQR from "jsqr";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { createWorker } from "tesseract.js";
import { LOTTERIES } from "./constants";

export interface ParsedTicketData {
  numbers: (number | string)[];
  letter?: string;
  lotteryName?: string;
  drawNumber?: string;
  sourceMethod: "barcode_detector" | "zxing" | "jsqr" | "ocr" | "manual";
  rawText?: string;
}

/**
 * Robust parser for Sri Lankan NLB & DLB ticket payloads
 */
export function parseTicketText(rawText: string): ParsedTicketData {
  let nums: (number | string)[] = [];
  let extractedLetter = "";
  let detectedLottery = "";
  let detectedDraw = "";

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
      if (p.lottery || p.lottery_name || p.name) detectedLottery = String(p.lottery || p.lottery_name || p.name);
      if (p.draw || p.draw_number || p.drawNumber) detectedDraw = String(p.draw || p.draw_number || p.drawNumber);
    }
  } catch {}

  // 2. URL parsing (NLB / DLB verify URLs)
  if (nums.length === 0 && (clean.includes("http://") || clean.includes("https://") || clean.includes("?"))) {
    try {
      const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
      const qNums = url.searchParams.get("numbers") || url.searchParams.get("nums") || url.searchParams.get("n");
      const qLetter = url.searchParams.get("letter") || url.searchParams.get("l");
      const qDraw = url.searchParams.get("draw") || url.searchParams.get("d");
      const qLottery = url.searchParams.get("lottery") || url.searchParams.get("lot");
      if (qNums) nums = qNums.split(/[,-]+/).map(Number);
      if (qLetter) extractedLetter = qLetter.toUpperCase();
      if (qDraw) detectedDraw = qDraw;
      if (qLottery) detectedLottery = qLottery;
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

  // 4. Space / delimiter separated numbers with letter (e.g. "D 06 06 00 06 04 07" or "29 53 55 61 U")
  if (nums.length === 0) {
    const tokens = clean.split(/[\s,/|:_-]+/);
    for (const t of tokens) {
      const trimmed = t.trim();
      if (/^[A-Za-z]$/.test(trimmed)) {
        extractedLetter = trimmed.toUpperCase();
      } else if (/^\d{1,2}$/.test(trimmed)) {
        nums.push(Number(trimmed));
      }
    }
  }

  // 5. Compact string pattern like "D660647" or "U039966" or "29535561U"
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
    lotteryName: detectedLottery,
    drawNumber: detectedDraw,
    sourceMethod: "barcode_detector",
    rawText: clean
  };
}

/**
 * Multi-Engine image scanner that processes full ticket photos, barcodes, QR codes, and OCR text
 */
export async function scanTicketImage(
  img: HTMLImageElement,
  onProgress?: (msg: string) => void
): Promise<ParsedTicketData | null> {
  // ─── 1. Native Hardware BarcodeDetector ───
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    onProgress?.("Scanning with hardware barcode detector...");
    try {
      const formats = ((await (window as any).BarcodeDetector.getSupportedFormats?.()) || ["qr_code"]).filter(Boolean);
      const detector = new (window as any).BarcodeDetector({
        formats: formats.length ? formats : ["qr_code", "code_128", "code_39", "ean_13", "data_matrix"]
      });
      const detected = await detector.detect(img);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        const parsed = parseTicketText(detected[0].rawValue);
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "barcode_detector";
          return parsed;
        }
      }
    } catch (err) {
      console.warn("BarcodeDetector pass notice:", err);
    }
  }

  // ─── 2. ZXing Multi-Format Engine (1D Barcodes + 2D QR + DataMatrix) ───
  onProgress?.("Scanning with multi-format barcode engine...");
  try {
    const reader = new BrowserMultiFormatReader();
    // Scan full image
    try {
      const result = await reader.decodeFromImageElement(img);
      if (result && result.getText()) {
        const parsed = parseTicketText(result.getText());
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "zxing";
          return parsed;
        }
      }
    } catch (e) {
      // Not found on full image, continue to quadrant crops
    }
  } catch (err) {
    console.warn("ZXing initialization notice:", err);
  }

  // ─── 3. Multi-Crop & Multi-Pass JSQR Scan ───
  onProgress?.("Scanning ticket regions & QR quiet zones...");
  const scanCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number): string | null => {
    const imgData = ctx.getImageData(0, 0, w, h);
    try {
      const res = jsQR(imgData.data, w, h, { inversionAttempts: "attemptBoth" });
      if (res?.data) return res.data;
    } catch {}

    // Binarization pass
    const data = imgData.data;
    let totalLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    const avgThreshold = totalLum / (data.length / 4);
    const binarized = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      binarized[i] = lum > avgThreshold * 0.92 ? 255 : 0;
      binarized[i + 1] = binarized[i];
      binarized[i + 2] = binarized[i];
      binarized[i + 3] = 255;
    }
    try {
      const resBin = jsQR(binarized, w, h, { inversionAttempts: "attemptBoth" });
      if (resBin?.data) return resBin.data;
    } catch {}

    return null;
  };

  // Scaled whole image canvas
  const canvas = document.createElement("canvas");
  let scale = 1;
  if (img.width < 600 || img.height < 600) scale = Math.max(600 / img.width, 600 / img.height);
  else if (img.width > 1600 || img.height > 1600) scale = Math.min(1600 / img.width, 1600 / img.height);
  const sw = Math.round(img.width * scale);
  const sh = Math.round(img.height * scale);
  const pad = Math.max(30, Math.round(sw * 0.15));
  canvas.width = sw + pad * 2;
  canvas.height = sh + pad * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad, pad, sw, sh);

    const fullStr = scanCanvas(ctx, canvas.width, canvas.height);
    if (fullStr) {
      const parsed = parseTicketText(fullStr);
      if (parsed.numbers.length > 0 || parsed.letter) {
        parsed.sourceMethod = "jsqr";
        return parsed;
      }
    }
  }

  // 4 Quadrants & Center crops
  const regions = [
    { x: img.width * 0.4, y: img.height * 0.4, w: img.width * 0.6, h: img.height * 0.6 }, // Bottom Right
    { x: 0, y: img.height * 0.4, w: img.width * 0.6, h: img.height * 0.6 },                // Bottom Left
    { x: img.width * 0.4, y: 0, w: img.width * 0.6, h: img.height * 0.6 },                // Top Right
    { x: 0, y: 0, w: img.width * 0.6, h: img.height * 0.6 },                              // Top Left
    { x: img.width * 0.2, y: img.height * 0.2, w: img.width * 0.6, h: img.height * 0.6 }, // Center
  ];

  for (const r of regions) {
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = 600;
    cropCanvas.height = 600;
    const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
    if (cropCtx) {
      cropCtx.fillStyle = "#FFFFFF";
      cropCtx.fillRect(0, 0, 600, 600);
      cropCtx.drawImage(img, r.x, r.y, r.w, r.h, 40, 40, 520, 520);
      const cropStr = scanCanvas(cropCtx, 600, 600);
      if (cropStr) {
        const parsed = parseTicketText(cropStr);
        if (parsed.numbers.length > 0 || parsed.letter) {
          parsed.sourceMethod = "jsqr";
          return parsed;
        }
      }
    }
  }

  // ─── 4. OCR Optical Character Recognition Fallback (Tesseract.js) ───
  onProgress?.("Reading printed ticket numbers with OCR...");
  try {
    const worker = await createWorker("eng");
    const ocrCanvas = document.createElement("canvas");
    const ocrScale = Math.min(1200 / Math.max(img.width, img.height), 1);
    ocrCanvas.width = Math.round(img.width * ocrScale);
    ocrCanvas.height = Math.round(img.height * ocrScale);
    const ocrCtx = ocrCanvas.getContext("2d");
    if (ocrCtx) {
      ocrCtx.drawImage(img, 0, 0, ocrCanvas.width, ocrCanvas.height);
      const ret = await worker.recognize(ocrCanvas);
      await worker.terminate();

      if (ret?.data?.text) {
        const parsed = parseTicketText(ret.data.text);
        if (parsed.numbers.length >= 2) {
          parsed.sourceMethod = "ocr";
          return parsed;
        }
      }
    }
  } catch (ocrErr) {
    console.warn("OCR fallback attempt notice:", ocrErr);
  }

  return null;
}
