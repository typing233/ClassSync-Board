import { Clock } from './clock.js';

export class Scheduler {
  constructor(courses, settings) {
    this.courses = courses;
    this.settings = settings;
    this._prevState = { status: 'idle', currentPeriod: null, nextPeriod: null };
    this._warningFired = {};
    this._intervalId = null;
    this._isFirstTick = true;
  }

  start() {
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._intervalId = null;
  }

  reload(courses) {
    this.courses = courses;
    this._warningFired = {};
    this._prevState = { status: 'idle', currentPeriod: null, nextPeriod: null };
    this._isFirstTick = true;
    this._tick();
  }

  _tick() {
    const nowMs = Clock.getNowMs();
    const newState = this._computeState(nowMs);
    const isInit = this._isFirstTick;
    this._isFirstTick = false;

    this._detectTransitions(newState, isInit);
    this._checkWarning(newState);

    document.dispatchEvent(new CustomEvent('classync:tick', { detail: newState }));
    this._prevState = newState;
  }

  _computeState(nowMs) {
    const state = {
      status: 'idle',
      currentPeriod: null,
      nextPeriod: null,
      prevPeriod: null,
      elapsed: 0,
      remaining: 0,
      progress: 0,
      timeUntilNext: 0,
      nowMs
    };

    if (this.courses.length === 0) return state;

    for (let i = 0; i < this.courses.length; i++) {
      const period = this.courses[i];

      if (nowMs >= period.startMs && nowMs < period.endMs) {
        state.status = 'in-class';
        state.currentPeriod = period;
        state.nextPeriod = this.courses[i + 1] || null;
        state.prevPeriod = this.courses[i - 1] || null;
        state.elapsed = nowMs - period.startMs;
        state.remaining = period.endMs - nowMs;
        state.progress = (nowMs - period.startMs) / (period.endMs - period.startMs);
        return state;
      }

      if (nowMs < period.startMs) {
        if (i === 0) {
          state.status = 'before-school';
        } else {
          state.status = 'break';
          state.prevPeriod = this.courses[i - 1];
        }
        state.nextPeriod = period;
        state.timeUntilNext = period.startMs - nowMs;
        return state;
      }
    }

    const lastCourse = this.courses[this.courses.length - 1];
    state.status = 'after-school';
    state.prevPeriod = lastCourse;
    return state;
  }

  _detectTransitions(newState, isInit) {
    const prev = this._prevState;

    if (isInit && newState.status === 'in-class') {
      document.dispatchEvent(new CustomEvent('classync:class-init', { detail: newState }));
      return;
    }

    if (newState.status === 'in-class' && prev.status !== 'in-class') {
      document.dispatchEvent(new CustomEvent('classync:class-start', { detail: newState }));
    } else if (newState.status === 'in-class' && prev.status === 'in-class' &&
               newState.currentPeriod !== prev.currentPeriod) {
      document.dispatchEvent(new CustomEvent('classync:class-end', { detail: prev }));
      document.dispatchEvent(new CustomEvent('classync:class-start', { detail: newState }));
    } else if (prev.status === 'in-class' && newState.status !== 'in-class') {
      document.dispatchEvent(new CustomEvent('classync:class-end', { detail: prev }));
    }
  }

  _checkWarning(state) {
    if (!state.nextPeriod) return;
    const warningMs = this.settings.earlyWarningSeconds * 1000;

    if (state.timeUntilNext > 0 && state.timeUntilNext <= warningMs) {
      const key = state.nextPeriod.period;
      if (!this._warningFired[key]) {
        this._warningFired[key] = true;
        document.dispatchEvent(new CustomEvent('classync:warning', { detail: state }));
      }
    }
  }

  getCurrentState() {
    return this._prevState;
  }
}
