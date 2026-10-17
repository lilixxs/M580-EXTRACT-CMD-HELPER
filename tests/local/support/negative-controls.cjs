const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const id = `negative-${Date.now()}`;
const directory = path.join(root, 'artifacts/local-check', id);
fs.mkdirSync(directory, { recursive: true });
const results = [];
const controls = [
  { kind: 'bad-st', lane: 'functional', status: 'failed', code: 1, marker: 'BROKEN ST' },
  { kind: 'moved-control', lane: 'layout', status: 'failed', code: 1, marker: 'expect' },
  { kind: 'missing-style', lane: 'functional', status: 'blocked', code: 2, marker: 'Tailwind fixture missing' },
  { kind: 'port-in-use', lane: 'functional', status: 'blocked', code: 2, marker: 'port 4181 unavailable' },
  { kind: 'missing-baseline', lane: 'visual', status: 'baseline-pending', code: 3, marker: 'BASELINE_PENDING' }
];
for (const control of controls) {
  const runId = `${id}-${control.kind}`;
  const child = spawnSync(process.execPath, [
    path.join(root, 'scripts/local-check.cjs'), '--lane', control.lane,
    '--inject', control.kind, '--run-id', runId
  ], { cwd: root, env: process.env, encoding: 'utf8', timeout: 240_000, maxBuffer: 16 * 1024 * 1024 });
  fs.writeFileSync(path.join(directory, `${control.kind}.log`), `${child.stdout || ''}\n${child.stderr || ''}`);
  const result = { ...control, runId, observedExitCode: child.status, detected: false };
  try {
    const summary = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/local-check', runId, 'summary.json'), 'utf8'));
    assert.equal(child.status, control.code);
    assert.equal(summary.status, control.status);
    let evidence = JSON.stringify(summary);
    for (const lane of summary.lanes) {
      if (lane.result) evidence += fs.readFileSync(path.join(root, 'artifacts/local-check', runId, lane.result), 'utf8');
    }
    assert.ok(evidence.includes(control.marker), `Expected negative-control evidence: ${control.marker}`);
    result.detected = true;
  } catch (error) {
    result.error = error.message;
  }
  results.push(result);
  console.log(`${control.kind}: ${result.detected ? 'detected as expected' : 'CONTROL FAILED'}`);
}
fs.writeFileSync(path.join(directory, 'negative-controls.json'), JSON.stringify({
  id, note: 'Expected failures validate the detector; they are not passing product cases.',
  results
}, null, 2));
console.log(`Negative-control evidence: ${directory}`);
process.exitCode = results.every(result => result.detected) ? 0 : 1;
