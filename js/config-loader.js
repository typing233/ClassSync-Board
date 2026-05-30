const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export class ConfigLoader {
  constructor() {
    this.data = null;
    this.todayCourses = [];
  }

  async load(path = 'data/schedule.json') {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load schedule: ${res.status}`);
    this.data = await res.json();
    this._extractToday();
    return this.data;
  }

  _extractToday() {
    const dayIndex = new Date().getDay();
    const dayName = DAY_NAMES[dayIndex];
    const daySchedule = this.data.schedule[dayName] || [];

    this.todayCourses = daySchedule.map(course => {
      const startMs = this._timeToMs(course.startTime);
      const endMs = this._timeToMs(course.endTime);
      const theme = this.data.themes[course.subject] || this.data.themes['default'];
      return { ...course, startMs, endMs, theme };
    });
  }

  _timeToMs(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 3600 + m * 60) * 1000;
  }

  getTodayCourses() {
    return this.todayCourses;
  }

  getThemes() {
    return this.data.themes;
  }

  getSettings() {
    return this.data.settings;
  }

  getMeta() {
    return this.data.meta;
  }

  getCountdowns() {
    return this.data.countdowns || [];
  }

  getPlugins() {
    return this.data.plugins || [];
  }

  getFullConfig() {
    return this.data;
  }
}
