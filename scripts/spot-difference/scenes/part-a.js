/* a change must be mostly on the picture; colors picked from a different group (near-identical shades never swap) */
/* a group of 3+ random colors never spawns all in one color */
const mixC=(r,arr,pal)=>{const c=arr.map(()=>pk(r,pal));if(c.length>=3&&c.every(x=>x===c[0])){const o=pal.filter(x=>x!==c[0]);if(o.length)c[ri(r,0,c.length-1)]=pk(r,o);}return c;};
/* copies of the same thing form a group: one change per picture, and together they count as one unit when picking */
const AUTOG=new Set(['nbld','roof','lamp','car','cloud','bld2','shore','pond','tree','person','planet','cup','lower','magnet','books','frame','fbox','veg','fish','skater','mwin','knight']);
const onCanvas=b=>{const w=Math.min(b[0]+b[2],120)-Math.max(b[0],0),h=Math.min(b[1]+b[3],90)-Math.max(b[1],0);return w>0&&h>0&&w*h>=0.7*b[2]*b[3];};
const hex6=c=>c.length===4?'#'+[...c.slice(1)].map(h=>h+h).join(''):c;
const cdist=(a,b)=>{const x=parseInt(hex6(a).slice(1,7),16),y=parseInt(hex6(b).slice(1,7),16);return Math.abs((x>>16)-(y>>16))+Math.abs((x>>8&255)-(y>>8&255))+Math.abs((x&255)-(y&255));};
/* red-green colour blindness (Machado et al. 2009, severity 1): a colour CHANGE must stay clearly different for
   deuteranopia and protanopia too, not just for normal vision; the colours a picture starts with are not limited */
