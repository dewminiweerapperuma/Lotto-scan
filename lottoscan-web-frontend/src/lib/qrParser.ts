import { LOTTERIES } from "./constants";
import { ZODIAC_SIGNS, ZodiacSign } from "./zodiac";
import { getLotteryConfig } from "./lotteryConfig";

export interface NormalizedQRResult {
  rawText: string;
  board: "NLB" | "DLB";
  lotteryName: string;
  cleanLotteryName: string;
  drawNumber?: string;
  drawDate?: string;
  isFutureDraw: boolean;
  serialNumber?: string;
  primaryNumbers: number[];
  promotionalNumber?: string;
  letter?: string;
  zodiac?: {
    id: string;
    nameEn: string;
    nameSi: string;
    transliteration: string;
    symbol: string;
    svgPath: string;
  };
  zodiac2?: {
    id: string;
    nameEn: string;
    nameSi: string;
    transliteration: string;
    symbol: string;
    svgPath: string;
  };
  zodiacSigns?: Array<{
    id: string;
    nameEn: string;
    nameSi: string;
    transliteration: string;
    symbol: string;
    svgPath: string;
  }>;
  isValid: boolean;
  validationError?: string;
}

const ENGLISH_TO_ZODIAC_KEY: Record<string, string> = {
  aries: "mesha",
  taurus: "vrushabha",
  gemini: "mithuna",
  cancer: "kataka",
  leo: "simha",
  virgo: "kanya",
  libra: "thula",
  scorpio: "vrushchika",
  sagittarius: "dhanu",
  capricorn: "makara",
  aquarius: "kumbha",
  pisces: "meena",
  // Direct Sinhala keys/transliterations
  mesha: "mesha",
  vrushabha: "vrushabha",
  mithuna: "mithuna",
  kataka: "kataka",
  simha: "simha",
  kanya: "kanya",
  thula: "thula",
  vrushchika: "vrushchika",
  vrischika: "vrushchika",
  dhanu: "dhanu",
  makara: "makara",
  kumbha: "kumbha",
  meena: "meena",
  // Sinhala unicode
  "මේෂ": "mesha",
  "වෘෂභ": "vrushabha",
  "මිථුන": "mithuna",
  "කටක": "kataka",
  "සිංහ": "simha",
  "කන්‍යා": "kanya",
  "තුලා": "thula",
  "වෘශ්චික": "vrushchika",
  "ධනු": "dhanu",
  "මකර": "makara",
  "කුම්භ": "kumbha",
  "මීන": "meena",
};

/**
 * Check whether a draw date is unannounced / scheduled in the future
 */
export function isFutureDraw(drawDateStr?: string): boolean {
  if (!drawDateStr) return false;
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Standardize to YYYY-MM-DD
    const clean = drawDateStr.replace(/\//g, "-").replace(/\./g, "-");
    return clean > today;
  } catch {
    return false;
  }
}

/**
 * Check if a token is a pure ticket serial number (10-18 digits or known prefix)
 */
export function isSerialCode(token: string): boolean {
  const clean = token.trim();
  if (/^\d{10,18}$/.test(clean)) return true;
  if (/^(NLB|DLB|NL|DL)[A-Z0-9]{8,}$/i.test(clean)) return true;
  return false;
}

/**
 * Normalize and extract rich lottery ticket tokens from Sri Lankan QR code strings.
 * Supports:
 *  - NLB Space-Separated Strings (e.g. "SUBA DAWASA 0323 2026/06/03 088003230343923 Capricorn Aquarius 01 14 61 9925 N r.nlb.lk")
 *  - DLB Delimited Formats (e.g. "DLB|AK|3117|10,29,37,56|P" or "DLB-AK-3117-10,29,37,56-P")
 *  - JSON structures
 */
