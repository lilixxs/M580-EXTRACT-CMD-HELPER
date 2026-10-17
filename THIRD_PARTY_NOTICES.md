# 第三方声明 / Third-Party Notices

> 语言 / Language：[中文](#中文) · [English](#english)

---

# 中文

本文件说明本仓库与第三方内容的关系：当前捆绑状态、技术参考文档、商标、已排除的历史材料、权属依据以及未来引入第三方材料时的义务。本仓库自身以 [MIT 许可](LICENSE) 发布，版权 (c) 2026 lilixxs。

## 当前状态：未捆绑第三方运行时

当前版本的 `INDEX.html` 是单文件、离线自包含页面：

- 不加载任何外部脚本、样式表或图片（无 CDN、无网络依赖）。
- 未捆绑 Tailwind 或任何 CSS 框架；早期版本曾使用 Tailwind CDN，当前版本不再请求任何外部资源。
- 字体仅使用本机字体栈，仓库不随附任何字体文件。
- 维护者确认页面内 SVG 按钮为原创，或已获可按 MIT 再许可的授权。本声明不授予未获授权的第三方图标集权利。
- 构建与检查脚本（`scripts/`）仅使用 Node 内置模块；浏览器测试工具不是发布依赖。

当前快照未识别到单独捆绑的第三方运行时。若后续发现来源遗漏，须补充来源及其要求保留的许可声明。

## 技术参考文档

页面生成的 ST 程序段以公开的产品文档为技术参考，包括文档编号 33003679（09/2020）第 44 章。

- 该文档**不随仓库分发**，其版权与相关权利归原权利人（含 Schneider Electric）所有，使用须遵守其官网使用条款（<https://www.se.com/us/en/about-us/legal/terms-of-use/>）。
- 本项目的 MIT 许可**不授予**复制、再发布或修改该文档的任何权利。
- 本项目不主张该等文档中的技术事实本身受本项目许可约束；引用仅为技术参考，不对文档本身作任何权利主张。

## 商标

Schneider Electric、EcoStruxure、Control Expert 等名称是其各自权利人的商标。

- 本项目是独立开发的辅助工具，与 Schneider Electric 无官方认可、隶属或赞助关系。
- 商标仅用于指明本工具所针对的产品与软件环境，不表示归属。
- 本项目文档不对第三方商标的注册状态逐一核实，也不以商标标注作超出事实的主张。

## 历史与本地保留材料

- 历史需求 DOCX（`ADDMX地址生成解析工具.docx`）、本地测试文件、内部规则文档等不纳入当前仓库快照，仅由维护者本地保留。
- 历史提交未重写，这些文件在 GitHub 提交历史中仍可能存在；本项目不宣称其已从远端历史中消失。
- 本项目的 MIT 许可不覆盖这些材料的权利。

## 权属依据

- 维护者确认：本仓库的代码、文案与图标为原创，或已获得可按 MIT 再许可的授权。
- 该确认是本仓库按 MIT 发布的权属依据，**不是**对全部代码来源的独立审计证明。
- 本项目不作零风险承诺；PLC 相关结论须以官方文档与实际环境为准（见 README 的验证边界）。

## 未来引入第三方材料的义务

今后若引入任何第三方代码、字体、图片或其他受保护材料，必须同时：

1. 确认其许可证允许预期用途及组合分发。不兼容时，先取得权利人的有效授权，再获维护者确认。
2. 保留其原始许可证与版权/notice 文本，不删改。
3. 在本文件登记来源、用途与许可证。

---

# English

[中文](#中文)

This file describes how this repository relates to third-party content: current bundling status, technical reference documents, trademarks, excluded historical materials, the basis of ownership, and obligations when third-party materials are introduced in the future. This repository itself is published under the [MIT License](LICENSE), copyright (c) 2026 lilixxs.

## Current state: no bundled third-party runtime

The current `INDEX.html` is a single self-contained offline page:

- It loads no external script, stylesheet or image (no CDN, no network dependency).
- Tailwind and any CSS framework are not bundled. An earlier version used the Tailwind CDN; the current version requests no external resource at all.
- Fonts come from the local system font stack only; no font file is shipped with the repository.
- The maintainer confirms that the in-page SVG buttons are original or authorized for relicensing under MIT. This notice grants no unauthorized third-party icon rights.
- The build and check scripts (`scripts/`) use Node built-in modules only. Browser testing tools are not release dependencies.

No separately bundled third-party runtime was identified in this snapshot. If an omitted source is found, record it and include its required license notices.

## Technical reference documents

The generated ST snippet takes public product documents as technical references, including document 33003679 (09/2020), Chapter 44.

- Those documents are **not** distributed with the repository. Their copyrights and related rights remain with their respective owners (including Schneider Electric), and their use is governed by the terms of use on the official website (<https://www.se.com/us/en/about-us/legal/terms-of-use/>).
- This project's MIT License grants **no** right to copy, redistribute or modify those documents.
- This project makes no claim that technical facts in such documents are themselves governed by this project's license. The reference is purely technical; no rights in the documents themselves are asserted.

## Trademarks

Schneider Electric, EcoStruxure, Control Expert and similar names are trademarks of their respective owners.

- This project is an independently developed helper tool with no official endorsement, affiliation or sponsorship by Schneider Electric.
- Trademarks are used solely to indicate the products and software environments this tool targets, implying no ownership.
- This project does not verify the registration status of third-party trademarks case by case and makes no claims about them beyond the facts.

## Historical and locally kept materials

- The historical requirement DOCX (`ADDMX地址生成解析工具.docx`), local test files, internal rule documents and similar materials are not part of the current repository snapshot; they are kept locally by the maintainer.
- Historical commits were not rewritten, so these files may still exist in the GitHub commit history. This project does not claim they have vanished from the remote history.
- This project's MIT License does not cover the rights in these materials.

## Basis of ownership

- The maintainer confirms that the code, text and icons in this repository are original, or have been licensed under terms that allow relicensing under MIT.
- That confirmation is the basis for publishing this repository under MIT. It is **not** an independent audit proving the provenance of every piece of code.
- No zero-risk promise is made. PLC-related conclusions must come from official documentation and the actual environment (see the verification boundaries in the README).

## Obligations when introducing third-party materials

If any third-party code, font, image or other protected material is introduced in the future, all of the following must be done at the same time:

1. Confirm that its license permits the intended use and combined distribution. If incompatible, obtain valid permission from the rights holder, then maintainer approval.
2. Keep its original license and copyright/notice text unchanged.
3. Register its source, purpose and license in this file.
