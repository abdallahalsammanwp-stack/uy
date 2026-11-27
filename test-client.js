// Client smoke test: game.js as an online client fed with real server snapshots (stubbed DOM/canvas).
const Module = require('module'), vm = require('vm'), fs = require('fs'), orig = Module._load;
Module._load = function (r, ...a) { return r === 'socket.io' ? { Server: function () { return { sockets: { sockets: new Map() }, on() {}, to() { return { emit() {}, volatile: { emit() {} } }; } }; } } : orig.call(this, r, ...a); };
const { Engine } = require('./server.js'); Module._load = orig;
const snaps = [], eng = new Engine(j => snaps.push(j));
const stub = (() => { const f = function () {}; const p = new Proxy(f, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : p, apply: () => p, construct: () => p, set: () => true }); return p; })();
const handlers = {}, sent = [];
const fakeSock = { connected: true, on(e, f) { handlers[e] = f; }, emit(e, d) { sent.push([e, d]); }, timeout() { return this; } };
const sb = { document: stub, navigator: { hardwareConcurrency: 8, deviceMemory: 8, userAgent: 'x', vibrate() {} }, performance: { now: () => Date.now() }, addEventListener() {}, requestAnimationFrame() {}, setInterval() {}, setTimeout() {}, console, crypto: require('crypto').webcrypto, sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, CPBNet: { get: () => fakeSock }, AudioContext: stub, Image: stub };
sb.window = sb; const ctx = vm.createContext(sb);
new vm.Script(fs.readFileSync('game.js', 'utf8')).runInContext(ctx);
const run = c => vm.runInContext(c, ctx);
run("sock();enterRoom({code:'ABCDE',token:'t',pi:1,phase:'fight'});ON.up=true");
eng.start(2, 3); for (let i = 0; i < 240; i++) eng.step();
run("onG({k:'start',a:2,b:3})");
let errs = 0, c = 0;
for (let i = 0; i < 400; i++) {
  eng.setInput(0, 2, [0,1,0,0,0,0,0,0,0,0].map(v => v * (i >> 3)));
  eng.step();
  if (snaps.length > c) { handlers.s(snaps[snaps.length - 1]); c = snaps.length; }
  try { run('step();render()'); } catch (e) { if (!errs++) console.log('ERR', e.stack.split('\n').slice(0, 3).join(' | ')); }
}
console.log('client state:', run('state'), 'chars:', run('P[0].ch+","+P[1].ch'), 'hp:', run('P[0].hp+","+P[1].hp'), 'inputs sent:', sent.filter(s => s[0] === 'i').length, 'errors:', errs);
run("onM({k:'match',w:[2,0],win:1})"); console.log('match overlay ok, ON.mt', run('JSON.stringify(ON.mt)'));
process.exit(errs ? 1 : 0);
