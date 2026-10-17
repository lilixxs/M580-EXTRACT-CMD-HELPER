/**
 * EXTRACT 指令生成工具 INDEX.html —— 本地视觉基线（真实 Tailwind 样式）
 * 范围：4 个固定状态 × 2 个 project（chromium-1280x800、chromium-1024x768）= 8 张全页截图。
 * 状态：default / nelem-custom-invalid / truncation / long-name。
 * 边界：本文件不更新正式基线。候选模式只写候选目录；正常模式只比较既有基线，比较由 config 控制
 *       （updateSnapshots=none、baselinePath 由 config 指定）。不得用本文件生成或代审批正式基线。
 * 页面加载、真实本地 Tailwind fixture 回放、样式与默认 ST 守卫、pageerror 与外网请求检查、
 * 每例证据截图均由 ./support/fixtures.cjs 的 test 钩子提供；进入用例时页面已是 fresh 状态。
 * 视口由本地 config 的两个 project 固定，本文件不设置 viewport，也不重复 mock 或路由。
 */
const {
  test,
  expect,
  LONG_NAME,
  assertDynamicStyle,
  captureCandidate,
  assertApprovedBaseline,
  isCandidateMode,
  prepareScreenshot,
} = require('./support/fixtures.cjs');

/** 用例收尾：动态样式检查 → 截图前置准备（清焦点、鼠标移开、字体就绪）→ 候选或基线比较 */
async function finish(page, testInfo, caseName) {
  await assertDynamicStyle(page);
  await prepareScreenshot(page);
  if (isCandidateMode) {
    await captureCandidate(page, testInfo, caseName);
  } else {
    await assertApprovedBaseline(testInfo);
    await expect(page).toHaveScreenshot(caseName + '.png', { fullPage: true });
  }
}

const badge = (page) => page.locator('#liveBadge');
const checks = (page) => page.locator('#checks');
const stOut = (page) => page.locator('#stCodeOut');

test('default', async ({ page }, testInfo) => {
  // 默认示例：源 10 个 WORD、SRC_POS=2、DST_POS=5、CPY_NELEM=3 → 参数有效
  await expect(badge(page)).toHaveText('参数有效 · 就绪');

  const st = await stOut(page).inputValue();
  // 输入引脚使用 :=，源变量 SrcArray，SRC_NELEM = 10
  expect(st).toMatch(/EXTRACT\(SRC\s*:=\s*SrcArray,/);
  expect(st).toMatch(/SRC_NELEM\s*:=\s*10,/);
  // 输出引脚使用 =>
  expect(st).toMatch(/DST\s*=>\s*DstArray,/);
  await expect(page.locator('#nelemDerived')).toContainText('SRC_NELEM 10');

  await finish(page, testInfo, 'default');
});

test('nelem-custom-invalid', async ({ page }, testInfo) => {
  // 自定义 SRC_NELEM=3：20 字节 ÷ 3 有余数 → ERR=-2、徽标“存在无效参数”
  await page.click('#nelemSeg [data-k="custom"]');
  await page.fill('#nelemCustom', '3');

  await expect(badge(page)).toHaveText('存在无效参数');
  await expect(checks(page)).toContainText('ERR=-2');
  // 不整除时不得静默改写用户输入，ST 保留 3
  expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*3,/);

  await finish(page, testInfo, 'nelem-custom-invalid');
});

test('truncation', async ({ page }, testInfo) => {
  // DST_POS=18 + CPY_NELEM=3 超出目标容量 20：ERR=2 截断警告
  await page.fill('#dstPos', '18');

  await expect(badge(page)).toHaveText('参数可疑 · 注意');
  await expect(checks(page)).toContainText('ERR=2');
  await expect(checks(page)).toContainText('仅 2 个会被复制（截断）');
  await expect(page.locator('#memmap')).toContainText('截断 1 元素');

  await finish(page, testInfo, 'truncation');
});

test('long-name', async ({ page }, testInfo) => {
  // 冻结长标识符同时用作源与目标变量名，不得被截断、改写或触发命名警告
  await page.fill('#srcName', LONG_NAME);
  await page.fill('#dstName', LONG_NAME);

  await expect(badge(page)).toHaveText('参数有效 · 就绪');
  await expect(page.locator('#srcName')).toHaveValue(LONG_NAME);
  await expect(page.locator('#dstName')).toHaveValue(LONG_NAME);

  const st = await stOut(page).inputValue();
  // 长标识符必须原样出现在 SRC := 与 DST => 两侧
  expect(st).toMatch(new RegExp('SRC\\s*:=\\s*' + LONG_NAME + ','));
  expect(st).toMatch(new RegExp('DST\\s*=>\\s*' + LONG_NAME + ','));

  await finish(page, testInfo, 'long-name');
});
