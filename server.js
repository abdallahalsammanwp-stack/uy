// Curse Platform Battle — authoritative online server (Socket.IO).
// The server runs the REAL game simulation (game.js) headlessly inside a vm sandbox, one per room.
// Clients only send inputs and render the snapshots; damage, health, energy, rounds and the winner are decided here.
// Local: npm run dev   |   Separate backend (Render/Railway/Fly...): npm start with ALLOWED_ORIGINS set.
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
let Server;
try { ({ Server } = require('socket.io')); } catch (e) { console.error('Missing dependency socket.io. Run: npm install'); process.exit(1); }

const port = process.env.PORT || 3000;
const dir = path.join(__dirname, 'public');
const srcDir = fs.existsSync(path.join(__dirname, 'src')) ? path.join(__dirname, 'src') : __dirname;
const ALLOWED = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
const GRACE_MS = 30000, MAX_ROOMS = 500, TICK = 1000 / 60, ROUND_GAP = 150;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png' };

/* ---------- static files (optional: skipped when the frontend is hosted elsewhere) ---------- */
const httpServer = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end('Bad request'); }
  if (p === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, rooms: rooms.size })); }
  if (p === '/' || p === '') p = '/index.html';
  const f = path.normalize(path.join(dir, p));
  if (f !== dir && !f.startsWith(dir + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(d);
  });
});
const io = new Server(httpServer, {
  cors: { origin: ALLOWED.includes('*') ? true : ALLOWED },
  pingInterval: 4000, pingTimeout: 6000, maxHttpBufferSize: 16 * 1024
});

/* ---------- headless game engine (the real game.js) ---------- */
const GAME_SRC = fs.readFileSync(path.join(srcDir, 'game.js'), 'utf8');
const GAME_SCRIPT = new vm.Script(GAME_SRC, { filename: 'game.js' });
const STEP = new vm.Script('step()');
const ST = new vm.Script('__st()');
const BOOT = new vm.Script(`
ON.role='host';ON.gp='srv';
ON.nr={emit:function(t,d){__emit(t,d);return Promise.resolve()},connected:function(){return true},peers:function(){return[]}};
globalThis.__IN=[null,null];globalThis.__PC=[[],[]];
netPre=function(){const now=Date.now();for(let pi=0;pi<2;pi++){const g=__IN[pi],ok=!!g&&now-g.t<400;
  NK.forEach((k,i)=>{inp[pi][k]=ok?(g.m>>i)&1:0});
  if(ok)PK.forEach((k,i)=>{const c=g.c[i]|0,pc=__PC[pi];if(pc[i]===undefined)pc[i]=c;if(c!==pc[i]){pr[pi][k]=1;pc[i]=c}})}};
globalThis.__st=function(){return state==='over'?(P[0].hp>0&&P[1].hp<=0?1:P[1].hp>0&&P[0].hp<=0?2:3):0};
`);
function mkStub() {
  const f = function () {};
  const p = new Proxy(f, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : p, apply: () => p, construct: () => p, set: () => true });
  return p;
}
class Engine {
  constructor(onSnap) {
    const stub = mkStub(), sb = {
      document: stub, navigator: { hardwareConcurrency: 8, deviceMemory: 8, userAgent: 'node', maxTouchPoints: 0, vibrate() {} },
      performance: { now: () => Date.now() }, addEventListener() {}, removeEventListener() {},
      requestAnimationFrame() { return 0; }, cancelAnimationFrame() {}, setInterval() { return 0; }, setTimeout() { return 0; }, clearInterval() {}, clearTimeout() {},
      console: { log() {}, warn() {}, error: console.error }, crypto: { getRandomValues: a => crypto.randomFillSync(a) },
      localStorage: stub, sessionStorage: stub, Image: stub, AudioContext: stub, webkitAudioContext: stub, matchMedia: () => stub,
      innerWidth: 900, innerHeight: 450, devicePixelRatio: 1, __emit: (t, d) => { if (t === 's') onSnap(JSON.stringify(d)); }
    };
    sb.window = sb;
    this.ctx = vm.createContext(sb);
    GAME_SCRIPT.runInContext(this.ctx);
    BOOT.runInContext(this.ctx);
    this.n = vm.runInContext('CK.length', this.ctx);
  }
  setInput(pi, m, c) { this.ctx.__IN[pi] = { m, c, t: Date.now() }; }
  resetCounters(pi) { this.ctx.__PC[pi] = []; }
  start(a, b) { vm.runInContext('evq=[];startSelect(' + (a | 0) + ',' + (b | 0) + ')', this.ctx); }
  nextRound() { vm.runInContext('evq=[];reset(P[0].ch,P[1].ch)', this.ctx); }
  step() { STEP.runInContext(this.ctx); }
  result() { return ST.runInContext(this.ctx); }   // 0 running, 1 P1 won round, 2 P2 won round, 3 draw
  info() { return JSON.parse(vm.runInContext('JSON.stringify({st:state,ch:[P[0].ch,P[1].ch],hp:[P[0].hp,P[1].hp],en:[P[0].en,P[1].en]})', this.ctx)); }
}

