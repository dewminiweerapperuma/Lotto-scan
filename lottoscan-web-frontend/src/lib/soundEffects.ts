/**
 * LottoScan Sound & Voice Synthesis Module
 * Provides Web Audio API synthesized sound effects and Web Speech API voice announcements
 * for lottery ticket evaluation (Prize amounts, warnings for no-match, and expired tickets).
 */

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const storedSound = localStorage.getItem("lottoscan_sound_enabled");
      if (storedSound !== null) {
        this.soundEnabled = storedSound === "true";
      }
      const storedVoice = localStorage.getItem("lottoscan_voice_enabled");
      if (storedVoice !== null) {
        this.voiceEnabled = storedVoice === "true";
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return null;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("lottoscan_sound_enabled", String(enabled));
    }
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("lottoscan_voice_enabled", String(enabled));
    }
  }

  /**
   * 1. WARNING SOUND: For tickets with NO match / NO prize
   * Descending dual discordant warning buzzer (220Hz -> 140Hz)
   */
  public playWarningSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pulse 1: Low-frequency buzz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(220, now); // A3
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.16);

      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Pulse 2: Lower follow-up warning buzz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(180, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(110, now + 0.38);

      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.38);
    } catch {}
  }

  /**
   * 2. EXPIRED WARNING SOUND: For tickets older than 6 months
   * Rapid urgent triple alarm tone
   */
  public playExpiredWarningSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.12, 0.24].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(320, now + offset);
        osc.frequency.exponentialRampToValueAtTime(180, now + offset + 0.09);

        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {}
  }

  /**
   * 3. SMALL PRIZE SOUND (e.g. Rs. 40, Rs. 50, Rs. 100):
   * Crisp, cheerful dual coin-ding cash register tone (E5 -> B5)
   */
  public playSmallPrizeSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: E5 (659Hz) crisp bell ding
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      // Note 2: B5 (987.77Hz) bright chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(987.77, now + 0.06);
      gain2.gain.setValueAtTime(0.3, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.3);
    } catch {}
  }

  /**
   * 4. MEDIUM PRIZE SOUND (Rs. 200 - Rs. 9,999):
   * 3-tone ascending victory arpeggio (C5 -> E5 -> G5 -> C6)
   */
  public playMediumPrizeSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, start: 0, dur: 0.1 },     // C5
        { f: 659.25, start: 0.09, dur: 0.1 },  // E5
        { f: 783.99, start: 0.18, dur: 0.1 },  // G5
        { f: 1046.5, start: 0.27, dur: 0.35 }, // C6
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, now + n.start);

        gain.gain.setValueAtTime(0.28, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.start + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.start);
        osc.stop(now + n.start + n.dur);
      });
    } catch {}
  }

  /**
   * 5. JACKPOT / MAJOR PRIZE SOUND (Rs. 10,000+ to Millions):
   * Celebratory triumphant fanfare with shimmering high harmonics
   */
  public playJackpotSound() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [
        { f: 523.25, start: 0, dur: 0.12 },     // C5
        { f: 659.25, start: 0.1, dur: 0.12 },    // E5
        { f: 783.99, start: 0.2, dur: 0.14 },    // G5
        { f: 1046.5, start: 0.32, dur: 0.22 },   // C6
        { f: 1318.51, start: 0.45, dur: 0.55 },  // E6 triumphant chord
      ];

      fanfare.forEach((n) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(n.f, now + n.start);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(n.f * 1.005, now + n.start); // shimmer detune

        gain.gain.setValueAtTime(0.32, now + n.start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.start + n.dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now + n.start);
        osc2.start(now + n.start);
        osc1.stop(now + n.start + n.dur);
        osc2.stop(now + n.start + n.dur);
      });
    } catch {}
  }

  /**
   * Formats a numeric prize into natural spoken English.
   * e.g. 40 -> "Forty Rupees"
   * e.g. 2000000 -> "Two Million Rupees"
   */
  private formatPrizeForSpeech(amount: number): string {
    if (amount <= 0) return "No prize";
    if (amount === 40) return "Rupees Forty";
    if (amount === 50) return "Rupees Fifty";
    if (amount === 100) return "Rupees One Hundred";
    if (amount === 200) return "Rupees Two Hundred";
    if (amount === 500) return "Rupees Five Hundred";
    if (amount === 1000) return "Rupees One Thousand";
    if (amount === 2000) return "Rupees Two Thousand";
    if (amount === 5000) return "Rupees Five Thousand";
    if (amount === 10000) return "Rupees Ten Thousand";
    if (amount === 100000) return "Rupees One Hundred Thousand";
    if (amount === 2000000) return "Rupees Two Million! Winner!";

    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return `${millions.toFixed(1).replace(/\.0$/, "")} Million Rupees! Winner!`;
    }
    if (amount >= 1000) {
      const thousands = Math.round(amount / 1000);
      return `${thousands} Thousand Rupees`;
    }
    return `Rupees ${amount}`;
  }

  /**
   * Spoken voice announcement via Web Speech API
   */
  public speak(text: string) {
    if (!this.voiceEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.08;
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  /**
   * Master Feedback Dispatcher:
   * Plays the tailored audio chime AND speaks the prize or warning.
   */
  public playResultFeedback(options: {
    isWinner?: boolean;
    prizeAmount?: number;
    isExpired?: boolean;
    isFutureDraw?: boolean;
  }) {
    const { isWinner, prizeAmount = 0, isExpired, isFutureDraw } = options;

    if (isExpired) {
      this.playExpiredWarningSound();
      this.speak("Warning. Ticket expired.");
      return;
    }

    if (isFutureDraw) {
      this.playSmallPrizeSound();
      this.speak("Scheduled future draw.");
      return;
    }

    if (isWinner && prizeAmount > 0) {
      if (prizeAmount <= 150) {
        // e.g. Rs. 40, Rs. 50, Rs. 100
        this.playSmallPrizeSound();
      } else if (prizeAmount < 10000) {
        // e.g. Rs. 200 - Rs. 5,000
        this.playMediumPrizeSound();
      } else {
        // e.g. Rs. 10,000 - Millions
        this.playJackpotSound();
      }

      // Voice announcement
      const speechText = this.formatPrizeForSpeech(prizeAmount);
      this.speak(speechText);
    } else {
      // No win / No match -> Output warning!
      this.playWarningSound();
      this.speak("Warning. No prize.");
    }
  }
}

export const soundEffects = new SoundEffectsService();
export default soundEffects;
