const fs = require('node:fs');
const path = require('node:path');
const { test: base, expect } = require('@playwright/test');
const { root, runId, lane, laneDir } = require('./paths.cjs');
const { hash, environment, sourceEvidence } = require('./environment.cjs');

const LONG_NAME = 'Source_Array_For_Local_Visual_Regression_0123456789';
const isCandidateMode = process.env.LOCAL_CHECK_MODE === 'candidates';
const safe = value => value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150);
const imageOptions = { fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' };

function styleFixture() {
  const dir = path.join(__dirname, 'vendor');
  const file = path.join(dir, process.env.LOCAL_CHECK_INJECT === 'missing-style' ? 'absent.js' : 'tailwind.js');
  if (!fs.existsSync(file)) throw new Error('ENV_BLOCKED: Tailwind fixture missing');
  const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const content = fs.readFileSync(file);
  if (hash(content) !== metadata.sha256) throw new Error('ENV_BLOCKED: Tailwind fixture hash mismatch');
  return content;
}

async function assertDynamicStyle(page) {
  const classes = await page.locator('#liveBadge').getAttribute('class');
  const expected = classes.includes('bg-red-100') ? 'rgb(254, 226, 226)'
    : classes.includes('bg-amber-100') ? 'rgb(254, 243, 199)' : 'rgb(209, 250, 229)';
  try {
    await expect.poll(() => page.locator('#liveBadge').evaluate(el => getComputedStyle(el).backgroundColor)).toBe(expected);
  } catch (error) {
    throw new Error(`ENV_BLOCKED: dynamic Tailwind styles unavailable\n${error.message}`);
  }
}

async function prepareScreenshot(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.mouse.move(0, 0);
}

async function captureEvidence(page, testInfo, name, locator) {
  const caseId = `${safe(testInfo.title).slice(0, 80)}-${hash(testInfo.title).slice(0, 8)}`;
  const file = path.join(laneDir, 'screenshots', testInfo.project.name, caseId, `${safe(name)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (locator) await locator.screenshot({ path: file, animations: 'disabled', caret: 'hide', scale: 'css', timeout: 5000 });
  else await page.screenshot({ ...imageOptions, path: file, timeout: 5000 });
  await testInfo.attach(name, { path: file, contentType: 'image/png' });
  return file;
}

async function captureCandidate(page, testInfo, name) {
  let previous;
  let stable;
  await expect.poll(async () => {
    stable = await page.screenshot(imageOptions);
    const equal = previous && previous.equals(stable);
    previous = stable;
    return !!equal;
  }, { timeout: 10_000, message: 'Candidate rendering must stabilize' }).toBe(true);
  const file = path.join(laneDir, 'baseline-candidates', testInfo.project.name, `${safe(name)}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stable);
  await testInfo.attach(`candidate-${name}`, { path: file, contentType: 'image/png' });
}

async function assertApprovedBaseline(testInfo) {
  const dir = path.join(root, 'tests/local/baselines', process.platform);
  const manifestFile = path.join(dir, 'manifest.json');
  if (process.env.LOCAL_CHECK_INJECT === 'missing-baseline' || !fs.existsSync(manifestFile)) {
    throw new Error('BASELINE_PENDING: user-reviewed baseline manifest missing');
  }
  const approved = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const current = JSON.parse(fs.readFileSync(path.join(laneDir, `environment-${testInfo.project.name}.json`), 'utf8'));
  if (!approved.approvedBy || !approved.approvedAt || !approved.approvalNote) throw new Error('BASELINE_PENDING: approval record missing');
  if (approved.environmentHash !== current.environmentHash) throw new Error('ENV_BLOCKED: baseline environment changed');
  for (const item of approved.files || []) {
    const relative = item.path;
    if (typeof relative !== 'string' || relative.includes('..') || path.isAbsolute(relative)) throw new Error('ENV_BLOCKED: invalid baseline path');
    const file = path.join(dir, relative);
    if (!fs.existsSync(file)) throw new Error(`BASELINE_PENDING: baseline missing: ${relative}`);
    if (hash(fs.readFileSync(file)) !== item.sha256) throw new Error(`ENV_BLOCKED: baseline hash changed: ${relative}`);
  }
  if (approved.files?.length !== 8) throw new Error('BASELINE_PENDING: exactly eight approved baselines required');
}

const test = base.extend({
  localGuard: [async ({ page, browser, baseURL }, use, testInfo) => {
    const errors = [];
    const unexpectedRequests = [];
    const consoleErrors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    try {
      const style = styleFixture();
      const env = environment(browser.version());
      fs.mkdirSync(laneDir, { recursive: true });
      fs.writeFileSync(path.join(laneDir, `environment-${testInfo.project.name}.json`), JSON.stringify({
        ...sourceEvidence(), runId, lane, port: Number(new URL(baseURL).port),
        project: testInfo.project.name, viewport: testInfo.project.use.viewport,
        environment: env, environmentHash: hash(JSON.stringify(env)), realSystemClipboard: 'not-executed'
      }, null, 2));
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.href === 'https://cdn.tailwindcss.com/') {
          await route.fulfill({ contentType: 'application/javascript', body: style });
        } else if (url.origin === new URL(baseURL).origin && ['/', '/index.html'].includes(url.pathname)) {
          await route.continue();
        } else {
          unexpectedRequests.push(url.href);
          await route.abort('blockedbyclient');
        }
      });
      await page.addInitScript(() => {
        window.__localClipboardWrites = [];
        window.__localExecCommands = [];
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
          writeText: async text => { window.__localClipboardWrites.push(text); }
        } });
        document.execCommand = command => { window.__localExecCommands.push(command); return true; };
      });
      await page.goto('/index.html');
      try {
        await expect.poll(() => page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(245, 245, 244)');
        await expect.poll(() => page.locator('section').first().evaluate(el => getComputedStyle(el).borderRadius)).toBe('16px');
        await assertDynamicStyle(page);
      } catch (error) {
        throw new Error(`ENV_BLOCKED: real Tailwind styles required\n${error.message}`);
      }
      await page.evaluate(() => document.fonts.ready);
      if (process.env.LOCAL_CHECK_INJECT === 'bad-st') await page.locator('#stCodeOut').evaluate(el => { el.value = 'BROKEN ST'; });
      if (process.env.LOCAL_CHECK_INJECT === 'moved-control') await page.addStyleTag({ content: '#srcName + div { transform: translate(-500px, -50%) !important; }' });
      await expect(page.locator('#stCodeOut')).toHaveValue(/EXTRACT\(SRC\s*:=\s*SrcArray,/);
      await expect(page.locator('#stCodeOut')).toHaveValue(/SRC_NELEM\s*:=\s*10,/);
      await use();
    } finally {
      await captureEvidence(page, testInfo, testInfo.status === testInfo.expectedStatus ? 'result' : 'failure');
      expect(errors, 'Uncaught page errors').toEqual([]);
      expect(unexpectedRequests, 'ENV_BLOCKED: requests outside the local resource allowlist').toEqual([]);
      expect(consoleErrors, 'Browser console errors').toEqual([]);
    }
  }, { auto: true }]
});

module.exports = { test, expect, LONG_NAME, captureEvidence, captureCandidate, assertApprovedBaseline, isCandidateMode, prepareScreenshot, assertDynamicStyle };
