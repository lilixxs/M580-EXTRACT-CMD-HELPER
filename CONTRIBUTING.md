# 贡献指南 / Contributing Guide

> 语言 / Language：[中文](#中文) · [English](#english)

---

# 中文

## 适用范围

本文件是本仓库公开协作规则的依据，适用于对本仓库的任何修改：应用源码（`INDEX.html`）、文档（`README.md`、`LICENSE`、`THIRD_PARTY_NOTICES.md`、本文件）、截图（`docs/images/`）、脚本（`scripts/`）、CI 配置。

## 公共修改约束

- HTML、CSS、原生 JS 全部内置于 `INDEX.html`，页面离线自包含，不加载外部脚本、样式或图片（无 CDN、无网络依赖），字体仅用本机字体栈。保持这一性质，不引入外部运行时依赖。
- 应用源码只编辑 `INDEX.html`。`dist/index.html` 是 `npm run build` 的产物，只通过脚本生成，不手工编辑。
- 修改计算规则时，同步检查参数校验、功能块图、声明表、复制数据示意图与引脚表。
- 界面保持浅色、直角、陶土橙风格，除非用户明确要求更换。
- 确需引入第三方代码、字体、图片等材料时：先获用户确认，在 `THIRD_PARTY_NOTICES.md` 登记来源与许可证，并保留其原始许可证与版权声明文本。

## 分支与改动边界

- 基于最新 `main` 创建分支。分支名简短描述改动，例如 `docs/readme-contributing`。
- 最小范围修改：只改完成任务所必需的文件。不顺手重构、不改无关格式、不动未列入白名单的文件。
- 不修改的常见对象：CI 工作流、`package-lock.json`——除非任务明确要求。
- `playwright.config.cjs`、`tests/`、`ADDMX地址生成解析工具.docx`、`AGENTS.md`、`claude_code_light_ui_style_guide.md` 等为维护者本地保留、未纳入 Git 跟踪的材料。除用户明确要求外，不要把它们加回仓库。

## 验证

- 默认建议：在项目根目录执行 `npm run verify`（需 Node >= 22；首次需 `npm ci`）。它依次运行 `npm run check`（HTML 结构与内联 JS 语法静态检查）和 `npm run build`（生成 `dist/index.html`）。静态检查不执行 DOM 或 PLC 逻辑。
- 需要本地预览时：先 `npm run build`，再 `npm run serve`（仅监听 `127.0.0.1:4173` 的预览服务器），浏览器访问该地址。也可直接打开 `INDEX.html`。
- 维护者本地若仍保留 Playwright 配置与冒烟用例，可作为额外检查运行；它们不属于仓库公开内容，也不在 CI 中运行。交付说明不得把静态检查称为浏览器回归，不得声称 CI 运行或通过了浏览器用例。
- PLC 程序段能否编译、能否通讯，只能在 Control Expert 或实际 PLC 环境确认，本地命令不覆盖这一项。
- 用户明确跳过测试时：可以跳过，但必须在交付说明中记录「未运行及原因」。不写「测试通过」，不把跳过当成通过。
- 不擅自修改 CI 配置来绕过检查。CI（`.github/workflows/pages.yml`）保持原样：`npm ci` → `npm run verify`，不安装浏览器、不运行浏览器测试；PR 只检查和构建，push 到 `main` 通过后才部署。

## 浏览器手工检查

直接打开 `INDEX.html`。每项检查前先点击“重置为示例”。记录实际结果，不把下表预期当作已通过的证据。

| 操作 | 预期结果 |
| --- | --- |
| 保持默认值 | 状态为“参数有效 · 就绪”。元素大小为 2 字节，目标容量为 20。ST 输入使用 `:=`，DST/ERR 使用 `=>`。 |
| SRC_NELEM 选择“自定义”，输入 3 | 显示 ERR=-2。不整除校验失败。另有 ERR=-3 源侧复制越界提示。 |
| SRC_POS 输入 10 | 显示 ERR=-3。位置和复制范围均超出源元素数。 |
| DST_POS 输入 19 | 显示 ERR=2。只能复制 1 个元素。 |
| CPY_NELEM 输入 0 | 显示 ERR=1 警告。 |
| SRC_POS 输入 `iIdx`，CPY_NELEM 输入 `iCount` | 显示动态表达式提示。ST 保留两个表达式。 |
| 修改参数后点击“重置为示例” | 恢复默认值、默认 ST 与有效状态。 |
| 点击变量名与 ST 的复制按钮 | 检查剪贴板内容与按钮反馈。剪贴板 API 不可用时，另检查回退复制。 |
| 分别在桌面与窄屏查看 | 检查字段、按钮、表格及功能块图。记录溢出或遮挡问题。 |

## 文档与截图同步

以下改动必须在**同一提交或同一 PR** 中一起更新，不留到后续补：

| 你改了什么 | 必须同步什么 |
| --- | --- |
| 功能、用法、命令、发布流程 | [`README.md`](README.md) 的**中文段和英文段**（两段都要改，内容对应） |
| 贡献流程或本文件规则 | 本文件的中文段和英文段 |
| 界面布局或界面文案 | `docs/images/` 中**受影响**的截图及对应图注（仅界面变化才更新；与界面无关的改动不重拍截图） |
| 许可证、第三方内容或商标说明 | [`LICENSE`](LICENSE) / [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)，以及 README 两语言中的对应描述 |

补充规则：

- 中文与英文内容必须在同一提交或同一 PR 中同步修改；不允许只更新一种语言。
- 输入文案（页面上的文字）变化时，README 中英文说明中的对应描述要同步，避免某一语言过时。
- 截图不是每次改动都要重拍：只有界面变化影响到某张截图所展示的内容时，才更新那张截图。
- 说明截图是文档材料，**不是**视觉/像素测试基线；不要把「截图必须逐像素一致」写成要求。

## 截图规程

- 存放路径与命名：`docs/images/<场景>-<平台>.png`。现有三张：
  - `configuration-desktop.png`：默认页页头与参数配置区，桌面视口 1440×1000。
  - `output-desktop.png`：默认页桌面输出区域（功能块图、声明、ST、引脚表）的元素截图，视口 1440×1000，PNG 尺寸随内容而定。
  - `configuration-mobile.png`：默认页页头与参数配置区，移动视口 360×900。
- 重拍时记录：场景、视口尺寸、所依据的 UI 提交号，写入 README 图注。
- 用默认示例拍摄，不填入真实项目变量名、地址、凭据或其他敏感数据；截图前检查画面内无敏感内容。

## 提交、推送与部署授权

- 默认规则：**未获用户明确授权，不执行 commit、push，不触发部署。** 完成文件修改后停下，汇报改动清单，由用户决定提交。
- 用户明确授权直接推送时，按该次授权执行。授权只对当次任务有效，不延续到其他任务。
- 推送到 `main` 会触发 CI 部署流程（pages.yml 无路径过滤）。推送前确认这是用户预期。

## PR 描述要求

按仓库习惯的 PR 描述应包含：

1. 变更摘要：改了哪些文件、为什么。
2. 验证情况：运行了哪些命令、结果如何；若跳过测试，写明跳过的命令与理由。
3. 文档与截图同步项：本次更新了 README 哪些段、是否涉及截图及原因。
4. PLC 边界：生成的 ST 程序段未经 Control Expert/实际 PLC 验证这一事实是否受影响。
5. 未解决事项与待确认项。

## 许可证

- 本仓库以 MIT 许可发布，版权 (c) 2026 lilixxs，全文见 [`LICENSE`](LICENSE)。
- 向本仓库提交贡献，即表示同意以 MIT 许可授权该贡献。
- 第三方内容与商标说明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)：MIT 不覆盖第三方手册、商标及已排除的历史材料。
- 不要在文档或代码中虚构额外的许可证声明；新增第三方代码时必须保留其原始许可证与 notice。

