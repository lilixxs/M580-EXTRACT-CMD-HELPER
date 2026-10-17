/**
 * Lane B · 本地布局与几何用例（本地专用：真实 Tailwind 样式 + 离线 fixture 回放）
 *
 * 覆盖 6 项：
 *  1. 默认示例无页面级水平溢出，FBD／声明表／引脚表由 overflow 宿主约束；
 *  2. 固定长变量名（LONG_NAME）时页面仍无水平溢出，长内容溢出不逃逸到页面；
 *  3. 变量输入框右侧清空／复制按钮守在框内、互不重叠、右侧 padding 足以覆盖按钮区；
 *  4. 源／目标「变量形式」四组配置的真实可见性与包围盒显隐（非活动组 display:none）；
 *  5. SRC_NELEM「自定义」字段展开后与分段控件、派生信息互不重叠；
 *  6. 错误／警告徽标经动态样式守卫后，容器几何不越界、不压标题。
 *
 * 边界说明：
 * - 真实样式允许局部横向滚动（长表格、功能块图），因此不断言「所有内容都不滚动」；
 *   只断言页面级无水平溢出 + 溢出由 overflow 宿主约束 + 越界内容不逃出视口。
 * - 输入框内按钮与输入框「有意重叠」，故不检查「按钮不得与输入框相交」，
 *   改查：按钮落在输入框边框盒内、且不侵入可编辑文字区（padding-right 足够覆盖）。
 * - 几何比较容差 0.5px 仅用于吸收子像素取整，不用于放宽遮挡约束。
 * - 本文件仅由 Lane B 维护；页面内函数（render/buildModel）一律不直接调用。
 * - 禁用 .only / .skip / .fixme：任一用例失败都必须让本地检查以非 0 退出。
 */
const {
  test,
  expect,
  LONG_NAME,
  captureEvidence,
  assertDynamicStyle,
} = require('./support/fixtures.cjs');

/** 子像素取整容差（仅用于几何比较） */
const EPS = 0.5;

/** 冻结的长变量名常量（防止支持层漂移导致「长名场景」静默退化） */
const FROZEN_LONG_NAME = 'Source_Array_For_Local_Visual_Regression_0123456789';

/**
 * 页面内测量：文档级水平溢出，以及「无裁剪祖先却越出视口」的元素。
 * 越界内容允许存在，但必须被某个 overflow 非 visible 的祖先裁剪（宿主内滚动）。
 */
async function auditHorizontal(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const bound = de.clientWidth;
    const hasClipAncestor = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== 'visible') return true;
      }
      return false;
    };
    const offenders = [];
    const walk = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') {
        const r = el.getBoundingClientRect();
        const escapes = r.right > bound + 0.5 || r.left < -0.5;
        if (r.width > 0 && r.height > 0 && escapes && !hasClipAncestor(el)) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
            left: +r.left.toFixed(1),
            right: +r.right.toFixed(1),
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          });
        }
      }
      for (const c of el.children) walk(c);
    };
    walk(document.body);
    return {
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      offenderCount: offenders.length,
      offenders: offenders.slice(0, 6),
    };
  });
}

/** 断言页面无水平溢出（scrollWidth <= clientWidth），且无逃逸出视口的元素 */
async function expectNoPageOverflow(page) {
  const a = await auditHorizontal(page);
  const detail =
    `documentElement.scrollWidth=${a.scrollWidth} / clientWidth=${a.clientWidth}；` +
    `body.scrollWidth=${a.bodyScrollWidth}；逃逸元素(${a.offenderCount})=${JSON.stringify(a.offenders)}`;
  expect(a.scrollWidth, detail).toBeLessThanOrEqual(a.clientWidth);
  expect(a.bodyScrollWidth, detail).toBeLessThanOrEqual(a.clientWidth);
  expect(a.offenderCount, detail).toBe(0);
  return a;
}

