/* ================= SPACE v2: objects placed anywhere ================= */
/* local box -> picture box, for an object drawn with translate(x,y) rotate(a) scale(s*m, s) */
const xf=(b,p)=>{const s=p.s||1,m=p.m||1,a=(p.a||0)*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
  const pts=[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0],b[1]+b[3]],[b[0]+b[2],b[1]+b[3]]].map(([u,v])=>{u*=s*m;v*=s;return[p.x+u*c-v*sn,p.y+u*sn+v*c];});
  const xs=pts.map(q=>q[0]),ys=pts.map(q=>q[1]),x0=Math.min(...xs),y0=Math.min(...ys);return[x0,y0,Math.max(...xs)-x0,Math.max(...ys)-y0];};
const placed=def=>({draw:p=>p.on===false?'':G(`translate(${p.x},${p.y}) rotate(${p.a||0}) scale(${(p.s||1)*(p.m||1)},${p.s||1})`,def.draw(p)),
  muts:(p,r)=>def.muts(p,r).map(mm=>({...mm,b:U(xf(mm.b,p),xf(mm.b,mm.p2))})),box:p=>xf(def.box(p),p)});
const arcH=(rx,ry,front,c,w)=>`<path d="M${front?rx:-rx} 0 A${rx} ${ry} 0 0 1 ${front?-rx:rx} 0" stroke="${c}" stroke-width="${w}" fill="none"/>`;
const CR4=[[-0.4,-0.35,0.22],[0.38,-0.12,0.17],[-0.12,0.42,0.2],[0.45,0.45,0.13]];
const CRK=[[-0.65,-0.2,-0.15,-0.55],[-0.45,0.25,0.35,0.05],[0,0.65,0.6,0.4]];
const MSL=[[1.85,0],[0,0.5],[-1.85,0]];
const PLANET={
 box:p=>p.type==='ringed'?[-1.8*p.r,-1.45*p.r,3.6*p.r,2.5*p.r]:p.type==='moons'?[-1.85*p.r-2,-p.r,3.7*p.r+4,2*p.r]:[-p.r,-p.r,2*p.r,2*p.r],
 draw:p=>{const r_=p.r;let s='';
  if(p.type==='ringed'){const rx=r_*1.75,ry=r_*0.42;s+=G('rotate(-15)',arcH(rx,ry,0,p.ring,1.3)+(p.line?arcH(rx*0.82,ry*0.82,0,'#b45309',0.4):''))+C(0,0,r_,p.c)+E(0,-r_*0.35,r_*0.85,r_*0.17,p.band)
    +G('rotate(-15)',arcH(rx,ry,1,p.ring,1.3)+(p.line?arcH(rx*0.82,ry*0.82,1,'#b45309',0.4):''))+(p.moonlet?C(r_*1.6,-r_*1.25,1.3,'#cbd5e1'):'');}
  if(p.type==='earth')s+=C(0,0,r_,'#2563eb')+G(`scale(${r_/9})`,Pa('M-7 -3 q3 -4 7 -2 q2 3 -2 5 q-3 2 -5 -3 Z','#16a34a')+(p.c2?Pa('M1 3 q4 -2 6 1 q-1 4 -5 3 Z','#16a34a'):'')+(p.cloud?E(3,-5,3.5,1,'#f1f5f9'):'')+(p.cap?Pa('M-4.5 -7.8 a9 9 0 0 1 9 0 q-4.5 1.5 -9 0 Z','#f1f5f9'):''));
  if(p.type==='banded')s+=C(0,0,r_,p.c)+E(0,-r_*0.5,r_*0.8,r_*0.14,p.st[0])+E(0,r_*0.05,r_*0.97,r_*0.15,p.st[1])+(p.st3?E(0,r_*0.55,r_*0.78,r_*0.13,p.st[2]):'')+(p.spot?E(r_*0.35,r_*0.28,r_*0.22,r_*0.12,'#7f1d1d'):'');
  if(p.type==='craters'){s+=C(0,0,r_,p.c);CR4.forEach(([dx,dy,rr],i)=>{if(p.cr[i])s+=C(dx*r_,dy*r_,rr*r_,'#00000066');});}
  if(p.type==='ice'){s+=C(0,0,r_,'#bae6fd')+(p.sea?E(r_*0.35,-r_*0.45,r_*0.3,r_*0.17,'#38bdf8'):'');CRK.forEach(([a,b,c,d],i)=>{if(p.ck[i])s+=L(a*r_,b*r_,c*r_,d*r_,'#0ea5e9',0.5);});}
  if(p.type==='moons'){const rx=r_*1.85,ry=r_*0.5;s+=arcH(rx,ry,0,'#64748b',0.35)+C(0,0,r_,p.c)+E(0,-r_*0.3,r_*0.9,r_*0.12,'#00000030')+arcH(rx,ry,1,'#64748b',0.35);
    MSL.forEach(([dx,dy],i)=>{if(p.mo[i])s+=C(dx*r_,dy*r_,1.4,p.mc[i]);});}
  return s;},
 muts:(p,r)=>{const r_=p.r,m=[],sb=(x,y,w,h)=>[x*r_,y*r_,w*r_,h*r_];
  if(p.type==='ringed'){m.push({t:'color',p2:{...p,band:near(p.band)},b:sb(-0.9,-0.55,1.8,0.4)},{...tog(p,'line',sb(-1.8,-0.9,3.6,1.8)),easy:false},tog(p,'moonlet',[r_*1.6-2,-r_*1.25-2,4,4]),{t:'color',p2:{...p,ring:near(p.ring)},b:sb(-1.8,-0.9,3.6,1.8),easy:false});}
  if(p.type==='earth'){const k=r_/9;m.push(tog(p,'c2',[0.5*k,1.5*k,7*k,6*k]),tog(p,'cloud',[-0.8*k,-6.3*k,7.6*k,2.6*k]),tog(p,'cap',[-4.8*k,-9.3*k,9.6*k,2.5*k]));}
  if(p.type==='banded'){const i=ri(r,0,1),st=p.st.slice();st[i]=near(st[i]);m.push({t:'color',p2:{...p,st},b:i?sb(-0.97,-0.12,1.94,0.34):sb(-0.82,-0.66,1.64,0.32)},{...tog(p,'st3',sb(-0.8,0.4,1.6,0.3)),easy:false},tog(p,'spot',sb(0.1,0.13,0.5,0.3)));}
  if(p.type==='craters'){const on=p.cr.map((c,i)=>c?i:-1).filter(i=>i>=0),off=p.cr.map((c,i)=>c?-1:i).filter(i=>i>=0),cb=i=>{const[dx,dy,rr]=CR4[i];return[(dx-rr)*r_-0.6,(dy-rr)*r_-0.6,2*rr*r_+1.2,2*rr*r_+1.2];};
    if(on.length>=3){const i=pk(r,on),cr=p.cr.slice();cr[i]=false;m.push({t:'remove',p2:{...p,cr},b:cb(i)});}if(off.length){const i=pk(r,off),cr=p.cr.slice();cr[i]=true;m.push({t:'add',p2:{...p,cr},b:cb(i)});}
    m.push({t:'color',p2:{...p,c:near(p.c)},b:sb(-1,-1,2,2)});}
  if(p.type==='ice'){const i=ri(r,0,2),ck=p.ck.slice();ck[i]=!ck[i];const[a,b,c,d]=CRK[i];m.push({t:p.ck[i]?'remove':'add',p2:{...p,ck},b:[Math.min(a,c)*r_-1,Math.min(b,d)*r_-1,Math.abs(c-a)*r_+2,Math.abs(d-b)*r_+2]},tog(p,'sea',sb(0.02,-0.65,0.66,0.4)));}
  if(p.type==='moons'){const mb=i=>[MSL[i][0]*r_-2,MSL[i][1]*r_-2,4,4],on=p.mo.map((o,i)=>o?i:-1).filter(i=>i>=0),off=p.mo.findIndex(o=>!o);
    if(off>=0){const fr=pk(r,on.filter(i=>Math.abs(i-off)===1));if(fr!==undefined){const mo=p.mo.slice(),mc=p.mc.slice();mo[off]=true;mo[fr]=false;mc[off]=mc[fr];m.push({t:'move',p2:{...p,mo,mc},b:U(mb(fr),mb(off))});}
      const mo=p.mo.slice();mo[off]=true;m.push({t:'add',p2:{...p,mo},b:mb(off)});}
    else{const i=pk(r,[0,2]),mo=p.mo.slice();mo[i]=false;m.push({t:'remove',p2:{...p,mo},b:mb(i)});}
    const i=pk(r,on),mc=p.mc.slice();mc[i]=near(mc[i]);m.push({t:'color',p2:{...p,mc},b:mb(i)});}
  return m;}};
