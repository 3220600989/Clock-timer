/**
 * 入口：DOM 引用、事件绑定、渲染。
 * 约定：DOM 操作只放本文件；存储走 storage.js；计时走 timer.js；通知与音频走 notify.js。
 */
import { Timer, MODES, STATUS, formatTime } from './timer.js';
import {
  loadSettings,
  saveSettings,
  loadRecords,
  addRecord,
  clearRecords,
} from './storage.js';
import {
  ensurePermission,
  notify,
  setSoundEnabled,
  unlockAudio,
  playChime,
  MESSAGES,
} from './notify.js';

const el = {
  modeTag: document.getElementById('mode-tag'),
  timeDisplay: document.getElementById('time-display'),
  primaryBtn: document.getElementById('primary-btn'),
  resetBtn: document.getElementById('reset-btn'),
  focusModeBtn: document.getElementById('focus-mode-btn'),
  breakModeBtn: document.getElementById('break-mode-btn'),
  focusInput: document.getElementById('focus-input'),
  breakInput: document.getElementById('break-input'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  soundToggle: document.getElementById('sound-toggle'),
  todayCount: document.getElementById('today-count'),
  weekCount: document.getElementById('week-count'),
  clearRecordsBtn: document.getElementById('clear-records-btn'),
  notice: document.getElementById('notice'),
};

const MODE_LABELS = { [MODES.FOCUS]: '专注', [MODES.BREAK]: '休息' };
const PRIMARY_LABELS = {
  [STATUS.IDLE]: '开始',
  [STATUS.RUNNING]: '暂停',
  [STATUS.PAUSED]: '继续',
};

let settings = loadSettings();
let records = loadRecords();
let permissionRequested = false;

const timer = new Timer({
  durationsMs: {
    [MODES.FOCUS]: settings.focus * 60_000,
    [MODES.BREAK]: settings.break * 60_000,
  },
  onTick: () => render(),
  onFinish: () => handleFinish(),
});

/* ---------- 4a 渲染 ---------- */

function render() {
  const remainingText = formatTime(timer.getRemainingMs());

  el.timeDisplay.textContent = remainingText;
  el.primaryBtn.textContent = PRIMARY_LABELS[timer.status];
  el.modeTag.textContent = MODE_LABELS[timer.mode];
  el.focusModeBtn.classList.toggle('is-active', timer.mode === MODES.FOCUS);
  el.breakModeBtn.classList.toggle('is-active', timer.mode === MODES.BREAK);

  el.todayCount.textContent = String(countSince(startOfToday()));
  el.weekCount.textContent = String(countSince(startOfWeek()));

  document.title = buildTitle(timer.status, remainingText);
}

function buildTitle(status, remainingText) {
  if (status === STATUS.RUNNING) return `${remainingText} · ${MODE_LABELS[timer.mode]}中`;
  if (status === STATUS.PAUSED) return `${remainingText} · 已暂停`;
  return '番茄钟';
}

function showNotice(text) {
  el.notice.textContent = text;
  el.notice.hidden = false;
}

/* ---------- 4d 统计 ---------- */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 本周起点：周一 00:00（本地时区） */
function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  return d.getTime() - day * 86400000;
}

function countSince(from) {
  return records.filter((record) => record.ts >= from).length;
}

/* ---------- 4b 主流程事件 ---------- */

function onPrimaryClick() {
  // 首次点击在用户手势内请求通知权限并解锁音频
  if (!permissionRequested) {
    permissionRequested = true;
    ensurePermission().then(handlePermissionState).catch(() => {});
  }
  unlockAudio();

  if (timer.status === STATUS.IDLE) timer.start();
  else if (timer.status === STATUS.RUNNING) timer.pause();
  else if (timer.status === STATUS.PAUSED) timer.resume();

  render();
}

function handlePermissionState(state) {
  if (state === 'unsupported') {
    showNotice('当前浏览器不支持系统通知，将使用页面内提醒。');
  } else if (state === 'denied') {
    showNotice('通知权限已被拒绝，可在浏览器地址栏左侧重新开启；本次使用页面内提醒。');
  }
}

function switchMode(mode) {
  if (!timer.setMode(mode)) {
    showNotice('请先重置计时器，再切换模式');
    return;
  }
  render();
}

/* ---------- 4c 设置项 ---------- */

/** 输入框取值：只接受 1–120 的整数分钟，非法返回 null */
function toMinutes(raw) {
  const text = String(raw).trim();
  if (!/^\d{1,3}$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1 || value > 120) return null;
  return value;
}

function onSaveSettings() {
  if (timer.status !== STATUS.IDLE) {
    showNotice('请先重置计时器，再修改时长');
    return;
  }

  const focus = toMinutes(el.focusInput.value);
  const breakMinutes = toMinutes(el.breakInput.value);
  if (focus === null || breakMinutes === null) {
    showNotice('时长需为 1–120 的整数分钟');
    return;
  }

  settings = { ...settings, focus, break: breakMinutes };
  saveSettings(settings);
  timer.setDuration(MODES.FOCUS, focus);
  timer.setDuration(MODES.BREAK, breakMinutes);

  showNotice('时长设置已保存');
  render();
}

function onSoundToggleChange() {
  const enabled = el.soundToggle.checked;
  setSoundEnabled(enabled);
  settings = { ...settings, sound: enabled };
  saveSettings(settings);
  showNotice(enabled ? '提示音已开启' : '提示音已关闭');
}

/* ---------- 4d 清空记录 ---------- */

function onClearRecords() {
  const confirmed = window.confirm('确定清空全部完成记录吗？此操作不可撤销。');
  if (!confirmed) return;

  clearRecords();
  records = loadRecords();
  showNotice('记录已清空');
  render();
}

/* ---------- 4e 到时处理 ---------- */

function handleFinish() {
  const finishedMode = timer.mode;
  const message = MESSAGES[finishedMode] || MESSAGES.focus;

  playChime();
  notify(message.title, message.body);
  showNotice(message.title);

  if (finishedMode === MODES.FOCUS) {
    addRecord(Date.now());
    records = loadRecords();
  }

  // 自动切到下一个模式，但不自动开始
  timer.setMode(finishedMode === MODES.FOCUS ? MODES.BREAK : MODES.FOCUS);
  render();
}

/* ---------- 4f 后台校正 ---------- */

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return;
  timer.tick();
  render();
}

function bindEvents() {
  el.primaryBtn.addEventListener('click', onPrimaryClick);
  el.resetBtn.addEventListener('click', () => {
    timer.reset();
    render();
  });
  el.focusModeBtn.addEventListener('click', () => switchMode(MODES.FOCUS));
  el.breakModeBtn.addEventListener('click', () => switchMode(MODES.BREAK));
  el.saveSettingsBtn.addEventListener('click', onSaveSettings);
  el.soundToggle.addEventListener('change', onSoundToggleChange);
  el.clearRecordsBtn.addEventListener('click', onClearRecords);
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function init() {
  el.focusInput.value = String(settings.focus);
  el.breakInput.value = String(settings.break);
  el.soundToggle.checked = settings.sound;
  setSoundEnabled(settings.sound);

  bindEvents();
  render();
}

init();
