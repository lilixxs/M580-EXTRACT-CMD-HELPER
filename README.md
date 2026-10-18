# M580-EXTRACT-CMD-HELPER

> 语言 / Language：[中文](#中文) · [English](#english)

远端仓库已更名为 `M580-EXTRACT-CMD-HELPER`：<https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER>

---

# 中文

## 这是什么

`INDEX.html` 是一个 **EXTRACT 指令生成工具**：填写源变量、目标变量、位置和复制数量，页面给出参数校验、功能块图、变量声明表、复制数据示意图、引脚说明表，并生成 ST 程序段。

`ADDMX地址生成解析工具.docx` 记录的是 ADDM/ADDMX 寻址工具的需求演变。当前页面**不是**该工具，两者差异是有意保留的现状。

## 界面截图

默认参数下的页头与参数配置区（桌面视口 1440×1000）：

![默认参数下的页头与参数配置区，桌面视口 1440×1000，中文界面](docs/images/configuration-desktop.png)

默认参数下的功能块图、变量声明、ST 程序段与引脚说明表区域（桌面输出区域的元素截图；视口 1440×1000，PNG 980×1229）：

![默认参数下的功能块图、变量声明、ST 程序段与引脚说明表区域，中文界面](docs/images/output-desktop.png)

窄屏（移动视口 360×900）下的页头与参数配置区：

![窄屏 360×900 下的页头与参数配置区，中文界面](docs/images/configuration-mobile.png)

以上截图在浏览器中直接打开当前 `INDEX.html` 默认示例拍摄，来自 UI 提交 `585e78e`，界面为中文。截图为说明材料，不是视觉测试基线。

## 功能要点

- 源/目标变量支持四种形式：数组、基本类型、STRING、DDT/自定义。
- 元素划分（SRC_NELEM）三种方式：与源变量类型相同、字节数（`SIZEOF()` 函数）、自定义值。
- `SRC_POS` / `DST_POS` 是**从 0 开始的元素偏移**，不是数组声明下标。例如 `ARRAY[5..14]` 中 `SRC_POS = 2` 对应下标 7。
- 目标容量按「目标字节数 ÷ 元素大小」计算，不一定等于目标数组的元素数。
- `SRC_POS`、`DST_POS`、`CPY_NELEM` 支持填入变量名等非整数文本，按运行时表达式处理并原样写入 ST。
- 实时输出：参数校验（对应 ERR 运行时错误预判）、功能块图、变量声明表、复制数据示意图、引脚说明表、ST 程序段。
- 源变量名、目标变量名、ERR 变量名三个字段提供复制与清空按钮；程序段有复制按钮；「重置为示例」恢复默认参数。

## 使用步骤

1. 浏览器直接打开 `INDEX.html`（单文件、离线可用，无需 npm 或外网）。
2. ①④ 填写源变量与目标变量的名称/地址及变量形式。
3. ② 选择元素划分方式，确认派生信息（元素大小、目标容量）。
4. ③ 填写 `SRC_POS`、`DST_POS`、`CPY_NELEM`；⑤ 填写 ERR 输出变量名。
5. 查看 ⑥ 参数校验与复制数据示意图，确认无失败项。
6. 从「功能块图与生成代码」区复制 ST 程序段与变量声明。

## 默认示例与 ST 输出

页面加载后的默认参数：源为 10 个 WORD（`SrcArray`，`ARRAY[0..9]`），目标为 20 个 WORD（`DstArray`，`ARRAY[0..19]`），`SRC_POS = 2`、`DST_POS = 5`、`CPY_NELEM = 3`，ERR 输出变量为 `Copy_Status`。派生结果：元素大小 2 字节、目标容量 20，状态徽标为「参数有效 · 就绪」。

对应的 ST 程序段（由 `genST()` 生成；输入引脚用 `:=`，输出引脚 DST/ERR 用 `=>`）：

```st
(* EXTRACT: 将 SrcArray 的 3 个元素（自位置 2）复制到 DstArray（自位置 5） *)
EXTRACT(SRC       := SrcArray,
        SRC_NELEM := 10,
        SRC_POS   := 2,
        DST_POS   := 5,
        CPY_NELEM := 3,
        DST       => DstArray,
        ERR       => Copy_Status);
```

## 本地运行

使用应用本身无需任何构建：直接打开 `INDEX.html`。

开发与验证需要 Node >= 22，在项目根目录执行：

```bash
npm ci
npx playwright install chromium
npm run verify
```

各脚本含义（见 `package.json`）：

| 命令 | 作用 |
| --- | --- |
| `npm run check` | 运行 `scripts/check.cjs`：断言 HTML 结构（doctype、lang、charset、title、结尾），并用 `node:vm` 编译全部内联脚本做语法检查 |
| `npm run build` | 运行 `scripts/build.cjs`：清空 `dist/`，把 `INDEX.html` 复制为 `dist/index.html`（发布产物，不可反向编辑） |
| `npm test` | `npm run build && playwright test`；`playwright.config.cjs` 自动启动 `scripts/serve.cjs`（仅监听 `127.0.0.1:4173`），在 chromium 中打开 `dist/index.html` |
| `npm run verify` | `npm run check` + `npm test` |

聚焦单个用例：`npm test -- --grep "SRC_POS 越界"`。若直接执行 `npx playwright test`，须先运行 `npm run build`。

另有本地检测入口 `npm run test:local`（及 `test:local:negative`、`test:local:reporter`），细节见下文「本地检测」节。

## 自动化测试范围

仓库现有 9 个冒烟用例（`tests/smoke.spec.cjs`），覆盖默认 ST 输出、派生信息、参数联动、不整除、越界、目标截断、`CPY_NELEM = 0`、变量表达式与重置。

- 不覆盖：页面样式、剪贴板行为、真实 PLC 通讯与程序段在 Control Expert 中的编译。
- 用例保留了针对旧 Tailwind CDN 的网络拦截规则；当前页面不请求任何外部资源，该拦截为空操作。

## 本地检测（`test:local`，仅 Windows）

`npm run test:local` 由 `scripts/local-check.cjs` 编排，在**同一个 commit** 上创建三个独立的临时 git worktree，并行运行三条 lane：`functional`、`layout`、`visual`。端口固定为 `4181`（functional）、`4182`（layout）、`4183`（visual），每个 worktree 有各自的 `node_modules` 与 `dist/`。

前提与行为：

- 环境限定 Windows + Chromium，视口固定 `1280×800` 与 `1024×768`（Playwright 项目名 `chromium-1280x800`、`chromium-1024x768`）。
- 运行前工作区必须干净：存在未提交改动时以 `ENV_BLOCKED` 退出。不自动提交或暂存，不修改应用源码。检测证据写入已忽略的 `artifacts/`。
- 首次准备：`npm ci` 与 `npx playwright install chromium`。编排在每个 worktree 内用 `npm ci --offline --ignore-scripts` 安装依赖，检测阶段不联网。
- 浏览器只允许请求本机页面 `/`、`/index.html`，其余请求一律阻断并计为受阻。样式守卫核对 `INDEX.html` 的真实内联 CSS（body 背景 `rgb(250, 249, 245)`、区块直角、状态徽标颜色），不注入 CDN 或 vendor 脚本。
- 参数：`--lane functional|layout|visual` 聚焦单条 lane；`--run-id <id>` 指定唯一运行标识，标识重复即拒绝执行；`--candidates` 只生成候选基线。
- 退出码：`0` 通过、`1` 断言失败、`2` 环境受阻、`3` 基线待审。受阻与基线待审都**不是**通过。
- 产物：`artifacts/local-check/<run-id>/summary.json` 为汇总，日志位于同级 `logs/<lane>.log`。各 lane 下有 `html/`、`results/`、`screenshots/`。临时 worktree 保留供审计，不自动删除。
- 剪贴板默认 mock：`navigator.clipboard.writeText` 与 `document.execCommand` 被替换为记录器，不写入系统剪贴板；真实系统剪贴板检测未执行。

视觉基线：

- 基线路径固定为 `tests/local/baselines/win32/<project>/<case>.png`，附 `manifest.json` 审批记录。基线只能与同一 OS、字体、浏览器环境比对，不能跨环境共用；不自动更新，不放宽比较阈值。
- `npm run test:local -- --candidates` 只生成 8 张候选（默认示例、自定义 SRC_NELEM 无效、目标截断、长变量名 × 2 视口），返回 `baseline-pending`（退出码 `3`），**不记为视觉通过**。
- 当前内联 CSS 页面的 8 张基线已获用户确认，审批记录见 `manifest.json`。后续 UI 变化须重新生成候选并取得用户批准，不能复用旧 UI 的审批。运行结论以本次 `summary.json` 为准。

检测器自检（验证检测器有效，不等于产品通过）：

- `npm run test:local:negative`：5 个负例 —— `bad-st`（测试层篡改 ST → `failed`）、`moved-control`（注入 CSS 移动控件 → `failed`）、`missing-style`（剥离内联 `<style>` → `blocked`）、`port-in-use`（端口占用 → `blocked`）、`missing-baseline`（基线缺失 → `baseline-pending`）。
- `npm run test:local:reporter`：校验 lane 报告器把错误正确分类为 `failed` / `blocked` / `baseline-pending`，且不把真实断言失败混入其他类别。

边界：`npm run verify` 仍是 9 项冒烟，CI 与 Pages 工作流不变；`tests/local/*.local.cjs` 不匹配 `npm test` 的默认 `testMatch`，不会进入 CI。

## CI 与发布

工作流：`.github/workflows/pages.yml`。

- 触发条件：push 到 `main`、针对 `main` 的 PR、手动 `workflow_dispatch`。**没有配置路径过滤**，因此只改文档的 push 也会触发完整检查（并可能触发部署）。
- push 到 `main`：`npm ci` → `npx playwright install --with-deps chromium` → `npm run verify`。仅当事件不是 PR 时，才上传 `dist/` 并执行 Pages 部署。CI 使用 Node 24。
- PR：只跑检查，不部署。
- 预期站点地址（取决于仓库 Pages 配置，是否可访问以 Actions 运行结果为准）：<https://lilixxs.github.io/M580-EXTRACT-CMD-HELPER/>；运行记录见 [Actions](https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER/actions)。
- 发布产物只含 `dist/index.html`。DOCX、规则文档、测试与仓库文件不会进入网站；但仓库本身是公开的，仓库内文件对任何人可见。

## 验证边界与已知限制

- 页面内的类型字节大小表是**页面估算**，不是所有 PLC 平台的内存布局保证。
- 生成的 ST 程序段**未**在 Control Expert 或真实 PLC 上编译、通讯验证；PLC 相关结论须以官方文档与实际环境为准。
- `ADDMX地址生成解析工具.docx` 是历史需求对话，不是 PLC 官方手册。
- 无 lint 与 typecheck 配置。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| [`INDEX.html`](INDEX.html) | 应用唯一入口与全部源码（HTML/CSS/原生 JS，内联自包含） |
| [`package.json`](package.json) | npm 脚本与 Node 版本要求（>= 22） |
| [`playwright.config.cjs`](playwright.config.cjs) | Playwright 配置：chromium、单 worker、本地测试服务器 |
| [`scripts/check.cjs`](scripts/check.cjs) | HTML 结构与内联 JS 语法检查 |
| [`scripts/build.cjs`](scripts/build.cjs) | 生成发布产物 `dist/index.html` |
| [`scripts/serve.cjs`](scripts/serve.cjs) | 仅监听本机 4173 端口的测试服务器 |
| [`tests/smoke.spec.cjs`](tests/smoke.spec.cjs) | 9 个冒烟用例 |
| [`playwright.local.config.cjs`](playwright.local.config.cjs) | 本地检测配置：chromium、端口 4181–4183、两个视口 |
| [`scripts/local-check.cjs`](scripts/local-check.cjs) | 本地三 lane 检测编排（`npm run test:local`） |
| [`tests/local/`](tests/local/) | 三条 lane 的本地用例、支持库与 `baselines/win32/` 截图基线 |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | CI 检查与 Pages 发布工作流 |
| [`docs/images/`](docs/images/) | README 说明截图 |
| [`AGENTS.md`](AGENTS.md) | 项目事实与修改约束 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 贡献流程与文档同步规则 |
| [`claude_code_light_ui_style_guide.md`](claude_code_light_ui_style_guide.md) | 当前界面遵循的浅色直角风格指南 |
| `ADDMX地址生成解析工具.docx` | 历史需求对话（非官方手册） |

## 贡献

请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)：包含分支与改动边界、验证要求、README 两语言/截图/AGENTS 的同步规则，以及 PR 描述要求。

