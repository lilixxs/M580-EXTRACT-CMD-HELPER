# 贡献指南 / Contributing Guide

> 语言 / Language：[中文](#中文) · [English](#english)

---

# 中文

## 适用范围

本文件适用于对本仓库的任何修改：应用源码（`INDEX.html`）、文档（`README.md`、`AGENTS.md`、本文件）、截图（`docs/images/`）、测试与脚本、CI 配置。

## 开始之前：先读 AGENTS.md

修改前读取 [`AGENTS.md`](AGENTS.md)。其中记录项目现状与修改约束，例如：当前页面是 EXTRACT 指令生成工具而非 ADDM/ADDMX 工具、应用源只在 `INDEX.html`、发布产物 `dist/` 不可反向编辑。

## 分支与改动边界

- 基于最新 `main` 创建分支。分支名简短描述改动，例如 `docs/readme-contributing`。
- 最小范围修改：只改完成任务所必需的文件。不顺手重构、不改无关格式、不动未列入白名单的文件。
- 不修改的常见对象：`package-lock.json`、CI 工作流、既有测试断言——除非任务明确要求。

## 修改应用：只编辑 INDEX.html

- HTML、CSS、原生 JS 全部内置于 `INDEX.html`，页面离线自包含，不加载外部资源。保持这一性质，不引入 CDN 或网络依赖。
- 应用源码只编辑 `INDEX.html`。`dist/index.html` 是 `npm run build` 的产物，只通过脚本生成，不手工编辑。
- 修改计算规则时，同步检查参数校验、功能块图、声明表、复制数据示意图与引脚表。
- 保持界面风格与 `claude_code_light_ui_style_guide.md` 一致（浅色、直角、陶土橙），除非用户明确要求更换。

## 验证

- 默认建议：在项目根目录执行 `npm run verify`（需 Node >= 22；首次需 `npm ci` 与 `npx playwright install chromium`）。PLC 程序段能否编译、能否通讯，只能在 Control Expert 或实际 PLC 环境确认，本地命令不覆盖这一项。
- 需要功能/布局/视觉检测时使用 `npm run test:local`（细节与退出码见 README「本地检测」节）。它不替代 `npm run verify`，CI 仍只跑 `npm run verify`；`tests/local/*.local.cjs` 不会被 CI 收集。
- 用户明确跳过测试时：可以跳过，但必须在交付说明中记录「未运行及原因」。不写「测试通过」，不把跳过当成通过。
- 不擅自修改 CI 配置来绕过检查。CI（`.github/workflows/pages.yml`）保持原样：PR 只跑检查，push 到 `main` 通过后才部署。

## 文档与截图同步

以下改动必须在**同一提交或同一 PR** 中一起更新，不留到后续补：

| 你改了什么 | 必须同步什么 |
| --- | --- |
| 功能、用法、命令、发布流程 | [`README.md`](README.md) 的**中文段和英文段**（两段都要改，内容对应） |
| 贡献流程或本文件规则 | 本文件的中文段和英文段 |
| 界面布局或界面文案 | `docs/images/` 中**受影响**的截图及对应图注（仅界面变化才更新；与界面无关的改动不重拍截图） |
| 项目事实或约束 | [`AGENTS.md`](AGENTS.md) |

补充规则：

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
- `docs/images/` 下的图片**只是 README 说明图**，与 `tests/local/baselines/win32/` 的视觉测试基线是两套独立材料：说明图随界面更新重拍，基线只能按下一节的基线规程处理，两者不可互相替代。

## 视觉基线规程

- 基线路径 `tests/local/baselines/win32/<project>/<case>.png`，并在 `tests/local/baselines/win32/manifest.json` 记录审批信息（`approvedBy`、`approvedAt`、`approvalNote`）。
- 更新基线必须先由用户明确批准候选图，再写入基线目录；基线 PNG 与 manifest 的变更在**同一个 PR** 中提交并审阅 diff。不自行批准、不先改后补。
- 禁止为消除红灯直接改基线、裁掉核心区域或放宽比较阈值。基线只在同一 OS、字体、浏览器环境下有效；环境变化后须重新生成候选并再次经用户审批。
- 基线更新不改动其他既有流程：`npm run verify` 的 9 项冒烟、CI 与 Pages 配置保持原样。

## 提交、推送与部署授权

- 默认规则：**未获用户明确授权，不执行 commit、push，不触发部署。** 完成文件修改后停下，汇报改动清单，由用户决定提交。
- 用户明确授权直接合并和推送时，按该次授权执行。授权只对当次任务有效，不延续到其他任务。
- 推送到 `main` 会触发 CI 部署流程（pages.yml 无路径过滤）。推送前确认这是用户预期。

## PR 描述要求

按仓库习惯的 PR 描述应包含：

1. 变更摘要：改了哪些文件、为什么。
2. 验证情况：运行了哪些命令、结果如何；若跳过测试，写明跳过的命令与理由。
3. 文档与截图同步项：本次更新了 README 哪些段、是否涉及截图及原因。
4. PLC 边界：生成的 ST 程序段未经 Control Expert/实际 PLC 验证这一事实是否受影响。
5. 未解决事项与待确认项。

## 许可证

仓库当前没有 `LICENSE` 文件。贡献前如需明确授权条款，向维护者确认；不要在文档或代码中虚构许可证声明。

---

# English

[中文](#中文)

## Scope

This guide applies to any change in this repository: application source (`INDEX.html`), documentation (`README.md`, `AGENTS.md`, this file), screenshots (`docs/images/`), tests and scripts, CI configuration.

## Before you start: read AGENTS.md

Read [`AGENTS.md`](AGENTS.md) before modifying anything. It records current project facts and constraints, such as: the page is an EXTRACT instruction generator, not an ADDM/ADDMX tool. Application source lives only in `INDEX.html`. The publish artifact `dist/` must not be edited in reverse.

## Branches and change boundaries

- Create a branch from the latest `main`. Use a short descriptive branch name, e.g. `docs/readme-contributing`.
- Minimal scope: change only the files required to complete the task. No drive-by refactors, no unrelated formatting, no files outside the whitelist.
- Common objects not to touch unless the task explicitly requires it: `package-lock.json`, CI workflows, existing test assertions.

## Changing the application: edit INDEX.html only

- HTML, CSS and vanilla JS are all inline in `INDEX.html`. The page is self-contained and offline, loading no external resources. Keep it that way. Do not add CDN or network dependencies.
- Edit only `INDEX.html` as application source. `dist/index.html` is produced by `npm run build`. Regenerate it through the script, never by hand.
- When changing calculation rules, check the parameter checks, function block diagram, declaration table, copy-data diagram and pin table together.
- Keep the UI consistent with `claude_code_light_ui_style_guide.md` (light, square corners, clay orange) unless the user explicitly asks otherwise.

## Verification

- Default recommendation: run `npm run verify` in the project root. It needs Node >= 22. The first time also run `npm ci` and `npx playwright install chromium`. Whether a generated ST snippet compiles or communicates can only be confirmed in Control Expert or on a real PLC. Local commands do not cover this.
- For functional, layout or visual detection use `npm run test:local` (details and exit codes are in the README "Local check" section). It does not replace `npm run verify`. CI still runs only `npm run verify`, and `tests/local/*.local.cjs` is never collected by CI.
- When the user explicitly skips tests: skipping is allowed, but the delivery notes must record "not run and why". Never claim "tests passed". Do not treat a skip as a pass.
- Do not modify CI configuration to bypass checks. CI (`.github/workflows/pages.yml`) stays as is. PRs run checks only. Pushes to `main` deploy only after checks pass.

## Documentation and screenshot sync

The following changes must be updated **in the same commit or the same PR**, not deferred:

| You changed | Must also update |
| --- | --- |
| Features, usage, commands, publishing flow | Both the **Chinese and English sections** of [`README.md`](README.md), with corresponding content in both |
| Contribution flow or rules in this guide | Both the Chinese and English sections of this guide |
| UI layout or UI text | The **affected** screenshots in `docs/images/` and their captions (only for UI changes, no re-shoot for unrelated changes) |
| Project facts or constraints | [`AGENTS.md`](AGENTS.md) |

Additional rules:

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
- Images under `docs/images/` are **README illustrations only**. They are a separate material from the visual test baselines in `tests/local/baselines/win32/`. Illustrations are re-shot when the UI changes; baselines follow the rules in the next section. Neither replaces the other.

## Visual baseline conventions

- Baseline paths are `tests/local/baselines/win32/<project>/<case>.png`, with the approval record in `tests/local/baselines/win32/manifest.json` (`approvedBy`, `approvedAt`, `approvalNote`).
- A baseline may only be updated after the user explicitly approves the candidate images; then write them into the baseline directory. Baseline PNGs and the manifest change go into the **same PR** and are reviewed as a diff. No self-approval, no after-the-fact justification.
- Never edit a baseline to silence a red run, crop away the core area, or relax the comparison tolerance. A baseline is valid only within the same OS, font and browser environment. After an environment change, regenerate candidates and get a fresh user approval.
- Baseline updates do not change other existing flows: the 9 smoke tests of `npm run verify`, CI and the Pages configuration stay as they are.

## Commit, push and deployment authorization

- Default rule: **without explicit user authorization, do not commit, push, or trigger deployment.** Finish the file changes, report the change list, and let the user decide.
- When the user explicitly authorizes a direct merge and push, execute under that authorization. It applies only to that task and does not carry over to other tasks.
- Pushing to `main` triggers the CI deployment flow (pages.yml has no path filters). Confirm this is expected before pushing.

## PR description requirements

A PR description in this repository should include:

1. Summary: which files changed and why.
2. Verification: which commands were run and their results. If tests were skipped, name the skipped commands and the reason.
3. Documentation and screenshot sync: which README sections were updated, whether screenshots were involved and why.
4. PLC boundary: whether the fact that the generated ST snippet is unverified in Control Expert / on a real PLC is affected.
5. Open issues and items to confirm.

## License

The repository currently has no `LICENSE` file. Confirm licensing terms with the maintainer if needed before contributing. Do not invent license notices in docs or code.