const CVD_MAT=[[[0.367,0.861,-0.228],[0.280,0.673,0.047],[-0.012,0.043,0.969]],[[0.152,1.053,-0.205],[0.115,0.786,0.099],[-0.004,-0.048,1.052]]];
const CVD_MIN=70;
const rgbOf=c=>{const n=parseInt(hex6(c).slice(1,7),16);return[n>>16,n>>8&255,n&255];};
const cvdDist=(a,b)=>{if(!/^#/.test(a||'')||!/^#/.test(b||''))return 999;const x=rgbOf(a),y=rgbOf(b);return Math.min(...CVD_MAT.map(M=>M.reduce((s,row)=>s+Math.abs(row[0]*(x[0]-y[0])+row[1]*(x[1]-y[1])+row[2]*(x[2]-y[2])),0)));};
/* prefer the colours that pass for colour-blind players; if none does, the one that comes closest */
const cvdPrefer=(cands,old)=>{if(!/^#/.test(old||''))return cands;const ok=cands.filter(c=>cvdDist(c,old)>=CVD_MIN);return ok.length?ok:cands.slice().sort((a,b)=>cvdDist(b,old)-cvdDist(a,old)).slice(0,1);};
/* pick another value from a list: for colours, one that stays different under colour blindness */
const pkC=(r,list,old)=>{const c=list.filter(x=>x!==old);return pk(r,cvdPrefer(c.length?c:list,old));};
const grpOther=(r,c,groups)=>{const all=groups.flat().filter(x=>x!==c),far=all.filter(x=>cdist(x,c)>=110);return pk(r,cvdPrefer(far.length?far:[all.sort((a,b)=>cdist(b,c)-cdist(a,c))[0]],c));};
/* hats and hair must stand out: far from the skin and the hair (and from the old color when it changes) */
const farFrom=(r,pal,avoid,min=110)=>{const ok=pal.filter(c=>avoid.every(a=>!a||cdist(c,a)>=min));return ok.length?pk(r,ok):pal.slice().sort((x,y)=>Math.min(...avoid.filter(Boolean).map(a=>cdist(y,a)))-Math.min(...avoid.filter(Boolean).map(a=>cdist(x,a))))[0];};
const hatCol=(r,o,old)=>farFrom(r,old?cvdPrefer(SHIRTS.filter(c=>c!==old),old):SHIRTS,[o.hair,o.skin,old]);
const hairCol=(r,o)=>farFrom(r,cvdPrefer(HAIRG.flat().filter(c=>c!==o.hair),o.hair),[o.hair,o.skin,o.hat?o.hcol:'']);
const HAIRG=[['#111','#3f2a1d'],['#7c2d12'],['#eab308'],['#d6d3d1']],PANTG=[['#374151','#1f2937'],['#1e3a8a'],['#78350f']];
GENS.length=0;
/* ================= v7 shared ================= */
Object.assign(CAT,{sun:'sky',kwin:'window',floor:'floor',tools:'wall',planet:'planets',bigp:'planets',smoon:'moons',ast:'moons',comet:'comet'});
const U=(a,b)=>{const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);return[x,y,Math.max(a[0]+a[2],b[0]+b[2])-x,Math.max(a[1]+a[3],b[1]+b[3])-y];};
/* change one digit of a number, or drop one digit of a two-digit number */
function digitTweak(r,s,ok=v=>+v>0){for(let t=0;t<60;t++){let v;if(s.length===2&&r()<0.35)v=s[ri(r,0,1)];else{const i=ri(r,0,s.length-1),d=String(ri(r,0,9));if(d===s[i])continue;v=s.slice(0,i)+d+s.slice(i+1);}
  if(v[0]==='0'||v===s||!ok(v))continue;return v;}return s;}
/* neighbouring hue: a color change that is visible but does not jump out (red -> orange, blue -> violet) */
const NEARC={'#ef4444':'#f97316','#f97316':'#facc15','#facc15':'#f97316','#2563eb':'#7c3aed','#7c3aed':'#2563eb','#38bdf8':'#a78bfa','#a78bfa':'#38bdf8','#16a34a':'#0d9488','#0d9488':'#16a34a',
  '#fde68a':'#fdba74','#fdba74':'#fde68a','#f472b6':'#a78bfa','#cbd5e1':'#93c5fd','#93c5fd':'#cbd5e1','#fb923c':'#fde68a','#4ade80':'#facc15','#7c2d12':'#b45309','#b45309':'#7c2d12',
  '#f1f5f9':'#fde68a','#dc2626':'#f97316','#0ea5e9':'#2563eb','#65a30d':'#16a34a','#94a3b8':'#cbd5e1','#f59e0b':'#ef4444','#c2410c':'#9a3412','#9a3412':'#c2410c','#64748b':'#dc2626'};
const soft=c=>NEARC[c]||'#f97316';
/* v8: small things get a clearly different hue (blue -> green, yellow -> green, red -> purple), not a neighbour (blue -> light blue, yellow -> orange) */
const MIDC={'#fde68a':'#f9a8d4','#7c2d12':'#1e3a8a','#cbd5e1':'#fde68a','#f1f5f9':'#93c5fd','#c2410c':'#7c3aed','#9a3412':'#1e3a8a','#fdba74':'#93c5fd','#ef4444':'#a855f7','#dc2626':'#9333ea',
  '#2563eb':'#16a34a','#facc15':'#4ade80','#38bdf8':'#4ade80','#4ade80':'#38bdf8','#fca5a5':'#93c5fd','#93c5fd':'#fca5a5','#fbbf24':'#f472b6','#f472b6':'#facc15','#16a34a':'#2563eb','#60a5fa':'#4ade80',
  '#f59e0b':'#ec4899','#f0abfc':'#2563eb','#f97316':'#ec4899','#fb7185':'#a78bfa','#a855f7':'#ef4444','#a78bfa':'#f472b6','#94a3b8':'#2563eb','#7c3aed':'#db2777','#22d3ee':'#c084fc','#c084fc':'#22d3ee'};
const near=c=>MIDC[c]||'#a855f7';

const winContent8=(c,cc)=>c==='cat'?E(2.1,4.35,1.35,0.65,'#111')+C(3.35,3.4,0.75,'#111')+Pg('2.75,3 2.85,2.15 3.3,2.75','#111')+Pg('3.45,2.75 3.85,2.15 3.95,3.05','#111')
  +'<path d="M0.85 4.45 q-0.8 -0.3 -0.45 -1.6" stroke="#111" stroke-width="0.35" fill="none" stroke-linecap="round"/>':winContent(c,cc);
/* windows v7: a budget per picture (how many lit, how many with something inside), at most 1 cat */
K.win={draw:p=>{const{x,y}=p,z=p.sz||5,dark=p.night&&!p.lit;let s=R(x,y,z,z,dark?'#0f172a':(p.night?'#fde68a':'#bae6fd'))+L(x+z/2,y,x+z/2,y+z,dark?'#1e293b':(p.night?'#eab308':'#f1f5f9'),0.3);
  if(!dark&&p.c!=='none')s+=G(`translate(${x},${y}) scale(${z/5})`,winContent8(p.c,p.cc));return s;},
 muts:(p,r)=>{const z=p.sz||5,b=[p.x-0.3,p.y-0.3,z+0.6,z+0.6],g='win',m=[];const cs=p.cs.filter(c=>c!=='cat'||!p.noCat||p.c==='cat');
  if(p.night&&!p.lit)return[{t:'light',p2:{...p,lit:true,c:'none'},b,g}];
  if(p.c==='none'){if(p.night)m.push({t:'light',p2:{...p,lit:false},b,g});m.push({t:'add',p2:{...p,c:pk(r,cs)},b,g});}
  else{m.push({t:'remove',p2:{...p,c:'none'},b,g});const o=cs.filter(c=>c!==p.c);if(o.length)m.push({t:'replace',p2:{...p,c:pk(r,o)},b,g});
    if(p.c==='curtain')m.push({t:'color',p2:{...p,cc:other(r,p.cc,['#be185d','#2563eb','#facc15','#16a34a','#f1f5f9'])},b,g});}
  return m;}};
{const pm=K.person.muts;K.person.muts=(p,r)=>pm(p,r).filter(m=>p.s>=0.6||m.p2.o.glasses===p.o.glasses);}
function fillWins(r,wins,litN,thingN,cs){const idx=shuf(r,wins.map((_,i)=>i));const lit=new Set(idx.slice(0,Math.min(litN,wins.length)));let cat=false;
  wins.forEach((w,i)=>{w.lit=lit.has(i);w.c='none';w.cc=pk(r,['#be185d','#2563eb','#facc15','#16a34a']);});
  idx.filter(i=>lit.has(i)).slice(0,thingN).forEach(i=>{const c=pk(r,cs.filter(c=>c!=='cat'||!cat));if(c==='cat')cat=true;wins[i].c=c;});
  wins.forEach(w=>{w.noCat=cat;w.cs=cs;});}

/* ================= NIGHT CITY v5 ================= */
const ALTW={CAFE:'COFFEE',BOOKS:'BINS',PIZZA:'PASTA',FLOWERS:'FLOORS'};
const DISP=['#ef4444','#2563eb','#16a34a','#facc15','#a855f7'];
const dX=(p,i)=>p.x+2+(p.w-9-16.8)/2+i*4.6;
K.nbld={draw:p=>{const{x,w,top}=p;let s=R(x,top,w,70-top,p.c)+R(x,top,w,1,'#334155');const cx=x+w/2;
  if(p.shop==='res')return s+R(x+2,61,5,9,'#64748b')+R(x+2,61,5,0.6,'#94a3b8')+R(x+3,62.5,3,2,'#fde68a');
  s+=R(x+2,57,w-4,4.5,'#0b1020')+T(cx,60.6,3.4,p.shop==='bar'?p.neon:'#f1f5f9',p.shop==='bar'?'BAR':(p.txt??p.word))+R(x+2,63,w-9,7,'#fbbf24','opacity=".7"')+R(x+w-6,62,4.5,8,'#64748b');
  if(p.shop==='store')p.disp.forEach((c,i)=>{const dx=dX(p,i);if(p.word==='BOOKS')s+=R(dx,66,3,4,c);if(p.word==='PIZZA')s+=Pg(`${dx},70 ${dx+3.4},70 ${dx+1.7},66`,c);
    if(p.word==='FLOWERS')s+=R(dx+0.5,68,2.4,2,'#b45309')+C(dx+1.7,67,1.2,c);if(p.word==='CAFE')s+=R(dx,67,3,3,c,'rx="0.4"');});
  return s;},
 muts:(p,r)=>{const{x,w}=p,m=[];
  if(p.shop==='bar')m.push({t:'color',p2:{...p,neon:p.neon==='#38bdf8'?'#f472b6':'#38bdf8'},b:[x+2,57,w-4,4.5]});
  if(p.shop==='store')m.push({t:'text',p2:{...p,txt:ALTW[p.word]},b:[x+2,57,w-4,4.5]},{t:'remove',p2:{...p,txt:''},b:[x+2,57,w-4,4.5]});
  if(p.shop==='store'){const db=i=>[dX(p,i)-0.5,65.5,4.4,4.6];const i=ri(r,0,3);const d=p.disp.slice();d[i]=other(r,d[i],DISP);m.push({t:'color',p2:{...p,disp:d},b:db(i)});
    const js=[0,1,2].filter(j=>cvdDist(p.disp[j],p.disp[j+1])>=CVD_MIN);if(js.length){const j=pk(r,js);const d2=p.disp.slice();[d2[j],d2[j+1]]=[d2[j+1],d2[j]];m.push({t:'move',p2:{...p,disp:d2},b:U(db(j),db(j+1))});}}
  return m;}};
K.roof={draw:p=>{const{x,w,top,type}=p,cx=x+w/2;let s='';
  if(type==='tower')s+=L(cx-4,top,cx-4,top-4,'#475569',0.6)+L(cx+4,top,cx+4,top-4,'#475569',0.6)+R(cx-5,top-10,10,6,p.tank,'rx="1"')+(p.cone?Pg(`${cx-5},${top-10} ${cx},${top-13.5} ${cx+5},${top-10}`,'#475569'):'');
  if(type==='sale')s+=L(cx-5,top,cx-5,top-3,'#475569',0.6)+L(cx+5,top,cx+5,top-3,'#475569',0.6)+R(cx-7.5,top-10,15,7,'#7c3aed')+T(cx,top-4.4,4.2,'#fde68a',p.txt);
  if(type==='sign')s+=L(cx-4,top,cx-4,top-3,'#475569',0.6)+L(cx+4,top,cx+4,top-3,'#475569',0.6)+R(cx-8,top-9,16,6,p.bc,'rx="0.8"')+T(cx,top-4.4,3.6,'#f1f5f9',p.txt);
  if(type==='dish'&&p.dish)s+=L(cx,top,cx,top-6,'#94a3b8',0.9)+G(`rotate(${p.f?30:-30} ${cx} ${top-7})`,Pa(`M${cx-4} ${top-7} a4 3.2 0 0 0 8 0 Z`,'#e2e8f0')+(p.ant?L(cx,top-7,cx,top-10.5,'#e2e8f0',0.5)+C(cx,top-10.5,0.65,'#e2e8f0'):''));
  if(type==='rail'){s+=L(x+2,top-3.5,x+w-2,top-3.5,'#64748b',0.5);for(let i=0;i<p.n;i++)if(p.bars||i===0||i===p.n-1)s+=L(x+2+i*(w-4)/(p.n-1),top-3.5,x+2+i*(w-4)/(p.n-1),top,'#64748b',0.5);}
  if(type==='ac')p.units.forEach((on,i)=>{if(!on)return;const ux=cx-6.5+i*7.5;s+=R(ux,top-4.5,5.5,4.5,'#94a3b8','rx="0.5"')+C(ux+2.75,top-2.25,1.5,p.fan)+L(ux+1.3,top-2.25,ux+4.2,top-2.25,'#334155',0.3);});
  if(type==='cat'&&p.on)s+=cat(cx,top-1.6,p.cc,p.f);
  if(type==='lights'){const n=p.n,st=(w-6)/(n-1);s+=`<path d="M${x+3} ${top-2} ${Array.from({length:n-1},(_,i)=>`Q${x+3+st*(i+0.5)} ${top-0.6} ${x+3+st*(i+1)} ${top-2}`).join(' ')}" stroke="#475569" stroke-width="0.3" fill="none"/>`;
    for(let i=0;i<n;i++){if((i===0&&!p.l)||(i===n-1&&!p.r))continue;s+=C(x+3+st*i,top-1.6,0.8,p.lc);}}
  return s;},
 muts:(p,r)=>{const{x,w,top,type}=p,cx=x+w/2;
  if(type==='tower')return[tog(p,'cone',[cx-5.5,top-14,11,4.5]),{t:'color',p2:{...p,tank:p.tank==='#7c2d12'?'#94a3b8':'#7c2d12'},b:[cx-5.5,top-10.5,11,7]}];
  if(type==='sale')return[{t:'text',p2:{...p,txt:p.txt==='SALE'?'SOLD':'SALE'},b:[cx-8,top-10.5,16,8]}];
  if(type==='sign')return[{t:'text',p2:{...p,txt:pk(r,SIGNS.filter(t=>t!==p.txt))},b:[cx-8.5,top-9.5,17,7]},{t:'color',p2:{...p,bc:other(r,p.bc,['#be123c','#0f766e','#1d4ed8','#f97316'])},b:[cx-8.5,top-9.5,17,7]}];
  if(type==='dish')return p.dish?[{t:'flip',p2:{...p,f:!p.f},b:[cx-5.5,top-12,11,8]},{t:'remove',p2:{...p,dish:false},b:[cx-5.5,top-12,11,12]},{t:p.ant?'remove':'add',p2:{...p,ant:!p.ant},b:p.f?[cx-0.6,top-11,3.4,4.6]:[cx-2.8,top-11,3.4,4.6],easy:false}]:[];
  if(type==='rail'){const st=(w-4)/(p.n-1);return[{t:p.bars?'remove':'add',p2:{...p,bars:!p.bars},b:[x+2+st-1,top-4,w-4-2*st+2,4.5],easy:false}];}
  if(type==='ac'){const i=pk(r,[0,1]);const u=p.units.slice();u[i]=!u[i];return[{t:p.units[i]?'remove':'add',p2:{...p,units:u},b:[cx-7+i*7.5,top-5,6.5,5.5]}];}
  if(type==='cat')return p.on?[{t:'color',p2:{...p,cc:other(r,p.cc,['#f97316','#f1f5f9','#94a3b8','#a16207'])},b:[cx-4,top-6,8.2,6]},{t:'flip',p2:{...p,f:!p.f},b:[cx-4.2,top-6,8.4,6]},{t:'remove',p2:{...p,on:false},b:[cx-4,top-6,8.2,6]}]:[];
  if(type==='lights'){const st=(w-6)/(p.n-1);return[tog(p,'l',[x+1.2,top-3.4,3.6,3.6]),tog(p,'r',[x+3+st*(p.n-1)-1.8,top-3.4,3.6,3.6]),{t:'color',p2:{...p,lc:p.lc==='#fde68a'?'#f1f5f9':'#fde68a'},b:[x+1.2,top-3.4,w-2.4,3.6],easy:false}];}
  return[];}};
const BLIMP={'#2563eb':{lt:'#93c5fd',dk:'#1e3a8a'},'#94a3b8':{lt:'#e2e8f0',dk:'#475569'}};
K.blimp={draw:p=>p.on?Pg(`${p.x-6},${p.y} ${p.x-9.5},${p.y-2.8} ${p.x-9.5},${p.y+2.8}`,p.c)+E(p.x,p.y,7,2.7,p.c)+R(p.x-2,p.y+2.3,4,1.4,'#334155')+(p.light?C(p.x+6.3,p.y,0.6,'#ef4444'):'')+R(p.x-4,p.y-0.8,8,1.6,BLIMP[p.c][p.sd]):'',
 muts:p=>{const b=[p.x-10,p.y-3.2,17.5,7.2];return p.on?[{t:'remove',p2:{...p,on:false},b},tog(p,'light',[p.x+5,p.y-1.4,2.8,2.8]),{t:'color',p2:{...p,c:p.c==='#2563eb'?'#94a3b8':'#2563eb'},b},{t:'color',p2:{...p,sd:p.sd==='lt'?'dk':'lt'},b:[p.x-4.5,p.y-1.3,9,2.6],easy:false}]:[{t:'add',p2:{...p,on:true},b}];}};
const carSide8=(x,y,c,f)=>flip(x+11,R(x,y+4,22,6,c,'rx="2"')+Pg(`${x+3},${y+4.5} ${x+4.2},${y} ${x+12},${y} ${x+16.5},${y+4.5}`,c)+R(x+5,y+1,4,3,'#bae6fd')+Pg(`${x+10},${y+1} ${x+11.8},${y+1} ${x+14.6},${y+4} ${x+10},${y+4}`,'#bae6fd')
  +R(x+20.8,y+5.5,1.2,1.5,'#fde68a')+R(x,y+5.5,1,1.6,'#ef4444')+C(x+5,y+10,2.4,'#111')+C(x+17,y+10,2.4,'#111')+C(x+5,y+10,0.9,'#9ca3af')+C(x+17,y+10,0.9,'#9ca3af'),f);
K.car.draw=p=>{let s=G(`translate(${p.x},${p.y}) scale(0.9)`,carSide8(0,0,p.c,p.f)+(p.taxi?R(6.5,-2.4,6,2.4,'#111827')+T(9.5,-0.5,1.8,'#facc15','TAXI'):''));
  if(p.beam){const fx=p.f?p.x+0.6:p.x+19.2,dir=p.f?-1:1;s+=Pg(`${fx},${p.y+5.2} ${fx+dir*12},${p.y+2.5} ${fx+dir*12},${p.y+8.5}`,'#fde68a','opacity=".35"');}return s;};
const SIGNS=['OPEN','NEWS','HOTEL','MOTEL','RADIO'];
K.lamp={draw:p=>L(p.x,75.5,p.x,58,'#64748b',0.7)+L(p.x,58,p.x-1.5,58,'#64748b',0.7)+C(p.x-1.5,59,1.1,p.on?'#fde68a':'#475569')+(p.on?Pg(`${p.x-3},60 ${p.x},60 ${p.x+1.5},75.5 ${p.x-4.5},75.5`,'#fde68a','opacity=".1"'):''),
 muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[p.x-4.8,57.5,6.6,18.3]}]};
K.bus={draw:p=>{const{x,y}=p;return flip(x+15,R(x,y,30,9.5,p.c,'rx="1.5"')+[0,1,2,3].map(i=>R(x+3+i*5,y+1.5,4,3.5,'#fde68a')+(p.ps.includes(i)?C(x+5+i*5,y+3,0.95,'#334155')+R(x+3.7+i*5,y+3.9,2.6,1.1,'#334155','rx="0.5"'):'')).join('')+R(x+23,y+1.5,2.5,7.5,'#334155')+R(x+26.2,y+1.5,3,3,'#111827')+C(x+6,y+9.5,2.2,'#111')+C(x+24,y+9.5,2.2,'#111')+R(x+29.2,y+6,0.8,1.4,'#fde68a'),p.f)+(p.num?G(`translate(${p.f?x+2.3:x+27.7},${y+3.7})`,T(0,0,2,'#fbbf24',p.route)):'');},
 muts:(p,r)=>{const{x,y}=p,wx=i=>p.f?x+30-3-i*5-4:x+3+i*5,wb=i=>[wx(i)-0.4,y+1.1,4.8,4.3],m=[];
  /* 1-2 passengers: one gets off, one gets on, or one moves to the next empty seat */
  if(p.ps.length){const i=pk(r,p.ps);m.push({t:'remove',p2:{...p,ps:p.ps.filter(k=>k!==i)},b:wb(i),easy:false});
   const mv=[i-1,i+1].filter(k=>k>=0&&k<=3&&!p.ps.includes(k));if(mv.length){const j=pk(r,mv);m.push({t:'move',p2:{...p,ps:p.ps.map(k=>k===i?j:k)},b:U(wb(i),wb(j)),easy:false});}}
  if(p.ps.length<2){const e=[0,1,2,3].filter(k=>!p.ps.includes(k)),j=pk(r,e);m.push({t:'add',p2:{...p,ps:[...p.ps,j]},b:wb(j),easy:false});}
  m.push(tog(p,'num',[p.f?x+0.3:x+25.7,y+1,4.5,4.2]));
  m.push({t:'color',p2:{...p,c:other(r,p.c,['#dc2626','#2563eb','#16a34a','#facc15','#f97316'])},b:[x-0.5,y-0.5,31,12.5]});return m;}};
gadd('Night city','about 20 lit windows (4–8 with something inside), roof variety, a bus',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  const wantP=r()<0.7;const S=[[0,22],[23,18],[42,22],[65,18],[84,34]];const narrow=[1,3];const moonSlot=pk(r,narrow),blimpSlot=narrow.find(n=>n!==moonSlot);
  const tops=S.map((s,i)=>narrow.includes(i)?ri(r,30,38):ri(r,8,22));
  const used=[];const roofs=S.map(([x,w],i)=>{const top=tops[i];let ok=['rail','ac','cat','lights','none'];if(narrow.includes(i))ok.push('sale','sign','dish');else if(top>=15){ok.push('tower','dish');if(w>=16)ok.push('sale','sign');}
    const opts=shuf(r,ok).filter(t=>t==='none'?used.filter(u=>u==='none').length<1:!used.includes(t));const t=opts[0]||'none';used.push(t);return t;});
  add('raw',{s:R(0,0,120,90,'#0b1430')},-10);
  const mx=S[moonSlot][0]+S[moonSlot][1]/2,bx=S[blimpSlot][0]+S[blimpSlot][1]/2;
  add('moon',{x:mx,y:12,r:r()<0.5},1);add('blimp',{x:bx+1,y:12,on:r()<0.75,c:pk(r,['#94a3b8','#2563eb']),sd:pk(r,['lt','dk']),light:r()<0.7},1);
  const block=S.map(([x,w],i)=>[x-1,tops[i]-ROOFH[roofs[i]]-2,w+2,90]);block.push([mx-7,4,14,16],[bx-10,7,19,10]);
  freeSpots(r,9,[3,2,114,30],block,3,11).forEach(([x,y])=>add('star',{x:+x.toFixed(1),y:+y.toFixed(1),on:r()<0.85,s:1.3},1,'star'));
  const word=pk(r,['BOOKS','PIZZA','FLOWERS','CAFE']);const wins=[];
  S.forEach(([x,w],i)=>{const top=tops[i];const shop=i===1?'bar':i===4?'store':'res';
    add('nbld',{x,w,top,c:pk(r,['#1e293b','#273449','#26324a','#1f2a3f']),shop,neon:pk(r,['#38bdf8','#f472b6']),word,disp:mixC(r,[0,1,2,3],DISP)},0);
    const rt=roofs[i],n=Math.max(4,Math.floor(w/4));
    add('roof',{x,w,top,type:rt,cone:r()<0.7,tank:'#7c2d12',txt:rt==='sale'?pk(r,['SALE','SOLD']):pk(r,SIGNS),bc:pk(r,['#be123c','#0f766e','#1d4ed8']),dish:true,ant:r()<0.8,f:r()<0.5,n,bars:true,units:[true,r()<0.7],fan:pk(r,['#475569','#cbd5e1']),on:true,cc:pk(r,['#f97316','#f1f5f9','#94a3b8']),lc:pk(r,['#fde68a','#f1f5f9']),l:true,r:true},1);
    /* windows: the bottom row sits just above the door / sign (and above the street lamps) */
    const nc=Math.floor((w-4)/6),sx=x+(w-(nc*6-2))/2,bot=shop==='res'?56.5:52;
    for(let c=0;c<nc;c++)for(let y=bot-5;y>=top+3;y-=7)wins.push({x:sx+c*6,y,night:true});});
  fillWins(r,wins,ri(r,18,22),ri(r,4,8),['plant','person','cat']);wins.forEach(p=>add('win',p,1,'win'));
  add('raw',{s:R(0,70,120,6,'#334155')+R(0,76,120,14,'#1f2937')+[4,18,32,46,60,74,88,102,116].map(x=>R(x,83,7,0.8,'#475569')).join('')},2);
  [22.5,83.5].forEach(x=>add('lamp',{x,on:r()<0.85},3));
  add('bin',{x:9,cat:r()<0.6,cc:pk(r,['#f1f5f9','#f97316','#94a3b8'])},3);
  add('hydrant',{x:wantP?59:pk(r,[59,70]),on:true},3);
  if(wantP)add('person',{x:72,y:75.5,s:0.5,o:wardrobe(r,{noItem:true})},4);
  add('car',{x:ri(r,14,24),y:78.5,c:pk(r,CARS2),f:r()<0.5,beam:r()<0.6,taxi:false},5);
  const vb=pk(r,['car','taxi','bus','bus']);
  if(vb==='bus')add('bus',{x:ri(r,72,86),y:77.5,c:pk(r,['#dc2626','#2563eb','#16a34a','#facc15']),f:r()<0.5,ps:shuf(r,[0,1,2,3]).slice(0,pk(r,[1,2])),route:pk(r,['12','21','7','42','24','9','5','38']),num:r()<0.7},5);
  else add('car',{x:ri(r,70,86),y:78.5,c:vb==='taxi'?'#facc15':pk(r,CARS2),f:r()<0.5,beam:r()<0.5,taxi:vb==='taxi'},5);
  return items;});

