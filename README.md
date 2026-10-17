# M580-ADDMX-HELPER

## 当前页面用途

`INDEX.html` 是一个 **EXTRACT 指令生成工具**：填写源/目标数组、位置与复制数量，页面给出校验、功能块图、声明表、内存示意图、引脚表，并生成 ST 代码。

`ADDMX地址生成解析工具.docx` 记录的是 ADDM/ADDMX 寻址工具的需求演变。当前页面**不是**该工具，两者差异是有意保留的现状。

## 技术形态

- 单文件页面：HTML、CSS、原生 JS 全部在 `INDEX.html`。
- 样式来自 Tailwind CDN，完整外观依赖外网。
- `dist/index.html` 由 `npm run build` 从 `INDEX.html` 复制生成，是发布产物，不可反向编辑。

## 本地运行

需要 Node >= 22。

```bash
npm ci
npx playwright install chromium
npm run verify
```

- `npm run check`：校验 HTML 结构与内联 JS 语法（`scripts/check.cjs`）。
- `npm run build`：清空 `dist/`，复制 `INDEX.html` 为 `dist/index.html`（`scripts/build.cjs`）。
- `npm test`：先 build，再用 Playwright chromium 打开 `http://127.0.0.1:4173` 跑 `tests/smoke.spec.cjs`。
- `npm run verify`：`npm run check` + `npm test`。

`npm test` 自动重建发布产物。若直接执行 `npx playwright test`，须先运行 `npm run build`。

## 本地检测运行

`npm run test:local` 调用 `scripts/local-check.cjs`，运行 functional/layout/visual 三个 lane 的 Playwright 检测（`*.local.cjs` 不进入 `npm test`）。当前状态与约束：

- 仅支持 Windows；要求工作区干净且实现已 commit（每 lane 在 `LOCALAPPDATA/Temp/opencode` 自动创建同 commit 的 detached 临时 worktree，独立 npm ci、dist 与端口 4181/4182/4183，worktree 保留不自动删除）。
- 前置 `npm ci` 与 `npx playwright install chromium` 需用户先执行；当前不自动安装浏览器。
- 临时 worktree 通过 `npm ci --offline --ignore-scripts` 使用已有 npm 缓存。缓存缺失时报环境受阻，不在检测过程中联网补装。浏览器只允许本机请求与固定样式 fixture 回放。
- 首次正式 visual 基线尚不存在，正常比较返回 pending，不能绿。`npm run test:local -- --candidates` 返回 3 并生成 8 张候选截图，须用户逐张确认后才可作为基线；`--inject`（bad-st 等）仅用于预期失败控制，不可作为正常通过记录。
- 退出码：0 通过 / 1 断言失败 / 2 环境受阻 / 3 基线待审。
- 不同操作系统渲染结果不同，不能跨 OS 共用基线。
- 检测不会自动更新基线或放宽阈值；产物在 `artifacts/local-check/<runId>/`。
- 本轮尚未执行首次基线人审与 3 次比较验证，也未合并推送；不要据此宣称整套检测已通过。

聚焦运行：`npm run test:local -- --lane functional`，lane 可选 `functional`、`layout`、`visual`。`--run-id <名称>` 可固定本次证据目录，名称不可重复。

`npm run test:local:negative` 验证坏 ST、控件偏移、样式缺失、端口占用和基线缺失这 5 类负例。该命令返回 0 只表示检测器正确拒绝负例，不表示产品通过。

## 发布（GitHub Actions / Pages）

工作流：`.github/workflows/pages.yml`。

- push 到 `main`：执行 `npm ci` → `npx playwright install --with-deps chromium` → `npm run verify`。全部通过后才上传 `dist/` 并部署 Pages。
- PR：只跑检查，不部署。
- 预期站点地址：https://lilixxs.github.io/M580-ADDMX-HELPER/ （首次部署是否成功以仓库 Actions 运行结果为准）。

发布产物只含 `dist/index.html`。DOCX、规则文档、测试与仓库文件不会进入网站；但 GitHub 仓库本身是公开的，仓库内文件（含 DOCX）对任何人可见。

## 验证边界

- Playwright 回归隔离 Tailwind CDN，覆盖功能与 ST 输出，不验证样式或剪贴板。
- PLC 通讯与程序段可编译性须在 Control Expert 或实际 PLC 环境验证。
- 无 lint 与 typecheck 配置。
