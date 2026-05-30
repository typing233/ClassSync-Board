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
    this._transitioning = false;
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

    this._applyContrastAdjustment(theme.primary);
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

    if (config.customColors) {
      const { start, mid, end } = config.customColors;
      root.setProperty('--bg-gradient-start', start);
      root.setProperty('--bg-gradient-mid', mid);
      root.setProperty('--bg-gradient-end', end);
      this._applyContrastForBackground(start, mid, end);
      this._refreshBackground();
    } else if (config.preset) {
      const preset = PRESETS.find(p => p.id === config.preset);
      if (preset) {
        root.setProperty('--bg-gradient-start', preset.start);
        root.setProperty('--bg-gradient-mid', preset.mid);
        root.setProperty('--bg-gradient-end', preset.end);
        this._applyContrastForBackground(preset.start, preset.mid, preset.end);
        this._refreshBackground();
      }
    }

    if (config.accentColor) {
      const rgb = this._hexToRgb(config.accentColor);
      root.setProperty('--theme-primary', config.accentColor);
      root.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      root.setProperty('--theme-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
    }

    if (config.backgroundImage) {
      this.setBackgroundImage(config.backgroundImage);
    } else if (config.backgroundImage === '') {
      this._refreshBackground();
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
    this._crossfade();
  }

  setFontFamily(family) {
    document.documentElement.style.setProperty('--font-display', family);
  }

  // --- Contrast / Readability ---

  _applyContrastAdjustment(primaryHex) {
    const lum = this._relativeLuminance(primaryHex);
    const root = document.documentElement.style;

    if (lum > 0.4) {
      root.setProperty('--text-primary', '#1a1a2e');
      root.setProperty('--text-secondary', 'rgba(26, 26, 46, 0.75)');
      root.setProperty('--text-muted', 'rgba(26, 26, 46, 0.5)');
    } else {
      root.setProperty('--text-primary', '#ffffff');
      root.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.75)');
      root.setProperty('--text-muted', 'rgba(255, 255, 255, 0.45)');
    }
  }

  _applyContrastForBackground(startHex, midHex, endHex) {
    const lumStart = this._relativeLuminance(startHex);
    const lumMid = this._relativeLuminance(midHex);
    const lumEnd = this._relativeLuminance(endHex);
    const avgLum = (lumStart + lumMid + lumEnd) / 3;

    const root = document.documentElement.style;

    if (avgLum > 0.35) {
      root.setProperty('--text-primary', '#1a1a2e');
      root.setProperty('--text-secondary', 'rgba(26, 26, 46, 0.78)');
      root.setProperty('--text-muted', 'rgba(26, 26, 46, 0.52)');
      root.setProperty('--glass-border', 'rgba(0, 0, 0, 0.12)');
    } else {
      root.setProperty('--text-primary', '#ffffff');
      root.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.75)');
      root.setProperty('--text-muted', 'rgba(255, 255, 255, 0.45)');
      root.setProperty('--glass-border', 'rgba(255, 255, 255, 0.15)');
    }
  }

  _relativeLuminance(hex) {
    const { r, g, b } = this._hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  _contrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  _hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  // --- Transition Animations ---

  _crossfade() {
    if (this._transitioning) return;
    this._transitioning = true;

    const incoming = this._usingB ? this._bgLayerA : this._bgLayerB;
    const outgoing = this._usingB ? this._bgLayerB : this._bgLayerA;

    incoming.style.transform = 'scale(1.03)';
    incoming.style.opacity = '0';

    requestAnimationFrame(() => {
      incoming.style.transition = 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
      incoming.style.opacity = '1';
      incoming.style.transform = 'scale(1)';

      outgoing.style.transition = 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      outgoing.style.opacity = '0';
    });

    setTimeout(() => {
      incoming.style.transition = '';
      outgoing.style.transition = '';
      incoming.style.transform = '';

      if (this._usingB) {
        this._bgLayerB.classList.remove('active');
      } else {
        this._bgLayerB.classList.add('active');
      }
      this._usingB = !this._usingB;
      this._transitioning = false;
    }, 1400);
  }

  _transitionBackground(theme) {
    const target = this._usingB ? this._bgLayerA : this._bgLayerB;
    const darkened = this._generateSubjectGradient(theme.primary);
    target.style.background = darkened;
    this._crossfade();
  }

  _generateSubjectGradient(primary) {
    const { r, g, b } = this._hexToRgb(primary);
    const darken = (v, f) => Math.round(v * f);
    const c1 = `rgb(${darken(r, 0.15)}, ${darken(g, 0.15)}, ${darken(b, 0.15)})`;
    const c2 = `rgb(${darken(r, 0.25)}, ${darken(g, 0.25)}, ${darken(b, 0.25)})`;
    const c3 = `rgb(${darken(r, 0.2)}, ${darken(g, 0.2)}, ${darken(b, 0.2)})`;
    return `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`;
  }

  _refreshBackground() {
    const target = this._usingB ? this._bgLayerA : this._bgLayerB;
    const root = getComputedStyle(document.documentElement);
    const start = root.getPropertyValue('--bg-gradient-start').trim();
    const mid = root.getPropertyValue('--bg-gradient-mid').trim();
    const end = root.getPropertyValue('--bg-gradient-end').trim();
    target.style.background = `linear-gradient(135deg, ${start}, ${mid}, ${end})`;
    this._crossfade();
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
    if (this._customConfig && this._customConfig.customColors) {
      const { start, mid, end } = this._customConfig.customColors;
      const root = document.documentElement.style;
      root.setProperty('--bg-gradient-start', start);
      root.setProperty('--bg-gradient-mid', mid);
      root.setProperty('--bg-gradient-end', end);
      this._applyContrastForBackground(start, mid, end);
      if (!this._currentSubject) {
        this._setIdleAccent();
      }
      this._refreshBackground();
      return;
    }

    if (this._customConfig && this._customConfig.preset && this._customConfig.preset !== 'default') {
      const preset = PRESETS.find(p => p.id === this._customConfig.preset);
      if (preset) {
        const root = document.documentElement.style;
        root.setProperty('--bg-gradient-start', preset.start);
        root.setProperty('--bg-gradient-mid', preset.mid);
        root.setProperty('--bg-gradient-end', preset.end);
        this._applyContrastForBackground(preset.start, preset.mid, preset.end);
        if (!this._currentSubject) {
          this._setIdleAccent();
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
    this._applyContrastForBackground(gradients.start, gradients.mid, gradients.end);

    if (!this._currentSubject) {
      this._setIdleAccent();
    }

    this._refreshBackground();
  }

  _setIdleAccent() {
    const root = document.documentElement.style;
    if (this._customConfig && this._customConfig.accentColor) {
      const rgb = this._hexToRgb(this._customConfig.accentColor);
      root.setProperty('--theme-primary', this._customConfig.accentColor);
      root.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    } else {
      root.setProperty('--theme-primary', '#6c7a89');
      root.setProperty('--theme-primary-rgb', '108, 122, 137');
      root.setProperty('--theme-secondary', '#bdc3c7');
    }
  }

  _darken(hex, factor) {
    const { r, g, b } = this._hexToRgb(hex);
    return `rgb(${Math.round(r * (1 - factor))}, ${Math.round(g * (1 - factor))}, ${Math.round(b * (1 - factor))})`;
  }
}
