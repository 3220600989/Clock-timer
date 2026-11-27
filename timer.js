/**
 * 计时核心（骨架）
 * 约定：不碰 DOM；剩余时间由 endAt - Date.now() 推导。
 */

export const MODES = { FOCUS: 'focus', BREAK: 'break' };
export const STATUS = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused' };

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
    // TODO: 以当前 remainingMs 为基准设置 endAt，启动 200ms tick
  }

  pause() {
    // TODO: 停止 tick，按 endAt - Date.now() 保存 remainingMs
  }

  resume() {
    // TODO: 以当前 remainingMs 为基准重算 endAt，启动 tick
  }

  reset() {
    // TODO: remainingMs = durationsMs[mode]，status = IDLE，停止 tick
  }

  setMode(mode) {
    // TODO: 校验 status === IDLE 后切换 mode 并重置
  }

  setDuration(mode, minutes) {
    // TODO: 校验 status === IDLE 后更新 durationsMs[mode]
  }

  tick() {
    // TODO:
    //   const left = this.endAt - Date.now();
    //   if (left <= 0) { remainingMs = 0; stopTick(); onFinish(); return; }
    //   remainingMs = left;
    //   onTick();
  }

  stopTick() {
    // TODO: clearInterval(this.tickId)，置空 tickId
  }

  getRemainingMs() {
    return this.remainingMs;
  }
}