K.planet=placed(PLANET);
K.bigp=placed({box:()=>[-15,-15,30,30],
 draw:p=>p.type==='giant'?C(0,0,15,'#c2410c')+E(0,-6,14,2,'#fb923c')+E(0,1,15,2,'#fdba74')+(p.st?E(0,8,12,1.6,'#fb923c'):'')+(p.spot?E(-6,3,3,1.8,'#7f1d1d'):'')
  :C(0,0,15,'#b91c1c')+(p.cap?Pa('M-9 -11 a14 14 0 0 1 18 0 q-9 3 -18 0 Z','#f1f5f9'):'')+[[-6,-2,2],[4,4,1.6],[-2,8,1.3]].map(([x,y,rr],i)=>p.cr[i]?C(x,y,rr,'#450a0a'):'').join(''),
 muts:(p,r)=>p.type==='giant'?[tog(p,'spot',[-9.5,0.7,7,4.6]),{...tog(p,'st',[-12,6,24,4]),easy:false}]
  :[tog(p,'cap',[-10,-14,20,5]),...[[-6,-2,2],[4,4,1.6],[-2,8,1.3]].map(([x,y,rr],i)=>{const cr=p.cr.slice();cr[i]=!cr[i];return{t:p.cr[i]?'remove':'add',p2:{...p,cr},b:[x-rr-1,y-rr-1,rr*2+2,rr*2+2]};}).filter((_,i)=>p.cr.filter(Boolean).length>=2||!p.cr[i])]});
K.smoon=placed({box:()=>[-4.5,-8.8,9,13.3],
 draw:p=>C(0,0,4,'#cbd5e1')+CRATERS.map(([dx,dy,rr],i)=>p.cr[i]?C(dx,dy,rr,'#94a3b8'):'').join('')+(p.flag?L(1.5,-3.5,1.5,-8,'#e5e7eb',0.4)+R(1.5,-8,2.8,1.8,p.fc):''),
 muts:(p,r)=>{const m=[tog(p,'flag',[0.5,-8.5,4.5,5.5])];if(p.flag)m.push({t:'color',p2:{...p,fc:near(p.fc)},b:[0.8,-8.6,4,3]});
  const on=CRATERS.map((c,i)=>i).filter(i=>p.cr[i]);if(on.length>=3){const i=pk(r,on),[dx,dy]=CRATERS[i],cr=p.cr.slice();cr[i]=false;m.push({t:'remove',p2:{...p,cr},b:[dx-1.5,dy-1.5,3,3]});}return m;}});
