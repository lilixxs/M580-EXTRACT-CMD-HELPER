const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const ports = { functional: 4181, layout: 4182, visual: 4183 };
const caseCounts = { functional: 16, layout: 12, visual: 8 };
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  const key = args[i];
  if (key === '--candidates') options.candidates = true;
  else if (['--lane', '--run-id', '--inject'].includes(key) && args[i + 1] && !args[i + 1].startsWith('--')) options[key.slice(2)] = args[++i];
  else throw new Error(`Unknown or incomplete argument: ${key}`);
}
if (options.lane && !Object.hasOwn(ports, options.lane)) throw new Error('Lane must be functional, layout or visual');
if (options.inject && !['bad-st', 'moved-control', 'missing-style', 'port-in-use', 'missing-baseline'].includes(options.inject)) throw new Error('Unknown negative control');
if (options.inject && !options.lane) throw new Error('Negative controls require an explicit --lane');
const runId = options['run-id'] || `${new Date().toISOString().replace(/[^0-9]/g, '')}-${crypto.randomBytes(3).toString('hex')}`;
if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error('Invalid run ID');
const output = path.join(root, 'artifacts/local-check', runId);
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite run: ${runId}`);
fs.mkdirSync(path.join(output, 'logs'), { recursive: true });
const lanes = options.lane ? [options.lane] : Object.keys(ports);
const git = (...parameters) => execFileSync('git', parameters, { cwd: root, encoding: 'utf8' }).trim();
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const summary = {
  runId, startedAt: new Date().toISOString(), mode: options.candidates ? 'candidates' : 'compare',
  status: 'blocked', realSystemClipboard: 'not-executed', lanes: [],
  worktreesRetained: true
};

function command(executable, parameters, cwd, env, log) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, parameters, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
}

function probePort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', error => reject(new Error(`ENV_BLOCKED: port ${port} unavailable (${error.code}); no process was terminated`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

async function runLane(lane) {
  const worktree = path.join(process.env.LOCALAPPDATA, 'Temp/opencode', `local-check-${hash(root).slice(0, 8)}-${runId}-${lane}`);
  const log = fs.createWriteStream(path.join(output, 'logs', `${lane}.log`), { flags: 'wx' });
  const result = { lane, port: ports[lane], status: 'blocked', worktree };
  try {
    await probePort(ports[lane]);
    git('-c', 'core.longpaths=true', 'worktree', 'add', '--detach', worktree, summary.commit);
    const env = {
      ...process.env, CI: '', LOCAL_CHECK_RUN_ID: runId, LOCAL_CHECK_LANE: lane,
      LOCAL_CHECK_PORT: String(ports[lane]), LOCAL_CHECK_MODE: summary.mode,
      LOCAL_CHECK_INJECT: options.inject || ''
    };
    let code = await command(process.execPath, [npmCli, 'ci', '--offline', '--ignore-scripts', '--registry=https://registry.npmjs.org', '--no-audit', '--no-fund'], worktree, env, log);
    if (code !== 0) throw new Error(`ENV_BLOCKED: npm ci failed with exit ${code}`);
    code = await command(process.execPath, ['scripts/build.cjs'], worktree, env, log);
    if (code !== 0) throw new Error(`ENV_BLOCKED: build failed with exit ${code}`);
    const expectedSource = fs.readFileSync(path.join(worktree, 'INDEX.html'));
    if (hash(expectedSource) !== summary.sourceSha256 || !expectedSource.equals(fs.readFileSync(path.join(worktree, 'dist/index.html')))) {
      throw new Error('ENV_BLOCKED: source or build bytes differ across worktrees');
    }
    code = await command(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.local.config.cjs', `tests/local/${lane}.local.cjs`], worktree, env, log);
    result.exitCode = code;
    const workerOutput = path.join(worktree, 'artifacts/local-check', runId, lane);
    if (!fs.existsSync(path.join(workerOutput, 'lane-result.json'))) throw new Error('ENV_BLOCKED: lane result missing');
    fs.cpSync(workerOutput, path.join(output, lane), { recursive: true, force: false, errorOnExist: true });
    const report = JSON.parse(fs.readFileSync(path.join(output, lane, 'lane-result.json'), 'utf8'));
    result.status = report.status;
    result.total = report.total;
    if (report.total !== caseCounts[lane]) {
      result.status = 'blocked';
      result.error = `Expected ${caseCounts[lane]} cases; collected ${report.total}`;
    }
    result.report = `${lane}/html/index.html`;
    result.result = `${lane}/lane-result.json`;
    if (result.status === 'passed' && code !== 0) result.status = 'failed';
    const manifests = fs.readdirSync(path.join(output, lane)).filter(name => name.startsWith('environment-'));
    result.environments = manifests.map(name => `${lane}/${name}`);
    if (result.status === 'passed' && manifests.length !== 2) {
      result.status = 'blocked';
      result.error = 'Missing viewport environment manifests';
    }
    if (lane === 'visual' && options.candidates && result.status === 'baseline-pending') {
      const candidates = [];
      for (const project of ['chromium-1280x800', 'chromium-1024x768']) {
        for (const name of ['default', 'nelem-custom-invalid', 'truncation', 'long-name']) {
          const file = path.join(output, lane, 'baseline-candidates', project, `${name}.png`);
          if (fs.existsSync(file)) candidates.push({ path: path.relative(output, file), sha256: hash(fs.readFileSync(file)) });
        }
      }
      result.candidates = candidates;
      if (candidates.length !== 8) { result.status = 'blocked'; result.error = 'Eight candidate images are required'; }
    }
  } catch (error) {
    result.error = error.message;
    log.write(`${error.stack}\n`);
  } finally {
    await new Promise(resolve => log.end(resolve));
  }
  console.log(`${lane}: ${result.status}${result.total ? ` (${result.total} cases)` : ''}`);
  return result;
}

(async () => {
  let occupied;
  try {
    if (process.platform !== 'win32') throw new Error('ENV_BLOCKED: local baselines support Windows only');
    if (git('status', '--porcelain')) throw new Error('ENV_BLOCKED: commit the reviewed task files before creating identical worktree inputs; no automatic commit was made');
    if (!fs.existsSync(npmCli)) throw new Error('ENV_BLOCKED: run this tool through npm run test:local');
    const { chromium } = require('playwright');
    if (!fs.existsSync(chromium.executablePath())) throw new Error('ENV_BLOCKED: run npx playwright install chromium first');
    summary.commit = git('rev-parse', 'HEAD');
    summary.sourceSha256 = hash(fs.readFileSync(path.join(root, 'INDEX.html')));
    summary.styleFixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/local/support/vendor/manifest.json'), 'utf8'));
    if (options.inject === 'port-in-use') {
      occupied = net.createServer();
      await new Promise((resolve, reject) => { occupied.once('error', reject); occupied.listen(ports[options.lane], '127.0.0.1', resolve); });
    }
    summary.lanes = await Promise.all(lanes.map(runLane));
    summary.status = summary.lanes.some(lane => lane.status === 'failed') ? 'failed'
      : summary.lanes.some(lane => lane.status === 'blocked') ? 'blocked'
      : summary.lanes.some(lane => lane.status === 'baseline-pending') ? 'baseline-pending' : 'passed';
    if (summary.lanes.length !== lanes.length) summary.status = 'blocked';
  } catch (error) {
    summary.error = error.message;
    console.error(error.message);
  } finally {
    if (occupied?.listening) await new Promise(resolve => occupied.close(resolve));
    summary.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(`Summary: ${path.join(output, 'summary.json')}`);
    console.log(`Overall: ${summary.status}`);
    process.exitCode = { passed: 0, failed: 1, blocked: 2, 'baseline-pending': 3 }[summary.status] ?? 2;
  }
})();
