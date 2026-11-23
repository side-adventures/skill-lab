/* ================= shelf objects (local: x centred, y = 0 on the shelf) ================= */
const BOOKC=['#2563eb','#16a34a','#eab308','#9333ea','#dc2626','#0ea5e9','#be123c','#0f766e','#f97316'];
const sc15=b=>b.map(v=>v*1.5);
const SHO={
 clock:{box:()=>[-7,-16,14,16],draw:p=>R(-3,-2,6,2,'#a16207')+C(0,-9,6.5,'#f1f5f9')+C(0,-9,6.5,'none',`stroke="${p.rim}" stroke-width="0.9"`)+L(0,-9,0,-13,'#111',0.8)+L(0,-9,p.h?-3.5:3.5,-7.5,'#111',0.6),
  muts:p=>[{t:'move',p2:{...p,h:!p.h},b:[-5,-11,10,5]},{t:'color',p2:{...p,rim:p.rim==='#a16207'?'#2563eb':'#a16207'},b:[-7,-16,14,14]}]},
 plant:{box:()=>[-6,-20,12,20],draw:p=>G('scale(1.5)',potPlant(0,-5,6,5,p.pot,p.pt,p.n)),muts:(p,r)=>plantMuts(p,r,0,-5,6,5,'pot').map(m=>({...m,b:sc15(m.b)}))},
 photo:{box:()=>[-7.5,-17.5,15,17.5],draw:p=>R(-7,-17,14,17,p.fr)+R(-5,-15,10,13,'#93c5fd')+Pa('M-5 -2 l4 -5 l3 3 l3 -2 v4 Z','#15803d')+C(p.h?2.5:-2.5,-11,1.5,'#fbbf24'),
  muts:p=>[{t:'move',p2:{...p,h:!p.h},b:[-5,-13.5,10,5]},{t:'color',p2:{...p,fr:p.fr==='#d4a65a'?'#94a3b8':'#d4a65a'},b:[-7.5,-17.5,15,17.5]}]},
 candles:{box:()=>[-5,-14,10,14],draw:p=>R(-4.5,-10,3,10,p.c)+R(1.5,-7,3,7,p.c)+L(-3,-10,-3,-10.8,'#111',0.3)+L(3,-7,3,-7.8,'#111',0.3)+(p.fl?E(-3,-11.8,1,1.8,'#fbbf24'):'')+(p.fr?E(3,-8.8,1,1.8,'#fbbf24'):''),
  muts:p=>[tog(p,'fl',[-4.5,-14,3,4.2]),tog(p,'fr',[1.5,-11,3,4.2]),{t:'color',p2:{...p,c:near(p.c)},b:[-5,-10.5,10,10.5],easy:false}]},
 jars:{box:()=>[-10,-14,20,14],draw:p=>[-9.5,1.5].map((x,i)=>R(x,-11,8,11,'#93c5fd','rx="1.5" opacity=".7"')+R(x+0.8,-5.5,6.4,5,p.cc[i],'rx="0.8"')+R(x+0.5,-13.2,7,2.4,p.lid[i],'rx="0.6"')+(p.lb[i]?R(x+1.5,-9.6,5,3,'#f1f5f9'):'')).join(''),
  muts:(p,r)=>{const i=ri(r,0,1),x=[-9.5,1.5][i],a=(k,v)=>{const q=p[k].slice();q[i]=v;return{...p,[k]:q};};
   const m=[{t:'color',p2:a('lid',other(r,p.lid[i],JARC)),b:[x,-13.6,8,3.2]},{t:p.lb[i]?'remove':'add',p2:a('lb',!p.lb[i]),b:[x+1,-10,6,4]},{t:'color',p2:a('cc',other(r,p.cc[i],['#a16207','#dc2626','#facc15','#16a34a','#f1f5f9'])),b:[x+0.5,-6,7.2,6]}];
   if(cvdDist(p.lid[0],p.lid[1])>=CVD_MIN)m.push({t:'move',p2:{...p,lid:[p.lid[1],p.lid[0]]},b:[-10,-13.6,20,3.2]});return m;}},
 stack:{box:()=>[-9.5,-17,19,17],draw:p=>STK.slice(0,p.n).map((b,i)=>R(...b,p.c[i])+R(b[0]+1,b[1]+b[3]/2-0.3,b[2]-2,0.6,'#00000040')).join(''),
  muts:(p,r)=>{const m=[p.n===4?{t:'remove',p2:{...p,n:3},b:STK[3]}:{t:'add',p2:{...p,n:4},b:STK[3]}];const i=ri(r,0,2),c=p.c.slice();c[i]=other(r,c[i],BOOKC);m.push({t:'color',p2:{...p,c},b:STK[i]});return m;}},
 teapot:{box:()=>[-10.5,-15.5,21,15.5],draw:p=>E(0,-5.5,7,5.5,p.c)+R(-2.5,-12.2,5,1.6,p.c)+(p.k?R(-3.2,-13,6.4,0.8,p.c,'rx="0.3"')+C(0,-14,0.95,p.c)+R(-3.2,-13,6.4,0.8,'#00000033','rx="0.3"')+C(0,-14,0.95,'#00000033'):'')+Pg('6.5,-7 10,-11.5 8,-5.5',p.c)+`<path d="M-6.7 -8.5 q-3.2 3 0 6" stroke="${p.c}" stroke-width="1.2" fill="none"/>`,
  muts:(p,r)=>[{t:'flip',p2:{...p,m:-(p.m||1)},b:[-10.5,-14,21,14]},{t:'color',p2:{...p,c:other(r,p.c,['#14b8a6','#dc2626','#2563eb','#facc15','#f1f5f9'])},b:[-10.5,-14,21,14]},tog(p,'k',[-3.6,-15.3,7.2,3])]},
 globe:{box:()=>[-5.5,-15.5,11,15.5],draw:p=>C(0,-10,5,'#3b82f6')+E(-1.5,-11,2.4,1.6,'#22c55e')+(p.c2?E(2,-8,1.4,1,'#22c55e'):'')+R(-0.7,-5,1.4,3,p.st)+R(-3.5,-2,7,2,p.st),
  muts:p=>[tog(p,'c2',[0.2,-9.4,3.6,2.8]),{t:'color',p2:{...p,st:p.st==='#a16207'?'#94a3b8':'#a16207'},b:[-4,-5.4,8,5.4]},{t:'flip',p2:{...p,m:-(p.m||1)},b:[-5.5,-15.5,11,11]}]},
 cups:{box:()=>[-10.8,-8,21.6,8],draw:p=>[-8.5,2.5].map((x,i)=>flip(x+3,R(x,-7,6,7,p.c[i],'rx="1"')+`<path d="M${x+6} -5.6 a2 2 0 0 1 0 4" stroke="${p.c[i]}" stroke-width="1.1" fill="none"/>`+(p.d[i]?C(x+1.7,-4.5,0.6,'#1f2937')+C(x+4.3,-4.5,0.6,'#1f2937')+C(x+3,-2.2,0.6,'#1f2937'):''),p.f[i])).join(''),
  muts:(p,r)=>{const i=ri(r,0,1),x=[-8.5,2.5][i],b=[x-2.4,-7.5,10.8,7.5],a=(k,v)=>{const q=p[k].slice();q[i]=v;return{...p,[k]:q};};
   return[{t:p.d[i]?'remove':'add',p2:a('d',!p.d[i]),b:[x,-7,6,7]},{t:'color',p2:a('c',other(r,p.c[i],['#f472b6','#38bdf8','#facc15','#16a34a','#f1f5f9'])),b},{t:'flip',p2:a('f',!p.f[i]),b}];}},
 vase:{box:()=>[-6,-21,12,21],draw:p=>VF.map(([x,y],i)=>i===2&&p.n<3?'':L(0,-9,x,y,'#16a34a',0.5)+C(x,y,1.6,p.fc[i])).join('')+R(-3,-9,6,9,p.vc,'rx="1.5"'),
  muts:(p,r)=>{const i=ri(r,0,p.n-1),fc=p.fc.slice();fc[i]=other(r,fc[i],['#f87171','#fbbf24','#f472b6','#a78bfa','#f1f5f9']);
   return[{t:'color',p2:{...p,fc},b:[VF[i][0]-2,VF[i][1]-2,4,4]},{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[1.8,-18,4.6,9]},{t:'color',p2:{...p,vc:other(r,p.vc,['#7c3aed','#0ea5e9','#dc2626','#f1f5f9','#16a34a'])},b:[-3.5,-9.5,7,9.5]}];}},
 gift:{box:()=>[-7.5,-14.5,15,14.5],draw:p=>R(-7,-11,14,11,p.c)+R(-1,-11,2,11,p.rb)+(p.band?R(-7,-6.5,14,2,p.rb):'')+Pa('M0 -11 q-3 -3 -4 0 Z M0 -11 q3 -3 4 0 Z',p.rb),
  muts:(p,r)=>[{...tog(p,'band',[-7.5,-7,15,3]),easy:false},{t:'color',p2:{...p,c:other(r,p.c,['#dc2626','#2563eb','#16a34a','#7c3aed'])},b:[-7.5,-11.5,15,11.5]},{t:'color',p2:{...p,rb:near(p.rb)},b:[-4.5,-14.5,9,14.5],easy:false}]},
 duck:{box:()=>[-8.5,-13.5,17,13.5],draw:p=>E(0,-3.5,5,3.5,p.c)+C(3,-9,2.8,p.c)+Pg('5.4,-9 8,-8.2 5.4,-7.4','#f97316')+C(3.8,-9.7,0.5,'#111')+(p.hat?Pa('M0.6 -11.2 a2.4 2 0 0 1 4.8 0 Z','#2563eb'):''),
  muts:p=>[{t:'flip',p2:{...p,m:-(p.m||1)},b:[-8.5,-12.5,17,12.5]},{t:'color',p2:{...p,c:near(p.c)},b:[-5.5,-12,13,12]},tog(p,'hat',[0.2,-13.5,5.6,3])]},
 ball:{box:()=>[-5,-9.5,10,9.5],draw:p=>C(0,-4.5,4.5,p.c)+(p.st?`<path d="M-4.4 -5.3 Q0 -2 4.4 -5.3" stroke="#f1f5f9" stroke-width="1.4" fill="none"/>`:''),
  muts:(p,r)=>[{...tog(p,'st',[-5,-7,10,4]),easy:false},{t:'color',p2:{...p,c:other(r,p.c,['#ef4444','#2563eb','#16a34a','#facc15'])},b:[-5,-9.5,10,9.5]}]}};
