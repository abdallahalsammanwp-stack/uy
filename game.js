'use strict';
/* ===== CONFIG ===== */
const cv=document.getElementById('c'),X=cv.getContext('2d'),W=900,H=450,WORLD=1500,GY=410;
const SC={pull:'#3b82f6',repel:'#ef4444',void:'#a855f7',shred:'#ff3b6b',rush:'#fbbf24',smash:'#f97316',swap:'#22c55e',slam:'#84cc16',crimson:'#ef4444',echo:'#fbbf24',bash:'#fb923c',wave:'#fbbf24',cleave:'#ff1030',dom:'#a78bfa'};
const SN={pull:'PULL',repel:'BLAST',void:'VOID',shred:'SHRED',rush:'RUSH',smash:'SMASH',swap:'SWAP',slam:'SLAM',crimson:'CRIMSON',echo:'ECHO',bash:'BASH',cleave:'CLEAVE'};
/* Character registry: add an entry here (+ its skill case in cast()) to add a fighter. */
const CH={
 sage:{name:'SAGE',col:'#4aa3ff',skills:['pull','repel','void'],dom:'void',stats:{hp:1.17,dmg:1.14,spd:1,en:1.2,stm:1.05},mv:{lg:1,hv:1,hvC:1,dsC:1,dsS:1.1,fsC:30,pdE:35,air:3,lgC:1},look:{bs:16,ba:2.6,b:0,jc:'#1c2b57',pc:'#131b38',hr:'#f3f6ff',blind:1}},
 king:{name:'KING',col:'#ff4d6d',skills:['shred','cleave'],dom:'shrine',stats:{hp:1.03,dmg:1.05,spd:.98,en:1,stm:1},mv:{lg:1.05,hv:1.3,hvC:1.1,dsC:1.1,dsS:.9,fsC:35,pdE:20,air:3,lgC:1.1},look:{bs:14,ba:1,b:1,jc:'#efe9dd',pc:'#2b2438',hr:'#f47fb2'}},
 brawler:{name:'BRAWLER',col:'#fbbf24',skills:['rush','smash'],kit:['crimson','echo','rush'],stats:{hp:1.07,dmg:1.03,spd:1.05,en:.85,stm:1.2},mv:{lg:1,hv:1.1,hvC:.8,dsC:.9,dsS:1,fsC:30,pdE:20,air:3,lgC:.85},look:{bs:6,ba:2,b:0,jc:'#a32222',pc:'#2a1010',hr:'#ff9a3c',deco:'brawler'}},
 clapper:{name:'CLAPPER',col:'#22c55e',skills:['swap','slam'],kit:['swap','slam','bash'],stats:{hp:.95,dmg:.9,spd:1.05,en:.85,stm:1},mv:{lg:.95,hv:.9,hvC:.9,dsC:.7,dsS:1.15,fsC:20,pdE:25,air:4,lgC:.9},look:{bs:9,ba:1.8,b:0,jc:'#1f7a5a',pc:'#14342b',hr:'#1f2d3a',deco:'clapper'}}};
const CK=Object.keys(CH);
/* Skill table: c=energy cost, cd=cooldown frames (60/s). Kit characters use these on 3 buttons. */
const SKD={crimson:{c:30,cd:100},echo:{c:40,cd:140},rush:{c:50,cd:200},swap:{c:35,cd:240},slam:{c:45,cd:160},bash:{c:30,cd:120}};
const plats=[{x:0,y:GY,w:WORLD},{x:150,y:320,w:200},{x:1150,y:320,w:200},{x:600,y:300,w:300},{x:380,y:210,w:200},{x:920,y:210,w:200},{x:20,y:200,w:120},{x:1360,y:200,w:120}];
/* ===== AUDIO ===== */
const S={music:1,sfx:1,shake:1,fx:((navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=3)&&/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||(navigator.hardwareConcurrency||8)<=2?0:1,vib:1};let AC,sT=0,sC=0;
function snd(f,d,ty,v,sl,m){if(!m&&!S.sfx)return;const nw=performance.now();if(nw-sT>60){sT=nw;sC=0}if(++sC>9)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=ty||'square';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),t+d);g.gain.setValueAtTime(v||.07,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(t+d)}catch(e){}}
/* ===== INPUT ===== */
const inp=[{l:0,r:0,j:0,a:0,s:0,h:0,pa:0,hv:0,dh:0,aw:0},{l:0,r:0,j:0,a:0,s:0,h:0,pa:0,hv:0,dh:0,aw:0}],pr=[{j:0,a:0,s:0,s2:0,s3:0,d:0,n:0,hv:0,dh:0,aw:0},{j:0,a:0,s:0,s2:0,s3:0,d:0,n:0,hv:0,dh:0,aw:0}];
const KM={KeyA:[0,'l'],KeyD:[0,'r'],KeyW:[0,'j'],KeyG:[0,'a'],KeyF:[0,'s'],KeyH:[0,'s2'],KeyT:[0,'d'],Semicolon:[1,'d'],KeyY:[0,'n'],Quote:[1,'n'],KeyR:[0,'s3'],KeyE:[0,'h'],KeyL:[1,'h'],KeyQ:[0,'pa'],KeyP:[1,'pa'],Period:[1,'s2'],Comma:[1,'s3'],ArrowLeft:[1,'l'],ArrowRight:[1,'r'],ArrowUp:[1,'j'],Slash:[1,'a'],Enter:[1,'s'],KeyB:[0,'hv'],KeyV:[0,'dh'],ShiftRight:[1,'hv'],ControlRight:[1,'dh'],KeyZ:[0,'aw'],KeyO:[1,'aw']};
addEventListener('keydown',e=>{const m=KM[e.code];if(!m)return;e.preventDefault();const I=li(m[0]);inp[I][m[1]]=1;if(!e.repeat&&pr[I][m[1]]!==undefined)pr[I][m[1]]=1});
addEventListener('keyup',e=>{const m=KM[e.code];if(m)inp[li(m[0])][m[1]]=0});
(function(){const box=document.getElementById('ctl'),lay=[['a','✊'],['hv','💥'],['dh','💨'],['aw','🔥'],['s','①'],['s2','②'],['s3','③'],['d','🌑'],['n','◯'],['h','✚'],['pa','🛡']];
 ['اللاعب 1','اللاعب 2'].forEach((n,i)=>{const g=document.createElement('div');g.className='g';g.innerHTML='<b>'+n+'</b>';
  lay.forEach(([k,t])=>{const b=document.createElement('button');b.textContent=t;if(k==='h'){b.classList.add('rct');b.title='RCT'}if(k==='pa'){b.classList.add('par');b.title='PARRY'}if(k==='a'||k==='hv'||k==='dh'||k==='pa')b.classList.add('lg');
   const dn=e=>{e.preventDefault();b.classList.add('on');inp[li(i)][k]=1;if(pr[li(i)][k]!==undefined)pr[li(i)][k]=1};
   const up=e=>{e.preventDefault();b.classList.remove('on');inp[li(i)][k]=0};
   b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up);b.addEventListener('contextmenu',e=>e.preventDefault());g.appendChild(b)});
  box.appendChild(g)})})();
/* ===== STATE ===== */
let P,shots,pick,parts,shake=0,flash=0,state='menu',spT=120,tick=0,overT=0,cam={x:750,z:1},TS=1,slo=0,hs=0;
function mkP(i,ch){return{i,ch,x:i?1180:320,y:GY,vx:0,vy:0,f:i?-1:1,hp:100,en:100,sk:null,lsk:null,hit:0,at:0,sp:0,og:true,wk:0,cdA:0,cb:0,cbT:0,dcd:0,fz:0,ring:0,rcd:0,cds:{},reel:0,rs:null,rt:0,rtd:0,rtc:0,rtl:0,rtz:0,rtk:0,rtg:0,rta:0,rth:false,pw:0,stg:0,pcd:0,pv:0,pok:0,pah:false,cnt:0,cc:0,hl:0,bfq:0,bfd:0,bfc:0,bfl:0,bfs:0,bft:0,bfg:0,st:100,stD:0,stP:-99,hv:0,ds:0,dd:1,inv:0,ac:0,cmb:0,cmbT:0,sR:0,sT:'',sK:0,dtw:0,dtd:0,ld:0,fsc:0,pdw:0,cdD:0,tr:[],aw:0,awk:0,awh:false,sx:{},S:CH[ch].stats,mv:CH[ch].mv,name:CH[ch].name,col:CH[ch].col}}
function reset(a,b){P=[mkP(0,a),mkP(1,b)];dom=null;dsl=[];DM=[];CL=null;scars=[];shots=[];pick=[];parts=[];slo=0;hs=0;TS=1;state='play';spT=90;PAUSED=0;OVA=null;setMap(M&&!ON.role?M.map:0);if(M){M.bn=100;M.nx=0;M.A=null}document.getElementById('ov').style.display='none'}
P=[mkP(0,'sage'),mkP(1,'king')];shots=[];pick=[];parts=[];
function showOv(t,p,b){OVA=null;document.getElementById('ob3').style.display='none';document.getElementById('ot').textContent=t;document.getElementById('op').textContent=p;document.getElementById('ob').textContent=b;document.getElementById('ov').style.display='flex'}
document.getElementById('ob').addEventListener('click',e=>{snd(500,.1,'triangle',.08,300);ON.role?onlineRestart():(OVA?OVA():startSelect());e.target.blur()});
/* ===== EFFECTS ===== */
function burst(x,y,c,n,s){if(!S.fx)n=Math.ceil(n/2);if(parts.length>(S.fx?420:140))return;for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*s*2,vy:(Math.random()-.5)*s*2,l:18+Math.random()*16,m:34,c})}
function hurt(t,d,kx,ky,o){const pk=PRY[ATK]||0,atk=ATK,lk=LVK||SKM[ATK];ATK='none';LVK='';if(t.inv>0&&atk!=='none'&&o!==t){perfectDodge(t,o);return 1}if(t.pw>0&&pk>0&&o!==t){parrySuccess(t,o,pk);if(pk>=1)return 1;d*=.5;kx*=.4}if(t.pv>0)d*=1.3;d*=scaleHit(t,o,atk);d*=statMul(t,o,lk);if(t.rt>0&&DOMHIT){const R=RCTD[t.ch],need=d*R.rc;if(t.en>=need){t.en-=need;d*=R.rs}else endRct(t,'dry')}
 t.hp=Math.max(0,t.hp-d);t.hit=14;t.vx+=kx;t.vy+=ky;if(ky<0)t.og=false;if(!DOMHIT){t.hv=0;t.ds=0;if(d>=8){hs=Math.max(hs,Math.min(9,3+(d/5|0)));if(d>=14)slo=Math.max(slo,10)}}awGain(t,o,d);shake=Math.min(16,shake+d*.5);if(DOMHIT)snd(170,.12,'square',.1,-110);else hitSnd(d);burst(t.x,t.y-34,o.col,10+(d/2|0),6);if(!DOMHIT&&d>=6&&S.fx)rings.push({x:t.x,y:t.y-40,r:4,v:3+d*.25,l:8,c:o.col});if(!DOMHIT&&d>=8&&(t.i===0||!M||M.mode==='pvp'))vib(d>=14?45:25);
 t.rtg=150;if(o&&o!==t)o.rtg=150;if(t.rt>0&&!DOMHIT){if(d>=6)endRct(t,'hit');else t.rtz=24}return 0}
function face(p,q){p.f=(q.x-p.x)>=0?1:-1}
/* ===== SKILLS ===== */
function cast(p){const d=p.f;p.sp=22;p.lsk=p.sk;
 if(p.sk==='pull'){shots.push({t:'pull',x:p.x+d*50,y:p.y-34,vx:d*5,vy:0,r:22,life:150,o:p.i,dl:0});snd(220,.5,'sine',.12,400)}
 else if(p.sk==='repel'){shots.push({t:'repel',x:p.x+d*75,y:p.y-30,vx:0,vy:0,r:10,life:18,o:p.i,dl:0,h:0});snd(140,.35,'sawtooth',.13,-90);shake=Math.max(shake,6)}
 else if(p.sk==='void'){shots.push({t:'void',x:p.x+d*40,y:p.y-34,vx:d*7,vy:0,r:30,life:170,o:p.i,dl:0,h:0});snd(80,.9,'sawtooth',.13,700);flash=.5}
 else if(p.sk==='shred'){for(let k=0;k<5;k++)shots.push({t:'shred',x:p.x+d*30,y:p.y-14-k*12,vx:d*12,vy:0,r:10,life:75,o:p.i,dl:k*5,h:0});snd(900,.2,'square',.07,-600)}
 else if(p.sk==='rush'){for(let k=0;k<6;k++)shots.push({t:'rush',x:p.x,y:p.y-34,vx:0,vy:0,r:14,life:1,o:p.i,dl:k*4});p.vx=d*10;snd(500,.3,'sawtooth',.08,300)}
 else if(p.sk==='smash'){shots.push({t:'smash',x:p.x+d*50,y:p.y-30,vx:0,vy:0,r:10,life:18,o:p.i,dl:0,h:0,rad:90,dmg:26,kb:22});snd(110,.35,'sawtooth',.14,-60);shake=Math.max(shake,8)}
 else if(p.sk==='slam'){shots.push({t:'slam',x:p.x,y:p.y-30,vx:0,vy:0,r:10,life:18,o:p.i,dl:0,h:0,rad:130,dmg:18,kb:15});snd(200,.15,'square',.1,-60);snd(120,.3,'sawtooth',.1,-60)}
 else if(p.sk==='swap'){const q=P[1-p.i],tx=p.x,ty=p.y;burst(p.x,p.y-30,SC.swap,24,8);burst(q.x,q.y-30,SC.swap,24,8);p.x=q.x;p.y=q.y;q.x=tx;q.y=ty;p.vy=q.vy=0;hurtS('swap',q,5,0,0,p);flash=.7;warp=12;rings.push({x:p.x,y:p.y-30,r:10,v:6,l:18,c:'#22c55e'},{x:q.x,y:q.y-30,r:10,v:6,l:18,c:'#22c55e'});face(p,q);p.at=14;p.cb=2;p.cdA=20;pop(p.x,p.y-90,'SWAP!','#22c55e');snd(700,.15,'square',.1,-300);snd(300,.2,'square',.1,400)}
 else if(p.sk==='crimson'){const q=P[1-p.i],crit=Math.random()<.3;p.vx=d*6;for(let k=0;k<5;k++)bolts.push(mkBolt(p.x+d*30,p.y-44,d,k%2?'#ef4444':'#111'));if(Math.abs(q.x-p.x)<100&&Math.abs(q.y-p.y)<60&&(q.x-p.x)*d>-10){if(!hurtA('crimson',q,crit?36:18,d*(crit?24:15),-6,p)){if(crit){pop(q.x,q.y-90,'CRITICAL!','#ff2d2d');flash=.8;shake=16}else pop(q.x,q.y-90,'STRIKE!','#ef4444');burst(q.x,q.y-40,'#ef4444',24,9)}}snd(90,.25,'sawtooth',.14,300);snd(1200,.1,'square',.06,-900)}
 else if(p.sk==='echo'){const q=P[1-p.i];if(Math.abs(q.x-p.x)<90&&Math.abs(q.y-p.y)<60&&(q.x-p.x)*d>-10)hurtA('echo',q,10,d*8,-3,p);rings.push({x:p.x+d*40,y:p.y-40,r:6,v:4,l:14,c:'#fbbf24'});shots.push({t:'wave',x:p.x+d*50,y:p.y-38,vx:d*9,vy:0,r:18,life:70,o:p.i,dl:14,h:0,dmg:12});snd(300,.2,'sawtooth',.1,-100)}
 else if(p.sk==='bash'){shots.push({t:'rush',x:p.x,y:p.y-34,vx:0,vy:0,r:14,life:1,o:p.i,dl:7,dmg:20,kb:22});p.vx=d*13;rings.push({x:p.x+d*30,y:p.y-40,r:6,v:5,l:12,c:'#fb923c'});snd(160,.3,'square',.12,-80)}
 else if(p.sk==='cleave'){const q=P[1-p.i];shots.push({t:'cleave',x:q.x,y:q.y-34,vx:0,vy:0,r:10,life:1,o:p.i,dl:14,dmg:16});snd(500,.3,'sawtooth',.08,300)}}
function shotsUpd(){for(const s of shots){if(s.dl>0){s.dl--;continue}const q=P[1-s.o],o=P[s.o];if(s.t==='rush'){s.x=o.x+o.f*40;s.y=o.y-34;if(Math.abs(q.x-o.x)>55)o.vx=o.f*8}s.x+=s.vx;s.y+=s.vy;s.life--;
  const cx=q.x,cy=q.y-30,d=Math.hypot(cx-s.x,cy-s.y);
  if(s.t==='pull'){if(s.life<90)s.vx*=.94;if(d<320&&d>16){const a=Math.atan2(s.y-cy,s.x-cx);q.vx+=Math.cos(a)*.9;q.vy+=Math.sin(a)*.35}
   if(d<s.r+22&&s.life%15===0)hurtS('pull',q,3,0,0,o);if(tick%2===0)parts.push({x:s.x+Math.cos(tick/3)*40,y:s.y+Math.sin(tick/3)*40,vx:(s.x-cx)*0,vy:0,l:10,m:10,c:SC.pull})}
  else if(s.t==='repel'||s.t==='smash'||s.t==='slam'){s.r+=5;if(!s.h){s.h=1;if(d<(s.rad||115))hurtA(s.t,q,s.dmg||15,(cx>=s.x?1:-1)*(s.kb||17),-7,o);burst(s.x,s.y,SC[s.t],30,9)}}else if(s.t==='rush'){if(d<80){hurtA('rush',q,s.dmg||3,o.f*(s.kb||4),-1,o);burst(s.x,s.y,SC.rush,6,5)}}else if(s.t==='cleave'){addSlash({x:s.x,y:s.y+34},3);shake=Math.max(shake,8);snd(120,.2,'sawtooth',.12,-60);if(d<95)hurtS('cleave',q,s.dmg,(cx>=s.x?1:-1)*8,-4,o)}
  else if(s.t==='void'){parts.push({x:s.x,y:s.y+(Math.random()-.5)*30,vx:0,vy:0,l:14,m:14,c:SC.void});if(!s.h&&d<s.r+22){s.h=1;hurtS('void',q,35,Math.sign(s.vx)*20,-8,o);burst(s.x,s.y,SC.void,40,10);flash=1;s.life=0}}
  else if(s.t==='shred'||s.t==='wave'){if(!s.h&&Math.abs(cx-s.x)<(s.t==='wave'?30:24)&&Math.abs(cy-s.y)<46){s.h=1;const pd=hurtA(s.t,q,s.dmg||5,Math.sign(s.vx)*(s.t==='wave'?10:6),-2,o);s.life=0;if(s.t==='shred'&&!pd)addSlash(q,2)}}}
 shots=shots.filter(s=>s.life>0)}
/* ===== PICKUPS ===== */
function spawn(){if(--spT>0)return;spT=170+(Math.random()*130|0);if(pick.length>=3)return;const nk=[0,1].filter(i=>!CH[P[i].ch].kit);if(!nk.length)return;const o=nk[Math.random()*nk.length|0],ty=CH[P[o].ch].skills;pick.push({x:90+Math.random()*(WORLD-180),y:-40,vy:0,type:ty[Math.random()*ty.length|0],o,life:900,g:0})}
function pickups(){for(const k of pick){k.life--;if(!k.g){const y0=k.y;k.vy=Math.min(4,k.vy+.12);k.y+=k.vy;for(const pl of plats){if(k.x>pl.x&&k.x<pl.x+pl.w&&y0<=pl.y-14&&k.y>=pl.y-14){k.y=pl.y-14;k.g=1;burst(k.x,k.y,SC[k.type],14,4);break}}}
  const p=P[k.o];if(!p.sk&&!p.reel&&Math.abs(p.x-k.x)<28&&Math.abs(p.y-30-k.y)<46){p.reel=55;p.rs=k.type;k.life=0;snd(600,.18,'triangle',.1,500);burst(k.x,k.y,'#ffd34d',20,6)}}
 pick=pick.filter(k=>k.life>0)}
