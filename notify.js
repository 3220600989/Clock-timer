/**
 * 通知与提示音
 *
 * 约定：不碰 DOM；所有 Promise 都要 .catch()，不允许未处理的 Promise。
 * 提示音用 Web Audio（网页音频合成接口）实时合成，不依赖 assets/chime.mp3 二进制资源。
 */

export const MESSAGES = {
  focus: { title: '专注完成！休息一下吧', body: '专注周期已完成，休息一下吧。' },
  break: { title: '休息结束，进入下一段心流', body: '休息结束，进入下一段心流。' },
};

/** 主音量，对应原 Audio 方案的 volume = 0.6 */
const MASTER_VOLUME = 0.6;

/**
 * 「叮」声：两音提示。
 * 主音 A5 = 880Hz，辅音 D6 = 1174.66Hz，辅音延迟 0.16s 进入，形成上行两音。
 */
const CHIME_NOTES = [
  { freq: 880.0, offset: 0.0, duration: 0.55, peak: 0.3 },
  { freq: 1174.66, offset: 0.16, duration: 0.7, peak: 0.24 },
];

let soundEnabled = true;
let audioCtx = null;

/** 取全局对象：浏览器里是 window，测试环境（Node）退化为 globalThis */
function getGlobal() {
  return typeof window !== 'undefined' ? window : globalThis;
}

/**
 * 通知权限四态：
 * 'unsupported' 浏览器不支持 Notification
 * 'granted'     已授权
 * 'denied'      已拒绝（不再重复请求）
 * 'default'     用户未选择（仅 requestPermission 返回该值时出现）
 */
export async function ensurePermission() {
  const g = getGlobal();
  if (!('Notification' in g)) return 'unsupported';

  const current = g.Notification.permission;
  if (current === 'granted') return 'granted';
  if (current === 'denied') return 'denied';

  try {
    const result = await g.Notification.requestPermission();
    if (result === 'granted' || result === 'denied' || result === 'default') return result;
    return 'denied';
  } catch {
    // 请求失败（常见于非安全上下文）按不可用处理，避免反复请求
    return 'denied';
  }
}

/**
 * 发送系统通知。仅在已授权时发送；页面内提示由 app.js 负责（PRD 3.4：页面内提示为必须，系统通知为增强）。
 * @returns {boolean} 是否真的发出
 */
export function notify(title, body) {
  const g = getGlobal();
  if (!('Notification' in g)) return false;
  if (g.Notification.permission !== 'granted') return false;

  try {
    new g.Notification(title, { body: body || '', tag: 'pomo-timer' });
    return true;
  } catch {
    // 构造失败（如部分浏览器在非安全上下文抛错）不影响计时逻辑
    return false;
  }
}

/** 按模式发送对应文案的通知 */
export function notifyForMode(mode) {
  const message = MESSAGES[mode] || MESSAGES.focus;
  return notify(message.title, message.body);
}

/** 开关提示音 */
export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
}

/** 当前提示音是否开启 */
export function isSoundEnabled() {
  return soundEnabled;
}

/** 惰性创建 AudioContext；不支持或创建失败时返回 null */
function getAudioContext() {
  if (audioCtx) return audioCtx;

  const g = getGlobal();
  const Ctor = g.AudioContext || g.webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

/**
 * 解锁音频：必须在首次用户手势内调用，否则 AudioContext 处于 suspended，播放无声。
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }
  return true;
}

/**
 * 播放「叮」声。开关关闭时直接跳过。
 * @returns {boolean} 是否真的排入了播放
 */
export function playChime() {
  if (!soundEnabled) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  // 已解锁时通常不会走到这里；兜底恢复 suspended 状态
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    ctx.resume().catch(() => {});
  }

  try {
    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);

    for (const note of CHIME_NOTES) {
      const startAt = t0 + note.offset;
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, startAt);

      // 指数包络：0.0001 起音 → 12ms 内冲到峰值 → 指数衰减到静音
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(note.peak, startAt + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);

      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(startAt);
      oscillator.stop(startAt + note.duration + 0.05);
    }
    return true;
  } catch {
    // 音频合成失败不影响计时逻辑
    return false;
  }
}