const STK=[[-9,-4.5,18,4.5],[-8,-9,16,4.5],[-8.5,-13,17,4],[-7,-16.5,14,3.5]],VF=[[-4,-16],[0,-18.5],[4,-16]];
const SHGRP={clock:'decor',photo:'decor',candles:'decor',globe:'decor',jars:'kitchenware',teapot:'kitchenware',cups:'kitchenware',plant:'plants',vase:'plants',gift:'toys',duck:'toys',ball:'toys',stack:'books'};
const shParams=(t,r)=>({clock:{h:r()<0.5,rim:'#a16207'},plant:{pot:pk(r,['#b45309','#2563eb']),pt:pk(r,['leafy','leafy','cactus']),n:r()<0.75?3:2},photo:{h:r()<0.5,fr:'#d4a65a'},
 candles:{c:pk(r,['#f1f5f9','#fca5a5','#93c5fd']),fl:r()<0.8,fr:r()<0.8},jars:{lid:[pk(r,JARC),pk(r,JARC)],cc:[pk(r,['#a16207','#dc2626','#facc15']),pk(r,['#16a34a','#f1f5f9','#a16207'])],lb:[r()<0.6,r()<0.6]},
 stack:{n:r()<0.5?4:3,c:mixC(r,[0,1,2,3],BOOKC)},teapot:{c:pk(r,['#14b8a6','#dc2626','#2563eb']),k:r()<0.8,m:r()<0.5?1:-1},globe:{c2:r()<0.7,st:'#a16207',m:1},
 cups:{c:[pk(r,['#f472b6','#38bdf8']),pk(r,['#facc15','#16a34a'])],d:[r()<0.5,r()<0.5],f:[false,r()<0.3]},vase:{n:r()<0.75?3:2,fc:mixC(r,[0,1,2],['#f87171','#fbbf24','#f472b6','#a78bfa']),vc:pk(r,['#7c3aed','#0ea5e9'])},
 gift:{c:pk(r,['#dc2626','#2563eb','#16a34a']),rb:pk(r,['#fbbf24','#f1f5f9']),band:r()<0.7},duck:{c:'#facc15',m:r()<0.5?1:-1,hat:r()<0.4},ball:{c:pk(r,['#ef4444','#2563eb']),st:r()<0.7}})[t];
