export class AnimationController {
  constructor(settings) {
    this.settings = settings;
    this._overlay = document.getElementById('transition-overlay');
    this._iconEl = this._overlay.querySelector('.transition-overlay__icon');
    this._subjectEl = this._overlay.querySelector('.transition-overlay__subject');
    this._statusEl = this._overlay.querySelector('.transition-overlay__status');
    this._isAnimating = false;
  }

  init() {
    document.addEventListener('classync:class-start', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this._playTransition(period, '上课啦');
    });
    document.addEventListener('classync:class-end', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this._playTransition(period, '下课啦');
    });
  }

  _playTransition(period, statusText) {
    if (this._isAnimating) return;
    this._isAnimating = true;

    this._iconEl.textContent = period.theme.icon;
    this._subjectEl.textContent = period.subject;
    this._statusEl.textContent = statusText;

    this._overlay.classList.add('active');

    const duration = this.settings.animationDuration || 3000;

    setTimeout(() => {
      this._overlay.classList.remove('active');
      setTimeout(() => {
        this._isAnimating = false;
      }, 500);
    }, duration);
  }
}