/* ================= POND PARK v3 ================= */
K.sun={draw:p=>{const cx=p.R?120:0,d=p.R?-1:1;let s=C(cx,0,7.5,'#fbbf24');for(let i=0;i<p.n;i++){const a=(12+i*66/(p.n-1))*Math.PI/180,dx=Math.cos(a)*d,dy=Math.sin(a);s+=L(cx+dx*10,dy*10,cx+dx*14.5,dy*14.5,'#fbbf24',1.1);}return s;},
 muts:p=>[{t:p.n===5?'remove':'add',p2:{...p,n:p.n===5?4:5},b:p.R?[104,0,16,16]:[0,0,16,16],easy:false}]};
const GAPC=['#92400e','#2563eb','#16a34a','#dc2626','#64748b'];
const LB={glob:x=>[x-2.6,24.4,5.2,6.2],lant:x=>[x-2.7,25.8,5.4,7.2]};
K.gap={draw:p=>{const x=p.x;if(p.v==='tree')return R(x-0.8,40,1.6,10,'#4a3222')+C(x,36,4.5,DTREE)+C(x+1.3,34.5,2,'#33703a');
  if(p.v==='pine')return pine2(x,50,0.85,'#1d4a2a','#265c35');
  if(p.v==='lamp')return p.glob?L(x,50,x,29.5,'#334155',0.8)+R(x-1,24.6,2,0.9,'#334155')+C(x,27.6,2.3,p.lc)+R(x-1.4,29.6,2.8,0.8,'#334155')
    :L(x,50,x,31.5,'#334155',0.9)+Pg(`${x-2.4},28.4 ${x+2.4},28.4 ${x},26`,'#334155')+Pg(`${x-1.7},28.4 ${x+1.7},28.4 ${x+2.1},32 ${x-2.1},32`,p.lc)+R(x-2.5,31.8,5,0.9,'#334155');
  if(p.v==='bench')return R(x-4.5,47,9,1.2,p.c)+R(x-4.5,44.6,9,1,p.c)+L(x-3.5,48,x-3.5,50,'#334155',0.5)+L(x+3.5,48,x+3.5,50,'#334155',0.5);
  if(p.v==='bin')return R(x-2,45,4,5,p.c)+R(x-2.4,44.2,4.8,1,'#334155');return'';},
 muts:(p,r)=>{const x=p.x,tb=[x-5,31,10,19],bb=[x-5,43.8,10,6.4],nb=[x-2.6,43.8,5.2,6.4];
  if(p.v==='tree')return[{t:'remove',p2:{...p,v:'none'},b:tb},{t:'replace',p2:{...p,v:'pine'},b:tb}];
  if(p.v==='pine')return[{t:'remove',p2:{...p,v:'none'},b:tb},{t:'replace',p2:{...p,v:'tree'},b:tb}];
  if(p.v==='lamp'){const hb=(p.glob?LB.glob:LB.lant)(x);return[{t:'replace',p2:{...p,glob:!p.glob},b:[x-2.8,24.4,5.6,9]},{t:'color',p2:{...p,lc:p.lc==='#fde68a'?'#f1f5f9':'#fde68a'},b:hb}];}
  if(p.v==='bench')return[{t:'color',p2:{...p,c:other(r,p.c,GAPC)},b:bb},{t:'remove',p2:{...p,v:'none'},b:bb},{t:'replace',p2:{...p,v:'bin'},b:bb}];
  if(p.v==='bin')return[{t:'color',p2:{...p,c:other(r,p.c,GAPC)},b:nb},{t:'replace',p2:{...p,v:'bench'},b:bb},{t:'remove',p2:{...p,v:'none'},b:nb}];
  return p.occ?[]:[{t:'add',p2:{...p,v:'bin',c:pk(r,GAPC)},b:nb}];}};