const multi=defs=>placed({box:p=>defs[p.o].box(p),draw:p=>defs[p.o].draw(p),muts:(p,r)=>defs[p.o].muts(p,r)});
K.sh=multi(SHO);
/* a row of books standing on a shelf; only the end one comes and goes */
const bookX=p=>{let x=0;return p.bk.map(b=>{const o=x;x+=b.w+0.3;return o;});};
K.books=placed({box:()=>[0,-22,42,22],
 draw:p=>{const xs=bookX(p);let s='';p.bk.slice(0,p.n).forEach((b,i)=>{if(i===p.gap)return;const x=xs[i];s+=R(x,-b.h,b.w,b.h,b.c)+R(x,-b.h+3,b.w,0.9,'#00000055')+(b.band?R(x,-b.h/2,b.w,1.6,b.c==='#eab308'||b.c==='#f97316'?'#f8fafc':'#fbbf24'):'');});
   if(p.be)s+=R(p.bx,-15,1.5,15,'#64748b')+R(p.bx,-1.5,5,1.5,'#64748b');return s;},
 muts:(p,r)=>{const xs=bookX(p),bb=i=>[xs[i]-0.3,-p.bk[i].h-0.4,p.bk[i].w+0.6,p.bk[i].h+0.4],m=[],ok=[...Array(p.n).keys()].filter(i=>i!==p.gap),i=pk(r,ok),set=(k,v)=>{const bk=p.bk.slice();bk[i]={...bk[i],[k]:v};return{...p,bk};};
  m.push({t:'color',p2:set('c',apart(r,BOOKC,[p.bk[i].c],p.bk[i].c)),b:bb(i)},{t:p.bk[i].band?'remove':'add',p2:set('band',!p.bk[i].band),b:bb(i),easy:false});
  if(p.n<p.bk.length)m.push({t:'add',p2:{...p,n:p.n+1},b:bb(p.n)});else m.push({t:'remove',p2:{...p,n:p.n-1},b:bb(p.n-1)});
  if(p.gap<0){const g=ri(r,1,p.n-3);m.push({t:'remove',p2:{...p,gap:g},b:bb(g)});}else m.push({t:'add',p2:{...p,gap:-1},b:bb(p.gap)});
  const js=ok.filter(j=>j+1<p.n&&j+1!==p.gap);if(js.length){const j=pk(r,js),bk=p.bk.slice();[bk[j],bk[j+1]]=[bk[j+1],bk[j]];if(cvdDist(p.bk[j].c,p.bk[j+1].c)>=CVD_MIN)m.push({t:'move',p2:{...p,bk},b:U(bb(j),bb(j+1))});}
  return m;}});
function bookRow(r,maxW,be){const all=[];let w=0;for(;;){const b={w:+(3.5+r()*1.5).toFixed(1),h:ri(r,14,20),c:pk(r,BOOKC),band:r()<0.25};if(w+b.w>maxW)break;all.push(b);w+=b.w+0.3;}
  const k=Math.max(ri(r,5,all.length),ri(r,5,all.length)),bk=all.slice(0,k),bw=bk.reduce((a,b)=>a+b.w+0.3,0),n=k-(r()<0.35?1:0);
  return{bk,n,gap:r()<0.3?ri(r,1,n-3):-1,be,bx:+(bw+0.2).toFixed(1)};}
gadd('Bookshelf','3 shelves: one row of books each, 3 objects from 13 (no repeats)',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  let bg=R(0,0,120,90,'#2a1f17')+R(0,0,3,90,'#5b3a1e')+R(117,0,3,90,'#5b3a1e');for(const y of[28,58,88])bg+=R(3,y,114,2.5,'#7a5233');add('raw',{s:bg},-10);
  const types=shuf(r,Object.keys(SHO));let ti=0;
  [28,58,88].forEach(fy=>{const bpos=ri(r,0,3);for(let k=0;k<5;k++){const cx=5+k*22;
    if(k===bpos){const be=r()<0.5;add('books',{x:cx+1,y:fy,cat:'books',...bookRow(r,be?36:41,be)},1);k++;continue;}
    const o=types[ti++];add('sh',{o,x:cx+11,y:fy,cat:SHGRP[o],...shParams(o,r)},1);}});
  return items;});

