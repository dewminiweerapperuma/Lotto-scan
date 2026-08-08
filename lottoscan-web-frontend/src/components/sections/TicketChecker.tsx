"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { lottery as lotteryApi } from "@/lib/api";
import { LOTTERIES } from "@/lib/constants";
import NumberBall from "@/components/ui/NumberBall";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch {
      setError("Camera access denied. Please enter numbers manually.");
    }
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
      try {
        let nums: number[] = [];
        try {
          const p = JSON.parse(qr.data);
          nums = Array.isArray(p) ? p.map(Number) : p.numbers?.map(Number) || [];
        } catch {
          nums = qr.data
            .split(/[,\s]+/)
            .map(Number)
            .filter((n) => !isNaN(n) && n > 0);
        }
        if (nums.length > 0) {
          setNumbers(nums.slice(0, 5).map(String).concat(["", "", "", "", ""]).slice(0, 5));
          stopCamera();
        }
      } catch {}
    } else {
      animRef.current = requestAnimationFrame(scanFrame);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (showCamera) startCamera();
    return () => stopCamera();
  }, [showCamera, startCamera, stopCamera]);

  const handleNumberChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-2);
    const newNums = [...numbers];
    newNums[index] = v;
    setNumbers(newNums);
    if (v.length === 2 && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleCheck = async () => {
    const nums = numbers.map(Number).filter((n) => n > 0);
    if (nums.length === 0) {
      setError("Please enter at least one number");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await lotteryApi.checkTicket(nums, drawDate);
      setResult(res.data);
      sessionStorage.setItem("lottoscan_result", JSON.stringify(res.data));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to check ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNumbers(["", "", "", "", ""]);
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
            Your Ticket Numbers
          </label>
          <div className="flex gap-3">
            {numbers.map((num, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                value={num}
                onChange={(e) => handleNumberChange(i, e.target.value)}
                placeholder="0"
                maxLength={2}
                className="number-input flex-1 min-w-0"
              />
            ))}
          </div>
        </div>

        {/* Letter & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-text-secondary text-xs font-body font-bold uppercase tracking-wider mb-2 block">
              Letter (optional)
            </label>
            <input
              type="text"
              value={letter}
              onChange={(e) => setLetter(e.target.value.toUpperCase().slice(0, 1))}
              placeholder="A"
              maxLength={1}
              className="input-dark text-center font-mono text-lg uppercase"
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

  const renderScanner = () => (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-light border border-gold-border flex items-center justify-center text-xl">
            📷
          </div>
          <div>
            <p className="text-text-primary font-body font-semibold">Scan QR Code</p>
            <p className="text-text-secondary text-xs font-body">Scan the QR code on your lottery ticket</p>
          </div>
        </div>

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
          <div
            onClick={() => setShowCamera(true)}
            className="border-2 border-dashed border-gold-border bg-gold-light/10 hover:bg-gold-light/20 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
          >
            <div className="text-3xl text-gold-dark mb-2">📷</div>
            <p className="text-gold-dark font-body font-semibold text-sm">Click to activate camera</p>
            <p className="text-text-secondary text-xs font-body mt-1">Scan the QR code on your ticket</p>
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
                <div>
                  <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                    Your Numbers
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {result.ticketNumbers?.map((n: number, i: number) => (
                      <NumberBall key={i} number={n} matched={result.matchedNumbers?.includes(n)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                    Winning Numbers
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {result.winningNumbers?.map((n: number, i: number) => (
                      <NumberBall key={i} number={n} variant="default" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid draw info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-4 border-t border-border-default/40">
                {[
                  ["Lottery", result.lotteryName],
                  ["Draw #", result.drawNumber],
                  ["Date", result.drawDate],
                  ["Matches", `${result.matchedCount}/${result.winningNumbers?.length || 5}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-text-muted text-[10px] uppercase font-bold">{k}</p>
                    <p className="text-text-primary font-body font-bold text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

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
                  Your Numbers
                </p>
                <div className="flex gap-2 flex-wrap">
                  {result.ticketNumbers.map((n: number, i: number) => (
                    <NumberBall key={i} number={n} variant="unmatched" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-text-secondary text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                  Winning Numbers
                </p>
                <div className="flex gap-2 flex-wrap">
                  {result.winningNumbers.map((n: number, i: number) => (
                    <NumberBall key={i} number={n} variant="default" />
                  ))}
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
