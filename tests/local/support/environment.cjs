const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { root } = require('./paths.cjs');

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fonts() {
  const locations = [path.join(process.env.WINDIR || 'C:/Windows', 'Fonts')];
  if (process.env.LOCALAPPDATA) locations.push(path.join(process.env.LOCALAPPDATA, 'Microsoft/Windows/Fonts'));
  const entries = [];
  locations.forEach((dir, index) => {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!/\.(ttf|ttc|otf)$/i.test(file)) continue;
      const stat = fs.statSync(path.join(dir, file));
      entries.push(`${index}/${file}:${stat.size}:${stat.mtimeMs}`);
    }
  });
  if (!entries.length) throw new Error('ENV_BLOCKED: Windows font inventory unavailable');
  return { count: entries.length, inventoryHash: hash(entries.join('\n')) };
}
function inlineStyles() {
  const html = fs.readFileSync(path.join(root, 'INDEX.html'), 'utf8');
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1].replace(/\r\n/g, '\n')).join('\n');
  if (!styles.trim()) throw new Error('ENV_BLOCKED: inline stylesheet missing from INDEX.html');
  return styles;
}
function environment(browserVersion) {
  return {
    platform: process.platform,
    osRelease: os.release(),
    osVersion: os.version(),
    node: process.version,
    playwright: require('@playwright/test/package.json').version,
    browser: browserVersion,
    fonts: fonts(),
    styleSource: 'INDEX.html inline CSS',
    styleSha256: hash(inlineStyles()),
    dpr: 1,
    locale: 'zh-CN',
    colorScheme: 'light'
  };
}
function sourceEvidence() {
  return {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    sourceSha256: hash(fs.readFileSync(path.join(root, 'INDEX.html')))
  };
}
module.exports = { hash, environment, sourceEvidence, inlineStyles };