/* ================= LIVING ROOM (generated) ================= */
const LSTAR=[[87,29],[71,31],[87.5,14]];
K.lwin={draw:p=>R(66,10,26,28,'#d6c9b1')+R(68,12,22,24,'#1e3a5f')+(p.moon?C(p.ml?73.5:84,18,2.6,'#f1f5f9'):'')+LSTAR.map(([x,y],i)=>p.st[i]?sparkle(x,y,1.1,'#e2e8f0'):'').join('')+L(79,12,79,36,'#d6c9b1',1)+L(68,24,90,24,'#d6c9b1',1)
  +R(61,7,36,1.5,p.rod)+Pg('62,8 68,8 68,40 64,40',p.lc)+Pg('90,8 96,8 94,40 90,40',p.lc),
 muts:(p,r)=>{const i=ri(r,0,2),st=p.st.slice();st[i]=!st[i];return[{t:'move',p2:{...p,ml:!p.ml},b:[70.5,15,17,6]},{t:p.st[i]?'remove':'add',p2:{...p,st},b:[LSTAR[i][0]-1.8,LSTAR[i][1]-1.8,3.6,3.6]},
  {t:'color',p2:{...p,rod:p.rod==='#a16207'?'#94a3b8':'#a16207'},b:[60.5,6.5,37,2.5],easy:false}];}};
const CURT=['#be185d','#2563eb','#16a34a','#f59e0b','#7c3aed'];
K.frame={draw:p=>{const{x,y,w,h}=p,ix=x+1.2,iy=y+1.2,iw=w-2.4,ih=h-2.4;let s=R(x,y,w,h,p.fc)+R(ix,iy,iw,ih,p.t==='land'?'#93c5fd':p.bg);
  if(p.t==='land')s+=Pa(`M${ix} ${iy+ih} l${iw*0.3} ${-ih*0.45} l${iw*0.2} ${ih*0.2} l${iw*0.25} ${-ih*0.3} l${iw*0.25} ${ih*0.55} Z`,'#15803d')+C(p.sr?ix+iw*0.78:ix+iw*0.22,iy+ih*0.25,1.3,'#fbbf24');
  if(p.t==='portrait')s+=C(ix+iw/2,iy+ih*0.45,iw*0.22,'#f1c27d')+Pa(`M${ix+iw*0.15} ${iy+ih} a${iw*0.35} ${ih*0.3} 0 0 1 ${iw*0.7} 0 Z`,p.sc)+(p.hat?R(ix+iw*0.28,iy+ih*0.12,iw*0.44,ih*0.12,'#1f2937'):'');
  if(p.t==='abstract')s+=C(ix+iw*0.3,iy+ih*0.32,Math.min(iw,ih)*0.2,p.a1)+(p.tri?Pg(`${ix+iw*0.52},${iy+ih*0.88} ${ix+iw*0.92},${iy+ih*0.88} ${ix+iw*0.72},${iy+ih*0.45}`,p.a2):'')+R(ix+iw*0.1,iy+ih*0.66,iw*0.32,ih*0.22,'#f1f5f9');
  return s;},
 muts:(p,r)=>{const{x,y,w,h}=p,ix=x+1.2,iy=y+1.2,iw=w-2.4,ih=h-2.4,all=[x-0.5,y-0.5,w+1,h+1],m=[{t:'color',p2:{...p,fc:p.fc==='#d4a65a'?'#94a3b8':'#d4a65a'},b:all}];
  if(p.t==='land')m.push({t:'move',p2:{...p,sr:!p.sr},b:[ix,iy,iw,ih*0.5]});
  if(p.t==='portrait')m.push({t:'color',p2:{...p,sc:other(r,p.sc,['#2563eb','#dc2626','#16a34a','#facc15'])},b:[ix,iy+ih*0.68,iw,ih*0.32]},tog(p,'hat',[ix+iw*0.2,iy,iw*0.6,ih*0.32]));
  if(p.t==='abstract')m.push({t:'color',p2:{...p,a1:other(r,p.a1,['#ef4444','#2563eb','#facc15','#16a34a'])},b:[ix,iy,iw*0.55,ih*0.6]},tog(p,'tri',[ix+iw*0.5,iy+ih*0.42,iw*0.45,ih*0.5]));
  return m;}};
K.lclock={draw:p=>C(49,16,5,'#f1f5f9')+C(49,16,5,'none',`stroke="${p.rim}" stroke-width="0.8"`)+L(49,16,49,12.5,'#111',0.8)+L(49,16,p.h?45.5:52.5,16.8,'#111',0.6),
 muts:p=>[{t:'move',p2:{...p,h:!p.h},b:[44.5,14,9,4.5]},{t:'color',p2:{...p,rim:p.rim==='#a16207'?'#2563eb':'#a16207'},b:[43.5,10.5,11,11]}]};
/* top right: hanging plant (0-2 vines), pendant lamp or candle chandelier */
const HV=[[`<path d="M104.3 11 q-1.2 4 0 8" stroke="#22c55e" stroke-width="0.6" fill="none"/>`+E(103.6,13.6,1,0.6,'#22c55e')+E(104.6,16.4,1,0.6,'#22c55e')+E(103.9,19,1,0.6,'#22c55e'),[102.6,10.5,3.4,9.4]],
  [`<path d="M107.8 11 q1.2 4 0 8" stroke="#16a34a" stroke-width="0.6" fill="none"/>`+E(108.5,13.6,1,0.6,'#16a34a')+E(107.5,16.4,1,0.6,'#16a34a')+E(108.2,19,1,0.6,'#16a34a'),[106.2,10.5,3.6,9.4]]];
