/**
 * EXTRACT 指令生成工具 INDEX.html —— 本地功能 lane（Lane A，真实 Tailwind 样式）
 * 范围：STRING / DDT / SIZEOF 的元素划分派生、变量名清空、按钮复制的 API 合同与回退路径。
 * 页面加载、离线 Tailwind fixture、默认剪贴板与 execCommand mock、默认 ST 与无异常守卫、
 * 逐例证据截图均由 ./support/fixtures.cjs 的 localGuard 自动完成；进入用例时页面已是 fresh 状态。
 * 本文件不重复 goto / route / beforeEach，不设视口，不测样式像素与布局。
 * 复制反馈先 install 再 pauseAt 冻结假时钟，恢复用 runFor(1201) 精确推进，不使用任意 sleep。
 */
const { test, expect, captureEvidence } = require('./support/fixtures.cjs');

test.describe('EXTRACT 本地功能回归（STRING / DDT / SIZEOF / 清空 / 复制）', () => {
  /** 位于同一下拉/分段容器内的相邻按钮：变量名前后的 [title] 按钮挂在输入框父容器下 */
  const siblingButton = (page, id, title) => page.locator(`#${id}`).locator('xpath=..').getByTitle(title);
  const stOut = (page) => page.locator('#stCodeOut');
  const checksText = (page) => page.locator('#checks').innerText();
  const clipboardWrites = (page) => page.evaluate(() => window.__localClipboardWrites.slice());
  const execCommands = (page) => page.evaluate(() => window.__localExecCommands.slice());

  test('元素划分 SIZEOF：SRC_NELEM 取 SIZEOF(SrcArray)、元素 1 字节、目标 40 × BYTE', async ({ page }) => {
    await page.click('#nelemSeg button[data-k="sizeof"]');

    await expect(page.locator('#nelemDerived')).toContainText('SRC_NELEM SIZEOF(SrcArray)');
    await expect(page.locator('#nelemDerived')).toContainText('元素大小 1 字节 (BYTE)');
    await expect(page.locator('#nelemDerived')).toContainText('字节数（1 元素 = 1 字节，位置 = 字节偏移）');
    await expect(page.locator('#dstDerived')).toContainText('可容纳元素 40 × BYTE');
    expect(await checksText(page)).toContain('元素大小 = 20 字节 ÷ 20 = 1 字节（BYTE）');
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*SIZEOF\(SrcArray\),/);
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');
  });

  test('STRING 源默认长度 16：声明 STRING[16]、SRC_NELEM 16、元素 1 字节', async ({ page }) => {
    await page.click('#srcKindSeg button[data-k="string"]');

    await expect(page.locator('#srcStrCfg')).not.toHaveClass(/\bhidden\b/);
    await expect(page.locator('#srcDerived')).toContainText('存储器大小 16 字节');
    await expect(page.locator('#srcDerived')).toContainText('STRING[16]');
    await expect(page.locator('#srcDerived input[readonly]')).toHaveValue('SrcArray : STRING[16];');
    await expect(page.locator('#nelemDerived')).toContainText('SRC_NELEM 16');
    await expect(page.locator('#nelemDerived')).toContainText('元素大小 1 字节 (BYTE)');
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*16,/);
    await expect(page.locator('#declTbody')).toContainText('STRING[16]');
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');
  });

  test('STRING 源长度 0：源定义无效并给出 ERR=-1', async ({ page }) => {
    await page.click('#srcKindSeg button[data-k="string"]');
    await page.fill('#srcStrLen', '0');

    const checks = await checksText(page);
    expect(checks).toContain('源变量定义无效：长度无效');
    expect(checks).toContain('ERR=-1');
    expect(checks).toContain('SRC_NELEM 未定义或源变量大小未知，无法校验');
    await expect(page.locator('#srcDerived')).toContainText('长度无效');
    await expect(page.locator('#liveBadge')).toHaveText('存在无效参数');
    expect(await stOut(page).inputValue()).toContain('SRC_NELEM := —,');
  });

  test('DDT 源默认 MyDDT 20 字节：声明 MyDDT、SRC_NELEM 20', async ({ page }) => {
    await page.click('#srcKindSeg button[data-k="custom"]');

    await expect(page.locator('#srcCustomCfg')).not.toHaveClass(/\bhidden\b/);
    await expect(page.locator('#srcDerived')).toContainText('存储器大小 20 字节');
    await expect(page.locator('#srcDerived input[readonly]')).toHaveValue('SrcArray : MyDDT;');
    await expect(page.locator('#nelemDerived')).toContainText('SRC_NELEM 20');
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*20,/);
    await expect(page.locator('#declTbody')).toContainText('MyDDT');
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');
  });

  test('清空按钮：清空源变量名后值为空、获得焦点并回落 SRC_VAR', async ({ page }) => {
    const srcName = page.locator('#srcName');
    const clearButton = siblingButton(page, 'srcName', '清空');
    await expect(clearButton).toBeVisible();

    await clearButton.click();

    await expect(srcName).toHaveValue('');
    await expect(srcName).toBeFocused();
    expect(await stOut(page).inputValue()).toMatch(/EXTRACT\(SRC\s*:=\s*SRC_VAR,/);
    await expect(page.locator('#srcDerived input[readonly]')).toHaveValue('SRC_VAR : ARRAY[0..9] OF WORD;');
    await expect(page.locator('#srcPosHint')).toHaveText('→ SRC_VAR[2]');
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');
  });

  test('复制按钮：记录源字符串与完整 ST，绿色反馈 1200ms 后恢复', async ({ page }, testInfo) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now());

    const srcName = page.locator('#srcName');
    const srcCopy = siblingButton(page, 'srcName', '复制');
    const srcBox = srcName.locator('xpath=..');

    await srcCopy.click();
    await expect(srcCopy).toHaveClass(/bg-emerald-500/);
    expect(await clipboardWrites(page)).toEqual(['SrcArray']);
    await captureEvidence(page, testInfo, 'copy-feedback-src-name', srcBox);

    await page.clock.runFor(1201);
    await expect(srcCopy).not.toHaveClass(/bg-emerald-500/);
    await expect(srcCopy).toHaveClass(/bg-sky-500/);
    await captureEvidence(page, testInfo, 'copy-restored-src-name', srcBox);

    const stText = await stOut(page).inputValue();
    const codeCopy = siblingButton(page, 'stCodeOut', '复制');
    await codeCopy.click();
    await expect(codeCopy).toHaveClass(/bg-emerald-500/);
    const writes = await clipboardWrites(page);
    expect(writes).toEqual(['SrcArray', stText]);
    expect(writes[1]).toMatch(/SRC_NELEM\s*:=\s*10,/);

    await page.clock.runFor(1201);
    await expect(codeCopy).not.toHaveClass(/bg-emerald-500/);
  });

  test('复制回退：writeText 被拒绝时改用 document.execCommand("copy")', async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now());
    await page.evaluate(() => {
      window.__localWriteAttempts = 0;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => {
            window.__localWriteAttempts += 1;
            return Promise.reject(new Error('clipboard write denied'));
          },
        },
      });
    });

    const srcCopy = siblingButton(page, 'srcName', '复制');
    const before = await page.evaluate(() => window.__localClipboardWrites.length);
    await srcCopy.click();

    await expect(srcCopy).toHaveClass(/bg-emerald-500/);
    expect(await page.evaluate(() => window.__localWriteAttempts)).toBe(1);
    expect(await execCommands(page)).toEqual(['copy']);
    expect(await page.evaluate(() => window.__localClipboardWrites.length)).toBe(before);
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*10,/);

    await page.clock.runFor(1201);
    await expect(srcCopy).not.toHaveClass(/bg-emerald-500/);
  });

  test('复制回退：navigator.clipboard 缺失时改用 document.execCommand("copy")', async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(Date.now());
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    });
    expect(await page.evaluate(() => navigator.clipboard === undefined)).toBe(true);

    const srcCopy = siblingButton(page, 'srcName', '复制');
    await srcCopy.click();

    await expect(srcCopy).toHaveClass(/bg-emerald-500/);
    expect(await execCommands(page)).toEqual(['copy']);
    expect(await clipboardWrites(page)).toEqual([]);
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*10,/);

    await page.clock.runFor(1201);
    await expect(srcCopy).not.toHaveClass(/bg-emerald-500/);
  });
});
