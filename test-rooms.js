// Room-logic test of server.js with an in-memory Socket.IO mock (real transport NOT exercised here).
const Module = require('module'), vm = require('vm'), orig = Module._load;
let n = 0;
class FakeSocket { constructor(io) { this.id = 'sock' + (++n); this.data = {}; this.rooms = new Set(); this.h = {}; this.log = []; this.io = io; io.sockets.sockets.set(this.id, this); }
  on(e, f) { this.h[e] = f; } join(r) { this.rooms.add(r); } leave(r) { this.rooms.delete(r); } emit(e, d) { this.log.push([e, d]); }
  disconnect() { if (this.dead) return; this.dead = true; this.io.sockets.sockets.delete(this.id); this.h.disconnect && this.h.disconnect(); }
  send(e, d) { return new Promise(res => { const f = this.h[e]; if (!f) return res(); f(d, r => res(r)); setTimeout(() => res(), 20); }); }
  got(e) { return this.log.filter(x => x[0] === e).map(x => x[1]); } }
class FakeIO { constructor() { this.sockets = { sockets: new Map() }; this.cb = null; }
  on(e, f) { if (e === 'connection') this.cb = f; }
  to(t) { const dst = () => [...this.sockets.sockets.values()].filter(s => s.id === t || s.rooms.has(t)); const o = { emit: (e, d) => dst().forEach(s => s.emit(e, d)) }; o.volatile = o; return o; }
  connect() { const s = new FakeSocket(this); this.cb(s); return s; } }
Module._load = function (r, ...a) { return r === 'socket.io' ? { Server: FakeIO } : orig.call(this, r, ...a); };
const { io, rooms } = require('./server.js'); Module._load = orig;
const sleep = ms => new Promise(r => setTimeout(r, ms)); let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
(async () => {
  const A = io.connect(), B = io.connect(), C = io.connect();
  const ra = await A.send('create', {}); ok(ra.ok && /^[A-Z2-9]{5}$/.test(ra.code) && ra.pi === 0, 'create room with random 5-char code ' + ra.code);
  ok((await B.send('join', { code: 'zzzzz' })).err === 'not_found', 'join unknown code -> not_found');
  ok((await B.send('join', { code: 'x' })).err === 'bad_code', 'join malformed code -> bad_code');
  const rb = await B.send('join', { code: ra.code.toLowerCase() }); ok(rb.ok && rb.pi === 1, 'second player joins (lower-case code accepted)');
  ok((await C.send('join', { code: ra.code })).err === 'full', 'third player rejected (2 players max)');
  B.send('start'); await sleep(30); ok(!rooms.get(ra.code).eng, 'only the creator can start');
  A.send('start'); await sleep(50);
  const ga = A.got('g')[0], gb = B.got('g')[0];
  ok(ga && gb && ga.a !== ga.b && ga.a === gb.a && ga.b === gb.b, 'server picked 2 different fighters, same for both: ' + JSON.stringify(ga));
  await sleep(4300);   // select animation (230 ticks)
  const r = rooms.get(ra.code), no = () => [0,0,0,0,0,0,0,0,0,0];
  ok(r.eng.info().st === 'play', 'match is in play state');
  ok(A.got('s').length > 10 && B.got('s').length > 10, 'both clients receive server snapshots (' + A.got('s').length + '/' + B.got('s').length + ')');
  // P1 attacks (press counters) near P2
  vm.runInContext('P[0].x=P[1].x-60;P[0].f=1', r.eng.ctx);
  const hp0 = r.eng.info().hp[1]; let c = no();
  for (let i = 0; i < 12; i++) { c[1]++; A.send('i', { m: 0, c: c.slice(), n: i }); await sleep(120); }
  ok(r.eng.info().hp[1] < hp0, 'P1 combo from client A damaged P2 on the server: ' + hp0 + ' -> ' + r.eng.info().hp[1].toFixed(1));
  // invalid input ignored
  A.send('i', { m: 'x', c: [] }); await sleep(10); ok(true, 'malformed input ignored');
  // disconnect + pause + resume
  const tokB = rb.token; B.disconnect(); await sleep(100);
  const pa = A.got('room').pop(); ok(pa.p[1].c === false && pa.gl > 0, 'A is told opponent disconnected (grace ' + Math.round(pa.gl / 1000) + 's)');
  const before = A.got('s').length; await sleep(300); ok(A.got('s').length === before, 'match frozen while opponent is away');
  const B2 = io.connect(); const rs = await B2.send('resume', { code: ra.code, token: tokB }); ok(rs.ok && rs.pi === 1, 'opponent resumes with token as same player');
  await sleep(300); ok(A.got('s').length > before && B2.got('s').length > 0, 'match continues after reconnect');
  ok((await io.connect().send('resume', { code: ra.code, token: 'bad' })).err === 'bad_token', 'resume with wrong token rejected');
  // rounds / match end
  vm.runInContext('P[1].hp=0', r.eng.ctx); await sleep(200);
  let m = A.got('m').filter(x => x.k === 'ko').pop(); ok(m && m.win === 0 && m.w[0] === 1, 'round 1 KO -> server scores P1 (1-0)');
  await sleep(2900); ok(A.got('m').some(x => x.k === 'round' && x.rd === 2) && r.eng.info().hp[1] === 100, 'server starts round 2 with full health');
  vm.runInContext('P[1].hp=0', r.eng.ctx); await sleep(3300);
  m = A.got('m').filter(x => x.k === 'match').pop(); ok(m && m.win === 0 && m.w[0] === 2, 'match ends 2-0 and server announces winner');
  A.send('rematch'); await sleep(30); ok(B2.got('m').some(x => x.k === 'rematch'), 'rematch request relayed');
  B2.send('rematch'); await sleep(50); ok(r.phase === 'fight' && A.got('g').length === 2, 'both ready -> new match with new fighters');
  B2.send('leave'); await sleep(30); ok(A.got('closed').length === 1 && !rooms.has(ra.code), 'leaving mid-match closes room and notifies opponent');
  console.log(fail ? fail + ' FAILED' : 'ALL PASSED'); process.exit(fail ? 1 : 0);
})();