const CHX=[100,106,112];
const HGB={plant:[102.4,0,7.2,11.8],lamp:[100.5,0,11,14.8],chand:[99.4,0,13.2,13.8]};
const hangPlain=p=>(p.v==='lamp'&&!p.on)||(p.v==='plant'&&p.n===0)||p.v==='chand';
const hangSwap=(p,r)=>{if(!hangPlain(p))return[];const v=pk(r,['plant','lamp','chand'].filter(x=>x!==p.v));return[{t:'replace',p2:{...p,v,on:false,n:0,fl:[true,true,true]},b:U(HGB[p.v],HGB[v])}];};
K.hang={draw:p=>{if(p.v==='plant')return L(106,0,103.4,8,'#a16207',0.35)+L(106,0,108.6,8,'#a16207',0.35)+E(104.3,7.6,1.6,0.9,'#22c55e')+E(107.6,7.4,1.6,0.9,'#16a34a')+E(106,6.9,1.3,1,'#4ade80')+Pa('M103 8 h6 l-1 3.5 h-4 Z',p.pot)+HV.slice(0,p.n).map(v=>v[0]).join('');
  if(p.v==='lamp')return L(106,0,106,9,'#94a3b8',0.4)+(p.on?Pg('101.6,13 110.4,13 114,25 98,25','#fde68a','opacity=".14"'):'')+Pa('M101 13 q5 -7 10 0 Z',p.c)+C(106,13.4,1.2,p.on?'#fde68a':'#475569');
  return L(106,0,106,7,p.mc,0.5)+`<path d="M100 9.5 Q106 13 112 9.5" stroke="${p.mc}" stroke-width="0.6" fill="none"/>`+C(106,8.6,1,p.mc)+CHX.map((x,i)=>R(x-0.6,7.2,1.2,2.4,'#f8fafc')+(p.fl[i]?E(x,6.2,0.6,1,'#fbbf24'):'')).join('');},
 muts:(p,r)=>{if(p.v==='plant'){const m=[{t:'color',p2:{...p,pot:other(r,p.pot,['#f1f5f9','#b45309','#2563eb','#dc2626'])},b:[102.5,7.5,7,4.5]}];
    if(p.n>0)m.push({t:'remove',p2:{...p,n:p.n-1},b:HV[p.n-1][1]});if(p.n<2)m.push({t:'add',p2:{...p,n:p.n+1},b:HV[p.n][1]});return[...m,...hangSwap(p,r)];}
  if(p.v==='lamp')return[{t:'light',p2:{...p,on:!p.on},b:[97.5,9,17,16.5]},{t:'color',p2:{...p,c:near(p.c)},b:[100.5,8.5,11,5]},...hangSwap(p,r)];
  const i=r()<0.5?0:2,fl=p.fl.slice();fl[i]=!fl[i];
  return[{t:'light',p2:{...p,fl},b:[CHX[i]-1.6,4.4,3.2,3.4]},{t:'color',p2:{...p,mc:p.mc==='#ca8a04'?'#94a3b8':'#ca8a04'},b:[99.5,5.5,13,8.5],easy:false},...hangSwap(p,r)];}};
K.cush={draw:p=>R(8,48,8,8,p.c[0],'rx="1.5"')+(p.d?C(10.2,50.5,0.6,'#1f2937')+C(13.8,50.5,0.6,'#1f2937')+C(12,53,0.6,'#1f2937'):'')+R(29,48,8,8,p.c[1],'rx="1.5"'),
 muts:(p,r)=>{const i=ri(r,0,1),c=p.c.slice();c[i]=other(r,c[i],['#fbbf24','#ef4444','#f1f5f9','#16a34a','#f472b6']);return[{t:'color',p2:{...p,c},b:[[7.5,47.5,9,9],[28.5,47.5,9,9]][i]},{t:p.d?'remove':'add',p2:{...p,d:!p.d},b:[7.5,47.5,9,9],easy:false}];}};
K.scat={draw:p=>p.on?flip(22,E(22,55.2,4,1.8,p.c)+C(25.5,54.2,1.6,p.c)+Pg('24.6,53 25,51.8 25.6,52.8',p.c)+Pg('25.8,52.8 26.4,51.8 26.8,53.2',p.c),p.f):'',
 muts:(p,r)=>p.on?[{t:'remove',p2:{...p,on:false},b:[17.5,51.3,9.5,6]},{t:'color',p2:{...p,c:other(r,p.c,['#f97316','#f1f5f9','#94a3b8','#111'])},b:[17.5,51.3,9.5,6]},{t:'flip',p2:{...p,f:!p.f},b:[16.8,51.3,10.4,6]}]:[{t:'add',p2:{...p,on:true},b:[17.5,51.3,9.5,6]}]};
K.blank={draw:p=>p.on?Pg('39,52 46,52 46,62 42,64 39,60',p.c)+(p.st?R(39,55,7,1.2,'#f1f5f9'):''):'',
 muts:(p,r)=>p.on?[{t:'color',p2:{...p,c:other(r,p.c,['#7c3aed','#a3e635','#f97316','#0ea5e9'])},b:[38.5,51.5,8,13]},{t:'remove',p2:{...p,on:false},b:[38.5,51.5,8,13]},{...tog(p,'st',[38.5,54.5,8,2.2])}]:[]};
K.flamp={draw:p=>L(48,70,48,40,'#d6c9b1',0.8)+R(44.5,69,7,1.6,'#d6c9b1')+(p.on?Pg('44,40 52,40 54,46 42,46','#fde68a','opacity=".35"')+E(48,40.4,2,0.9,'#fef9c3'):'')+Pg('43,40 53,40 51,33 45,33',p.c),
 muts:(p,r)=>[{t:'color',p2:{...p,c:other(r,p.c,['#fde68a','#22d3ee','#f472b6','#f97316'])},b:[42.5,32.5,11,8]},{t:'light',p2:{...p,on:!p.on},b:[41.5,39.5,13,7]}]};
