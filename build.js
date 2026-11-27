// Build script for Vercel / local dev.
// Flat project layout: the web files live next to this script (no src/ folder needed).
// It copies the static files to public/, vendors the Socket.IO browser client, and writes public/config.js from environment variables.
// SERVER_URL = public URL of the Socket.IO backend (empty = same origin as the page).
const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'public');

// Where the web files live: ./src if someone adds that folder, otherwise the project root.
const src = fs.existsSync(path.join(root, 'src')) && fs.statSync(path.join(root, 'src')).isDirectory() ? path.join(root, 'src') : root;
const FILES = ['index.html', 'style.css', 'game.js', 'net-adapter.js'];

// minimal .env loader for local development (Vercel injects real env vars)
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch (e) {}

const missing = FILES.filter(f => !fs.existsSync(path.join(src, f)));
if (missing.length) { console.error('Missing files in ' + src + ': ' + missing.join(', ')); process.exit(1); }

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(src, f), path.join(out, f));

const cands = [['socket.io', 'client-dist', 'socket.io.min.js'], ['socket.io-client', 'dist', 'socket.io.min.js']].map(p => path.join(root, 'node_modules', ...p));
const lib = cands.find(f => fs.existsSync(f));
if (!lib) { console.error('Missing socket.io client. Run: npm install'); process.exit(1); }
fs.copyFileSync(lib, path.join(out, 'vendor', 'socket.io.min.js'));

const cfg = { SERVER_URL: (process.env.SERVER_URL || '').replace(/\/+$/, '') };
fs.writeFileSync(path.join(out, 'config.js'), 'window.CPB_CONFIG=' + JSON.stringify(cfg) + ';\n');
if (!cfg.SERVER_URL) console.warn('NOTE: SERVER_URL not set -> the page expects the Socket.IO server on the same origin (npm start).');
console.log('Build OK -> public/ (' + FILES.length + ' files + vendor/socket.io.min.js + config.js)');