/* ---------- rooms ---------- */
const rooms = new Map();
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode() { for (;;) { let s = ''; for (const v of crypto.randomBytes(5)) s += ALPHA[v % ALPHA.length]; if (!rooms.has(s)) return s; } }
const rnd = n => crypto.randomInt(n);
function pub(r) {
  const now = Date.now();
  let gl = 0; r.pl.forEach(p => { if (p && !p.c && p.dc) gl = Math.max(gl, Math.max(0, GRACE_MS - (now - p.dc))); });
  r.pl.forEach((p, i) => { if (p && p.c) io.to(p.sid).emit('room', { code: r.code, phase: r.phase, pi: i, p: r.pl.map(q => q ? { c: q.c } : null), gl }); });
}
function closeRoom(r, reason, notify) {
  if (!rooms.delete(r.code)) return;
  r.pl.forEach((p, i) => { if (!p) return; clearTimeout(p.timer); const s = io.sockets.sockets.get(p.sid); if (s) { if (p.c && i !== notify.skip) s.emit('closed', { reason }); s.leave(r.code); s.data.room = null; } });
  r.eng = null;
}
function dropPlayer(r, pi, reason) {            // explicit leave or grace expired
  if (!rooms.has(r.code)) return;
  if (r.phase === 'lobby' && pi === 1) { const p = r.pl[1]; clearTimeout(p.timer); const s = io.sockets.sockets.get(p.sid); if (s) { s.leave(r.code); s.data.room = null; } r.pl[1] = null; pub(r); return; }
  closeRoom(r, 'opponent_left', { skip: pi });
}
function beginMatch(r) {
  if (!r.eng) r.eng = new Engine(j => io.to(r.code).volatile.emit('s', j));
  const a = rnd(r.eng.n), b = (a + 1 + rnd(r.eng.n - 1)) % r.eng.n;   // two different random fighters, chosen by the server
  r.w = [0, 0]; r.rd = 1; r.over = false; r.final = false; r.rm = [false, false]; r.t = 0; r.paused = r.pl.some(p => !p.c);
  r.eng.start(a, b); r.phase = 'fight';
  io.to(r.code).emit('g', { k: 'start', a, b });
  io.to(r.code).emit('m', { k: 'init', w: r.w, rd: r.rd });
  pub(r);
}
function tickRoom(r) {
  if (r.phase !== 'fight' || r.paused || !r.eng) return;
  try { r.eng.step(); } catch (e) { console.error('engine error in', r.code, e); closeRoom(r, 'server_error', {}); return; }
  r.t++;
  const s = r.eng.result();
  if (!r.over && s) {
    r.over = true; r.until = r.t + ROUND_GAP;
    if (s < 3) { r.w[s - 1]++; r.rd++; if (r.w[s - 1] >= 2) r.final = s - 1; }
    io.to(r.code).emit('m', { k: 'ko', w: r.w, rd: r.rd, win: s < 3 ? s - 1 : -1 });
  } else if (r.over && r.t >= r.until) {
    if (r.final !== false) { r.phase = 'ended'; io.to(r.code).emit('m', { k: 'match', w: r.w, win: r.final }); pub(r); }
    else { r.eng.nextRound(); r.over = false; io.to(r.code).emit('m', { k: 'round', w: r.w, rd: r.rd }); }
  }
}
let last = Date.now(), acc = 0;
setInterval(() => {
  const now = Date.now(); acc += Math.min(100, now - last); last = now;
  let n = 0; while (acc >= TICK && n++ < 4) { rooms.forEach(tickRoom); acc -= TICK; }
  if (acc > 50) acc = 0;
}, 8);

