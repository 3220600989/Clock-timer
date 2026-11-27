# 项目长期记忆：番茄钟 Clock timer

## 定位
纯前端番茄钟 SPA：原生 HTML/CSS/JS（ES Modules），无框架/构建/后端，静态托管，首屏 <100KB。
仓库 https://github.com/3220600989/Clock-timer.git（分支 main）。规格文档：PRD.md / TECH_DESIGN.md / AGENTS.md。

## 模块状态
| 文件 | 职责 | 状态 |
|---|---|---|
| storage.js | LocalStorage 读写（pomo.settings / pomo.records），内存态降级 | 已实现并验证 |
| timer.js | 计时状态机 idle/running/paused + focus/break，200ms tick | 已实现并验证 |
| notify.js | 通知 + 提示音（Web Audio 合成音） | 已实现并验证 |
| app.js | 唯一操作 DOM 的集成层 | 已实现并验证 |
| index.html / styles.css | 界面（14 个 id 与 app.js 一致；已加 data: 空图标避免 favicon 404） | 已接线 |
| assets/ | 静态资源目录，无音频文件（阶段 0 决策：改用 Web Audio 合成音） | — |

## 下一步：阶段 5
只剩端到端验收：PRD §5 五项 + AGENTS.md 清单九项（通知须用本地 http 服务验证，file:// 下受限）。

- **阶段 5 重点**：切标签页 30 秒后返回的剩余时间误差 ≤1s（真机人工走查，timer.js 侧已用假时钟验证过）；通知在 granted/denied 两种权限下的表现；首屏资源体积 <100KB。
- 阶段 3–4 的自动化验证脚本在 `%TEMP%/pomo-verify/`（不进仓库）：`drive-stage4.mjs` 用 CDP 驱动无头 Edge 跑 61 项断言，`drive-console.mjs` 查控制台报错。Node 22 自带全局 WebSocket，可零依赖写 CDP 客户端。

## 阶段 4 已交付要点（app.js）
- 4a render()：时间文本、主按钮文案（开始/暂停/继续）、模式标签与两枚模式按钮激活态、今日/本周计数、document.title 三态（`MM:SS · 专注中` / `· 已暂停` / `番茄钟`）。
- 4b 事件：主按钮按 status 分发；首次点击在用户手势内请求通知权限并解锁音频（permissionRequested 只请求一次）；模式切换与改时长在非 idle 时提示「请先重置计时器」。
- 4c 设置：toMinutes() 只接受 1–120 的纯整数字符串（拒绝 0/121/25.5/abc/空），提示音开关落 storage。
- 4d 统计：startOfToday / startOfWeek（周一起点），清空记录走 window.confirm 二次确认。
- 4e handleFinish：提示音 + 系统通知 + 页面内提示 + 专注计数 +1 + 自动切模式但不自动开始。
- 4f visibilitychange 切回前台补 tick。
- 验证：CDP 驱动无头 Edge 端到端 61 项断言全过（含真实等待 1 分钟的到时链路、刷新持久化）；交互路径控制台零报错。

## 阶段 3 已交付要点（notify.js）
- 导出：MESSAGES / ensurePermission / notify / notifyForMode / setSoundEnabled / isSoundEnabled / unlockAudio / playChime。
- ensurePermission 四态：unsupported / granted / denied / default；denied 后不再请求，请求抛错按 denied 处理。
- 提示音：两个正弦振荡器 880Hz + 1174.66Hz（延迟 0.16s），指数包络，主增益 0.6；不依赖 chime.mp3。
- 验证：Node mock 断言 55 项全过；无头 Edge 真机验证（http 安全上下文）零控制台错误、权限 denied 时不重复请求。

## 不可违反的约定（AGENTS.md）
- 计时逻辑只放 timer.js（不碰 DOM）；DOM 操作只放 app.js；LocalStorage 必经 storage.js；通知与音频只放 notify.js。
- 剩余时间恒由 `endAt - Date.now()` 推导，禁止每 tick 减 1 累加；200ms tick，显示用 Math.ceil 取整。
- 禁止第三方库、构建工具、账号/后端；所有 play()、requestPermission() 必须 .catch()。
- 提示音开关、时长、统计记录均持久化；今日/本周按本地时区在读取时计算。

## 环境坑（已解决，勿重踩）
- **Git 代理**：代理软件（Clash，端口 7892）关闭时，Git 全局代理必须 `git config --global --unset http.proxy` 与 `--unset https.proxy`，否则推送报 `Failed to connect to github.com:443 over proxy 127.0.0.1`。当前状态：无代理配置，直连可用。
- **NTFS ACL**：Windows 新建目录继承权限不含删除权，导致 git 报 `index.lock` / `Another git process` / 写对象 `Permission denied`。修复：`icacls <path> /grant "LAPTOP-Q0LAN6BN\Lenovo:(OI)(CI)(F)"`。
- 父目录 `D:/PersonalPortfolio` 不建 git 仓库，两个子项目各自独立管理。