/** 页面内测量：目标元素的最近 overflow 宿主与宽度关系 */
async function auditScrollHost(page, sel) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return { found: false };
    let host = null;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== 'visible') {
        host = p;
        break;
      }
    }
    // 表格内容宽度以 <table> 为准（tbody 盒与表盒同宽，但以表盒更稳妥）
    const widthEl = el.closest('table') || el;
    const er = widthEl.getBoundingClientRect();
    return {
      found: true,
      measured: widthEl.id || widthEl.tagName.toLowerCase(),
      hostFound: !!host,
      hostTag: host ? host.tagName.toLowerCase() : null,
      hostOverflowX: host ? getComputedStyle(host).overflowX : null,
      hostLeft: host ? +host.getBoundingClientRect().left.toFixed(1) : null,
      hostRight: host ? +host.getBoundingClientRect().right.toFixed(1) : null,
      hostClientWidth: host ? host.clientWidth : null,
      hostScrollWidth: host ? host.scrollWidth : null,
      hostScrollable: host ? host.scrollWidth > host.clientWidth + 0.5 : false,
      contentWidth: +er.width.toFixed(1),
      viewportWidth: document.documentElement.clientWidth,
    };
  }, sel);
}

/**
 * 断言元素被 overflow:auto/scroll 宿主约束：
 * 宿主存在、宿主本身不越出视口、内容宽于宿主时宿主必须可滚动。
 * reachable=false 时不断言「内容可完整滚动到达」（居中 flex 宿主的起边溢出按 CSS 规范不可滚动）。
 */
async function expectScrollHost(page, sel, { reachable = true } = {}) {
  const h = await auditScrollHost(page, sel);
  const detail = `${sel}：${JSON.stringify(h)}`;
  expect(h.found, detail).toBe(true);
  expect(h.hostFound, `${sel} 缺少 overflow 宿主：${detail}`).toBe(true);
  expect(['auto', 'scroll'], detail).toContain(h.hostOverflowX);
  expect(h.hostLeft, detail).toBeGreaterThanOrEqual(-EPS);
  expect(h.hostRight, detail).toBeLessThanOrEqual(h.viewportWidth + EPS);
  if (h.contentWidth > h.hostClientWidth + EPS) {
    expect(h.hostScrollable, `${sel} 内容宽于宿主但宿主不可滚动：${detail}`).toBe(true);
  }
  if (reachable) {
    expect(h.contentWidth, `${sel} 内容超出宿主可滚动范围：${detail}`).toBeLessThanOrEqual(
      h.hostScrollWidth + 1,
    );
  }
  return h;
}

/** 页面内测量：变量输入框与其右侧按钮容器的几何关系 */
async function probeField(page, id) {
  return page.evaluate((fieldId) => {
    const input = document.getElementById(fieldId);
    if (!input) return { found: false };
    const wrap = input.parentElement;
    const group = wrap ? wrap.querySelector('div.absolute') : null;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        left: +r.left.toFixed(2),
        right: +r.right.toFixed(2),
        top: +r.top.toFixed(2),
        bottom: +r.bottom.toFixed(2),
        width: +r.width.toFixed(2),
        height: +r.height.toFixed(2),
      };
    };
    const cs = getComputedStyle(input);
    const paddingRight = parseFloat(cs.paddingRight) || 0;
    const borderRight = parseFloat(cs.borderRightWidth) || 0;
    const r = input.getBoundingClientRect();
    const buttons = group ? Array.from(group.querySelectorAll('button')).map((b) => ({
      title: b.getAttribute('title'),
      ...box(b),
    })) : [];
    return {
      found: true,
      input: box(input),
      paddingRight,
      borderRight,
      /** 可编辑文字区右边界（内容盒右边界） */
      contentRight: +(r.right - borderRight - paddingRight).toFixed(2),
      group: group ? box(group) : null,
      groupDisplay: group ? getComputedStyle(group).display : null,
      groupTransform: group ? getComputedStyle(group).transform : null,
      buttons,
      viewportWidth: document.documentElement.clientWidth,
    };
  }, id);
}