/* ===== PLAYERS ===== */
function ctl(p){const c=inp[p.i],r=pr[p.i],q=P[1-p.i],dir=c.r-c.l;if(p.fz>0){p.fz--;p.vx*=.6;p.hv=0;p.ds=0;return}if(p.reel>0){if(p.reel%6===0)snd(500+Math.random()*400,.05,'square',.05);if(--p.reel===0){p.sk=p.rs;snd(800,.25,'triangle',.1,600);burst(p.x,p.y-40,SC[p.sk],20,6)}}
 p.vx+=(dir*4.4*p.S.spd*(p.awk>0?1.12:1)*(p.rt>0?.45:p.pw>0?.5:1)-p.vx)*(p.og?.22:.1);if(dir)p.f=dir;if(Math.abs(p.vx)>.6&&p.og)p.wk+=Math.abs(p.vx)*.09;
 if(r.j&&p.og&&!(p.rt>0)){p.vy=-12.6;p.og=false;snd(420,.12,'triangle',.06,250)}
 if(r.a&&p.cdA<=0&&!(p.pw>0)&&p.hv<=0&&!(p.ds>4)&&stam(p,p.og?5:6)){p.cb=(p.cbT>0?p.cb+1:0)%3;p.cbT=40;p.cdA=Math.round((p.cb===2?30:20)*p.mv.lgC);p.at=14;p.hl=0;p.bfq=0;p.bfd=0;p.cc=0;if(p.cnt>0){p.cc=1;p.cnt=0;p.at=10;p.cdA=14}face(p,q);snd(260,.07,'triangle',.07,-120)}else if(r.a&&p.at>0&&!(p.pw>0))bfAttempt(p);
 if(p.at===8){const dx=Math.abs(q.x-p.x),dy=Math.abs(q.y-p.y);if(dx<66&&dy<50&&(q.x-p.x)*p.f>-10&&q.hit<6){const cn=p.cc;const ms=meleeStats(p,cn);if(!hurtA('melee',q,ms[0],ms[1],ms[2],p)){p.hl=1;if(ms[3])pop(q.x,q.y-90,ms[3],'#7dd3fc');if(cn)pop(q.x,q.y-90,'COUNTER!','#fde047');else if(p.cb===2)pop(q.x,q.y-90,'COMBO!','#fbbf24');if(p.bfq)bfStrike(p,q)}}else if(p.bfq)bfWhiff(p)}
 if(r.s&&p.sk&&p.en>=100){face(p,q);cast(p);p.sk=null;p.en=0}
 moveX(p,q,r,c,dir);
 const kit=CH[p.ch].kit;if(kit)['s','s2','s3'].forEach((kk,n)=>{const sk=kit[n];if(r[kk]&&sk&&p.en>=SKD[sk].c&&!(p.cds[sk]>0)){face(p,q);p.sk=sk;cast(p);p.sk=null;p.en-=SKD[sk].c;p.cds[sk]=SKD[sk].cd}});if(r.d&&CH[p.ch].dom)tryDomain(p);if(r.n)tryRing(p);
 if(!(p.rt>0))p.en=Math.min(100,p.en+.34*p.S.en*(p.awk>0?2:1))}
function phys(p){p.vy=Math.min(16,p.vy+.55);const y0=p.y;p.x+=p.vx;p.y+=p.vy;p.og=false;
 if(p.vy>=0)for(const pl of plats){if(p.x+10>pl.x&&p.x-10<pl.x+pl.w&&y0<=pl.y+1&&p.y>=pl.y){p.y=pl.y;p.vy=0;p.og=true;break}}
 p.x=Math.max(18,Math.min(WORLD-18,p.x));if(p.hit>0)p.hit--;if(p.cbT>0)p.cbT--;if(p.dcd>0)p.dcd--;if(p.rcd>0)p.rcd--;if(p.ring>0)p.ring--;for(const k in p.cds)if(p.cds[k]>0)p.cds[k]--;if(p.cdA>0)p.cdA--;if(p.at>0)p.at--;if(p.sp>0)p.sp--}
function step(){tick++;if(PAUSED&&!ON.role)return;if(slo>0)slo--;TS=ON.role==='guest'?1:TS+((slo>0?.35:1)-TS)*.25;if(state==='select')selStep();
 if(ON.role==='guest'&&state!=='select'&&(ON.snap||state==='play'||state==='over')){guestStep();return}
 if(ON.role==='host'){if(ON.paused&&state==='play')return;if(state==='play')netPre()}
 if(hs>0&&state==='play'){hs--;shake*=.92;return}
 if(state==='play'){if(M&&!ON.role)modeStep();P.forEach(parryIn);P.forEach(ctl);P.forEach(rctStep);P.forEach(sysStep);spawn();pickups();shotsUpd();DOMHIT=1;domStep();DOMHIT=0;
  if((P[0].hp<=0||P[1].hp<=0)&&!(M&&!ON.role&&M.mode==='train')){state='over';overT=70;slo=50;nz(.7,.25,200);snd(60,.8,'sawtooth',.2,-30);dom=null;DM=[];CL=null;shake=14;flash=1}}
 P.forEach(phys);
 if(state==='over'&&--overT===0&&M&&!ON.role)roundEnd();else if(state==='over'&&overT===0){const w=P[0].hp>0?'اللاعب 1 ('+P[0].name+')':'اللاعب 2 ('+P[1].name+')';showOv('🏆 فاز '+w,'معركة رائعة!','إعادة اللعب')}
 if(state==='over'&&M&&!ON.role&&M.nx>0&&--M.nx===0&&OVA)OVA();
 for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.l--}parts=parts.filter(p=>p.l>0);
 bolts.forEach(b=>b.l--);bolts=bolts.filter(b=>b.l>0);rings.forEach(r=>{r.r+=r.v;r.l--});rings=rings.filter(r=>r.l>0);capFx();pops.forEach(o=>{o.y-=.8;o.l--});pops=pops.filter(o=>o.l>0);warp*=.9;dsl.forEach(s=>s.l--);dsl=dsl.filter(s=>s.l>0);scars.forEach(s=>s.l--);scars=scars.filter(s=>s.l>0);
 shake*=.9;flash*=.9;if(bff>0)bff--;pr.forEach(o=>{o.j=o.a=o.s=o.s2=o.s3=o.d=o.n=o.hv=o.dh=o.aw=0});if(ON.role==='host'&&(state==='play'||state==='over')&&tick%3===0)sendSnap()}
/* ===== BACKGROUND (parallax) ===== */
const rnd=(function(){let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();
const far=[],mid=[];for(let i=0;i<40;i++)far.push({x:i*110,w:60+rnd()*70,h:80+rnd()*140});
for(let i=0;i<24;i++)mid.push({x:i*190,w:50+rnd()*50,h:120+rnd()*120,t:rnd()<.4});
function layer(a,sp,f,c,gy,det){const per=a.length*sp;for(const b of a){const sx=((b.x-cam.x*f)%per+per)%per-120;X.fillStyle=c;X.fillRect(sx,gy-b.h,b.w,b.h+300);
  if(det){if(b.t){X.beginPath();X.moveTo(sx-8,gy-b.h);X.lineTo(sx+b.w/2,gy-b.h-40);X.lineTo(sx+b.w+8,gy-b.h);X.fill()}else{X.fillStyle='#ffb84d55';for(let k=0;k<3;k++)X.fillRect(sx+8+k*14,gy-b.h+14+(k%2)*22,6,9)}}}}
function bg(){const gy=250+160*cam.z,m=MP;let g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,m.sky[0]);g.addColorStop(.6,m.sky[1]);g.addColorStop(1,m.sky[2]);X.fillStyle=g;X.fillRect(0,0,W,H);
 const mx=700-cam.x*.03;g=X.createRadialGradient(mx,80,10,mx,80,110);g.addColorStop(0,m.moon+'cc');g.addColorStop(1,m.moon+'00');X.fillStyle=g;X.fillRect(mx-110,0,220,200);
 X.fillStyle=m.moon;X.beginPath();X.arc(mx,80,32,0,7);X.fill();
 layer(far,110,.12,m.far,gy,false);layer(mid,190,.3,m.mid,gy,true);
 g=X.createLinearGradient(0,gy-70,0,gy+10);g.addColorStop(0,m.glow+'00');g.addColorStop(1,m.glow+'44');X.fillStyle=g;X.fillRect(0,gy-70,W,80);bgFx(m)}
/* ===== DRAW CHARACTERS ===== */
function drawChar(p){const LK=CH[p.ch].look,k=LK.b,air=!p.og,mv=Math.abs(p.vx)>.6&&!air,sw=mv?Math.sin(p.wk)*13:0,hl=p.rt>0&&!(p.at>0)&&!(p.sp>0)&&!(p.fz>0)&&!(p.hv>0),bob=hl?2+Math.sin(tick/6)*1.5:(!mv&&!air?Math.sin(tick/(LK.bs||12))*(LK.ba||1.5):0);
 const jc=LK.jc,pc=LK.pc,skn='#f2d0b0',hr=LK.hr;
 X.save();X.translate(p.x,p.y);X.scale(p.f,1);{const ln=p.ds>0?.38:p.hit>10?-.28:p.hv>14?-.18:p.hv>0?.26:mv?.1:0;if(ln){X.translate(0,-26);X.rotate(ln);X.translate(0,26)}}if(p.hit>0&&p.hit%4<2)X.globalAlpha=.5;else if(p.inv>0)X.globalAlpha=.6;X.lineCap='round';
 if(p.sk){const g=X.createRadialGradient(0,-32,5,0,-32,48);g.addColorStop(0,SC[p.sk]+'77');g.addColorStop(1,SC[p.sk]+'00');X.fillStyle=g;X.fillRect(-52,-84,104,108)}
 const L=air?(p.vy<0?[[9,-12],[-7,-7]]:[[10,-1],[-10,-1]]):[[sw,0],[-sw,0]];
 X.strokeStyle=pc;X.lineWidth=9;L.forEach(f=>{X.beginPath();X.moveTo(0,-26+bob);X.lineTo(f[0],f[1]);X.stroke()});
 X.fillStyle='#0c0c14';L.forEach(f=>X.fillRect(f[0]-3,f[1]-4,11,5));
 const arm=(sx,sy,ex,ey)=>{X.strokeStyle=jc;X.lineWidth=7;X.beginPath();X.moveTo(sx,sy);X.lineTo(ex,ey);X.stroke();X.fillStyle=skn;X.beginPath();X.arc(ex,ey,4.5,0,7);X.fill()};
 if(hl){arm(-6,-47+bob,16,-43+bob);if(k)arm(-5,-40+bob,13,-37+bob)}else{arm(-6,-47+bob,-8-sw*.5,-28+bob);if(k)arm(-5,-40+bob,-12,-24+bob)}
 X.fillStyle=jc;X.beginPath();X.moveTo(-12,-50+bob);X.lineTo(12,-50+bob);X.lineTo(10,-24+bob);X.lineTo(-10,-24+bob);X.closePath();X.fill();
 if(k){X.fillStyle='#1a1424';X.fillRect(-12,-34+bob,24,5);X.fillRect(-2,-50+bob,4,26)}else{X.fillStyle='#0d1430';X.fillRect(-12,-52+bob,24,7);X.fillRect(-10,-33+bob,20,4)}
 X.fillStyle=skn;X.beginPath();X.arc(1,-63+bob,11,0,7);X.fill();
 X.fillStyle=hr;X.beginPath();
 if(k){[[-12,-62],[-9,-80],[-3,-72],[2,-84],[7,-73],[13,-80],[12,-63],[9,-68],[-8,-68]].forEach((v,i)=>i?X.lineTo(v[0],v[1]+bob):X.moveTo(v[0],v[1]+bob))}
 else{[[-13,-60],[-14,-76],[-6,-70],[-4,-87],[2,-72],[8,-86],[10,-71],[15,-78],[13,-62],[9,-68],[-9,-68]].forEach((v,i)=>i?X.lineTo(v[0],v[1]+bob):X.moveTo(v[0],v[1]+bob))}
 X.closePath();X.fill();
 if(k){X.fillStyle='#c01040';X.fillRect(3,-64+bob,7,2);X.strokeStyle='#7a1030';X.lineWidth=1.5;X.beginPath();X.moveTo(4,-58+bob);X.lineTo(9,-58+bob);X.moveTo(4,-55+bob);X.lineTo(9,-55+bob);X.stroke()}
 else if(LK.blind){X.fillStyle='#0b0b14';X.fillRect(-9,-67+bob,21,6)}
 if(LK.deco==='brawler'){X.fillStyle='#fff';X.fillRect(-11,-71+bob,24,4);X.fillStyle='#222';X.fillRect(5,-65+bob,3,3)}else if(LK.deco==='clapper'){X.fillStyle='#ff9f1c';X.fillRect(-10,-54+bob,22,5);X.fillStyle='#7dd3fc';X.fillRect(-1,-66+bob,12,5)}drawTail(LK,bob,sw);
 let ex,ey;if(p.hv>0){const k2=1-p.hv/26;ex=k2<.45?8-k2*40:-10+(k2-.45)*110;if(ex>46)ex=46;ey=-46+bob-(k2<.45?k2*20:0)}else if(p.pw>0){ex=22;ey=-54}else if(p.ds>0){ex=-14;ey=-40}else if(p.at>0){ex=10+Math.sin((1-p.at/14)*3.14)*34;ey=-44+bob}else if(p.sp>0){const cl=p.lsk==='swap'||p.lsk==='dom';ex=cl?14:30;ey=cl?-46:-58}else if(hl){ex=19+Math.sin(tick/6)*2;ey=-44+bob+Math.cos(tick/6)*1.5}else if(air){ex=16;ey=-62}else{ex=8+sw*.5;ey=-28+bob}
 arm(6,-47+bob,ex,ey);if(k)arm(5,-40+bob,ex-4,ey+10);
 if(p.hv>0&&p.hv<=16){X.strokeStyle='#fff';X.lineWidth=5;X.beginPath();X.arc(14,-44,40,-1.1,1.1);X.stroke()}
 if(p.at>5&&p.at<13){X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.arc(18,-44,30,-.9,.9);X.stroke();for(let q=0;q<3;q++){X.beginPath();X.moveTo(-8-q*8,-52+q*8);X.lineTo(-40-q*10,-52+q*8);X.stroke()}}
 if(p.sp>0&&p.lsk){const g=X.createRadialGradient(ex,ey,2,ex,ey,22);g.addColorStop(0,SC[p.lsk]);g.addColorStop(1,SC[p.lsk]+'00');X.fillStyle=g;X.fillRect(ex-22,ey-22,44,44)}if(hl)rctHands(p,ex,ey,bob);
 X.restore()}
/* ===== DRAW WORLD ===== */
function drawShot(s){if(s.dl>0){if(s.t==='cleave'){X.save();X.globalAlpha=.4+.4*Math.sin(tick);X.strokeStyle='#ff1030';X.lineWidth=2;X.beginPath();X.moveTo(s.x-40,s.y-40);X.lineTo(s.x+40,s.y+40);X.moveTo(s.x+40,s.y-40);X.lineTo(s.x-40,s.y+40);X.stroke();X.restore()}return}X.save();X.globalCompositeOperation='lighter';const c=SC[s.t];
 if(s.t==='shred'){const d=Math.sign(s.vx);X.fillStyle=c;X.beginPath();X.moveTo(s.x-d*38,s.y+14);X.lineTo(s.x+d*10,s.y-1);X.lineTo(s.x-d*38,s.y-14);X.lineTo(s.x-d*18,s.y);X.closePath();X.fill();for(let i=1;i<4;i++){X.globalAlpha=.18;X.beginPath();const ox=s.x-d*i*16;X.moveTo(ox-d*38,s.y+14);X.lineTo(ox+d*10,s.y-1);X.lineTo(ox-d*38,s.y-14);X.closePath();X.fill()}X.globalAlpha=1;X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.moveTo(s.x-d*30,s.y);X.lineTo(s.x+d*10,s.y-1);X.stroke()}
 else if(s.t==='repel'||s.t==='smash'||s.t==='slam'){const g=X.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,'#fff');g.addColorStop(.4,c+'cc');g.addColorStop(1,c+'00');X.fillStyle=g;X.beginPath();X.arc(s.x,s.y,s.r,0,7);X.fill();X.strokeStyle=c;X.lineWidth=4;X.beginPath();X.arc(s.x,s.y,s.r,0,7);X.stroke()}
 else{const g=X.createRadialGradient(s.x,s.y,2,s.x,s.y,s.r*1.6);g.addColorStop(0,'#fff');g.addColorStop(.35,c);g.addColorStop(1,c+'00');X.fillStyle=g;X.beginPath();X.arc(s.x,s.y,s.r*1.6,0,7);X.fill();
  X.strokeStyle='#fff8';X.lineWidth=2;for(let i=0;i<3;i++){X.beginPath();X.arc(s.x,s.y,s.r*(.5+i*.3),tick/5+i,tick/5+i+3);X.stroke()}}
 X.restore()}
function drawWorld(){
 X.fillStyle='#07050f';X.fillRect(-500,-600,500,1500);X.fillRect(WORLD,-600,500,1500);
 for(const pl of plats){const g=pl.y===GY;X.fillStyle=g?MP.gnd:MP.pf;X.fillRect(pl.x,pl.y,pl.w,g?400:14);X.fillStyle=MP.edge;X.fillRect(pl.x,pl.y,pl.w,3);
  if(!g){X.strokeStyle=MP.sup;X.lineWidth=2;for(let x=pl.x+20;x<pl.x+pl.w;x+=40){X.beginPath();X.moveTo(x,pl.y+14);X.lineTo(x-6,pl.y+26);X.stroke()}}}
 for(const k of pick){const c='#ffd34d',pu=Math.sin(tick/8)*3;X.save();X.globalCompositeOperation='lighter';
  const bg=X.createLinearGradient(0,k.y-500,0,k.y);bg.addColorStop(0,c+'00');bg.addColorStop(1,c+'55');X.fillStyle=bg;X.fillRect(k.x-8,k.y-500,16,500);
  const g=X.createRadialGradient(k.x,k.y,2,k.x,k.y,22+pu);g.addColorStop(0,'#fff');g.addColorStop(.4,c);g.addColorStop(1,c+'00');X.fillStyle=g;X.beginPath();X.arc(k.x,k.y,22+pu,0,7);X.fill();X.restore();
  X.fillStyle='#fff';X.font='700 11px system-ui';X.textAlign='center';X.fillText('? SLOT',k.x,k.y-26)}
 P.forEach(drawAura);P.forEach(drawTrail);P.forEach(drawChar);P.forEach(drawRct);P.forEach(drawPar);P.forEach(drawBFg);P.forEach(drawBFwin);P.forEach(p=>{if(p.reel>0){X.fillStyle=SC[rk(p)];X.font='700 14px system-ui';X.textAlign='center';X.fillText('🎰 '+SN[rk(p)],p.x,p.y-96)}});shots.forEach(drawShot);drawFx();drawDom();
 X.save();X.globalCompositeOperation='lighter';for(const p of parts){X.globalAlpha=Math.max(0,p.l/p.m);X.fillStyle=p.c;X.beginPath();X.arc(p.x,p.y,3,0,7);X.fill()}X.restore()}
