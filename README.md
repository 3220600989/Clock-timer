# 番茄钟 Clock Timer

[![GitHub Pages](https://img.shields.io/badge/在线演示-GitHub%20Pages-2ea44f)](https://3220600989.github.io/Clock-timer/)

纯前端番茄钟计时器。原生 HTML / CSS / JavaScript（ES Modules），**无框架、无构建、无依赖、无后端**，首屏资源 38.3KB（gzip 后 13.3KB）。

- **在线演示**：<https://3220600989.github.io/Clock-timer/>（GitHub Pages）

核心难点是**倒计时准确性**与**通知 / 音频的浏览器策略兼容**，两处都已在真实浏览器中实测通过。

## 功能

| 能力 | 说明 |
|---|---|
| 计时 | 开始 / 暂停 / 继续 / 重置，支持专注与休息两种模式 |
| 自定义时长 | 专注与休息各自可设 1–120 分钟整数，非法输入即时拒绝并提示 |
| 到时反馈 | 合成提示音 + 系统通知 + 页面内提示，完成后自动切到休息模式（不自动开始） |
| 统计 | 今日 / 本周专注完成数，按本地时区在读取时计算，可一键清空（二次确认） |
| 持久化 | 时长、提示音开关、完成记录写入 LocalStorage，刷新不丢 |
| 状态可见 | 页面标题随状态变化（`24:59 · 专注中` / `· 已暂停` / `番茄钟`） |

## 运行

```bash
# 方式一：直接双击 index.html
# 方式二（通知功能需要 http 环境）
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> 通知 API 在 `file://` 协议下受限，调试通知请务必使用本地 http 服务器。

## 技术要点

**倒计时不累加。** 剩余时间恒由 `endAt - Date.now()` 推导，200ms 定时器只负责刷新显示，用 `Math.ceil` 取整显示为 `MM:SS`。浏览器会把后台标签页的定时器节流到秒级（实测 200ms 定时器 5 秒只触发 4 次），若改成「每 tick 减 1」的实现，切后台 30 秒回来会严重走偏；本实现下切后台返回的剩余时间误差 ≤1 秒。

**提示音零资源依赖。** 用 Web Audio API 实时合成「叮」声——880Hz 与 1174.66Hz 两个正弦音（辅音延迟 0.16s 进入），各接指数包络（0.0001 起音 → 12ms 冲峰 → 指数衰减回 0.0001），主增益 0.6。不依赖任何二进制音频文件，仓库里没有 mp3。

**通知权限四态。** `unsupported` / `granted` / `denied` / 请求中。被用户拒绝后**不再重复请求**；请求抛错按 `denied` 处理；未授权时降级为页面内提醒，不阻断计时。

**界面视觉。** 自然有机方向：薄荷绿主色 + 珊瑚橘强调色（60/30/10），记忆点是一个**会呼吸的进度圆环**——环的 `stroke-dashoffset` 由 `--progress` 驱动，随剩余时间收紧；专注薄荷绿、休息珊瑚橘，运行时缓慢呼吸。数字用 Bahnschrift / DIN Alternate 等本机几何字体（无网络字体请求，离线同样成立），背景为渐变网格 + SVG 噪点纹理。桌面两栏、≤760px 单栏，全部动效在 `prefers-reduced-motion: reduce` 下关闭。视觉状态通过 `.app` 上的 `data-mode` / `data-status` 属性交给 CSS，不参与任何计时逻辑。

## 目录结构

```
index.html      # 页面结构
styles.css      # 样式
app.js          # 集成层：唯一操作 DOM 的文件
timer.js        # 计时核心：状态机，不碰 DOM
storage.js      # LocalStorage 读写，无存储时内存态降级
notify.js       # 通知与提示音
assets/         # 静态资源目录（当前无音频文件）
```

分层约定（详见 `AGENTS.md`）：计时逻辑只放 `timer.js`，DOM 操作只放 `app.js`，所有 LocalStorage 读写必经 `storage.js`，通知与音频只放 `notify.js`。

## 部署

本项目是纯静态文件，任意静态托管即可。本仓库采用 **GitHub Pages**，发布源为 `gh-pages` 分支（仓库根目录即站点根目录）。

- `gh-pages` 分支由 `.github/workflows/pages.yml` 在 `main` 有更新时自动同步——该工作流**不做任何构建、打包或依赖安装**，只把同一份文件推到 `gh-pages`。
- 手动发布一条命令：`git push origin main:gh-pages`。
- 首次启用 Pages 的经验：推上 `gh-pages` 分支即可让仓库自动开启 Pages，无需进设置页手动配置。
- 线上地址：<https://3220600989.github.io/Clock-timer/>

另有 WorkBuddy 应用发布通道，产出公网链接 `https://pomodoro-timer-71459.app.workbuddy.host/?sharecode=RNPXKWGTF6`，可在「设置—数据管理—应用」中管理。

## 验收结论

- PRD 第 5 节五条验收项全部通过：切标签页 30 秒返回剩余时间正确、专注 1 分钟到时音/通知/页面提示齐备、暂停后刷新回到初始态、完成 2 个周期计数为 2 且刷新不丢、刷新后时长与提示音开关保持。
- AGENTS.md 提测自查清单九项全部通过，其中键盘可操作性用真实 Tab / Enter / Space 按键派发验证（非脚本模拟点击）。
- 长时运行等效验证：注入 20 倍加速时钟跑满 40 分钟虚拟时长，漂移指标 `E(t) = t + 显示值` 全程跨度 860ms（每 tick 累加式实现会达 2,160,000ms 量级），逐点误差在取整带内，判定零漂移。
- 控制台零报错（含未捕获异常、`console.error` 与资源 404 全量捕获）。

## 文档

- `PRD.md` —— 需求与验收标准
- `TECH_DESIGN.md` —— 技术设计与模块划分
- `AGENTS.md` —— 目录约定、编码约定与提测清单