/* satellite: blue panels, 2 or 3 cells per wing, dish on one side (so a flip shows) */
const wing=(x0,n,dir)=>Array.from({length:n},(_,i)=>{const x=dir>0?x0+i*4.4:x0-(i+1)*4.4;return R(x,-2,4.4,4,'#1d4ed8')+R(x,-2,4.4,4,'none','stroke="#93c5fd" stroke-width="0.3"');}).join('');
K.sat=placed({box:()=>[-17.2,-7,34.4,10],
 draw:p=>L(-4,0,-3,0,'#94a3b8',0.6)+L(3,0,4,0,'#94a3b8',0.6)+wing(-4,p.n,-1)+wing(4,p.n,1)+R(-3,-3,6,6,'#cbd5e1')+(p.dish?Pa('M0 -3 a2.5 2.5 0 0 1 4 -3 Z','#94a3b8')+L(2,-4.5,2.6,-6.6,'#94a3b8',0.3):''),
 muts:p=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[-4-3*4.4-0.4,-2.4,8+6*4.4+0.8,4.8]},tog(p,'dish',[-0.4,-7,5.2,4.4]),...(p.dish?[{t:'flip',p2:{...p,m:-(p.m||1)},b:[-4-p.n*4.4,-7,8+2*p.n*4.4,10]}]:[])]});
K.rocket=placed({box:()=>[-8.5,-16.5,17,38],
 draw:p=>Pg('-4,12 4,12 4,-6 0,-16 -4,-6','#f1f5f9')+(p.band?R(-4,5,8,1.6,p.bc):'')+C(0,-4,1.6,'#38bdf8')+(p.w2?C(0,1.2,1.6,'#38bdf8'):'')+Pg('-4,4 -8,14 -4,12',p.fin)+Pg('4,4 8,14 4,12',p.fin)+(p.fl==='mix'?Pg('-3,12 3,12 0,21','#ef4444')+Pg('-1.6,12 1.6,12 0,17.5','#facc15'):Pg('-3,12 3,12 0,21',p.fl)),
 muts:(p,r)=>[tog(p,'w2',[-2,-0.8,4,4]),{t:'color',p2:{...p,fin:near(p.fin)},b:[-8.5,3.5,17,11]},tog(p,'band',[-4.5,4.5,9,2.6]),{t:'color',p2:{...p,fl:p.fl==='mix'?pk(r,['#facc15','#ef4444']):'mix'},b:[-3.5,11.5,7,10]}]});
K.astro=placed({box:()=>[-6,-10,12,20],
 draw:p=>R(-4,-4,8,9,p.pack,'rx="1"')+R(-3.2,-3,6.4,8,'#f1f5f9','rx="1.5"')+R(-3,4.5,2.6,5,'#f1f5f9','rx="1"')+R(0.4,4.5,2.6,5,'#f1f5f9','rx="1"')+R(-5.5,-2.5,2.4,6,'#f1f5f9','rx="1"')+(p.up?R(3.3,-8.4,2.4,6,'#f1f5f9','rx="1"'):R(3.1,-2.5,2.4,6,'#f1f5f9','rx="1"'))
  +(p.patch?R(-5.4,-1.5,2.2,1.6,p.pc):'')+C(0,-6,3.6,'#f1f5f9')+E(0,-6,2.6,2,p.visor),
 muts:p=>[{t:'color',p2:{...p,visor:near(p.visor)},b:[-3.5,-8.5,7,5]},tog(p,'patch',[-5.8,-2,3,2.6]),{t:'move',p2:{...p,up:!p.up},b:[2.8,-8.9,3.4,13]},{t:'color',p2:{...p,pack:p.pack==='#ef4444'?'#2563eb':'#ef4444'},b:[-4.4,-4.4,8.8,9.8]},{t:'color',p2:{...p,pc:near(p.pc)},b:[-5.8,-2,3,2.6]}].filter(m=>m.t!=='color'||m.b[0]>-5||p.patch)});
K.ufo=placed({box:()=>[-9.5,-6,19,22.5],
 draw:p=>C(0,-1.5,1.6,'#4ade80')+C(-0.6,-1.8,0.35,'#111')+C(0.6,-1.8,0.35,'#111')+(p.ant?L(-0.8,-2.8,-1.6,-5,'#4ade80',0.3)+C(-1.6,-5,0.4,'#4ade80')+L(0.8,-2.8,1.6,-5,'#4ade80',0.3)+C(1.6,-5,0.4,'#4ade80'):'')
  +Pa('M-5 1 a5 4.5 0 0 1 10 0 Z','#a7f3d0','opacity=".5"')+E(0,2,9,2.4,'#94a3b8')+[-6,0,6].map((x,i)=>C(x,i===1?3.2:2.5,0.8,p.lc[i])).join('')+(p.beam?Pg('-4,4.4 4,4.4 8,16 -8,16','#fef9c3','opacity=".3"'):''),
 muts:(p,r)=>{const i=ri(r,0,2),lc=p.lc.slice();lc[i]=near(lc[i]);return[tog(p,'ant',[-2.3,-5.8,4.6,3.4]),{t:'color',p2:{...p,lc},b:[[-7.5,-1.5,4.5][i],1,3,3.4]},tog(p,'beam',[-8.5,4.2,17,12.3])];}});
K.comet=placed({box:()=>[-16.5,-6.8,19,9],
 draw:p=>Pg('0.4,-1.7 -16,-6.2 -0.6,1.5','#bae6fd','opacity=".5"')+C(0,0,1.8,'#e0f2fe'),
 muts:()=>[]});
K.comet.muts=p=>[{t:'remove',p2:{...p,on:false},b:K.comet.box(p)}];
const AST=[[-10,0,2],[-3.5,-1.5,1.4],[3,1,2.4],[9.5,-0.5,1.3]];
K.ast=placed({box:()=>[-12.5,-4,24,7.5],draw:p=>AST.map(([x,y,rr],i)=>(i===0&&!p.l)||(i===3&&!p.r)?'':C(x,y,rr,'#78716c')).join(''),
 muts:p=>[tog(p,'l',[-12.5,-2.5,5,5]),tog(p,'r',[7.7,-2.3,3.6,3.6])]});