K.gslot={draw:p=>p.v==='guitar'?R(57.9,43,1.2,13,'#78350f')+R(57.5,41,2,2.5,'#451a03')+E(58.5,64,3.5,4,p.c)+E(58.5,58.5,2.6,3,p.c)+C(58.5,61,1,'#1f2937')
  :p.v==='plant'?R(56,63,6,7,p.c)+E(57,58,1.4,4.5,'#16a34a')+E(61,58,1.4,4.5,'#22c55e')+(p.n>2?E(59,56,1.4,5.5,'#4ade80'):''):'',
 muts:(p,r)=>p.v==='guitar'?[{t:'remove',p2:{...p,v:'none'},b:[54.6,40.6,7.8,28]},{t:'color',p2:{...p,c:p.c==='#b45309'?'#dc2626':'#b45309'},b:[54.6,55,7.8,13.5]}]
  :p.v==='plant'?[{t:p.n>2?'remove':'add',p2:{...p,n:p.n>2?2:3},b:[57.3,50,3.4,8]},{t:'color',p2:{...p,c:other(r,p.c,['#b45309','#2563eb','#f1f5f9'])},b:[55.5,62.5,7,8]}]:[]};
K.chair={draw:p=>{let s=R(65,44,20,20,p.cc,'rx="2"')+R(65,58,20,7,p.cc,'rx="1.5"')+R(65,58,20,7,'#ffffff','opacity=".12" rx="1.5"')+R(64,67,1.6,3,'#1f2937')+R(84.4,67,1.6,3,'#1f2937');
  if(p.who){s+=R(70.5,46,8,12,p.sh,'rx="1.5"')+(p.ns===1?R(70.5,51.2,8,1.1,'#f1f5f9'):p.ns===2?R(70.5,49.6,8,1.1,'#f1f5f9')+R(70.5,52.8,8,1.1,'#f1f5f9'):'')+C(74.5,42.5,3.2,'#c68642')+Pa('M71.1 42.4 a3.4 3.4 0 0 1 6.8 0 Z','#111');
    if(p.gl)s+=C(73.3,42.7,1,'none','stroke="#111" stroke-width="0.4"')+C(75.7,42.7,1,'none','stroke="#111" stroke-width="0.4"');
    s+=R(70.5,57,11,3.8,'#1e3a8a','rx="1"')+R(79,57.5,3.4,9.5,'#1e3a8a')+R(78.5,66.5,5.5,1.6,p.shoe,'rx="0.6"')+R(75.5,50,6,4.5,p.bk,'rx="0.4"')+L(78.5,50,78.5,54.5,'#f1f5f9',0.3)+C(75.5,53,1,'#c68642')+C(81.5,53,1,'#c68642');}
  else s+=R(70,48,10,8,p.pc,'rx="1.5"');
  return s+R(62,54,5,13,p.cc,'rx="1.5"')+R(83,54,5,13,p.cc,'rx="1.5"')+R(62,54,5,13,'#00000030','rx="1.5"')+R(83,54,5,13,'#00000030','rx="1.5"');},
 muts:(p,r)=>p.who?[tog(p,'gl',[71.5,40.8,6,3.8]),(()=>{const n2=p.ns===2?1:p.ns===0?1:(r()<0.5?2:0);return{t:n2<p.ns?'remove':'add',p2:{...p,ns:n2},b:[70,49.1,9,5.3],easy:false};})(),{t:'color',p2:{...p,bk:other(r,p.bk,['#dc2626','#2563eb','#facc15','#16a34a'])},b:[75,49.5,7,5.5]},{t:'color',p2:{...p,shoe:other(r,p.shoe,['#f472b6','#f1f5f9','#facc15','#2563eb'])},b:[78,66,6.5,2.6]}]
  :[{t:'color',p2:{...p,pc:other(r,p.pc,['#fbbf24','#ef4444','#f1f5f9','#2563eb'])},b:[69.5,47.5,11,9]}]};
const TVS={hills:p=>R(96.5,45.5,13,9,'#0ea5e9')+Pg('96.5,54.5 100.5,48.5 103.5,51.5 106,47.5 109.5,54.5','#166534')+C(p.h?99:107,47.8,1.2,'#fde68a'),
  boat:p=>R(96.5,45.5,13,9,'#0ea5e9')+R(96.5,51,13,3.5,'#1d4ed8')+Pg('100,51 106,51 105,52.6 101,52.6','#f1f5f9')+L(103,51,103,46.8,'#f1f5f9',0.4)+Pg('103.3,47 103.3,50.5 106,50.5',p.sail)+C(p.h?99:107,47.8,1.2,'#fde68a'),
  fish:p=>R(96.5,45.5,13,9,'#0369a1')+G('translate(103,50) scale(0.5)',fish(0,0,p.sail,1,'stripes'))+C(99,47.5,0.5,'none','stroke="#bae6fd" stroke-width="0.3"')+C(100,46.6,0.4,'none','stroke="#bae6fd" stroke-width="0.3"')};
K.tv={draw:p=>R(95,44,16,12,'#111827','rx="1"')+TVS[p.v](p),
 muts:(p,r)=>{const sb=[96.3,45.3,13.4,9.4],m=[{t:'replace',p2:{...p,v:pk(r,Object.keys(TVS).filter(v=>v!==p.v))},b:sb}];
  if(p.v!=='fish')m.push({t:'move',p2:{...p,h:!p.h},b:[97,45.8,12,4]});if(p.v!=='hills')m.push({t:'color',p2:{...p,sail:other(r,p.sail,['#ef4444','#facc15','#f97316','#a78bfa'])},b:p.v==='boat'?[103,46.6,3.4,4.2]:[97.5,47.5,9,5]});return m;}};