export function parseLotteryQR(rawInput: string): NormalizedQRResult {
  const raw = (rawInput || "").trim();
  const lower = raw.toLowerCase();

  let detectedLottery = "";
  let board: "NLB" | "DLB" = "NLB";
  let drawNumber = "";
  let drawDate = "";
  let serialNumber = "";
  let extractedZodiacObj: NormalizedQRResult["zodiac"] = undefined;
  let extractedZodiac2Obj: NormalizedQRResult["zodiac2"] = undefined;
  let extractedZodiacSigns: NormalizedQRResult["zodiacSigns"] = undefined;
  let extractedLetter = "";
  let promotionalNumber = "";
  const candidateNumbers: number[] = [];

  // 1. JSON parsing check
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const p = JSON.parse(raw);
      if (p.lottery || p.lottery_name || p.name) detectedLottery = String(p.lottery || p.lottery_name || p.name);
      if (p.draw || p.draw_number || p.drawNumber) drawNumber = String(p.draw || p.draw_number || p.drawNumber);
      if (p.date || p.draw_date || p.drawDate) drawDate = String(p.date || p.draw_date || p.drawDate);
      if (p.serial || p.ticket_serial || p.ticketSerial) serialNumber = String(p.serial || p.ticket_serial || p.ticketSerial);
      if (p.letter || p.l) extractedLetter = String(p.letter || p.l).toUpperCase();
      if (Array.isArray(p.numbers)) {
        p.numbers.forEach((n: any) => {
          const num = Number(n);
          if (!isNaN(num) && num >= 0 && num <= 99) candidateNumbers.push(num);
        });
      }
    } catch {}
  }

  // 2. DLB Delimited Format check (DLB|AK|3117|10,29,37,56|P or DLB-AK-3110-...)
  if (!detectedLottery && (raw.includes("|") || raw.includes(";"))) {
    const parts = raw.split(/[|;]+/);
    for (const part of parts) {
      const pTrim = part.trim();
      if (/^(DLB|NLB)$/i.test(pTrim)) {
        board = pTrim.toUpperCase() as "NLB" | "DLB";
      }
      for (const l of LOTTERIES) {
        if (pTrim.toLowerCase() === l.name.toLowerCase() || pTrim.toLowerCase().includes(l.name.toLowerCase())) {
          detectedLottery = l.name;
        }
      }
      if (/^[A-Z]{2,4}$/.test(pTrim) && !detectedLottery) {
        const abbr = pTrim.toUpperCase();
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
      }
      if (/^\d{3,5}$/.test(pTrim) && !drawNumber) {
        drawNumber = pTrim;
      }
      if (/[0-9]+[ ,-]+[0-9]+/.test(pTrim)) {
        const subNums = pTrim.split(/[ ,-]+/).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 99);
        candidateNumbers.push(...subNums);
      } else if (/^[A-Za-z]$/.test(pTrim) && !extractedLetter) {
        extractedLetter = pTrim.toUpperCase();
      }
    }
  }

  // 3. NLB / DLB Space-Separated QR Strings (Official standard layout)
  if (!detectedLottery) {
    if (lower.includes("suba dawas") || lower.includes("subadawasa") || lower.includes("සුබ දවස")) {
      detectedLottery = "Suba Dawasak";
      board = "NLB";
    } else if (lower.includes("govisetha") || lower.includes("ගොවිසෙත")) {
      detectedLottery = "Govisetha";
      board = "NLB";
    } else if (lower.includes("mahajana") || lower.includes("මහජන")) {
      detectedLottery = "Mahajana Sampatha";
      board = "NLB";
    } else if (lower.includes("kotipathi") || lower.includes("කෝටිපති")) {
      detectedLottery = "Ada Kotipathi";
      board = "DLB";
    } else if (lower.includes("shanida") || lower.includes("ශනිදා")) {
      detectedLottery = "Shanida Wasanawa";
      board = "DLB";
    } else if (lower.includes("lagna") || lower.includes("ලග්න")) {
      detectedLottery = "Lagna Wasanawa";
      board = "DLB";
    } else if (lower.includes("mega power") || lower.includes("මෙගා")) {
      detectedLottery = "Mega Power";
      board = "NLB";
    } else if (lower.includes("handahana") || lower.includes("හඳහන")) {
      detectedLottery = "Handahana";
      board = "NLB";
    } else if (lower.includes("kapruka") || lower.includes("කප්රුක")) {
      detectedLottery = "Kapruka";
      board = "DLB";
    } else if (lower.includes("super ball") || lower.includes("සුපර්")) {
      detectedLottery = "Super Ball";
      board = "DLB";
    } else if (lower.includes("sasiri") || lower.includes("සසිරි")) {
      detectedLottery = "Sasiri";
      board = "DLB";
    } else if (lower.includes("dhana nidhanaya") || lower.includes("ධන නිධානය")) {
      detectedLottery = "Dhana Nidhanaya";
      board = "NLB";
    } else if (lower.includes("ada sampatha") || lower.includes("අද සම්පත")) {
      detectedLottery = "Ada Sampatha";
      board = "NLB";
    } else if (lower.includes("supiri dhana") || lower.includes("සුපිරි ධන")) {
      detectedLottery = "Supiri Dhana Sampatha";
      board = "DLB";
    } else if (lower.includes("jaya sampatha") || lower.includes("nlb jaya") || lower.includes("ජය සම්පත")) {
      detectedLottery = "Jaya Sampatha";
      board = "DLB";
    } else {
      for (const l of LOTTERIES) {
        if (lower.includes(l.name.toLowerCase())) {
          detectedLottery = l.name;
          board = (l.board as "NLB" | "DLB") || "NLB";
          break;
        }
      }
    }
  }

  // 4. Date Extraction (YYYY/MM/DD, YYYY-MM-DD, or DD/MM/YYYY)
  if (!drawDate) {
    const dateMatch = raw.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})|(\d{2}[-/.]\d{2}[-/.]\d{4})/);
    if (dateMatch) {
      const dStr = dateMatch[0].replace(/\//g, "-").replace(/\./g, "-");
      if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
        drawDate = dStr;
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
        const parts = dStr.split("-");
        drawDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
  }

  // 5. Draw Number Extraction (3-5 digits near lottery name or header)
  if (!drawNumber) {
    const numTokens = raw.match(/\b\d{3,5}\b/g);
    if (numTokens) {
      for (const dm of numTokens) {
        // Skip year tokens
        if (drawDate && drawDate.includes(dm)) continue;
        if (["2023", "2024", "2025", "2026", "2027", "2028"].includes(dm)) continue;
        drawNumber = dm;
        break;
      }
    }
  }

  // 6. Serial Number Extraction (10-18 digits or alphanumeric serial)
  if (!serialNumber) {
    const serialMatch = raw.match(/\b\d{10,18}\b/) || raw.match(/\b(NLB|DLB|NL|DL)[A-Z0-9]{8,}\b/i);
    if (serialMatch) {
      serialNumber = serialMatch[0];
    }
  }

  // 7. Zodiac Normalization (Support single or dual zodiac signs e.g. Suba Dawasak)
  const foundZodiacs: Array<{ index: number; sign: (typeof ZODIAC_SIGNS)[keyof typeof ZODIAC_SIGNS] }> = [];
  for (const [zWord, zKey] of Object.entries(ENGLISH_TO_ZODIAC_KEY)) {
    const idx = lower.indexOf(zWord);
    if (idx !== -1) {
      const sign = ZODIAC_SIGNS[zKey];
      if (sign && !foundZodiacs.some((fz) => fz.sign.id === sign.id)) {
        foundZodiacs.push({ index: idx, sign });
      }
    }
  }

  // Sort by appearance in string (left-to-right)
  foundZodiacs.sort((a, b) => a.index - b.index);

  const signsList: NonNullable<NormalizedQRResult["zodiacSigns"]> = [];

  if (foundZodiacs.length > 0) {
    extractedZodiacObj = {
      id: foundZodiacs[0].sign.id,
      nameEn: foundZodiacs[0].sign.nameEn,
      nameSi: foundZodiacs[0].sign.nameSi,
      transliteration: foundZodiacs[0].sign.transliteration,
      symbol: foundZodiacs[0].sign.symbol,
      svgPath: foundZodiacs[0].sign.svgPath,
    };
    signsList.push(extractedZodiacObj);
  }

  if (foundZodiacs.length > 1) {
    extractedZodiac2Obj = {
      id: foundZodiacs[1].sign.id,
      nameEn: foundZodiacs[1].sign.nameEn,
      nameSi: foundZodiacs[1].sign.nameSi,
      transliteration: foundZodiacs[1].sign.transliteration,
      symbol: foundZodiacs[1].sign.symbol,
      svgPath: foundZodiacs[1].sign.svgPath,
    };
    signsList.push(extractedZodiac2Obj);
  }

  extractedZodiacSigns = signsList.length > 0 ? signsList : undefined;

  // 8. Letter Extraction (Single English capital letter)
  if (!extractedLetter) {
    // Avoid letters from URLs or common word fragments
    const letterCandidates = raw.match(/\b([A-Za-z])\b/g);
    if (letterCandidates) {
      for (const lc of letterCandidates) {
        // Don't mistake r from r.nlb.lk as the ticket letter
        if (lc.toLowerCase() === "r" && raw.includes("r.nlb.lk")) continue;
        extractedLetter = lc.toUpperCase();
        break;
      }
    }
  }

  // 9. Digit Extraction: Separate Primary 2-digit numbers from 4-digit promotional or batch sequences
  if (candidateNumbers.length === 0) {
    let cleanNumbersText = raw;
    // Strip URLs
    cleanNumbersText = cleanNumbersText.replace(/https?:\/\/[^\s]+/gi, " ").replace(/r\.(nlb|dlb)\.lk[^\s]*/gi, " ");
    // Strip serial numbers
    if (serialNumber) cleanNumbersText = cleanNumbersText.replace(serialNumber, " ");
    cleanNumbersText = cleanNumbersText.replace(/\b\d{10,18}\b/g, " ");
    // Strip draw date
    if (drawDate) cleanNumbersText = cleanNumbersText.replace(drawDate, " ").replace(drawDate.replace(/-/g, "/"), " ");
    // Strip draw number
    if (drawNumber) cleanNumbersText = cleanNumbersText.replace(new RegExp(`\\b${drawNumber}\\b`), " ");
    // Strip zodiac names
    for (const zWord of Object.keys(ENGLISH_TO_ZODIAC_KEY)) {
      cleanNumbersText = cleanNumbersText.replace(new RegExp(`\\b${zWord}\\b`, "gi"), " ");
    }
    // Strip lottery names & common board abbreviations
    cleanNumbersText = cleanNumbersText.replace(/SUBA|DAWASA|DAWASAK|GOVISETHA|MAHAJANA|SAMPATHA|KOTIPATHI|NLB|DLB/gi, " ");

    const allNumMatches = cleanNumbersText.match(/\b\d{1,4}\b/g) || [];
    for (const token of allNumMatches) {
      const val = Number(token);
      if (token.length >= 4) {
        // 4-digit token is typically promotional code or batch sequence (e.g. 9925)
        if (!promotionalNumber) promotionalNumber = token;
      } else if (val >= 0 && val <= 99) {
        candidateNumbers.push(val);
      }
    }
  }

  // Target digit count based on lottery config
  const config = getLotteryConfig(detectedLottery);
  const targetDigitCount = config.digitCount || 4;
  const primaryNumbers = candidateNumbers.slice(0, targetDigitCount);

  // Validation rules
  const futureDrawFlag = isFutureDraw(drawDate);
  let isValid = true;
  let validationError: string | undefined = undefined;

  if (!detectedLottery && primaryNumbers.length === 0) {
    isValid = false;
    validationError = "No recognizable Sri Lankan lottery name or numbers found in QR data.";
  } else if (primaryNumbers.length === 0) {
    isValid = false;
    validationError = "No valid ticket numbers found in QR data.";
  }

  return {
    rawText: raw,
    board,
    lotteryName: detectedLottery || "Govisetha",
    cleanLotteryName: (detectedLottery || "Govisetha").replace(/^(NLB|DLB)\s+/i, ""),
    drawNumber: drawNumber || undefined,
    drawDate: drawDate || undefined,
    isFutureDraw: futureDrawFlag,
    serialNumber: serialNumber || undefined,
    primaryNumbers,
    promotionalNumber: promotionalNumber || undefined,
    letter: extractedLetter || undefined,
    zodiac: extractedZodiacObj,
    zodiac2: extractedZodiac2Obj,
    zodiacSigns: extractedZodiacSigns,
    isValid,
    validationError,
  };
}

/**
 * Validate that minimum requirements are present before hitting backend APIs
 */
export function isValidQRData(data: NormalizedQRResult): boolean {
  return data.isValid && data.primaryNumbers.length > 0;
}
