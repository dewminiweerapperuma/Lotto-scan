/**
 * Web Serial API Hardware Driver for Physical Barcode Scanners
 * Supports fixed POS kiosk scanner machines and desktop omnidirectional readers
 * communicating over RS-232, USB CDC, or Virtual COM ports.
 */

import { cleanBarcodeString, classifyBarcode, broadcastScannerEvent } from "./physicalScanner";

export class SerialScannerDriver {
  private static instance: SerialScannerDriver | null = null;
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private status: "disconnected" | "connecting" | "connected" | "error" = "disconnected";
  private statusListeners = new Set<(status: "disconnected" | "connecting" | "connected" | "error") => void>();
  private onScanCallback: ((cleanData: string, rawData: string) => void) | null = null;

  public static getInstance(): SerialScannerDriver {
    if (!SerialScannerDriver.instance) {
      SerialScannerDriver.instance = new SerialScannerDriver();
    }
    return SerialScannerDriver.instance;
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  public getStatus(): "disconnected" | "connecting" | "connected" | "error" {
    return this.status;
  }

  public subscribeStatus(listener: (status: "disconnected" | "connecting" | "connected" | "error") => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(s: "disconnected" | "connecting" | "connected" | "error") {
    this.status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  /**
   * Request physical COM port and initiate serial stream reading
   */
  public async connect(baudRate: number = 9600, onScan: (cleanData: string, rawData: string) => void): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error("Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.");
    }

    try {
      this.setStatus("connecting");
      this.onScanCallback = onScan;

      // Prompt user to pick physical scanner device / COM port
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      this.port = port;
      this.setStatus("connected");

      this.startReading();

      // Listen for unexpected hardware disconnection
      port.addEventListener?.("disconnect", () => {
        this.disconnect();
      });

      return true;
    } catch (err: any) {
      this.setStatus("error");
      throw err;
    }
  }

  private async startReading() {
    if (!this.port || !this.port.readable) return;
    this.isReading = true;

    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    this.reader = reader;

    let lineBuffer = "";
    let burstStartTime = performance.now();

    try {
      while (this.isReading) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        if (lineBuffer.length === 0) {
          burstStartTime = performance.now();
        }

        lineBuffer += value;

        // Check if barcode terminator is received (CR or LF)
        if (lineBuffer.includes("\r") || lineBuffer.includes("\n")) {
          const lines = lineBuffer.split(/[\r\n]+/);
          // Process all completed lines
          for (let i = 0; i < lines.length - 1; i++) {
            const rawLine = lines[i];
            const clean = cleanBarcodeString(rawLine);
            if (clean.length >= 3) {
              const durationMs = Math.max(1, Math.round(performance.now() - burstStartTime));
              const type = classifyBarcode(clean);

              broadcastScannerEvent({
                rawData: rawLine,
                cleanData: clean,
                type,
                charCount: clean.length,
                durationMs,
                averageInterKeyMs: Number((durationMs / clean.length).toFixed(1)),
                timestamp: Date.now(),
                source: "serial_port",
              });

              if (this.onScanCallback) {
                this.onScanCallback(clean, rawLine);
              }
            }
          }
          // Retain remaining incomplete buffer
          lineBuffer = lines[lines.length - 1] || "";
          burstStartTime = performance.now();
        }
      }
    } catch (err) {
      console.warn("[SerialScanner] Stream closed or error:", err);
    } finally {
      try {
        reader.releaseLock();
      } catch {}
      this.setStatus("disconnected");
    }
  }

  public async disconnect() {
    this.isReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
      this.port = null;
    }
    this.setStatus("disconnected");
  }
}

export const serialScanner = SerialScannerDriver.getInstance();
