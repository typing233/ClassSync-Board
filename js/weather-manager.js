const ICON_MAP = {
  '100': '☀️', '101': '⛅', '102': '⛅', '103': '☁️', '104': '☁️',
  '150': '☀️', '151': '⛅', '152': '⛅', '153': '☁️', '154': '☁️',
  '300': '🌧️', '301': '🌧️', '302': '⛈️', '303': '⛈️', '304': '🌩️',
  '305': '🌦️', '306': '🌧️', '307': '🌧️', '308': '🌧️', '309': '🌦️',
  '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌦️', '315': '🌧️',
  '399': '🌧️',
  '400': '🌨️', '401': '🌨️', '402': '❄️', '403': '❄️', '404': '🌨️',
  '405': '🌨️', '406': '🌨️', '407': '🌨️', '408': '🌨️', '409': '❄️',
  '410': '❄️', '499': '❄️',
  '500': '🌫️', '501': '🌫️', '502': '🌫️', '503': '🌫️', '504': '🌫️',
  '507': '🌫️', '508': '🌫️', '509': '🌫️', '510': '🌫️', '511': '🌫️',
  '512': '🌫️', '513': '🌫️', '514': '🌫️', '515': '🌫️',
  '900': '🔥', '901': '❄️', '999': '🌀'
};

export class WeatherManager {
  constructor(configSettings, storage) {
    this._configDefaults = configSettings || {};
    this.storage = storage;
    this.settings = this._loadSettings();
    this._intervalId = null;
    this._iconEl = document.querySelector('.weather-icon');
    this._tempEl = document.querySelector('.weather-temp');
    this._descEl = document.querySelector('.weather-desc');
  }

  _loadSettings() {
    const stored = this.storage.get('weather_settings');
    if (stored) return stored;
    return { ...this._configDefaults };
  }

  async init() {
    const cached = this.storage.get('weather_cache');
    if (cached) this._updateDOM(cached);

    if (!this.settings.enabled || !this.settings.apiKey) {
      if (!cached) this._showPlaceholder();
      return;
    }

    await this.fetchWeather();
    this._startInterval();
  }

  applySettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.storage.set('weather_settings', this.settings);

    this._stopInterval();

    if (!this.settings.enabled || !this.settings.apiKey) {
      this._showPlaceholder();
      return;
    }

    this.fetchWeather();
    this._startInterval();
  }

  getSettings() {
    return { ...this.settings };
  }

  async fetchWeather() {
    try {
      const url = `https://devapi.qweather.com/v7/weather/now?location=${this.settings.locationId}&key=${this.settings.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.code === '200' && json.now) {
        const data = {
          icon: json.now.icon,
          temp: json.now.temp,
          text: json.now.text
        };
        this.storage.set('weather_cache', data);
        this.storage.set('weather_cache_time', Date.now());
        this._updateDOM(data);
      }
    } catch (e) {
      console.warn('Weather fetch failed:', e.message);
    }
  }

  _startInterval() {
    this._stopInterval();
    const interval = (this.settings.refreshMinutes || 30) * 60 * 1000;
    this._intervalId = setInterval(() => this.fetchWeather(), interval);
  }

  _stopInterval() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  _updateDOM(data) {
    if (this._iconEl) this._iconEl.textContent = ICON_MAP[data.icon] || '🌡️';
    if (this._tempEl) this._tempEl.textContent = `${data.temp}°C`;
    if (this._descEl) this._descEl.textContent = data.text;
  }

  _showPlaceholder() {
    if (this._iconEl) this._iconEl.textContent = '🌡️';
    if (this._tempEl) this._tempEl.textContent = '--°C';
    if (this._descEl) this._descEl.textContent = '--';
  }

  destroy() {
    this._stopInterval();
  }
}
