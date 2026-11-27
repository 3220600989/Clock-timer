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

## 状态：阶段 6 已完成（已上线）
阶段 5 验收通过后补完最后一环——上线与交付收尾：
- **GitHub Pages**：发布源为 `gh-pages` 分支（仓库根目录即站点根目录），线上 https://3220600989.github.io/Clock-timer/ ——已实测 HTTP 200 且 6 个静态资源（index/styles/app/timer/storage/notify）全部 200，MIME 类型正确（模块可加载）。
- **WorkBuddy 应用发布**：https://pomodoro-timer-71459.app.workbuddy.host/?sharecode=RNPXKWGTF6 （实测 HTTP 200，关键 DOM id 齐全）。
- 交付物：README.md（功能、技术要点、运行、目录、部署、验收结论）、.nojekyll、.github/workflows/pages.yml（只做分支同步，不构建）。

## 部署要点（下次直接照做）
- **开启 Pages 不必进设置页**：推一条 `git push origin main:gh-pages` 即可让仓库自动启用 Pages（实测 has_pages 由 False 变 True、站点立即可访问）。
- **actions/deploy-pages 工作流在 Pages 未启用时必失败**（失败步骤为「配置 Pages」），因为它要求发布源是 GitHub Actions 而非分支。故本项目工作流改为「同步 main → gh-pages」的轻量分支同步，不做构建。
- 手动发布：`git push origin main:gh-pages`；工作流会在 main 有更新时自动同步。

## 阶段 5 已完成（端到端验收通过）
PRD §5 五项 + AGENTS.md 九项 + PRD §4 非功能需求全部实测通过。脚本在 `%TEMP%/pomo-verify/s5/`（不进仓库）：
- `drive-stage5.mjs` 主驱动（场景 1–9，80/82，两处失败均为脚本自身时序/断言问题，已修正并单独复测通过）
- `drive-basic-only.mjs` 场景 1 复测 31/31；`drive-finish-only.mjs` 场景 5 复测 15/15
- `drive-a11y.mjs` 可访问性 15/15（真实 Tab/Enter/Space 按键 + ARIA 语义）
- `drive-longrun2.mjs` 长时运行等效验证（加速时钟 20 倍，40 分钟虚拟时长）+ `verify-metric.mjs` 证明度量可区分累加式
- `drive-shots.mjs` 界面截图；`drive-console.mjs` 控制台零报错

## 阶段 5 验收结论
- **切标签页 30 秒返回**：误差 ≤1s 通过（真实 CDP 切 target，visibilityState 确实 hidden）。实测后台 200ms 定时器 5 秒仅触发 4 次（浏览器节流），这正是必须用 `endAt - Date.now()` 推导的原因。
- **通知三态**：granted（注入替身验证标题/正文/计数+1）、denied（友好提示、requestPermission 调用 0 次）、unsupported（降级页面内提醒）全部通过。
- **长时运行等效**：40 分钟虚拟时长逐点误差与漂移跨度均 ≤2s；累加式实现会达 2,160,000ms 量级，度量已验证可区分。
- **首屏体积**：21,766 B ≈ 21.3KB（gzip 8.2KB），远低于 100KB 上限。
- **可访问性**：6 个按钮均有文字、Tab 顺序正确、Enter/Space 可激活、label/aria-live/role=status 齐备。

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
- **DNS 污染（下午再次出现）**：github.com 被解析到不可达 IP，必须用 `git -c http.proxy= -c https.proxy= -c "http.curloptResolve=github.com:443:<可达IP>" push` 绕过；且单个 IP 会时好时坏（140.82.113.3 先成功后失败，140.82.114.3 成功），要准备多个 IP 轮换重试。
- **NTFS ACL**：Windows 新建目录继承权限不含删除权，导致 git 报 `index.lock` / `Another git process` / 写对象 `Permission denied`。修复：`icacls <path> /grant "LAPTOP-Q0LAN6BN\Lenovo:(OI)(CI)(F)"`。
- 父目录 `D:/PersonalPortfolio` 不建 git 仓库，两个子项目各自独立管理。
