const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = path.join(__dirname, '..', 'INDEX.html');
const html = fs.readFileSync(source, 'utf8');
assert.match(html, /^\s*<!doctype html>/i, 'Missing HTML5 doctype');
assert.match(html, /<html\b[^>]*\blang=["']zh-CN["']/i, 'Missing Chinese document language');
assert.match(html, /<meta\b[^>]*\bcharset=["']UTF-8["']/i, 'Missing UTF-8 charset');
assert.match(html, /<title>[^<\s][^<]*<\/title>/i, 'Missing page title');
assert.match(html, /<\/body>\s*<\/html>\s*$/i, 'Incomplete HTML document');

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/\bsrc\s*=/i.test(match[1]));
assert.ok(scripts.length, 'No inline scripts found');
scripts.forEach((match, index) => {
  new vm.Script(match[2], { filename: `INDEX.html:inline-${index + 1}` });
});
console.log(`HTML structure and ${scripts.length} inline script(s): OK`);
