/**
 * 计时核心
 * 约定：不碰 DOM；剩余时间由 endAt - Date.now() 推导。
 */

export const MODES = { FOCUS: 'focus', BREAK: 'break' };
export const STATUS = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused' };

const TICK_INTERVAL_MS = 200;

export function formatTime(ms) {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = String(Math.floor(s / 60)).padStart(2, '0');
  const seconds = String(s % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export class Timer {
  constructor({ durationsMs, onTick, onFinish }) {
    this.durationsMs = { ...durationsMs };
    this.status = STATUS.IDLE;
    this.mode = MODES.FOCUS;
    this.remainingMs = this.durationsMs[this.mode];
    this.endAt = 0;
    this.tickId = null;
    this.onTick = onTick ?? (() => {});
    this.onFinish = onFinish ?? (() => {});
  }

  start() {
    if (this.status !== STATUS.IDLE) return false;
    this.endAt = Date.now() + this.remainingMs;
    this.status = STATUS.RUNNING;
    this.tickId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    return true;
  }

  pause() {
    if (this.status !== STATUS.RUNNING) return false;
    this.remainingMs = Math.max(0, this.endAt - Date.now());
    this.stopTick();
    this.status = STATUS.PAUSED;
    this.onTick();
    return true;
  }

  resume() {
    if (this.status !== STATUS.PAUSED) return false;
    this.endAt = Date.now() + this.remainingMs;
    this.status = STATUS.RUNNING;
    this.tickId = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    return true;
  }

  reset() {
    this.stopTick();
    this.remainingMs = this.durationsMs[this.mode];
    this.endAt = 0;
    this.status = STATUS.IDLE;
    this.onTick();
  }

  setMode(mode) {
    if (this.status !== STATUS.IDLE) return false;
    if (mode !== MODES.FOCUS && mode !== MODES.BREAK) return false;
    this.mode = mode;
    this.remainingMs = this.durationsMs[mode];
    this.onTick();
    return true;
  }

  setDuration(mode, minutes) {
    if (this.status !== STATUS.IDLE) return false;
    if (mode !== MODES.FOCUS && mode !== MODES.BREAK) return false;
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) return false;
    this.durationsMs[mode] = minutes * 60_000;
    if (this.mode === mode) {
      this.remainingMs = this.durationsMs[mode];
    }
    this.onTick();
    return true;
  }

  tick() {
    if (this.status !== STATUS.RUNNING) return;
    const left = this.endAt - Date.now();
    if (left <= 0) {
      this.remainingMs = 0;
      this.stopTick();
      this.status = STATUS.IDLE;
      this.onTick();
      this.onFinish();
      return;
    }
    this.remainingMs = left;
    this.onTick();
  }

  stopTick() {
    if (this.tickId !== null) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  getRemainingMs() {
    return this.remainingMs;
  }
}
