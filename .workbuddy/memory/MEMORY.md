# 项目长期记忆：番茄钟 Clock timer

## 定位
纯前端番茄钟 SPA：原生 HTML/CSS/JS（ES Modules），无框架/构建/后端，静态托管，首屏 <100KB。
仓库 https://github.com/3220600989/Clock-timer.git（分支 main）。规格文档：PRD.md / TECH_DESIGN.md / AGENTS.md。

## 模块状态
| 文件 | 职责 | 状态 |
|---|---|---|
| storage.js | LocalStorage 读写（pomo.settings / pomo.records），内存态降级 | 已实现并验证 |
| timer.js | 计时状态机 idle/running/paused + focus/break，200ms tick | 已实现并验证 |
| notify.js | 通知 + 提示音 | 待做（阶段 3） |
| app.js | 唯一操作 DOM 的集成层 | 待做（阶段 4，骨架 TODO 占位） |
| index.html / styles.css | 骨架，14 个 id 与 app.js 引用一致 | 待接线（阶段 4） |
| assets/chime.mp3 | 不需要 | 阶段 0 决策：改用 Web Audio（网页音频合成接口）合成音 |

## 下一步：阶段 3 → 4 → 5
先做阶段 3：它是阶段 4e 的依赖前置，承载「通知/音频浏览器策略兼容」这一大风险点，且不碰 DOM 可独立验证。

- **阶段 3 notify.js**（P0，无 DOM）：ensurePermission 四态（unsupported / granted / denied / 请求结果）；notify() 用 try/catch 包裹；Web Audio 合成「叮」声替代 mp3；unlockAudio() 在首次用户手势内解锁；playChime() 受开关控制且带 .catch()。
- **阶段 4 app.js**：4a render()（时间文本 / 按钮文案 / 模式标签激活态 / 统计 / document.title 三态）→ 4b 事件（主按钮按 status 分发 start/pause/resume、重置、模式切换带 idle 校验）→ 4c 设置（时长 1–120 整数校验、非 idle 提示「请先重置计时器」、提示音开关落 storage）→ 4d 统计（startOfToday / startOfWeek 周一起点、清空记录二次确认）→ 4e handleFinish（音 + 通知 + 页面内提示 + 专注计数 +1 + 自动切模式但不自动开始）→ 4f visibilitychange 补 tick。
- **阶段 5**：端到端验收（PRD §5 五项 + AGENTS.md 清单九项；通知须用本地 http 服务验证，file:// 下受限）+ 提交推送。

## 不可违反的约定（AGENTS.md）
- 计时逻辑只放 timer.js（不碰 DOM）；DOM 操作只放 app.js；LocalStorage 必经 storage.js；通知与音频只放 notify.js。
- 剩余时间恒由 `endAt - Date.now()` 推导，禁止每 tick 减 1 累加；200ms tick，显示用 Math.ceil 取整。
- 禁止第三方库、构建工具、账号/后端；所有 play()、requestPermission() 必须 .catch()。
- 提示音开关、时长、统计记录均持久化；今日/本周按本地时区在读取时计算。

## 环境坑（已解决，勿重踩）
- **Git 代理**：代理软件（Clash，端口 7892）关闭时，Git 全局代理必须 `git config --global --unset http.proxy` 与 `--unset https.proxy`，否则推送报 `Failed to connect to github.com:443 over proxy 127.0.0.1`。当前状态：无代理配置，直连可用。
- **NTFS ACL**：Windows 新建目录继承权限不含删除权，导致 git 报 `index.lock` / `Another git process` / 写对象 `Permission denied`。修复：`icacls <path> /grant "LAPTOP-Q0LAN6BN\Lenovo:(OI)(CI)(F)"`。
- 父目录 `D:/PersonalPortfolio` 不建 git 仓库，两个子项目各自独立管理。
