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
      <div class="settings-color-swatch ${current.preset === p.id && !current.customColors ? 'active' : ''}"
           data-preset="${p.id}"
           style="background: linear-gradient(135deg, ${p.start}, ${p.mid}, ${p.end})"
           title="${p.name}"></div>
    `).join('');

    const cc = current.customColors || { start: '#1a1a2e', mid: '#2d2d54', end: '#3d2c4f' };

    return `
      <div class="settings-section">
        <div class="settings-section__title">主题配色</div>
        <div class="settings-subsection-label">预设方案</div>
        <div class="settings-color-grid">${presetGrid}</div>

        <div class="settings-subsection-label">自定义配色</div>
        <div class="settings-custom-colors">
          <div class="settings-color-field">
            <label>起始色</label>
            <input type="color" class="settings-color-picker" id="s-color-start" value="${cc.start}">
            <input type="text" class="settings-color-hex" id="s-color-start-hex" value="${cc.start}" maxlength="7">
          </div>
          <div class="settings-color-field">
            <label>中间色</label>
            <input type="color" class="settings-color-picker" id="s-color-mid" value="${cc.mid}">
            <input type="text" class="settings-color-hex" id="s-color-mid-hex" value="${cc.mid}" maxlength="7">
          </div>
          <div class="settings-color-field">
            <label>终止色</label>
            <input type="color" class="settings-color-picker" id="s-color-end" value="${cc.end}">
            <input type="text" class="settings-color-hex" id="s-color-end-hex" value="${cc.end}" maxlength="7">
          </div>
        </div>
        <button class="settings-btn-add" id="s-apply-custom-colors" style="margin-top: 8px; width: 100%;">应用自定义配色</button>

        <div class="settings-subsection-label" style="margin-top: 16px;">强调色</div>
        <div class="settings-field">
          <label>主色调</label>
          <input type="color" class="settings-color-picker" id="s-accent-color" value="${current.accentColor || '#3498db'}">
          <input type="text" class="settings-color-hex" id="s-accent-hex" value="${current.accentColor || '#3498db'}" maxlength="7">
        </div>

        <div class="settings-subsection-label" style="margin-top: 16px;">其他</div>
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
    const ws = this._weather?.getSettings() || {};
    return `
      <div class="settings-section">
        <div class="settings-section__title">天气设置</div>
        <div class="settings-field">
          <label>启用天气</label>
          <label class="settings-toggle">
            <input type="checkbox" id="s-weather-enabled" ${ws.enabled ? 'checked' : ''}>
            <span class="settings-toggle__slider"></span>
          </label>
        </div>
        <div class="settings-field">
          <label>API Key</label>
          <input class="settings-input" type="text" id="s-weather-key"
            placeholder="在 dev.qweather.com 获取" value="${ws.apiKey || ''}">
        </div>
        <div class="settings-field">
          <label>城市 ID</label>
          <input class="settings-input" type="text" id="s-weather-location"
            placeholder="如 101010100 (北京)" value="${ws.locationId || '101010100'}">
        </div>
        <div class="settings-field">
          <label>刷新间隔(分)</label>
          <input class="settings-input" type="number" id="s-weather-interval"
            min="10" max="120" value="${ws.refreshMinutes || 30}">
        </div>
        <button class="settings-btn-add" id="s-weather-save" style="width: 100%; margin-top: 8px;">保存并刷新天气</button>
      </div>`;
  }

  _renderTTSSection() {
    const ts = this._tts?.getSettings() || {};
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
          <span class="settings-range-value" id="s-tts-volume-val">${ts.volume ?? 0.8}</span>
        </div>
        <div class="settings-field">
          <label>语速</label>
          <input class="settings-range" type="range" id="s-tts-rate"
            min="0.5" max="2" step="0.1" value="${ts.rate ?? 1.0}">
          <span class="settings-range-value" id="s-tts-rate-val">${ts.rate ?? 1.0}</span>
        </div>
        ${voices.length > 0 ? `
        <div class="settings-field">
          <label>语音</label>
          <select class="settings-input" id="s-tts-voice">${voiceOptions}</select>
        </div>` : '<div class="settings-hint">未检测到中文语音，将使用系统默认</div>'}
        <button class="settings-btn-add settings-btn--secondary" id="s-tts-test" style="width: 100%; margin-top: 8px;">测试语音</button>
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
    // --- Theme: Preset selection ---
    body.querySelectorAll('.settings-color-swatch').forEach(el => {
      el.addEventListener('click', () => {
        body.querySelectorAll('.settings-color-swatch').forEach(s => s.classList.remove('active'));
        el.classList.add('active');
        const preset = el.dataset.preset;
        const config = { ...this._storage.get('theme_custom', {}), preset, customColors: null };
        this._themeEngine.applyCustomTheme(config);
      });
    });

    // --- Theme: Custom colors ---
    const colorInputs = ['start', 'mid', 'end'].map(k => ({
      picker: body.querySelector(`#s-color-${k}`),
      hex: body.querySelector(`#s-color-${k}-hex`),
      key: k
    }));

    colorInputs.forEach(({ picker, hex }) => {
      picker?.addEventListener('input', () => { hex.value = picker.value; });
      hex?.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) picker.value = hex.value;
      });
    });

    body.querySelector('#s-apply-custom-colors')?.addEventListener('click', () => {
      const start = body.querySelector('#s-color-start').value;
      const mid = body.querySelector('#s-color-mid').value;
      const end = body.querySelector('#s-color-end').value;
      body.querySelectorAll('.settings-color-swatch').forEach(s => s.classList.remove('active'));
      const config = { ...this._storage.get('theme_custom', {}), customColors: { start, mid, end }, preset: null };
      this._themeEngine.applyCustomTheme(config);
    });

    // --- Theme: Accent color ---
    const accentPicker = body.querySelector('#s-accent-color');
    const accentHex = body.querySelector('#s-accent-hex');
    const applyAccent = (color) => {
      const config = { ...this._storage.get('theme_custom', {}), accentColor: color };
      this._themeEngine.applyCustomTheme(config);
    };
    accentPicker?.addEventListener('change', () => {
      accentHex.value = accentPicker.value;
      applyAccent(accentPicker.value);
    });
    accentHex?.addEventListener('change', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(accentHex.value)) {
        accentPicker.value = accentHex.value;
        applyAccent(accentHex.value);
      }
    });

    // --- Theme: Background image ---
    const bgInput = body.querySelector('#s-bg-image');
    bgInput?.addEventListener('change', () => {
      const config = { ...this._storage.get('theme_custom', {}), backgroundImage: bgInput.value };
      this._themeEngine.applyCustomTheme(config);
    });

    // --- Theme: Font ---
    const fontSelect = body.querySelector('#s-font-family');
    fontSelect?.addEventListener('change', () => {
      const config = { ...this._storage.get('theme_custom', {}), fontFamily: fontSelect.value };
      this._themeEngine.applyCustomTheme(config);
    });

    // --- Theme: Glass opacity ---
    const glassRange = body.querySelector('#s-glass-opacity');
    glassRange?.addEventListener('input', () => {
      const config = { ...this._storage.get('theme_custom', {}), glassOpacity: parseFloat(glassRange.value) };
      this._themeEngine.applyCustomTheme(config);
    });

    // --- Weather: Save and refresh ---
    body.querySelector('#s-weather-save')?.addEventListener('click', () => {
      const enabled = body.querySelector('#s-weather-enabled').checked;
      const apiKey = body.querySelector('#s-weather-key').value.trim();
      const locationId = body.querySelector('#s-weather-location').value.trim();
      const refreshMinutes = parseInt(body.querySelector('#s-weather-interval').value) || 30;

      this._weather.applySettings({ enabled, apiKey, locationId, refreshMinutes });
    });

    // --- TTS ---
    const ttsEnabled = body.querySelector('#s-tts-enabled');
    ttsEnabled?.addEventListener('change', () => {
      if (this._tts) this._tts.setEnabled(ttsEnabled.checked);
    });

    const ttsVolume = body.querySelector('#s-tts-volume');
    const ttsVolumeVal = body.querySelector('#s-tts-volume-val');
    ttsVolume?.addEventListener('input', () => {
      const v = parseFloat(ttsVolume.value);
      if (ttsVolumeVal) ttsVolumeVal.textContent = v.toFixed(1);
      if (this._tts) this._tts.setVolume(v);
    });

    const ttsRate = body.querySelector('#s-tts-rate');
    const ttsRateVal = body.querySelector('#s-tts-rate-val');
    ttsRate?.addEventListener('input', () => {
      const v = parseFloat(ttsRate.value);
      if (ttsRateVal) ttsRateVal.textContent = v.toFixed(1);
      if (this._tts) this._tts.setRate(v);
    });

    const ttsVoice = body.querySelector('#s-tts-voice');
    ttsVoice?.addEventListener('change', () => {
      if (this._tts) this._tts.setVoice(ttsVoice.value);
    });

    body.querySelector('#s-tts-test')?.addEventListener('click', () => {
      if (this._tts) this._tts.speak('语音播报测试成功');
    });

    // --- Countdown ---
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