/** 断言单个变量输入框的按钮守卫：框内、互不重叠、padding 足够覆盖按钮区 */
async function expectFieldButtonGuard(page, id) {
  const p = await probeField(page, id);
  const detail = `#${id}：${JSON.stringify({
    input: p.input,
    contentRight: p.contentRight,
    paddingRight: p.paddingRight,
    borderRight: p.borderRight,
    group: p.group,
    groupDisplay: p.groupDisplay,
    groupTransform: p.groupTransform,
    buttons: p.buttons,
  })}`;

  expect(p.found, detail).toBe(true);
  expect(p.group, `#${id} 右侧按钮容器缺失：${detail}`).not.toBeNull();
  expect(p.groupDisplay, `#${id} 按钮容器不可见：${detail}`).not.toBe('none');

  // ① 按钮容器整体落在输入框边框盒内部（有意与输入框重叠，但不许越界）
  expect(p.group.left, detail).toBeGreaterThanOrEqual(p.input.left - EPS);
  expect(p.group.right, detail).toBeLessThanOrEqual(p.input.right + EPS);
  expect(p.group.top, detail).toBeGreaterThanOrEqual(p.input.top - EPS);
  expect(p.group.bottom, detail).toBeLessThanOrEqual(p.input.bottom + EPS);

  // ② 清空/复制两个按钮都存在且非退化，互不重叠（DOM 顺序：清空在前）
  expect(p.buttons.map((b) => b.title), detail).toEqual(['清空', '复制']);
  for (const b of p.buttons) {
    expect(b.width, detail).toBeGreaterThan(0);
    expect(b.height, detail).toBeGreaterThan(0);
    expect(b.left, detail).toBeGreaterThanOrEqual(p.input.left - EPS);
    expect(b.right, detail).toBeLessThanOrEqual(p.input.right + EPS);
  }
  const [clearBtn, copyBtn] = p.buttons;
  expect(clearBtn.right, `#${id} 清空与复制按钮重叠：${detail}`).toBeLessThanOrEqual(
    copyBtn.left + EPS,
  );

  // ③ 右侧 padding 足以覆盖按钮区：按钮不侵入可编辑文字区，也不越出边框盒内边界
  expect(p.group.left, `#${id} 按钮侵入可编辑文字区：${detail}`).toBeGreaterThanOrEqual(
    p.contentRight - EPS,
  );
  expect(p.group.right, detail).toBeLessThanOrEqual(p.input.right - p.borderRight + EPS);
  expect(p.viewportWidth, detail).toBeGreaterThan(0);

  return p;
}

/** 页面内测量：徽标与页头、标题的几何关系 */
async function measureBadge(page) {
  return page.evaluate(() => {
    const badge = document.getElementById('liveBadge');
    const header = badge.closest('header');
    const title = header ? header.querySelector('h1') : null;
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        left: +r.left.toFixed(2),
        right: +r.right.toFixed(2),
        top: +r.top.toFixed(2),
        bottom: +r.bottom.toFixed(2),
        width: +r.width.toFixed(2),
        height: +r.height.toFixed(2),
      };
    };
    const b = box(badge);
    const h = header ? box(header) : null;
    const t = title ? box(title) : null;
    const cs = getComputedStyle(badge);
    return {
      badge: b,
      header: h,
      title: t,
      display: cs.display,
      visibility: cs.visibility,
      text: (badge.textContent || '').trim(),
      viewportWidth: document.documentElement.clientWidth,
      overlapsTitle: !!(t && !(b.right <= t.left || b.left >= t.right || b.bottom <= t.top || b.top >= t.bottom)),
    };
  });
}

/** 断言徽标容器几何：可见、落在页头内、不越出视口、不压标题 */
async function expectBadgeGeometry(page) {
  const m = await measureBadge(page);
  const detail = `徽标几何：${JSON.stringify(m)}`;
  expect(m.header, `#liveBadge 不在 header 内：${detail}`).not.toBeNull();
  expect(m.display, detail).not.toBe('none');
  expect(m.visibility, detail).not.toBe('hidden');
  expect(m.badge.width, detail).toBeGreaterThan(0);
  expect(m.badge.height, detail).toBeGreaterThan(0);
  expect(m.badge.left, detail).toBeGreaterThanOrEqual(m.header.left - EPS);
  expect(m.badge.right, detail).toBeLessThanOrEqual(m.header.right + EPS);
  expect(m.badge.top, detail).toBeGreaterThanOrEqual(m.header.top - EPS);
  expect(m.badge.bottom, detail).toBeLessThanOrEqual(m.header.bottom + EPS);
  expect(m.badge.right, detail).toBeLessThanOrEqual(m.viewportWidth + EPS);
  expect(m.overlapsTitle, `徽标与主标题重叠：${detail}`).toBe(false);
  return m;
}

/** 变量形式分段与对应配置组的映射 */
const SRC_KINDS = {
  array: 'srcArrayCfg',
  elem: 'srcElemCfg',
  string: 'srcStrCfg',
  custom: 'srcCustomCfg',
};
const DST_KINDS = {
  array: 'dstArrayCfg',
  elem: 'dstElemCfg',
  string: 'dstStrCfg',
  custom: 'dstCustomCfg',
};