function hud(){for(const p of P){const l=p.i===0,x=l?16:W-316;X.fillStyle='#000a';X.fillRect(x-2,10,304,66);portrait(p.ch,l?x+308:x-60);if(CH[p.ch].kit)kitHud(p,x,l);if(CH[p.ch].dom)domHud(p,x,l);ringHud(p,x,l);rctHud(p,x,l);sysHud(p,x,l);awHud(p,x,l);
  X.fillStyle='#2a2540';X.fillRect(x,14,300,14);const w=300*p.hp/100;X.fillStyle=p.hp>30?p.col:'#ff2d2d';X.fillRect(l?x:x+300-w,14,w,14);if(p.rt>0){X.fillStyle='rgba(255,255,255,'+(.25+.2*Math.sin(tick/4))+')';X.fillRect(l?x:x+300-w,14,w,14)}
  X.fillStyle='#2a2540';X.fillRect(x,32,300,7);const ew=300*p.en/100;X.fillStyle=p.en>=100?'#fff':'#a855f7';X.fillRect(l?x:x+300-ew,32,ew,7);const sw=300*p.st/100;X.fillStyle=p.st<20?'#ef4444':'#34d399';X.fillRect(l?x:x+300-sw,40,sw,3);
  X.fillStyle='#fff';X.font='700 12px system-ui';X.textAlign=l?'left':'right';X.fillText(p.name+'  HP '+Math.ceil(p.hp),l?x:x+300,54);
  const rl=p.reel>0?rk(p):null;X.fillStyle=rl?SC[rl]:p.sk?SC[p.sk]:'#aaa';X.fillText(rl?'🎰 SPINNING: '+SN[rl]:p.sk?'SKILL: '+SN[p.sk]+(p.en>=100?' — READY':' — charging'):'SKILL: none',l?x:x+300,70)}}
function render(){if(state==='menu'){menuScene();return}if(state==='select'){selScene();return}const a=P[0],b=P[1],dist=Math.abs(a.x-b.x),tz=Math.min(1.05,Math.max(.62,W/(dist+420)));
 cam.z+=(tz-cam.z)*.06;const hv=W/2/cam.z;cam.x+=(Math.min(WORLD-hv,Math.max(hv,(a.x+b.x)/2))-cam.x)*.1;
 bg();domBg();X.save();X.translate(W/2+(Math.random()-.5)*shake*S.shake,250+(Math.random()-.5)*shake*S.shake);X.scale(cam.z,cam.z);if(warp>.5)X.transform(1,0,Math.sin(tick*1.3)*.012*warp,1,0,0);X.translate(-cam.x,-250);drawWorld();X.restore();domOver();
 BFOV();if(flash>.02){X.fillStyle='rgba(255,255,255,'+Math.min(.6,flash*.6)+')';X.fillRect(0,0,W,H)}vigDraw();hud();matchHud();qHud();drawJoy();netHud()}
/* ===== TOUCH JOYSTICKS: left half = P1, right half = P2 ===== */
const joy=[null,null];cv.style.touchAction='none';
function jpt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;e.preventDefault();const p=jpt(e),i=ON.role||solo()?0:(p.x<W/2?0:1);if(joy[i])return;joy[i]={id:e.pointerId,ox:p.x,oy:p.y,x:p.x,y:p.y,up:0};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{for(let i=0;i<2;i++){const j=joy[i];if(!j||j.id!==e.pointerId)continue;const p=jpt(e);let dx=p.x-j.ox,dy=p.y-j.oy;const d=Math.hypot(dx,dy);if(d>50){dx*=50/d;dy*=50/d}j.x=j.ox+dx;j.y=j.oy+dy;inp[i].l=dx<-14?1:0;inp[i].r=dx>14?1:0;if(dy<-30){if(!j.up){pr[i].j=1;j.up=1}}else j.up=0;if(dy>30){if(!j.dn){pr[i].dh=1;j.dn=1}}else j.dn=0}});
const jend=e=>{for(let i=0;i<2;i++){const j=joy[i];if(j&&j.id===e.pointerId){joy[i]=null;inp[i].l=inp[i].r=0}}};
cv.addEventListener('pointerup',jend);cv.addEventListener('pointercancel',jend);
function drawJoy(){for(const j of joy){if(!j)continue;X.fillStyle='#ffffff22';X.beginPath();X.arc(j.ox,j.oy,50,0,7);X.fill();X.fillStyle='#ffffff88';X.beginPath();X.arc(j.x,j.y,22,0,7);X.fill()}}
/* ===== MENU / RANDOM SELECT / MUSIC ===== */
let sel=null;const $=id=>document.getElementById(id);
function dmy(ch,off,still){const a=(tick+off)%110;return{ch,i:0,x:0,y:0,vx:0,vy:0,f:1,hit:0,at:!still&&a<14?14-a:0,sp:0,og:true,wk:0,sk:null,lsk:null,reel:0}}
function rk(p){const s=CH[p.ch].skills;return s[(tick>>2)%s.length]}
function portrait(ch,px){X.save();X.beginPath();X.rect(px,10,52,66);X.clip();X.fillStyle='#000a';X.fillRect(px,10,52,66);X.translate(px+26,72);X.scale(.62,.62);drawChar(dmy(ch,0,1));X.restore()}
function menuScene(){cam.x=750+Math.sin(tick/260)*180;cam.z=1;bg();const n=CK.length;
 X.save();X.globalCompositeOperation='lighter';X.fillStyle='rgba(167,139,250,.06)';for(let r=0;r<4;r++){const x0=(r*260+tick*.6)%(W+300);X.beginPath();X.moveTo(x0,0);X.lineTo(x0+60,0);X.lineTo(x0-200,H);X.lineTo(x0-260,H);X.fill()}X.restore();
 X.fillStyle='#140f2a';X.fillRect(0,400,W,50);X.fillStyle='#7c3aed';X.fillRect(0,400,W,3);
 CK.forEach((k,i)=>{const left=i<n/2,x=left?90+i*130:W-90-(n-1-i)*130,c=CH[k].col;
  X.save();X.globalCompositeOperation='lighter';X.globalAlpha=.5+.4*Math.sin(tick/20+i);const g=X.createRadialGradient(x,320,10,x,320,130);g.addColorStop(0,c+'99');g.addColorStop(1,c+'00');X.fillStyle=g;X.fillRect(x-130,190,260,260);X.restore();
  const d=dmy(k,i*27);d.f=left?1:-1;X.save();X.translate(x,400);X.scale(1.7,1.7);drawChar(d);X.restore()});
 X.save();for(let j=0;j<40;j++){X.globalAlpha=.7;X.fillStyle=j%2?'#a78bfa':'#f472b6';X.fillRect((j*127+tick*(.3+j%3*.2))%W,H-((tick*(.6+j%4*.3)+j*53)%H),2,2+j%3)}X.restore();
 const g=X.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.65);g.addColorStop(0,'#0000');g.addColorStop(1,'#000c');X.fillStyle=g;X.fillRect(0,0,W,H);
 X.fillStyle='#000';X.fillRect(0,0,W,30);X.fillRect(0,H-30,W,30);
 const f=tick%300;if(f<10){X.fillStyle='rgba(255,255,255,'+(.4-f*.04)+')';X.fillRect(0,0,W,H)}}
function selScene(){const s=sel,n=CK.length;cam.x=750;cam.z=1;bg();X.fillStyle='#000a';X.fillRect(0,0,W,H);
 X.fillStyle='#fff';X.font='900 22px system-ui';X.textAlign='center';X.fillText('RANDOM SELECT',W/2,36);
 const gap=14,cw=(W-60-(n-1)*gap)/n,ch=250,y=60,p1=s.t<80?s.ca:s.a,p2=s.t<80?-1:(s.t<160?s.cb:s.b);
 for(let i=0;i<n;i++){const k=CK[i],x=30+i*(cw+gap),c=CH[k].col,on1=i===p1,on2=i===p2;
  X.fillStyle=(i===s.a&&s.t>=80&&!on1)?'#0a0816':'#150f2c';X.fillRect(x,y,cw,ch);
  X.lineWidth=on1||on2?5:2;X.strokeStyle=on1&&on2?'#fff':on1?'#4aa3ff':on2?'#ff4d6d':c+'66';X.strokeRect(x,y,cw,ch);
  if(on1||on2){X.fillStyle=(on1?'#4aa3ff':'#ff4d6d')+'33';X.fillRect(x,y,cw,ch)}
  X.save();X.translate(x+cw/2,y+ch-70);X.scale(1.6,1.6);drawChar(dmy(k,i*20));X.restore();
  X.textAlign='center';X.fillStyle='#fff';X.font='800 16px system-ui';X.fillText(CH[k].name,x+cw/2,y+ch-40);
  X.font='11px system-ui';X.fillStyle=c;X.fillText((CH[k].kit||CH[k].skills).map(q=>SN[q]).join(' · '),x+cw/2,y+ch-22);
  X.font='900 14px system-ui';if(on1){X.fillStyle='#4aa3ff';X.fillText('P1',x+cw/2,y+20)}if(on2){X.fillStyle='#ff4d6d';X.fillText('P2',x+cw/2,y+(on1?38:20))}}
 let m='';if(s.t>=80&&s.t<160)m='P1: '+CH[CK[s.a]].name;if(s.t>=160)m='P1: '+CH[CK[s.a]].name+'   VS   P2: '+CH[CK[s.b]].name;
 X.fillStyle='#fff';X.font='800 20px system-ui';X.textAlign='center';X.fillText(m,W/2,H-60);
 if(s.t>=160){X.font='12px system-ui';X.fillStyle='#c4b5fd';X.fillText('الجولة تبدأ...',W/2,H-36)}}
function startSelect(fa,fb){if(ON.role)M=null;else if(M){M.w=[0,0];M.rd=1;M.over=0;M.A=null;M.T=null;M.last=-1}PAUSED=0;setMap(M&&!ON.role?M.map:0);document.body.classList.toggle('solo',solo());$('ov').style.display='none';$('ob').disabled=false;$('menu').style.display='none';inp.forEach(o=>{o.l=o.r=0});
 const n=CK.length,a=fa!==undefined?fa:Math.random()*n|0,b=fb!==undefined?fb:(a+1+(Math.random()*(n-1)|0))%n;sel={a,b,t:0,ca:0,cb:0};state='select'}
function selStep(){const s=sel,n=CK.length;s.t++;
 if(s.t<80){const iv=2+(s.t>>4);if(s.t%iv===0){s.ca=(s.ca+1)%n;snd(300+s.ca*80,.04,'square',.04)}if(s.t===79){s.ca=s.a;snd(700,.2,'triangle',.1,500);shake=8}}
 else if(s.t<160){const t=s.t-80,iv=2+(t>>4);if(t%iv===0){do{s.cb=(s.cb+1)%n}while(s.cb===s.a);snd(300+s.cb*80,.04,'square',.04)}if(s.t===159){s.cb=s.b;snd(700,.2,'triangle',.1,500);shake=8}}
 else if(s.t===230){if(M){M.a=s.a;M.b=s.b}reset(CK[s.a],CK[s.b])}}
function toMenu(){state='menu';M=null;PAUSED=0;PB=false;$('pause').style.display='none';document.body.classList.remove('solo');setMap(0);$('ov').style.display='none';$('menu').style.display='flex'}
const NT=[0,3,7,10,12,10,7,3],BS=[0,0,-2,-5];let mus=null,ms=0;
function musicOn(){if(mus||!S.music)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){return}
 mus=setInterval(()=>{if(!S.music)return;const n=NT[ms%8],b=BS[(ms>>3)%4];snd(110*Math.pow(2,(n+b)/12),.22,'triangle',.035,0,1);if(ms%4===0)snd(55*Math.pow(2,b/12),.5,'sine',.06,0,1);ms++},240)}
function musicOff(){clearInterval(mus);mus=null}
function muteIcon(){$('mute').textContent=(S.music||S.sfx)?'🔊':'🔇'}
function click(){snd(520,.08,'square',.08,300)}
function sets(){const Lb={music:'الموسيقى',sfx:'المؤثرات',shake:'اهتزاز الشاشة',fx:'مؤثرات عالية الجودة',vib:'اهتزاز الجهاز'};$('sl').innerHTML='';for(const k in Lb){const b=document.createElement('button');b.className='mb';b.textContent=Lb[k]+': '+(S[k]?'تشغيل':'إيقاف');b.onclick=()=>{S[k]=S[k]?0:1;click();if(k==='music'){S.music?musicOn():musicOff()}sets();muteIcon()};$('sl').appendChild(b)}}
function panel(t){const p=$('pn');p.style.display='flex';
 if(t==='how')p.innerHTML='<div class="pc"><h3>HOW TO PLAY</h3><p>اللاعب 1: A/D حركة، W قفز، G ضرب، F مهارة.<br>اللاعب 2: الأسهم للحركة والقفز، / ضرب، Enter مهارة.<br>الموبايل: المس نصف الشاشة واسحب للتحريك، واسحب للأعلى للقفز.<br>التقط الكرة الذهبية لتدور البكرة وتحصل على مهارة عشوائية.<br>الشخصيات تُختار عشوائياً في كل مباراة (في التدريب تختار شخصيتك).<br>زر PLAY: لاعبان محلي، أو ضد الكمبيوتر (سهل/متوسط/صعب)، أو تدريب. المباراة أفضل من 3 جولات مع إعادة المباراة، وأربع خرائط. ⏸ أو Esc للإيقاف المؤقت. في وضعي الكمبيوتر والتدريب تتحكم كل المفاتيح (WASD أو الأسهم) باللاعب 1.<br>ضربة ثقيلة: B (لاعب 1) / Shift الأيمن (لاعب 2) / 💥 — بطيئة لكن قوية، وتتصادم مع ضربة ثقيلة للخصم. اندفاع Dash: V / Ctrl الأيمن / 💨 أو اضغط الاتجاه مرتين؛ الضربة التي تصيبك أثناء الاندفاع تعطيك Perfect Dodge ثم Flash Step مجاني. اضغط الاندفاع مع الضرب لـ Flash Step (30 طاقة). الضرب في الهواء = Air Combo.<br>Awakening 🔥: يمتلئ شريطه بالضرب وتلقي الضرر؛ عند 100% اضغط Z (لاعب 1) / O (لاعب 2) لمدة 10 ثوانٍ من قوة وسرعة وطاقة أعلى وعلاج بطيء. كل مهارة تترقى (Lv2 بعد 3 إصابات، Lv3 بعد 7) ويزيد ضررها. لكل شخصية إحصائيات وأسلوب لعب مختلف.<br>RCT (علاج): اضغط مع الاستمرار على E (لاعب 1) أو L (لاعب 2) أو زر ✚ على الموبايل لتحويل الطاقة إلى صحة. يتوقف عند الضرب القوي أو نفاد الطاقة أو الحركة بالمهارات، وله كولداون.<br>الصد: Q (لاعب 1) / P (لاعب 2) / 🛡 قبل وصول الضربة بلحظة. Black Flash: أثناء الضرب اضغط الضرب مرة ثانية عندما تصبح الحلقة حول يدك حمراء.</p><button class="mb" id="pcl">رجوع</button></div>';
 else{p.innerHTML='<div class="pc"><h3>SETTINGS</h3><div id="sl"></div><button class="mb" id="pcl">رجوع</button></div>';sets()}
 $('pcl').onclick=()=>{click();p.style.display='none'}}
function pnl(h,fn){const p=$('pn');p.style.display='flex';p.innerHTML=h;p.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{click();fn(b.dataset.v)})}
function modePanel(){pnl('<div class="pc"><h3>SELECT MODE</h3><div id="sl"><button class="mb" data-v="pvp">لاعبان — محلي</button><div class="mrow"><button class="mb s" data-v="ai0">AI سهل</button><button class="mb s" data-v="ai1">AI متوسط</button><button class="mb s" data-v="ai2">AI صعب</button></div><button class="mb" data-v="train">تدريب</button></div><button class="mb" data-v="x">رجوع</button></div>',v=>{if(v==='x')$('pn').style.display='none';else mapPanel(v.slice(0,2)==='ai'?'ai':v,v.slice(0,2)==='ai'?+v[2]:0)})}
function mapPanel(mode,diff){pnl('<div class="pc"><h3>SELECT MAP</h3><div id="sl">'+MAPS.map((m,i)=>'<button class="mb" data-v="'+i+'" style="background:linear-gradient(90deg,'+m.sky[1]+','+m.sky[2]+')">'+m.n+'</button>').join('')+'<button class="mb" data-v="r">عشوائي</button></div><button class="mb" data-v="x">رجوع</button></div>',v=>{if(v==='x')modePanel();else if(mode==='train')charPanel(v);else beginMatch(mode,diff,v)})}
function charPanel(map){pnl('<div class="pc"><h3>SELECT FIGHTER</h3><div id="sl">'+CK.map((k,i)=>'<button class="mb" data-v="'+i+'" style="border-color:'+CH[k].col+'">'+CH[k].name+'</button>').join('')+'<button class="mb" data-v="r">عشوائي</button></div><button class="mb" data-v="x">رجوع</button></div>',v=>{if(v==='x')mapPanel('train',0);else beginMatch('train',0,map,v==='r'?undefined:+v)})}
function beginMatch(mode,diff,map,fa){$('pn').style.display='none';newMatch(mode,diff,map);const n=CK.length;startSelect(fa,fa!==undefined?(fa+1+(Math.random()*(n-1)|0))%n:undefined)}
$('bPlay').onclick=()=>{click();musicOn();modePanel()};
$('ob3').onclick=()=>{click();if(M)rematch()};
$('pause').onclick=()=>{click();pauseGame()};
addEventListener('keydown',e=>{if(e.code!=='Escape')return;if(PAUSED)$('ob').click();else pauseGame()});
$('bHow').onclick=()=>{click();panel('how')};
$('bSet').onclick=()=>{click();panel('set')};
$('ob2').onclick=()=>{click();ON.role?leaveOnline():toMenu()};
$('mute').onclick=()=>{const on=!(S.music||S.sfx);S.music=S.sfx=on?1:0;on?musicOn():musicOff();muteIcon();click()};
addEventListener('pointerdown',musicOn);
/* ===== FX + KIT HUD ===== */
let bolts=[],rings=[],pops=[],warp=0;
function pop(x,y,t,c){pops.push({x,y,t,c,l:50})}
function mkBolt(x,y,d,c){const pts=[[x,y]];let px=x,py=y;for(let i=0;i<6;i++){px+=d*14;py+=(Math.random()-.5)*22;pts.push([px,py])}return{pts,c,l:12}}
function drawFx(){X.save();X.lineCap='round';X.lineJoin='round';
 for(const b of bolts){X.globalAlpha=b.l/12;for(const w of [[6,'#ef4444'],[2.5,b.c==='#111'?'#111':'#fff']]){X.lineWidth=w[0];X.strokeStyle=w[1];X.beginPath();b.pts.forEach((q,i)=>i?X.lineTo(q[0],q[1]+(Math.random()-.5)*3):X.moveTo(q[0],q[1]));X.stroke()}}
 for(const r of rings){X.globalAlpha=r.l/18;X.strokeStyle=r.c;X.lineWidth=3;X.beginPath();X.arc(r.x,r.y,r.r,0,7);X.stroke()}
 X.direction='ltr';X.font='900 16px system-ui';X.textAlign='center';for(const o of pops){X.globalAlpha=Math.min(1,o.l/20);X.fillStyle=o.c;X.strokeStyle='#000';X.lineWidth=3;X.strokeText(o.t,o.x,o.y);X.fillText(o.t,o.x,o.y)}X.restore()}