K.tvp={draw:p=>R(113,53,4,5,p.pot)+E(114,50,1,3,'#22c55e')+(p.n>1?E(116,50,1,3,'#16a34a'):''),muts:(p,r)=>[{t:'color',p2:{...p,pot:other(r,p.pot,['#c2410c','#f1f5f9','#2563eb'])},b:[112.5,52.5,5,6]},{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[114.8,46.8,2.4,6.4]}]};
K.dog={draw:p=>E(101,83,7,2.6,p.bc)+E(101,82.4,5.5,1.8,'#ffffff','opacity=".25"')+(p.on?`<path d="M96.8 81.6 q-1.8 -0.6 -1.2 -2.4" stroke="${p.c}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`
  +E(100.4,80.9,4.4,1.9,p.c)+E(102.6,82.3,1.6,0.6,p.c)+E(104.4,81.1,2,1.5,p.c)+E(103.7,80.3,0.9,1.5,'#00000040','transform="rotate(30 103.7 80.3)"')+L(104.6,80.7,105.6,80.9,'#1f2937',0.3)+C(106.3,81.3,0.4,'#1f2937'):''),
 muts:(p,r)=>[{t:p.on?'remove':'add',p2:{...p,on:!p.on},b:[94.8,78,12.5,5]},{t:'color',p2:{...p,bc:other(r,p.bc,['#7c3aed','#dc2626','#2563eb','#16a34a'])},b:[93.5,80,15,5.8]}]};
const TITEM={mug:(x,p)=>R(x-1.5,71,3,3,p.c)+`<path d="M${x+1.5} 71.6 a1 1 0 0 1 0 1.8" stroke="${p.c}" stroke-width="0.5" fill="none"/>`,books:(x,p)=>R(x-4,72.6,8,1.4,p.c)+(p.n>1?R(x-3.5,71.2,7,1.4,p.c2):''),
  remote:(x,p)=>R(x-2.5,72.8,5,1.2,'#111')+C(x+(p.f?-1.6:1.6),73.4,0.35,'#ef4444'),bowl:(x,p)=>C(x-1.5,72,1.3,p.c)+C(x+1.3,72.2,1.2,'#facc15')+Pa(`M${x-3.5} 72.8 h7 q-0.6 1.2 -3.5 1.2 q-2.9 0 -3.5 -1.2 Z`,'#f1f5f9')};
K.titem={draw:p=>TITEM[p.v](p.x,p),muts:(p,r)=>{const x=p.x,b=[x-4.5,69.5,9,5];
  if(p.v==='mug')return[{t:'color',p2:{...p,c:other(r,p.c,['#f1f5f9','#ef4444','#2563eb','#facc15'])},b},{t:'remove',p2:{...p,v:'none'},b}];
  if(p.v==='books')return[p.n>1?{t:'color',p2:{...p,c2:apart(r,BOOKC,[p.c2],p.c2)},b:[x-4,70.8,8,2.2]}:{t:'color',p2:{...p,c:apart(r,BOOKC,[p.c],p.c)},b:[x-4.5,72,9,2.4]},{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[x-4,70.8,8,2.2]}];
  if(p.v==='remote')return[{t:'remove',p2:{...p,v:'none'},b},{t:'flip',p2:{...p,f:!p.f},b}];
  if(p.v==='bowl')return[{t:'color',p2:{...p,c:p.c==='#ef4444'?'#84cc16':'#ef4444'},b:[x-3.2,70.4,3.4,3.4]}];return[];}};
TITEM.none=()=>'';
K.rug={draw:p=>E(30,84,24,4,'#a16207')+E(30,84,17,2.6,p.c)+(p.bd?E(30,84,20.5,3.3,'none','stroke="#f1f5f9" stroke-width="0.4" stroke-dasharray="1.2 1"'):''),
 muts:(p,r)=>[{t:'color',p2:{...p,c:other(r,p.c,['#ca8a04','#f1f5f9','#dc2626','#2563eb'])},b:[13,81.4,34,5.2]},{...tog(p,'bd',[9.5,80.5,41,7]),easy:false}]};
const slipper=(x,y,c)=>R(x-3.3,y-0.7,6.8,1,'#e2e8f0','rx="0.5"')+Pa(`M${x-0.6} ${y-0.6} q0.1 -2.3 2.3 -2.3 q1.9 0 1.9 2.3 Z`,c)+Pa(`M${x-3.3} ${y-0.6} v-1.1 q0.9 -0.4 1.5 0 v1.1 Z`,c);
/* slippers: a pair or none; the change takes away one, never both */
K.slip={draw:p=>p.on?(p.gone!=='l'?slipper(67.6,81.4,p.c):'')+(p.gone!=='r'?slipper(74.2,80.6,p.c):''):'',muts:(p,r)=>{if(!p.on)return[];const s=r()<0.5?'l':'r';
  return[{t:'remove',p2:{...p,gone:s},b:s==='l'?[63.8,78.2,7.8,3.6]:[70.4,77.4,7.8,3.6],easy:false},{t:'color',p2:{...p,c:near(p.c)},b:[63.8,77.4,14.2,4.4]}];}};