/** 依次激活每组变量形式，校验活动组可见（非零包围盒）、非活动组 display:none */
async function expectKindGroups(page, segSel, map, label) {
  for (const kind of Object.keys(map)) {
    await page.click(`${segSel} button[data-k="${kind}"]`);
    for (const other of Object.keys(map)) {
      const loc = page.locator(`#${map[other]}`);
      if (other === kind) {
        await expect(loc, `${label}：激活「${kind}」后 ${map[other]} 应可见`).toBeVisible();
        const box = await loc.boundingBox();
        expect(box, `${label}：${map[other]} 应有包围盒`).not.toBeNull();
        expect(box.width, `${label}：${map[other]} 包围盒宽度`).toBeGreaterThan(0);
        expect(box.height, `${label}：${map[other]} 包围盒高度`).toBeGreaterThan(0);
        // 可见组必须落在视口内，且至少含一个真实可见的输入/选择控件
        const vp = await page.evaluate(() => document.documentElement.clientWidth);
        expect(box.x, `${label}：${map[other]} 左边界越出视口`).toBeGreaterThanOrEqual(-EPS);
        expect(box.x + box.width, `${label}：${map[other]} 右边界越出视口`).toBeLessThanOrEqual(vp + EPS);
        await expect(loc.locator('input, select').first()).toBeVisible();
      } else {
        await expect(
          loc,
          `${label}：激活「${kind}」时 ${map[other]} 应隐藏`,
        ).toBeHidden();
        await expect(loc).toHaveCSS('display', 'none');
        expect(
          await loc.boundingBox(),
          `${label}：${map[other]} 隐藏时不应有包围盒`,
        ).toBeNull();
      }
    }
  }
}

