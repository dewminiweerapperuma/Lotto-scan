'use client';

import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import jsQR from 'jsqr';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Upload,
  CameraOff,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { scanTicketImage, decodeCanvasWithZXing } from '@/lib/ticketScanner';

interface LaptopQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  className?: string;
  autoCooldownMs?: number;
}

/** Check if device name suggests a virtual/software camera */
function isVirtualCamera(label: string): boolean {
  return /virtual|obs|snap\s*cam|droidcam|iriun|manycam|screen/i.test(label || '');
}

export default function LaptopQrScanner({
  onScanSuccess,
  className = '',
  autoCooldownMs = 2500,
}: LaptopQrScannerProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef(false);
  const lastScannedTextRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const onScanSuccessRef = useRef(onScanSuccess);
  const autoCooldownMsRef = useRef(autoCooldownMs);
  const frameScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reactId = useId();
  const containerId = useRef(`lotto-qr-${reactId.replace(/[^a-zA-Z0-9_-]/g, '') || 'webcam'}`).current;

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    autoCooldownMsRef.current = autoCooldownMs;
  }, [autoCooldownMs]);

  // Audio chime feedback
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.05);
      gain2.gain.setValueAtTime(0.3, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.22);
    } catch {
      try {
        new Audio('/sounds/beep.mp3').play().catch(() => {});
      } catch {}
    }
  }, []);

  const handleDecoded = useCallback(
    (decodedText: string) => {
      const cleanText = decodedText.trim();
      if (!cleanText) return;

      const now = Date.now();
      if (isCooldownRef.current) return;
      if (
        lastScannedTextRef.current === cleanText &&
        now - lastScannedTimeRef.current < autoCooldownMsRef.current
      ) {
        return;
      }

      isCooldownRef.current = true;
      lastScannedTextRef.current = cleanText;
      lastScannedTimeRef.current = now;

      setLastScanned(cleanText);
      playBeep();
      onScanSuccessRef.current?.(cleanText);

      setTimeout(() => {
        isCooldownRef.current = false;
      }, autoCooldownMsRef.current);
    },
    [playBeep]
  );

  const stopScanner = useCallback(async () => {
    if (frameScanIntervalRef.current) {
      clearInterval(frameScanIntervalRef.current);
      frameScanIntervalRef.current = null;
    }

    const instance = html5QrCodeRef.current;
    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch (err) {
        console.warn('Webcam stop warning:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  }, []);

  // Multi-pass real-time frame scanner on the active <video> element
  const startParallelFrameScanner = useCallback(() => {
    if (frameScanIntervalRef.current) {
      clearInterval(frameScanIntervalRef.current);
    }

    const canvas = document.createElement('canvas');
    const centerCanvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const centerCtx = centerCanvas.getContext('2d', { willReadFrequently: true });

    frameScanIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current || isCooldownRef.current) return;
      const video = document.querySelector<HTMLVideoElement>(`#${containerId} video`);
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
        }

        if (!ctx) return;
        ctx.drawImage(video, 0, 0, vw, vh);

        // 1. Center Crop Pass (where user centers the ticket)
        const cropW = Math.floor(vw * 0.75);
        const cropH = Math.floor(vh * 0.75);
        const cropX = Math.floor((vw - cropW) / 2);
        const cropY = Math.floor((vh - cropH) / 2);

        if (centerCanvas.width !== cropW || centerCanvas.height !== cropH) {
          centerCanvas.width = cropW;
          centerCanvas.height = cropH;
        }

        if (centerCtx) {
          centerCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          // Pass 1A: Center with jsQR
          const centerImgData = centerCtx.getImageData(0, 0, cropW, cropH);
          const centerQr = jsQR(centerImgData.data, cropW, cropH, {
            inversionAttempts: 'attemptBoth',
          });
          if (centerQr && centerQr.data) {
            handleDecoded(centerQr.data);
            return;
          }

          // Pass 1B: ZXing on center
          const zxingCenterResult = decodeCanvasWithZXing(centerCanvas);
          if (zxingCenterResult) {
            handleDecoded(zxingCenterResult);
            return;
          }

          // Pass 1C: High-contrast binarization on center
          const d = centerImgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            const b = lum < 118 ? 0 : 255;
            d[i] = b;
            d[i + 1] = b;
            d[i + 2] = b;
          }
          centerCtx.putImageData(centerImgData, 0, 0);

          const contrastQr = jsQR(centerImgData.data, cropW, cropH, {
            inversionAttempts: 'attemptBoth',
          });
          if (contrastQr && contrastQr.data) {
            handleDecoded(contrastQr.data);
            return;
          }
        }

        // 2. Full Frame Fallback
        const fullImgData = ctx.getImageData(0, 0, vw, vh);
        const fullQr = jsQR(fullImgData.data, vw, vh, {
          inversionAttempts: 'attemptBoth',
        });
        if (fullQr && fullQr.data) {
          handleDecoded(fullQr.data);
          return;
        }

        const zxingFull = decodeCanvasWithZXing(canvas);
        if (zxingFull) {
          handleDecoded(zxingFull);
          return;
        }
      } catch (e) {
        // Ignored frame read error
      }
    }, 140);
  }, [containerId, handleDecoded]);

  const startScannerWithDevice = useCallback(
    async (cameraId: string) => {
      try {
        setCameraReady(false);
        setErrorMessage(null);

        await stopScanner();

        if (!isMountedRef.current) return;

        const containerEl = document.getElementById(containerId);
        if (!containerEl) {
          throw new Error('Scanner container element not found.');
        }

        // Configure engine with QR code + 1D barcode formats
        const qrCodeInstance = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });
        html5QrCodeRef.current = qrCodeInstance;

        const scanConfig = {
          fps: 24,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.max(Math.floor(minDim * 0.88), 180),
              height: Math.max(Math.floor(minDim * 0.88), 180),
            };
          },
        };

        try {
          if (cameraId) {
            await qrCodeInstance.start(cameraId, scanConfig, handleDecoded, () => {});
          } else {
            await qrCodeInstance.start({ facingMode: 'user' }, scanConfig, handleDecoded, () => {});
          }
        } catch (startErr: any) {
          console.warn('Direct device start failed, falling back to universal webcam mode:', startErr?.message);

          try {
            qrCodeInstance.clear();
          } catch {}

          const fallbackInstance = new Html5Qrcode(containerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
            verbose: false,
          });
          html5QrCodeRef.current = fallbackInstance;

          // Universal fallback: try user facing mode or generic constraint
          try {
            await fallbackInstance.start({ facingMode: 'user' }, { fps: 15 }, handleDecoded, () => {});
          } catch {
            await fallbackInstance.start({ facingMode: 'environment' }, { fps: 15 }, handleDecoded, () => {});
          }
        }

        if (isMountedRef.current) {
          setCameraReady(true);
          startParallelFrameScanner();
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        if (isMountedRef.current) {
          const msg = err?.message || String(err);
          if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
            setErrorMessage('Camera access was blocked. Please click the 🔒 lock icon in your browser address bar and allow Camera access.');
          } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
            setErrorMessage('No camera found on this device. Please connect a webcam or upload a photo of the ticket.');
          } else if (msg.includes('NotReadableError') || msg.includes('TrackStartError')) {
            setErrorMessage('Camera is currently in use by another application (e.g. Teams, Zoom, or OBS). Please close other apps and click Retry.');
          } else {
            setErrorMessage('Could not open camera stream. Please switch camera device or upload a ticket photo.');
          }
        }
      }
    },
    [containerId, handleDecoded, stopScanner, startParallelFrameScanner]
  );

  const initCameras = useCallback(async () => {
    try {
      setErrorMessage(null);

      // Enumerate available video inputs directly with Html5Qrcode
      let cameraDevices: CameraDevice[] = [];
      try {
        cameraDevices = await Html5Qrcode.getCameras();
      } catch (e: any) {
        console.warn('Could not enumerate cameras:', e);
      }

      if (!isMountedRef.current) return;

      if (cameraDevices && cameraDevices.length > 0) {
        setDevices(cameraDevices);

        // Prioritize physical hardware webcam over OBS Virtual Camera or software cams
        let chosenDevice = cameraDevices.find((d) => !isVirtualCamera(d.label));
        if (!chosenDevice) {
          chosenDevice = cameraDevices[0];
        }

        setSelectedDeviceId(chosenDevice.id);
        await startScannerWithDevice(chosenDevice.id);
      } else {
        // Fallback directly to user facing camera
        setSelectedDeviceId('');
        await startScannerWithDevice('');
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMessage(
          err?.message || 'Failed to access webcam. Please check browser permissions.'
        );
      }
    }
  }, [startScannerWithDevice]);

  useEffect(() => {
    isMountedRef.current = true;
    initCameras();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [initCameras, stopScanner]);

  // Handle manual camera device selection from dropdown
  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    await startScannerWithDevice(newDeviceId);
  };

  // ─── "Snap & Scan" Feature: Freeze Frame & Deep Scan ───
  // Takes the current video frame as high-res image and runs multi-engine OCR + ZXing + jsQR
  const handleCaptureSnapshot = async () => {
    const video = document.querySelector<HTMLVideoElement>(`#${containerId} video`);
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      setErrorMessage('Camera is not ready. Please wait for the video feed to load.');
      return;
    }

    setIsCapturingSnapshot(true);
    setCaptureStatus('Capturing high-res frame...');

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = video.videoWidth;
      snapCanvas.height = video.videoHeight;
      const snapCtx = snapCanvas.getContext('2d');
      if (!snapCtx) throw new Error('Could not create canvas context');

      snapCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Snapshot image load error'));
        img.src = snapCanvas.toDataURL('image/jpeg', 0.95);
      });

      setCaptureStatus('Analyzing ticket barcode, QR & numbers...');
      const parsed = await scanTicketImage(img, (msg) => setCaptureStatus(msg));

      if (parsed && (parsed.numbers.length > 0 || parsed.rawText)) {
        const payload = parsed.rawText || (parsed.numbers.length > 0 ? parsed.numbers.join(',') : '');
        if (payload) {
          handleDecoded(payload);
          return;
        }
      }

      setErrorMessage('Could not decode ticket from this snapshot. Please hold the ticket closer, ensure good lighting, and tap Capture again.');
    } catch (err: any) {
      console.error('Snapshot capture error:', err);
      setErrorMessage('Failed to analyze camera snapshot. Please try again.');
    } finally {
      setIsCapturingSnapshot(false);
      setCaptureStatus('');
    }
  };

  // Image File Upload Fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCaptureStatus('Reading ticket photo...');
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const parsed = await scanTicketImage(img, (msg) => setCaptureStatus(msg));
            if (parsed && (parsed.numbers.length > 0 || parsed.rawText)) {
              const payload = parsed.rawText || (parsed.numbers.length > 0 ? parsed.numbers.join(',') : '');
              if (payload) {
                handleDecoded(payload);
              }
            } else {
              setErrorMessage('Could not detect barcode or QR code in this photo. Try taking a clearer, well-lit photo.');
            }
          } catch (scanErr) {
            setErrorMessage('Failed to read image. Please try another photo.');
          } finally {
            setIsProcessingFile(false);
            setCaptureStatus('');
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingFile(false);
      setCaptureStatus('');
    }
  };

  return (
    <div
      className={`flex flex-col items-center w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl ${className}`}
    >
      {/* Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Ticket Camera Scanner
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {cameraReady && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Camera
            </span>
          )}
        </div>
      </div>

      {/* Camera Selection Dropdown (if multiple devices like USB Webcam & OBS Virtual Camera) */}
      {devices.length > 1 && (
        <div className="w-full mb-3 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Camera:
          </span>
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer truncate"
          >
            {devices.map((device) => {
              const isVirt = isVirtualCamera(device.label);
              return (
                <option
                  key={device.id}
                  value={device.id}
                  className="bg-slate-900 text-slate-100"
                >
                  {device.label || `Camera (${device.id.slice(0, 8)}...)`}
                  {isVirt ? ' (Virtual Camera)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Hidden file input for upload fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Camera Viewport Container */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner group">
        <div
          id={containerId}
          className="w-full h-full [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full"
        />

        {/* Viewfinder Target Reticle Overlay */}
        {cameraReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Center Box */}
            <div className="relative w-[72%] h-[72%] rounded-xl border border-amber-400/40 bg-transparent flex flex-col items-center justify-between p-2">
              {/* Corner Reticles */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />

              {/* Scanning Red Laser Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />

              <span className="text-[11px] font-mono text-amber-300/80 bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-sm">
                Center QR Code or Barcode here
              </span>
            </div>
          </div>
        )}

        {/* Connecting Spinner */}
        {!cameraReady && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-slate-400 text-xs">
            <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
            <span className="font-medium">Connecting to webcam...</span>
          </div>
        )}

        {/* Error Overlay with Help */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-slate-950/95 text-rose-400 text-xs gap-3 z-10">
            <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
            <p className="font-semibold text-sm text-rose-300 max-w-sm">{errorMessage}</p>

            <div className="text-slate-400 text-[11px] leading-relaxed space-y-1 max-w-xs text-left bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <p className="font-semibold text-slate-200">Troubleshooting:</p>
              <p>• If using Chrome, click the <span className="text-amber-400 font-bold">🔒 lock icon</span> next to the URL and set <span className="text-amber-400 font-bold">Camera → Allow</span>.</p>
              <p>• If you have <span className="text-amber-400 font-bold">OBS</span> or other apps open, close them or select your physical webcam above.</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <button
                type="button"
                onClick={initCameras}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer border border-slate-700 text-xs"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photo Instead
              </button>
            </div>
          </div>
        )}

        {/* Processing State for Snapshot or Upload */}
        {(isCapturingSnapshot || isProcessingFile) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-amber-400 text-xs z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
            <span className="font-semibold text-sm">{captureStatus || 'Analyzing ticket...'}</span>
          </div>
        )}
      </div>

      {/* Primary Action Buttons: Snap & Scan + Upload Photo */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-3 gap-2">
        <button
          type="button"
          onClick={handleCaptureSnapshot}
          disabled={!cameraReady || isCapturingSnapshot}
          className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>📸 Capture & Scan Ticket</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Guidance Note */}
      <p className="text-[11px] text-slate-400 text-center mt-2.5">
        Hold the ticket <span className="text-amber-400 font-semibold">15–20 cm away</span> with good light, or tap <span className="text-amber-400 font-semibold">Capture & Scan</span> to read instantly.
      </p>

      {/* Last Result Notification */}
      {lastScanned && (
        <div className="mt-3 w-full bg-slate-800/90 border border-emerald-800/60 p-2.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Scanned Successfully
            </div>
            <div className="text-xs text-slate-200 font-mono truncate">{lastScanned}</div>
          </div>
        </div>
      )}
    </div>
  );
}
