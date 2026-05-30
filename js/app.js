import { ConfigLoader } from './config-loader.js';
import { Clock } from './clock.js';
import { Scheduler } from './scheduler.js';
import { TimelineRenderer } from './timeline-renderer.js';
import { ThemeEngine } from './theme-engine.js';
import { AnimationController } from './animation-controller.js';
import { SoundManager } from './sound-manager.js';
import { StorageManager } from './storage-manager.js';
import { WeatherManager } from './weather-manager.js';
import { CountdownManager } from './countdown-manager.js';
import { TTSManager } from './tts-manager.js';
import { PluginManager } from './plugin-manager.js';
import { SettingsPanel } from './settings-panel.js';

class App {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.storage = new StorageManager();
    this.clock = null;
    this.scheduler = null;
    this.timeline = null;
    this.themeEngine = null;
    this.animationController = null;
    this.soundManager = null;
    this.weatherManager = null;
    this.countdownManager = null;
    this.ttsManager = null;
    this.pluginManager = null;
    this.settingsPanel = null;
    this._currentDate = null;
    this._midnightCheckId = null;
  }

  async init() {
    try {
      await this.configLoader.load();
    } catch (e) {
      document.querySelector('.timeline-container').innerHTML = `
        <div class="no-classes">
          <div class="icon">⚠️</div>
          <div class="message">加载课程数据失败</div>
        </div>`;
      console.error(e);
      return;
    }

    const courses = this.configLoader.getTodayCourses();
    const settings = this.storage.mergeDefaults(this.configLoader.getSettings());
    const themes = this.configLoader.getThemes();
    const meta = this.configLoader.getMeta();

    this._currentDate = new Date().toDateString();

    this._setupMeta(meta);

    this.clock = new Clock();
    this.clock.start();

    this.themeEngine = new ThemeEngine(themes);
    this.themeEngine.init(this.storage);

    this.timeline = new TimelineRenderer(
      document.querySelector('.timeline-container'),
      courses
    );
    this.timeline.render();

    this.scheduler = new Scheduler(courses, settings);
    this.animationController = new AnimationController(settings);
    this.animationController.init();

    this.soundManager = new SoundManager(settings);

    this.weatherManager = new WeatherManager(settings.weather || {}, this.storage);
    await this.weatherManager.init();

    this.countdownManager = new CountdownManager(
      document.getElementById('countdown-panel'),
      this.storage
    );
    this.countdownManager.init(this.configLoader.getCountdowns());

    this.ttsManager = new TTSManager(settings.tts || {}, this.storage);

    this.pluginManager = new PluginManager(
      document.getElementById('plugin-area'),
      this.storage
    );
    await this.pluginManager.loadPlugins(this.configLoader.getPlugins());

    this.settingsPanel = new SettingsPanel(
      this.storage, this.themeEngine, this.ttsManager,
      this.weatherManager, this.countdownManager
    );
    this.settingsPanel.init();

    this._setupSoundInit(settings);

    this._tickHandler = (e) => {
      this.timeline.update(e.detail);
      this._updateSidebar(e.detail);
      this.countdownManager.update();
      this.pluginManager.tick(e.detail);
    };
    document.addEventListener('classync:tick', this._tickHandler);

    document.addEventListener('classync:class-init', (e) => {
      const period = e.detail.currentPeriod;
      if (period) {
        this.themeEngine.applySubjectTheme(period.subject);
      }
    });

    this.scheduler.start();

    this._setupFullscreen();
    this._setupVisibility();
    this._setupMidnightReload();

    setTimeout(() => this.timeline.scrollToActive(), 500);
  }

  async _reloadSchedule() {
    try {
      await this.configLoader.load();
    } catch (e) {
      console.error('Midnight reload failed:', e);
      return;
    }

    const courses = this.configLoader.getTodayCourses();
    this._currentDate = new Date().toDateString();

    this.timeline = new TimelineRenderer(
      document.querySelector('.timeline-container'),
      courses
    );
    this.timeline.render();

    this.scheduler.reload(courses);
    this.themeEngine.reset();
    this.clock.updateDate();
  }

  _setupMidnightReload() {
    this._midnightCheckId = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== this._currentDate) {
        this._reloadSchedule();
      }
    }, 5000);
  }

  _setupMeta(meta) {
    document.querySelector('.header__school').textContent =
      `${meta.schoolName} · ${meta.className}`;
  }

  _setupSoundInit(settings) {
    const overlay = document.getElementById('sound-init');
    const handler = () => {
      this.soundManager.init();
      this.ttsManager.init();
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 500);
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('keydown', handler);
  }

  _updateSidebar(state) {
    const panel = document.querySelector('.current-class-panel');
    const preview = document.querySelector('.next-class-preview');

    if (state.status === 'in-class' && state.currentPeriod) {
      const p = state.currentPeriod;
      const remaining = this._formatTime(state.remaining);
      panel.innerHTML = `
        <div class="status-badge"><span class="pulse-dot"></span>上课中</div>
        <div class="subject-icon">${p.theme.icon}</div>
        <div class="subject-name">${p.subject}</div>
        <div class="subject-teacher">${p.teacher}</div>
        <div class="subject-room">${p.room}</div>
        <div class="countdown-label">剩余时间</div>
        <div class="countdown">${remaining}</div>`;
    } else if (state.status === 'break' && state.nextPeriod) {
      const timeUntil = this._formatTime(state.timeUntilNext);
      panel.innerHTML = `
        <div class="status-badge">课间休息</div>
        <div class="subject-icon">☕</div>
        <div class="subject-name">课间</div>
        <div class="countdown-label">下节课开始</div>
        <div class="countdown">${timeUntil}</div>`;
    } else if (state.status === 'before-school') {
      const timeUntil = state.nextPeriod ? this._formatTime(state.timeUntilNext) : '--:--';
      panel.innerHTML = `
        <div class="status-badge">未开课</div>
        <div class="subject-icon">🌅</div>
        <div class="subject-name">未开课</div>
        <div class="countdown-label">第一节课倒计时</div>
        <div class="countdown">${timeUntil}</div>`;
    } else if (state.status === 'after-school') {
      panel.innerHTML = `
        <div class="status-badge">已放学</div>
        <div class="subject-icon">🌙</div>
        <div class="subject-name">放学啦</div>
        <div class="countdown-label">今日课程已结束</div>
        <div class="countdown">--:--</div>`;
    } else {
      panel.innerHTML = `
        <div class="status-badge">空闲</div>
        <div class="subject-icon">📚</div>
        <div class="subject-name">ClassSync</div>
        <div class="countdown">--:--</div>`;
    }

    if (state.nextPeriod) {
      preview.innerHTML = `
        <div class="preview-label">下一节</div>
        <div class="preview-subject">${state.nextPeriod.theme.icon} ${state.nextPeriod.subject}</div>
        <div class="preview-time">${state.nextPeriod.startTime} — ${state.nextPeriod.endTime} · ${state.nextPeriod.teacher}</div>`;
    } else {
      preview.innerHTML = `
        <div class="preview-label">下一节</div>
        <div class="preview-subject">无</div>
        <div class="preview-time">今日课程已结束</div>`;
    }
  }

  _formatTime(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  _setupFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        btn.click();
      }
    });
  }

  _setupVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const today = new Date().toDateString();
        if (today !== this._currentDate) {
          this._reloadSchedule();
        } else {
          this.scheduler.stop();
          this.scheduler.start();
          this.timeline.scrollToActive();
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
