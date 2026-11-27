/**
 * 入口（骨架）：DOM 引用、事件绑定、渲染。
 * 约定：DOM 操作只放本文件。
 */
import { Timer, MODES, STATUS } from './timer.js';
import {
  loadSettings,
  saveSettings,
  loadRecords,
  saveRecords,
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

let settings = loadSettings();
let records = loadRecords();

const timer = new Timer({
  durationsMs: {
    [MODES.FOCUS]: settings.focus * 60_000,
    [MODES.BREAK]: settings.break * 60_000,
  },
  onTick: () => render(),
  onFinish: () => handleFinish(),
});

function render() {
  // TODO: 更新时间文本（Math.ceil(left/1000) → MM:SS）
  // TODO: 更新主按钮文案（开始 / 暂停 / 继续）
  // TODO: 更新模式标签、模式按钮的激活态
  // TODO: 更新今日 / 本周统计数字
  // TODO: 更新 document.title（"24:59 · 专注中" / "已暂停" / "番茄钟"）
}

function showNotice(text) {
  // TODO: 写入 el.notice 并取消 hidden
}

function handleFinish() {
  // TODO: 播放提示音 + 发送通知 + 页面内提示
  // TODO: 专注完成时 addRecord；自动切换模式但不自动开始
  // TODO: 调用 render()
}

function bindEvents() {
  el.primaryBtn.addEventListener('click', () => {
    // TODO: 首次点击时 ensurePermission() + unlockAudio()；再按 status 分发 start / pause / resume
  });

  el.resetBtn.addEventListener('click', () => {
    // TODO: timer.reset()
  });

  el.focusModeBtn.addEventListener('click', () => {
    // TODO: timer.setMode(MODES.FOCUS)
  });

  el.breakModeBtn.addEventListener('click', () => {
    // TODO: timer.setMode(MODES.BREAK)
  });

  el.saveSettingsBtn.addEventListener('click', () => {
    // TODO: 校验 1–120 整数；非 IDLE 时提示"请先重置计时器"；否则写 settings 并 saveSettings()
  });

  el.soundToggle.addEventListener('change', () => {
    // TODO: setSoundEnabled() 并写回 settings / saveSettings()
  });

  el.clearRecordsBtn.addEventListener('click', () => {
    // TODO: 二次确认后 clearRecords() 并 render()
  });

  document.addEventListener('visibilitychange', () => {
    // TODO: 切回前台时 timer.tick() 补一次校正
  });
}

function init() {
  // TODO: 用 settings 回填输入框与提示音开关
  setSoundEnabled(settings.sound);
  bindEvents();
  render();
}

init();
