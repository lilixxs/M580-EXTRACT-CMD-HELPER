const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
// Publish only the application, not the DOCX, rules, tests or repository files.
fs.copyFileSync(path.join(root, 'INDEX.html'), path.join(output, 'index.html'));
console.log('Built dist/index.html from INDEX.html');