/* ---------- sockets ---------- */
function attach(socket, r, pi) {
  const p = r.pl[pi]; p.sid = socket.id; p.c = true; p.dc = null; clearTimeout(p.timer);
  socket.data.room = r.code; socket.data.pi = pi; socket.join(r.code);
  if (r.eng) r.eng.resetCounters(pi);
  if (r.pl.every(q => q && q.c)) r.paused = false;
}
io.on('connection', socket => {
  const mine = () => { const r = rooms.get(socket.data.room); return r && r.pl[socket.data.pi] && r.pl[socket.data.pi].sid === socket.id ? r : null; };
  const leaveCurrent = () => { const r = mine(); if (r) dropPlayer(r, socket.data.pi); };

  socket.on('create', (_d, ack) => {
    if (typeof ack !== 'function') return;
    if (rooms.size >= MAX_ROOMS) return ack({ ok: false, err: 'busy' });
    leaveCurrent();
    const r = { code: newCode(), pl: [null, null], phase: 'lobby', eng: null, w: [0, 0], rd: 1, over: false, final: false, rm: [false, false], t: 0, paused: false };
    const tok = crypto.randomBytes(12).toString('hex');
    r.pl[0] = { tok, sid: null, c: false, dc: null, timer: null }; rooms.set(r.code, r); attach(socket, r, 0);
    ack({ ok: true, code: r.code, token: tok, pi: 0, phase: r.phase }); pub(r);
  });
  socket.on('join', (d, ack) => {
    if (typeof ack !== 'function') return;
    const code = d && typeof d.code === 'string' ? d.code.trim().toUpperCase() : '';
    if (!/^[A-Z2-9]{5}$/.test(code)) return ack({ ok: false, err: 'bad_code' });
    const r = rooms.get(code); if (!r) return ack({ ok: false, err: 'not_found' });
    if (r.pl[1] || r.phase !== 'lobby') return ack({ ok: false, err: 'full' });   // exactly two players per room
    leaveCurrent();
    const tok = crypto.randomBytes(12).toString('hex');
    r.pl[1] = { tok, sid: null, c: false, dc: null, timer: null }; attach(socket, r, 1);
    ack({ ok: true, code, token: tok, pi: 1, phase: r.phase }); pub(r);
  });
  socket.on('resume', (d, ack) => {
    if (typeof ack !== 'function') return;
    const r = d && typeof d.code === 'string' ? rooms.get(d.code.toUpperCase()) : null;
    const pi = r && typeof d.token === 'string' ? r.pl.findIndex(p => p && p.tok === d.token) : -1;
    if (pi < 0) return ack({ ok: false, err: r ? 'bad_token' : 'not_found' });
    const old = io.sockets.sockets.get(r.pl[pi].sid); if (old && old.id !== socket.id) { old.data.room = null; old.disconnect(true); }
    attach(socket, r, pi);
    ack({ ok: true, code: r.code, token: d.token, pi, phase: r.phase });
    socket.emit('m', { k: 'init', w: r.w, rd: r.rd });
    if (r.phase === 'ended') socket.emit('m', { k: 'match', w: r.w, win: r.final });
    pub(r);
  });
  socket.on('start', () => { const r = mine(); if (r && r.phase === 'lobby' && socket.data.pi === 0 && r.pl[1] && r.pl.every(p => p.c)) beginMatch(r); });
  socket.on('rematch', () => {
    const r = mine(); if (!r || r.phase !== 'ended') return;
    r.rm[socket.data.pi] = true;
    if (r.rm[0] && r.rm[1]) beginMatch(r); else io.to(r.code).emit('m', { k: 'rematch' });
  });
  socket.on('i', d => {
    const r = mine(); if (!r || !r.eng || r.phase !== 'fight' || !d) return;
    if (!Number.isInteger(d.m) || d.m < 0 || d.m > 0x3fff || !Array.isArray(d.c) || d.c.length !== 10) return;
    const c = d.c.map(v => Number.isInteger(v) ? v : 0);
    r.eng.setInput(socket.data.pi, d.m, c);
  });
  socket.on('p', (t, ack) => { if (typeof ack === 'function') ack(); });
  socket.on('leave', leaveCurrent);
  socket.on('disconnect', () => {
    const r = mine(); if (!r) return;
    const pi = socket.data.pi, p = r.pl[pi]; p.c = false; p.dc = Date.now();
    if (r.phase === 'fight') r.paused = true;                 // freeze the match while a player is away
    p.timer = setTimeout(() => dropPlayer(r, pi), GRACE_MS);
    pub(r);
    const t = setInterval(() => { if (!rooms.has(r.code) || p.c || !p.dc) return clearInterval(t); pub(r); }, 5000);
  });
});

if (require.main === module) httpServer.listen(port, () => console.log('CPB server on http://localhost:' + port + (fs.existsSync(path.join(dir, 'index.html')) ? '' : '  (API only: public/ not found)')));
module.exports = { Engine, httpServer, io, rooms };
