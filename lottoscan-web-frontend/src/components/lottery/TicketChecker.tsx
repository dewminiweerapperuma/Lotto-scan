"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import jsQR from "jsqr";
import { lottery as lotteryApi } from "@/lib/api";
import { TicketResult, LOTTERIES } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import NumberBall from "@/components/ui/NumberBall";
import Badge from "@/components/ui/Badge";
import ZodiacSelector from "@/components/ui/ZodiacSelector";

export default function TicketChecker() {
  const [numbers, setNumbers] = useState<string[]>(["", "", "", "", ""]);
  const [letter, setLetter] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<TicketResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNumberChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 2);
    const next = [...numbers]; next[index] = v; setNumbers(next);
    if (v.length === 2 && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleCheck = async () => {
    const nums = numbers.map(Number).filter(n => !isNaN(n) && n > 0);
    if (nums.length === 0) { setError("Please enter at least one number"); return; }
    setLoading(true); setError(""); setResult(null);
    try { const res = await lotteryApi.checkTicket(nums, date, undefined, letter || undefined); setResult(res.data); }
    catch (err: any) { setError(err.response?.data?.error || "Failed to check ticket. Please try again."); }
    finally { setLoading(false); }
  };

  const handleClear = () => { setNumbers(["", "", "", "", ""]); setLetter(""); setResult(null); setError(""); inputRefs.current[0]?.focus(); };

  const parseQRText = useCallback((qrText: string) => {
    let nums: (number | string)[] = [];
    let extractedLetter = "";
    let detectedLottery = "";
    let detectedDraw = "";

    if (!qrText || typeof qrText !== "string") {
      return { nums: [], letter: "", lottery: "", draw: "" };
    }

    const clean = qrText.trim();

    try {
      const p = JSON.parse(clean);
      if (Array.isArray(p)) nums = p.map(Number);
      else if (typeof p === "object" && p !== null) {
        if (Array.isArray(p.numbers)) nums = p.numbers.map(Number);
        else if (Array.isArray(p.nums)) nums = p.nums.map(Number);
        if (p.letter || p.l) extractedLetter = String(p.letter || p.l).toUpperCase();
        if (p.lottery || p.name) detectedLottery = String(p.lottery || p.name);
        if (p.draw || p.draw_number) detectedDraw = String(p.draw || p.draw_number);
      }
    } catch {}

    if (nums.length === 0 && (clean.includes("http") || clean.includes("?"))) {
      try {
        const url = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
        const qNums = url.searchParams.get("numbers") || url.searchParams.get("nums") || url.searchParams.get("n");
        const qLetter = url.searchParams.get("letter") || url.searchParams.get("l");
        if (qNums) nums = qNums.split(/[,-]+/).map(Number);
        if (qLetter) extractedLetter = qLetter.toUpperCase();
      } catch {}
    }

    if (nums.length === 0) {
      const parts = clean.split(/[|#;,]+/);
      for (const part of parts) {
        const pTrim = part.trim();
        if (/[0-9]+[ ,-]+[0-9]+/.test(pTrim)) {
          const subNums = pTrim.split(/[ ,-]+/).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 99);
          if (subNums.length >= 2) nums = subNums;
        } else if (/^[A-Za-z]$/.test(pTrim)) {
          extractedLetter = pTrim.toUpperCase();
        }
      }
    }

    if (nums.length === 0) {
      const tokens = clean.split(/[\s,/|-]+/);
      for (const t of tokens) {
        const trimmed = t.trim();
        if (/^[A-Za-z]$/.test(trimmed)) {
          extractedLetter = trimmed.toUpperCase();
        } else if (/^\d{1,2}$/.test(trimmed)) {
          nums.push(Number(trimmed));
        }
      }
    }

    return {
      nums: nums.filter((n) => !isNaN(Number(n)) && Number(n) >= 0),
      letter: extractedLetter,
      lottery: detectedLottery,
      draw: detectedDraw
    };
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) { animRef.current = requestAnimationFrame(scanFrame); return; }
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height);
    if (qr?.data) {
      const { nums, letter: parsedLetter } = parseQRText(qr.data);
      if (nums.length > 0) {
        setNumbers([...nums.slice(0, 5), ...Array(5).fill(0)].slice(0, 5).map(String));
        if (parsedLetter) setLetter(parsedLetter);
        stopScanner();
      } else {
        animRef.current = requestAnimationFrame(scanFrame);
      }
      return;
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, [parseQRText]);

  const startScanner = async () => {
    setShowScanner(true);
    setError("");
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); scanFrame(); }
    } catch { setError("Camera access denied or unavailable. Upload an image or enter numbers manually."); setShowScanner(false); }
  };

  const stopScanner = () => { cancelAnimationFrame(animRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); setShowScanner(false); };
  useEffect(() => () => { cancelAnimationFrame(animRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const processAndScanQR = useCallback(async (img: HTMLImageElement): Promise<{ data: string } | null> => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const formats = ((await (window as any).BarcodeDetector.getSupportedFormats?.()) || ["qr_code"]).filter(Boolean);
        const detector = new (window as any).BarcodeDetector({ formats: formats.length ? formats : ["qr_code", "code_128", "code_39", "ean_13"] });
        const detected = await detector.detect(img);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          return { data: detected[0].rawValue };
        }
      } catch (err) {}
    }

    const scanCanvas = (ctx: CanvasRenderingContext2D, w: number, h: number): { data: string } | null => {
      const imgData = ctx.getImageData(0, 0, w, h);
      try {
        const res = jsQR(imgData.data, w, h, { inversionAttempts: "attemptBoth" });
        if (res?.data) return res;
      } catch {}

      const data = imgData.data;
      let totalLum = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      const avgThreshold = totalLum / (data.length / 4);
      const binarizedData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        binarizedData[i] = lum > avgThreshold * 0.92 ? 255 : 0;
        binarizedData[i + 1] = lum > avgThreshold * 0.92 ? 255 : 0;
        binarizedData[i + 2] = lum > avgThreshold * 0.92 ? 255 : 0;
        binarizedData[i + 3] = 255;
      }
      try {
        const resBin = jsQR(binarizedData, w, h, { inversionAttempts: "attemptBoth" });
        if (resBin?.data) return resBin;
      } catch {}

      return null;
    };

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
    if (!ctx) return null;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, pad, pad, sw, sh);

    const fullResult = scanCanvas(ctx, canvas.width, canvas.height);
    if (fullResult?.data) return fullResult;

    const regions = [
      { x: img.width * 0.4, y: img.height * 0.4, w: img.width * 0.6, h: img.height * 0.6 },
      { x: 0, y: img.height * 0.4, w: img.width * 0.6, h: img.height * 0.6 },
      { x: img.width * 0.4, y: 0, w: img.width * 0.6, h: img.height * 0.6 },
      { x: img.width * 0.2, y: img.height * 0.2, w: img.width * 0.6, h: img.height * 0.6 },
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
        const cropRes = scanCanvas(cropCtx, 600, 600);
        if (cropRes?.data) return cropRes;
      }
    }

    return null;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const qr = await processAndScanQR(img);

          if (qr?.data) {
            const { nums, letter: parsedLetter } = parseQRText(qr.data);
            if (nums.length > 0) {
              setNumbers([...nums.slice(0, 5), ...Array(5).fill(0)].slice(0, 5).map(String));
              if (parsedLetter) setLetter(parsedLetter);
              setError("");
            } else {
              setError(`QR code read ("${qr.data.slice(0, 30)}..."), but could not extract valid ticket numbers.`);
            }
          } else {
            setError("No QR code detected in the uploaded image. Please ensure the QR code is clear and uncropped.");
          }
        } catch (err) {
          setError("Failed to process image. Please try again.");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card padding="lg" className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold">Check Your Ticket</h2>
          <p className="text-white/40 text-sm font-body mt-1">Enter the numbers printed on your lottery ticket</p>
        </div>
        <div className="space-y-2">
          <label className="text-white/50 text-sm font-body">Your Ticket Numbers</label>
          <div className="flex gap-2">
            {numbers.map((n, i) => (
              <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric"
                value={n} onChange={e => handleNumberChange(i, e.target.value)} placeholder="00" maxLength={2}
                className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-white font-mono text-xl font-bold focus:outline-none focus:border-gold/40 transition-colors"/>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ZodiacSelector
            value={letter}
            onChange={setLetter}
            label="Lagna / Letter (optional)"
          />
          <div className="space-y-1.5">
            <label className="text-white/50 text-sm font-body">Draw Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-body focus:outline-none focus:border-gold/40 transition-colors"/>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/50 text-sm font-body">Lottery (optional)</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-body focus:outline-none focus:border-gold/40 transition-colors">
            <option value="">Auto-detect from results</option>
            {LOTTERIES.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </div>
        {error && <p className="text-lose text-sm font-body bg-lose/10 border border-lose/20 rounded-xl p-3">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={handleCheck} loading={loading} fullWidth size="lg">Check My Numbers</Button>
          <Button onClick={handleClear} variant="ghost" size="lg">Clear</Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/[0.06]"/>
          <span className="text-white/30 text-xs font-body">OR</span>
          <div className="flex-1 h-px bg-white/[0.06]"/>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {!showScanner ? (
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl">📷</div>
            <p className="text-white/60 font-body text-sm font-semibold">Scan QR Code or Upload Image</p>
            <p className="text-white/40 text-xs font-body">Scan your ticket using camera or upload a saved photo</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Button onClick={startScanner} variant="secondary" size="sm" className="flex items-center justify-center gap-2">
                <span>📷</span> Open Camera
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary" size="sm" className="flex items-center justify-center gap-2">
                <span>📁</span> Upload Image
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted/>
            <canvas ref={canvasRef} className="hidden"/>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-48">
                {["top-0 left-0", "top-0 right-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-8 h-8`}>
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gold"/>
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-gold"/>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={stopScanner} className="absolute top-3 right-3 bg-black/60 text-white rounded-xl px-3 py-1.5 text-sm">Stop</button>
          </div>
        )}
      </Card>

      <div className="lg:sticky lg:top-24">
        {!result ? (
          <Card padding="lg" className="text-center py-16 space-y-4">
            <div className="text-6xl">🎟️</div>
            <p className="text-white/40 font-body">Enter your numbers to check</p>
            <p className="text-white/20 text-sm font-body">Supports all 16 Sri Lankan lotteries</p>
          </Card>
        ) : result.isWinner ? (
          <Card glow="gold" padding="lg" className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="text-6xl">🏆</div>
              <h3 className="text-3xl font-display font-extrabold text-gold">You Won!</h3>
              <p className="text-5xl font-display font-black">{result.prizeAmountFormatted}</p>
              <Badge variant="gold">{result.prizeCategory}</Badge>
            </div>
            <div className="space-y-4 border-t border-gold/20 pt-4">
              <div className="space-y-2">
                <p className="text-white/40 text-xs font-body">Your Numbers</p>
                <div className="flex gap-2 flex-wrap">
                  {result.ticketNumbers.map((n, i) => <NumberBall key={i} number={n} matched={result.matchedNumbers.includes(n)} size="md"/>)}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white/40 text-xs font-body">Winning Numbers</p>
                <div className="flex gap-2 flex-wrap">
                  {result.winningNumbers.map((n, i) => <NumberBall key={i} number={n} size="md"/>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-white/30 text-xs">Lottery</p><p className="text-white">{result.lotteryName}</p></div>
                <div><p className="text-white/30 text-xs">Draw</p><p className="text-white">#{result.drawNumber}</p></div>
                <div><p className="text-white/30 text-xs">Date</p><p className="text-white">{result.drawDate}</p></div>
                <div><p className="text-white/30 text-xs">Matches</p><p className="text-gold font-bold">{result.matchedCount}/{result.winningNumbers.length}</p></div>
              </div>
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4">
              <p className="text-gold text-sm">🏦 Claim at any NLB/DLB branch within <strong>90 days</strong> with your original ticket and National ID.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigator.share?.({ text: `🎉 I won ${result.prizeAmountFormatted}! #LottoScan` })} fullWidth>🎊 Share</Button>
              <Button onClick={handleClear} variant="secondary">Again</Button>
            </div>
          </Card>
        ) : (
          <Card padding="lg" className="space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="text-6xl">😔</div>
              <h3 className="text-2xl font-display font-bold text-white/60">No Match</h3>
              <p className="text-white/30 text-sm">{result.message || "Better luck next time!"}</p>
            </div>
            {result.winningNumbers?.length > 0 && (
              <div className="space-y-4 border-t border-white/[0.06] pt-4">
                <div className="space-y-2">
                  <p className="text-white/40 text-xs font-body">Your Numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {result.ticketNumbers?.map((n, i) => <NumberBall key={i} number={n} matched={result.matchedNumbers?.includes(n)} size="md"/>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white/40 text-xs font-body">Winning Numbers</p>
                  <div className="flex gap-2 flex-wrap">
                    {result.winningNumbers.map((n, i) => <NumberBall key={i} number={n} size="md"/>)}
                  </div>
                </div>
              </div>
            )}
            <Button onClick={handleClear} variant="secondary" fullWidth>Check Another Ticket</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