/* corner tree: round with apples (formation of 4/5/6, one may be missing), round without apples, or a pine */
K.tree={draw:p=>{const{x,y}=p;let s;
  if(p.type==='round'){s=R(x-1.3,y-14,2.6,14,'#4a3222')+C(x,y-20,8,DTREE)+C(x-5.5,y-16,4.5,DTREE)+C(x+5.5,y-16,4.5,DTREE)+C(x+2,y-23,3.5,'#33703a');if(p.ap)AFORM[p.n].forEach(([dx,dy],i)=>{if(i!==p.miss)s+=C(x+dx,y+dy,1.15,p.ac);});}
  else s=pine2(x,y,1.45,'#1d4a2a','#265c35');
  const bx=p.type==='round'?x+3:x-0.5,by=p.type==='round'?y-28.5:y-25.6;if(p.bird)s+=E(bx,by,1.5,1,'#78350f')+C(bx+1.3,by-0.8,0.8,'#78350f')+Pg(`${bx+2},${by-0.9} ${bx+2.9},${by-0.7} ${bx+2},${by-0.5}`,'#f59e0b');return s;},
 muts:(p,r)=>{const{x,y}=p,bx=p.type==='round'?x+3:x-0.5,by=p.type==='round'?y-28.5:y-25.6,all=[x-10.5,y-28.2,21,26.2];const m=[tog(p,'bird',[bx-2,by-2.5,6,4])];
  if(p.type==='round'&&p.ap){const ab=i=>[x+AFORM[p.n][i][0]-1.8,y+AFORM[p.n][i][1]-1.8,3.6,3.6];
    if(p.miss<0){const i=ri(r,0,p.n-1);m.push({t:'remove',p2:{...p,miss:i},b:ab(i)});}else m.push({t:'add',p2:{...p,miss:-1},b:ab(p.miss)});
    m.push({t:'color',p2:{...p,ac:p.ac==='#ef4444'?'#facc15':'#ef4444'},b:[x-10,y-28,20,17]});}
  else if(!p.bird)m.push({t:'replace',p2:{...p,type:p.type==='round'?'pine':'round',ap:false},b:all});
  return m;}};
