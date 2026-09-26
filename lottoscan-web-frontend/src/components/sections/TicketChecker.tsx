"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { lottery as lotteryApi } from "@/lib/api";
import { LOTTERIES } from "@/lib/constants";
import NumberBall from "@/components/ui/NumberBall";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ZodiacSelector from "@/components/ui/ZodiacSelector";
import ZodiacBall, { ZodiacBadge } from "@/components/ui/ZodiacBall";
import { getZodiacInfo } from "@/lib/zodiac";
import { getLotteryConfig } from "@/lib/lotteryConfig";
import PyramidResults, { isPyramidLottery } from "@/components/ui/PyramidResults";
import { scanTicketImage, parseTicketText, isSerialOrVerificationData } from "@/lib/ticketScanner";
import { parseLotteryQR } from "@/lib/qrParser";
import LaptopQrScanner from "@/components/scanner/LaptopQrScanner";
import soundEffects from "@/lib/soundEffects";

export default function TicketChecker({ isFullPage }: { isFullPage?: boolean }) {
  const [numbers, setNumbers] = useState(["", "", "", "", ""]);
  const [letter, setLetter] = useState("");
  const [letter2, setLetter2] = useState("");
  const [drawDate, setDrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [lotteryName, setLotteryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCameraScanSuccess = useCallback((scannedText: string) => {
    const raw = scannedText?.trim();
    if (!raw) return;

    // 1. Try dedicated QR tokenization & normalization engine
    const qrData = parseLotteryQR(raw);
    if (qrData.isValid) {
      const detectedLot = qrData.lotteryName || lotteryName;
      if (qrData.lotteryName) setLotteryName(qrData.lotteryName);
      if (qrData.drawDate) setDrawDate(qrData.drawDate);

      const activeConfig = getLotteryConfig(detectedLot);
      const targetCount = activeConfig.digitCount || 4;
      const padLen = activeConfig.maxDigitsPerBox > 1 ? 2 : 1;
      const formattedNums = qrData.primaryNumbers.map((n) => String(n).padStart(padLen, "0"));
      while (formattedNums.length < targetCount) formattedNums.push("");
      setNumbers(formattedNums.slice(0, targetCount));

      // Handle dual zodiac signs (e.g. Suba Dawasak) or single zodiac/letter
      if (qrData.zodiacSigns && qrData.zodiacSigns.length >= 2) {
        setLetter(qrData.zodiacSigns[0].symbol || qrData.zodiacSigns[0].nameEn);
        setLetter2(qrData.zodiacSigns[1].symbol || qrData.zodiacSigns[1].nameEn);
      } else if (qrData.zodiac) {
        setLetter(qrData.zodiac.symbol || qrData.zodiac.nameEn);
        if (qrData.zodiac2) {
          setLetter2(qrData.zodiac2.symbol || qrData.zodiac2.nameEn);
        } else {
          setLetter2("");
        }
      } else if (qrData.letter) {
        setLetter(qrData.letter);
        setLetter2("");
      }

      if (qrData.isFutureDraw) {
        setError(`⚠️ Note: The draw for ${qrData.lotteryName} is scheduled for ${qrData.drawDate} and has not taken place yet.`);
      } else {
        setError("");
      }

      setShowCamera(false);
      return;
    }

    // 2. Fallback to parseTicketText
    const parsed = parseTicketText(raw);
    if (parsed && (parsed.numbers.length > 0 || parsed.letter || parsed.zodiac || parsed.lotteryName)) {
      const detectedLot = parsed.lotteryName || lotteryName;
      if (parsed.lotteryName) setLotteryName(parsed.lotteryName);
      if (parsed.drawDate) setDrawDate(parsed.drawDate);

      const activeConfig = getLotteryConfig(detectedLot);
      const targetCount = activeConfig.digitCount || 5;
      const padLen = activeConfig.maxDigitsPerBox > 1 ? 2 : 1;
      const formattedNums = parsed.numbers.map((n) => String(n).padStart(padLen, "0"));
      while (formattedNums.length < targetCount) formattedNums.push("");
      setNumbers(formattedNums.slice(0, targetCount));

      if (parsed.zodiacSigns && parsed.zodiacSigns.length >= 2) {
        setLetter(parsed.zodiacSigns[0]);
        setLetter2(parsed.zodiacSigns[1]);
      } else if (parsed.zodiac) {
        setLetter(parsed.zodiac);
        if (parsed.zodiac2) setLetter2(parsed.zodiac2);
        else setLetter2("");
      } else if (parsed.letter) {
        setLetter(parsed.letter);
        setLetter2("");
      }
      setError("");
      setShowCamera(false);
      return;
    }

    // If pure serial number without lottery details
    if (isSerialOrVerificationData(raw)) {
      setError(`Detected ticket serial (${raw.slice(0, 16)}...). Please point the camera at the 2D QR code with the numbers, or tap "Capture & Scan Ticket".`);
      return;
    }

    setError("Unrecognized ticket barcode/QR format. Please point at the 2D QR code or tap 'Capture & Scan Ticket'.");
  }, [lotteryName]);

  const config = getLotteryConfig(lotteryName);

  // Reset or adjust numbers array length when lottery type changes
  useEffect(() => {
    setNumbers((prev) => {
      const targetLength = config.digitCount;
      if (prev.length === targetLength) return prev;
      if (prev.length < targetLength) {
        return [...prev, ...Array(targetLength - prev.length).fill("")];
      }
      return prev.slice(0, targetLength);
    });
  }, [lotteryName, config.digitCount]);

  const handleNumberChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const maxLen = config.maxDigitsPerBox;
    const boxCount = config.digitCount;

    // If user pasted a long string in the first box and other boxes are empty,
    // distribute across boxes intelligently
    if (index === 0 && cleaned.length > maxLen && numbers.slice(1).every((n) => !n)) {
      const newNums = [...numbers];
      let offset = 0;
      for (let b = 0; b < boxCount && offset < cleaned.length; b++) {
        newNums[b] = cleaned.slice(offset, offset + maxLen);
        offset += maxLen;
      }
      setNumbers(newNums);
      const lastFilledBox = Math.min(Math.ceil(cleaned.length / maxLen), boxCount) - 1;
      inputRefs.current[lastFilledBox]?.focus();
      return;
    }

    const v = cleaned.slice(0, maxLen);
    const newNums = [...numbers];
    newNums[index] = v;
    setNumbers(newNums);

    // Auto-advance to next box when current box is full
    if (v.length === maxLen && index < boxCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCheck = async () => {
    const parsedNums: number[] = [];

    numbers.forEach((val) => {
      if (!val) return;
      if (config.isSingleDigit) {
        // For single-digit lotteries, each box value is one digit
        val.split("").forEach((d) => parsedNums.push(Number(d)));
      } else {
        const num = Number(val);
        if (!isNaN(num)) parsedNums.push(num);
      }
    });

    const nums = parsedNums.filter((n) => !isNaN(n) && n >= 0);

    if (nums.length === 0) {
      setError("Please enter your ticket numbers");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const combinedLetter = config.hasTwoZodiacs && letter2 ? `${letter},${letter2}` : letter;
      const res = await lotteryApi.checkTicket(
        nums,
        drawDate,
        lotteryName || undefined,
        combinedLetter || undefined,
        { zodiac: letter, zodiac2: letter2 }
      );
      setResult(res.data);
      sessionStorage.setItem("lottoscan_result", JSON.stringify(res.data));

      soundEffects.playResultFeedback({
        isWinner: res.data.isWinner,
        prizeAmount: Number(res.data.prizeAmount) || 0,
        isExpired: res.data.isExpired,
        isFutureDraw: res.data.isFutureDraw,
      });
    } catch (err: any) {
      soundEffects.playWarningSound();
      setError(err.response?.data?.error || "Failed to check ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNumbers(Array(config.digitCount).fill(""));
    setLetter("");
    setLetter2("");
    setResult(null);
    setError("");
  };

  // Sub-components for inputs and results to reuse between layouts
  const renderInputs = () => (
    <Card>
      <div className="space-y-5">
        {/* Number inputs */}
        <div>
          <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-3 block">
            {config.label}
          </label>
          {config.isPyramid && config.pyramidRows ? (
            /* Pyramid layout: centered rows (e.g. 2-3-4 + letter) */
            <div className="flex flex-col items-center gap-2">
              {(() => {
                let boxIndex = 0;
                return config.pyramidRows.map((rowCount, rowIdx) => {
                  const startIdx = boxIndex;
                  boxIndex += rowCount;
                  const isLastRow = rowIdx === config.pyramidRows!.length - 1;
                  return (
                    <div key={rowIdx} className="flex gap-2 items-center justify-center">
                      {Array.from({ length: rowCount }, (_, colIdx) => {
                        const idx = startIdx + colIdx;
                        return (
                          <input
                            key={`${lotteryName}-${idx}`}
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            value={numbers[idx] || ""}
                            onChange={(e) => handleNumberChange(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !numbers[idx] && idx > 0) {
                                inputRefs.current[idx - 1]?.focus();
                              }
                            }}
                            placeholder="0"
                            maxLength={1}
                            className="number-input w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] font-mono text-center text-xl sm:text-2xl font-bold"
                          />
                        );
                      })}
                      {/* Show letter ball on the last row */}
                      {isLastRow && config.hasLetter && (
                        <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold-dark text-xl sm:text-2xl font-bold font-mono cursor-pointer select-none"
                          title="Lagna / Letter"
                        >
                          {letter || "?"}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Standard flat row layout */
            <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
              {Array.from({ length: config.digitCount }, (_, i) => (
                <input
                  key={`${lotteryName}-${i}`}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  value={numbers[i] || ""}
                  onChange={(e) => handleNumberChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !numbers[i] && i > 0) {
                      inputRefs.current[i - 1]?.focus();
                    }
                  }}
                  placeholder={config.boxPlaceholders[i] || "0"}
                  maxLength={config.maxDigitsPerBox}
                  className={`number-input flex-1 min-w-[50px] font-mono text-center font-bold ${
                    config.maxDigitsPerBox === 1 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                  }`}
                />
              ))}

              {config.hasTwoZodiacs && (
                <div className="flex gap-2 items-center">
                  <div
                    className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex flex-col items-center justify-center text-amber-500 select-none shadow-sm cursor-pointer"
                    title="1st Zodiac Sign"
                  >
                    <span className="text-base sm:text-lg leading-none">{letter ? getZodiacInfo(letter)?.symbol || letter : "?"}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[42px] leading-tight mt-0.5">
                      {letter ? getZodiacInfo(letter)?.transliteration || letter : "Zodiac 1"}
                    </span>
                  </div>
                  <div
                    className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex flex-col items-center justify-center text-amber-500 select-none shadow-sm cursor-pointer"
                    title="2nd Zodiac Sign"
                  >
                    <span className="text-base sm:text-lg leading-none">{letter2 ? getZodiacInfo(letter2)?.symbol || letter2 : "?"}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tight truncate max-w-[42px] leading-tight mt-0.5">
                      {letter2 ? getZodiacInfo(letter2)?.transliteration || letter2 : "Zodiac 2"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Letter & Date */}
        {config.hasTwoZodiacs ? (
          <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-amber-400 text-xs font-body font-extrabold uppercase tracking-wider block">
                Two Zodiac Signs (දෙලග්න - Suba Dawasak)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">2 chances to match</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ZodiacSelector
                value={letter}
                onChange={setLetter}
                label="1st Zodiac Sign (පළමු ලග්නය)"
                placeholder="-- Select 1st Zodiac --"
              />
              <ZodiacSelector
                value={letter2}
                onChange={setLetter2}
                label="2nd Zodiac Sign (දෙවන ලග්නය)"
                placeholder="-- Select 2nd Zodiac --"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                Draw Date
              </label>
              <input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="input-dark"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ZodiacSelector
              value={letter}
              onChange={setLetter}
              label="Lagna / Letter (optional)"
            />
            <div>
              <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
                Draw Date
              </label>
              <input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="input-dark"
              />
            </div>
          </div>
        )}

        {/* Lottery selector */}
        <div>
          <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
            Lottery (optional)
          </label>
          <select
            value={lotteryName}
            onChange={(e) => setLotteryName(e.target.value)}
            className="input-dark"
          >
            <option value="">Auto-detect</option>
            {LOTTERIES.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-lose text-sm font-body">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleCheck} loading={loading} fullWidth size="lg">
            Check My Numbers →
          </Button>
          <Button onClick={handleClear} variant="ghost" size="lg">
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsScanningImage(true);
    setScanStatus("Analyzing image with multi-engine detector...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const parsed = await scanTicketImage(img, (msg) => setScanStatus(msg));

          if (parsed && (parsed.numbers.length > 0 || parsed.letter || parsed.zodiac || parsed.lotteryName)) {
            const detectedLot = parsed.lotteryName || lotteryName;
            if (parsed.lotteryName) setLotteryName(parsed.lotteryName);
            if (parsed.drawDate) setDrawDate(parsed.drawDate);

            const activeConfig = getLotteryConfig(detectedLot);
            const targetCount = activeConfig.digitCount || 5;
            const padLen = activeConfig.maxDigitsPerBox > 1 ? 2 : 1;
            const formattedNums = parsed.numbers.map((n) => String(n).padStart(padLen, "0"));
            while (formattedNums.length < targetCount) formattedNums.push("");
            setNumbers(formattedNums.slice(0, targetCount));

            if (parsed.zodiacSigns && parsed.zodiacSigns.length >= 2) {
              setLetter(parsed.zodiacSigns[0]);
              setLetter2(parsed.zodiacSigns[1]);
            } else if (parsed.zodiac) {
              setLetter(parsed.zodiac);
              if (parsed.zodiac2) setLetter2(parsed.zodiac2);
              else setLetter2("");
            } else if (parsed.letter) {
              setLetter(parsed.letter);
              setLetter2("");
            }

            if (parsed.isFutureDraw) {
              setError(`⚠️ Note: The draw for ${parsed.lotteryName || detectedLot} is scheduled for ${parsed.drawDate} and has not taken place yet.`);
            } else {
              setError("");
            }
          } else {
            setError("No barcode, QR code, or readable ticket numbers found. Please ensure the ticket image is clear, unblurred, and well-lit, or enter numbers manually.");
          }
        } catch (err: any) {
          setError("Could not process ticket image. Please try again with a clearer photo or enter numbers manually.");
        } finally {
          setIsScanningImage(false);
          setScanStatus("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderScanner = () => (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-light border border-gold-border flex items-center justify-center text-xl">
            📷
          </div>
          <div>
            <p className="text-text-primary font-body font-semibold">Scan or Upload Ticket</p>
            <p className="text-text-secondary text-xs font-body">Use your camera or upload a ticket photo (supports QR codes, Barcodes & Numbers)</p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {isScanningImage ? (
          <div className="border-2 border-dashed border-gold-border bg-gold-light/20 rounded-2xl p-8 text-center space-y-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <p className="text-gold-dark font-body font-extrabold text-sm">Scanning Ticket Photo...</p>
              <p className="text-text-secondary text-xs font-body mt-1">{scanStatus || "Analyzing barcode, QR code, and ticket numbers"}</p>
            </div>
          </div>
        ) : showCamera ? (
          <div className="space-y-3">
            <LaptopQrScanner
              onScanSuccess={handleCameraScanSuccess}
            />
            <Button onClick={() => setShowCamera(false)} variant="secondary" fullWidth size="sm">
              ✕ Close Camera
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gold-border bg-gold-light/10 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl text-gold-dark">📷</div>
            <div>
              <p className="text-gold-dark font-body font-semibold text-sm">Scan QR Code or Upload Photo</p>
              <p className="text-text-secondary text-xs font-body mt-1">Supports QR code, 1D barcode, and printed ticket photos</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => setShowCamera(true)} size="sm" className="flex items-center justify-center gap-2">
                <span>📷</span> Open Camera
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm" className="flex items-center justify-center gap-2">
                <span>📁</span> Upload Image
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderResult = () => {
    if (!result) {
      return (
        <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full border border-dashed border-gold-border flex items-center justify-center text-4xl mb-4 select-none bg-gold-light/10">
            ❓
          </div>
          <h4 className="text-text-primary font-display font-extrabold text-lg mb-1">
            Your result appears here
          </h4>
          <p className="text-text-muted text-sm font-body">Enter numbers on the left to begin</p>
        </div>
      );
    }

    if (result.isWinner) {
      return (
        <div className="space-y-6 animate-slide-up">
          <div className={`border rounded-[24px] p-6 md:p-8 relative overflow-hidden border-l-4 shadow-md ${
            result.isExpired
              ? "bg-rose-50/50 border-rose-300 border-l-rose-600"
              : "bg-gold-light/35 border-gold-border border-l-gold"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative space-y-6">
              {result.isExpired ? (
                <div className="text-center space-y-2">
                  <div className="text-5xl">⏳</div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                    Expired Ticket (Over 6 Months)
                  </span>
                  <h3 className="text-2xl font-display font-extrabold text-rose-950 uppercase tracking-wider">
                    CLAIM PERIOD EXPIRED
                  </h3>
                  <p className="text-3xl md:text-4xl font-mono font-extrabold text-slate-400 line-through leading-none">
                    {result.prizeAmountFormatted || `Rs. ${result.prizeAmount?.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-rose-700 font-body font-semibold max-w-sm mx-auto">
                    Matched winning numbers, but redemption deadline ({result.expiryDate || "6 months"}) has passed.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-5xl animate-bounce">🏆</div>
                  <h3 className="text-2xl font-display font-extrabold text-gold-dark uppercase tracking-wider">
                    YOU WON!
                  </h3>
                  <p className="text-4xl md:text-5xl font-mono font-extrabold text-gold-dark leading-none">
                    {result.prizeAmountFormatted || `Rs. ${result.prizeAmount?.toLocaleString()}`}
                  </p>
                  <p className="text-text-secondary font-body text-sm font-semibold">
                    {result.prizeCategory || "Jackpot"}
                  </p>
                </div>
              )}

              <div className="space-y-4 pt-2 border-t border-border-default/40">
                {isPyramidLottery(result.lotteryName) ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center space-y-3">
                    <p className="text-text-secondary text-[11px] font-body font-bold uppercase tracking-wider">
                      Pyramid Winning Structure
                    </p>
                    <PyramidResults numbers={result.winningNumbers} letter={result.letter} />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                        Your Numbers & Lagna
                      </p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {result.ticketNumbers?.map((n: number, i: number) => (
                          <NumberBall key={i} number={n} matched={result.matchedNumbers?.includes(n)} />
                        ))}
                        {(() => {
                          const zList: string[] = [];
                          if (result.userZodiacs && Array.isArray(result.userZodiacs) && result.userZodiacs.length > 0) {
                            zList.push(...result.userZodiacs);
                          } else if (result.userLetter && result.userLetter.includes(',')) {
                            zList.push(...result.userLetter.split(',').map((s: string) => s.trim()));
                          } else {
                            if (result.userLetter || letter) zList.push(result.userLetter || letter);
                            if (result.userLetter2 || letter2) zList.push(result.userLetter2 || letter2);
                          }

                          const winningZ = result.letter ? String(result.letter).toLowerCase() : "";

                          return zList.filter(Boolean).map((zVal, zIdx) => {
                            const zInfo = getZodiacInfo(zVal);
                            const isThisMatched = Boolean(
                              result.matchedLetter && (
                                zVal.toLowerCase() === winningZ ||
                                (zInfo && (
                                  zInfo.nameEn.toLowerCase() === winningZ ||
                                  zInfo.transliteration.toLowerCase() === winningZ ||
                                  zInfo.id === winningZ ||
                                  zInfo.symbol === winningZ
                                ))
                              )
                            );
                            return (
                              <ZodiacBall
                                key={zIdx}
                                value={zVal}
                                size="md"
                                className={isThisMatched ? "ring-4 ring-emerald-500 rounded-full shadow-lg" : ""}
                              />
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                        Winning Numbers & Lagna
                      </p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {result.winningNumbers?.map((n: number, i: number) => (
                          <NumberBall key={i} number={n} variant="default" />
                        ))}
                        {result.letter && (
                          <ZodiacBall value={result.letter} size="md" />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Grid draw info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-4 border-t border-border-default/40">
                {[
                  ["Lottery", result.lotteryName],
                  ["Draw #", result.drawNumber],
                  ["Date", result.drawDate],
                  ["Matches", `${result.matchedCount}/${result.winningNumbers?.length || 5}${result.matchedLetter ? " + Lagna ✓" : ""}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-text-muted text-[10px] uppercase font-bold">{k}</p>
                    <p className="text-text-primary font-body font-bold text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {(result.userLetter || letter || result.letter) && (
                <div className="pt-2">
                  {result.matchedLetter ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2 flex items-center gap-2 text-emerald-700 text-xs font-bold font-body">
                      <span className="text-emerald-500 text-base">✓</span>
                      <span>
                        Lagna/Zodiac Matched:{" "}
                        <span className="text-emerald-800 font-extrabold">
                          {getZodiacInfo(result.letter || result.userLetter || letter)?.nameEn || result.letter || letter} (
                          {getZodiacInfo(result.letter || result.userLetter || letter)?.transliteration || result.letter || letter})
                        </span>
                      </span>
                    </div>
                  ) : (result.userLetter || letter) ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2 flex items-center gap-2 text-amber-800 text-xs font-medium font-body">
                      <span>
                        Selected Lagna:{" "}
                        <span className="font-bold">
                          {getZodiacInfo(result.userLetter || letter)?.nameEn || result.userLetter || letter}
                        </span>{" "}
                        {result.letter && (
                          <span className="text-amber-700">
                            (Draw Lagna: {getZodiacInfo(result.letter)?.nameEn || result.letter})
                          </span>
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {result.isExpired ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-900">
                  <span className="text-rose-600 text-lg">⏳</span>
                  <div className="space-y-1">
                    <p className="font-body text-xs font-bold leading-tight text-rose-800">
                      Prize Forfeited: Claim Period Exceeded (6-Month Limit)
                    </p>
                    <p className="font-body text-[11px] leading-tight text-rose-700/90">
                      Under National Lotteries Board (NLB) &amp; Development Lotteries Board (DLB) regulations, prizes must be claimed within 6 calendar months (180 days) from the draw date ({result.drawDate}). As of {result.expiryDate || "now"}, this ticket is legally expired.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-win-light border border-green-200 rounded-2xl p-4 flex gap-3">
                  <span className="text-win text-lg">🏦</span>
                  <div className="space-y-1">
                    <p className="text-win font-body text-xs font-bold leading-tight">
                      Valid Claim Period: {result.daysRemaining !== undefined ? `${result.daysRemaining} days remaining` : "Within 6 Months"}
                    </p>
                    <p className="text-win/80 font-body text-[11px] leading-tight">
                      Valid until {result.expiryDate || "6 months from draw date"}. Claim at any NLB/DLB branch or authorized dealer with original ticket + National ID (NIC).
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {!result.isExpired ? (
                  <Button
                    onClick={() => {
                      navigator.share?.({
                        text: `🎉 I won ${result.prizeAmountFormatted || `Rs. ${result.prizeAmount}`} on ${result.lotteryName}! #LottoScan`,
                      });
                    }}
                    variant="primary"
                    fullWidth
                  >
                    🎊 Share My Win
                  </Button>
                ) : (
                  <div className="w-full text-center py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-xs">
                    ⚠️ Expired tickets cannot be redeemed or claimed
                  </div>
                )}
                <Button onClick={handleClear} variant="secondary" className="sm:w-32">
                  Check Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="bg-white border border-border-default rounded-[24px] p-6 md:p-8 border-l-4 border-l-lose shadow-sm">
          <div className="text-center space-y-3">
            <div className="text-5xl">😔</div>
            <h3 className="text-2xl font-display font-extrabold text-text-secondary leading-tight">
              No Match This Draw
            </h3>
            <p className="text-text-muted font-body text-sm max-w-xs mx-auto">
              {result.message || "0 of 5 numbers matched. Try checking other dates or lotteries."}
            </p>
          </div>

          {result.ticketNumbers && result.winningNumbers && (
            <div className="space-y-4 pt-6 mt-6 border-t border-border-default/40">
              <div>
                <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                  Your Numbers & Lagna
                </p>
                <div className="flex gap-2 flex-wrap items-center">
                  {result.ticketNumbers.map((n: number, i: number) => (
                    <NumberBall key={i} number={n} variant="unmatched" />
                  ))}
                  {(() => {
                    const zList: string[] = [];
                    if (result.userZodiacs && Array.isArray(result.userZodiacs) && result.userZodiacs.length > 0) {
                      zList.push(...result.userZodiacs);
                    } else if (result.userLetter && result.userLetter.includes(',')) {
                      zList.push(...result.userLetter.split(',').map((s: string) => s.trim()));
                    } else {
                      if (result.userLetter || letter) zList.push(result.userLetter || letter);
                      if (result.userLetter2 || letter2) zList.push(result.userLetter2 || letter2);
                    }

                    const winningZ = result.letter ? String(result.letter).toLowerCase() : "";

                    return zList.filter(Boolean).map((zVal, zIdx) => {
                      const zInfo = getZodiacInfo(zVal);
                      const isThisMatched = Boolean(
                        result.matchedLetter && (
                          zVal.toLowerCase() === winningZ ||
                          (zInfo && (
                            zInfo.nameEn.toLowerCase() === winningZ ||
                            zInfo.transliteration.toLowerCase() === winningZ ||
                            zInfo.id === winningZ ||
                            zInfo.symbol === winningZ
                          ))
                        )
                      );
                      return (
                        <ZodiacBall
                          key={zIdx}
                          value={zVal}
                          size="md"
                          className={isThisMatched ? "ring-4 ring-emerald-500 rounded-full shadow-lg" : ""}
                        />
                      );
                    });
                  })()}
                </div>
              </div>
              <div>
                <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                  Winning Numbers & Lagna
                </p>
                <div className="flex gap-2 flex-wrap items-center">
                  {result.winningNumbers.map((n: number, i: number) => (
                    <NumberBall key={i} number={n} variant="default" />
                  ))}
                  {result.letter && (
                    <ZodiacBall value={result.letter} size="md" />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Button onClick={handleClear} variant="secondary" fullWidth>
              Check Another Ticket
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render full-page layout
  if (isFullPage) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] w-full min-h-[calc(100vh-64px)] text-text-primary mt-16">
        {/* Left Column (55%) */}
        <div className="bg-brand-section p-6 md:p-12 lg:pl-[max(24px,calc((100vw-1440px)/2+24px))] lg:pr-16 lg:py-16 space-y-8 overflow-y-auto lg:h-[calc(100vh-64px)] scrollbar-none">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary mb-2">
              Check Your Ticket
            </h1>
            <p className="text-text-secondary font-body text-sm">
              Enter numbers or scan QR code
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Enter Numbers", "Check", "See Result"].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                    i === 0 ? "bg-gold text-white" : "bg-white text-text-muted border border-border-default"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs font-body font-semibold ${
                    i === 0 ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {step}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border-default"></div>}
              </div>
            ))}
          </div>

          {renderInputs()}

          {/* OR divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-border-default"></div>
            <span className="text-text-muted text-xs font-body">OR</span>
            <div className="flex-1 h-px bg-border-default"></div>
          </div>

          {renderScanner()}
        </div>

        {/* Right Column (45%) */}
        <div className="bg-white p-6 md:p-12 lg:pr-[max(24px,calc((100vw-1440px)/2+24px))] lg:pl-16 lg:py-16 border-t lg:border-t-0 lg:border-l border-border-default flex flex-col justify-center overflow-y-auto lg:h-[calc(100vh-64px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-text-secondary font-body font-semibold">Checking your numbers...</p>
            </div>
          ) : (
            renderResult()
          )}
        </div>
      </div>
    );
  }

  // Render normal layout (home quick checker)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-text-primary items-start">
      {/* Input Side */}
      <div className="space-y-6">
        {renderInputs()}

        {/* OR Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-border-default"></div>
          <span className="text-text-muted text-xs font-body">OR</span>
          <div className="flex-1 h-px bg-border-default"></div>
        </div>

        {renderScanner()}
      </div>

      {/* Result Side */}
      <div className="lg:sticky lg:top-24">
        {loading ? (
          <Card className="h-full min-h-[350px] flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-text-secondary font-body font-semibold">Checking your numbers...</p>
          </Card>
        ) : (
          renderResult()
        )}
      </div>
    </div>
  );
}
