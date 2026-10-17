/**
 * EXTRACT 指令生成工具 INDEX.html —— Chromium 基础冒烟回归
 * 范围：仅测试用户可见 DOM 行为与输出（ST 文本、校验列表、派生信息、状态徽标），
 *       不直接调用页面内部函数（render/buildModel/genST）。
 * 注明：本文件只测功能逻辑，不测样式。Tailwind CDN 通过 page.route 空响应隔离外网，
 *       因此页面外观无法还原，不得断言任何 CSS 类生效情况。
 * 运行环境由主 agent 提供：baseURL=http://127.0.0.1:4173，测试目标为发布后的 /index.html。
 */
const { test, expect } = require('@playwright/test');

test.describe('EXTRACT 基础回归（发布版 /index.html）', () => {
  /** 每个用例收集的未捕获页面异常，afterEach 统一断言为空 */
  let pageErrors;

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // 隔离外网：Tailwind CDN 空响应。测试只测功能、不测样式。
    await page.route('https://cdn.tailwindcss.com/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
    );

    await page.goto('/index.html');
    await expect(page.locator('#stCodeOut')).toHaveValue(/EXTRACT\(/);
  });

  test.afterEach(async () => {
    // 所有用例都断言无未捕获 JS 异常；空数组可另作 console 报错排查线索
    expect(pageErrors, `未捕获的 pageerror（共 ${pageErrors.length} 个）`).toEqual([]);
  });

  /** 读取 ⑥ 参数校验区域的全部可见文本 */
  const checkText = (page) => page.locator('#checks').innerText();
  /** 读取源/NELEM/目标派生信息 chips 区域文本 */
  const derived = (page, id) => page.locator(`#${id}`);
  const badge = (page) => page.locator('#liveBadge');
  const stOut = (page) => page.locator('#stCodeOut');

  test('默认示例：ST 输出正确（输入 :=、输出 =>）且状态为“参数有效 · 就绪”', async ({ page }) => {
    await expect(badge(page)).toHaveText('参数有效 · 就绪');

    const st = await stOut(page).inputValue();
    // 注释行
    expect(st).toMatch(/EXTRACT: 将 SrcArray 的 3 个元素（自位置 2）复制到 DstArray（自位置 5）/);
    // 输入引脚使用 :=
    expect(st).toMatch(/EXTRACT\(SRC\s*:=\s*SrcArray,/);
    expect(st).toMatch(/SRC_NELEM\s*:=\s*10,/);
    expect(st).toMatch(/SRC_POS\s*:=\s*2,/);
    expect(st).toMatch(/DST_POS\s*:=\s*5,/);
    expect(st).toMatch(/CPY_NELEM\s*:=\s*3,/);
    // 输出引脚使用 =>
    expect(st).toMatch(/DST\s*=>\s*DstArray,/);
    expect(st).toMatch(/ERR\s*=>\s*Copy_Status\);/);
  });

  test('默认示例：数组元素数、存储器大小与目标容量派生信息正确', async ({ page }) => {
    // 源：ARRAY[0..9] OF WORD = 10 元素 × 2 字节 = 20 字节
    await expect(derived(page, 'srcDerived')).toContainText('存储器大小 20 字节');
    await expect(derived(page, 'srcDerived')).toContainText('元素 10 × WORD');
    // SRC_NELEM(auto=10)，元素大小 = 20 ÷ 10 = 2 字节
    await expect(derived(page, 'nelemDerived')).toContainText('SRC_NELEM 10');
    await expect(derived(page, 'nelemDerived')).toContainText('元素大小 2 字节');
    // 目标：40 字节 ÷ 2 = 容纳 20 个 WORD 元素
    await expect(derived(page, 'dstDerived')).toContainText('存储器大小 40 字节');
    await expect(derived(page, 'dstDerived')).toContainText('可容纳元素 20 × WORD');
  });

  test('更改上界与元素类型后 ST、SRC_NELEM 与容量自动更新', async ({ page }) => {
    // 上界 9→4：5 个元素，SRC_NELEM 变为 5
    await page.fill('#srcHi', '4');
    const st5 = await stOut(page).inputValue();
    expect(st5).toMatch(/SRC_NELEM\s*:=\s*5,/);
    await expect(derived(page, 'nelemDerived')).toContainText('SRC_NELEM 5');
    // 下标提示随上界联动（SRC_POS=2 → SrcArray[2]，lo=0 不变）
    await expect(page.locator('#srcPosHint')).toHaveText('→ SrcArray[2]');

    // 恢复上界 9 并把 WORD 换成 DINT：10×4=40 字节，元素大小 4，目标容量 40÷4=10
    await page.fill('#srcHi', '9');
    await page.selectOption('#srcElemType', 'DINT');
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*10,/);
    await expect(derived(page, 'nelemDerived')).toContainText('元素大小 4 字节');
    await expect(derived(page, 'dstDerived')).toContainText('可容纳元素 10 × DWORD');
  });

  test('SRC_NELEM 自定义不整除：ERR=-2 失败项与“存在无效参数”徽标', async ({ page }) => {
    await page.click('#nelemSeg button[data-k="custom"]');
    await expect(page.locator('#nelemCustomField')).not.toHaveClass(/\bhidden\b/);
    // 20 字节 ÷ 3 有余数
    await page.fill('#nelemCustom', '3');

    const checks = await checkText(page);
    expect(checks).toContain('ERR=-2');
    expect(checks).toContain('20 字节 ÷ SRC_NELEM 3');
    expect(checks).toContain('有余数');
    // ST 仍保留用户输入的 3（不整除时不应静默改写）
    expect(await stOut(page).inputValue()).toMatch(/SRC_NELEM\s*:=\s*3,/);
    await expect(badge(page)).toHaveText('存在无效参数');
  });

  test('SRC_POS 越界：ERR=-3 提示有效范围 0 … 9', async ({ page }) => {
    await page.fill('#srcPos', '10');

    const checks = await checkText(page);
    expect(checks).toContain('ERR=-3');
    expect(checks).toContain('SRC_POS = 10 超出源变量范围');
    expect(checks).toContain('有效 0 … 9');
    await expect(badge(page)).toHaveText('存在无效参数');
  });

  test('目标截断：DST_POS=18 + CPY=3 超容量 20 触发 ERR=2 截断警告', async ({ page }) => {
    // 目标容量 20；从位置 18 写入 3 个元素时，仅能复制 2 个。
    await page.fill('#dstPos', '18');

    const checks = await checkText(page);
    expect(checks).toContain('ERR=2');
    expect(checks).toContain('目标空间不足');
    expect(checks).toContain('仅 2 个会被复制（截断）');
    // 警告级（可疑但有效），不同于失败级
    await expect(badge(page)).toHaveText('参数可疑 · 注意');
    // 示意图第二行应显示截断数量
    await expect(page.locator('#memmap')).toContainText('截断 1 元素');
  });

  test('CPY_NELEM = 0：ERR=1 警告“参数可疑但有效”', async ({ page }) => {
    await page.fill('#cpyNelem', '0');

    const checks = await checkText(page);
    expect(checks).toContain('ERR=1');
    expect(checks).toContain('CPY_NELEM = 0');
    await expect(badge(page)).toHaveText('参数可疑 · 注意');
  });

  test('变量表达式：SRC_POS/CPY_NELEM 填变量名时按动态处理并原样保留在 ST', async ({ page }) => {
    await page.fill('#srcPos', 'iIdx');
    await page.fill('#cpyNelem', 'iCount');

    // 校验按“动态”处理，不作数值越界判断
    const checks = await checkText(page);
    expect(checks).toContain('SRC_POS = iIdx（变量表达式，运行时确定）');
    expect(checks).toContain('CPY_NELEM = iCount');

    // ST 原样保留变量表达式（输入 :=，不吞掉标识符）
    const st = await stOut(page).inputValue();
    expect(st).toMatch(/SRC_POS\s*:=\s*iIdx,/);
    expect(st).toMatch(/CPY_NELEM\s*:=\s*iCount,/);

    // 徽标回到绿色（此前两个用例的失败态不应残留）
    await expect(badge(page)).toHaveText('参数有效 · 就绪');
  });

  test('重置：修改后点击“重置为示例”恢复默认参数与输出', async ({ page }) => {
    // 先改出无效态
    await page.fill('#srcHi', '4');
    await page.fill('#srcName', 'Foo');
    await page.fill('#cpyNelem', '0');
    await page.fill('#dstPos', '18');
    await expect(badge(page)).not.toHaveText('参数有效 · 就绪');

    await page.getByRole('button', { name: '重置为示例' }).click();

    await expect(page.locator('#srcHi')).toHaveValue('9');
    await expect(page.locator('#srcName')).toHaveValue('SrcArray');
    await expect(page.locator('#cpyNelem')).toHaveValue('3');
    await expect(page.locator('#dstPos')).toHaveValue('5');
    await expect(badge(page)).toHaveText('参数有效 · 就绪');
    const st = await stOut(page).inputValue();
    expect(st).toMatch(/EXTRACT\(SRC\s*:=\s*SrcArray,/);
    expect(st).toMatch(/SRC_NELEM\s*:=\s*10,/);
  });
});
