export class StorageManager {
  constructor(namespace = 'classync') {
    this._prefix = namespace + ':';
    this._available = this._checkAvailability();
  }

  _checkAvailability() {
    try {
      const key = '__storage_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this._available) return defaultValue;
    try {
      const raw = localStorage.getItem(this._prefix + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  set(key, value) {
    if (!this._available) return;
    try {
      localStorage.setItem(this._prefix + key, JSON.stringify(value));
    } catch { /* quota exceeded or other error */ }
  }

  remove(key) {
    if (!this._available) return;
    localStorage.removeItem(this._prefix + key);
  }

  mergeDefaults(defaults) {
    const stored = this.get('settings', {});
    return this._deepMerge(defaults, stored);
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