function kitHud(p,x,l){const kit=CH[p.ch].kit,ks=l?['F','H','R']:['Ent','.',','];kit.forEach((sk,n)=>{const bx=x+n*102,ok=p.en>=SKD[sk].c,cd=p.cds[sk]>0?p.cds[sk]/SKD[sk].cd:0;X.fillStyle='#000a';X.fillRect(bx,80,98,16);X.fillStyle=cd>0?'#555':ok?SC[sk]+'cc':'#333';X.fillRect(bx,80,98*(cd>0?1-cd:1),16);X.fillStyle='#fff';X.font='700 10px system-ui';X.textAlign='left';X.fillText('['+ks[n]+'] '+SN[sk]+' '+SKD[sk].c,bx+4,92)})}
/* ===== DOMAIN EXPANSION: Crimson Sanctum (KING) — 10s, recharge 35s, needs 100% energy ===== */
let dom=null,dsl=[];const DR=520;
function domK(){return dom?Math.min(1,dom.age/45)*Math.min(1,dom.t/40):0}
function startDomain(p){p.en=0;dom={o:p.i,age:0,t:600};shake=20;flash=1;pop(p.x,p.y-100,'DOMAIN EXPANSION','#ff2d2d');snd(50,1.6,'sawtooth',.2,160);snd(35,2,'sine',.25);snd(220,1.2,'square',.07,-150);burst(p.x,p.y-40,'#ff2020',36,12);burst(p.x,p.y-40,'#8a0018',36,12)}
function addSlash(q,n){for(let i=0;i<n;i++)dsl.push({x:q.x+(Math.random()-.5)*40,y:q.y-34+(Math.random()-.5)*40,a:Math.random()*3.14,len:50+Math.random()*60,l:12})}
function domStep(){if(!dom)return;const p=P[dom.o],q=P[1-dom.o];dom.age++;dom.t--;
 if(dom.age<70)shake=Math.max(shake,12);
 if(dom.age>40){q.vx*=.85;if(q.vy<-8)q.vy=-8;if(q.x>p.x+DR){q.x=p.x+DR;q.vx=-3}if(q.x<p.x-DR){q.x=p.x-DR;q.vx=3}
  if(dom.age%5===0)dsl.push({x:p.x+(Math.random()-.5)*900,y:100+Math.random()*300,a:(Math.random()-.5)*1.2+(Math.random()<.5?0:1.57),len:150+Math.random()*150,l:10,amb:1})}
 if(dom.age>60){const n=dom.age-60;
  if(n%20===0){hurt(q,1,0,0,p);addSlash(q,1);snd(900,.07,'square',.05,-500)}
  if(n%60===30){hurt(q,2.5,(q.x>=p.x?1:-1)*3,-2,p);addSlash(q,4);shake=Math.max(shake,9);burst(q.x,q.y-34,'#ff2020',16,8);snd(300,.15,'sawtooth',.1,-200)}}
 if(dom.t<=0){dom=null;p.dcd=2100;shake=10;flash=.6;pop(p.x,p.y-100,'DOMAIN COLLAPSE','#fff');snd(300,.7,'sawtooth',.1,-250);burst(p.x,p.y-40,'#8a0018',30,10)}}
function shrine(cx,by){X.lineJoin='round';
 for(let i=0;i<3;i++){const w=430-i*120,b=by-i*118,top=b-92;
  X.fillStyle='#16000a';X.strokeStyle='#ff2a2a';X.lineWidth=2;X.fillRect(cx-w/2+34,top,w-68,92);X.strokeRect(cx-w/2+34,top,w-68,92);
  for(let k=0;k<4;k++){X.fillStyle=(tick+k*7+i*3)%40<34?'#ff3030':'#7a0010';X.fillRect(cx-w/2+58+k*((w-140)/3),top+22,12,26)}
  X.fillStyle='#16000a';X.beginPath();X.moveTo(cx-w/2-50,top+8);X.quadraticCurveTo(cx-w/2+10,top-4,cx,top-62);X.quadraticCurveTo(cx+w/2-10,top-4,cx+w/2+50,top+8);X.quadraticCurveTo(cx,top-18,cx-w/2-50,top+8);X.fill();X.stroke();
  for(let k=-3;k<=3;k++){X.beginPath();X.moveTo(cx+k*20-5,top-40+Math.abs(k)*9);X.lineTo(cx+k*20,top-58+Math.abs(k)*9);X.lineTo(cx+k*20+5,top-40+Math.abs(k)*9);X.fill()}}
 X.fillStyle='#000';X.beginPath();X.moveTo(cx-40,by);X.lineTo(cx-40,by-50);X.quadraticCurveTo(cx,by-88,cx+40,by-50);X.lineTo(cx+40,by);X.fill();
 X.fillStyle='#ff2030';[-1,1].forEach(s=>{X.beginPath();X.moveTo(cx+s*8,by-60);X.lineTo(cx+s*30,by-70);X.lineTo(cx+s*26,by-56);X.fill()});
 X.fillStyle='#e8e0d0';for(let k=-3;k<=3;k++){X.beginPath();X.moveTo(cx+k*10-4,by-38);X.lineTo(cx+k*10,by-24);X.lineTo(cx+k*10+4,by-38);X.fill()}}
function domBg(){if(!dom)return;const k=domK(),gy=250+160*cam.z,oy=(dom.age<60?Math.pow(1-dom.age/60,3)*430:0)+(dom.t<40?Math.pow(1-dom.t/40,2)*430:0);
 X.save();X.globalAlpha=k;let g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a0006');g.addColorStop(.6,'#620012');g.addColorStop(1,'#140004');X.fillStyle=g;X.fillRect(0,0,W,H);
 const mx=W*.5-cam.x*.02,rg=X.createRadialGradient(mx,150,10,mx,150,190);rg.addColorStop(0,'#ff5050');rg.addColorStop(.5,'#b0102066');rg.addColorStop(1,'#b0102000');X.fillStyle=rg;X.fillRect(mx-200,0,400,350);
 shrine(W/2,gy+oy);X.restore()}
function domOver(){if(!dom)return;const k=domK();X.save();
 X.globalCompositeOperation='multiply';X.fillStyle='rgba(255,60,60,'+(.75*k)+')';X.fillRect(0,0,W,H);X.globalCompositeOperation='source-over';
 const g=X.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,W*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.85*k)+')');X.fillStyle=g;X.fillRect(0,0,W,H);
 if(dom.age<40){X.strokeStyle='rgba(255,40,40,'+(1-dom.age/40)+')';X.lineWidth=10;X.beginPath();X.arc(W/2,H/2,dom.age*24,0,7);X.stroke()}
 if(dom.age>40&&dom.age%9<2){X.strokeStyle='#fff';X.lineWidth=2;const y0=Math.random()*H;X.beginPath();X.moveTo(0,y0);X.lineTo(W,y0+(Math.random()-.5)*200);X.stroke()}
 X.fillStyle='#000';const bh=24*k;X.fillRect(0,0,W,bh);X.fillRect(0,H-bh,W,bh);X.restore()}
function drawDom(){if(!dom)return;const p=P[dom.o],k=domK();X.save();
 if(dom.age>40)for(const sd of [-1,1]){const x=p.x+sd*DR,g=X.createLinearGradient(x-sd*40,0,x,0);g.addColorStop(0,'rgba(255,32,48,0)');g.addColorStop(1,'rgba(255,32,48,'+(.45*k)+')');X.fillStyle=g;X.fillRect(Math.min(x,x-sd*40),-300,40,800)}
 X.globalAlpha=k;X.save();X.globalCompositeOperation='lighter';const rg=X.createRadialGradient(p.x,p.y-40,5,p.x,p.y-40,90);rg.addColorStop(0,'rgba(255,48,48,.55)');rg.addColorStop(1,'rgba(255,48,48,0)');X.fillStyle=rg;X.fillRect(p.x-90,p.y-130,180,180);X.restore();
 for(let i=0;i<8;i++){const a=i/8*6.28+tick/12,fx=p.x+Math.cos(a)*24,h=46+Math.sin(tick/4+i)*16;X.fillStyle=i%2?'#ff2030':'#0c0004';X.beginPath();X.moveTo(fx-7,p.y);X.quadraticCurveTo(fx+Math.sin(tick/5+i)*8,p.y-h,fx+6,p.y-h*1.7);X.quadraticCurveTo(fx+10,p.y-h*.5,fx+7,p.y);X.fill()}
 X.lineCap='round';for(const s of dsl){const dx=Math.cos(s.a)*s.len,dy=Math.sin(s.a)*s.len;X.globalAlpha=s.l/(s.amb?10:12);X.strokeStyle='#ff1030';X.lineWidth=s.amb?3:7;X.beginPath();X.moveTo(s.x-dx,s.y-dy);X.lineTo(s.x+dx,s.y+dy);X.stroke();X.strokeStyle='#fff';X.lineWidth=s.amb?1:2;X.stroke()}
 X.restore()}
function domHud(p,x,l){const on=dom&&dom.o===p.i,rdy=p.dcd<=0&&p.en>=100&&!dom,f=on?dom.t/600:p.dcd>0?1-p.dcd/2100:p.en/100,w=300*f;
 X.fillStyle='#000a';X.fillRect(x,80,300,16);X.fillStyle=on||rdy?'#ff2030':'#5a2030';X.fillRect(l?x:x+300-w,80,w,16);
 X.fillStyle='#fff';X.font='700 10px system-ui';X.textAlign='left';X.fillText('['+(l?'T':';')+'] DOMAIN '+(on?'ACTIVE '+Math.ceil(dom.t/60)+'s':p.dcd>0?'recharge '+Math.ceil(p.dcd/60)+'s':p.en>=100?'READY':'needs full energy'),x+4,92)}
/* ===== DOMAIN SYSTEM v2: per-character domains, Null Ring, Domain Clash (overrides the v1 functions above) ===== */
let DM=[],CL=null,scars=[];
const DD={void:{name:'ENDLESS EXPANSE',col:'#a78bfa',base:.95},shrine:{name:'CRIMSON SANCTUM',col:'#ff2d2d',base:1.05}};
function domK(d){return Math.min(1,d.age/45)*Math.min(1,d.t/40)}
function dpow(d){return(.6+.4*P[d.o].hp/100)*(.7+.3*d.t/600)*DD[d.ty].base}
function addSlash(q,n){for(let i=0;i<n;i++)dsl.push({x:q.x+(Math.random()-.5)*40,y:q.y-34+(Math.random()-.5)*40,a:(Math.random()-.5)*2.2+(i%2?.8:-.8),len:50+Math.random()*60,l:12});scars.push({x:q.x,l:50})}
function tryDomain(p){if(CL&&DM.some(d=>d.o===p.i)){CL.m+=(p.i===CL.L?1:-1)*5;snd(200+Math.random()*200,.04,'square',.05);return}
 if(DM.some(d=>d.o===p.i)||p.dcd>0||p.en<100)return;startDomain(p)}
function startDomain(p){const ty=CH[p.ch].dom;p.en=0;p.sp=40;p.lsk='dom';p.fz=22;DM.push({o:p.i,ty,age:0,t:600});shake=20;flash=1;slo=Math.max(slo,45);hs=Math.max(hs,8);cam.z+=.14;rings.push({x:p.x,y:p.y-34,r:8,v:11,l:26,c:DD[ty].col},{x:p.x,y:p.y-34,r:2,v:6,l:30,c:'#fff'});nz(1,.18,120);vib([30,40,60]);pop(p.x,p.y-100,DD[ty].name,DD[ty].col);snd(50,1.6,'sawtooth',.2,160);snd(35,2,'sine',.25);snd(220,1.2,'square',.07,-150);burst(p.x,p.y-40,DD[ty].col,36,12);
 if(DM.length>1&&!CL){CL={t:300,m:0,L:Math.min(DM[0].o,DM[1].o)};pop(p.x,p.y-130,'DOMAIN CLASH!','#fff');snd(70,1,'sawtooth',.2,400)}}
function endDomain(d,txt){DM=DM.filter(z=>z!==d);const p=P[d.o];p.dcd=2100;pop(p.x,p.y-100,txt,'#fff');snd(300,.7,'sawtooth',.1,-250);burst(p.x,p.y-40,DD[d.ty].col,30,10);shake=Math.max(shake,12);flash=Math.max(flash,.5)}
function tryRing(p){if(p.ring>0||p.rcd>0||p.en<30)return;p.en-=30;p.ring=180;p.rcd=480;rings.push({x:p.x,y:p.y-30,r:10,v:5,l:18,c:'#67e8f9'});snd(500,.25,'triangle',.1,300);pop(p.x,p.y-90,'NULL RING','#67e8f9')}
function domStep(){
 if(CL){const a=DM.find(d=>d.o===CL.L),b=DM.find(d=>d.o!==CL.L);
  if(!a||!b){CL=null}else{CL.t--;CL.m=Math.max(-100,Math.min(100,CL.m+(dpow(a)-dpow(b))*.6));shake=Math.max(shake,8);
   const bx=W/2+CL.m*W*.0045;if(tick%3===0)burst(cam.x+(bx-W/2)/cam.z,GY-30-Math.random()*160,'#ffffff',3,8);
   if(CL.m>=100||CL.m<=-100||CL.t<=0){const win=CL.m>15?a:CL.m<-15?b:null;
    if(win){const lose=win===a?b:a;endDomain(lose,'DOMAIN BROKEN');win.age=Math.max(win.age,60);pop(P[win.o].x,P[win.o].y-120,'DOMAIN HOLDS','#fff')}else{endDomain(a,'CLASH DRAW');endDomain(b,'CLASH DRAW')}
    CL=null;flash=1;shake=18}}
  return}
 for(const d of DM.slice()){d.age++;d.t--;const p=P[d.o],q=P[1-d.o],rd=q.ring>0,red=Math.max(.5,Math.min(.9,1.5-dpow(d)*.9)),m=rd?1-red:1;
  if(d.age<70)shake=Math.max(shake,12);
  if(d.age>40&&!rd){q.vx*=d.ty==='void'?.7:.85;if(q.vy<-8)q.vy=-8;if(d.ty==='shrine'){if(q.x>p.x+DR){q.x=p.x+DR;q.vx=-3}if(q.x<p.x-DR){q.x=p.x-DR;q.vx=3}}}
  if(d.ty==='shrine'&&d.age>40&&d.age%5===0)dsl.push({x:p.x+(Math.random()-.5)*900,y:100+Math.random()*300,a:(Math.random()-.5)*1.2+(Math.random()<.5?0:1.57),len:150+Math.random()*150,l:10,amb:1});
  if(d.age>60){const n=d.age-60;
   if(d.ty==='shrine'){if(n%20===0){hurt(q,1*m,0,0,p);addSlash(q,2);snd(900,.07,'square',.05,-500)}
    if(n%60===30){hurt(q,2.5*m,(q.x>=p.x?1:-1)*3,-2,p);addSlash(q,6);shake=Math.max(shake,9);burst(q.x,q.y-34,'#ff2020',16,8);snd(300,.15,'sawtooth',.1,-200)}}
   else{if(n%30===0){hurt(q,1.2*m,0,0,p);rings.push({x:q.x,y:q.y-34,r:8,v:4,l:14,c:'#a78bfa'});burst(q.x,q.y-34,'#a78bfa',6,5)}
    if(n%150===0&&!rd){q.fz=25;pop(q.x,q.y-90,'FROZEN','#a78bfa')}}}
  if(d.t<=0)endDomain(d,'DOMAIN COLLAPSE')}}
function dBg(d,k,gy){const ag=CL?Math.max(d.age,60):d.age,tt=CL?Math.max(d.t,40):d.t,oy=(ag<60?Math.pow(1-ag/60,3)*430:0)+(tt<40?Math.pow(1-tt/40,2)*430:0);X.save();X.globalAlpha=k;
 if(d.ty==='shrine'){const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a0006');g.addColorStop(.6,'#620012');g.addColorStop(1,'#140004');X.fillStyle=g;X.fillRect(0,0,W,H);const mx=W*.5-cam.x*.02,rg=X.createRadialGradient(mx,150,10,mx,150,190);rg.addColorStop(0,'#ff5050');rg.addColorStop(.5,'rgba(176,16,32,.4)');rg.addColorStop(1,'rgba(176,16,32,0)');X.fillStyle=rg;X.fillRect(mx-200,0,400,350);shrine(W/2,gy+oy)}
 else{const g=X.createRadialGradient(W/2,H/2,20,W/2,H/2,W*.7);g.addColorStop(0,'#2a1a7a');g.addColorStop(.5,'#0b0630');g.addColorStop(1,'#020010');X.fillStyle=g;X.fillRect(0,0,W,H);
  X.fillStyle='#fff';for(let i=0;i<60;i++){const a=i*2.4+tick*.004*(1+i%3),r=40+((i*37)%360);X.globalAlpha=k*(.3+.7*(((i+(tick>>3))%3)/2));X.fillRect(W/2+Math.cos(a)*r*1.5,H/2+Math.sin(a)*r*.8,1+i%2,1+i%2)}
  X.globalAlpha=k;const R=Math.min(1,ag/45)*(tt<40?tt/40:1)*280,sg=X.createRadialGradient(W/2,200,R*.2,W/2,200,Math.max(1,R));sg.addColorStop(0,'rgba(124,92,255,0)');sg.addColorStop(.85,'rgba(124,92,255,.35)');sg.addColorStop(1,'rgba(200,180,255,.7)');X.fillStyle=sg;X.beginPath();X.arc(W/2,200,R,0,7);X.fill();
  X.strokeStyle='#c4b5fd';X.lineWidth=2;for(let j=0;j<5;j++){X.beginPath();X.arc(W/2,200,Math.max(1,R*(.3+j*.14)),tick/30+j,tick/30+j+2.2);X.stroke()}}
 X.restore()}
function domBg(){if(!DM.length)return;const gy=250+160*cam.z;
 if(CL){const bx=W/2+CL.m*W*.0045;DM.forEach(d=>{X.save();X.beginPath();if(d.o===CL.L)X.rect(0,0,bx,H);else X.rect(bx,0,W-bx,H);X.clip();dBg(d,1,gy);X.restore()});return}
 DM.forEach(d=>dBg(d,domK(d),gy))}
function domOver(){if(!DM.length)return;const bx=W/2+(CL?CL.m*W*.0045:0);let kk=0;
 DM.forEach(d=>{const k=CL?1:domK(d);kk=Math.max(kk,k);X.save();if(CL){X.beginPath();if(d.o===CL.L)X.rect(0,0,bx,H);else X.rect(bx,0,W-bx,H);X.clip()}
  X.globalCompositeOperation='multiply';X.fillStyle=d.ty==='shrine'?'rgba(255,60,60,'+(.75*k)+')':'rgba(120,110,255,'+(.7*k)+')';X.fillRect(0,0,W,H);X.restore()});
 X.save();const g=X.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,W*.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+(.8*kk)+')');X.fillStyle=g;X.fillRect(0,0,W,H);
 if(CL){X.lineJoin='round';for(const w of [[16,'rgba(255,255,255,.25)'],[3,'#fff']]){X.lineWidth=w[0];X.strokeStyle=w[1];X.beginPath();for(let y=0;y<=H;y+=22){const x=bx+(y?(Math.random()-.5)*18:0);y?X.lineTo(x,y):X.moveTo(x,y)}X.stroke()}
  const a=DM.find(d=>d.o===CL.L),b=DM.find(d=>d.o!==CL.L);
  if(a&&b){const x0=W/2-150,y0=118,pa=dpow(a),pb=dpow(b),fr=.5+CL.m/200;X.fillStyle='rgba(0,0,0,.8)';X.fillRect(x0-2,y0-2,304,20);X.fillStyle=DD[a.ty].col;X.fillRect(x0,y0,300*fr,16);X.fillStyle=DD[b.ty].col;X.fillRect(x0+300*fr,y0,300*(1-fr),16);X.fillStyle='#fff';X.fillRect(x0+300*fr-2,y0-4,4,24);X.font='800 11px system-ui';X.textAlign='center';X.fillText('DOMAIN CLASH  '+pa.toFixed(2)+' vs '+pb.toFixed(2)+'  ('+Math.ceil(CL.t/60)+'s)',W/2,y0+34);X.fillText('MASH YOUR DOMAIN BUTTON!',W/2,y0+48)}}
 else if(DM[0].age<40){X.strokeStyle='rgba(255,255,255,'+(1-DM[0].age/40)+')';X.lineWidth=10;X.beginPath();X.arc(W/2,H/2,DM[0].age*24,0,7);X.stroke()}
 X.fillStyle='#000';const bh=24*kk;X.fillRect(0,0,W,bh);X.fillRect(0,H-bh,W,bh);X.restore()}
