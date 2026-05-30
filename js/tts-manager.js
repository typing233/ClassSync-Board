export class TTSManager {
  constructor(settings, storage) {
    this.settings = settings || {};
    this._storage = storage;
    this._synth = window.speechSynthesis || null;
    this._voice = null;
    this._initialized = false;
    this._boundHandlers = {
      start: (e) => this._onClassStart(e),
      end: () => this._onClassEnd(),
      warning: (e) => this._onWarning(e)
    };
  }

  init() {
    if (this._initialized || !this._synth) return;
    if (!this.settings.enabled) return;

    this._initialized = true;
    this._selectVoice();

    if (this._synth.onvoiceschanged !== undefined) {
      this._synth.onvoiceschanged = () => this._selectVoice();
    }

    document.addEventListener('classync:class-start', this._boundHandlers.start);
    document.addEventListener('classync:class-end', this._boundHandlers.end);
    document.addEventListener('classync:warning', this._boundHandlers.warning);
  }

  speak(text) {
    if (!this._synth || !this._initialized || !this.settings.enabled) return;
    this._synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.volume = this.settings.volume ?? 0.8;
    utter.rate = this.settings.rate ?? 1.0;
    if (this._voice) utter.voice = this._voice;
    this._synth.speak(utter);
  }

  setEnabled(enabled) {
    this.settings.enabled = enabled;
    this._storage.set('settings', { ...this._storage.get('settings', {}), tts: this.settings });
    if (enabled && !this._initialized) this.init();
  }

  setVolume(vol) {
    this.settings.volume = vol;
  }

  setRate(rate) {
    this.settings.rate = rate;
  }

  setVoice(voiceName) {
    this.settings.voiceName = voiceName;
    const voices = this._synth.getVoices();
    this._voice = voices.find(v => v.name === voiceName) || null;
  }

  getAvailableVoices() {
    if (!this._synth) return [];
    return this._synth.getVoices().filter(v => v.lang.startsWith('zh'));
  }

  destroy() {
    document.removeEventListener('classync:class-start', this._boundHandlers.start);
    document.removeEventListener('classync:class-end', this._boundHandlers.end);
    document.removeEventListener('classync:warning', this._boundHandlers.warning);
  }

  _onClassStart(e) {
    const subject = e.detail.currentPeriod?.subject;
    if (subject) this.speak(`上课了，请准备上${subject}`);
  }

  _onClassEnd() {
    this.speak('下课了，休息一下');
  }

  _onWarning(e) {
    const subject = e.detail.nextPeriod?.subject;
    if (subject) this.speak(`还有一分钟上${subject}课`);
  }

  _selectVoice() {
    const voices = this._synth.getVoices();
    const savedName = this.settings.voiceName;
    if (savedName) {
      this._voice = voices.find(v => v.name === savedName) || null;
      if (this._voice) return;
    }
    this._voice = voices.find(v => v.lang === 'zh-CN')
      || voices.find(v => v.lang.startsWith('zh'))
      || null;
  }
}
