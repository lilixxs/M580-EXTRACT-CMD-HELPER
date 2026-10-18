# 本地并行检测规划（Playwright + 截图）

## Steps

- [x] 基础设施：协调 agent 独占改动 serve/config/编排入口，跑通单 lane 冒烟。
- [ ] 并行套件：3 条 lane 在独立 worktree、独立端口、独立产物目录下并行通过。
- [x] 基线审核与负例：生成 8 张候选基线交用户审批冻结；5 类负例全部检出。
- [ ] 整合验收：现有 `npm run verify` 9 项不受影响，汇总产物与 manifest 齐全，3 次同环境一致。

## 当前依据

- 用户已批准适配最新主分支的离线页面。旧页面的验证与截图审批不计为新版验收，以下步骤重新执行。
- 分支 `plan/local-playwright-visual` 最初基于 `4d17ac3`，本次整合基于 `origin/main` 的 `0321a5e`。当前应用是 EXTRACT，不是 ADDM/ADDMX。
- Node >= 22，Playwright 锁定为 `1.64.1`。`npm test` 先构建 `dist/index.html`，再执行 9 项功能回归。
- 最新页面内置全部 CSS，不加载外部资源。现有冒烟测试保留旧 CDN 拦截但不触发，默认配置固定端口 `4173`、单 worker，仅失败时截图。
- 依据：`package.json:6-9`、`playwright.config.cjs:5,12-22`、`scripts/serve.cjs:22`、`scripts/build.cjs:6-9`、`tests/smoke.spec.cjs:19-22`。

## 1 范围与不改边界

- 环境仅限本地 Windows、Chromium，视口仅 `1280x800` 与 `1024x768`。
- 完整保留最新主分支的 `INDEX.html`、DOCX、现有 9 项 smoke、现有 `playwright.config.cjs` 与 CI/Pages 工作流；本任务不改应用源码，不新增浏览器引擎。
- 截图与几何断言只覆盖渲染与交互，**不能证明 PLC 通讯或程序段可编译**。

## 2 基础设施（协调 agent 独占，先于分发固定 commit）

- `scripts/serve.cjs`：支持环境变量 `LOCAL_CHECK_PORT`，默认 `4173`，保持现有行为兼容。
- 新增 `playwright.local.config.cjs`、`tests/local/support/**`、编排脚本 `scripts/local-check.cjs`、`package.json` 入口 `test:local`（**拟新增命令，不得写成现有命令**）。
- 本地测试统一后缀 `*.local.cjs`，`testMatch` 只匹配该后缀，避免现有 CI 默认发现；普通 `npm test` 行为不变。
- 基础设施就绪后再分发固定 commit 给实现 agent。
- 协调者先核对实际工作目录、分支和文件归属。任一 worker 越界修改共享文件时停止整合。

## 3 并行 worktree 隔离

- 每条 lane 独立 `git worktree`，同一 commit；端口固定：`4181` functional、`4182` layout、`4183` visual；各自 `dist/` 与 `node_modules`。
- 端口占用即明确报错；`reuseExistingServer=false`；禁止杀未知进程；不得声称 worktree 隔离端口本身。
- 执行期间冻结源码与共享配置；禁止同目录并发 `npm test`。

## 4 真实内联 CSS（禁止无样式基线）

- 使用 `INDEX.html` 自带的内联 CSS。移除旧版 Tailwind fixture 与 CDN 回放，不添加任何外部资源。
- 记录源 HTML 与内联 CSS 的 SHA256。临时 worktree 从已有 npm 缓存离线准备依赖，浏览器只允许本机页面请求。
- computedStyle 守卫核对画布背景 `#FAF9F5`、卡片直角、状态徽标的通过/警告/失败配色。**守卫失败 = 检测受阻，不得记为通过或 skip**。
- 样式负例仅在测试响应中剥离内联 `<style>`，不得编辑 `INDEX.html` 或修改线上页面。

## 5 三 lane 责任分工（general agent 实现，文件互不重叠）

| Lane | 文件 | 要点 |
|---|---|---|
| A functional | `tests/local/functional.local.cjs` | 补充 STRING/DDT/SIZEOF、清空、复制调用和回退路径；默认 mock 剪贴板，单独标记验证边界 |
| B layout | `tests/local/layout.local.cjs` | 真实样式下：输入框/清空/复制按钮无意外遮挡；长标识/FBD/表格水平滚动限于容器内；无页面级溢出；分段显隐几何 |
| C visual | `tests/local/visual.local.cjs` | `toHaveScreenshot`：默认/无效/截断/长文本 4 状态 × 2 视口 = 8 基线；复制反馈与恢复仅补局部截图证据，不作为额外全页基线 |