const bushD=(x,y,c,fl)=>{let s=C(x-3.2,y+0.4,2.9,'#25542b')+C(x+3.2,y+0.4,2.9,'#25542b')+C(x,y-1,3.7,'#2f6b35')+C(x-1.3,y-2.3,1.6,'#3b7f42');
  if(fl)[[-3.4,0.4],[-0.8,-2.4],[1.9,-0.6],[3.7,1.2],[0.2,1.5]].forEach(([dx,dy])=>s+=C(x+dx,y+dy,0.85,c));return s;};
K.shore={draw:p=>{const{x,y}=p;if(p.v==='bush')return bushD(x,y,p.c,p.fl);
  if(p.v==='reeds'){let s='';for(let i=0;i<p.n;i++){const rx=x-2+i*2.2;s+=L(rx,y+3,rx,y-4+i*0.8,'#4d7c3a',0.5)+E(rx,y-2.6+i*0.8,0.7,1.8,'#78350f');}return s;}
  if(p.v==='rock')return E(x-1.5,y+0.5,3,1.8,'#78716c')+(p.n>1?E(x+2.5,y+1,2,1.3,'#a8a29e'):'');return'';},
 muts:(p,r)=>{const{x,y}=p,bb=[x-6.5,y-5,13,8.5];
  if(p.v==='bush')return p.fl?[{t:'color',p2:{...p,c:other(r,p.c,['#7c3aed','#dc2626','#f472b6','#f1f5f9','#facc15'])},b:bb,easy:false},{t:'remove',p2:{...p,fl:false},b:bb,easy:false},{t:'remove',p2:{...p,v:'none'},b:bb}]
    :[{t:'add',p2:{...p,fl:true},b:bb,easy:false},{t:'remove',p2:{...p,v:'none'},b:bb}];
  if(p.v==='reeds')return[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[x-3,y-5,7.5,9]}];
  if(p.v==='rock')return[{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[x-5,y-1.8,10,4.2]}];
  return[{t:'add',p2:{...p,v:'rock',n:1},b:[x-5,y-1.8,10,4.2]}];}};