function drawDom(){X.save();X.lineCap='round';
 for(const s of scars){X.globalAlpha=s.l/50;X.strokeStyle='#ff1030';X.lineWidth=3;X.beginPath();X.moveTo(s.x-50,GY+1);X.lineTo(s.x-15,GY+5);X.lineTo(s.x+10,GY);X.lineTo(s.x+50,GY+3);X.stroke()}
 for(const s of dsl){const pg=Math.min(1,(13-s.l)/4),dx=Math.cos(s.a),dy=Math.sin(s.a),L=s.len*pg,w=s.amb?2.5:6;X.globalAlpha=s.l/(s.amb?10:12);
  for(const f of [[1,'#ff1030'],[.35,'#fff']]){X.fillStyle=f[1];X.beginPath();X.moveTo(s.x-dx*L,s.y-dy*L);X.lineTo(s.x-dy*w*f[0],s.y+dx*w*f[0]);X.lineTo(s.x+dx*L,s.y+dy*L);X.lineTo(s.x+dy*w*f[0],s.y-dx*w*f[0]);X.closePath();X.fill()}}
 X.globalAlpha=1;
 for(const p of P){if(p.ring>0){X.globalAlpha=Math.min(1,p.ring/30);X.strokeStyle='#67e8f9';X.lineWidth=3;X.setLineDash([14,8]);X.beginPath();X.arc(p.x,p.y-34,46,tick/15,tick/15+6.28);X.stroke();X.setLineDash([])}
  if(p.fz>0&&!(p.stg>0)){X.globalAlpha=.7;X.strokeStyle='#c4b5fd';X.lineWidth=2;X.strokeRect(p.x-16,p.y-90,32,92)}}
 for(const d of DM){const p=P[d.o],k=CL?1:domK(d);X.globalAlpha=k;
  X.save();X.globalCompositeOperation='lighter';const rg=X.createRadialGradient(p.x,p.y-40,5,p.x,p.y-40,90);rg.addColorStop(0,d.ty==='shrine'?'rgba(255,48,48,.55)':'rgba(140,110,255,.55)');rg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=rg;X.fillRect(p.x-90,p.y-130,180,180);X.restore();
  if(d.ty==='shrine'){for(let i=0;i<8;i++){const a=i/8*6.28+tick/12,fx=p.x+Math.cos(a)*24,h=46+Math.sin(tick/4+i)*16;X.fillStyle=i%2?'#ff2030':'#0c0004';X.beginPath();X.moveTo(fx-7,p.y);X.quadraticCurveTo(fx+Math.sin(tick/5+i)*8,p.y-h,fx+6,p.y-h*1.7);X.quadraticCurveTo(fx+10,p.y-h*.5,fx+7,p.y);X.fill()}
   if(!CL&&d.age>40)for(const sd of [-1,1]){const x=p.x+sd*DR,g=X.createLinearGradient(x-sd*40,0,x,0);g.addColorStop(0,'rgba(255,32,48,0)');g.addColorStop(1,'rgba(255,32,48,'+(.45*k)+')');X.fillStyle=g;X.fillRect(Math.min(x,x-sd*40),-300,40,800)}}
  else{X.fillStyle='#e9e1ff';for(let i=0;i<10;i++){const a=i/10*6.28+tick/20;X.fillRect(p.x+Math.cos(a)*(30+i%3*8),p.y-40+Math.sin(a)*(40+i%2*10),2,2)}}}
 X.restore()}
function domHud(p,x,l){const d=DM.find(z=>z.o===p.i),nm=DD[CH[p.ch].dom],f=d?d.t/600:p.dcd>0?1-p.dcd/2100:p.en/100,w=300*f,rdy=!d&&p.dcd<=0&&p.en>=100;
 X.fillStyle='#000a';X.fillRect(x,80,300,16);X.fillStyle=d||rdy?nm.col:'#4a3050';X.fillRect(l?x:x+300-w,80,w,16);
 X.fillStyle='#fff';X.font='700 10px system-ui';X.textAlign='left';X.fillText('['+(l?'T':';')+'] '+nm.name+' '+(d?(CL?'CLASH':Math.ceil(d.t/60)+'s'):p.dcd>0?'recharge '+Math.ceil(p.dcd/60)+'s':p.en>=100?'READY':'needs full energy'),x+4,92)}
function ringHud(p,x,l){const w=130,rx=l?x:x+300-w,f=p.ring>0?p.ring/180:p.rcd>0?1-p.rcd/480:Math.min(1,p.en/30),kc=l?'Y':String.fromCharCode(39);
 X.fillStyle='#000a';X.fillRect(rx,100,w,12);X.fillStyle=p.ring>0?'#67e8f9':p.rcd>0?'#345':p.en>=30?'#22d3ee':'#234';X.fillRect(rx,100,w*f,12);X.fillStyle='#fff';X.font='700 9px system-ui';X.textAlign='left';X.fillText('['+kc+'] NULL RING '+(p.ring>0?'ON':p.rcd>0?Math.ceil(p.rcd/60)+'s':''),rx+3,109)}
/* ===== REVERSE CURSED TECHNIQUE (RCT): hold [E] / [L] / ✚ to convert cursed energy (p.en) into HP (p.hp) =====
   Same HP and energy pools as skills (no parallel system). Numbers are per frame (60/s):
   hc / ho = HP per frame in combat / out of combat, cpp = energy per HP, min = energy needed to start,
   cd = base cooldown, max = max channel frames, rs = damage factor and rc = energy per damage point when resisting domain damage.
   Mapping to the roster: SAGE = Gojo-like (fast + efficient), KING = Sukuna-like (strong + expensive),
   BRAWLER = Yuji-like (balanced, can keep swinging; healing pauses on each swing), CLAPPER = Todo-like (weak, short, long cooldown). */
const RCTD={
 sage:{fx:'sage',c1:'#7dd3fc',c2:'#ffffff',hc:.11,ho:.26,cpp:1.1,min:25,cd:420,max:330,rs:.5,rc:3,fight:0,snd:520},
 king:{fx:'king',c1:'#ff2d2d',c2:'#ff8a8a',hc:.13,ho:.30,cpp:1.7,min:40,cd:540,max:300,rs:.45,rc:3.5,fight:0,snd:260},
 brawler:{fx:'brawler',c1:'#ef4444',c2:'#ffffff',hc:.09,ho:.18,cpp:1.2,min:30,cd:480,max:300,rs:.6,rc:3,fight:1,snd:400},
 clapper:{fx:'clapper',c1:'#bae6fd',c2:'#e0f2fe',hc:.05,ho:.10,cpp:1,min:40,cd:900,max:150,rs:.8,rc:4,fight:0,snd:600}};
let DOMHIT=0;
function endRct(p,why){if(!(p.rt>0))return;const R=RCTD[p.ch],u=p.rtd;p.rt=0;p.rtd=0;
 if(p.rta>=1)pop(p.x,p.y-100,'+'+Math.round(p.rta),R.c1);p.rta=0;
 if(why==='hit'){p.rtl=40;p.rtc=Math.max(90,Math.round(R.cd*.6));pop(p.x,p.y-116,'RCT BROKEN','#f87171');shake=Math.max(shake,5);snd(150,.2,'sawtooth',.09,-80)}
 else if(why==='stun'){p.rtl=20;p.rtc=Math.round(R.cd*.4);pop(p.x,p.y-116,'RCT BROKEN','#f87171')}
 else{p.rtc=Math.max(90,Math.round(R.cd*Math.min(1,.35+u/R.max*.65)));if(why==='dry')pop(p.x,p.y-116,'OUT OF ENERGY','#a78bfa');snd(R.snd*.6,.3,'sine',.07,-150)}
 burst(p.x,p.y-40,R.c1,10,4)}
function rctStep(p){if(p.rtc>0)p.rtc--;if(p.rtl>0)p.rtl--;if(p.rtz>0)p.rtz--;if(p.rtg>0)p.rtg--;
 const R=RCTD[p.ch],held=!!inp[p.i].h,edge=held&&!p.rth;p.rth=held;
 if(!R||p.hp<=0){p.rt=0;return}
 if(p.rt>0){
  if((p.at===14&&!R.fight)||p.sp===22||p.sp===40||p.hv===26||p.ds===10){endRct(p,'rel');return}
  if(p.fz>0){endRct(p,'stun');return}
  if(!held){endRct(p,'rel');return}
  const q=P[1-p.i],dm=DM.some(d=>d.o!==p.i),eng=dm||p.rtg>0||(Math.abs(q.x-p.x)<320&&Math.abs(q.y-p.y)<200)||shots.some(s=>s.o!==p.i&&s.dl<=0&&Math.hypot(s.x-p.x,s.y-p.y+30)<240);
  p.rtk=dm?3:eng?1:2;p.rtd++;
  if(p.rtz>0||(R.fight&&p.at>0))return;
  let hp=eng?R.hc:R.ho,cost=R.cpp;if(dm){hp*=.4;cost*=2.2}
  const amt=Math.min(hp,100-p.hp),need=amt*cost;
  if(p.en<need){const part=p.en/cost;p.hp=Math.min(100,p.hp+part);p.rta+=part;p.en=0;endRct(p,'dry');return}
  p.hp+=amt;p.en-=need;p.rta+=amt;
  if(p.hp>=99.999){p.hp=100;endRct(p,'full');return}
  if(p.rtd>=R.max){endRct(p,'time');return}
  if(p.rtd%24===0)snd(R.snd+(p.rtd%48?60:0),.12,'sine',.04);
  if(p.rtd%30===0){pop(p.x,p.y-100,'+'+Math.round(p.rta),R.c1);p.rta=0;burst(p.x,p.y-40,R.c1,5,3)}
 }else if(edge&&state==='play'){
  if(p.fz>0||p.reel>0||p.sp>0||p.rtl>0)return;
  if(p.rtc>0){pop(p.x,p.y-100,'RCT COOLDOWN','#94a3b8');return}
  if(p.hp>=100){pop(p.x,p.y-100,'HP FULL','#94a3b8');return}
  if(p.en<R.min){pop(p.x,p.y-100,'NEED '+R.min+' ENERGY','#94a3b8');return}
  p.rt=1;p.rtd=0;p.rta=0;p.rtk=2;pop(p.x,p.y-100,'REVERSE CURSED TECHNIQUE',R.c1);snd(R.snd,.4,'sine',.1,500);snd(R.snd*2,.5,'triangle',.05,300);burst(p.x,p.y-40,R.c1,16,5)}}
function rctHands(p,ex,ey,bob){const R=RCTD[p.ch];if(!R)return;X.save();X.globalCompositeOperation='lighter';
 const r=(R.fx==='clapper'?14:20)*(1+Math.sin(tick/4)*.25);X.globalAlpha=p.rtz>0?.4:1;
 let g=X.createRadialGradient(ex,ey,1,ex,ey,r);g.addColorStop(0,'#fff');g.addColorStop(.4,R.c1);g.addColorStop(1,R.c1+'00');X.fillStyle=g;X.fillRect(ex-r,ey-r,r*2,r*2);
 const cy=-40+bob;g=X.createRadialGradient(0,cy,2,0,cy,30);g.addColorStop(0,R.c2+'aa');g.addColorStop(1,R.c2+'00');X.fillStyle=g;X.fillRect(-30,cy-30,60,60);
 X.restore()}
function drawRct(p){if(!(p.rt>0))return;const R=RCTD[p.ch];if(!R)return;
 const a=p.rtz>0?(tick%6<3?.25:.5):1,k=p.rtk===2?1.2:p.rtk===3?.75:1,cx=p.x,by=p.y,fx=R.fx;
 X.save();X.globalAlpha=a;X.globalCompositeOperation='lighter';
 let g=X.createRadialGradient(cx,by-40,6,cx,by-40,72*k);g.addColorStop(0,R.c1+'55');g.addColorStop(.6,R.c2+'22');g.addColorStop(1,R.c1+'00');X.fillStyle=g;X.fillRect(cx-80,by-120,160,150);
 X.strokeStyle=R.c1;X.lineWidth=2;X.globalAlpha=a*.7;X.beginPath();X.ellipse(cx,by-1,(28+Math.sin(tick/6)*3)*k,7,0,0,6.283);X.stroke();X.globalAlpha=a;
 if(p.rtk===3){X.globalAlpha=a*.8;X.lineWidth=3;X.strokeStyle='#fff';X.beginPath();X.arc(cx,by-38,42+Math.sin(tick/3)*2,0,6.283);X.stroke();X.globalAlpha=a}
 if(fx==='sage'){for(let i=0;i<14;i++){const ph=((tick*1.3+i*29)%90)/90,x=cx+Math.sin(i*2.1+tick/14)*(14+i%4*5),y=by-8-ph*92,s=2.4*(1-ph)+.8;X.globalAlpha=a*(1-ph*.6);X.fillStyle=i%3?'#e0f2fe':'#7dd3fc';X.fillRect(x-s/2,y-s/2,s,s)}
  X.globalAlpha=a;X.fillStyle='#fff';for(let j=0;j<6;j++){const an=j/6*6.283+tick/25;X.beginPath();X.arc(cx+Math.cos(an)*44,by-40+Math.sin(an)*26,2.2,0,7);X.fill()}}
 else if(fx==='king'){X.globalCompositeOperation='source-over';for(let i=0;i<8;i++){const ph=((tick*1.6+i*23)%70)/70,fxp=cx+(i-3.5)*7+Math.sin(tick/5+i)*4,fy=by-6-ph*100;X.globalAlpha=a*(1-ph);X.fillStyle=i%2?'#ff2030':'#0c0004';X.beginPath();X.moveTo(fxp-3,fy+10);X.quadraticCurveTo(fxp+Math.sin(tick/4+i)*5,fy,fxp,fy-12-6*(1-ph));X.quadraticCurveTo(fxp+3,fy,fxp-3,fy+10);X.fill()}
  if(tick%24<5){X.globalAlpha=a;X.strokeStyle='#ff1030';X.lineWidth=2.5;for(let i=0;i<3;i++){const sx=cx+(i-1)*16,sy=by-62+i*12;X.beginPath();X.moveTo(sx-9,sy-6);X.lineTo(sx+9,sy+6);X.stroke()}}}
 else if(fx==='brawler'){for(let i=0;i<2;i++){const r=((tick*1.7+i*30)%60)/60;X.globalAlpha=a*(1-r);X.strokeStyle=i?'#fff':'#ef4444';X.lineWidth=3;X.beginPath();X.arc(cx,by-40,10+r*46,0,6.283);X.stroke()}
  for(let i=0;i<8;i++){const ph=((tick*1.4+i*31)%80)/80;X.globalAlpha=a*(1-ph);X.fillStyle=i%2?'#fff':'#ef4444';X.fillRect(cx+Math.sin(i*2.7+tick/10)*20-1.5,by-8-ph*86,3,3)}}
 else{for(let i=0;i<6;i++){if((tick+i*7)%10>5)continue;const ph=((tick*1+i*41)%80)/80;X.globalAlpha=a*(1-ph)*.9;X.fillStyle='#bae6fd';X.fillRect(cx+Math.sin(i*2.3+tick/12)*16-1,by-8-ph*60,2,2)}}
 X.restore()}
function rctHud(p,x,l){const R=RCTD[p.ch];if(!R)return;const w=150,rx=l?x:x+300-w,on=p.rt>0,cd=p.rtc>0,
 f=on?Math.max(0,1-p.rtd/R.max):cd?Math.max(0,1-p.rtc/R.cd):Math.min(1,p.en/R.min),kc=l?'E':'L';
 X.fillStyle='#000a';X.fillRect(rx,114,w,12);X.fillStyle=on?R.c1:cd?'#4a3a40':p.en>=R.min&&p.hp<100?R.c1+'bb':'#2a3a44';X.fillRect(rx,114,w*f,12);
 X.fillStyle='#fff';X.font='700 9px system-ui';X.textAlign='left';X.fillText('['+kc+'] RCT '+(on?'HEALING':cd?Math.ceil(p.rtc/60)+'s':p.hp>=100?'':p.en<R.min?'need '+R.min+' EN':'READY'),rx+3,123)}
/* ===== PARRY + BLACK FLASH =====
   PARRY: tap [Q]/[P]/🛡 to open a 12-frame guard. An attack that lands inside it is parried (no damage, attacker staggered, counter window).
   Early/late = the window closes with nothing parried and you are exposed (x1.3 damage) for a while. Attack types (PRY): 1 = full parry, .5 = heavy (damage halved,
   no stagger), missing = cannot be parried (pull, void, cleave, domains, swap).
   BLACK FLASH: press ATTACK again during the swing, when the ring around your hand turns red (frames 5..11 of the swing, impact = frame 8).
   Frames 6..10 always work, frames 5 and 11 are a chance that grows with your streak. Costs BFE energy, BFC frames cooldown; a mistimed press locks it for 1 s. */
const PRY={melee:1,crimson:1,echo:1,shred:1,wave:1,rush:1,smash:.5,slam:.5,repel:.5,heavy:.5};
let ATK='none',bff=0;
const PW=12,PCD=45,PVU=28,BFE=20,BFC=300,BFD=16;
function hurtA(a,t,d,kx,ky,o){ATK=a;return hurt(t,d,kx,ky,o)}
function parrySuccess(t,o,pk){
 t.pok=1;awAdd(t,10);t.pw=0;t.pcd=8;t.cdA=0;t.cnt=pk>=1?50:28;
 const mx=(t.x+o.x)/2,my=t.y-42,near=Math.abs(o.x-t.x)<150;
 if(pk>=1){if(near){o.fz=Math.max(o.fz,16);o.stg=16;o.vx+=(o.x>=t.x?1:-1)*9;o.at=0}o.bfq=0;o.cdA=Math.max(o.cdA,24);shots.forEach(s=>{if(s.o===o.i&&(s.t==='shred'||s.t==='rush'))s.life=0})}
 else o.vx+=(o.x>=t.x?1:-1)*3;
 rings.push({x:mx,y:my,r:6,v:8,l:14,c:'#ffffff'},{x:mx,y:my,r:2,v:5,l:16,c:'#fde047'});
 burst(mx,my,'#ffffff',22,10);burst(mx,my,'#fbbf24',16,8);shake=Math.max(shake,pk>=1?13:8);flash=Math.max(flash,.3);
 pop(t.x,t.y-100,pk>=1?'PARRY!':'GUARD!','#fde047');snd(1900,.1,'square',.12,-700);snd(280,.25,'sawtooth',.14,-150)}
function parryIn(p){const held=!!inp[p.i].pa,edge=held&&!p.pah;p.pah=held;
 if(p.pcd>0)p.pcd--;if(p.pv>0)p.pv--;if(p.cnt>0)p.cnt--;
 if(p.pw>0){p.pw--;if(p.pw===0&&!p.pok){p.pv=PVU;pop(p.x,p.y-100,'PARRY FAILED','#f87171');snd(180,.2,'square',.08,-80)}}
 if(edge&&state==='play'&&p.pw<=0&&p.pcd<=0&&p.pv<=0&&!(p.fz>0)&&p.reel<=0&&!(p.sp>0)&&p.hp>0){
  p.pw=PW;p.pok=0;p.pcd=PCD;if(p.rt>0)endRct(p,'rel');p.at=0;p.hv=0;p.bfq=0;snd(700,.08,'triangle',.08,300);burst(p.x+p.f*20,p.y-42,'#fde047',6,3)}}
