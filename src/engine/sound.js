/** Tiny sound engine built on the Web Audio API (no audio files needed). */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Creates (or wakes up) the audio context. Browsers start it "suspended". */
  ensureContext() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** One short note. */
  tone({ freq, slideTo, type = 'sine', start = 0, duration = 0.15, volume = 0.08 }) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playStep() {
    this.tone({ freq: 220, slideTo: 90, duration: 0.06, volume: 0.05 });
  }

  playCountdown() {
    this.tone({ freq: 523, type: 'triangle', duration: 0.18, volume: 0.09 });
  }

  playGo() {
    this.tone({ freq: 784, type: 'triangle', duration: 0.35, volume: 0.1 });
  }

  playLose() {
    [350, 300, 250].forEach((freq, i) =>
      this.tone({ freq, type: 'sawtooth', start: i * 0.14, duration: 0.22, volume: 0.07 })
    );
  }

  playWinJingle() {
    [523, 659, 784, 1047].forEach((freq, i) =>
      this.tone({ freq, type: 'triangle', start: 0.45 + i * 0.1, duration: 0.22, volume: 0.08 })
    );
  }

  /** Two-voice "meow": a sliding triangle + sawtooth through a moving filter. */
  playMeow() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.3, now + 0.08);
    master.gain.setValueAtTime(0.3, now + 0.35);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1800, now + 0.15);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.4);
    filter.frequency.linearRampToValueAtTime(600, now + 0.65);
    filter.connect(master);

    const pitch = [[480, 0], [720, 0.12], [620, 0.3], [540, 0.5], [420, 0.65]];
    const voice = (type, level) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      gain.gain.value = level;
      pitch.forEach(([f, t], i) =>
        i === 0 ? osc.frequency.setValueAtTime(f, now + t) : osc.frequency.linearRampToValueAtTime(f, now + t)
      );
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      osc.stop(now + 0.7);
      return osc;
    };
    const main = voice('triangle', 1);
    voice('sawtooth', 0.15);

    const vibrato = ctx.createOscillator();
    const vibratoDepth = ctx.createGain();
    vibrato.frequency.value = 5.5;
    vibratoDepth.gain.value = 12;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(main.frequency);
    vibrato.start(now);
    vibrato.stop(now + 0.7);
  }
}
