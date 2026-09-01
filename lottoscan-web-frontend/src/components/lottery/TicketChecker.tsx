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

  const handleNumberChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 2);
    const next = [...numbers]; next[index] = v; setNumbers(next);
    if (v.length === 2 && index < 4) inputRefs.current[index + 1]?.focus();
  };

  const handleCheck = async () => {
    const nums = numbers.map(Number).filter(n => !isNaN(n) && n > 0);
    if (nums.length === 0) { setError("Please enter at least one number"); return; }
    setLoading(true); setError(""); setResult(null);
    try { const res = await lotteryApi.checkTicket(nums, date); setResult(res.data); }
    catch (err: any) { setError(err.response?.data?.error || "Failed to check ticket. Please try again."); }
    finally { setLoading(false); }
  };

  const handleClear = () => { setNumbers(["", "", "", "", ""]); setLetter(""); setResult(null); setError(""); inputRefs.current[0]?.focus(); };

  const scanFrame = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) { animRef.current = requestAnimationFrame(scanFrame); return; }
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(imageData.data, imageData.width, imageData.height);
    if (qr?.data) {
      stopScanner();
      try {
        let nums: number[] = [];
        try { const p = JSON.parse(qr.data); nums = Array.isArray(p) ? p.map(Number) : p.numbers?.map(Number) || []; }
        catch { nums = qr.data.split(/[,\s]+/).map(Number).filter(n => !isNaN(n) && n > 0); }
        if (nums.length > 0) setNumbers([...nums.slice(0, 5), ...Array(5).fill(0)].slice(0, 5).map(String));
      } catch {}
      return;
    }
    animRef.current = requestAnimationFrame(scanFrame);
  }, []);

  const startScanner = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); scanFrame(); }
    } catch { setError("Camera access denied. Enter numbers manually."); setShowScanner(false); }
  };

  const stopScanner = () => { cancelAnimationFrame(animRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); setShowScanner(false); };
  useEffect(() => () => { cancelAnimationFrame(animRef.current); streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

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
        {!showScanner ? (
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center space-y-3">
            <div className="text-4xl">📷</div>
            <p className="text-white/40 font-body text-sm">Scan the QR code on your ticket</p>
            <Button onClick={startScanner} variant="secondary" size="sm">Activate Camera</Button>
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
