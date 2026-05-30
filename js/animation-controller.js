export class AnimationController {
  constructor(settings) {
    this.settings = settings;
    this._overlay = document.getElementById('transition-overlay');
    this._iconEl = this._overlay.querySelector('.transition-overlay__icon');
    this._subjectEl = this._overlay.querySelector('.transition-overlay__subject');
    this._statusEl = this._overlay.querySelector('.transition-overlay__status');
    this._isAnimating = false;
    this._queue = [];
  }

  init() {
    document.addEventListener('classync:class-start', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this._enqueue(period, '上课啦');
    });
    document.addEventListener('classync:class-end', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this._enqueue(period, '下课啦');
    });
  }

  _enqueue(period, statusText) {
    this._queue.push({ period, statusText });
    if (!this._isAnimating) this._playNext();
  }

  _playNext() {
    if (this._queue.length === 0) {
      this._isAnimating = false;
      return;
    }

    this._isAnimating = true;
    const { period, statusText } = this._queue.shift();

    this._iconEl.textContent = period.theme.icon;
    this._subjectEl.textContent = period.subject;
    this._statusEl.textContent = statusText;

    this._overlay.classList.add('active');

    const duration = this.settings.animationDuration || 3000;

    setTimeout(() => {
      this._overlay.classList.remove('active');
      setTimeout(() => {
        this._playNext();
      }, 400);
    }, duration);
  }
}