function spaceLayout(r){const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g}),boxes=[];
  add('raw',{s:R(0,0,120,90,'#05070f')},-10);
  const clip=b=>{const x=Math.max(0,b[0]),y=Math.max(0,b[1]);return[x,y,Math.min(120,b[0]+b[2])-x,Math.min(90,b[1]+b[3])-y];};
  const fits=b=>b[0]>=1&&b[1]>=1&&b[0]+b[2]<=119&&b[1]+b[3]<=89&&!boxes.some(o=>b[0]<o[0]+o[2]+4&&o[0]<b[0]+b[2]+4&&b[1]<o[1]+o[3]+4&&o[1]<b[1]+b[3]+4);
  const corner=pk(r,[[106,78,1],[14,78,-1],[106,12,1],[14,12,-1]]);const bt=r()<0.5?'giant':'mars';
  const big={x:corner[0],y:corner[1],m:corner[2],a:corner[1]<45&&bt==='mars'?180:0,type:bt,spot:r()<0.7,st:r()<0.7,cap:r()<0.6,cr:[true,r()<0.7,true]};add('bigp',big,1);boxes.push(clip(K.bigp.box(big)));
  const place=(kind,p,need)=>{for(let t=0;t<300;t++){p.x=+(3+r()*114).toFixed(1);p.y=+(3+r()*84).toFixed(1);const b=K[kind].box(p);if(fits(b)){boxes.push(b);add(kind,p,1);return true;}}return!need;};
  const pts=shuf(r,['ringed','earth','banded','craters','ice','moons']).slice(0,2);
  for(const type of pts)if(!place('planet',{type,r:ri(r,7,9),c:type==='craters'?pk(r,['#a8a29e','#b45309']):type==='moons'?pk(r,['#7c3aed','#0d9488','#f59e0b']):pk(r,['#f59e0b','#a78bfa','#38bdf8']),band:pk(r,['#fde68a','#7c2d12']),ring:pk(r,['#fde68a','#cbd5e1']),line:r()<0.6,moonlet:r()<0.6,
    c2:r()<0.7,cloud:r()<0.6,cap:r()<0.5,sea:r()<0.5,st:[pk(r,['#fde68a','#7c2d12']),pk(r,['#f1f5f9','#c2410c']),pk(r,['#fde68a','#9a3412'])],st3:r()<0.7,spot:r()<0.6,cr:CR4.map(()=>r()<0.75),ck:CRK.map(()=>r()<0.7),
    mo:pk(r,[[true,true,false],[false,true,true],[true,false,true],[true,true,true]]),mc:mixC(r,[0,1,2],['#cbd5e1','#fde68a','#fdba74'])},true))return null;
  if(!place('sat',{a:ri(r,-20,20),n:ri(r,2,3),dish:r()<0.7,m:r()<0.5?1:-1},true))return null;
  if(!place('rocket',{a:ri(r,-40,40),fin:pk(r,['#ef4444','#2563eb','#facc15']),w2:r()<0.7,band:r()<0.5,bc:pk(r,['#ef4444','#2563eb']),fl:'mix'},true))return null;
  if(!place('astro',{a:ri(r,-40,40),m:r()<0.5?1:-1,visor:pk(r,['#38bdf8','#fde68a']),patch:r()<0.7,pc:pk(r,['#ef4444','#2563eb']),pack:pk(r,['#ef4444','#2563eb']),up:r()<0.4},true))return null;
  if(!place('ufo',{a:ri(r,-10,10),ant:r()<0.6,beam:r()<0.5,lc:mixC(r,[0,1,2],['#facc15','#ef4444','#38bdf8','#4ade80'])},true))return null;
  if(!place('smoon',{cr:CRATERS.map((_,i)=>i<3||r()<0.5),flag:r()<0.7,fc:pk(r,['#ef4444','#2563eb'])},true))return null;
  if(r()<0.75)place('comet',{a:ri(r,-30,30),m:r()<0.5?1:-1,on:true},false);
  place('ast',{a:ri(r,-30,30),l:r()<0.8,r:r()<0.8},false);
  /* 12 stars, one group: most small sparkles, 3-5 larger eight-point stars; only the larger ones can change colour */
  {const sp=freeSpots(r,12,[2,2,116,86],boxes,3,11),nb=ri(r,3,5),big=new Set(shuf(r,sp.map((_,k)=>k)).slice(0,nb));
   sp.forEach(([x,y],k)=>add('star',{x:+x.toFixed(1),y:+y.toFixed(1),on:r()<0.85,s:big.has(k)?1.9:1.1,big:big.has(k),c:pk(r,['#fde68a','#e2e8f0'])},0,'star'));}
  return items;}
gadd('Space','everything placed at random, small and large stars, 2 of 6 planet types, a big planet in a corner',r=>{for(let t=0;t<40;t++){const it=spaceLayout(r);if(it)return it;}throw new Error('space layout failed');});

/* ================= KITCHEN v3 ================= */
K.kwin={draw:p=>R(70,8,20,16,'#7dd3fc')+(p.cloud?cloud(75,13,0.5,'#f1f5f9'):'')+(p.grid?L(80,8,80,24,'#d6c9b1',0.8)+L(70,16,90,16,'#d6c9b1',0.8):''),
 muts:p=>[tog(p,'cloud',[70.5,9.5,9.5,5.7]),{...tog(p,'grid',[70,8,20,16]),easy:false}]};
