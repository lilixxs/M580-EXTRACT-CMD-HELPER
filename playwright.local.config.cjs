const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');
const { laneDir } = require('./tests/local/support/paths.cjs');

const port = Number(process.env.LOCAL_CHECK_PORT || 4181);
module.exports = defineConfig({
  testDir: './tests/local',
  testMatch: '**/*.local.cjs',
  workers: 1,
  retries: 0,
  maxFailures: process.env.LOCAL_CHECK_INJECT ? 1 : 0,
  forbidOnly: true,
  timeout: 30_000,
  globalTimeout: 180_000,
  updateSnapshots: 'none',
  ignoreSnapshots: false,
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  outputDir: path.join(laneDir, 'results'),
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(laneDir, 'html'), open: 'never' }],
    ['./tests/local/support/reporter.cjs']
  ],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixels: 0 }
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'zh-CN',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium-1280x800', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
    { name: 'chromium-1024x768', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 } }
  ],
  webServer: {
    command: 'node scripts/serve.cjs',
    env: { LOCAL_CHECK_PORT: String(port) },
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: false,
    timeout: 15_000
  }
});