function bfAttempt(p){if(p.bfd||p.bfq)return;p.bfd=1;
 if(p.bfl>0||p.bfc>0||p.en<BFE||p.fz>0)return;
 const q=P[1-p.i];
 if(p.at>11||p.at<5){p.bfl=60;pop(p.x,p.y-100,p.at>11?'TOO EARLY':'TOO LATE','#9ca3af');return}
 const off=Math.abs(p.at-8);
 if(off>2&&Math.random()>.45+.1*Math.min(3,p.bfs)){p.bfl=60;pop(p.x,p.y-100,'MISSED','#9ca3af');return}
 if(p.at>=8)p.bfq=1;else if(p.hl)bfStrike(p,q);else bfWhiff(p)}
function bfWhiff(p){p.bfq=0;p.bfc=45;pop(p.x,p.y-100,'NO CONTACT','#9ca3af')}
function bfStrike(p,q){p.bfq=0;if(p.en<BFE)return;p.en-=BFE;p.bfc=BFC;p.bfs=Math.min(3,p.bfs+1);p.bft=420;p.bfg=22;
 const d=p.f,cx=q.x,cy=q.y-34;hurtA('bf',q,BFD,d*22,-7,p);
 bff=10;shake=Math.max(shake,18);
 for(let k=0;k<8;k++)bolts.push(mkBolt(cx-d*8,cy-24+k*7,k%2?1:-1,k%3?'#111':'#fff'));
 rings.push({x:cx,y:cy,r:6,v:8,l:14,c:'#ff1030'},{x:cx,y:cy,r:2,v:4,l:18,c:'#7a0010'});
 burst(cx,cy,'#ff1030',28,11);burst(cx,cy,'#8a0018',22,9);
 pop(cx,q.y-112,'BLACK FLASH!','#ff2d2d');snd(60,.5,'sawtooth',.2,120);snd(1400,.12,'square',.08,-1100);snd(220,.3,'sawtooth',.12,-150)}
function sysStep(p){stSys(p);if(p.stg>0)p.stg--;if(p.bfc>0)p.bfc--;if(p.bfl>0)p.bfl--;if(p.bfg>0)p.bfg--;if(p.bft>0&&--p.bft===0)p.bfs=0;if(p.at===0&&p.bfq)p.bfq=0}
function drawBFwin(p){if(!(p.at>0)||p.bfc>0||p.bfl>0||p.en<BFE)return;
 const cx=p.x+p.f*30,cy=p.y-44,inW=p.at>=5&&p.at<=11,r=14+Math.max(0,p.at-8)*3.2;
 X.save();X.lineCap='round';X.globalAlpha=inW?1:.45;
 X.strokeStyle='#ffffff';X.lineWidth=1.5;X.beginPath();X.arc(cx,cy,14,0,6.283);X.stroke();
 X.strokeStyle=inW?'#ff2d2d':'#9ca3af';X.lineWidth=inW?4:2;X.beginPath();X.arc(cx,cy,r,0,6.283);X.stroke();
 if(inW){X.globalCompositeOperation='lighter';X.strokeStyle='#ff1030';X.lineWidth=2;for(let i=0;i<4;i++){const a=tick*.7+i*1.57;X.beginPath();X.moveTo(cx+Math.cos(a)*10,cy+Math.sin(a)*10);X.lineTo(cx+Math.cos(a+.3)*(r+8),cy+Math.sin(a+.3)*(r+8));X.stroke()}}
 X.restore()}
function drawBFg(p){if(!(p.bfg>0))return;const k=p.bfg/22,cx=p.x+p.f*34,cy=p.y-44;X.save();X.globalAlpha=k;X.lineCap='round';X.lineJoin='round';
 for(let i=0;i<5;i++){const a=i*1.26+tick*.9;let px=cx,py=cy;X.strokeStyle=i%2?'#ff1030':'#2a0008';X.lineWidth=i%2?3:5;X.beginPath();X.moveTo(px,py);for(let j=1;j<4;j++){px+=Math.cos(a+Math.sin(tick*2+i+j))*14;py+=Math.sin(a+Math.cos(tick*2+i*j))*14;X.lineTo(px,py)}X.stroke()}
 const g=X.createRadialGradient(cx,cy,2,cx,cy,30);g.addColorStop(0,'rgba(255,40,60,.7)');g.addColorStop(1,'rgba(255,40,60,0)');X.fillStyle=g;X.fillRect(cx-30,cy-30,60,60);X.restore()}
function drawPar(p){if(p.stg>0){X.save();X.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const an=tick*.35+i*1.571;X.globalAlpha=Math.min(1,p.stg/8);X.fillStyle=i%2?'#fde047':'#fff';X.beginPath();X.arc(p.x+Math.cos(an)*16,p.y-96+Math.sin(an)*5,2.6,0,6.283);X.fill()}X.restore()}const a=p.pw>0,v=p.pv>0&&!a;if(!a&&!v&&!(p.cnt>0))return;X.save();X.lineCap='round';
 if(a){const k=p.pw/PW,c=p.f>0?0:3.1416;X.globalCompositeOperation='lighter';X.globalAlpha=.4+.6*k;X.strokeStyle='#fde047';X.lineWidth=4;X.beginPath();X.arc(p.x,p.y-42,40,c-1.1,c+1.1);X.stroke();X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(p.x,p.y-42,34,c-.9,c+.9);X.stroke()}
 else if(v){X.globalAlpha=.5+.5*Math.sin(tick*.8);X.strokeStyle='#f87171';X.lineWidth=3;const bx=p.x,by=p.y-100;X.beginPath();X.moveTo(bx-6,by-6);X.lineTo(bx+6,by+6);X.moveTo(bx+6,by-6);X.lineTo(bx-6,by+6);X.stroke()}
 if(p.cnt>0&&!a){X.globalCompositeOperation='lighter';X.globalAlpha=.6+.4*Math.sin(tick*.6);X.strokeStyle='#fde047';X.lineWidth=2.5;X.beginPath();X.arc(p.x+p.f*26,p.y-44,10+Math.sin(tick*.5)*3,0,6.283);X.stroke()}
 X.restore()}
function BFOV(){if(!(bff>0))return;const k=bff/10;X.save();X.fillStyle='rgba(0,0,0,'+(.55*k)+')';X.fillRect(0,0,W,H);X.globalCompositeOperation='lighter';X.strokeStyle='rgba(255,30,60,'+k+')';X.lineWidth=3;
 for(let i=0;i<6;i++){const y0=(i*83+tick*37)%H;X.beginPath();X.moveTo(0,y0);X.lineTo(W,y0+(i%2?60:-60));X.stroke()}
 const g=X.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.65);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(160,0,20,'+(.6*k)+')');X.fillStyle=g;X.fillRect(0,0,W,H);X.restore()}
function sysHud(p,x,l){X.save();X.direction='ltr';const bw=100,y=130,
 R=[[l?'Q':'P','PARRY',p.pw>0?p.pw/PW:p.pv>0?1-p.pv/PVU:p.pcd>0?1-p.pcd/PCD:1,p.pw>0?'#fde047':p.pv>0?'#7a2a2a':p.pcd>0?'#4a4430':'#fde047',p.pw>0?'ACTIVE':p.pv>0?'OPEN!':p.cnt>0?'COUNTER!':p.pcd>0?Math.ceil(p.pcd/6)/10+'s':'READY'],
 ['ATK×2','BF',p.bfc>0?1-p.bfc/BFC:Math.min(1,p.en/BFE),p.bfc>0?'#4a2a30':p.en>=BFE?'#ff1030':'#3a2a34',p.bfc>0?Math.ceil(p.bfc/60)+'s':p.en<BFE?'need '+BFE+' EN':p.bfl>0?'LOCKED':'READY']];
 R.forEach((r,i)=>{const bx=l?x+i*(bw+6):x+300-bw-i*(bw+6);X.fillStyle='#000a';X.fillRect(bx,y,bw,12);X.fillStyle=r[3];X.fillRect(bx,y,bw*Math.max(0,Math.min(1,r[2])),12);X.fillStyle='#fff';X.font='700 9px system-ui';X.textAlign='left';X.fillText('['+r[0]+'] '+r[1]+' '+r[4],bx+3,y+9)});X.restore()}
/* ===== COMBAT v2: stamina, heavy attack, dash / flash step, perfect dodge, air combo, hit scaling, clash =====
   Light attack (G/✊) = 3-hit combo, 5 stamina. Heavy (B/💥) = slow, 22 stamina, 12f startup, can be guarded (half dmg) and CLASHES with an enemy heavy.
   Dash (V/💨 or double-tap a direction) = 18 stamina, 7 i-frames; an enemy attack that lands in them is a PERFECT DODGE (slow-mo, +energy, free Flash Step).
   Flash Step = dash while holding attack (30 energy) or after a perfect dodge (free): teleports behind the enemy and arms a counter.
   Air: attack while airborne = air combo (3rd hit slams down). Repeated hits scale down (combo scaling + stale same-skill penalty), so spamming is not optimal. */
function stam(p,c){if(p.st>=c){p.st-=c;p.stD=36;return 1}if(tick-p.stP>40){p.stP=tick;pop(p.x,p.y-100,'LOW STAMINA','#94a3b8')}return 0}
function stSys(p){awStep(p);if(p.stD>0)p.stD--;else p.st=Math.min(100,p.st+(p.rt>0?.2:.5)*p.S.stm*(p.awk>0?2:1));
 if(p.inv>0)p.inv--;if(p.cmbT>0&&--p.cmbT===0)p.cmb=0;if(p.pdw>0)p.pdw--;if(p.fsc>0)p.fsc--;if(p.cdD>0)p.cdD--;if(p.dtw>0)p.dtw--;if(p.og)p.ac=0;
 if(tick%2===0){if(p.ds>0){p.tr.push({x:p.x,y:p.y,f:p.f});if(p.tr.length>3)p.tr.shift()}else if(p.tr.length)p.tr.shift()}}
function scaleHit(t,o,atk){if(DOMHIT||o===t)return 1;
 if(t.cmbT>0)t.cmb++;else t.cmb=1;t.cmbT=70;let m=Math.max(.3,1-.12*Math.max(0,t.cmb-3));
 if(atk!=='none'&&atk!=='melee'){if(o.sT===atk&&tick-o.sK<100)o.sR++;else o.sR=0;o.sT=atk;o.sK=tick;m*=Math.max(.5,1-.12*o.sR)}
 if(t.cmb>=3)pop(t.x,t.y-130,t.cmb+' HITS','#fbbf24');return m}
function meleeStats(p,cn){let d=cn?12:p.cb===2?10:4,kx=p.f*(cn?16:p.cb===2?14:7),ky=-3,lb='';
 if(!p.og){p.ac++;p.vy=Math.min(p.vy,-5);if(p.ac>=p.mv.air){d=7;kx=p.f*4;ky=15;lb='AIR SLAM';p.ac=0}else{d=3.5;kx=p.f*3;ky=-9;lb='AIR x'+p.ac}}
 return[d*p.mv.lg,kx,ky,lb]}
function heavyHit(p,q){const dx=Math.abs(q.x-p.x),dy=Math.abs(q.y-p.y);
 if(!(dx<92&&dy<56&&(q.x-p.x)*p.f>-10)){p.cdA=Math.max(p.cdA,22);return}
 if(q.hv>0&&q.hv<=18){clashHit(p,q);return}
 let d=14*p.mv.hv;if(q.at>0&&q.at<12){d*=1.25;pop(q.x,q.y-112,'COUNTER HIT','#fde047')}
 if(!hurtA('heavy',q,d,p.f*20,-6,p)){p.hl=1;pop(q.x,q.y-90,'HEAVY','#fb923c');burst(q.x,q.y-40,'#fb923c',16,8);shake=Math.max(shake,12);snd(90,.3,'sawtooth',.16,-40)}}
function clashHit(p,q){const mx=(p.x+q.x)/2,my=p.y-44;p.hv=0;q.hv=0;p.cdA=q.cdA=24;p.vx=-p.f*12;q.vx=-q.f*12;
 hs=Math.max(hs,8);slo=Math.max(slo,22);shake=Math.max(shake,16);flash=Math.max(flash,.6);
 rings.push({x:mx,y:my,r:6,v:9,l:16,c:'#ffffff'},{x:mx,y:my,r:2,v:5,l:18,c:'#fbbf24'});burst(mx,my,'#ffffff',26,11);burst(mx,my,'#fbbf24',18,9);
 pop(mx,my-50,'CLASH!','#fff');snd(1500,.12,'square',.12,-900);snd(100,.35,'sawtooth',.16,-40)}
function perfectDodge(t,o){if(t.pdw>0)return;t.pdw=45;awAdd(t,12);t.cnt=Math.max(t.cnt,40);t.en=Math.min(100,t.en+t.mv.pdE);t.st=Math.min(100,t.st+30);slo=Math.max(slo,26);flash=Math.max(flash,.25);
 rings.push({x:t.x,y:t.y-34,r:8,v:6,l:16,c:'#67e8f9'});burst(t.x,t.y-34,'#a5f3fc',14,6);pop(t.x,t.y-100,'PERFECT DODGE','#67e8f9');snd(1600,.12,'sine',.1,-500);snd(900,.25,'triangle',.08,-300);vib(20)}
function flashStep(p,q){p.tr.push({x:p.x,y:p.y,f:p.f});if(p.tr.length>3)p.tr.shift();burst(p.x,p.y-34,'#a5f3fc',14,6);
 p.x=Math.max(30,Math.min(WORLD-30,q.x-q.f*64));p.y=q.y;p.vx=0;p.vy=0;p.f=q.x>=p.x?1:-1;p.inv=10;p.pdw=0;p.cnt=40;p.cdA=0;p.at=0;p.hv=0;p.ds=0;
 burst(p.x,p.y-34,'#a5f3fc',18,7);rings.push({x:p.x,y:p.y-34,r:6,v:7,l:14,c:'#67e8f9'});pop(p.x,p.y-100,'FLASH STEP','#67e8f9');flash=Math.max(flash,.35);snd(1200,.1,'sine',.1,-800);snd(500,.12,'triangle',.08,400)}
function doDash(p,q,c,dir){
 if(p.pdw>0||(c.a&&Math.abs(q.x-p.x)<420&&p.en>=p.mv.fsC&&p.fsc<=0)){if(p.pdw<=0){p.en-=p.mv.fsC;p.fsc=120}flashStep(p,q);return}
 if(!stam(p,18*p.mv.dsC))return;
 p.ds=11;p.dd=dir||p.f;p.inv=7;p.cdD=26;p.f=p.dd;p.at=0;burst(p.x,p.y-30,'#e0f2fe',8,4);snd(700,.12,'sawtooth',.06,-400)}
function moveX(p,q,r,c,dir){
 if(dir&&dir!==p.ld){if(p.dtw>0&&p.dtd===dir)r.dh=1;p.dtw=14;p.dtd=dir}p.ld=dir;
 if(r.hv&&p.hv<=0&&p.at<=0&&p.cdA<=0&&!(p.pw>0)&&p.ds<=0&&p.og&&stam(p,22*p.mv.hvC)){p.hv=27;p.cdA=36;face(p,q);snd(150,.22,'sawtooth',.1,-60)}
 if(p.hv>0){p.hv--;if(p.hv>14)p.vx*=.3;if(p.hv===14)heavyHit(p,q)}
 if(r.dh&&p.ds<=0&&p.cdD<=0&&!(p.pw>0)&&p.reel<=0)doDash(p,q,c,dir);
 if(p.ds>0){p.ds--;p.vx=p.dd*(p.ds>4?15:6)*p.mv.dsS;if(!p.og&&p.ds>3)p.vy*=.3}}
function drawTrail(p){if(!p.tr.length||!S.fx)return;const g=p.gh||(p.gh=Object.create(p));g.hit=0;g.inv=0;g.sk=null;g.rt=0;g.at=0;g.hv=0;
 p.tr.forEach((t,i)=>{g.x=t.x;g.y=t.y;g.f=t.f;X.save();X.globalAlpha=.16+.12*i;drawChar(g);X.restore()})}
/* ===== CHARACTER SYSTEM v2: independent stats, upgradable skills, Awakening =====
   Stats live in CH[ch].stats / CH[ch].mv (see registry). Skills level up during the match by landing hits: Lv2 after 3 hits, Lv3 after 7 (+15% damage per level).
   Awakening: the meter fills by dealing/taking damage, parrying and perfect dodges. At 100% press Z / O / 🔥: 10 s of x1.25 damage, x1.12 speed, x2 energy + stamina regen, slow HP regen, tougher. */
const SKM={crimson:'crimson',echo:'echo',wave:'echo',rush:'rush',smash:'smash',slam:'slam',repel:'repel',shred:'shred',heavy:'heavy',bf:'bf'};
const SKNAME={heavy:'HEAVY',bf:'BLACK FLASH'};
let LVK='';
function hurtS(k,t,d,kx,ky,o){LVK=k;return hurt(t,d,kx,ky,o)}
function skillLv(p,k){const n=p.sx[k]||0;return n>=7?3:n>=3?2:1}
function statMul(t,o,lk){if(!o||!o.S||!t.S)return 1;let m=o.S.dmg*(o.awk>0?1.25:1)/(t.S.hp*(t.awk>0?1.15:1));
 if(lk&&o!==t&&!DOMHIT){const b=skillLv(o,lk);o.sx[lk]=(o.sx[lk]||0)+1;const a=skillLv(o,lk);if(a>b)pop(o.x,o.y-124,(SKNAME[lk]||SN[lk]||lk.toUpperCase())+' Lv'+a+'!','#fde047');m*=1+.15*(a-1)}
 return m}
function awAdd(p,v){if(p.awk<=0)p.aw=Math.min(100,p.aw+v)}
function awGain(t,o,d){if(DOMHIT)d*=.4;if(o&&o!==t)awAdd(o,d*.9);awAdd(t,d*.6)}
function awStep(p){const h=!!inp[p.i].aw,e=h&&!p.awh;p.awh=h;
 if(p.awk>0){p.awk--;p.hp=Math.min(100,p.hp+.03);if(tick%5===0)burst(p.x+(Math.random()-.5)*24,p.y-20-Math.random()*50,CH[p.ch].col,1,2);if(p.awk===0){p.aw=0;pop(p.x,p.y-110,'AWAKENING END','#94a3b8')}return}
 if(e&&state==='play'&&p.aw>=100&&!(p.fz>0)&&p.hp>0){const c=CH[p.ch].col;p.awk=600;p.st=100;p.en=Math.min(100,p.en+30);slo=Math.max(slo,34);hs=Math.max(hs,6);flash=1;shake=Math.max(shake,18);
  rings.push({x:p.x,y:p.y-34,r:8,v:9,l:20,c:c},{x:p.x,y:p.y-34,r:2,v:5,l:24,c:'#fff'});burst(p.x,p.y-40,c,34,12);pop(p.x,p.y-110,'AWAKENING!',c);snd(70,1.2,'sawtooth',.2,500);snd(400,.8,'triangle',.1,900)}}
function awHud(p,x,l){const w=150,rx=l?x:x+300-w,on=p.awk>0,f=on?p.awk/600:p.aw/100,rd=p.aw>=100&&!on;
 X.save();X.direction='ltr';X.fillStyle='#000a';X.fillRect(rx,144,w,12);X.fillStyle=on||rd?(tick%16<8?'#fff':CH[p.ch].col):'#6b4f1d';X.fillRect(rx,144,w*f,12);
 X.fillStyle='#fff';X.font='700 9px system-ui';X.textAlign='left';X.fillText('['+(l?'Z':'O')+'] AWAKEN '+(on?Math.ceil(p.awk/60)+'s':rd?'READY':Math.floor(p.aw)+'%'),rx+3,153);X.restore()}