const plateB=(x,i)=>[x+1.5,13.4-i*1.2,9,1.6];
K.cup={draw:p=>{const x=p.x;if(!p.open)return R(x,5,18,20,'#efe6d4','rx="0.8"')+(p.knob?C(x+9.5,23,0.9,'#78350f'):'');
  let s=R(x,5,18,20,'#5b4636')+R(x,15,18,0.8,'#78350f');
  if(p.ct==='few'){for(let i=0;i<p.ng;i++)s+=R(x+2.5+i*4,11.2,2.6,3.6,'#bae6fd','opacity=".85"')+R(x+2.5+i*4,11.2,2.6,0.5,'#f1f5f9');s+=R(x+10.5,19.8,5.5,5.2,p.tin,'rx="0.6"')+R(x+10.3,19,5.9,1,'#64748b')+R(x+11.5,21.4,3.5,1.8,'#f1f5f9');}
  if(p.ct==='full'){for(let i=0;i<p.pl;i++)s+=R(x+2,13.6-i*1.2,8,1,'#f1f5f9','rx="0.4"');s+=Pa(`M${x+12} 22.6 h5 a2.5 2 0 0 1 -5 0 Z`,p.bowl);}
  if(p.ct==='full')s+=R(x+11.5,11,2.6,3.6,p.cups[0])+R(x+14.8,11,2.6,3.6,p.cups[1])+R(x+2,19,4,6,p.jc,'rx="0.6"')+R(x+2,18.2,4,1,'#64748b')+(p.label?R(x+2.6,21,2.8,2,'#f1f5f9'):'')+(p.glass?R(x+8,20,2.5,5,'#bae6fd','opacity=".8"'):'');
  return s+Pg(`${x},5 ${x-2},3.5 ${x-2},26.5 ${x},25`,'#efe6d4');},
 muts:(p,r)=>{const x=p.x,whole=[x-2,3,20,24];if(!p.open)return[tog(p,'knob',[x+8,21.5,3,3]),{t:'open',p2:{...p,open:true,ct:'empty'},b:whole,easy:true}];
  if(p.ct==='empty')return[{t:'open',p2:{...p,open:false},b:whole,easy:true}];
  if(p.ct==='few')return[{t:p.ng===3?'remove':'add',p2:{...p,ng:p.ng===3?2:3},b:[x+10.1,10.7,3.4,4.6]},{t:'color',p2:{...p,tin:pkC(r,['#dc2626','#2563eb','#16a34a','#facc15'],p.tin)},b:[x+9.8,18.5,6.9,7]}];
  const m=[];if(p.pl>2&&r()<0.5)m.push({t:'remove',p2:{...p,pl:p.pl-1},b:plateB(x,p.pl-1)});else if(p.pl<4)m.push({t:'add',p2:{...p,pl:p.pl+1},b:plateB(x,p.pl)});else m.push({t:'remove',p2:{...p,pl:p.pl-1},b:plateB(x,p.pl-1)});
  m.push({t:'color',p2:{...p,bowl:other(r,p.bowl,['#0ea5e9','#dc2626','#facc15','#16a34a'])},b:[x+11.5,22,6,3]});
  if(p.ct==='full'){const i=ri(r,0,1),cups=p.cups.slice();cups[i]=other(r,cups[i],['#38bdf8','#f472b6','#facc15','#16a34a','#1f2937']);
    m.push({t:'color',p2:{...p,cups},b:[x+11.2+i*3.3,10.6,3.2,4.4]},tog(p,'label',[x+2,20.5,4,3]),tog(p,'glass',[x+7.5,19.5,3.5,6]));
    if(cvdDist(p.cups[0],p.cups[1])>=CVD_MIN)m.push({t:'move',p2:{...p,cups:[p.cups[1],p.cups[0]]},b:[x+11.2,10.6,6.5,4.4]});}
  return m;}};
const potPlant=(cx,top,w,h,pot,pt,n)=>R(cx-w/2,top,w,h,pot)+(pt==='cactus'?R(cx-1.2,top-6.5,2.4,6.5,'#15803d','rx="1.2"')+R(cx+1,top-4.2,2.2,1,'#15803d')+R(cx+2.2,top-5.8,1,2.6,'#15803d','rx="0.5"')
  :E(cx-1.5,top-3,1.2,3,'#16a34a')+(n>2?E(cx+1.5,top-3,1.2,3,'#22c55e'):'')+E(cx,top-4.4,1.2,3.4,'#4ade80'));
const plantMuts=(p,r,cx,top,w,h,potKey)=>{const m=[{t:'color',p2:{...p,[potKey]:other(r,p[potKey],['#b45309','#2563eb','#f1f5f9','#dc2626'])},b:[cx-w/2-0.5,top-0.5,w+1,h+1]},
  {t:'replace',p2:{...p,pt:p.pt==='cactus'?'leafy':'cactus',n:3},b:[cx-3,top-8.2,6.5,8.4]}];
  if(p.pt!=='cactus')m.push({t:p.n>2?'remove':'add',p2:{...p,n:p.n>2?2:3},b:[cx+0.1,top-6.2,2.8,6.4]});return m;};
K.sill={draw:p=>{if(p.v==='plant')return potPlant(86.5,22,5,4,p.pot,p.pt,p.n);if(p.v==='flower')return R(84,22,5,4,p.pot)+L(86.5,22,86.5,19,'#16a34a',0.5)+C(86.5,18.5,1.5,p.c);
  if(p.v==='cat')return cat(85.5,24.2,p.c);return'';},
 muts:(p,r)=>{const b=[82.5,14.5,8,12];if(p.v==='flower')return[{t:'color',p2:{...p,c:other(r,p.c,['#f472b6','#facc15','#ef4444','#a78bfa','#f1f5f9'])},b:[84.5,16.5,4,4]},{t:'remove',p2:{...p,v:'none'},b}];
  if(p.v==='plant')return[...plantMuts(p,r,86.5,22,5,4,'pot'),{t:'remove',p2:{...p,v:'none'},b}];
  if(p.v==='cat')return[{t:'color',p2:{...p,c:other(r,p.c,['#f97316','#f1f5f9','#94a3b8','#111'])},b:[81.5,19,8.5,6]}];return[{t:'add',p2:{...p,v:'plant',pt:'leafy',n:3},b}];}};
