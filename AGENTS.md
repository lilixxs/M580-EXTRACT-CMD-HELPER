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
- `claude_code_light_ui_style_guide.md` 描述直角、陶土橙风格，与当前 HTML 的圆角、stone/sky 风格不同。仅在任务要求应用该指南时切换样式。

## 当前页面的修改边界
- HTML、CSS 和原生 JS 均位于 `INDEX.html`。页面从 Tailwind CDN 加载样式，完整外观依赖网络。当前没有包管理、构建、lint、typecheck、测试或 CI 配置。
- 输入事件调用 `render()`。`buildModel()` 汇总模型，随后各 `render*()` 更新界面，`genST()` 生成 ST。修改计算规则时，同步检查校验、功能块图、声明表、内存示意图和引脚表。
- EXTRACT 的元素大小由源字节数除以 SRC_NELEM 得出。目标容量由目标字节数除以该元素大小得出，不一定等于目标数组元素数。
- SRC_POS/DST_POS 是从 0 开始的元素偏移，不是数组声明下标。非整数文本当前按运行时表达式处理。修改校验时保留这一区别。
- `TYPE_SIZES` 是页面估算表，不是所有 PLC 平台的内存布局保证。

## 验证
- 在浏览器中直接打开 `INDEX.html`。无需安装依赖或运行构建。
- 在项目根目录用 PowerShell 执行以下检查。它只检查内联 JS 语法，不执行 DOM 逻辑：

```powershell
@'
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('INDEX.html', 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m => !/\bsrc\s*=/i.test(m[1]));
if (!scripts.length) throw new Error('No inline scripts found');
scripts.forEach((m, i) => new vm.Script(m[2], { filename: `INDEX.html:inline-${i + 1}` }));
console.log(`Syntax OK: ${scripts.length} inline script(s)`);
'@ | node
```

- 当前 EXTRACT 默认示例：源为 10 个 WORD，目标为 20 个 WORD，SRC_POS=2、DST_POS=5、CPY_NELEM=3。预期元素大小为 2 字节，目标容量为 20，状态为“参数有效 · 就绪”。
- 修改 EXTRACT 模型后，检查 SRC_NELEM 不整除、源位置越界、目标截断、复制数为 0、变量表达式及重置。ST 输入使用 `:=`，输出 DST/ERR 使用 `=>`。
- 浏览器验证覆盖布局、交互和剪贴板回退。PLC 程序段是否可编译、可通讯，须另在 Control Expert 或实际 PLC 环境验证。