function drawAura(p){if(!(p.awk>0)||!S.fx)return;const c=CH[p.ch].col,pu=Math.sin(tick/5)*4;X.save();X.globalCompositeOperation='lighter';
 const g=X.createRadialGradient(p.x,p.y-40,6,p.x,p.y-40,64+pu);g.addColorStop(0,c+'66');g.addColorStop(1,c+'00');X.fillStyle=g;X.fillRect(p.x-70,p.y-110,140,130);
 X.strokeStyle=c;X.lineWidth=2;for(let i=0;i<5;i++){const ph=((tick*1.5+i*17)%50)/50,fx=p.x+(i-2)*9+Math.sin(tick/4+i)*3;X.globalAlpha=.7*(1-ph);X.beginPath();X.moveTo(fx,p.y-4);X.lineTo(fx+Math.sin(i+tick/6)*4,p.y-10-ph*80);X.stroke()}X.restore()}
function drawTail(LK,bob,sw){const w=Math.sin(tick/5)*3;X.save();
 if(LK.deco==='brawler'){X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.moveTo(-11,-69+bob);X.lineTo(-27+w,-66+bob+w);X.moveTo(-11,-69+bob);X.lineTo(-24+w,-72+bob-w);X.stroke()}
 else if(LK.deco==='clapper'){X.strokeStyle='#ff9f1c';X.lineWidth=5;X.beginPath();X.moveTo(-9,-50+bob);X.quadraticCurveTo(-22-sw*.3,-46+bob+w,-30+w,-38+bob);X.stroke()}
 else if(LK.b){X.fillStyle='#7a1030';X.beginPath();X.moveTo(-10,-50+bob);X.lineTo(-30+w-sw*.4,-24+bob);X.lineTo(-10,-30+bob);X.closePath();X.fill()}
 else{X.fillStyle=LK.jc;X.beginPath();X.moveTo(-10,-48+bob);X.lineTo(-26+w-sw*.4,-18+bob);X.lineTo(-8,-26+bob);X.closePath();X.fill();X.strokeStyle='#7dd3fc';X.lineWidth=1;X.stroke()}
 X.restore()}
/* ===== BATTLE SYSTEM v2: Best-of-3 rounds, maps, training, AI opponent, pause =====
   Local play only: M holds the match (online keeps its original single-round flow, M===null there).
   Menu: PLAY -> mode (2P / AI easy|normal|hard / training) -> map -> (training: pick fighter) -> character roll -> round 1. */
const DEFPL=plats.slice();
const MAPS=[
 {n:'CURSED CITY',sky:['#0b0620','#2a1250','#4a1840'],far:'#1a1038',mid:'#251447',moon:'#f1ebff',glow:'#7c3aed',gnd:'#140f2a',pf:'#1e1738',edge:'#7c3aed',sup:'#3a2a66',fx:'stars',pl:null},
 {n:'EMBER SHRINE',sky:['#1a0508','#5a1410','#a8420f'],far:'#2a0c0c',mid:'#3d1210',moon:'#ffd9a0',glow:'#f97316',gnd:'#1c0a08',pf:'#2e1410',edge:'#f97316',sup:'#6b2a14',fx:'embers',pl:[{x:0,y:GY,w:WORLD},{x:140,y:320,w:220},{x:1140,y:320,w:220},{x:600,y:300,w:300},{x:660,y:200,w:180}]},
 {n:'STORM DISTRICT',sky:['#050b18','#0f2540','#1d3d5c'],far:'#0a1628',mid:'#102238',moon:'#9fd4ff',glow:'#38bdf8',gnd:'#08121f',pf:'#132a40',edge:'#38bdf8',sup:'#24506e',fx:'rain',pl:[{x:0,y:GY,w:WORLD},{x:100,y:320,w:220},{x:1180,y:320,w:220},{x:500,y:300,w:200},{x:800,y:210,w:200},{x:300,y:210,w:160}]},
 {n:'VOID COLOSSEUM',sky:['#04010a','#150a2e','#2e0f4a'],far:'#0f0720',mid:'#1a0d38',moon:'#c4b5fd',glow:'#a855f7',gnd:'#0b0618',pf:'#1a0f33',edge:'#a855f7',sup:'#4a2a85',fx:'orbs',pl:[{x:0,y:GY,w:WORLD},{x:100,y:320,w:140},{x:1260,y:320,w:140},{x:560,y:300,w:380},{x:210,y:220,w:150},{x:1140,y:220,w:150},{x:660,y:190,w:180}]}];
let MP=MAPS[0],M=null,PAUSED=0,OVA=null,PB=false;
function setMap(i){MP=MAPS[i]||MAPS[0];plats.length=0;(MP.pl||DEFPL).forEach(p=>plats.push(p))}
function bgFx(m){if(!S.fx)return;const t=tick;X.save();
 if(m.fx==='embers'){X.fillStyle='#ffb347';for(let i=0;i<26;i++){X.globalAlpha=.25+.5*((i*7)%5)/5;const y=H-((t*(.5+(i%4)*.3)+i*53)%H),x=((i*83+Math.sin(t/40+i)*18-cam.x*.08)%W+W)%W;X.fillRect(x,y,2,2)}}
 else if(m.fx==='rain'){X.strokeStyle='#b4dcff';X.globalAlpha=.3;X.lineWidth=1;X.beginPath();for(let i=0;i<34;i++){const x=(i*59+t*2)%W,y=(t*13+i*71)%H;X.moveTo(x,y);X.lineTo(x-3,y+13)}X.stroke();const l=t%420;if(l<7){X.globalAlpha=.2*(1-l/7);X.fillStyle='#d8eeff';X.fillRect(0,0,W,H)}}
 else if(m.fx==='orbs'){X.fillStyle='#c4b5fd';for(let i=0;i<9;i++){X.globalAlpha=.18+.15*Math.sin(t/30+i);const x=((i*113+Math.sin(t/90+i)*40-cam.x*.06)%W+W)%W,y=70+((i*47)%240)+Math.cos(t/70+i)*16;X.beginPath();X.arc(x,y,3+(i%3),0,7);X.fill()}}
 else{X.fillStyle='#fff';for(let i=0;i<12;i++){X.globalAlpha=.3+.4*Math.sin(t/20+i*2);X.fillRect((i*131+40)%W,(i*37)%160+6,2,2)}}
 X.restore()}
function newMatch(mode,diff,map){M={mode,diff:diff|0,w:[0,0],rd:1,map:map==='r'||map===undefined?(Math.random()*MAPS.length|0):+map,a:0,b:1,over:0,bn:0,nx:0,A:null,T:null,last:-1};PAUSED=0}
function solo(){return !!M&&!ON.role&&M.mode!=='pvp'}
function nmP(i){return (i===1&&M&&M.mode==='ai'?'الكمبيوتر':'اللاعب '+(i+1))+' ('+P[i].name+')'}
function modeStep(){if(M.bn>0){M.bn--;if(M.bn===99)snd(420,.12,'square',.08,200);if(M.bn===39)snd(760,.25,'sawtooth',.1,500)}if(M.mode==='ai')aiThink(1);else if(M.mode==='train')trainStep()}
function roundEnd(){const a=P[0].hp>0,b=P[1].hp>0;M.last=a&&!b?0:b&&!a?1:-1;if(M.last>=0)M.w[M.last]++;
 const sc=M.w[0]+' - '+M.w[1];
 if(M.w[0]>=2||M.w[1]>=2){const w=M.w[0]>=2?0:1;M.over=1;showOv('🏆 فاز '+nmP(w)+' بالمباراة','النتيجة النهائية '+sc+(M.mode==='ai'?(w===0?' — انتصرت على الكمبيوتر!':' — فاز الكمبيوتر'):''),'مباراة جديدة (شخصيات عشوائية)');
  const r=$('ob3');r.style.display='inline-block';r.textContent='إعادة المباراة (نفس الشخصيات)';snd(600,.3,'triangle',.1,500);snd(900,.4,'triangle',.08,600)}
 else{showOv(M.last<0?'⚖️ تعادل — تُعاد الجولة':'🏁 فاز '+nmP(M.last)+' بالجولة '+M.rd,'النتيجة '+sc+' (أفضل من 3)','الجولة التالية');OVA=nextRound;M.nx=240}}
function nextRound(){OVA=null;M.nx=0;if(M.last>=0)M.rd++;reset(CK[M.a],CK[M.b])}
function rematch(){newMatch(M.mode,M.diff,M.map);reset(CK[M.a],CK[M.b])}
function pauseGame(){if(!M||ON.role||state!=='play'||PAUSED)return;PAUSED=1;showOv('⏸ إيقاف مؤقت',M.mode==='train'?'وضع التدريب':'الجولة '+M.rd+' • '+MP.n,'استئناف');OVA=()=>{OVA=null;PAUSED=0;$('ov').style.display='none'}}
function matchHud(){if(!M)return;const sh=state==='play'&&!ON.role&&!PAUSED;if(sh!==PB){PB=sh;$('pause').style.display=sh?'block':'none'}
 X.save();X.direction='ltr';X.textAlign='center';X.fillStyle='#fff';X.font='800 12px system-ui';
 X.fillText(M.mode==='train'?'TRAINING':'ROUND '+M.rd+(M.mode==='ai'?' • CPU':''),W/2,26);X.font='600 9px system-ui';X.fillStyle='#c4b5fd';X.fillText(MP.n,W/2,66);
 if(M.mode!=='train')for(let i=0;i<2;i++)for(let k=0;k<2;k++){X.fillStyle=M.w[i]>k?'#fbbf24':'#ffffff33';X.beginPath();X.arc(i?500-k*14:400+k*14,44,5,0,7);X.fill()}
 else if(M.T){X.font='700 12px system-ui';X.fillStyle='#fde047';X.fillText('COMBO '+(P[1].cmbT>0?P[1].cmb:0)+'   •   DMG '+Math.round(M.T.sum)+'   •   BEST '+M.T.max,W/2,H-14)}
 if(M.bn>0&&state==='play'){const f=M.bn>40,k=f?(M.bn-40)/60:M.bn/40;X.globalAlpha=Math.min(1,k*1.6);X.font='900 '+(f?44:56)+'px system-ui';X.lineWidth=5;X.strokeStyle='#000';X.fillStyle=f?'#fff':'#fbbf24';const tx=f?'ROUND '+M.rd:'FIGHT!';X.strokeText(tx,W/2,170);X.fillText(tx,W/2,170)}
 X.restore()}
function trainStep(){const T=M.T||(M.T={sum:0,last:-999,prev:100,max:0}),a=P[0],d=P[1];a.hp=100;a.st=100;a.en=Math.min(100,a.en+1.2);
 if(d.hp<T.prev&&T.prev-d.hp<100){if(tick-T.last>90)T.sum=0;T.sum+=T.prev-d.hp;T.last=tick;if(T.sum>T.max)T.max=Math.round(T.sum)}
 if(d.hit<=0&&tick-T.last>120&&d.hp<100)d.hp=Math.min(100,d.hp+1.5);if(d.hp<=0)d.hp=.5;T.prev=d.hp}
/* AI: decisions every rt frames (reaction), threat responses every frame (rolled once per enemy attack). */
const AID=[{rt:18,agg:.3,par:.25,dod:.15,skl:.4,err:.3},{rt:11,agg:.5,par:.5,dod:.35,skl:.7,err:.15},{rt:6,agg:.75,par:.75,dod:.6,skl:1,err:.05}];
function aiThink(i,df){i=i===undefined?1:i;const p=P[i],q=P[1-i],c=inp[i],r=pr[i],D=AID[df===undefined?M.diff:df]||AID[1],AA=M.A||(M.A=[null,null]),A=AA[i]||(AA[i]={t:0,dir:0,act:0,act2:0,th:0,heal:0});
 for(const k in r)r[k]=0;c.l=c.r=c.h=c.hv=c.dh=c.aw=c.a=c.s=c.s2=c.s3=c.d=c.n=c.pa=c.j=0;
 if(p.hp<=0||p.fz>0||p.reel>0)return;
 const dx=q.x-p.x,ad=Math.abs(dx),dy=q.y-p.y,fc=dx>=0?1:-1;
 const hvy=q.hv>=16&&q.hv<=21&&ad<120,atk=q.at>=10&&q.at<=13&&ad<88&&q.hit<6;
 if(!(hvy||atk))A.th=0;else if(!A.th){A.th=1;const u=Math.random();
  if(u<D.par&&!hvy)c.pa=1;else if(u<D.par+D.dod&&p.st>=20){r.dh=c.dh=1;if(fc>0)c.l=1;else c.r=1;return}}
 if(A.th)return;
 for(const s of shots)if(s.o===1-i&&!(s.dl>0)&&Math.abs(s.x-p.x)<150&&Math.abs(s.y-(p.y-30))<70&&Math.random()<.03*(1+D.dod*3)){if(p.og)r.j=c.j=1;else if(p.st>=20){r.dh=c.dh=1;if(fc>0)c.l=1;else c.r=1}return}
 if(p.aw>=100&&!(p.awk>0)&&ad<420)c.aw=1;
 let fresh=false;
 if(--A.t<=0){fresh=true;A.t=D.rt+(Math.random()*D.rt|0);A.dir=0;A.act=0;A.act2=0;
  if(p.hp<50&&p.en>=40&&ad>240&&!(p.rt>0)&&Math.random()<.5)A.heal=28;
  if(Math.random()<D.err)A.dir=Math.random()<.5?-1:1;
  else{const u=Math.random();
   if(ad>300){A.dir=fc;if(ad>420&&p.st>40&&u<.35)A.act='dash'}
   else if(ad>78){A.dir=fc;if(u<D.skl*.45)A.act='skill';else if(ad<190&&u>.82)A.act='heavy'}
   else{if(u<D.agg)A.act='melee';else if(u<D.agg+.12)A.act='heavy';else A.dir=-fc}}
  if(dy<-70&&Math.random()<.5)A.act2='jump';
  if(!CH[p.ch].kit&&!p.sk&&!(p.reel>0)&&ad>110){const k=pick.find(z=>z.o===i&&z.g);if(k){A.dir=Math.sign(k.x-p.x)||1;A.act=0;if(k.y<p.y-60&&Math.abs(k.x-p.x)<170)A.act2='jump'}}}
 if(A.heal>0){A.heal--;c.h=1;if(ad<150)A.heal=0}
 if(A.dir>0)c.r=1;else if(A.dir<0)c.l=1;
 if(A.act==='melee'&&p.cdA<=0&&ad<82&&p.st>10)r.a=c.a=1;
 if(fresh){
  if(A.act==='dash'&&p.st>40)r.dh=c.dh=1;
  else if(A.act==='heavy'&&p.og&&p.st>=30)r.hv=c.hv=1;
  else if(A.act==='skill'){const kit=CH[p.ch].kit;
   if(kit){const ks=['s','s2','s3'].filter((k,n)=>p.en>=SKD[kit[n]].c&&!(p.cds[kit[n]]>0));if(ks.length){const k=ks[Math.random()*ks.length|0];r[k]=c[k]=1}}
   else if(p.sk&&p.en>=100)r.s=c.s=1;else if(CH[p.ch].dom&&p.en>=100)r.d=c.d=1}
  if(A.act2==='jump'&&p.og)r.j=c.j=1}}
/* ===== PERFORMANCE / AUDIO / FEEL v2 =====
   S.fx = quality (auto-off on weak devices, and auto-switched off if the frame time stays above ~26 ms). Particle / ring / pop caps bound memory.
   The main loop runs at most 3 fixed steps per frame so a slow phone slows the game down instead of spiralling. */
const Q={note:0};let FT=16.7,slowN=0;
function perfSample(dt){if(!(dt>0)||dt>250)return;FT+=(dt-FT)*.06;if(S.fx&&FT>26&&state==='play'){if(++slowN>150){S.fx=0;Q.note=260;slowN=0}}else if(slowN>0)slowN--}
function capFx(){if(rings.length>24)rings.splice(0,rings.length-24);if(pops.length>10)pops.splice(0,pops.length-10);if(bolts.length>40)bolts.splice(0,bolts.length-40)}
function qHud(){if(!(Q.note>0))return;Q.note--;X.save();X.direction='ltr';X.textAlign='center';X.font='700 12px system-ui';X.fillStyle='#fde047';X.globalAlpha=Math.min(1,Q.note/40);X.fillText('Performance mode ON (Settings: quality)',W/2,H-30);X.restore()}
let VG=null;function vigDraw(){const k=Math.max(0,Math.min(1,(1-TS)*1.5));if(k<.05)return;if(!VG){VG=document.createElement('canvas');VG.width=W;VG.height=H;const g2=VG.getContext('2d'),g=g2.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,W*.62);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.65)');g2.fillStyle=g;g2.fillRect(0,0,W,H)}X.globalAlpha=k;X.drawImage(VG,0,0);X.globalAlpha=1}
let NB=null;function nz(d,v,hp){if(!S.sfx)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(!NB){const n=AC.sampleRate*.4|0;NB=AC.createBuffer(1,n,AC.sampleRate);const a=NB.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1}
 const t=AC.currentTime,s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=NB;fl.type='highpass';fl.frequency.value=hp||800;g.gain.setValueAtTime(v||.1,t);g.gain.exponentialRampToValueAtTime(.001,t+Math.min(.38,d));s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+Math.min(.38,d))}catch(e){}}
function hitSnd(d){if(d>=14){nz(.2,.2,300);snd(70,.25,'sawtooth',.18,-30);snd(140,.2,'square',.1,-90)}else if(d>=7){nz(.1,.13,1100);snd(160,.12,'square',.1,-90)}else{nz(.05,.08,2500);snd(230,.07,'triangle',.08,-80)}}
function vib(ms){if(S.vib&&navigator.vibrate){try{navigator.vibrate(ms)}catch(e){}}}
/* ===== ONLINE MULTIPLAYER (room capability; host-authoritative) =====
   Host (P1) runs the whole simulation: damage, cooldowns, domains, clash, winner. Guest (P2) only sends inputs and renders host snapshots. */
