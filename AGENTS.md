# 项目指引

## 先区分目标与现状
- `ADDMX地址生成解析工具.docx` 记录 ADDM/ADDMX 工具的需求演变。修改寻址规则、选项联动、PLC 程序段或拓扑图前，读取相关对话及后续修订。
- 当前唯一应用入口是 `INDEX.html`，但其实现是 **EXTRACT 指令生成工具**，不是 ADDM/ADDMX 工具。保留此差异，直到用户明确要求恢复或改造页面。
- DOCX 是历史对话，不是 PLC 官方手册。以用户后续明确修订识别目标需求。遇到矛盾或缺少图片证据时，标记待确认项。
- 文中的版本号、部署记录和“测试通过”属于历史陈述。DOCX 中提及的历史版本快照不在当前目录中。
- 生成 PLC 程序段前，核对对应 CPU 和 Control Expert 版本的官方接口。重点核对功能码、GEST/RECP 管脚及 DATA_EXCH 参数。不要把历史回复中的实现当成协议事实。

## ADDM/ADDMX 目标的易错点
- 目标界面采用“配置 → 地址生成”和“地址 → 配置解析”双模式。旧版 Excalidraw 画布不是后续需求的基础。目标适配平板和电脑。
- CPU 目标仅含 M340/M580。后续需求禁用 M580 的 CPU 串口和 CAN 口，禁用 M340 的远程 IO，并删除远程 IO 网口模块选项。
- 处理远程串口地址时，分别检查 JS 源码转义、页面实际字符串及解析器兼容格式。DOCX 中的单、双反斜杠示例存在冲突。
- 目标 SVG 等比铺满区块宽度，参数映射表位于图下。两行链路与机架说明位于 SVG 外。生成页与解析页须同步处理。
- 当前页面已采用 `claude_code_light_ui_style_guide.md` 的浅色、直角、陶土橙风格。修改界面时保持该风格，除非用户明确要求更换。

## 当前页面的修改边界
- HTML、CSS 和原生 JS 均内置于 `INDEX.html`。页面不加载 Tailwind CDN 或其他外部资源，可离线打开。
- 应用源码只编辑 `INDEX.html`。`npm run build` 清空 `dist/` 并复制生成 `dist/index.html`。不要反向编辑发布产物。
- CI 工作流 `pages.yml` 依次执行 `npm ci`、`npx playwright install --with-deps chromium`、`npm run verify`，测试对象是当前 EXTRACT 页面，不是 ADDM/ADDMX 需求。push 到 `main` 且检查通过后才上传 `dist` 并部署 Pages；PR 只跑检查，不部署。
- 输入事件调用 `render()`。`buildModel()` 汇总模型，随后各 `render*()` 更新界面，`genST()` 生成 ST。修改计算规则时，同步检查校验、功能块图、声明表、内存示意图和引脚表。
- EXTRACT 的元素大小由源字节数除以 SRC_NELEM 得出。目标容量由目标字节数除以该元素大小得出，不一定等于目标数组元素数。
- SRC_POS/DST_POS 是从 0 开始的元素偏移，不是数组声明下标。非整数文本当前按运行时表达式处理。修改校验时保留这一区别。
- `TYPE_SIZES` 是页面估算表，不是所有 PLC 平台的内存布局保证。

## 验证
- 浏览器直接打开 `INDEX.html` 可快速查看外观与交互。完整验证需要 Node >= 22，在项目根目录执行：

```bash
npm ci
npx playwright install chromium
npm run verify
```

- `npm run verify` 先执行 HTML 结构与内联 JS 语法检查，再运行 `npm test`。后者自动重建发布产物，并启动仅监听本机的 4173 端口测试服务器。
- 单项命令为 `npm run check`、`npm run build`、`npm test`。聚焦用例可用 `npm test -- --grep "SRC_POS 越界"`。
- Chromium 回归在 `dist/index.html` 上执行。现有冒烟用例覆盖功能与 ST 输出，不覆盖样式、剪贴板或 PLC 通讯。用例保留了旧 Tailwind CDN 的拦截规则；当前页面不请求该资源。
- 当前 EXTRACT 默认示例：源为 10 个 WORD，目标为 20 个 WORD，SRC_POS=2、DST_POS=5、CPY_NELEM=3。预期元素大小为 2 字节，目标容量为 20，状态为“参数有效 · 就绪”。
- 修改 EXTRACT 模型后，检查 SRC_NELEM 不整除、源位置越界、目标截断、复制数为 0、变量表达式及重置。ST 输入使用 `:=`，输出 DST/ERR 使用 `=>`。
- 修改布局或复制逻辑后，另做浏览器人工检查。PLC 程序段是否可编译、可通讯，须在 Control Expert 或实际 PLC 环境验证。

## 贡献与文档同步
- 修改前读取 `CONTRIBUTING.md`。按其中的文档同步规则，在同一提交或同一 PR 中维护受影响的中英文说明、贡献流程和界面截图。
- 修改项目事实或约束时，同步更新本文件。说明截图不是视觉测试基线。
- 用户明确跳过测试时，记录未运行及原因。保留现有 CI 配置，不声称测试通过。
