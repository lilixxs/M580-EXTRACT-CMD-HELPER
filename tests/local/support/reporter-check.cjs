const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.LOCAL_CHECK_RUN_ID = `reporter-check-${Date.now()}`;
process.env.LOCAL_CHECK_LANE = 'reporter';
process.env.LOCAL_CHECK_INJECT = 'missing-style';
const Reporter = require('./reporter.cjs');
const { laneDir } = require('./paths.cjs');
const stop = '\x1b[31mTesting stopped early after 1 maximum allowed failures.\x1b[39m';

for (const [errors, expected] of [
  [['Error: ENV_BLOCKED: Tailwind fixture missing'], 'blocked'],
  [['Error: BASELINE_PENDING: approval missing'], 'baseline-pending'],
  [['Error: BASELINE_PENDING: approval missing', 'Error: expect(value).toBe(expected)'], 'failed']
]) {
  const reporter = new Reporter();
  reporter.total = 1;
  reporter.errors = [stop];
  reporter.tests = [{ status: 'failed', errors, attachments: [] }];
  reporter.onEnd({ status: 'failed' });
  const result = JSON.parse(fs.readFileSync(path.join(laneDir, 'lane-result.json'), 'utf8'));
  assert.equal(result.status, expected);
  assert.deepEqual(result.errors, [stop], 'Keep the runner diagnostic in evidence');
}
console.log('Reporter preserves error categories and rejects mixed real assertion failures.');