const ON={role:null,code:'',nr:null,R:undefined,gp:null,hp:null,accepted:false,full:false,pc:[0,0,0,0,0,0,0,0,0,0],gin:null,ginT:0,paused:false,pauseT:0,lostT:0,lastSnap:0,snap:null,fresh:0,msg:'',unsub:[],seq:0,cnt:[0,0,0,0,0,0,0,0,0,0],lm:0,lc:'',lt:0,srv:0,pi:0,tok:'',s:null,up:false,rm:null,rmT:0,rtt:undefined,mt:{w:[0,0],rd:1},ban:null};
const NK=['l','r','j','a','s','s2','s3','d','n','h','pa','hv','dh','aw'],PK=['j','a','s','s2','s3','d','n','hv','dh','aw'];
function li(i){return ON.role||solo()?0:i}
let evq=[];const _burst=burst,_snd=snd;
burst=function(x,y,c,n,s){if(ON.role==='host'&&evq.length<30)evq.push(['b',x|0,y|0,c,n,s]);return _burst(x,y,c,n,s)};
snd=function(f,d,ty,v,sl,m){if(ON.role==='host'&&!m&&evq.length<30)evq.push(['n',f|0,d,ty,v,sl|0]);return _snd(f,d,ty,v,sl,m)};
function netPre(){const g=ON.gin&&Date.now()-ON.ginT<400?ON.gin:null;NK.forEach((k,i)=>{inp[1][k]=g?(g.m>>i)&1:0});PK.forEach((k,i)=>{const c=g?g.c[i]|0:0;if(c>ON.pc[i]){pr[1][k]=1;ON.pc[i]=c}})}
function sendSnap(){const r=n=>Math.round(n*10)/10;
 const pl=P.map(p=>({x:r(p.x),y:r(p.y),vx:r(p.vx),vy:r(p.vy),f:p.f,h:r(p.hp),e:r(p.en),ht:p.hit,a:p.at,s:p.sp,g:p.og?1:0,w:r(p.wk),r:p.reel,z:p.fz,rg:p.ring,rc:p.rcd,dc:p.dcd,sk:p.sk,ls:p.lsk,cd:p.cds,cb:p.cb,rs:p.rs,rt:p.rt,rd:p.rtd,rr:p.rtc,rz:p.rtz,rk:p.rtk,pw:p.pw,sg:p.stg,pv:p.pv,cn:p.cnt,bc:p.bfc,bg:p.bfg,hv:p.hv,ds:p.ds,iv:p.inv,sm:r(p.st),aw:r(p.aw),ak:p.awk}));
 const s={q:++ON.seq,st:state,ch:[P[0].ch,P[1].ch],p:pl,sh:shots.filter(z=>z.dl<=0||z.t==='cleave').slice(0,14).map(z=>[z.t,r(z.x),r(z.y),r(z.vx),z.r,z.o,z.dl|0,z.life|0]),pk:pick.map(k=>[k.x|0,k.y|0,k.type,k.o,k.g]),dm:DM.map(d=>({o:d.o,ty:d.ty,age:d.age,t:d.t})),cl:CL,
  rg:rings.slice(0,8).map(z=>[z.x|0,z.y|0,z.r|0,z.v,z.l,z.c]),ds:dsl.slice(0,12).map(z=>[z.x|0,z.y|0,r(z.a),z.len|0,z.l,z.amb?1:0]),sc:scars.slice(0,6).map(z=>[z.x|0,z.l]),po:pops.slice(0,5).map(z=>[z.x|0,z.y|0,z.t,z.c,z.l]),bo:bolts.slice(0,6).map(z=>[z.pts[0][0]|0,z.pts[0][1]|0,Math.sign(z.pts[1][0]-z.pts[0][0]),z.c,z.l]),sk:r(shake),fl:r(flash),wp:r(warp),bf:bff,ev:evq};
 evq=[];let j=JSON.stringify(s);if(j.length>3900){s.ev=s.ev.slice(0,6);s.ds=s.ds.slice(0,5);j=JSON.stringify(s)}if(j.length>3900){s.ev=[];s.sh=s.sh.slice(0,8)}
 ON.nr.emit('s',s).catch(()=>{})}
function cosm(){for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.l--}parts=parts.filter(p=>p.l>0);bolts.forEach(b=>b.l--);bolts=bolts.filter(b=>b.l>0);rings.forEach(r=>{r.r+=r.v;r.l--});rings=rings.filter(r=>r.l>0);capFx();pops.forEach(o=>{o.y-=.8;o.l--});pops=pops.filter(o=>o.l>0);dsl.forEach(s=>s.l--);dsl=dsl.filter(s=>s.l>0);scars.forEach(s=>s.l--);scars=scars.filter(s=>s.l>0);shake*=.9;flash*=.9;warp*=.9;if(bff>0)bff--}
function applySnap(s){
 if(!P||P[0].ch!==s.ch[0]||P[1].ch!==s.ch[1]||(state!=='play'&&state!=='over')){reset(s.ch[0],s.ch[1]);$('menu').style.display='none';$('pn').style.display='none'}
 s.p.forEach((q,i)=>{const p=P[i],far=p.x===undefined||Math.hypot(p.x-q.x,p.y-q.y)>150;p.tx=q.x;p.ty=q.y;p.vx=q.vx;p.vy=q.vy;p.f=q.f;p.hp=q.h;p.en=q.e;p.hit=q.ht;p.at=q.a;p.sp=q.s;p.og=!!q.g;p.wk=q.w;p.reel=q.r;p.fz=q.z;p.ring=q.rg;p.rcd=q.rc;p.dcd=q.dc;p.sk=q.sk;p.lsk=q.ls;p.cds=q.cd||{};p.cb=q.cb;p.rs=q.rs;p.rt=q.rt|0;p.rtd=q.rd|0;p.rtc=q.rr|0;p.rtz=q.rz|0;p.rtk=q.rk|0;p.pw=q.pw|0;p.stg=q.sg|0;p.pv=q.pv|0;p.cnt=q.cn|0;p.bfc=q.bc|0;p.bfg=q.bg|0;p.hv=q.hv|0;p.ds=q.ds|0;p.inv=q.iv|0;p.st=q.sm;p.aw=q.aw;p.awk=q.ak|0;if(far){p.x=q.x;p.y=q.y}});
 shots=s.sh.map(z=>({t:z[0],x:z[1],y:z[2],vx:z[3],vy:0,r:z[4],o:z[5],dl:z[6],life:z[7]}));pick=s.pk.map(k=>({x:k[0],y:k[1],type:k[2],o:k[3],g:k[4]}));
 DM=s.dm||[];CL=s.cl||null;rings=s.rg.map(z=>({x:z[0],y:z[1],r:z[2],v:z[3],l:z[4],c:z[5]}));dsl=s.ds.map(z=>({x:z[0],y:z[1],a:z[2],len:z[3],l:z[4],amb:z[5]}));scars=s.sc.map(z=>({x:z[0],l:z[1]}));pops=s.po.map(z=>({x:z[0],y:z[1],t:z[2],c:z[3],l:z[4]}));
 bolts=s.bo.map(z=>{const b=mkBolt(z[0],z[1],z[2]||1,z[3]);b.l=z[4];return b});shake=Math.max(shake,s.sk);flash=Math.max(flash,s.fl);warp=Math.max(warp,s.wp);bff=Math.max(bff,s.bf|0);
 for(const e of s.ev){if(e[0]==='b')_burst(e[1],e[2],e[3],e[4],e[5]);else _snd(e[1],e[2],e[3],e[4],e[5])}
 if(s.st==='over'&&state!=='over'){state='over';overT=60}if(s.st==='play'&&state==='over'){state='play';$('ov').style.display='none'}}
function guestStep(){
 if(ON.snap&&ON.fresh){ON.fresh=0;try{applySnap(ON.snap)}catch(e){}}
 if(P&&P[0]&&P[1]){for(const p of P){if(p.tx!==undefined){p.tx+=p.vx;if(!p.og){p.ty+=p.vy;p.vy+=.55}p.x+=(p.tx-p.x)*.4;p.y+=(p.ty-p.y)*.4}if(p.dcd>0)p.dcd--;if(p.rcd>0)p.rcd--;if(p.ring>0)p.ring--;for(const k in p.cds)if(p.cds[k]>0)p.cds[k]--}
  P.forEach(p=>{if(p.rtc>0)p.rtc--;if(p.rt>0)p.rtd++;if(p.pw>0)p.pw--;if(p.pv>0)p.pv--;if(p.cnt>0)p.cnt--;if(p.bfc>0)p.bfc--;if(p.bfg>0)p.bfg--;if(p.hv>0)p.hv--;if(p.ds>0)p.ds--;if(p.inv>0)p.inv--;if(p.awk>0)p.awk--});shots.forEach(s=>{s.x+=s.vx});if(!CL)DM.forEach(d=>{d.age++;d.t--});else CL.t--}
 cosm();
 if(state==='over'&&overT>0&&--overT===0&&!ON.srv){const w=P[0].hp>0?'اللاعب 1 ('+P[0].name+')':'اللاعب 2 ('+P[1].name+')';showOv('🏆 فاز '+w,'بانتظار المضيف لبدء جولة جديدة','…');$('ob').disabled=true}
 PK.forEach((k,i)=>{if(pr[0][k])ON.cnt[i]++});let m=0;NK.forEach((k,i)=>{if(inp[0][k])m|=1<<i});const lc=ON.cnt.join(),chg=m!==ON.lm||lc!==ON.lc;
 if(ON.nr&&((chg&&tick-ON.lt>=2)||tick-ON.lt>=4)){ON.lt=tick;ON.lm=m;ON.lc=lc;ON.nr.emit('i',{m,c:ON.cnt.slice(),n:++ON.seq}).catch(()=>{})}
 pr.forEach(o=>{o.j=o.a=o.s=o.s2=o.s3=o.d=o.n=o.hv=o.dh=o.aw=0})}
/* ---- Online client (Socket.IO). The SERVER runs the match (damage, health, rounds, winner); both players only send inputs and render server snapshots. ---- */
function sock(){if(ON.s)return ON.s;const N=window.CPBNet,s=N&&N.get();if(!s)return null;ON.s=s;
 s.on('connect',()=>{ON.up=true;if(ON.code&&ON.tok)s.timeout(8000).emit('resume',{code:ON.code,token:ON.tok},ackIn);uiStatus()});
 s.on('disconnect',()=>{ON.up=false;uiStatus()});
 s.on('connect_error',()=>{ON.up=false;if(!ON.role)setStatus('تعذر الوصول إلى الخادم')});
 s.on('s',d=>{try{const o=typeof d==='string'?JSON.parse(d):d;if(o&&Array.isArray(o.p)){ON.snap=o;ON.fresh=1;ON.lastSnap=Date.now()}}catch(e){}});
 s.on('room',r=>{ON.rm=r;ON.rmT=Date.now();uiStatus()});
 s.on('g',onG);s.on('m',onM);
 s.on('closed',d=>leaveOnline(true,d&&d.reason==='opponent_left'?'غادر اللاعب الآخر أو انتهت مهلة إعادة الاتصال':'أُغلقت الغرفة'));
 setInterval(()=>{if(s.connected){const t=Date.now();s.timeout(3000).emit('p',t,(e)=>{if(!e)ON.rtt=Date.now()-t})}},2000);
 return s}
function saveRoom(){try{sessionStorage.setItem('cpb_room',JSON.stringify({c:ON.code,t:ON.tok}))}catch(e){}}
function enterRoom(res){const s=ON.s;ON.role='guest';ON.srv=1;ON.code=res.code;ON.tok=res.token||ON.tok;ON.pi=res.pi;ON.snap=null;ON.paused=false;ON.cnt=[0,0,0,0,0,0,0,0,0,0];ON.seq=0;ON.lm=0;ON.lc='';ON.lt=0;ON.lastSnap=Date.now();ON.rm=null;ON.mt={w:[0,0],rd:1};ON.ban=null;inp.forEach(o=>{for(const k in o)o[k]=0});
 ON.nr={emit(t,d){if(s.connected)s.emit(t,d);return Promise.resolve()},connected(){return s.connected}};saveRoom()}
function ackIn(err,res){if(err||!res||!res.ok){const m={not_found:'الغرفة غير موجودة',full:'الغرفة ممتلئة',bad_code:'الكود غير صحيح',bad_token:'انتهت الجلسة',busy:'الخادم مشغول'}[res&&res.err]||'تعذر الاتصال بالخادم، حاول مرة أخرى';if(ON.role||ON.code)leaveOnline(true,m);else setStatus(m);return}
 const first=!ON.role;enterRoom(res);if(first){if(res.phase==='lobby')onlinePanel(res.pi===0?'host':'wait');else{$('menu').style.display='none';$('pn').style.display='none'}}uiStatus()}
function setStatus(t){const e=$('ost');if(e)e.textContent=t}
function uiStatus(){if(!$('ost')||!ON.role)return;const r=ON.rm;
 if($('rcode'))$('rcode').textContent=ON.code;
 if(!ON.up){setStatus('جارٍ إعادة الاتصال بالخادم…');if($('rstart'))$('rstart').disabled=true;return}
 const o=r&&r.p&&r.p[1-ON.pi],on=!!(o&&o.c);
 if(ON.pi===0){setStatus(on?'✅ اللاعب الآخر متصل — اضغط START':o?'⚠ اللاعب الآخر منقطع… بانتظار عودته':'⏳ بانتظار انضمام اللاعب الآخر… أرسل له الكود');if($('rstart'))$('rstart').disabled=!on}
 else setStatus(on?'✅ تم الاتصال — بانتظار بدء المضيف…':'⚠ المضيف غير متصل')}
function onG(d){if(!ON.role||!d||d.k!=='start')return;const n=CK.length;if(!Number.isInteger(d.a)||!Number.isInteger(d.b)||d.a<0||d.b<0||d.a>=n||d.b>=n||d.a===d.b)return;$('pn').style.display='none';$('menu').style.display='none';DM=[];CL=null;ON.snap=null;ON.mt={w:[0,0],rd:1};ON.ban=null;startSelect(d.a,d.b)}
function onM(d){if(!ON.role||!d)return;if(Array.isArray(d.w))ON.mt={w:d.w,rd:d.rd|0||1};
 if(d.k==='ko')ON.ban={t:d.win<0?'DRAW — REPLAY':'P'+(d.win+1)+' WINS THE ROUND',l:150};
 else if(d.k==='round')ON.ban={t:'ROUND '+ON.mt.rd+' — FIGHT!',l:110};
 else if(d.k==='match'){const w=d.win,nm=P&&P[w]?P[w].name:'';showOv((w===ON.pi?'🏆 فزت بالمباراة':'💀 خسرت المباراة')+' — اللاعب '+(w+1)+' ('+nm+')','النتيجة النهائية '+d.w[0]+' - '+d.w[1],'إعادة المباراة (شخصيات عشوائية)');$('ob').disabled=false}
 else if(d.k==='rematch'&&$('op'))$('op').textContent='اللاعب الآخر يريد إعادة المباراة'}
function onlineStart(){if(ON.pi===0&&ON.s)ON.s.emit('start')}
function onlineRestart(){if(!ON.s)return;ON.s.emit('rematch');$('ob').disabled=true;$('op').textContent='بانتظار اللاعب الآخر…'}
function leaveOnline(close,msg){const s=ON.s;if(s&&!close)try{s.emit('leave')}catch(e){}ON.role=null;ON.srv=0;ON.code=ON.tok='';ON.snap=null;ON.rm=null;ON.nr=null;ON.paused=false;ON.ban=null;try{sessionStorage.removeItem('cpb_room')}catch(e){}
 inp.forEach(o=>{for(const k in o)o[k]=0});DM=[];CL=null;toMenu();if(msg)onlinePanel('msg',msg);else $('pn').style.display='none'}
function onlinePanel(kind,msg){const p=$('pn');p.style.display='flex';
 if(kind==='host')p.innerHTML='<div class=pc><h3>CREATE ROOM</h3><p>كود الغرفة (أرسله لصديقك):</p><p><b id=rcode class=big>'+(ON.code||'·····')+'</b></p><p id=ost></p><button class=mb id=rstart disabled>START</button> <button class=mb id=rcopy>COPY CODE</button> <button class=mb id=rleave>LEAVE</button></div>';
 else if(kind==='wait')p.innerHTML='<div class=pc><h3>ROOM</h3><p><b id=rcode class=big>'+ON.code+'</b></p><p id=ost></p><button class=mb id=rleave>LEAVE</button></div>';
 else if(kind==='join')p.innerHTML='<div class=pc><h3>JOIN ROOM</h3><p>اكتب كود الغرفة:</p><p><input id=rin maxlength=5 autocomplete=off></p><p id=ost></p><button class=mb id=rgo>JOIN</button> <button class=mb id=rleave>BACK</button></div>';
 else p.innerHTML='<div class=pc><h3>ONLINE</h3><p id=ost></p><button class=mb id=rleave>OK</button></div>';
 if(msg)setStatus(msg);
 $('rleave').onclick=()=>{click();if(ON.role)leaveOnline();else $('pn').style.display='none'};
 if(kind==='host'){$('rstart').onclick=()=>{click();onlineStart()};$('rcopy').onclick=()=>{click();try{navigator.clipboard.writeText(ON.code)}catch(e){}};uiStatus()}
 if(kind==='wait')uiStatus();
 if(kind==='join')$('rgo').onclick=()=>{click();doJoin()}}
function createRoom(){click();musicOn();onlinePanel('host');const s=sock();if(!s){setStatus('الأونلاين غير مُعدّ: لم يتم تحميل مكتبة Socket.IO');return}
 setStatus('جارٍ إنشاء الغرفة…');s.timeout(8000).emit('create',{},(e,r)=>{if(e||!r||!r.ok){setStatus('تعذر الاتصال بالخادم');return}enterRoom(r);if($('rcode'))$('rcode').textContent=r.code;uiStatus()})}
function doJoin(){const c=($('rin').value||'').trim().toUpperCase();if(!/^[A-Z2-9]{5}$/.test(c)){setStatus('الكود غير صحيح (5 خانات)');return}
 const s=sock();if(!s){setStatus('الأونلاين غير مُعدّ: لم يتم تحميل مكتبة Socket.IO');return}
 setStatus('جارٍ الانضمام…');s.timeout(8000).emit('join',{code:c},(e,r)=>{if(e||!r||!r.ok){const m={not_found:'الغرفة غير موجودة',full:'الغرفة ممتلئة',bad_code:'الكود غير صحيح'}[r&&r.err]||'تعذر الاتصال بالخادم';setStatus(m);return}enterRoom(r);onlinePanel('wait');uiStatus()})}
function netHud(){if(!ON.role)return;X.save();X.textAlign='center';X.font='700 11px system-ui';const up=ON.up&&ON.s&&ON.s.connected;
 X.fillStyle=up?'#4ade80':'#f87171';X.fillText((up?'● ONLINE':'● RECONNECTING')+' — YOU ARE P'+(ON.pi+1)+'  ['+ON.code+']'+(up&&ON.rtt!==undefined?'  '+ON.rtt+'ms':''),W/2,14);
 const r=ON.rm,o=r&&r.p&&r.p[1-ON.pi],gl=r&&r.gl?Math.max(0,Math.ceil((r.gl-(Date.now()-ON.rmT))/1000)):0;
 X.font='700 10px system-ui';X.fillStyle=!o?'#fbbf24':o.c?'#4ade80':'#f87171';X.fillText(!o?'OPPONENT: —':o.c?'OPPONENT: CONNECTED':'OPPONENT: DISCONNECTED',W/2,H-8);
 if(state==='play'||state==='over'){X.font='800 12px system-ui';X.fillStyle='#fff';X.fillText('ROUND '+ON.mt.rd,W/2,26);for(let i=0;i<2;i++)for(let k=0;k<2;k++){X.fillStyle=ON.mt.w[i]>k?'#fbbf24':'#ffffff33';X.beginPath();X.arc(i?500-k*14:400+k*14,44,5,0,7);X.fill()}}
 let m='';if(!up)m='CONNECTION LOST — reconnecting…';else if(o&&!o.c)m='OPPONENT DISCONNECTED — waiting '+gl+'s';else if(state==='play'&&Date.now()-ON.lastSnap>2500)m='WAITING FOR SERVER…';
 if(!m&&ON.ban&&ON.ban.l-->0){X.font='900 26px system-ui';X.fillStyle='#fde047';X.globalAlpha=Math.min(1,ON.ban.l/30);X.fillText(ON.ban.t,W/2,H/2-40);X.globalAlpha=1}
 if(m){X.fillStyle='rgba(0,0,0,.7)';X.fillRect(W/2-190,H/2-22,380,40);X.fillStyle='#fff';X.font='800 14px system-ui';X.fillText(m,W/2,H/2+4)}X.restore()}
$('bCreate').onclick=createRoom;$('bJoin').onclick=()=>{click();onlinePanel('join')};
(function(){try{const v=JSON.parse(sessionStorage.getItem('cpb_room')||'null');if(v&&v.c&&v.t){ON.code=v.c;ON.tok=v.t;sock()}}catch(e){}})();
let last=0,acc=0;function loop(ts){perfSample(ts-last);acc+=Math.min(100,ts-last)*TS;last=ts;let ns=0;while(acc>=16.67&&ns++<3){step();acc-=16.67}if(acc>50)acc=0;render();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
