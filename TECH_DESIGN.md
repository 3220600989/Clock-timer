# TECH_DESIGN.md

## 1. 技术选型

- 原生 HTML + CSS + JavaScript（ES Modules），无构建步骤。
- 持久化：LocalStorage。
- 提醒：Notification API + `Web Audio`（网页音频合成接口，实时合成提示音，不依赖音频文件）。
- 部署：任意静态托管。

## 2. 文件结构

```
/
├── index.html
├── styles.css
├── app.js          # 入口：事件绑定、渲染
├── timer.js        # 计时核心（基于时间戳）
├── storage.js      # LocalStorage 读写
├── notify.js       # 通知 + 提示音
└── assets/         # 静态资源目录（提示音由 Web Audio 合成，此处无音频文件）
```

## 3. 数据模型（LocalStorage）

| Key | 值示例 | 说明 |
|---|---|---|
| `pomo.settings` | `{"focus":25,"break":5,"sound":true}` | 时长（分钟）与提示音开关 |
| `pomo.records` | `[{"ts":1732700000000}]` | 每个完成的专注周期一条记录 |

记录只存时间戳，今日/本周在读取时按本地时区计算，避免跨时区、跨天统计错乱。

## 4. 状态机

```
idle ──start──> running ──pause──> paused
  ^                │                 │
  │                │ finish          │ start
  │                v                 │
  └──reset──── finished <────────────┘
```

状态字段：`status: 'idle' | 'running' | 'paused'`，`mode: 'focus' | 'break'`。

## 5. 倒计时实现（准确性关键）

**不要**用“每 tick 减 1 秒”，要用绝对时间戳：

```js
// 开始/继续
this.endAt = Date.now() + this.remainingMs;
this.tickId = setInterval(() => this.tick(), 200);

tick() {
  const left = this.endAt - Date.now();
  if (left <= 0) {
    this.remainingMs = 0;
    this.stopTick();
    this.render();
    this.onFinish();          // 触发提醒 + 切换模式
    return;
  }
  this.remainingMs = left;
  this.render();
}
```

要点：

- 间隔用 200ms，显示按 `Math.ceil(left / 1000)` 取整，避免“跳秒”。
- 剩余时间永远由 `endAt - Date.now()` 推导，因此标签页被节流、系统休眠后恢复，都能自动纠正。
- 暂停时 `stopTick()` 并保存 `remainingMs`；继续时以当前时间为基准重算 `endAt`。
- `visibilitychange` 事件里补一次 `tick()`，切回前台立即校正显示。
- 格式化：`const s = Math.ceil(ms/1000); `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}``

## 6. 通知模块

```js
export async function ensurePermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}
```

- 在首次点击“开始”时调用（用户手势内，避免被拦截）。
- `denied` / `unsupported` 只在页面内提示一次，不弹错误、不重复请求。
- 发送通知：`new Notification(title, { body })`；标签页在前台时页面内提示为主。

## 7. 提示音

用 Web Audio 实时合成，不引入音频二进制文件（满足首屏 <100KB 约束）。

- 惰性创建 `AudioContext`：首次播放时才创建，创建失败或浏览器不支持时静默降级为无声。
- 解锁：首次点击开始时（用户手势内）创建并 `resume()`，`resume()` 的 Promise 必须 `.catch()`。
- 合成：两个正弦振荡器 880Hz（主音）与 1174.66Hz（辅音，延迟 0.16s 进入），各接一条指数包络
  （起音 0.0001 → 12ms 冲到峰值 → 指数衰减回 0.0001），经主增益 0.6 输出到 `destination`。
- 开关关闭时直接跳过播放。
- 合成过程整体包 try/catch，失败不影响计时逻辑。

## 8. 统计逻辑

```js
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); };
const startOfWeek  = () => {              // 以周一为起点
  const d = new Date(); d.setHours(0,0,0,0);
  const day = (d.getDay() + 6) % 7;       // 周一=0
  return d.getTime() - day * 86400000;
};
```

- 每次专注完成：`records.push({ ts: Date.now() })` 并写回 LocalStorage。
- 渲染时过滤 `ts >= startOfToday()` / `ts >= startOfWeek()` 计数。

## 9. 渲染与事件

- 单一 `render()` 函数根据 state 输出：时间文本、主按钮文案（开始/暂停/继续）、模式标签、统计数字、`document.title`。
- 主按钮点击按状态分发到 `start / pause / resume`。
- 重置：`remainingMs = 初始时长`，`status = 'idle'`。
- 模式切换 / 修改时长：先校验 `status === 'idle'`。

## 10. 已知风险与对策

| 风险 | 对策 |
|---|---|
| `setInterval` 被后台节流 | 用时间戳推导剩余时间；`visibilitychange` 补 tick |
| 通知权限被拒 | 页面内友好提示，降级为页面内提醒 |
| 音频自动播放被拦截 | 首次用户手势内解锁音频 |
| 浏览器休眠后时间跳变 | `left <= 0` 直接判定结束，不补跑 tick |
| LocalStorage 被清空/隐私模式 | 读写包 try/catch，失败时降级为内存态 |
