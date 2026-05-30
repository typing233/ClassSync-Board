export class CountdownManager {
  constructor(container, storage) {
    this._container = container;
    this._storage = storage;
    this._events = [];
    this._listEl = null;
  }

  init(configEvents) {
    const userEvents = this._storage.get('countdowns', []);
    this._events = [...configEvents, ...userEvents];
    this._render();
  }

  addEvent(event) {
    if (!event.id) event.id = 'evt_' + Date.now();
    this._events.push(event);
    this._saveUserEvents();
    this._render();
  }

  removeEvent(id) {
    this._events = this._events.filter(e => e.id !== id);
    this._saveUserEvents();
    this._render();
  }

  getEvents() {
    return this._events;
  }

  update() {
    if (!this._listEl) return;
    const now = Date.now();
    const active = this._events
      .filter(e => new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (active.length === 0) {
      this._listEl.innerHTML = '<div class="countdown-item__empty">暂无倒计时</div>';
      return;
    }

    this._listEl.innerHTML = active.slice(0, 5).map(e => {
      const diff = new Date(e.date).getTime() - now;
      return `
        <div class="countdown-item">
          <span class="countdown-item__icon">${e.icon || '📌'}</span>
          <div class="countdown-item__info">
            <div class="countdown-item__name">${e.name}</div>
            <div class="countdown-item__time">${this._formatDiff(diff)}</div>
          </div>
        </div>`;
    }).join('');
  }

  _render() {
    if (!this._container) return;
    this._container.innerHTML = `
      <div class="countdown-panel__title">重要倒计时</div>
      <div class="countdown-panel__list"></div>`;
    this._listEl = this._container.querySelector('.countdown-panel__list');
    this.update();
  }

  _formatDiff(ms) {
    const totalMin = Math.floor(ms / 60000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;

    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${mins}分`;
    return `${mins}分钟`;
  }

  _saveUserEvents() {
    const userOnly = this._events.filter(e => e._user);
    this._storage.set('countdowns', userOnly);
  }
}
