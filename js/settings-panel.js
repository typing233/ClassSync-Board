export class SettingsPanel {
  constructor(storage, themeEngine, ttsManager, weatherManager, countdownManager) {
    this._storage = storage;
    this._themeEngine = themeEngine;
    this._tts = ttsManager;
    this._weather = weatherManager;
    this._countdown = countdownManager;
    this._overlay = null;
    this._isOpen = false;
  }

  init() {
    this._overlay = document.getElementById('settings-overlay');
    const btn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('settings-close');

    btn.addEventListener('click', () => this.open());
    closeBtn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });
  }

  open() {
    this._isOpen = true;
    this._overlay.classList.add('active');
    this._renderBody();
  }

  close() {
    this._isOpen = false;
    this._overlay.classList.remove('active');
  }

  _renderBody() {
    const body = document.getElementById('settings-body');
    body.innerHTML = `
      ${this._renderThemeSection()}
      ${this._renderWeatherSection()}
      ${this._renderTTSSection()}
      ${this._renderCountdownSection()}
    `;
    this._attachListeners(body);
  }

  _renderThemeSection() {
    const presets = this._themeEngine.getPresets();
    const current = this._storage.get('theme_custom', {});
    const presetGrid = presets.map(p => `
      <div class="settings-color-swatch ${current.preset === p.id ? 'active' : ''}"
           data-preset="${p.id}"
           style="background: linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})"
           title="${p.name}"></div>
    `).join('');

    return `
      <div class="settings-section">
        <div class="settings-section__title">主题配色</div>
        <div class="settings-color-grid">${presetGrid}</div>
        <div class="settings-field">
          <label>背景图片 URL</label>
          <input class="settings-input" type="text" id="s-bg-image"
            placeholder="留空使用渐变背景" value="${current.backgroundImage || ''}">
        </div>
        <div class="settings-field">
          <label>字体</label>
          <select class="settings-input" id="s-font-family">
            <option value="'Inter', sans-serif" ${!current.fontFamily || current.fontFamily.includes('Inter') ? 'selected' : ''}>Inter (默认)</option>
            <option value="'Noto Sans SC', sans-serif" ${current.fontFamily?.includes('Noto') ? 'selected' : ''}>Noto Sans SC</option>
            <option value="system-ui, sans-serif" ${current.fontFamily === 'system-ui, sans-serif' ? 'selected' : ''}>系统默认</option>
          </select>
        </div>
        <div class="settings-field">
          <label>玻璃透明度</label>
          <input class="settings-range" type="range" id="s-glass-opacity"
            min="0.02" max="0.2" step="0.01" value="${current.glassOpacity || 0.08}">
        </div>
      </div>`;
  }

  _renderWeatherSection() {
    const ws = this._storage.get('settings', {}).weather || {};
    return `
      <div class="settings-section">
        <div class="settings-section__title">天气设置</div>
        <div class="settings-field">
          <label>和风天气 API Key</label>
          <input class="settings-input" type="text" id="s-weather-key"
            placeholder="在 dev.qweather.com 获取" value="${ws.apiKey || ''}">
        </div>
        <div class="settings-field">
          <label>城市 Location ID</label>
          <input class="settings-input" type="text" id="s-weather-location"
            placeholder="如 101010100 (北京)" value="${ws.locationId || '101010100'}">
        </div>
      </div>`;
  }

  _renderTTSSection() {
    const ts = this._storage.get('settings', {}).tts || this._tts?.settings || {};
    const voices = this._tts?.getAvailableVoices() || [];
    const voiceOptions = voices.map(v =>
      `<option value="${v.name}" ${v.name === ts.voiceName ? 'selected' : ''}>${v.name}</option>`
    ).join('');

    return `
      <div class="settings-section">
        <div class="settings-section__title">语音播报</div>
        <div class="settings-field">
          <label>启用语音</label>
          <label class="settings-toggle">
            <input type="checkbox" id="s-tts-enabled" ${ts.enabled ? 'checked' : ''}>
            <span class="settings-toggle__slider"></span>
          </label>
        </div>
        <div class="settings-field">
          <label>音量</label>
          <input class="settings-range" type="range" id="s-tts-volume"
            min="0" max="1" step="0.1" value="${ts.volume ?? 0.8}">
        </div>
        <div class="settings-field">
          <label>语速</label>
          <input class="settings-range" type="range" id="s-tts-rate"
            min="0.5" max="2" step="0.1" value="${ts.rate ?? 1.0}">
        </div>
        ${voices.length > 0 ? `
        <div class="settings-field">
          <label>语音</label>
          <select class="settings-input" id="s-tts-voice">${voiceOptions}</select>
        </div>` : ''}
      </div>`;
  }

  _renderCountdownSection() {
    const events = this._countdown?.getEvents() || [];
    const items = events.map(e => `
      <div class="settings-countdown-item">
        <span>${e.icon || '📌'} ${e.name} — ${e.date}</span>
        <button class="settings-countdown-remove" data-id="${e.id}">✕</button>
      </div>
    `).join('');

    return `
      <div class="settings-section">
        <div class="settings-section__title">倒计时管理</div>
        <div class="settings-countdown-list">${items || '<div class="text-muted">暂无倒计时</div>'}</div>
        <div class="settings-field" style="margin-top: 12px;">
          <input class="settings-input" type="text" id="s-cd-name" placeholder="事件名称" style="flex:1">
          <input class="settings-input" type="date" id="s-cd-date" style="flex:1">
          <button class="settings-btn-add" id="s-cd-add">添加</button>
        </div>
      </div>`;
  }

  _attachListeners(body) {
    body.querySelectorAll('.settings-color-swatch').forEach(el => {
      el.addEventListener('click', () => {
        body.querySelectorAll('.settings-color-swatch').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        const preset = el.dataset.preset;
        const config = { ...this._storage.get('theme_custom', {}), preset };
        this._themeEngine.applyCustomTheme(config);
      });
    });

    const bgInput = body.querySelector('#s-bg-image');
    bgInput?.addEventListener('change', () => {
      const config = { ...this._storage.get('theme_custom', {}), backgroundImage: bgInput.value };
      this._themeEngine.applyCustomTheme(config);
    });

    const fontSelect = body.querySelector('#s-font-family');
    fontSelect?.addEventListener('change', () => {
      const config = { ...this._storage.get('theme_custom', {}), fontFamily: fontSelect.value };
      this._themeEngine.applyCustomTheme(config);
    });

    const glassRange = body.querySelector('#s-glass-opacity');
    glassRange?.addEventListener('input', () => {
      const config = { ...this._storage.get('theme_custom', {}), glassOpacity: parseFloat(glassRange.value) };
      this._themeEngine.applyCustomTheme(config);
    });

    const weatherKey = body.querySelector('#s-weather-key');
    const weatherLoc = body.querySelector('#s-weather-location');
    [weatherKey, weatherLoc].forEach(el => {
      el?.addEventListener('change', () => {
        const settings = this._storage.get('settings', {});
        settings.weather = settings.weather || {};
        settings.weather.apiKey = weatherKey.value;
        settings.weather.locationId = weatherLoc.value;
        this._storage.set('settings', settings);
      });
    });

    const ttsEnabled = body.querySelector('#s-tts-enabled');
    ttsEnabled?.addEventListener('change', () => {
      if (this._tts) this._tts.setEnabled(ttsEnabled.checked);
    });

    const ttsVolume = body.querySelector('#s-tts-volume');
    ttsVolume?.addEventListener('input', () => {
      if (this._tts) this._tts.setVolume(parseFloat(ttsVolume.value));
    });

    const ttsRate = body.querySelector('#s-tts-rate');
    ttsRate?.addEventListener('input', () => {
      if (this._tts) this._tts.setRate(parseFloat(ttsRate.value));
    });

    const ttsVoice = body.querySelector('#s-tts-voice');
    ttsVoice?.addEventListener('change', () => {
      if (this._tts) this._tts.setVoice(ttsVoice.value);
    });

    const cdAdd = body.querySelector('#s-cd-add');
    cdAdd?.addEventListener('click', () => {
      const name = body.querySelector('#s-cd-name').value.trim();
      const date = body.querySelector('#s-cd-date').value;
      if (!name || !date) return;
      this._countdown.addEvent({ name, date, _user: true });
      this._renderBody();
    });

    body.querySelectorAll('.settings-countdown-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this._countdown.removeEvent(btn.dataset.id);
        this._renderBody();
      });
    });
  }
}