---

# English

[中文](#中文)

## Scope

This guide is the authoritative public collaboration rule for this repository. It applies to any change: application source (`INDEX.html`), documentation (`README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, this file), screenshots (`docs/images/`), scripts (`scripts/`), CI configuration.

## Shared modification constraints

- HTML, CSS and vanilla JS are all inline in `INDEX.html`. The page is self-contained and offline, loading no external script, stylesheet or image (no CDN, no network dependency), using only the local system font stack. Keep it that way. Do not add external runtime dependencies.
- Edit only `INDEX.html` as application source. `dist/index.html` is produced by `npm run build`. Regenerate it through the script, never by hand.
- When changing calculation rules, check the parameter checks, function block diagram, declaration table, copy-data diagram and pin table together.
- Keep the UI light, square-cornered and clay orange unless the user explicitly asks otherwise.
- If third-party code, fonts, images or other materials must be introduced: obtain the user's confirmation first, register the source and license in `THIRD_PARTY_NOTICES.md`, and keep the original license and copyright notice text.

## Branches and change boundaries

- Create a branch from the latest `main`. Use a short descriptive branch name, e.g. `docs/readme-contributing`.
- Minimal scope: change only the files required to complete the task. No drive-by refactors, no unrelated formatting, no files outside the whitelist.
- Common objects not to touch unless the task explicitly requires it: CI workflows, `package-lock.json`.
- `playwright.config.cjs`, `tests/`, `ADDMX地址生成解析工具.docx`, `AGENTS.md`, `claude_code_light_ui_style_guide.md` and similar materials are kept locally by the maintainer and are not under Git tracking. Do not add them back to the repository unless the user explicitly asks.

## Verification

- Default recommendation: run `npm run verify` in the project root (Node >= 22; the first time also `npm ci`). It runs `npm run check` (HTML structure and inline JS syntax static checks) and then `npm run build` (producing `dist/index.html`). The static checks execute no DOM or PLC logic.
- For a local preview: run `npm run build` first, then `npm run serve` (a preview server listening on `127.0.0.1:4173` only) and open that address in a browser. Opening `INDEX.html` directly also works.
- If the maintainer still has the Playwright config and smoke cases locally, they may be run as an extra check. They are not public repository content and are not run in CI. Delivery notes must not call static checks a browser regression, and must never claim that CI runs or passes browser cases.
- Whether a generated ST snippet compiles or communicates can only be confirmed in Control Expert or on a real PLC. Local commands do not cover this.
- When the user explicitly skips tests: skipping is allowed, but the delivery notes must record "not run and why". Never claim "tests passed". Do not treat a skip as a pass.
- Do not modify CI configuration to bypass checks. CI (`.github/workflows/pages.yml`) stays as is: `npm ci` → `npm run verify`, no browser installation, no browser tests. PRs run checks and the build only. Pushes to `main` deploy only after checks pass.

## Manual browser checks

Open `INDEX.html` directly. Click "重置为示例" before each check. Record actual results. The expected results below are not evidence of a completed check.

| Action | Expected result |
| --- | --- |
| Keep the defaults | The status reads "参数有效 · 就绪". Element size is 2 bytes. Destination capacity is 20. ST inputs use `:=`. DST/ERR use `=>`. |
| Select custom SRC_NELEM and enter 3 | ERR=-2 appears for non-divisible element sizing. An ERR=-3 source copy-range message also appears. |
| Enter 10 in SRC_POS | ERR=-3 appears. Both the position and the copy range exceed the source element count. |
| Enter 19 in DST_POS | ERR=2 appears. Only 1 element can be copied. |
| Enter 0 in CPY_NELEM | An ERR=1 warning appears. |
| Enter `iIdx` in SRC_POS and `iCount` in CPY_NELEM | Dynamic-expression messages appear. ST retains both expressions. |
| Change parameters, then click "重置为示例" | Default values, default ST and valid status return. |
| Click the variable-name and ST copy buttons | Check the clipboard content and button feedback. Separately check the copy fallback when the clipboard API is unavailable. |
| View at desktop and narrow widths | Check fields, buttons, tables and the function block diagram. Record overflow or overlap problems. |

## Documentation and screenshot sync

The following changes must be updated **in the same commit or the same PR**, not deferred:

| You changed | Must also update |
| --- | --- |
| Features, usage, commands, publishing flow | Both the **Chinese and English sections** of [`README.md`](README.md), with corresponding content in both |
| Contribution flow or rules in this guide | Both the Chinese and English sections of this guide |
| UI layout or UI text | The **affected** screenshots in `docs/images/` and their captions (only for UI changes, no re-shoot for unrelated changes) |
| License, third-party content or trademark statements | [`LICENSE`](LICENSE) / [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), and the corresponding descriptions in both README languages |

Additional rules:

- Chinese and English content must be changed in the same commit or the same PR. Updating only one language is not acceptable.
- When on-page text changes, sync the corresponding descriptions in both README languages so neither goes stale.
- Screenshots do not need re-shooting on every change. Only re-shoot when a UI change affects what a screenshot shows.
- Screenshots are documentation material, **not** a visual/pixel test baseline. Never write "screenshots must match pixel-perfectly" into requirements.

## Screenshot conventions

- Path and naming: `docs/images/<scenario>-<platform>.png`. Current three:
  - `configuration-desktop.png`: default page header and parameter configuration area, desktop viewport 1440×1000.
  - `output-desktop.png`: the desktop output area of the default page (FBD, declarations, ST, pin table), an element screenshot at viewport 1440×1000. The PNG size follows the content.
  - `configuration-mobile.png`: default page header and parameter configuration area, mobile viewport 360×900.
- When re-shooting, record the scenario, viewport size and the UI commit relied upon. Put them in the README caption.
- Shoot with the default example. Do not fill in real project variable names, addresses, credentials or other sensitive data. Check the image for sensitive content before committing.

## Commit, push and deployment authorization

- Default rule: **without explicit user authorization, do not commit, push, or trigger deployment.** Finish the file changes, report the change list, and let the user decide.
- When the user explicitly authorizes a direct push, execute under that authorization. It applies only to that task and does not carry over to other tasks.
- Pushing to `main` triggers the CI deployment flow (pages.yml has no path filters). Confirm this is expected before pushing.

## PR description requirements

A PR description in this repository should include:

1. Summary: which files changed and why.
2. Verification: which commands were run and their results. If tests were skipped, name the skipped commands and the reason.
3. Documentation and screenshot sync: which README sections were updated, whether screenshots were involved and why.
4. PLC boundary: whether the fact that the generated ST snippet is unverified in Control Expert / on a real PLC is affected.
5. Open issues and items to confirm.

## License

- This repository is published under the MIT License, copyright (c) 2026 lilixxs. Full text: [`LICENSE`](LICENSE).
- Contributing to this repository means licensing your contribution under MIT.
- Third-party content and trademark notices: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). MIT does not cover third-party manuals, trademarks or the excluded historical materials.
- Do not invent extra license notices in docs or code. When adding third-party code, keep its original license and notice.