test.describe('Lane B · 本地布局与几何（真实 Tailwind 样式）', () => {
  test('默认示例：无页面级水平溢出，FBD／声明表／引脚表由 overflow 宿主约束', async ({
    page,
  }, testInfo) => {
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');

    await expectNoPageOverflow(page);

    // 功能块图：外层 flex 居中 + overflow-x-auto 承接过宽内容
    await expectScrollHost(page, '#fbGraphic', { reachable: false });
    // 声明表、引脚表：表宽溢出必须落在 overflow-x-auto 容器内
    await expectScrollHost(page, '#declTbody');
    await expectScrollHost(page, '#pinTbody');

    await captureEvidence(page, testInfo, 'layout-default-page');
  });

  test('固定长变量名：页面仍无水平溢出，长内容溢出限于滚动宿主内', async ({
    page,
  }, testInfo) => {
    // 冻结常量校验：长名场景不得因常量漂移而静默退化
    expect(LONG_NAME, 'LONG_NAME 冻结常量被改动').toBe(FROZEN_LONG_NAME);

    await page.fill('#srcName', LONG_NAME);
    await page.fill('#dstName', LONG_NAME);

    // 长名必须真实进入三处渲染产物，否则本用例失去意义
    await expect(page.locator('#srcName')).toHaveValue(LONG_NAME);
    await expect(page.locator('#dstName')).toHaveValue(LONG_NAME);
    await expect(page.locator('#fbGraphic')).toContainText(LONG_NAME);
    await expect(page.locator('#declTbody')).toContainText(LONG_NAME);
    await expect(page.locator('#pinTbody')).toContainText(LONG_NAME);
    await expect(page.locator('#stCodeOut')).toHaveValue(new RegExp(LONG_NAME));

    await expectNoPageOverflow(page);

    const fbd = await expectScrollHost(page, '#fbGraphic', { reachable: false });
    const decl = await expectScrollHost(page, '#declTbody');
    const pin = await expectScrollHost(page, '#pinTbody');

    // 诊断信息随证据保留：长名场景下三处宿主的滚动状态
    testInfo.annotations.push({
      type: 'long-name-scroll-hosts',
      description: JSON.stringify({
        fbd: { client: fbd.hostClientWidth, scroll: fbd.hostScrollWidth, content: fbd.contentWidth },
        decl: { client: decl.hostClientWidth, scroll: decl.hostScrollWidth, content: decl.contentWidth },
        pin: { client: pin.hostClientWidth, scroll: pin.hostScrollWidth, content: pin.contentWidth },
      }),
    });

    await captureEvidence(page, testInfo, 'layout-long-name-page');
    await captureEvidence(page, testInfo, 'layout-long-name-decl-table', page.locator('#declTbody'));
  });

  test('变量输入框按钮守卫：srcName／dstName／errName 三处按钮在框内、互不重叠、padding 足够', async ({
    page,
  }, testInfo) => {
    for (const id of ['srcName', 'dstName', 'errName']) {
      await expectFieldButtonGuard(page, id);
    }
    await captureEvidence(page, testInfo, 'layout-field-buttons', page.locator('#srcName'));
    await captureEvidence(page, testInfo, 'layout-field-buttons-err', page.locator('#errName'));
  });

  test('变量形式分段：源／目标四组配置按真实可见性与包围盒显隐', async ({
    page,
  }, testInfo) => {
    await expectKindGroups(page, '#srcKindSeg', SRC_KINDS, '源变量');
    await expectKindGroups(page, '#dstKindSeg', DST_KINDS, '目标变量');
    await captureEvidence(page, testInfo, 'layout-kind-groups', page.locator('#srcCustomCfg'));
  });

  test('SRC_NELEM 自定义：展开字段真实可见，与分段控件及派生信息互不重叠', async ({
    page,
  }, testInfo) => {
    const field = page.locator('#nelemCustomField');

    // 初始（与源变量类型相同）时字段隐藏
    await expect(field).toBeHidden();
    await expect(field).toHaveCSS('display', 'none');
    expect(await field.boundingBox()).toBeNull();

    await page.click('#nelemSeg button[data-k="custom"]');
    await expect(field).toBeVisible();
    await expect(page.locator('#nelemCustom')).toBeVisible();
    const box = await field.boundingBox();
    expect(box, 'nelemCustomField 展开后应有包围盒').not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    const geo = await page.evaluate(() => {
      const box = (sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return {
          left: +r.left.toFixed(2),
          right: +r.right.toFixed(2),
          top: +r.top.toFixed(2),
          bottom: +r.bottom.toFixed(2),
        };
      };
      return {
        field: box('#nelemCustomField'),
        input: box('#nelemCustom'),
        seg: box('#nelemSeg'),
        derived: box('#nelemDerived'),
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    const detail = `SRC_NELEM 自定义几何：${JSON.stringify(geo)}`;

    // 与上方分段控件不重叠（字段在分段控件下方）
    expect(geo.field.top, detail).toBeGreaterThanOrEqual(geo.seg.bottom - EPS);
    // 自定义输入框位于字段内
    expect(geo.input.left, detail).toBeGreaterThanOrEqual(geo.field.left - EPS);
    expect(geo.input.right, detail).toBeLessThanOrEqual(geo.field.right + EPS);
    expect(geo.input.top, detail).toBeGreaterThanOrEqual(geo.field.top - EPS);
    expect(geo.input.bottom, detail).toBeLessThanOrEqual(geo.field.bottom + EPS);
    // 与下方派生信息组不重叠
    expect(geo.field.bottom, detail).toBeLessThanOrEqual(geo.derived.top + EPS);
    // 不越出视口
    expect(geo.field.right, detail).toBeLessThanOrEqual(geo.viewportWidth + EPS);

    await captureEvidence(page, testInfo, 'layout-nelem-custom', field);
  });

  test('错误与警告徽标：动态样式守卫后几何不越界、不压标题', async ({ page }, testInfo) => {
    // 失败态：SRC_POS 越界（ERR=-3）
    await page.fill('#srcPos', '10');
    await expect(page.locator('#liveBadge')).toHaveText('存在无效参数');
    await assertDynamicStyle(page, 'fail');
    await expectBadgeGeometry(page);
    await captureEvidence(page, testInfo, 'layout-badge-fail', page.locator('#liveBadge'));

    // 警告态：DST_POS 越容量（ERR=2 截断）
    await page.getByRole('button', { name: '重置为示例' }).click();
    await expect(page.locator('#liveBadge')).toHaveText('参数有效 · 就绪');
    await page.fill('#dstPos', '18');
    await expect(page.locator('#liveBadge')).toHaveText('参数可疑 · 注意');
    await assertDynamicStyle(page, 'warn');
    await expectBadgeGeometry(page);
    await captureEvidence(page, testInfo, 'layout-badge-warn', page.locator('#liveBadge'));
  });
});