K.wall={draw:p=>{if(p.v==='clock')return C(105,14,6,'#f1f5f9')+C(105,14,6,'none','stroke="#a16207" stroke-width="0.9"')+L(105,14,105,10.5,'#111',0.8)+L(105,14,p.h?101.5:108.5,15,'#111',0.6);
  if(p.v==='cal')return R(99.5,8,11,12,'#f1f5f9')+R(99.5,8,11,3,p.c)+(p.st?R(101.5,9,7,1,'#f1f5f9'):'')+T(105,18,5,'#1f2937',p.n);
  return R(99,8,12,10,'#d4a65a')+R(100.5,9.5,9,7,'#93c5fd')+Pa('M100.5 16.5 l3 -3 l2 2 l2 -2 l2 3 Z','#15803d')+C(p.h?108:102.5,11.5,1,'#fbbf24');},
 muts:(p,r)=>p.v==='clock'?[{t:'move',p2:{...p,h:!p.h},b:[98.5,7.5,13,13]}]:p.v==='cal'?[{t:'text',p2:{...p,n:digitTweak(r,p.n,v=>+v>=1&&+v<=31)},b:[100,11,10,8.5]},{...tog(p,'st',[101,8.5,8,2])},{t:'color',p2:{...p,c:p.c==='#dc2626'?'#2563eb':'#dc2626'},b:[99,7.5,12,4]}]
  :[{t:'move',p2:{...p,h:!p.h},b:[100,9,10,8]}]};
const TX=[12,20,28];
K.tools={draw:p=>G('translate(0,-1.5)',p.v.map((v,i)=>p.on[i]?TOOLS[v](TX[i]):'').join('')),
 muts:(p,r)=>{const bx=i=>[TX[i]-2.5,30,5,14.5],m=[],on=[0,1,2].filter(i=>p.on[i]);
  if(on.length===3){const i=ri(r,0,2),o=p.on.slice();o[i]=false;m.push({t:'remove',p2:{...p,on:o},b:bx(i)});}else{const i=p.on.indexOf(false),o=p.on.slice();o[i]=true;m.push({t:'add',p2:{...p,on:o},b:bx(i)});}
  const i=pk(r,on),spare=Object.keys(TOOLS).filter(t=>!p.v.includes(t));m.push({t:'replace',p2:{...p,v:p.v.map((v,k)=>k===i?pk(r,spare):v)},b:bx(i)});
  const js=[0,1].filter(k=>p.on[k]&&p.on[k+1]&&p.v[k]!==p.v[k+1]);if(js.length){const j=pk(r,js),v=p.v.slice();[v[j],v[j+1]]=[v[j+1],v[j]];m.push({t:'move',p2:{...p,v},b:U(bx(j),bx(j+1))});}
  return m;}};
K.counter={draw:p=>{const x=p.x;
  if(p.v==='kettle')return flip(x,Pa(`M${x-6} 58 v-5 a6 6 0 0 1 12 0 v5 Z`,p.c)+`<path d="M${x-4} 47.5 q4 -4 8 0" stroke="#111" stroke-width="0.8" fill="none"/>`+Pg(`${x+6},53 ${x+10},49 ${x+10.6},49.6 ${x+6},56`,p.c),p.f);
  if(p.v==='jars')return[-5,-0.5,4].map((dx,i)=>R(x+dx,52.5,3.6,5.5,'#e7dcc8','rx="0.6"')+R(x+dx,51.6,3.6,1.2,p.lids[i])).join('');
  if(p.v==='plant')return potPlant(x,53,6,5,p.c,p.pt,p.n);
  if(p.v==='toaster')return(p.toast?R(x-2.5,48,5,3.2,'#d6a35a','rx="0.6"'):'')+R(x-5,51,10,7,p.c,'rx="1.5"')+R(x-3,51,6,0.6,'#111')+R(x+5,54,1,2,'#334155');
  if(p.v==='mugs')return p.cs.map((c,i)=>R(x-5+i*6,54.5,3.6,3.5,c,'rx="0.4"')+`<path d="M${x-1.4+i*6} 55.3 a1.2 1.2 0 0 1 0 2" stroke="${c}" stroke-width="0.6" fill="none"/>`).join('');
  if(p.v==='fruit')return C(x-4,52.5,2.2,p.ac)+C(x+0.5,52,2.3,'#f97316')+(p.ban?`<path d="M${x-2} 50 q5 3 9 -1" stroke="#facc15" stroke-width="1.6" fill="none" stroke-linecap="round"/>`:'')+C(x+4,52.5,0.9,'#7c3aed')+C(x+5.5,53.2,0.9,'#7c3aed')+Pa(`M${x-7} 54 h14 q-1 4 -7 4 q-6 0 -7 -4 Z`,'#f1f5f9');
  if(p.v==='bread')return R(x-6,56.6,12,1.4,'#a16207')+Pa(`M${x-5} 56.6 v-3 a4 3 0 0 1 8 0 v3 Z`,'#d6a35a')+Array.from({length:p.n},(_,i)=>Pa(`M${x+3.7+i*1.9} 56.6 v-2.4 a0.85 0.85 0 0 1 1.7 0 v2.4 Z`,'#f3dfb0','stroke="#a16207" stroke-width="0.35"')).join('');
  if(p.v==='board')return R(x-6,56.6,12,1.4,'#a16207')+(p.car?Pg(`${x-5},56 ${x-1},55.2 ${x-1},56.4`,'#f97316'):'')+(p.knife?R(x-2,55.6,6,0.8,'#cbd5e1')+R(x+4,55.4,3,1.2,'#111'):'');return'';},
 muts:(p,r)=>{const x=p.x;if(p.v==='kettle')return[{t:'flip',p2:{...p,f:!p.f},b:[x-10.6,45,21.2,13]},{t:'color',p2:{...p,c:other(r,p.c,['#ef4444','#2563eb','#f1f5f9','#16a34a'])},b:[x-10.6,45,21.2,13]}];
  if(p.v==='jars'){const jb=i=>[x+[-5,-0.5,4][i]-0.4,51.2,4.4,2];const i=ri(r,0,2),lids=p.lids.slice();lids[i]=other(r,lids[i],JARC);const m=[{t:'color',p2:{...p,lids},b:jb(i)}];
    const js=[0,1].filter(j=>cvdDist(p.lids[j],p.lids[j+1])>=CVD_MIN);if(js.length){const j=pk(r,js),l2=p.lids.slice();[l2[j],l2[j+1]]=[l2[j+1],l2[j]];m.push({t:'move',p2:{...p,lids:l2},b:U(jb(j),jb(j+1))});}return m;}
  if(p.v==='plant')return plantMuts(p,r,x,53,6,5,'c');
  if(p.v==='toaster')return[tog(p,'toast',[x-3,47.5,6,4]),{t:'color',p2:{...p,c:other(r,p.c,['#94a3b8','#dc2626','#2563eb','#facc15'])},b:[x-5.5,50.5,12,8]}];
  if(p.v==='mugs'){const i=ri(r,0,1),cs=p.cs.slice();cs[i]=other(r,cs[i],['#3b82f6','#facc15','#ef4444','#f1f5f9','#16a34a']);return[{t:'color',p2:{...p,cs},b:[x-5.5+i*6,54,5,4.5]},...(cvdDist(p.cs[0],p.cs[1])>=CVD_MIN?[{t:'move',p2:{...p,cs:[p.cs[1],p.cs[0]]},b:[x-5.5,54,11,4.5]}]:[])];}
  if(p.v==='fruit')return[{t:'color',p2:{...p,ac:p.ac==='#ef4444'?'#84cc16':'#ef4444'},b:[x-6.5,50,5,5]},tog(p,'ban',[x-3,47.5,11,4])];
  if(p.v==='bread')return p.n>1?[{t:'remove',p2:{...p,n:p.n-1},b:[x+3.3+(p.n-1)*1.9,52.9,2.5,4.1]}]:[{t:'add',p2:{...p,n:2},b:[x+5.2,52.9,2.5,4.1]}];
  if(p.v==='board')return[tog(p,'knife',[x-2.5,54.5,10,2.5]),tog(p,'car',[x-5.5,54.7,5,2.2])];return[];}};
