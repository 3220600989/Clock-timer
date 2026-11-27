/**
 * LocalStorage 读写
 * 约定：所有存储读写都经过本模块；读写包 try/catch，失败降级为内存态。
 */

export const KEYS = {
  SETTINGS: 'pomo.settings',
  RECORDS: 'pomo.records',
};

const DEFAULT_SETTINGS = { focus: 25, break: 5, sound: true };

const memory = {
  settings: { ...DEFAULT_SETTINGS },
  records: [],
};

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function normalizeSettings(value) {
  const result = { ...DEFAULT_SETTINGS };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  if (Number.isInteger(value.focus) && value.focus >= 1 && value.focus <= 120) {
    result.focus = value.focus;
  }
  if (Number.isInteger(value.break) && value.break >= 1 && value.break <= 120) {
    result.break = value.break;
  }
  if (typeof value.sound === 'boolean') {
    result.sound = value.sound;
  }
  return result;
}

function normalizeRecords(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && Number.isFinite(item.ts))
    .map((item) => ({ ts: item.ts }));
}

export function loadSettings() {
  if (hasStorage()) {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      memory.settings = raw === null
        ? { ...DEFAULT_SETTINGS }
        : normalizeSettings(JSON.parse(raw));
    } catch {
      // 读取或解析失败时保留当前内存态
    }
  }
  return { ...memory.settings };
}

export function saveSettings(settings) {
  memory.settings = normalizeSettings(settings);
  if (hasStorage()) {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(memory.settings));
    } catch {
      // 写入失败时内存态仍保留本次设置
    }
  }
}

export function loadRecords() {
  if (hasStorage()) {
    try {
      const raw = localStorage.getItem(KEYS.RECORDS);
      memory.records = raw === null ? [] : normalizeRecords(JSON.parse(raw));
    } catch {
      // 读取或解析失败时保留当前内存态
    }
  }
  return memory.records.map((item) => ({ ...item }));
}

export function saveRecords(records) {
  memory.records = normalizeRecords(records);
  if (hasStorage()) {
    try {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(memory.records));
    } catch {
      // 写入失败时内存态仍保留本次记录
    }
  }
}

export function addRecord(ts) {
  if (!Number.isFinite(ts)) return;
  const records = loadRecords();
  records.push({ ts });
  saveRecords(records);
}

export function clearRecords() {
  saveRecords([]);
}
