const fs = require('node:fs');
const path = require('node:path');
const { root, lane, laneDir } = require('./paths.cjs');
const { hash } = require('./environment.cjs');

class LocalReporter {
  constructor() { this.tests = []; this.errors = []; }
  onBegin(config, suite) { this.total = suite.allTests().length; }
  onError(error) { this.errors.push(error.message || String(error)); }
  onTestEnd(test, result) {
    this.tests.push({
      name: test.title, project: test.parent.project()?.name,
      testFile: path.relative(root, test.location.file),
      testFileSha256: hash(fs.readFileSync(test.location.file)),
      status: result.status, durationMs: result.duration,
      errors: result.errors.map(error => error.message || String(error)),
      attachments: result.attachments.map(item => ({
        name: item.name, path: item.path, contentType: item.contentType,
        sha256: item.path && fs.existsSync(item.path) ? hash(fs.readFileSync(item.path)) : undefined
      }))
    });
  }
  onEnd(result) {
    const isControlStop = message => !!process.env.LOCAL_CHECK_INJECT
      && /^Testing stopped early after \d+ maximum allowed failures\.$/.test(message.replace(/\x1b\[[0-9;]*m/g, '').trim());
    const errorMessages = [...this.errors, ...this.tests.flatMap(test => test.errors)].filter(message => !isControlStop(message));
    const messages = errorMessages.join('\n');
    let status = result.status === 'passed' && this.total > 0 && this.tests.length === this.total
      && this.tests.every(test => test.status === 'passed' && test.attachments.some(a => a.contentType === 'image/png' && a.sha256))
      ? 'passed' : 'failed';
    if (!this.total) status = 'blocked';
    else if (errorMessages.some(message => !/BASELINE_PENDING|ENV_BLOCKED/.test(message))) status = 'failed';
    else if (/ENV_BLOCKED/.test(messages)) status = 'blocked';
    else if (/BASELINE_PENDING/.test(messages)) status = 'baseline-pending';
    if (lane === 'visual' && process.env.LOCAL_CHECK_MODE === 'candidates' && status === 'passed') status = 'baseline-pending';
    fs.mkdirSync(laneDir, { recursive: true });
    fs.writeFileSync(path.join(laneDir, 'lane-result.json'), JSON.stringify({
      lane, status, mode: process.env.LOCAL_CHECK_MODE || 'compare',
      total: this.total || 0, tests: this.tests, errors: this.errors,
      baselineManifestSha256: fs.existsSync(path.join(root, 'tests/local/baselines/win32/manifest.json'))
        ? hash(fs.readFileSync(path.join(root, 'tests/local/baselines/win32/manifest.json'))) : null,
      realSystemClipboard: 'not-executed'
    }, null, 2));
    if (status !== 'passed') return { status: 'failed' };
  }
}
module.exports = LocalReporter;
