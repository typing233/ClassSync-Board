export class PluginManager {
  constructor(container, storage) {
    this._container = container;
    this._storage = storage;
    this._plugins = new Map();
  }

  async loadPlugins(pluginConfigs) {
    for (const config of pluginConfigs) {
      if (!config.enabled) continue;
      await this.loadPlugin(config);
    }
    this.renderAll();
  }

  async loadPlugin(config) {
    try {
      const module = await import('../' + config.src);
      const PluginClass = module.default;
      const instance = new PluginClass();
      const ctx = {
        storage: this._storage,
        config: config.config || {},
        container: null
      };
      if (instance.init) await instance.init(ctx);
      this._plugins.set(config.id, { instance, config });
    } catch (e) {
      console.warn(`Plugin "${config.id}" failed to load:`, e.message);
    }
  }

  unloadPlugin(id) {
    const entry = this._plugins.get(id);
    if (!entry) return;
    if (entry.instance.destroy) entry.instance.destroy();
    this._plugins.delete(id);
    this.renderAll();
  }

  tick(state) {
    for (const [, { instance }] of this._plugins) {
      if (instance.onTick) {
        try { instance.onTick(state); } catch { /* plugin error isolated */ }
      }
    }
  }

  renderAll() {
    if (!this._container) return;
    this._container.innerHTML = '';

    for (const [id, { instance }] of this._plugins) {
      if (!instance.render) continue;
      try {
        const content = instance.render();
        const card = document.createElement('div');
        card.className = 'plugin-card';
        card.dataset.pluginId = id;
        if (typeof content === 'string') {
          card.innerHTML = content;
        } else if (content instanceof HTMLElement) {
          card.appendChild(content);
        }
        this._container.appendChild(card);
      } catch { /* plugin error isolated */ }
    }
  }

  destroy() {
    for (const [, { instance }] of this._plugins) {
      if (instance.destroy) instance.destroy();
    }
    this._plugins.clear();
  }
}