- 协调者独占 `package.json`、config、serve、support、orchestrator；reviewer 只读审结果；测试设计（test-engineer）与实现（general）分开。
- 基线由 visual lane 生成；仅用户明确审批后写入固定 baseline 目录。
- 4 个截图状态固定为：默认示例、自定义 SRC_NELEM=3、DST_POS=18 截断、固定长变量名。长变量名常量由 test-engineer 在分发前冻结。
- 真实系统剪贴板回读为单独授权项，默认不执行。获准后须保存并恢复原内容，不能把 mock 结果称为真实剪贴板验证。

## 6 证据与产物

- 成功与失败均收证据：`artifacts/local-check/<run-id>/<lane>/` 下 `html`、`results`、`screenshots`；各 worktree 天然隔离，协调者按清单汇总至自己目录的相同 run-id，不覆盖。
- 根 `summary.json` 由协调者单写。manifest 含：commit、源码 hash、OS 版本、Node/Playwright/浏览器版本、字体、viewport、内联 CSS hash、端口、lane、用例与基线 hash。
- `.gitignore` 增加 `artifacts/` 由协调者改（本轮不改）。基线固定为 `tests/local/baselines/win32/<project-name>/<case>.png`。项目名为 `chromium-1280x800` 和 `chromium-1024x768`。
- 首次候选只写入 `artifacts/.../baseline-candidates`，不写正式基线目录。候选生成成功不等于视觉回归通过。

## 7 截图稳定性与基线纪律

- 固定 DPR=1、locale `zh-CN`、colorScheme `light`、reducedMotion `reduce`、animations `disabled`、caret `hide`、scale `css`；等待字体、必需 DOM 与 computedStyle 就绪；`toHaveScreenshot` 依赖其稳定截屏机制，禁止任意 sleep。
- 瞬态复制反馈用可控时钟：先断言复制文本与按钮状态，再留截图证据。
- 无基线时明确报告“基线待审”，不得判视觉通过；正常比较 `updateSnapshots: none`、`ignoreSnapshots: false`。
- 首次仅生成候选，用户审核 8 张后冻结；后续更新须用户明确授权。禁止为消除红灯改基线、裁掉核心区域或放宽阈值；初始 `maxDiffPixels: 0`（颜色 threshold 采用文档默认值，不宣称零颜色容差）。固定环境下验证连续 3 次一致。
- 仅比较同一环境的基线。OS、浏览器、字体或内联 CSS 变化时停止沿用旧基线，重新提交候选供审核。Windows 基线不进入现有 Ubuntu CI。

## 8 验收与负例

- 现有 `npm run verify` 仍 9 项通过；3 lane 本地 `retries=0`，退出码正确汇总，任意功能/几何/截图失败均退出非 0；同环境 3 次结果一致。
- 5 类负例必须检出：① 测试层篡改生成的 ST；② 测试层注入 CSS 移动控件；③ 测试响应缺少内联 CSS；④ 端口占用；⑤ 基线缺失。负例只作用于专用临时 worktree 或测试页面，不编辑业务源文件或破坏正式基线。
- 成功须有 8 张基线的比较证据。图像不匹配时保留 expected/actual/diff 与 trace；其他失败保留可取得的截图与 trace，不伪造不存在的期望图。
- 汇总区分通过、断言失败、环境受阻、基线待审、未执行。后三类不能记为通过。除全部必选检测通过外，编排入口均返回非 0；未获授权的真实剪贴板检测单独列为未执行。
- 必选套件禁用 `.only`、`.skip` 和 `.fixme`。零用例、缺失 lane 报告或缺失必需截图均不能形成通过结论。
- `test:local` 等新入口在本规划中标为拟新增。实现完成并验证后，再更新运行文档。

## 9 本轮边界

- 用户已授权实施，并在验收通过后合并推送。新版 8 张候选仍需用户明确审批，不能复用旧版页面的审批。

## 实施前检查

- 合并前核对应用源码与最新主分支逐字节一致，不恢复旧版 UI 或 CDN。
- 保留新版基线审批步骤；README 与 CONTRIBUTING 的中英文说明须同步，文档说明图与测试基线分开管理。
- 官方依据：[截图比较](https://playwright.dev/docs/test-snapshots)、[本地资源回放](https://playwright.dev/docs/api/class-route#route-fulfill)。
