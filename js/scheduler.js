import { Clock } from './clock.js';

export class Scheduler {
  constructor(courses, settings) {
    this.courses = courses;
    this.settings = settings;
    this._prevState = { status: 'idle', currentPeriod: null, nextPeriod: null };
    this._warningFired = {};
    this._intervalId = null;
  }

  start() {
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
  }

  _tick() {
    const nowMs = Clock.getNowMs();
    const newState = this._computeState(nowMs);

    this._detectTransitions(newState);
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
        state.status = 'break';
        state.nextPeriod = period;
        state.prevPeriod = this.courses[i - 1] || null;
        state.timeUntilNext = period.startMs - nowMs;
        return state;
      }
    }

    if (this.courses.length > 0) {
      const lastCourse = this.courses[this.courses.length - 1];
      if (nowMs >= lastCourse.endMs) {
        state.status = 'after-school';
        state.prevPeriod = lastCourse;
      } else {
        state.status = 'before-school';
        state.nextPeriod = this.courses[0];
        state.timeUntilNext = this.courses[0].startMs - nowMs;
      }
    }

    return state;
  }

  _detectTransitions(newState) {
    const prev = this._prevState;

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