const FOOD={egg:E(56,56,2,0.8,'#f1f5f9')+C(56,56,0.7,'#facc15'),pancake:E(56,56,3,0.9,'#d6a35a')+E(55.4,55.8,1,0.3,'#b45309'),sausage:R(53.4,55.2,2.8,1.1,'#9a3412','rx="0.55"')+R(56.6,55.5,2.8,1.1,'#9a3412','rx="0.55"')};
K.stove={draw:p=>R(39,50,10,8,'#94a3b8','rx="1"')+R(37.5,52,1.5,1,'#64748b')+R(49,52,1.5,1,'#64748b')+(p.lidOn?E(44,50,5.5,1,p.lid)+C(44,49,0.8,'#334155'):E(44,50,5,0.9,'#1e293b'))
  +(p.steam?`<path d="M42 47 q-1.5 -2 0 -4 q1.5 -2 0 -4 M46 47 q-1.5 -2 0 -4 q1.5 -2 0 -4" stroke="#e2e8f0" stroke-width="0.6" fill="none"/>`:'')+E(56,56.5,5,1.4,'#1f2937')+L(61,56.5,66,55,'#1f2937',1)+(FOOD[p.food]||''),
 muts:(p,r)=>{const fb=[52.6,54.2,7.4,3.2],m=[tog(p,'steam',[40,38,8,10]),{t:p.lidOn?'remove':'add',p2:{...p,lidOn:!p.lidOn},b:[38,47.6,12,3.6]}];
  if(p.lidOn)m.push({t:'color',p2:{...p,lid:p.lid==='#64748b'?'#dc2626':'#64748b'},b:[38,48,12,3.5]});
  if(p.food==='none')m.push({t:'add',p2:{...p,food:pk(r,Object.keys(FOOD))},b:fb});else m.push({t:'replace',p2:{...p,food:pk(r,Object.keys(FOOD).filter(f=>f!==p.food))},b:fb},{t:'remove',p2:{...p,food:'none'},b:fb});
  return m;}};
K.lower={draw:p=>{const{x,w}=p;if(!p.open)return R(x,64,w,24,'#efe6d4','rx="0.6"')+R(x+(p.hr?w-2.5:1.5),72,1,6,'#78350f');
  let s=R(x,64,w,24,'#5b4636')+R(x,76,w,0.8,'#78350f')+R(x+2,70,7,6,'#94a3b8','rx="0.8"')+R(x+2,69.6,7,0.8,'#64748b')+(p.knob?C(x+5.5,69,0.9,'#d6d3d1'):'')+R(x+w-4.5,68,2.5,8,p.bc,'rx="0.6"')+R(x+w-3.9,67,1.3,1.2,'#334155')+R(x+2,83,4,2.5,'#facc15')+R(x+2,85.5,4,0.6,'#16a34a');
  if(p.spray)s+=R(x+w-6,80,3,8,'#38bdf8','rx="0.6"')+R(x+w-5.5,78.3,2,1.8,'#f1f5f9');
  return s+(p.hr?Pg(`${x+w},64 ${x+w+4},62 ${x+w+4},90 ${x+w},88`,'#efe6d4'):Pg(`${x},64 ${x-4},62 ${x-4},90 ${x},88`,'#efe6d4'));},
 muts:(p,r)=>{const{x,w}=p;if(!p.open)return[{t:'move',p2:{...p,hr:!p.hr},b:[x+0.5,71.5,w-1,6.8]}];
  return[tog(p,'knob',[x+4,67.5,3,3]),{t:'color',p2:{...p,bc:other(r,p.bc,['#16a34a','#f59e0b','#2563eb','#dc2626'])},b:[x+w-5,66.5,3.5,10]},tog(p,'spray',[x+w-6.5,77.8,4,11])];}};
