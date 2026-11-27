/**
 * 通知与提示音（骨架）
 * 约定：不碰 DOM；所有 Promise 都要 .catch()，不允许未处理的 Promise。
 */

const CHIME_SRC = 'assets/chime.mp3';

const audio = new Audio(CHIME_SRC);
audio.volume = 0.6;

let soundEnabled = true;

export const MESSAGES = {
  focus: { title: '专注完成！休息一下吧', body: '专注周期已完成，休息一下吧。' },
  break: { title: '休息结束，开始下一个番茄', body: '休息结束，开始下一个番茄。' },
};

export async function ensurePermission() {
  // TODO: 按 Notification API 状态返回
  //   'unsupported' | 'granted' | 'denied' | requestPermission() 结果
  return 'unsupported';
}

export function notify(title, body) {
  // TODO: new Notification(title, { body })，包 try/catch
}

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
}

export function unlockAudio() {
  // TODO: 首次用户手势内 play().then(() => { pause(); currentTime = 0; }).catch(() => {})
}

export function playChime() {
  if (!soundEnabled) return;
  // TODO: audio.currentTime = 0; audio.play().catch(() => {})
}
