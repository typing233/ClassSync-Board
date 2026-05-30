const PRESETS = [
  { id: 'default', name: '默认深蓝', start: '#0f0c29', mid: '#302b63', end: '#24243e' },
  { id: 'ocean', name: '深海蓝', start: '#0f2027', mid: '#203a43', end: '#2c5364' },
  { id: 'forest', name: '森林绿', start: '#0a1f0a', mid: '#1a3a2a', end: '#0d2818' },
  { id: 'warm', name: '暖橙', start: '#1a0a00', mid: '#3d1f00', end: '#2e1500' },
  { id: 'sakura', name: '樱花粉', start: '#1a0f14', mid: '#3d2030', end: '#2e1525' },
  { id: 'aurora', name: '极光', start: '#000428', mid: '#004e92', end: '#001a3a' }
];

export class ThemeEngine {
  constructor(themes) {
    this.themes = themes;
    this._currentSubject = null;
    this._bgLayerA = document.querySelector('.bg-layer--a');
    this._bgLayerB = document.querySelector('.bg-layer--b');
    this._usingB = false;
    this._storage = null;
    this._customConfig = null;
  }

  init(storage) {
    this._storage = storage || null;
    this._loadSavedTheme();
    this._applyTimeOfDayTheme();
    document.addEventListener('classync:class-start', (e) => {
      const period = e.detail.currentPeriod;
      if (period) this.applySubjectTheme(period.subject);
    });
    document.addEventListener('classync:class-end', () => {
      this._currentSubject = null;
      this._applyTimeOfDayTheme();
    });
  }

  applySubjectTheme(subject) {
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

  reset() {
    this._currentSubject = null;
    this._applyTimeOfDayTheme();
  }

  getPresets() {
    return PRESETS;
  }

  applyCustomTheme(config) {
    this._customConfig = config;
    if (this._storage) {
      this._storage.set('theme_custom', config);
    }

    const root = document.documentElement.style;

    if (config.preset) {
      const preset = PRESETS.find(p => p.id === config.preset);
      if (preset) {
        root.setProperty('--bg-gradient-start', preset.start);
        root.setProperty('--bg-gradient-mid', preset.mid);
        root.setProperty('--bg-gradient-end', preset.end);
        this._refreshBackground();
      }
    }

    if (config.backgroundImage) {
      this.setBackgroundImage(config.backgroundImage);
    }

    if (config.fontFamily) {
      this.setFontFamily(config.fontFamily);
    }

    if (config.fontSize) {
      root.setProperty('--font-size-base', config.fontSize);
    }

    if (config.glassOpacity !== undefined) {
      root.setProperty('--glass-bg', `rgba(255, 255, 255, ${config.glassOpacity})`);
    }
  }

  setBackgroundImage(url) {
    const target = this._usingB ? this._bgLayerA : this._bgLayerB;
    if (url) {
      target.style.background = `url('${url}') center/cover no-repeat`;
    } else {
      this._refreshBackground();
      return;
    }
    if (this._usingB) {
      this._bgLayerB.classList.remove('active');
    } else {
      this._bgLayerB.classList.add('active');
    }
    this._usingB = !this._usingB;
  }

  setFontFamily(family) {
    document.documentElement.style.setProperty('--font-display', family);
  }

  _loadSavedTheme() {
    if (!this._storage) return;
    const saved = this._storage.get('theme_custom');
    if (saved) {
      this._customConfig = saved;
      setTimeout(() => this.applyCustomTheme(saved), 0);
    }
  }

  _applyTimeOfDayTheme() {
    if (this._customConfig && this._customConfig.preset && this._customConfig.preset !== 'default') {
      const preset = PRESETS.find(p => p.id === this._customConfig.preset);
      if (preset) {
        const root = document.documentElement.style;
        root.setProperty('--bg-gradient-start', preset.start);
        root.setProperty('--bg-gradient-mid', preset.mid);
        root.setProperty('--bg-gradient-end', preset.end);
        if (!this._currentSubject) {
          root.setProperty('--theme-primary', '#6c7a89');
          root.setProperty('--theme-primary-rgb', '108, 122, 137');
          root.setProperty('--theme-secondary', '#bdc3c7');
        }
        this._refreshBackground();
        return;
      }
    }

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