---

# English

[中文](#中文)

## What this is

`INDEX.html` is an **EXTRACT instruction generator**. Fill in the source variable, the destination variable, positions and the copy count. The page produces parameter checks, a function block diagram, a variable declaration table, a copy-data diagram, a pin reference table and an ST code snippet.

`ADDMX地址生成解析工具.docx` records the requirement history of an ADDM/ADDMX addressing tool. The current page is **not** that tool. The difference is intentionally kept.

## Screenshots

Page header and parameter configuration area with default parameters (desktop viewport 1440×1000):

![Page header and parameter configuration area with default parameters, desktop viewport 1440×1000, Chinese UI](docs/images/configuration-desktop.png)

Function block diagram, variable declaration, ST snippet and pin reference areas with default parameters (element screenshot of the desktop output area, viewport 1440×1000, PNG 980×1229):

![Function block diagram, variable declaration, ST snippet and pin reference areas with default parameters, Chinese UI](docs/images/output-desktop.png)

Page header and parameter configuration area on a narrow screen (mobile viewport 360×900):

![Page header and parameter configuration area on a narrow screen, 360×900, Chinese UI](docs/images/configuration-mobile.png)

The screenshots were taken by opening the current `INDEX.html` default example directly in a browser. They come from UI commit `585e78e` and show the Chinese interface. They are documentation images, not a visual test baseline.

## Features

- Source and destination variables support four forms: array, elementary type, STRING and DDT/custom.
- Element partitioning (SRC_NELEM) has three modes: same as the source type, byte count via the `SIZEOF()` function, and a custom value.
- `SRC_POS` / `DST_POS` are **zero-based element offsets**, not array declaration indices. Example: in `ARRAY[5..14]`, `SRC_POS = 2` corresponds to index 7.
- Destination capacity is computed as destination bytes divided by element size. It does not necessarily equal the destination array's element count.
- `SRC_POS`, `DST_POS` and `CPY_NELEM` accept non-integer text such as variable names. Such values are treated as runtime expressions and written into the ST snippet verbatim.
- Live outputs: parameter checks (previewing runtime ERR codes), function block diagram, variable declaration table, copy-data diagram, pin reference table and ST snippet.
- The source name, destination name and ERR name fields have copy and clear buttons. The code snippet has a copy button. "重置为示例" (reset to example) restores the default parameters.

## How to use

1. Open `INDEX.html` in a browser (single file, works offline, no npm or network needed).
2. In ① and ④, enter the source and destination variable names/addresses and their forms.
3. In ②, choose the element partitioning mode and check the derived values (element size, destination capacity).
4. In ③, enter `SRC_POS`, `DST_POS` and `CPY_NELEM`. In ⑤, enter the ERR output variable name.
5. Check the ⑥ parameter checks and the copy-data diagram. Make sure there is no failing item.
6. Copy the ST snippet and the variable declarations from the "功能块图与生成代码" (FBD and generated code) area.

## Default example and ST output

On load the defaults are a source of 10 WORDs (`SrcArray`, `ARRAY[0..9]`) and a destination of 20 WORDs (`DstArray`, `ARRAY[0..19]`). `SRC_POS = 2`, `DST_POS = 5` and `CPY_NELEM = 3`. The ERR output variable is `Copy_Status`. Derived values are an element size of 2 bytes and a destination capacity of 20. The status badge reads "参数有效 · 就绪" (parameters valid, ready).

The corresponding ST snippet is generated by `genST()`. Input pins use `:=`. Output pins DST and ERR use `=>`.

```st
(* EXTRACT: 将 SrcArray 的 3 个元素（自位置 2）复制到 DstArray（自位置 5） *)
EXTRACT(SRC       := SrcArray,
        SRC_NELEM := 10,
        SRC_POS   := 2,
        DST_POS   := 5,
        CPY_NELEM := 3,
        DST       => DstArray,
        ERR       => Copy_Status);
```

## Running locally

Using the application requires no build step: open `INDEX.html` directly.

Development and verification require Node >= 22. From the project root:

```bash
npm ci
npx playwright install chromium
npm run verify
```

What each script does (see `package.json`):

| Command | Purpose |
| --- | --- |
| `npm run check` | Runs `scripts/check.cjs`. It asserts HTML structure (doctype, lang, charset, title, closing tags) and compiles all inline scripts with `node:vm` for syntax checking. |
| `npm run build` | Runs `scripts/build.cjs`. It clears `dist/` and copies `INDEX.html` to `dist/index.html` (the publish artifact, do not edit it directly). |
| `npm test` | Runs `npm run build && playwright test`. `playwright.config.cjs` starts `scripts/serve.cjs` (listens on `127.0.0.1:4173` only) and opens `dist/index.html` in chromium. |
| `npm run verify` | Runs `npm run check` and then `npm test`. |

To focus a single case, run `npm test -- --grep "SRC_POS 越界"`. If you run `npx playwright test` directly, run `npm run build` first.

There are also local check entry points: `npm run test:local` (plus `test:local:negative` and `test:local:reporter`). See the "Local check" section below.

## Automated test scope

The repository has 9 smoke tests in `tests/smoke.spec.cjs`. They cover the default ST output, derived values, parameter linkage, non-divisible SRC_NELEM, out-of-range positions, destination truncation, `CPY_NELEM = 0`, variable expressions and reset.

- Not covered: page styling, clipboard behavior, real PLC communication and compilation of the snippet in Control Expert.
- The tests keep an interception rule for the old Tailwind CDN. The current page requests no external resource, so the rule is a no-op.

## Local check (`test:local`, Windows only)

`npm run test:local`, orchestrated by `scripts/local-check.cjs`, creates three independent temporary git worktrees at the **same commit** and runs three lanes in parallel: `functional`, `layout` and `visual`. Ports are fixed: `4181` (functional), `4182` (layout), `4183` (visual). Each worktree has its own `node_modules` and `dist/`.

Prerequisites and behaviour:

- The environment is limited to Windows + Chromium, with fixed viewports `1280×800` and `1024×768` (Playwright projects `chromium-1280x800` and `chromium-1024x768`).
- The working tree must be clean before running. Uncommitted changes cause `ENV_BLOCKED`. The tool does not stage or commit changes. It preserves application source and writes evidence under the ignored `artifacts/` directory.
- First-time setup: `npm ci` and `npx playwright install chromium`. Inside each worktree the orchestrator runs `npm ci --offline --ignore-scripts`; the check phase uses no network.
- The browser only permits local page requests to `/` and `/index.html`. Other requests are aborted and counted as blocked. A style guard checks the real inline CSS of `INDEX.html`: canvas colour, square corners and status badge colours. No CDN or vendor script is injected.
- Options: `--lane functional|layout|visual` focuses one lane; `--run-id <id>` sets a unique run identifier (a duplicate ID is refused); `--candidates` generates candidate baselines only.
- Exit codes: `0` passed, `1` failed, `2` blocked, `3` baseline-pending. Blocked and baseline-pending are **not** passes.
- The summary is `artifacts/local-check/<run-id>/summary.json`. Logs are stored alongside it under `logs/<lane>.log`. Each lane writes `html/`, `results/` and `screenshots/`. Temporary worktrees remain available for audit and are not deleted automatically.
- The clipboard is mocked by default: `navigator.clipboard.writeText` and `document.execCommand` are replaced by recorders and never touch the system clipboard. Real system clipboard detection has not been executed.

Visual baselines:

- Baselines live at `tests/local/baselines/win32/<project>/<case>.png` with an approval record in `manifest.json`. A baseline is only comparable within the same OS, font and browser environment; it is never shared across environments, never auto-updated and never relaxed in tolerance.
- `npm run test:local -- --candidates` generates only the 8 candidates (default example, invalid custom SRC_NELEM, destination truncation, long variable name × 2 viewports) and returns `baseline-pending` (exit code `3`). This is **not** a visual pass.
- The user approved the eight baselines for the current inline-CSS page. The approval record is in `manifest.json`. UI changes require new candidates and explicit user approval. An old UI approval cannot approve a new UI. Use the current `summary.json` for the run verdict.

Detector self-checks (they validate the detector, not the product):

- `npm run test:local:negative`: five negative controls — `bad-st` (ST tampered in the test layer → `failed`), `moved-control` (CSS injected to move a control → `failed`), `missing-style` (inline `<style>` stripped → `blocked`), `port-in-use` (port occupied → `blocked`), `missing-baseline` (baseline missing → `baseline-pending`).
- `npm run test:local:reporter`: verifies that the lane reporter classifies errors as `failed` / `blocked` / `baseline-pending` and does not merge real assertion failures into other categories.

Boundary: `npm run verify` still runs the 9 smoke tests, and CI/Pages stay unchanged. `tests/local/*.local.cjs` does not match the default `testMatch` of `npm test`, so it never enters CI.

## CI and publishing

Workflow: `.github/workflows/pages.yml`.

- Triggers: push to `main`, pull requests against `main` and `workflow_dispatch`. **No path filters are configured**, so a docs-only push also runs the full check and may trigger deployment.
- Push to `main`: `npm ci` → `npx playwright install --with-deps chromium` → `npm run verify`. Only when the event is not a PR does it upload `dist/` and run the Pages deployment. CI uses Node 24.
- Pull requests: checks only, no deployment.
- Expected site URL: <https://lilixxs.github.io/M580-EXTRACT-CMD-HELPER/>. It depends on the repository Pages configuration. Consult the [Actions](https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER/actions) runs for actual availability.
- The published artifact contains only `dist/index.html`. The DOCX, rule documents, tests and repository files do not enter the website. The repository itself is public, so repository files are visible to anyone.

## Verification boundaries and known limits

- The type byte-size table in the page is a **page-level estimate**. It is not a guarantee of memory layout on every PLC platform.
- The generated ST snippet has **not** been compiled or communication-tested in Control Expert or on a real PLC. PLC conclusions must come from official documentation and the actual environment.
- `ADDMX地址生成解析工具.docx` is a historical requirement conversation, not an official PLC manual.
- No lint or typecheck configuration exists.

## Repository layout

| Path | Description |
| --- | --- |
| [`INDEX.html`](INDEX.html) | The only application entry point and all source code (HTML/CSS/vanilla JS, self-contained inline) |
| [`package.json`](package.json) | npm scripts and Node version requirement (>= 22) |
| [`playwright.config.cjs`](playwright.config.cjs) | Playwright config: chromium, single worker, local test server |
| [`scripts/check.cjs`](scripts/check.cjs) | HTML structure and inline JS syntax checks |
| [`scripts/build.cjs`](scripts/build.cjs) | Produces the publish artifact `dist/index.html` |
| [`scripts/serve.cjs`](scripts/serve.cjs) | Test server listening on port 4173, local host only |
| [`tests/smoke.spec.cjs`](tests/smoke.spec.cjs) | 9 smoke tests |
| [`playwright.local.config.cjs`](playwright.local.config.cjs) | Local check config: chromium, ports 4181–4183, two viewports |
| [`scripts/local-check.cjs`](scripts/local-check.cjs) | Orchestrator of the three local lanes (`npm run test:local`) |
| [`tests/local/`](tests/local/) | Local lane specs, support code and the `baselines/win32/` screenshot baselines |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | CI check and Pages publishing workflow |
| [`docs/images/`](docs/images/) | Documentation screenshots for this README |
| [`AGENTS.md`](AGENTS.md) | Project facts and modification constraints |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution workflow and documentation sync rules |
| [`claude_code_light_ui_style_guide.md`](claude_code_light_ui_style_guide.md) | The light, square-corner UI style guide the page follows |
| `ADDMX地址生成解析工具.docx` | Historical requirement conversation (not an official manual) |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch and change boundaries, verification requirements, sync rules for both README languages, screenshots and AGENTS, and PR description requirements.
