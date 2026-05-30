export default class AnnouncementsPlugin {
  static id = 'announcements';
  static name = '通知公告';

  init(ctx) {
    this._items = ctx.config.items || [];
  }

  render() {
    if (this._items.length === 0) return '';

    const items = this._items.map(item => {
      const priorityClass = item.priority === 'high' ? 'plugin-announce__item--high' : '';
      return `<div class="plugin-announce__item ${priorityClass}">${item.text}</div>`;
    }).join('');

    return `
      <div class="plugin-announce">
        <div class="plugin-announce__title">📢 公告</div>
        ${items}
      </div>`;
  }

  onTick() {}
  destroy() {}
}
