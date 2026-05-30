export class ThemeEngine {
  constructor(themes) {
    this.themes = themes;
    this._currentSubject = null;
    this._bgLayerA = document.querySelector('.bg-layer--a');
    this._bgLayerB = document.querySelector('.bg-layer--b');
    this._usingB = false;
  }

  init() {
    this._applyTimeOfDayTheme();
    document.addEventListener('classync:class-start', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this._applySubjectTheme(period.subject);
    });
    document.addEventListener('classync:class-end', () => {
      this._currentSubject = null;
      this._applyTimeOfDayTheme();
    });
  }

  _applySubjectTheme(subject) {
    if (subject === this._currentSubject) return;
    this._currentSubject = subject;

    const theme = this.themes[subject] || this.themes['default'];
    const root = document.documentElement.style;

    root.setProperty('--theme-primary', theme.primary);
    root.setProperty('--theme-primary-rgb', theme.primaryRgb);
    root.setProperty('--theme-secondary', theme.secondary);
    root.setProperty('--theme-glow', `rgba(${theme.primaryRgb}, 0.4)`);

    this._transitionBackground(theme);
  }

  _applyTimeOfDayTheme() {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    let gradients;

    if (hour < 7) {
      gradients = { start: '#0f0c29', mid: '#1a1a4e', end: '#1e1e3f' };
    } else if (hour < 12) {
      gradients = { start: '#0f2027', mid: '#203a43', end: '#2c5364' };
    } else if (hour < 14) {
      gradients = { start: '#1a1a2e', mid: '#2d2d54', end: '#3d2c4f' };
    } else if (hour < 17) {
      gradients = { start: '#141e30', mid: '#243b55', end: '#2c3e50' };
    } else if (hour < 19) {
      gradients = { start: '#1e1e3f', mid: '#3d2c5e', end: '#4a2c6e' };
    } else {
      gradients = { start: '#0a0a1a', mid: '#1a1a2e', end: '#0f0c29' };
    }

    const root = document.documentElement.style;
    root.setProperty('--bg-gradient-start', gradients.start);
    root.setProperty('--bg-gradient-mid', gradients.mid);
    root.setProperty('--bg-gradient-end', gradients.end);

    if (!this._currentSubject) {
      root.setProperty('--theme-primary', '#6c7a89');
      root.setProperty('--theme-primary-rgb', '108, 122, 137');
      root.setProperty('--theme-secondary', '#bdc3c7');
    }

    this._refreshBackground();
  }

  _transitionBackground(theme) {
    const target = this._usingB ? this._bgLayerA : this._bgLayerB;
    target.style.background = `linear-gradient(135deg,
      ${this._darken(theme.primary, 0.85)},
      ${this._darken(theme.primary, 0.75)},
      ${this._darken(theme.primary, 0.8)})`;

    if (this._usingB) {
      this._bgLayerB.classList.remove('active');
    } else {
      this._bgLayerB.classList.add('active');
    }
    this._usingB = !this._usingB;
  }

  _refreshBackground() {
    const target = this._usingB ? this._bgLayerA : this._bgLayerB;
    const root = getComputedStyle(document.documentElement);
    const start = root.getPropertyValue('--bg-gradient-start').trim();
    const mid = root.getPropertyValue('--bg-gradient-mid').trim();
    const end = root.getPropertyValue('--bg-gradient-end').trim();
    target.style.background = `linear-gradient(135deg, ${start}, ${mid}, ${end})`;

    if (this._usingB) {
      this._bgLayerB.classList.remove('active');
    } else {
      this._bgLayerB.classList.add('active');
    }
    this._usingB = !this._usingB;
  }

  _darken(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
  }
}