/* pond slots: ducks and lilies come alone or in pairs */
K.pond={draw:p=>{const{x,y}=p;if(p.v==='duck')return duck(x,y,p.c,p.f)+(p.n>1?duck(x+5.5,y+2.2,p.c,p.f):'');if(p.v==='swan')return swan(x,y,p.f);
  if(p.v==='lily')return lily(x,y,p.fl)+(p.n>1?lily(x+5,y+1.8,false):'');if(p.v==='boat')return smallBoat(x,y,p.c);return'';},
 muts:(p,r)=>{const{x,y}=p;const bd=(dx=0,dy=0)=>[x+dx-4.6,y+dy-3.6,9.4,5.6],bs=[x-6.6,y-7.6,13.2,9.8],bl=(dx=0,dy=0)=>[x+dx-3.4,y+dy-1.8,7,3.4],bb=[x-5.5,y-1,11,4];
  if(p.v==='duck'){const hb=(dx=0,dy=0)=>p.f?[x+dx-4.8,y+dy-3,4,2.8]:[x+dx+0.8,y+dy-3,4,2.8];const all=p.n>1?U(bd(),bd(5.5,2.2)):bd();return[{t:'flip',p2:{...p,f:!p.f},b:all},{t:'color',p2:{...p,c:p.c==='#15803d'?'#a16207':'#15803d'},b:all},
    p.n>1?{t:'remove',p2:{...p,n:1},b:bd(5.5,2.2)}:{t:'add',p2:{...p,n:2},b:bd(5.5,2.2)}];}
  if(p.v==='swan')return[{t:'flip',p2:{...p,f:!p.f},b:bs},{t:'remove',p2:{...p,v:'none'},b:bs}];
  if(p.v==='lily')return[{t:p.fl?'remove':'add',p2:{...p,fl:!p.fl},b:bl()},p.n>1?{t:'remove',p2:{...p,n:1},b:bl(5,1.8)}:{t:'add',p2:{...p,n:2},b:bl(5,1.8)}];
  if(p.v==='boat')return[{t:'color',p2:{...p,c:other(r,p.c,['#b45309','#2563eb','#dc2626','#f1f5f9','#facc15'])},b:bb}];
  return[{t:'add',p2:{...p,v:'duck',n:1,c:'#15803d',f:r()<0.5},b:bd()}];}};