/* TV cabinet knobs */
K.tvb={draw:p=>[104,108].map((x,i)=>p.k[i]?C(x,64,0.75,'#fbbf24'):'').join(''),muts:p=>{const i=p.k[0]&&p.k[1]?(p.s?0:1):p.k.indexOf(false),k=p.k.slice();k[i]=!k[i];return[{t:p.k[i]?'remove':'add',p2:{...p,k},b:[[104,108][i]-1.6,62.4,3.2,3.2]}];}};
Object.assign(CAT,{books:'books',lwin:'window',frame:'wall',lclock:'wall',hang:'wall',cush:'sofa',scat:'sofa',blank:'sofa',flamp:'lamp',gslot:'corner',chair:'armchair',tv:'tv',tvp:'tv',dog:'floor',titem:'table',rug:'floor',slip:'floor',tvb:'tv'});
gadd('Living room','reader in the armchair (sometimes empty), shelf, frames, TV, table',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  const sofa=pk(r,['#2563eb','#0f766e','#7c3aed']);
  let bg=R(0,0,120,70,pk(r,['#3b3552','#33404f','#3f3a33']))+R(0,70,120,20,'#5b4636');for(const y of[75,80,85])bg+=L(0,y,120,y,'#4a3a2c',0.4);
  bg+=R(6,44,36,14,sofa,'rx="2"')+R(6,56,36,8,sofa,'rx="1.5"')+R(6,56,36,8,'#ffffff','opacity=".12" rx="1.5"')+R(2,52,7,14,sofa,'rx="2"')+R(39,52,7,14,sofa,'rx="2"')+R(2,52,7,14,'#00000030','rx="2"')+R(39,52,7,14,'#00000030','rx="2"')+R(5,66,2,4,'#1f2937')+R(41,66,2,4,'#1f2937');
  bg+=R(94,58,24,12,'#78350f')+L(106,58,106,70,'#451a03',0.4)+R(4,30,34,1.5,'#78350f');
  add('raw',{s:bg},-10);
  add('raw',{s:R(14,74,26,2,'#a16207')+R(15,76,1.5,6,'#78350f')+R(37.5,76,1.5,6,'#78350f')},5);
  add('lwin',{moon:true,ml:r()<0.5,st:LSTAR.map(()=>r()<0.75),lc:pk(r,CURT),rod:pk(r,['#a16207','#94a3b8'])},1);
  const fts=shuf(r,['land','portrait','abstract']);[[4,4,15,11],[23,3,11,13]].forEach(([x,y,w,h],i)=>add('frame',{x,y,w,h,t:fts[i],fc:pk(r,['#d4a65a','#94a3b8']),sr:r()<0.5,bg:pk(r,['#fef3c7','#fbcfe8','#bfdbfe']),sc:pk(r,['#2563eb','#dc2626']),hat:r()<0.4,a1:pk(r,['#ef4444','#2563eb']),a2:pk(r,['#facc15','#16a34a']),tri:r()<0.7},1));
  const so=shuf(r,['plant','candles','vase','stack','jars','globe','duck']);[9.5,21,32.5].forEach((x,i)=>add('sh',{o:so[i],x,y:30,s:0.55,cat:'shelf',...shParams(so[i],r)},1));
  add('lclock',{h:r()<0.5,rim:'#a16207'},1);add('hang',{v:pk(r,['plant','plant','lamp','chand']),n:pk(r,[0,1,2,2]),pot:pk(r,['#f1f5f9','#b45309']),c:pk(r,['#dc2626','#2563eb','#16a34a']),on:r()<0.7,fl:[r()<0.8,true,r()<0.8],mc:pk(r,['#ca8a04','#94a3b8'])},1);
  add('cush',{c:[pk(r,['#fbbf24','#f1f5f9']),pk(r,['#ef4444','#16a34a'])],d:r()<0.6},2);
  add('scat',{on:r()<0.6,c:pk(r,['#f97316','#f1f5f9','#94a3b8']),f:r()<0.5},3);
  add('blank',{on:r()<0.8,c:pk(r,['#7c3aed','#a3e635']),st:r()<0.5},3);
  add('flamp',{c:pk(r,['#fde68a','#f472b6']),on:r()<0.6},2);
  add('gslot',{v:pk(r,['guitar','plant','plant','none']),c:pk(r,['#b45309','#2563eb']),n:r()<0.7?3:2},2);
  const who=r()<0.75;add('chair',{who,cc:pk(r,['#15803d','#b45309','#9f1239']),sh:pk(r,['#f59e0b','#2563eb','#f1f5f9']),ns:pk(r,[0,1,2,2]),gl:r()<0.5,bk:pk(r,['#dc2626','#16a34a']),shoe:pk(r,['#f472b6','#facc15']),pc:pk(r,['#fbbf24','#ef4444'])},2);
  add('tv',{v:pk(r,Object.keys(TVS)),h:r()<0.5,sail:pk(r,['#ef4444','#facc15'])},2);add('tvp',{pot:pk(r,['#c2410c','#f1f5f9']),n:r()<0.7?2:1},2);
  add('dog',{on:r()<0.7,bc:pk(r,['#7c3aed','#dc2626']),c:pk(r,['#d6a35a','#f1f5f9','#78350f'])},2);
  const tv=shuf(r,['mug','books','remote','bowl']);[19,31].forEach((x,i)=>add('titem',{x,v:tv[i],c:tv[i]==='bowl'?pk(r,['#ef4444','#84cc16']):pk(r,['#f1f5f9','#ef4444','#2563eb']),c2:pk(r,BOOKC),n:r()<0.7?2:1,f:r()<0.5},6));
  add('rug',{c:pk(r,['#ca8a04','#dc2626']),bd:r()<0.5},1);add('slip',{c:pk(r,['#f472b6','#38bdf8']),on:r()<0.85,gone:''},2);add('tvb',{k:[true,true],s:r()<0.5},2);
  return items;});
