// Headless engine test: runs the real game.js on the server engine, no sockets needed.
const { Engine } = (() => { const Module = require('module'); const orig = Module._load;
  Module._load = function (req, ...a) { if (req === 'socket.io') return { Server: function () { return { sockets: { sockets: new Map() }, on() {}, to() { return { emit() {}, volatile: { emit() {} } }; } }; } }; return orig.call(this, req, ...a); };
  const m = require('./server.js'); Module._load = orig; return m; })();
const snaps = []; const e = new Engine(j => snaps.push(j));
console.log('fighters:', e.n);
e.start(0, 1);
for (let i = 0; i < 400; i++) e.step();
let inf = e.info(); console.log('after select ->', inf.st, inf.ch);
// P1 walks right and presses attack repeatedly (counter increments), P2 idle
let c1 = [0,0,0,0,0,0,0,0,0,0], hits = 0, t0 = Date.now();
for (let i = 0; i < 1500; i++) {
  if (i % 8 === 0) c1[1]++;                              // 'a' (attack) press counter
  e.setInput(0, 1 << 1 /* r */, c1.slice()); e.setInput(1, 0, [0,0,0,0,0,0,0,0,0,0]);
  e.step();
}
inf = e.info(); console.log('after 1500 ticks:', JSON.stringify(inf), 'ms/tick', ((Date.now() - t0) / 1500).toFixed(3), 'snaps', snaps.length);
console.log('result code', e.result());
const s = JSON.parse(snaps[snaps.length - 1]); console.log('snap keys ok:', Array.isArray(s.p) && s.p.length === 2, 'bytes', snaps[snaps.length - 1].length);
process.exit(0);