/* floor item in front of the fridge: a pedal bin or a bucket, same color either way */
K.floor={draw:p=>{if(p.v==='none')return'';const x=p.at==='left'?9.5:108;if(p.v==='bin')return flip(x,R(x-4.5,80,9,10,p.c,'rx="1"')+R(x-5,78.8,10,1.6,'#475569','rx="0.5"')+R(x-3.5,88.6,3,1.2,'#334155'),p.f);
  return flip(x,Pg(`${x-4.5},81 ${x+4.5},81 ${x+3.5},90 ${x-3.5},90`,p.c)+`<path d="M${x-4.5} 81 Q${x} 76 ${x+4.5} 81" stroke="#475569" stroke-width="0.6" fill="none"/>`+Pg(`${x+4.5},81 ${x+6.5},79.8 ${x+4.2},83.2`,p.c),p.f);},
 muts:(p,r)=>{const x=p.at==='left'?9.5:108,b=[x-7,78.4,14,11.6];if(p.v==='none')return[{t:'add',p2:{...p,v:pk(r,['bin','bucket'])},b}];
  return[{t:'color',p2:{...p,c:near(p.c)},b},{t:'flip',p2:{...p,f:!p.f},b},{t:'replace',p2:{...p,v:p.v==='bin'?'bucket':'bin'},b},{t:'remove',p2:{...p,v:'none'},b}];}};
Object.assign(NEARC,{'#2563eb':'#0ea5e9','#16a34a':'#65a30d','#dc2626':'#f97316'});
gadd('Kitchen','two open cupboards (sometimes three), tools, a pan, a bin by the fridge',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  let bg=R(0,0,120,90,'#3f4a5a')+R(4,4,60,22,'#d6c9b1')+R(68,6,24,20,'#d6c9b1')+R(67,26,26,1.6,'#d6c9b1');
  bg+=R(0,30,96,28,'#cbd5e1');let grid='';for(let x=6;x<96;x+=6)grid+=L(x,30,x,58,'#94a3b8',0.3);for(let y=36;y<58;y+=6)grid+=L(0,y,96,y,'#94a3b8',0.3);
  bg+=L(8,30.5,36,30.5,'#64748b',0.8)+R(0,58,96,4,'#a8a29e')+R(0,62,96,28,'#d6c9b1')+R(98,30,20,60,'#e5e7eb','rx="1.5"')+L(98,50,118,50,'#94a3b8',0.5)+R(100,38,1,8,'#94a3b8')+R(100,53,1,10,'#94a3b8');
  add('raw',{s:bg},-10);add('kwin',{cloud:r()<0.7,grid:r()<0.75},-6);add('tile',{i:r()<0.3?ri(r,0,TILES.length-1):-1,c:pk(r,['#f9a8d4','#93c5fd'])},-5);add('raw',{s:grid},-4);
  const order=shuf(r,[0,1,2]),third=r()<0.5;
  [5,25,45].forEach((x,i)=>{const k=order.indexOf(i);add('cup',{x,open:k===0||(third&&k===1),ct:k===0?'full':pk(r,['empty','few']),knob:true,pl:ri(r,2,4),cups:[pk(r,['#38bdf8','#f472b6']),pk(r,['#facc15','#16a34a'])],jc:pk(r,['#fde68a','#fca5a5']),label:r()<0.7,glass:r()<0.7,bowl:pk(r,['#0ea5e9','#dc2626']),ng:ri(r,2,3),tin:pk(r,['#dc2626','#2563eb','#16a34a'])},1);});
  add('sill',{v:pk(r,['plant','flower','cat','none']),pt:pk(r,['leafy','cactus']),n:3,c:pk(r,['#f472b6','#facc15','#f97316','#f1f5f9']),pot:pk(r,['#b45309','#2563eb'])},1);
  add('wall',{v:pk(r,['clock','cal','pic']),h:r()<0.5,c:'#dc2626',st:r()<0.6,n:String(ri(r,1,28))},1);
  add('tools',{v:shuf(r,Object.keys(TOOLS)).slice(0,3),on:(k=>[0,1,2].map(i=>i!==k))(r()<0.6?-1:ri(r,0,2))},1);
  const s1=pk(r,['kettle','jars','plant']),s4=pk(r,['board',s1==='jars'?'board':'jars']);
  [[11,s1],[28,pk(r,['toaster','mugs'])],[74,pk(r,['fruit','bread'])],[88,s4]].forEach(([x,v])=>add('counter',{x,v,pt:pk(r,['leafy','leafy','cactus']),n:r()<0.75?3:2,c:v==='kettle'?pk(r,['#ef4444','#2563eb']):v==='plant'?pk(r,['#b45309','#2563eb']):pk(r,['#94a3b8','#dc2626']),f:r()<0.5,lids:mixC(r,[0,1,2],JARC),toast:r()<0.5,cs:[pk(r,['#3b82f6','#ef4444']),pk(r,['#facc15','#f1f5f9'])],ac:pk(r,['#ef4444','#84cc16']),ban:r()<0.7,n2:0,knife:r()<0.7,car:r()<0.7},2));
  items.forEach(it=>{if(it.kind==='counter'&&it.p.v==='bread')it.p.n=ri(r,1,2);});
  add('stove',{steam:r()<0.7,lidOn:r()<0.8,food:pk(r,['egg','pancake','sausage','egg','none']),lid:'#64748b'},2);
  add('oven',{k:[0,1,2,3].map(()=>r()<0.7?0:Math.PI/2),light:r()<0.3,towel:r()<0.7,tc:pk(r,['#dc2626','#2563eb'])},2);
  const lo=pk(r,[0,3]);[[2,15,false],[19,15,true],[66,13,false],[81,13,true]].forEach(([x,w,hr],i)=>add('lower',{x,w,hr:i===lo?hr:r()<0.5,open:i===lo,knob:true,bc:pk(r,['#16a34a','#f59e0b']),spray:r()<0.7},1));
  MAGS.forEach(([x,y])=>add('magnet',{x,y,on:r()<0.7,v:pk(r,['circle','square','star']),c:pk(r,['#ef4444','#facc15','#2563eb','#16a34a'])},2));
  add('drawing',{h:r()<0.5,hc:pk(r,['#ef4444','#2563eb']),n:ri(r,2,3)},2);
  add('floor',{v:r()<0.3?'none':pk(r,['bin','bucket']),at:lo!==0&&r()<0.45?'left':'fridge',c:pk(r,['#2563eb','#16a34a','#dc2626','#94a3b8']),f:r()<0.5},3);
  return items;});
