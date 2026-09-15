"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
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

export default function TicketChecker({ isFullPage }: { isFullPage?: boolean }) {
  const [numbers, setNumbers] = useState(["", "", "", "", ""]);
  const [letter, setLetter] = useState("");
  const [drawDate, setDrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [lotteryName, setLotteryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setShowCamera(false);
  }, []);

  const parseQRText = useCallback((qrText: string) => {
    let nums: number[] = [];
    let extractedLetter = "";

    try {
      const p = JSON.parse(qrText);
      if (Array.isArray(p)) {
        nums = p.map(Number);
      } else if (typeof p === "object" && p !== null) {
        nums = Array.isArray(p.numbers) ? p.numbers.map(Number) : [];
        if (p.letter) extractedLetter = String(p.letter);
      }
    } catch {
      const parts = qrText.split(/[|/,\s-]+/);
      for (const part of parts) {
        const n = parseInt(part, 10);
        if (!isNaN(n) && n > 0 && n <= 99 && String(n) === part.trim()) {
          nums.push(n);
        } else if (/^[A-Za-z]$/.test(part.trim())) {
          extractedLetter = part.trim().toUpperCase();
        }
      }
      if (nums.length === 0) {
        const matches = qrText.match(/\b\d{1,2}\b/g);
        if (matches) {
          nums = matches.map(Number).filter((n) => n > 0 && n <= 99);
        }
      }
    }

    return { nums: nums.filter((n) => !isNaN(n) && n > 0).slice(0, 5), letter: extractedLetter };
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height);
    if (qr?.data) {
      const { nums, letter: parsedLetter } = parseQRText(qr.data);
      if (nums.length > 0) {
        setNumbers(nums.map(String).concat(["", "", "", "", ""]).slice(0, 5));
        if (parsedLetter) setLetter(parsedLetter);
        stopCamera();
      } else {
        animRef.current = requestAnimationFrame(scanFrame);
      }
    } else {
      animRef.current = requestAnimationFrame(scanFrame);
    }
  }, [stopCamera, parseQRText]);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err: any) {
      console.warn("Camera error:", err);
      setError("Camera access denied or unavailable. Please upload a ticket photo or enter numbers manually.");
      setShowCamera(false);
    }
  }, [scanFrame]);

  useEffect(() => {
    if (showCamera) startCamera();
    return () => stopCamera();
  }, [showCamera, startCamera, stopCamera]);

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
      const res = await lotteryApi.checkTicket(nums, drawDate, lotteryName || undefined, letter || undefined);
      setResult(res.data);
      sessionStorage.setItem("lottoscan_result", JSON.stringify(res.data));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to check ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNumbers(Array(config.digitCount).fill(""));
    setLetter("");
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
            <div className="flex gap-3">
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
                  className={`number-input flex-1 min-w-0 font-mono text-center font-bold ${
                    config.maxDigitsPerBox === 1 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Letter & Date */}
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

  const processAndScanQR = useCallback((img: HTMLImageElement) => {
    let width = img.width;
    let height = img.height;

    // Minimum scale so small crops are enlarged for finder pattern detection
    let scale = 1;
    if (width < 500 || height < 500) {
      scale = Math.max(500 / width, 500 / height);
    } else if (width > 1200 || height > 1200) {
      scale = Math.min(1200 / width, 1200 / height);
    }

    const scaledW = Math.round(width * scale);
    const scaledH = Math.round(height * scale);
    // Add 20% white border padding to reconstruct the QR Quiet Zone for tight crops
    const marginX = Math.max(30, Math.round(scaledW * 0.2));
    const marginY = Math.max(30, Math.round(scaledH * 0.2));
    const canvasW = scaledW + marginX * 2;
    const canvasH = scaledH + marginY * 2;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill with pure white background (quiet zone)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, marginX, marginY, scaledW, scaledH);

    // Pass 1: Standard Padded Scan
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    try {
      const qr = jsQR(imageData.data, canvasW, canvasH, { inversionAttempts: "attemptBoth" });
      if (qr?.data) return qr;
    } catch {}

    // Pass 2: Binarization / Threshold Pass
    const data = imageData.data;
    let totalLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    const avgThreshold = totalLum / (data.length / 4);

    const binarizedData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const val = lum > avgThreshold * 0.93 ? 255 : 0;
      binarizedData[i] = val;
      binarizedData[i + 1] = val;
      binarizedData[i + 2] = val;
      binarizedData[i + 3] = 255;
    }

    try {
      const qrBin = jsQR(binarizedData, canvasW, canvasH, { inversionAttempts: "attemptBoth" });
      if (qrBin?.data) return qrBin;
    } catch {}

    // Pass 3: High Contrast Pass
    const contrastData = new Uint8ClampedArray(data.length);
    const factor = 1.6;
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        contrastData[i + c] = Math.min(255, Math.max(0, Math.round((data[i + c] - 128) * factor + 128)));
      }
      contrastData[i + 3] = 255;
    }

    try {
      const qrContrast = jsQR(contrastData, canvasW, canvasH, { inversionAttempts: "attemptBoth" });
      if (qrContrast?.data) return qrContrast;
    } catch {}

    return null;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const qr = processAndScanQR(img);

        if (qr?.data) {
          const { nums, letter: parsedLetter } = parseQRText(qr.data);
          if (nums.length > 0) {
            setNumbers(nums.map(String).concat(["", "", "", "", ""]).slice(0, 5));
            if (parsedLetter) setLetter(parsedLetter);
            setError("");
          } else {
            setError(`QR code read ("${qr.data.slice(0, 30)}..."), but could not extract valid ticket numbers.`);
          }
        } else {
          setError("No QR code detected in the uploaded image. Please ensure the QR code is clear, well-lit, and uncropped.");
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
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
            <p className="text-text-secondary text-xs font-body">Use your camera or upload a ticket image to scan QR code</p>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {showCamera ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 relative">
                  {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-8 h-8`}>
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-gold" />
                      <div className="absolute top-0 left-0 w-0.5 h-full bg-gold" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={stopCamera} variant="secondary" fullWidth>
              Stop Camera
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gold-border bg-gold-light/10 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl text-gold-dark">📷</div>
            <div>
              <p className="text-gold-dark font-body font-semibold text-sm">Scan QR Code from Ticket</p>
              <p className="text-text-secondary text-xs font-body mt-1">Open your camera or choose a ticket photo from device</p>
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
          <div className="bg-gold-light/35 border border-gold-border rounded-[24px] p-6 md:p-8 relative overflow-hidden border-l-4 border-l-gold shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative space-y-6">
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
                        {(result.userLetter || letter) && (
                          <ZodiacBall
                            value={result.userLetter || letter}
                            size="md"
                            className={result.matchedLetter ? "ring-4 ring-emerald-500 rounded-full shadow-lg" : ""}
                          />
                        )}
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

              <div className="bg-win-light border border-green-200 rounded-2xl p-4 flex gap-3">
                <span className="text-win text-lg">🏦</span>
                <div className="space-y-1">
                  <p className="text-win font-body text-xs font-bold leading-tight">
                    Claim at any NLB/DLB branch within 90 days
                  </p>
                  <p className="text-win/80 font-body text-[11px] leading-tight">
                    Bring original ticket + National ID
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                  {(result.userLetter || letter) && (
                    <ZodiacBall
                      value={result.userLetter || letter}
                      size="md"
                      className={result.matchedLetter ? "ring-4 ring-emerald-500 rounded-full shadow-lg" : ""}
                    />
                  )}
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
