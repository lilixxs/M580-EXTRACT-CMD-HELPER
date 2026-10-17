const fs = require('node:fs');
const path = require('node:path');
const { lane, laneDir } = require('./paths.cjs');

class LocalReporter {
  constructor() { this.tests = []; this.errors = []; }
  onBegin(config, suite) { this.total = suite.allTests().length; }
  onError(error) { this.errors.push(error.message || String(error)); }
  onTestEnd(test, result) {
    this.tests.push({
      name: test.title, project: test.parent.project()?.name,
      status: result.status, durationMs: result.duration,
      errors: result.errors.map(error => error.message || String(error)),
      attachments: result.attachments.map(item => ({ name: item.name, path: item.path, contentType: item.contentType }))
    });
  }
  onEnd(result) {
    const messages = [...this.errors, ...this.tests.flatMap(test => test.errors)].join('\n');
    let status = result.status === 'passed' && this.total > 0 && this.tests.length === this.total
      && this.tests.every(test => test.status === 'passed' && test.attachments.some(a => a.contentType === 'image/png'))
      ? 'passed' : 'failed';
    if (/BASELINE_PENDING/.test(messages)) status = 'baseline-pending';
    else if (/ENV_BLOCKED/.test(messages) || !this.total) status = 'blocked';
    if (lane === 'visual' && process.env.LOCAL_CHECK_MODE === 'candidates' && status === 'passed') status = 'baseline-pending';
    fs.mkdirSync(laneDir, { recursive: true });
    fs.writeFileSync(path.join(laneDir, 'lane-result.json'), JSON.stringify({
      lane, status, mode: process.env.LOCAL_CHECK_MODE || 'compare',
      total: this.total || 0, tests: this.tests, errors: this.errors,
      realSystemClipboard: 'not-executed'
    }, null, 2));
    if (status !== 'passed') return { status: 'failed' };
  }
}
module.exports = LocalReporter;
