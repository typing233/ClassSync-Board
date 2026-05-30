export class SoundManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this._initialized = false;
  }

  init() {
    if (!this.settings.soundEnabled) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available');
    }

    document.addEventListener('classync:class-start', () => this.playClassStart());
    document.addEventListener('classync:class-end', () => this.playClassEnd());
    document.addEventListener('classync:warning', () => this.playWarning());
  }

  playClassStart() {
    if (!this._initialized) return;
    this._playChime([523.25, 659.25, 783.99], [0, 0.12, 0.24], [0.15, 0.15, 0.35]);
  }

  playClassEnd() {
    if (!this._initialized) return;
    this._playChime([783.99, 659.25, 523.25], [0, 0.12, 0.24], [0.15, 0.15, 0.35]);
  }

  playWarning() {
    if (!this._initialized) return;
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
    if (this.ctx.state === 'suspended') this.ctx.resume();

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
