/**
 * LocalStorage 读写（骨架）
 * 约定：所有存储读写都经过本模块；读写包 try/catch，失败降级为内存态。
 */

export const KEYS = {
  SETTINGS: 'pomo.settings',
  RECORDS: 'pomo.records',
};

const DEFAULT_SETTINGS = { focus: 25, break: 5, sound: true };

export function loadSettings() {
  // TODO: try/catch 读取 KEYS.SETTINGS 并解析；失败返回默认设置副本
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  // TODO: try/catch 写入 KEYS.SETTINGS
}

export function loadRecords() {
  // TODO: try/catch 读取 KEYS.RECORDS 并解析；失败返回 []
  return [];
}

export function saveRecords(records) {
  // TODO: try/catch 写入 KEYS.RECORDS
}

export function addRecord(ts) {
  // TODO: 追加一条专注完成记录并写回；ts 为毫秒时间戳
}

export function clearRecords() {
  // TODO: 清空记录并写回
}
