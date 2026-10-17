# M580-EXTRACT-CMD-HELPER

> 语言 / Language：[中文](#中文) · [English](#english)

远端仓库已更名为 `M580-EXTRACT-CMD-HELPER`：<https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER>

---

# 中文

## 这是什么

`INDEX.html` 是一个 **EXTRACT 指令生成工具**：填写源变量、目标变量、位置和复制数量，页面给出参数校验、功能块图、变量声明表、复制数据示意图、引脚说明表，并生成 ST 程序段。

页面为单文件、离线自包含：不加载任何外部脚本、样式或图片（无 CDN、无网络依赖），字体仅使用本机字体栈。

## 历史背景

本项目源自历史上的 ADDM/ADDMX 寻址工具需求讨论。当前页面实现的是 EXTRACT 指令生成工具，并非该 ADDM/ADDMX 工具；这一差异是有意保留的现状。

记录该需求演变的历史 DOCX 文档**不纳入**当前仓库快照（仅由维护者本地保留），它也不是 PLC 官方手册。历史提交未重写，GitHub 提交历史中仍可能存在这些文件。

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
- 元素大小由「源字节数 ÷ SRC_NELEM」得出；目标容量按 `floor(目标字节数 ÷ 元素大小)` 计算，不一定等于目标数组的元素数。
- `SRC_POS` / `DST_POS` 是**从 0 开始的元素偏移**，不是数组声明下标。例如 `ARRAY[5..14]` 中 `SRC_POS = 2` 对应下标 7。
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

首次使用时，克隆仓库：

```bash
git clone https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER.git
cd M580-EXTRACT-CMD-HELPER
```

使用应用本身无需任何构建：直接打开 `INDEX.html`。

开发与静态检查需要 Node >= 22。在项目根目录执行：

```bash
npm ci
npm run verify
```

`npm run verify` 只做静态检查与构建，不运行浏览器测试。各脚本含义（见 `package.json`）：

| 命令 | 作用 |
| --- | --- |
| `npm run check` | 运行 `scripts/check.cjs`：断言 HTML 结构（doctype、lang、charset、title、结尾），并用 `node:vm` 编译全部内联脚本做语法静态检查 |
| `npm run build` | 运行 `scripts/build.cjs`：清空 `dist/`，把 `INDEX.html` 复制为 `dist/index.html`（发布产物，不可反向编辑） |
| `npm run serve` | 运行 `scripts/serve.cjs`：在 `127.0.0.1:4173` 提供本地**预览**服务器；须先执行 `npm run build`；仅监听本机，非测试服务器 |
| `npm run verify` | `npm run check` && `npm run build` |

`npm test` 不是公开定义的脚本。

## 浏览器自动化测试（当前状态）

当前仓库快照**不含**可复现的公开自动浏览器测试：`playwright.config.cjs` 与 `tests/` 未纳入仓库，仅在维护者本地保留。

- 维护者本地可用保留的 Playwright 用例作为额外检查，但它们不属于仓库公开内容，也不在 CI 中运行；不得据此宣称 CI 运行或通过了浏览器用例。
- 本地保留的冒烟用例不覆盖页面样式、剪贴板行为、真实 PLC 通讯，以及程序段在 Control Expert 中的编译；静态 `npm run verify` 不执行页面行为。

## CI 与发布

工作流：`.github/workflows/pages.yml`。

- 触发条件：push 到 `main`、针对 `main` 的 PR、手动 `workflow_dispatch`。**没有配置路径过滤**，因此仅修改文档的 `main` 分支 push 也会触发检查与构建。
- CI 在 Node 24 上执行 `npm ci` → `npm run verify`（即 `npm run check` + `npm run build`）。CI **不**安装 chromium、**不**运行浏览器测试、**不**上传测试失败报告。
- `main` 上的 push 或手动执行通过检查后：上传 `dist/` 并执行 Pages 部署。PR：只检查和构建，不部署。推送普通任务分支不会触发此工作流。
- 预期站点地址（取决于仓库 Pages 配置，是否可访问以 Actions 运行结果为准）：<https://lilixxs.github.io/M580-EXTRACT-CMD-HELPER/>；运行记录见 [Actions](https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER/actions)。
- 发布产物只含 `dist/index.html`。仓库文件不进入网站；但仓库本身是公开的，仓库内文件对任何人可见。

## 验证边界与已知限制

- 页面内的类型字节大小表是**页面估算**，不是所有 PLC 平台的内存布局保证。
- 生成的 ST 程序段**未**在 Control Expert 或真实 PLC 上编译、通讯验证；PLC 相关结论须以官方文档与实际环境为准。
- `npm run verify` 只覆盖 HTML 结构、内联 JS 语法与发布产物构建，不覆盖页面行为。
- 无 lint 与 typecheck 配置。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| [`INDEX.html`](INDEX.html) | 应用唯一入口与全部源码（HTML/CSS/原生 JS，内联自包含） |
| [`package.json`](package.json) | npm 脚本、Node 版本要求（>= 22）与 MIT 许可声明 |
| [`scripts/check.cjs`](scripts/check.cjs) | HTML 结构与内联 JS 语法静态检查 |
| [`scripts/build.cjs`](scripts/build.cjs) | 生成发布产物 `dist/index.html` |
| [`scripts/serve.cjs`](scripts/serve.cjs) | 仅监听本机 4173 端口的预览服务器 |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | CI 检查与 Pages 发布工作流 |
| [`docs/images/`](docs/images/) | README 说明截图 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 贡献流程、公共修改约束与文档同步规则 |
| [`LICENSE`](LICENSE) | MIT 许可证全文 |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | 第三方内容与商标说明 |

## 版权与许可

- 本仓库以 [MIT 许可](LICENSE) 发布，版权 (c) 2026 lilixxs。
- MIT 覆盖本仓库中由维护者拥有或已获授权的代码、文案与文档截图（含页面内 SVG 按钮的基础几何）。
- `INDEX.html` 内保留 MIT 版权与许可全文。构建后的单文件页面也保留该声明。
- MIT **不**覆盖：第三方手册及其版权（Schneider Electric 相关文档的使用条款见其官网）、第三方商标、以及历史提交中已从当前快照排除的材料（如历史 DOCX）。详见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
- 维护者的权属确认是本仓库按 MIT 发布的依据，不是对全部代码来源的独立审计证明；本项目不作零风险承诺。

## 贡献

请阅读 [`CONTRIBUTING.md`](CONTRIBUTING.md)：包含公共修改约束、分支与改动边界、验证要求、README 两语言/截图的同步规则，以及 PR 描述要求。

本文件与贡献指南均先写中文全文，再写英文全文。修改时必须在同一提交或 PR 中同步相关的中英文内容。

---

# English

[中文](#中文)

## What this is

`INDEX.html` is an **EXTRACT instruction generator**. Fill in the source variable, the destination variable, positions and the copy count. The page produces parameter checks, a function block diagram, a variable declaration table, a copy-data diagram, a pin reference table and an ST code snippet.

The page is a single self-contained file that works offline. It loads no external script, stylesheet or image (no CDN, no network dependency) and uses only the local system font stack.

## History

This project grew out of an earlier requirement discussion for an ADDM/ADDMX addressing tool. The current page implements an EXTRACT instruction generator, not that ADDM/ADDMX tool. The difference is intentionally kept.

The historical DOCX that records that requirement evolution is **not** part of the current repository snapshot (it is kept locally by the maintainer) and is not an official PLC manual. Historical commits were not rewritten, so these files may still appear in the GitHub commit history.

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
- The element size is derived as source bytes divided by SRC_NELEM. The destination capacity is computed as `floor(destination bytes ÷ element size)`. It does not necessarily equal the destination array's element count.
- `SRC_POS` / `DST_POS` are **zero-based element offsets**, not array declaration indices. Example: in `ARRAY[5..14]`, `SRC_POS = 2` corresponds to index 7.
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

For first use, clone the repository:

```bash
git clone https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER.git
cd M580-EXTRACT-CMD-HELPER
```

Using the application requires no build step: open `INDEX.html` directly.

Development and static checks require Node >= 22. From the project root:

```bash
npm ci
npm run verify
```

`npm run verify` performs static checks and a build only. It runs no browser tests. What each script does (see `package.json`):

| Command | Purpose |
| --- | --- |
| `npm run check` | Runs `scripts/check.cjs`. It asserts HTML structure (doctype, lang, charset, title, closing tags) and compiles all inline scripts with `node:vm` for syntax checking. |
| `npm run build` | Runs `scripts/build.cjs`. It clears `dist/` and copies `INDEX.html` to `dist/index.html` (the publish artifact, do not edit it directly). |
| `npm run serve` | Runs `scripts/serve.cjs`. It serves a local **preview** on `127.0.0.1:4173`. Run `npm run build` first. It listens on the local machine only and is not a test server. |
| `npm run verify` | Runs `npm run check` and then `npm run build`. |

`npm test` is not a publicly defined script.

## Browser automation tests (current state)

The current repository snapshot contains **no** reproducible public automated browser tests. `playwright.config.cjs` and `tests/` are not part of the repository; they are kept locally by the maintainer.

- The maintainer may still run the retained Playwright cases locally as an extra check. They are not public repository content and are not run in CI. Never claim that CI runs or passes browser cases.
- The locally retained smoke cases do not cover page styling, clipboard behavior, real PLC communication, or compilation of the snippet in Control Expert. The static `npm run verify` executes no page behavior.

## CI and publishing

Workflow: `.github/workflows/pages.yml`.

- Triggers: push to `main`, pull requests against `main` and `workflow_dispatch`. **No path filters are configured**, so a docs-only push to `main` also runs checks and the build.
- CI runs on Node 24: `npm ci` → `npm run verify` (that is `npm run check` + `npm run build`). CI does **not** install chromium, does **not** run browser tests and does **not** upload test failure reports.
- After a push or manual run on `main` passes checks, upload `dist/` and deploy Pages. Pull requests run checks and the build without deploying. Pushing a normal task branch does not trigger this workflow.
- Expected site URL: <https://lilixxs.github.io/M580-EXTRACT-CMD-HELPER/>. It depends on the repository Pages configuration. Consult the [Actions](https://github.com/lilixxs/M580-EXTRACT-CMD-HELPER/actions) runs for actual availability.
- The published artifact contains only `dist/index.html`. Repository files do not enter the website. The repository itself is public, so repository files are visible to anyone.

## Verification boundaries and known limits

- The type byte-size table in the page is a **page-level estimate**. It is not a guarantee of memory layout on every PLC platform.
- The generated ST snippet has **not** been compiled or communication-tested in Control Expert or on a real PLC. PLC conclusions must come from official documentation and the actual environment.
- `npm run verify` covers only HTML structure, inline JavaScript syntax and building the publish artifact. It does not cover page behavior.
- No lint or typecheck configuration exists.

## Repository layout

| Path | Description |
| --- | --- |
| [`INDEX.html`](INDEX.html) | The only application entry point and all source code (HTML/CSS/vanilla JS, self-contained inline) |
| [`package.json`](package.json) | npm scripts, Node version requirement (>= 22) and the MIT license declaration |
| [`scripts/check.cjs`](scripts/check.cjs) | HTML structure and inline JS syntax static checks |
| [`scripts/build.cjs`](scripts/build.cjs) | Produces the publish artifact `dist/index.html` |
| [`scripts/serve.cjs`](scripts/serve.cjs) | Preview server listening on port 4173, local host only |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | CI check and Pages publishing workflow |
| [`docs/images/`](docs/images/) | Documentation screenshots for this README |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution workflow, shared modification constraints and documentation sync rules |
| [`LICENSE`](LICENSE) | Full MIT license text |
| [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | Third-party content and trademark notices |

## Copyright and license

- This repository is published under the [MIT License](LICENSE), copyright (c) 2026 lilixxs.
- MIT covers the code, text and documentation screenshots in this repository that the maintainer owns or is authorized to license, including the base geometry of the in-page SVG buttons.
- `INDEX.html` retains the full MIT copyright and permission text. The built single-file page retains the same notice.
- MIT does **not** cover third-party manuals and their copyrights (see the Schneider Electric terms of use on its official website), third-party trademarks, or materials excluded from the current snapshot in historical commits (such as the historical DOCX). See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- The maintainer's ownership confirmation is the basis for publishing this repository under MIT. It is not an independent audit proving the provenance of every piece of code. No zero-risk promise is made.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for shared modification constraints, branch and change boundaries, verification requirements, sync rules for both README languages and screenshots, and PR description requirements.

This file and the contribution guide keep the full Chinese text first, then the full English text. Update corresponding content in both languages in the same commit or PR.
