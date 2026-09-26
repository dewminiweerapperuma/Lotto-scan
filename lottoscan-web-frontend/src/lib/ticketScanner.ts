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
import { parseLotteryQR } from "./qrParser";

export interface ParsedTicketData {
  numbers: (number | string)[];
  letter?: string;
  zodiac?: string;
  zodiac2?: string;
  zodiacSigns?: string[];
  lotteryName?: string;
  drawNumber?: string;
  drawDate?: string;
  serialNumber?: string;
  promotionalNumber?: string;
  isFutureDraw?: boolean;
  board?: "NLB" | "DLB";
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
 * Check if a decoded barcode/QR value is a pure serial number or pure verification URL
 * without any lottery metadata or ticket numbers.
 */
export function isSerialOrVerificationData(rawText: string): boolean {
  if (!rawText || typeof rawText !== "string") return false;
  const clean = rawText.trim();
  const lower = clean.toLowerCase();

  // If it contains known lottery names or zodiacs, it is a rich QR payload, NOT a pure serial
  for (const l of LOTTERIES) {
    if (lower.includes(l.name.toLowerCase())) return false;
  }
  if (
    lower.includes("suba dawas") ||
    lower.includes("subadawasa") ||
    lower.includes("capricorn") ||
    lower.includes("aquarius") ||
    lower.includes("aries") ||
    lower.includes("taurus") ||
    lower.includes("gemini") ||
    lower.includes("cancer") ||
    lower.includes("leo") ||
    lower.includes("virgo") ||
    lower.includes("libra") ||
    lower.includes("scorpio") ||
    lower.includes("sagittarius") ||
    lower.includes("pisces")
  ) {
    return false;
  }

  // 1. Pure single URLs without numbers query parameters
  if (/^https?:\/\/[^\s]+$/i.test(clean) && !clean.includes("numbers=") && !clean.includes("nums=")) return true;
  if (/^r\.(nlb|dlb)\.lk[^\s]*$/i.test(clean)) return true;

  // 2. Pure single long numeric string (>10 digits) → serial number only
  if (/^\d{10,}$/.test(clean)) return true;

  // 3. Pure single alphanumeric serial pattern (e.g. "DLB1234567890123")
  if (/^(DLB|NLB|DL|NL)[A-Z0-9]{8,}$/i.test(clean)) return true;

  return false;
}

/**
 * Specialized parser for official Sri Lankan NLB & DLB Lottery QR code payloads.
 *
 * Example payload from physical ticket QR:
 * ```
 * SUBA DAWASA 0323 2026/06/03
 * 088003230343923 Capricorn Aquarius 01 14 61 9925
 * N r.nlb.lk
 * ```
 */
export function parseSriLankanLotteryQR(rawText: string): ParsedTicketData | null {
  if (!rawText || typeof rawText !== "string") return null;
  const clean = rawText.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Lottery Name
  let detectedLottery = "";
  if (lower.includes("suba dawas") || lower.includes("subadawasa") || lower.includes("සුබ දවස")) {
    detectedLottery = "Suba Dawasak";
  } else if (lower.includes("govisetha") || lower.includes("ගොවිසෙත")) {
    detectedLottery = "Govisetha";
  } else if (lower.includes("mahajana") || lower.includes("මහජන")) {
    detectedLottery = "Mahajana Sampatha";
  } else if (lower.includes("kotipathi") || lower.includes("කෝටිපති")) {
    detectedLottery = "Ada Kotipathi";
  } else if (lower.includes("shanida") || lower.includes("ශනිදා")) {
    detectedLottery = "Shanida Wasanawa";
  } else if (lower.includes("lagna") || lower.includes("ලග්න")) {
    detectedLottery = "Lagna Wasanawa";
  } else if (lower.includes("mega power") || lower.includes("මෙගා")) {
    detectedLottery = "Mega Power";
  } else if (lower.includes("handahana") || lower.includes("හඳහන")) {
    detectedLottery = "Handahana";
  } else if (lower.includes("kapruka") || lower.includes("කප්රුක")) {
    detectedLottery = "Kapruka";
  } else if (lower.includes("super ball") || lower.includes("සුපර්")) {
    detectedLottery = "Super Ball";
  } else if (lower.includes("sasiri") || lower.includes("සසිරි")) {
    detectedLottery = "Sasiri";
  } else if (lower.includes("dhana nidhanaya") || lower.includes("ධන නිධානය")) {
    detectedLottery = "Dhana Nidhanaya";
  } else if (lower.includes("ada sampatha") || lower.includes("අද සම්පත")) {
    detectedLottery = "Ada Sampatha";
  } else if (lower.includes("supiri dhana") || lower.includes("සුපිරි ධන")) {
    detectedLottery = "Supiri Dhana Sampatha";
  } else if (lower.includes("jaya sampatha") || lower.includes("nlb jaya") || lower.includes("ජය සම්පත")) {
    detectedLottery = "Jaya Sampatha";
  } else {
    for (const l of LOTTERIES) {
      if (lower.includes(l.name.toLowerCase())) {
        detectedLottery = l.name;
        break;
      }
    }
  }

  // If no lottery recognized and doesn't contain NLB/DLB markers, return null for fallback
  if (!detectedLottery && !lower.includes("nlb") && !lower.includes("dlb")) {
    return null;
  }

  // 2. Extract Draw Date (YYYY/MM/DD, YYYY-MM-DD, or DD/MM/YYYY)
  let detectedDate = "";
  const dateMatch = clean.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})|(\d{2}[-/.]\d{2}[-/.]\d{4})/);
  if (dateMatch) {
    const dStr = dateMatch[0].replace(/\//g, "-").replace(/\./g, "-");
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      detectedDate = dStr;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
      const parts = dStr.split("-");
      detectedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // 3. Extract Draw Number (e.g. "0323", "4559", "3117")
  let detectedDraw = "";
  const drawMatch = clean.match(/\b\d{3,5}\b/g);
  if (drawMatch) {
    // Find draw number (usually near lottery name or before date)
    for (const dm of drawMatch) {
      if (detectedDate && detectedDate.includes(dm)) continue;
      // Skip year like 2024, 2025, 2026
      if (dm === "2024" || dm === "2025" || dm === "2026" || dm === "2027") continue;
      detectedDraw = dm;
      break;
    }
  }

  // 4. Extract Zodiac Sign(s) (supports single or dual zodiacs e.g. Suba Dawasak)
  const foundZodiacs: Array<{ index: number; name: string }> = [];
  for (const [zKey, _zVal] of Object.entries(ZODIAC_MAP)) {
    const idx = lower.indexOf(zKey);
    if (idx !== -1) {
      const capName = zKey.charAt(0).toUpperCase() + zKey.slice(1);
      if (!foundZodiacs.some((fz) => fz.name.toLowerCase() === capName.toLowerCase())) {
        foundZodiacs.push({ index: idx, name: capName });
      }
    }
  }
  foundZodiacs.sort((a, b) => a.index - b.index);

  let extractedZodiac = "";
  let extractedZodiac2 = "";
  const extractedZodiacSigns: string[] = [];

  if (foundZodiacs.length > 0) {
    extractedZodiac = foundZodiacs[0].name;
    extractedZodiacSigns.push(extractedZodiac);
  }
  if (foundZodiacs.length > 1) {
    extractedZodiac2 = foundZodiacs[1].name;
    extractedZodiacSigns.push(extractedZodiac2);
  }

  // 5. Extract Letter (e.g. "N", "O", "P", "U", "W")
  let extractedLetter = "";
  const letterMatch = clean.match(/\b([A-Za-z])\b/g);
  if (letterMatch) {
    for (const lm of letterMatch) {
      const upper = lm.toUpperCase();
      // Skip single letters that might be part of URL artifacts or vowels unless valid
      extractedLetter = upper;
      break;
    }
  }

  // 6. Extract Lottery Numbers
  // Clean out the lottery name, date, draw number, 10-18 digit serial, URLs, and zodiacs
  let textForNums = clean;
  // Remove URLs
  textForNums = textForNums.replace(/https?:\/\/[^\s]+/gi, " ").replace(/r\.(nlb|dlb)\.lk[^\s]*/gi, " ");
  // Remove 10-18 digit serial number (e.g. 088003230343923 or NLB20230915...)
  textForNums = textForNums.replace(/\b\d{10,18}\b/g, " ").replace(/\b(NLB|DLB|NL|DL)[A-Z0-9]{8,}\b/gi, " ");
  // Remove date
  if (dateMatch) textForNums = textForNums.replace(dateMatch[0], " ");
  // Remove draw number
  if (detectedDraw) textForNums = textForNums.replace(new RegExp(`\\b${detectedDraw}\\b`), " ");
  // Remove zodiac names
  for (const zKey of Object.keys(ZODIAC_MAP)) {
    textForNums = textForNums.replace(new RegExp(`\\b${zKey}\\b`, "gi"), " ");
  }
  // Remove lottery name words
  if (detectedLottery) {
    const lotWords = detectedLottery.split(/\s+/);
    for (const lw of lotWords) {
      textForNums = textForNums.replace(new RegExp(`\\b${lw}\\b`, "gi"), " ");
    }
  }
  textForNums = textForNums.replace(/SUBA|DAWASA|DAWASAK|NLB|DLB/gi, " ");

  // Extract remaining number tokens
  const numTokens = textForNums.match(/\b\d{1,4}\b/g) || [];
  const validNums: number[] = [];

  // Determine expected count
  let targetCount = 4;
  if (detectedLottery === "Suba Dawasak" || detectedLottery === "Sasiri") {
    targetCount = 3;
  } else if (detectedLottery === "Mega Power" || detectedLottery === "Kapruka") {
    targetCount = 5;
  } else if (detectedLottery === "Mahajana Sampatha" || detectedLottery === "Supiri Dhana Sampatha") {
    targetCount = 6;
  } else if (detectedLottery === "Ada Sampatha") {
    targetCount = 9;
  }

  for (const t of numTokens) {
    const n = Number(t);
    // Ignore 4-digit trailing sequence codes (like 9925) if we already have sufficient numbers or if n > 99
    if (n >= 0 && n <= 99) {
      validNums.push(n);
    }
  }

  const finalNumbers = validNums.slice(0, targetCount);

  if (finalNumbers.length > 0 || extractedLetter || extractedZodiac || detectedLottery) {
    return {
      numbers: finalNumbers,
      letter: extractedLetter,
      zodiac: extractedZodiac,
      zodiac2: extractedZodiac2,
      zodiacSigns: extractedZodiacSigns,
      lotteryName: detectedLottery,
      drawNumber: detectedDraw,
      drawDate: detectedDate,
      sourceMethod: "barcode_detector",
      rawText: clean,
    };
  }

  return null;
}

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

  // 0. Try dedicated Sri Lankan Lottery QR parser FIRST
  const slQR = parseSriLankanLotteryQR(clean);
  if (slQR && (slQR.numbers.length > 0 || slQR.letter || slQR.zodiac || slQR.lotteryName)) {
    return slQR;
  }

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

  // 2. URL parsing (NLB / DLB verify URLs with explicit number params)
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

  // If this is a serial number or verification URL without explicit lottery number params,
  // do NOT continue to delimiter/token splitting fallbacks (which would extract false numbers from serials/URLs)
  if (nums.length === 0 && isSerialOrVerificationData(clean)) {
    return {
      numbers: [],
      letter: "",
      zodiac: "",
      lotteryName: "",
      drawNumber: "",
      drawDate: "",
      sourceMethod: "manual",
      rawText: clean
    };
  }

  // 3. Delimited text (e.g. NLB|4552|Govisetha|3,13,47,50|I or DLB-AK-3110-29,53,55,61-U)
  if (nums.length === 0) {
    const parts = clean.split(/[|#;]+/);
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
      else if (abbr === "SH" || abbr === "SN") detectedLottery = "Shanida Wasanawa";
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
      else if (fullLower.includes("shanida") || clean.includes("ශනිදා")) detectedLottery = "Shanida Wasanawa";
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
    if (nums.length === 0) {
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
          // Exclude year-like or price numbers (all numbers must be valid 0-99)
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
  }

  // 6. Clean space/comma separated numbers (only accept if on a single line or clear sequence of 4+ numbers)
  if (nums.length === 0) {
    const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const tokens = line.split(/[\s,/|:_-]+/).filter(Boolean);
      const lineNums: number[] = [];
      let lineLetter = "";
      for (const t of tokens) {
        if (/^[A-Za-z]$/.test(t) && !lineLetter) {
          lineLetter = t.toUpperCase();
        } else if (/^\d{1,2}$/.test(t)) {
          const n = Number(t);
          if (n >= 0 && n <= 99) lineNums.push(n);
        }
      }
      // Only accept if line contains at least 3-4 valid numbers (prevent accepting random stray OCR noise)
      if (lineNums.length >= 4 || (lineNums.length >= 3 && lineLetter)) {
        nums = lineNums;
        if (lineLetter && !extractedLetter) extractedLetter = lineLetter;
        break;
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
export function decodeCanvasWithZXing(canvas: HTMLCanvasElement): string | null {
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
 * Try to decode a barcode/QR from the image and validate it contains actual ticket numbers
 * (not a serial number or verification URL).
 * Returns parsed data only if it contains meaningful lottery numbers.
 */
function tryDecodeBarcodePayload(decoded: string, sourceMethod: ParsedTicketData["sourceMethod"]): ParsedTicketData | null {
  if (!decoded) return null;

  // 1. Try dedicated high-precision QR tokenization engine
  const qr = parseLotteryQR(decoded);
  if (qr.isValid && qr.primaryNumbers.length > 0) {
    return {
      lotteryName: qr.lotteryName,
      drawNumber: qr.drawNumber,
      drawDate: qr.drawDate,
      numbers: qr.primaryNumbers,
      letter: qr.letter || (qr.zodiac ? (qr.zodiac.nameEn || qr.zodiac.transliteration) : undefined),
      zodiac: qr.zodiac ? (qr.zodiac.nameEn || qr.zodiac.transliteration) : undefined,
      zodiac2: qr.zodiac2 ? (qr.zodiac2.nameEn || qr.zodiac2.transliteration) : undefined,
      zodiacSigns: qr.zodiacSigns ? qr.zodiacSigns.map((z) => z.nameEn || z.transliteration) : undefined,
      serialNumber: qr.serialNumber,
      promotionalNumber: qr.promotionalNumber,
      isFutureDraw: qr.isFutureDraw,
      board: qr.board,
      sourceMethod,
      rawText: decoded,
    };
  }

  // 2. Skip serial numbers and verification URLs
  if (isSerialOrVerificationData(decoded)) {
    console.log(`[TicketScanner] Skipping serial/URL barcode data: "${decoded.slice(0, 60)}..."`);
    return null;
  }

  const parsed = parseTicketText(decoded);
  if (parsed.numbers.length > 0 || parsed.letter || parsed.zodiac) {
    parsed.sourceMethod = sourceMethod;
    return parsed;
  }

  return null;
}

/**
 * Multi-Engine image scanner that processes full ticket photos, barcodes, QR codes, and OCR text.
 *
 * IMPORTANT: Sri Lankan NLB/DLB lottery ticket QR codes and barcodes typically contain
 * serial numbers or verification URLs — NOT the actual lottery numbers printed on the ticket.
 * This scanner prioritizes OCR for reading the printed numbers from ticket photos,
 * and only uses barcode data if it matches known ticket payload formats.
 */
export async function scanTicketImage(
  img: HTMLImageElement,
  onProgress?: (msg: string) => void
): Promise<ParsedTicketData | null> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // Prepare base canvas for all engines
  const baseCanvas = document.createElement("canvas");
  const maxDim = Math.max(w, h);
  const targetMax = Math.min(maxDim, 1400);
  const scale = targetMax / maxDim;
  baseCanvas.width = Math.round(w * scale);
  baseCanvas.height = Math.round(h * scale);
  const baseCtx = baseCanvas.getContext("2d", { willReadFrequently: true });
  if (baseCtx) {
    baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);
  }

  // ─── STEP 1: Try barcode/QR decoding across multiple regions, rotations, and contrast modes ───
  let barcodeResult: ParsedTicketData | null = null;

  // 1a. Native Hardware BarcodeDetector API (check ALL detected symbols)
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    onProgress?.("Scanning with hardware barcode detector...");
    try {
      const formats = ((await (window as any).BarcodeDetector.getSupportedFormats?.()) || [
        "qr_code", "code_128", "code_39", "ean_13", "data_matrix", "itf"
      ]).filter(Boolean);
      const detector = new (window as any).BarcodeDetector({ formats });
      const detected = await detector.detect(img);
      if (detected && detected.length > 0) {
        for (const item of detected) {
          if (item.rawValue) {
            barcodeResult = tryDecodeBarcodePayload(item.rawValue, "barcode_detector");
            if (barcodeResult) return barcodeResult;
          }
        }
      }
    } catch (err) {
      console.warn("BarcodeDetector pass notice:", err);
    }
  }

  // 1b. Multi-Region jsQR & ZXing Scanner (Rotations [0, 180, 90, 270] + Binarization)
  if (baseCtx) {
    onProgress?.("Scanning ticket QR codes & barcodes...");

    // Helper to decode a canvas with jsQR and threshold variants
    const scanCanvasQR = (c: HTMLCanvasElement): string | null => {
      const cCtx = c.getContext("2d", { willReadFrequently: true });
      if (!cCtx) return null;
      const imgData = cCtx.getImageData(0, 0, c.width, c.height);

      // 1. Raw jsQR pass
      try {
        const res = jsQR(imgData.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
        if (res?.data) return res.data;
      } catch {}

      // 2. ZXing pass
      const zText = decodeCanvasWithZXing(c);
      if (zText) return zText;

      // 3. Thresholded passes for low-contrast or noisy ticket QR prints
      for (const thresh of [110, 130, 150, 90]) {
        const binCanvas = document.createElement("canvas");
        binCanvas.width = c.width;
        binCanvas.height = c.height;
        const bCtx = binCanvas.getContext("2d");
        if (!bCtx) continue;
        const copyData = cCtx.getImageData(0, 0, c.width, c.height);
        const d = copyData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (d[i] + d[i + 1] + d[i + 2]) / 3 < thresh ? 0 : 255;
          d[i] = v; d[i + 1] = v; d[i + 2] = v;
        }
        bCtx.putImageData(copyData, 0, 0);

        try {
          const binRes = jsQR(copyData.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
          if (binRes?.data) return binRes.data;
        } catch {}

        const binZText = decodeCanvasWithZXing(binCanvas);
        if (binZText) return binZText;
      }

      return null;
    };

    // Candidate regions on Sri Lankan lottery tickets
    const qrRegions = [
      // 1. Full image
      { x: 0, y: 0, w: baseCanvas.width, h: baseCanvas.height, scales: [1, 2] },
      // 2. Bottom half (where QR codes are on 90% of NLB & DLB tickets)
      { x: 0, y: Math.round(baseCanvas.height * 0.4), w: baseCanvas.width, h: Math.round(baseCanvas.height * 0.6), scales: [1, 2] },
      // 3. Bottom-center / right (common NLB Suba Dawasak / Govisetha position)
      {
        x: Math.round(baseCanvas.width * 0.2),
        y: Math.round(baseCanvas.height * 0.45),
        w: Math.round(baseCanvas.width * 0.65),
        h: Math.round(baseCanvas.height * 0.4),
        scales: [1, 2, 3]
      },
      // 4. Bottom-left / middle
      {
        x: 0,
        y: Math.round(baseCanvas.height * 0.45),
        w: Math.round(baseCanvas.width * 0.6),
        h: Math.round(baseCanvas.height * 0.45),
        scales: [1, 2]
      },
      // 5. Right half
      {
        x: Math.round(baseCanvas.width * 0.4),
        y: 0,
        w: Math.round(baseCanvas.width * 0.6),
        h: baseCanvas.height,
        scales: [1, 2]
      }
    ];

    const angles = [0, 180, 90, 270];

    for (const reg of qrRegions) {
      for (const scale of reg.scales) {
        for (const angle of angles) {
          const regionCanvas = document.createElement("canvas");
          const targetW = reg.w * scale;
          const targetH = reg.h * scale;

          if (angle === 0 || angle === 180) {
            regionCanvas.width = targetW;
            regionCanvas.height = targetH;
          } else {
            regionCanvas.width = targetH;
            regionCanvas.height = targetW;
          }

          const rCtx = regionCanvas.getContext("2d");
          if (!rCtx) continue;
          rCtx.imageSmoothingEnabled = false;
          rCtx.translate(regionCanvas.width / 2, regionCanvas.height / 2);
          rCtx.rotate((angle * Math.PI) / 180);

          if (angle === 0 || angle === 180) {
            rCtx.drawImage(baseCanvas, reg.x, reg.y, reg.w, reg.h, -targetW / 2, -targetH / 2, targetW, targetH);
          } else {
            rCtx.drawImage(baseCanvas, reg.x, reg.y, reg.w, reg.h, -targetH / 2, -targetW / 2, targetH, targetW);
          }

          const decoded = scanCanvasQR(regionCanvas);
          if (decoded) {
            barcodeResult = tryDecodeBarcodePayload(decoded, "jsqr");
            if (barcodeResult) return barcodeResult;
          }
        }
      }
    }
  }

  // ─── STEP 2: OCR — Read printed numbers from the ticket image ───
  // This is the PRIMARY method for Sri Lankan NLB/DLB physical ticket photos,
  // since the QR codes on these tickets contain serial data, not lottery numbers.
  onProgress?.("Reading printed ticket numbers with OCR...");
  try {
    const worker = await createWorker("eng");

    // Try multiple image regions for OCR: full image, then targeted zones
    const ocrRegions = [
      // Full image
      { x: 0, y: 0, w, h, label: "full" },
      // Center-bottom area (where most lottery tickets print their numbers)
      { x: Math.round(w * 0.05), y: Math.round(h * 0.3), w: Math.round(w * 0.9), h: Math.round(h * 0.5), label: "center" },
      // Bottom half (numbers are commonly at the bottom)
      { x: 0, y: Math.round(h * 0.5), w, h: Math.round(h * 0.5), label: "bottom" },
      // Top half
      { x: 0, y: 0, w, h: Math.round(h * 0.5), label: "top" },
    ];

    let bestOcrResult: ParsedTicketData | null = null;

    for (const region of ocrRegions) {
      const ocrCanvas = document.createElement("canvas");
      // Scale up small regions for better OCR accuracy
      const ocrScale = Math.min(1800 / Math.max(region.w, region.h), 2.0);
      ocrCanvas.width = Math.round(region.w * ocrScale);
      ocrCanvas.height = Math.round(region.h * ocrScale);
      const ocrCtx = ocrCanvas.getContext("2d");
      if (!ocrCtx) continue;

      // Draw with white background for better OCR contrast
      ocrCtx.fillStyle = "#FFFFFF";
      ocrCtx.fillRect(0, 0, ocrCanvas.width, ocrCanvas.height);
      ocrCtx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, ocrCanvas.width, ocrCanvas.height);

      // Enhance contrast for OCR
      const enhancedData = ocrCtx.getImageData(0, 0, ocrCanvas.width, ocrCanvas.height);
      const d = enhancedData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        // Sharpen: high-contrast binarization for printed text
        const val = gray < 140 ? 0 : 255;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
      ocrCtx.putImageData(enhancedData, 0, 0);

      try {
        const ret = await worker.recognize(ocrCanvas);
        if (ret?.data?.text) {
          console.log(`[TicketScanner] OCR (${region.label}): "${ret.data.text.trim().slice(0, 200)}"`);
          const parsed = parseTicketText(ret.data.text);
          if (parsed.numbers.length >= 2 || (parsed.numbers.length >= 1 && (parsed.letter || parsed.zodiac))) {
            parsed.sourceMethod = "ocr";
            // Prefer the result with the most numbers found
            if (!bestOcrResult || parsed.numbers.length > bestOcrResult.numbers.length) {
              bestOcrResult = parsed;
            }
            // If we got a good result with lottery name too, stop early
            if (parsed.numbers.length >= 3 && parsed.lotteryName) {
              break;
            }
          }
        }
      } catch (regionErr) {
        console.warn(`OCR region ${region.label} error:`, regionErr);
      }
    }

    await worker.terminate();

    if (bestOcrResult) {
      return bestOcrResult;
    }
  } catch (ocrErr) {
    console.warn("OCR engine notice:", ocrErr);
  }

  // ─── STEP 3: ZXing barcode strips as last resort ───
  // Try focused barcode strip regions only if everything else failed
  if (baseCtx) {
    onProgress?.("Trying focused barcode regions...");
    const bW = baseCanvas.width;
    const bH = baseCanvas.height;
    const strips = [
      { x: 0, y: Math.round(bH * 0.6), w: bW, h: Math.round(bH * 0.4) },
      { x: 0, y: 0, w: bW, h: Math.round(bH * 0.4) },
      { x: 0, y: Math.round(bH * 0.25), w: bW, h: Math.round(bH * 0.5) },
      { x: Math.round(bW * 0.5), y: Math.round(bH * 0.5), w: Math.round(bW * 0.5), h: Math.round(bH * 0.5) },
      { x: 0, y: Math.round(bH * 0.5), w: Math.round(bW * 0.5), h: Math.round(bH * 0.5) },
    ];

    for (const strip of strips) {
      const stripCanvas = createTransformedCanvas(baseCanvas, 0, strip, true);
      const decoded = decodeCanvasWithZXing(stripCanvas);
      if (decoded) {
        barcodeResult = tryDecodeBarcodePayload(decoded, "zxing");
        if (barcodeResult) return barcodeResult;
      }
    }
  }

  return null;
}
