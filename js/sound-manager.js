export class SoundManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this._initialized = false;
    this._boundHandlers = {
      start: () => this.playClassStart(),
      end: () => this.playClassEnd(),
      warning: () => this.playWarning()
    };
  }

  init() {
    if (this._initialized) return;
    if (!this.settings.soundEnabled) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio API not available');
      return;
    }

    document.addEventListener('classync:class-start', this._boundHandlers.start);
    document.addEventListener('classync:class-end', this._boundHandlers.end);
    document.addEventListener('classync:warning', this._boundHandlers.warning);
  }

  _ensureContext() {
    if (!this.ctx || !this._initialized) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx.state !== 'closed';
  }

  playClassStart() {
    if (!this._ensureContext()) return;
    this._playChime([523.25, 659.25, 783.99], [0, 0.12, 0.24], [0.15, 0.15, 0.35]);
  }

  playClassEnd() {
    if (!this._ensureContext()) return;
    this._playChime([783.99, 659.25, 523.25], [0, 0.12, 0.24], [0.15, 0.15, 0.35]);
  }

  playWarning() {
    if (!this._ensureContext()) return;
    this._playTone(440, 0, 0.2, 0.15);
    this._playTone(440, 0.3, 0.2, 0.15);
  }

  _playChime(frequencies, delays, durations) {
    frequencies.forEach((freq, i) => {
      this._playTone(freq, delays[i], durations[i], 0.25);
    });
  }

  _playTone(freq, startDelay, duration, volume = 0.3) {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const t = this.ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.setValueAtTime(volume, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }
}
