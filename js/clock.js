const DAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export class Clock {
  constructor() {
    this._clockEl = document.querySelector('.clock-time');
    this._dateEl = document.querySelector('.date-text');
    this._dayEl = document.querySelector('.day-text');
    this._rafId = null;
    this._lastSecond = -1;
  }

  start() {
    this._updateDate();
    this._tick();
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  _tick() {
    const now = new Date();
    const second = now.getSeconds();

    if (second !== this._lastSecond) {
      this._lastSecond = second;
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(second).padStart(2, '0');
      this._clockEl.textContent = `${h}:${m}:${s}`;

      if (h === '00' && m === '00' && s === '00') {
        this._updateDate();
      }
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }

  _updateDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    this._dateEl.textContent = `${year}年${month}月${day}日`;
    this._dayEl.textContent = DAY_LABELS[now.getDay()];
  }

  static getNowMs() {
    const now = new Date();
    return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
  }
}
