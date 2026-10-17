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