gadd('Pond park','sun with rays in a corner, 3 houses, ducks and lilies in pairs, a lake',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  const sunR=r()<0.5;
  add('raw',{s:R(0,0,120,50,'#1e3a5f')+R(0,50,120,8,'#d6c9a8')+R(0,58,120,32,'#4d7c3a')+E(52,93,43.5,26.5,'#a8a29e')+E(82,95,31.5,20.5,'#a8a29e')+E(52,93,42,25,'#2563a8')+E(82,95,30,19,'#2563a8')+`<path d="M44 80 q2 -1 4 0 M70 88 q2 -1 4 0 M88 80 q2 -1 4 0" stroke="#60a5fa" stroke-width="0.5" fill="none"/>`},-10);
  add('sun',{R:sunR,n:pk(r,[4,5])},0);
  [28,62,96].forEach(x=>{if((sunR&&x>90)||(!sunR&&x<30))return;add('cloud',{x,y:8,s:0.75,on:r()<0.65});});add('birds',{x:pk(r,[40,74]),y:13,two:r()<0.6});
  const types=shuf(r,['house','house','townhouse','shop']).slice(0,3);const spots=[],wins=[];
  [3,45,87].forEach((x,i)=>{const type=types[i],top=type==='house'?ri(r,29,30):type==='townhouse'?20:28;
    add('bld2',{x,type,top,wall:pk(r,WALLS),roof:pk(r,ROOFS),door:pk(r,DOORS),chimney:r()<0.6,word:pk(r,WORDS),awning:pk(r,['#dc2626','#2563eb','#16a34a','#7c3aed'])},0);
    (type==='house'?[[x+4,top+4],[x+20,top+4]]:type==='townhouse'?[[x+4,top+4],[x+20,top+4],[x+4,top+13],[x+20,top+13]]:[]).forEach(([wx,wy])=>wins.push({x:wx,y:wy,sz:6}));
    if(type!=='shop')spots.push(...[x+5,x+25].filter(v=>v>=12&&v<=100));});
  fillWins(r,wins,99,ri(r,1,3),['curtain','curtain','plant','cat']);wins.forEach(p=>add('win',p,1,'win'));
  [39,81].forEach(x=>{const v=pk(r,['tree','pine','lamp','lamp','bench','bin','none']);add('gap',{x,v,glob:r()<0.5,lc:pk(r,['#fde68a','#f1f5f9']),c:pk(r,GAPC)},1);if(v==='none')spots.push(x);});
  const ps=[];shuf(r,spots).forEach(x=>{if(ps.length<2&&ps.every(o=>Math.abs(o-x)>=14))ps.push(x);});items.forEach(it=>{if(it.kind==='gap'&&ps.includes(it.p.x))it.p.occ=true;});
  ps.forEach(x=>add('person',{x,y:57.5,s:0.5,o:wardrobe(r,{noDog:x<12})},3));
  [[26,72],[40,66.5],[60,66],[78,70],[94,77]].forEach(([x,y])=>{const v=pk(r,['bush','bush','reeds','rock','none']);add('shore',{x,y,v,fl:r()<0.7,n:ri(r,2,3)-(v==='rock'?1:0),c:pk(r,['#7c3aed','#dc2626','#f472b6'])},4);});
  [8,112].forEach(x=>{const n=pk(r,[4,5,6]),round=r()<0.75;add('tree',{x,y:86,type:round?'round':'pine',ap:round&&r()<0.75,n,miss:r()<0.4?ri(r,0,n-1):-1,ac:r()<0.8?'#ef4444':'#facc15',bird:r()<0.35},4);});
  [[30,84,0,1],[47,77,0,1],[66,85,1,0],[82,85,0,1],[99,88,0,0]].forEach(([x,y,big,pair])=>{let v=big?pk(r,['swan','boat','duck','lily']):pk(r,['duck','lily','lily','none','duck']);
    add('pond',{x,y,v,n:pair&&r()<0.45?2:1,c:v==='boat'?pk(r,['#b45309','#2563eb','#dc2626']):pk(r,['#15803d','#a16207']),f:r()<0.5,fl:r()<0.6},5);});
  return items;});
