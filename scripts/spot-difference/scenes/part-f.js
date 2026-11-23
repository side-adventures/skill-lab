/* ================= FANTASY FOREST (night) ================= */
const FSKY='#1e1b4b';
K.fmoon={draw:p=>C(p.x,p.y,5,'#fef9c3')+C(p.r?p.x+2.5:p.x-2.5,p.y-1.5,4.4,FSKY),muts:p=>[{t:'flip',p2:{...p,r:!p.r},b:[p.x-6,p.y-6,12,12]}]};
const bat=(x,y)=>Pa(`M${x-3.4} ${y-0.6} q1 -1.4 2.2 -0.4 q0.6 -1 1.2 0 q0.6 -1 1.2 0 q1.2 -1 2.2 0.4 q-1.4 0 -1.8 1.4 q-0.8 -0.8 -1.6 0 q-0.8 -0.8 -1.6 0 q-0.4 -1.4 -1.8 -1.4 Z`,'#c4b5fd');
K.bats={draw:p=>[0,1].map(i=>i<p.n?bat(p.x+i*8,p.y-i*4):'').join(''),muts:p=>{const b=i=>[p.x+i*8-3.8,p.y-i*4-2,7.6,3.6];return p.n>0?[{t:'remove',p2:{...p,n:p.n-1},b:b(p.n-1)},...(p.n<2?[{t:'add',p2:{...p,n:2},b:b(1)}]:[])]:[{t:'add',p2:{...p,n:1},b:b(0)}];}};
/* wizard tower: roof color, roof stars (only the end ones go), lit windows, flag, door */
const TWY=[28,38,48];
K.ftower={draw:p=>{let s=R(7,22,16,44,'#6b7280')+[30,38,46,54,62].map(y=>L(7,y,23,y,'#4b5563',0.4)).join('')+Pg('4,22 15,6 26,22',p.rc)
   +(p.s1?star5(10.6,18.4,1.2,'#facc15'):'')+star5(15,14,1.2,'#facc15')+(p.s3?star5(19.4,18.4,1.2,'#facc15'):'');
  TWY.forEach((y,i)=>s+=Pa(`M13 ${y+5} v-3.2 a2 2 0 0 1 4 0 v3.2 Z`,p.w[i]?'#fde68a':'#1f2937'));
  s+=Pa('M12 66 v-6 a3 3 0 0 1 6 0 v6 Z',p.dc);if(p.fl)s+=L(15,6,15,1.4,'#e5e7eb',0.4)+Pg('15,1.4 18.6,2.5 15,3.6',p.fc);return s;},
 muts:(p,r)=>{const i=ri(r,0,2),w=p.w.slice();w[i]=!w[i];return[{t:'light',p2:{...p,w},b:[12.6,TWY[i]-0.6,4.8,6]},{t:'color',p2:{...p,rc:p.rc==='#7c3aed'?'#0f766e':'#7c3aed'},b:[3.5,5.5,23,17]},
  tog(p,'s1',[8.7,16.5,3.8,3.8]),tog(p,'s3',[17.5,16.5,3.8,3.8]),tog(p,'fl',[14.6,0.8,4.4,5.2]),...(p.fl?[{t:'color',p2:{...p,fc:p.fc==='#facc15'?'#f472b6':'#facc15'},b:[14.6,0.8,4.4,3.2]}]:[]),{t:'color',p2:{...p,dc:p.dc==='#7c2d12'?'#166534':'#7c2d12'},b:[11.5,56.5,7,10]}];}};
/* twisted tree with hanging lanterns (end ones come and go) and an owl */
const FLX=[42,46.5,51];
K.ftree={draw:p=>Pa('M33 66 q4 -10 1 -20 q-2 -8 3 -16 l2 1 q-4 8 -1 15 q3 10 -1 20 Z','#3f2a1d')+L(37,32,52,28,'#3f2a1d',1.2)+L(36,40,28,34,'#3f2a1d',0.9)
  +C(37,26,5,'#15803d')+(p.lp?C(31,29,3.4,'#15803d'):'')+C(43,25,3.6,p.rd?'#0f5226':'#2fae5a')
  +FLX.map((x,i)=>(i===0&&!p.l)||(i===2&&!p.r)?'':L(x,32-(x-37)*4/15,x,33,'#94a3b8',0.25)+R(x-1.1,33,2.2,3,p.lc[i],'rx="0.6"')+R(x-1.3,32.6,2.6,0.6,'#1f2937')).join('')
  +(p.owl?C(30.6,33.6,2,'#a16207')+C(29.9,33,0.6,'#fde68a')+C(31.3,33,0.6,'#fde68a')+Pg('30.3,34 30.9,34 30.6,34.7','#f59e0b'):''),
 muts:(p,r)=>{const lb=i=>[FLX[i]-1.8,32.2,3.6,4.4],on=[0,1,2].filter(i=>(i!==0||p.l)&&(i!==2||p.r)),i=pk(r,on),lc=p.lc.slice();lc[i]=pkC(r,['#facc15','#22d3ee','#f472b6','#4ade80'],lc[i]);
  return[tog(p,'l',lb(0)),tog(p,'r',lb(2)),{t:'color',p2:{...p,lc},b:lb(i)},tog(p,'owl',[28.2,31.2,4.8,4.4]),tog(p,'lp',[27.2,25.2,7.6,7.6]),{t:'color',p2:{...p,rd:!p.rd},b:[39,21,8,8]}];}};
/* small dragon on a rock: wings (both or none), fire, color, facing */
const DRW={'#16a34a':'#14532d','#2563eb':'#1e3a8a','#dc2626':'#7f1d1d','#7c3aed':'#4c1d95'};
const dragonD=p=>{const c=p.c;return`<path d="M58 56 q-6 2 -5 -4 q1 -3 3 -1" stroke="${c}" stroke-width="1.4" fill="none"/>`
 +(p.wing?Pa('M60.4 53.4 Q58.4 47.6 59.8 42 L61.9 45.4 L63.9 42.2 L65.6 52.4 Z',DRW[c])+Pa('M62.6 53.6 Q62.2 47 66 42.4 L67 46 L69.8 44.6 L68.8 53.4 Z',DRW[c])+`<path d="M63.2 53 Q63.4 47 66 42.4" stroke="${c}" stroke-width="0.45" fill="none"/>`:'')
 +E(64,55,6,3.4,c)+Pg('67.5,53 70.5,47 72.4,48.2 70,54',c)+E(72.6,48.2,2.6,1.6,c)+Pg('71.4,47 71,44.8 72.4,46.6','#fde68a')+C(73.2,47.6,0.45,'#facc15')
 +R(60,57.4,1.6,2.6,c)+R(66.4,57.4,1.6,2.6,c)+(p.fire?Pg('75,48.6 79.2,47 78.4,48.6 79.6,50.2','#f97316')+Pg('75,48.6 77.8,47.8 77.4,48.6 78.2,49.6','#facc15'):'');};
K.dragon={draw:p=>flip(64,dragonD(p),p.f),
 muts:(p,r)=>{const fb=p.f?[48,46.4,5.4,4.4]:[74.6,46.4,5.4,4.4],body=[51,41.5,26,19];
  return[{t:'flip',p2:{...p,f:!p.f},b:p.fire?[48,41.5,32,19]:body},{t:'color',p2:{...p,c:pkC(r,Object.keys(DRW),p.c)},b:body},tog(p,'wing',[57.8,41.6,12.4,11.4]),tog(p,'fire',fb)];}};
/* mushroom house: dots in a set formation (one may be missing), cap color, lit window, door */
const MD=[[86,42],[93,37],[101,35.6],[109,38.6],[113,44]];
K.mushh={draw:p=>R(90,46,18,18,'#f5e6c8','rx="2"')+Pa('M80 47 a19 15 0 0 1 38 0 Z',p.cc)+MD.map(([x,y],i)=>i===p.miss?'':C(x,y,1.6,'#f8fafc')).join('')
  +Pa('M95.5 64 v-7 a3 3 0 0 1 6 0 v7 Z',p.dc)+C(p.kl?97:100,60.5,0.45,'#fbbf24')+C(104.2,52.4,2,p.lit?'#fde68a':'#1f2937')+C(104.2,52.4,2,'none','stroke="#a16207" stroke-width="0.5"'),
 muts:(p,r)=>{const db=i=>[MD[i][0]-2.2,MD[i][1]-2.2,4.4,4.4],m=[{t:'color',p2:{...p,cc:p.cc==='#dc2626'?'#2563eb':'#dc2626'},b:[80.5,31.5,38,14.2]},{t:'light',p2:{...p,lit:!p.lit},b:[101.6,49.8,5.2,5.2]},{t:'color',p2:{...p,dc:p.dc==='#7c2d12'?'#166534':'#7c2d12'},b:[95,53.5,7,11]},{t:'move',p2:{...p,kl:!p.kl},b:[95.9,59.3,5.2,2.4]}];
  if(p.miss<0){const i=ri(r,0,4);m.push({t:'remove',p2:{...p,miss:i},b:db(i)});}else m.push({t:'add',p2:{...p,miss:-1},b:db(p.miss)});return m;}};
const CRY=[[106,74,2,7],[110,74,2.6,10],[114.2,74,2,6]];
const cry=([x,y,w,h],c)=>Pg(`${x-w},${y} ${x-w},${y-h*0.7} ${x},${y-h} ${x+w},${y-h*0.7} ${x+w},${y}`,c)+Pg(`${x},${y} ${x},${y-h} ${x+w},${y-h*0.7} ${x+w},${y}`,'#ffffff30');
K.crystal={draw:p=>(p.f&&!p.r?G('translate(216.2,0) scale(-1,1)',cry(CRY[0],p.c)+cry(CRY[1],p.c)):cry(CRY[0],p.c)+cry(CRY[1],p.c))+(p.r?cry(CRY[2],p.c):''),
 muts:p=>[...(p.r?[{t:'remove',p2:{...p,r:false,f:false},b:[111.7,67.5,5,7]}]:[{t:'add',p2:{...p,r:true,f:false},b:p.f?[103.5,63.5,13,11]:[111.7,67.5,5,7]},{t:'flip',p2:{...p,f:!p.f},b:[103.6,63.6,9.4,10.8]}]),{t:'color',p2:{...p,c:p.c==='#22d3ee'?'#7e22ce':'#22d3ee'},b:[103.5,63.5,13,11]}]};
/* glowing mushrooms by the tree */
const GM=[[41,69,1],[45,70,0.8],[48.6,68.6,1.1]];
K.gmush={draw:p=>GM.map(([x,y,s],i)=>i===2&&!p.r?'':R(x-0.5*s,y-2.6*s,s,2.6*s,'#e2e8f0')+Pa(`M${x-2.4*s} ${y-2.4*s} a${2.4*s} ${2*s} 0 0 1 ${4.8*s} 0 Z`,p.c)).join(''),
 muts:p=>[tog(p,'r',[45.6,63.4,6.2,5.8]),{t:'color',p2:{...p,c:p.c==='#67e8f9'?'#f9a8d4':'#67e8f9'},b:[38,63.4,14,7]}]};
/* potion table: 3 bottles (round or tall), end one comes and goes, a candle */
const BX=[9,15.5,22],PC=['#22c55e','#a855f7','#ef4444','#3b82f6','#facc15'];
const bottle=(x,t,c)=>t==='round'?C(x,77,2.6,c)+R(x-0.8,72.4,1.6,2.6,c)+R(x-0.9,71.4,1.8,1,'#a16207')+C(x-0.9,76,0.6,'#ffffff50'):R(x-1.6,73,3.2,7,c,'rx="0.6"')+R(x-0.7,70.6,1.4,2.6,c)+R(x-0.8,69.8,1.6,1,'#a16207')+R(x-1,74,0.6,4,'#ffffff40');
K.potions={draw:p=>R(4,80,26,1.6,'#78350f')+L(6,81.6,6,88,'#78350f',0.9)+L(28,81.6,28,88,'#78350f',0.9)+BX.map((x,i)=>p.on[i]?bottle(x,p.t[i],p.c[i]):'').join('')
  +R(26.6,75.6,1.6,4.4,'#f5e6c8')+(p.lit?E(27.4,74.6,0.6,1,'#fbbf24'):''),
 muts:(p,r)=>{const bb=i=>[BX[i]-3,69.4,6,10.8],on=[0,1,2].filter(k=>p.on[k]),off=[0,1,2].filter(k=>!p.on[k]),i=pk(r,on),c=p.c.slice(),t=p.t.slice();c[i]=pkC(r,PC,c[i]);t[i]=t[i]==='round'?'tall':'round';
  const m=[{t:'color',p2:{...p,c},b:bb(i)},{t:'replace',p2:{...p,t},b:bb(i)},{t:'light',p2:{...p,lit:!p.lit},b:[26,72.8,2.8,3]}],so=(k,v)=>{const o=p.on.slice();o[k]=v;return o;};
  if(on.length>2){const k=pk(r,on);m.push({t:'remove',p2:{...p,on:so(k,false)},b:bb(k)});}if(off.length){const k=pk(r,off);m.push({t:'add',p2:{...p,on:so(k,true)},b:bb(k)});}return m;}};
/* stream with an arched bridge and a frog prince */
const BRT=[0.125,0.3125,0.5,0.6875,0.875];
K.fbridge={draw:p=>Pa('M58 80.5 Q70 67.5 82 80.5 L80.4 80.5 Q70 70.6 59.6 80.5 Z','#92400e')+BRT.map((t,i)=>i===4&&p.n<5?'':L(58+24*t,80-24*t*(1-t),58+24*t,77-24*t*(1-t),'#78350f',0.6)).join('')
  +(p.rail?`<path d="M60 76.6 Q70 63.6 80 76.6" stroke="#78350f" stroke-width="0.6" fill="none"/>`:''),
 muts:p=>[tog(p,'rail',[59.5,69.5,21,6]),{t:p.n===5?'remove':'add',p2:{...p,n:p.n===5?4:5},b:[77.4,72.6,3.6,5.4]}]};
K.frog={draw:p=>lily(100,82.6,false)+(p.fl?C(97.4,82.3,1.1,'#f9a8d4'):'')+(p.on?frog(100.6,81.4)+(p.cr?Pg('99.2,79.6 99.4,78.2 100,79 100.6,78 101.2,79 101.8,78.2 102,79.6','#facc15'):''):''),
 muts:p=>p.on?[{t:'remove',p2:{...p,on:false},b:[98,77.6,5.4,5.6]},tog(p,'cr',[98.8,77.4,3.6,2.6]),tog(p,'fl',[95.6,80.6,3.6,3.4])]:[{t:'add',p2:{...p,on:true},b:[98,77.6,5.4,5.6]}]};
/* cauldron on a fire and the witch stirring it (she faces left) */
K.cauldron={draw:p=>(p.on?Pg('38.6,89.6 40.4,85.8 41.8,88 43.2,85.4 44.6,88 45.8,86 46.4,89.6','#f97316')+Pg('40.4,89.6 41.6,87.4 42.6,88.6 43.6,87.2 44.6,89.6','#facc15'):'')
  +L(37.6,89.8,46.6,88.6,'#5b3a1e',0.9)+L(37.8,88.6,46.4,89.8,'#5b3a1e',0.9)+L(37.4,85,36.6,88,'#71717a',0.8)+L(46.6,85,47.4,88,'#71717a',0.8)
  +Pa('M35.8 80.4 a6.2 5.6 0 0 0 12.4 0 Z','#52525b')+Pa('M37.4 82.4 a4.8 3.4 0 0 0 3 2.6','none','stroke="#a1a1aa" stroke-width="0.5"')+E(42,80.4,6.4,1.5,'#a1a1aa')+E(42,80.4,5.2,1,p.bc)+[[40,77.8,0.9],[43.4,76.6,0.75],[45.2,78.4,0.6]].map(([x,y,rr],i)=>i<p.bub?C(x,y,rr,'none',`stroke="${p.bc}" stroke-width="0.35"`):'').join(''),
 muts:p=>[{t:'color',p2:{...p,bc:p.bc==='#4ade80'?'#c084fc':'#4ade80'},b:[35.6,78.6,12.8,3.6]},{t:'light',p2:{...p,on:!p.on},b:[37.4,85,10,5]},{t:p.bub===3?'remove':'add',p2:{...p,bub:p.bub===3?2:3},b:[44.2,77.4,2,2]}]};
const WDR=['#7c3aed','#be185d','#2563eb'],WHC=['#7c3aed','#16a34a','#64748b'];
/* three witches: green with wild ginger hair, pale with long dark hair, stone-grey with a white braid */
const WTYPE={green:{skin:'#84cc16',hst:'wild',hair:'#f97316'},pale:{skin:'#f1ede4',hst:'long',hair:'#b45309'},stone:{skin:'#78716c',hst:'braid',hair:'#e2e8f0'}};
const WHAIR={long:c=>R(-1.4,-20,5,10.4,c,'rx="1.4"'),
  braid:c=>R(-1.2,-19.6,4.2,3.4,c,'rx="1"')+C(2.5,-15.4,0.9,c)+C(2.7,-13.8,0.85,c)+C(2.8,-12.3,0.8,c)+R(2.1,-11.4,1.4,0.6,'#dc2626'),
  wild:c=>Pg('-2.2,-19.8 3.4,-19.8 4.8,-17.6 3.8,-16.8 5,-14.8 3.4,-15.2 3.6,-12.8 2,-14.4 1,-12.4 0.2,-14.8 -1.8,-15.6',c)};
const witchHat=(o)=>E(0,-19.6,4.8,0.95,o.hc)+(o.hs==='bent'?Pa('M-2.7 -19.6 L-1 -25.4 Q0 -28.4 3.6 -27.2 L1.4 -25.4 L2.7 -19.6 Z',o.hc):Pg('-2.7,-19.6 -0.2,-28.4 2.7,-19.6',o.hc));
const witchD=o=>{const w=WTYPE[o.wt],k=w.skin;o={...o,hst:w.hst,hair:w.hair};return(o.hst!=='braid'?WHAIR[o.hst](o.hair):'')+Pg('-5.2,0 5.2,0 2.8,-15 -2.8,-15',o.dress)+(o.hst==='braid'?WHAIR.braid(o.hair):'')+R(-1.4,-1,1.4,1,'#1f2937')+R(0.6,-1,1.4,1,'#1f2937')
  +(o.belt?R(-3.75,-9.8,7.5,1.1,'#1f2937')+R(-0.7,-10.1,1.4,1.7,'#facc15'):'')+(o.patch?R(1.2,-5.2,2.2,2.2,'#d6a35a')+R(1.2,-5.2,2.2,2.2,'none','stroke="#78350f" stroke-width="0.3" stroke-dasharray="0.5 0.4"'):'')
  +L(-1.6,-13.4,-6.4,-13.2,o.dress,1.7)+L(-6.6,-13.2,-11.8,-11.8,'#78350f',0.55)+C(-6.6,-13.2,0.85,k)+C(0,-17.4,2.6,k)+Pg('-2.4,-17.6 -4,-16.9 -2.4,-16.5',k)+C(-1.2,-18,0.3,'#111')+witchHat(o);};
K.witch={draw:p=>G(`translate(${p.x},${p.y}) scale(${p.s})`,witchD(p.o)),
 muts:(p,r)=>{const o=p.o,b=q=>[p.x+q[0]*p.s,p.y+q[1]*p.s,q[2]*p.s,q[3]*p.s],set=(t,ch,q,x={})=>({t,p2:{...p,o:{...o,...ch}},b:b(q),...x}),HB=[-5,-29,10,10.4];
  return[set('color',{dress:pk(r,cvdPrefer(WDR.filter(c=>c!==o.dress&&c!==o.hc),o.dress))},[-5.4,-15.4,10.8,15.4]),set('color',{hc:pk(r,cvdPrefer(WHC.filter(c=>c!==o.hc&&c!==o.dress),o.hc))},HB),set('replace',{hs:o.hs==='bent'?'straight':'bent'},HB,{easy:false}),
   set('replace',{wt:pk(r,Object.keys(WTYPE).filter(t=>t!==o.wt))},[-4.2,-20.2,9.6,9.4]),set(o.belt?'remove':'add',{belt:!o.belt},[-4.2,-10.6,8.4,2.4],{easy:false})];}};
/* cattails by the swamp: 1-3 on the left, 1-2 on the right */
const CTX=[[76.5,80],[78.4,79.2],[80.3,80.2],[117,80.6],[115.1,79.8]];
const cattail=([x,y])=>L(x,y+3,x,y-4.5,'#4d7c0f',0.45)+E(x,y-3,0.65,1.7,'#92400e');
K.cattail={draw:p=>CTX.map((c,i)=>(i<3?i<p.nl:i-3<p.nr)?cattail(c):'').join(''),
 muts:p=>{const cb=i=>[CTX[i][0]-1.2,CTX[i][1]-5.2,2.4,8.6],m=[];
  if(p.nl>1)m.push({t:'remove',p2:{...p,nl:p.nl-1},b:cb(p.nl-1)});if(p.nl<3)m.push({t:'add',p2:{...p,nl:p.nl+1},b:cb(p.nl)});
  if(p.nr>1)m.push({t:'remove',p2:{...p,nr:p.nr-1},b:cb(3+p.nr-1)});else m.push({t:'add',p2:{...p,nr:2},b:cb(4)});return m;}};
Object.assign(CAT,{cattail:'swamp',cauldron:'witch',witch:'witch',fmoon:'sky',bats:'sky',ftower:'tower',ftree:'tree',dragon:'dragon',mushh:'mushroom',crystal:'ground',gmush:'ground',potions:'table',fbridge:'stream',frog:'swamp'});
gadd('Fantasy forest','wizard tower, lantern tree, dragon on a rock, mushroom house, potions, bridge',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  add('raw',{s:R(0,0,120,90,FSKY)+E(30,62,46,10,'#312e81')+E(96,60,40,9,'#2e2a6e')+R(0,60,120,30,'#1a2e22')+E(64,62,11,3.6,'#57534e')+E(97,84.6,23.4,6.2,'#1f3b2c')+E(97,84.6,22,5.4,'#134e4a')+`<path d="M84 86.5 q3 -1 6 0 M104 88 q3 -1 6 0" stroke="#2dd4bf" stroke-width="0.35" fill="none" opacity=".6"/>`},-10);add('cattail',{nl:ri(r,1,3),nr:ri(r,1,2)},2);
  add('fmoon',{x:62,y:10,r:r()<0.5},0);add('bats',{x:84,y:16,n:pk(r,[0,1,2])},0);
  const boxes=[[3,0,24,67],[26,20,30,30],[44,38,40,30],[78,28,42,38],[55,3,14,14],[79,9,17,9]];
  freeSpots(r,10,[2,2,116,34],boxes,3,11).forEach(([x,y])=>add('star',{x:+x.toFixed(1),y:+y.toFixed(1),on:r()<0.85,s:1.2,c:pk(r,['#fde68a','#e2e8f0'])},0,'star'));
  add('ftower',{rc:pk(r,['#7c3aed','#0f766e']),s1:r()<0.8,s3:r()<0.8,w:[r()<0.6,r()<0.6,r()<0.6],fl:r()<0.7,fc:pk(r,['#facc15','#f472b6']),dc:pk(r,['#7c2d12','#166534'])},1);
  add('ftree',{lp:true,rd:r()<0.5,l:r()<0.85,r:r()<0.85,lc:mixC(r,[0,1,2],['#facc15','#22d3ee','#f472b6','#4ade80']),owl:r()<0.6},1);
  add('dragon',{c:pk(r,['#16a34a','#2563eb','#dc2626']),wing:true,fire:r()<0.5,f:r()<0.5},2);
  add('mushh',{kl:r()<0.5,cc:pk(r,['#dc2626','#2563eb']),miss:-1,lit:r()<0.7,dc:pk(r,['#7c2d12','#166534'])},1);
  add('crystal',{r:r()<0.6,f:r()<0.5,c:pk(r,['#22d3ee','#7e22ce'])},2);add('gmush',{r:r()<0.8,c:pk(r,['#67e8f9','#f9a8d4'])},2);
  add('potions',{on:(k=>[0,1,2].map(i=>i!==k))(r()<0.7?-1:ri(r,0,2)),t:BX.map(()=>pk(r,['round','tall'])),c:mixC(r,BX,PC),lit:r()<0.7},3);
  add('cauldron',{bc:pk(r,['#4ade80','#c084fc']),on:r()<0.75,bub:pk(r,[2,3,3])},3);
  {const dress=pk(r,WDR);add('witch',{x:56,y:88,s:0.62,o:{dress,hc:pkC(r,WHC,dress),hs:pk(r,['straight','bent']),wt:pk(r,Object.keys(WTYPE)),belt:r()<0.6}},3);}
  add('frog',{on:r()<0.8,cr:r()<0.6,fl:r()<0.5},3);
  return items;});

/* ================= LAB ================= */
/* shelf flasks: liquid color, level (full / half), end flask comes and goes */
const FKX=[8,17,26,35];
const flask=(x,t,c,full)=>{if(t==='cone'){const ly=full?19:21.6,hw=1+2*(ly-18)/6;return Pg(`${x-3},24 ${x+3},24 ${x+hw},${ly} ${x-hw},${ly}`,c)+Pg(`${x-3},24 ${x+3},24 ${x+1},18 ${x+1},14.6 ${x-1},14.6 ${x-1},18`,'#e2e8f022','stroke="#cbd5e1" stroke-width="0.4"');}
  return(full?C(x,20.8,3.2,c):Pa(`M${x-3.2} 20.8 a3.2 3.2 0 0 0 6.4 0 Z`,c))+C(x,20.8,3.2,'#e2e8f022','stroke="#cbd5e1" stroke-width="0.4"')+R(x-0.9,13.6,1.8,4.4,'#e2e8f022','stroke="#cbd5e1" stroke-width="0.4"');};
K.flasks={draw:p=>R(3,24,38,1.6,'#78350f')+FKX.map((x,i)=>i===3&&p.n<4?'':flask(x,p.t[i],p.c[i],p.f[i])).join(''),
 muts:(p,r)=>{const fb=i=>[FKX[i]-3.6,13,7.2,11.2],i=ri(r,0,p.n-1),c=p.c.slice(),f=p.f.slice();c[i]=pkC(r,PC,c[i]);f[i]=!f[i];
  return[{t:'color',p2:{...p,c},b:fb(i)},{t:'level',p2:{...p,f},b:fb(i)},{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:fb(3)}];}};
/* whiteboard: a formula, a number (one digit changes), a graph that goes up or down */
K.board={draw:p=>R(46,6,38,24,'#f1f5f9')+R(46,6,38,24,'none','stroke="#94a3b8" stroke-width="0.8"')+T(56,14,3.4,'#1d4ed8',p.f1)+T(56,22,3.4,'#dc2626','x='+p.num)
  +L(67,26,67,10,'#334155',0.4)+L(67,26,82,26,'#334155',0.4)+`<polyline points="${(p.up?[[68,24],[71,21],[74,22],[77,16],[80,12]]:[[68,12],[71,15],[74,14],[77,20],[80,24]]).map(a=>a.join(',')).join(' ')}" stroke="${p.gc}" stroke-width="0.8" fill="none"/>`,
 muts:(p,r)=>[{t:'text',p2:{...p,f1:FPAIR[p.f1]},b:[47,10,18,5.4]},{t:'text',p2:{...p,num:digitTweak(r,p.num)},b:[47,18,18,5.4]},{t:'replace',p2:{...p,up:!p.up},b:[67,10.5,15,15],easy:false},{t:'color',p2:{...p,gc:p.gc==='#16a34a'?'#dc2626':'#16a34a'},b:[67,10.5,15,15],easy:false}]};
const FPAIR={'E=mc²':'F=ma','F=ma':'E=mc²','H₂O':'CO₂','CO₂':'H₂O'};
K.lclock2={draw:p=>C(92,12,5,'#f1f5f9')+C(92,12,5,'none','stroke="#475569" stroke-width="0.8"')+L(92,12,92,8.5,'#111',0.8)+L(92,12,p.h?88.5:95.5,12.8,'#111',0.6),muts:p=>[{t:'move',p2:{...p,h:!p.h},b:[87.5,10,9,4.5]}]};
K.hazard={draw:p=>Pg('93,21.5 98.4,30.5 87.6,30.5','#facc15')+Pg('93,21.5 98.4,30.5 87.6,30.5','none','stroke="#1f2937" stroke-width="0.6"')+(p.v==='bang'?R(92.5,24.4,1,3.6,'#1f2937')+C(93,29,0.55,'#1f2937'):Pg('93.6,23.6 91.4,27 93,27 92.4,29.8 94.6,26 93,26','#1f2937')),
 muts:p=>[{t:'replace',p2:{...p,v:p.v==='bang'?'bolt':'bang'},b:[90.6,23,4.8,7.2],easy:false}]};
/* lab coat on a hook: pen in the pocket, badge color, 3 or 2 buttons (recentred) */
K.coat={draw:p=>R(109,8,2,2.4,'#475569')+Pa('M104 12 l6 -1.6 l6 1.6 l1 27 h-14 Z','#f8fafc')+Pg('107.6,10.8 110,15 112.4,10.8 110,11.6','#e2e8f0')+R(102,12.6,2.6,15,'#f1f5f9')+R(115.4,12.6,2.6,15,'#f1f5f9')
  +(p.pen?R(106.8,21.2,0.8,3.4,p.pc):'')+R(105.6,23.6,4,4,'#e2e8f0')+R(111.4,17.2,3.4,2,p.bc)+(p.bt===3?[21,26,31]:[23.5,28.5]).map(y=>C(110,y,0.5,'#94a3b8')).join(''),
 muts:p=>[tog(p,'pen',[106.2,20.6,2,4.4]),{t:'color',p2:{...p,bc:p.bc==='#2563eb'?'#dc2626':'#2563eb'},b:[111,16.8,4.2,2.8]},{t:p.bt===3?'remove':'add',p2:{...p,bt:p.bt===3?2:3},b:[109,20,2,12],easy:false}]};
/* counter: microscope, tube rack, burner with beaker, monitor, plant under a grow lamp, robot arm */
K.scope={draw:p=>flip(12,R(6,54,11,2,'#e2e8f0')+R(6.6,40,2,14,p.c)+R(8,47.6,8,1.2,'#e2e8f0')+(p.sl?R(9,46.8,6,0.8,'#38bdf8'):'')+Pg('8.6,40 13,36 14.6,37.4 10.2,41.6',p.c)+R(13.4,34,2.6,3,'#e2e8f0')+R(11.6,41.4,2,4,'#94a3b8'),p.f),
 muts:(p,r)=>[{t:'flip',p2:{...p,f:!p.f},b:[5.5,33.5,13,23]},{t:'color',p2:{...p,c:pkC(r,['#2563eb','#dc2626','#16a34a'],p.c)},b:[5.5,33.5,13,23]},tog(p,'sl',p.f?[8.6,46.2,6.8,2]:[8.6,46.2,6.8,2])]};
const TBX=[24.6,28.2,31.8,35.4];
K.tubes={draw:p=>R(22,50,16,1.2,'#94a3b8')+R(22,54.6,16,1.4,'#94a3b8')+TBX.map((x,i)=>i===3&&p.n<4?'':R(x-0.9,43,1.8,12,'#e2e8f022','rx="0.9" stroke="#cbd5e1" stroke-width="0.3"')+R(x-0.9,49,1.8,6,p.c[i],'rx="0.9"')).join(''),
 muts:(p,r)=>{const i=ri(r,0,p.n-1),c=p.c.slice();c[i]=pkC(r,PC,c[i]);return[{t:'color',p2:{...p,c},b:[TBX[i]-1.6,42.4,3.2,13]},{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:[TBX[3]-1.6,42.4,3.2,13]}];}};
K.burner={draw:p=>L(43,56,45,48,'#475569',0.5)+L(53,56,51,48,'#475569',0.5)+R(43.6,48,8.8,0.8,'#475569')+R(46.6,52,2.8,4,'#334155')+(p.on?Pg('47,52 49,52 48,48.8','#3b82f6')+Pg('47.6,52 48.4,52 48,50.2','#93c5fd'):'')
  +R(44,40,8,8,'#e2e8f022','stroke="#cbd5e1" stroke-width="0.4"')+R(44,43.6,8,4.4,p.c)+[[46,42.2],[48.4,41.2],[50.4,42.4]].map(([x,y],i)=>i<p.bub?C(x,y,0.6,'none','stroke="#f1f5f9" stroke-width="0.35"'):'').join(''),
 muts:(p,r)=>[{t:'light',p2:{...p,on:!p.on},b:[46,48.4,4,4]},{t:p.bub===3?'remove':'add',p2:{...p,bub:p.bub===3?2:3},b:[49.4,41.4,2,2]},{t:'color',p2:{...p,c:pkC(r,PC,p.c)},b:[43.6,43.2,8.8,5.2]}]};
K.monitor={draw:p=>R(58,36,20,14,'#111827','rx="0.8"')+R(59,37,18,12,'#0f172a')+p.h.map((h,i)=>R(60.4+i*3.4,48-h,2.4,h,p.c)).join('')+R(66.5,50,3,4,'#334155')+R(63,54,10,2,'#334155'),
 muts:(p,r)=>{const i=ri(r,0,4),h=p.h.slice(),nh=h[i]>6?h[i]-4:h[i]+4;h[i]=nh;return[{t:'move',p2:{...p,h},b:[60+i*3.4,37.4,3.2,10.8]},{t:'color',p2:{...p,c:p.c==='#4ade80'?'#38bdf8':'#4ade80'},b:[59,37,18,12],easy:false}];}};
K.glamp={draw:p=>L(93,56,93,37.6,'#cbd5e1',0.7)+L(93,37.6,87.6,37.6,'#cbd5e1',0.7)+(p.on?Pg('84.6,39 90.6,39 92.4,47 82.8,47','#e879f9','opacity=".18"'):'')+R(84.6,36.8,6,2.2,'#e2e8f0','rx="0.6"')+R(85.4,38.6,4.4,0.6,p.on?'#f0abfc':'#64748b')+potPlant(87.6,51,6,5,p.pot,p.pt,p.n),
 muts:(p,r)=>[{t:'light',p2:{...p,on:!p.on},b:[84.2,36.4,6.8,3.4]},...plantMuts(p,r,87.6,51,6,5,'pot')]};
K.robot={draw:p=>R(100,52,10,4,'#475569','rx="0.6"')+C(102,54,0.6,p.led?'#4ade80':'#ef4444')+L(105,51,108,42,'#94a3b8',1.6)+L(108,42,113.6,44.4,'#94a3b8',1.4)+C(105,51,1.6,p.jc)+C(108,42,1.3,p.jc)
  +(p.open?L(113.6,44.4,116,42.6,'#cbd5e1',0.6)+L(113.6,44.4,116,46.6,'#cbd5e1',0.6):L(113.6,44.4,116,43.8,'#cbd5e1',0.6)+L(113.6,44.4,116,45.2,'#cbd5e1',0.6)),
 muts:p=>[{t:'move',p2:{...p,open:!p.open},b:[113,41.8,4,5.6]},{t:'color',p2:{...p,jc:p.jc==='#f97316'?'#2563eb':'#f97316'},b:[103,40.2,7,12.6]},{t:'light',p2:{...p,led:!p.led},b:[100.8,52.8,2.4,2.4]}]};
/* under the counter: cupboard doors (handle side), gas cylinders, fire extinguisher */
K.ldoor={draw:p=>R(p.x+1,60,18,21,'#64748b','rx="0.6"')+R(p.x+(p.hr?15.6:3),68,1.2,5,'#cbd5e1'),muts:p=>p.fix?[]:[{t:'move',p2:{...p,hr:!p.hr},b:[p.x+2,67.5,16,6]}]};
K.gas={draw:p=>[0,1].map(i=>i===1&&!p.two?'':R(84+i*8,66,6,16,p.c[i],'rx="2.5"')+R(85.8+i*8,63.6,2.4,2.4,'#94a3b8')+(p.cap[i]?R(85.2+i*8,62,3.6,1.8,'#e2e8f0','rx="0.4"'):'')).join(''),
 muts:(p,r)=>{const i=p.two?ri(r,0,1):0,c=p.c.slice(),cap=p.cap.slice();c[i]=c[i]==='#2563eb'?'#16a34a':'#2563eb';cap[i]=!cap[i];
  return[{t:'color',p2:{...p,c},b:[83.6+i*8,62,6.8,20.4]},{t:p.cap[i]?'remove':'add',p2:{...p,cap},b:[84.6+i*8,61.4,4.8,3]},{t:p.two?'remove':'add',p2:{...p,two:!p.two},b:[91.6,62,6.8,20.4]}];}};
K.ext={draw:p=>R(106,68,6,14,'#dc2626','rx="2"')+R(107.6,65.6,2.8,2.6,'#9ca3af')+(p.hose?`<path d="M110.4 66.4 q3 0 3 4 v6" stroke="#9ca3af" stroke-width="0.8" fill="none"/>`:'')+(p.lb?R(107,72,4,3.4,'#f8fafc'):''),
 muts:p=>[tog(p,'hose',[110.2,65.4,4.2,11.6]),tog(p,'lb',[106.6,71.6,4.8,4.2])]};
const LCX=[4.4,8.8,13.2];
K.lcup={draw:p=>{const x=p.x,dr=Pg(`${x+19},60 ${x+22},58.6 ${x+22},82.4 ${x+19},81`,'#64748b','stroke="#cbd5e1" stroke-width="0.5" stroke-linejoin="round"');
  let s=R(x+1,60,18,21,'#0f172a','rx="0.6"')+R(x+1,70.4,18,0.8,'#94a3b8');
  LCX.forEach((dx,i)=>{if(!p.on[i])return;const c=p.bc[i];s+=R(x+dx-1.5,64.6,3,5.8,c,'rx="0.6"')+R(x+dx-0.7,63,1.4,1.8,c)+R(x+dx-0.8,62.4,1.6,0.8,'#94a3b8')+R(x+dx-1.5,66.4,3,1.6,'#f8fafc');});
  s+=R(x+2.6,74.6,7.4,6.4,p.box,'rx="0.4"')+R(x+2.6,76.6,7.4,0.7,'#00000040');
  if(p.gog)s+=`<path d="M${x+12} 79.2 q3.3 -2.4 6.4 0" stroke="#64748b" stroke-width="0.5" fill="none"/>`+E(x+13.6,79.6,1.6,1.1,'#7dd3fc')+E(x+16.8,79.6,1.6,1.1,'#7dd3fc')+L(x+15,79.6,x+15.4,79.6,'#1f2937',0.5);
  return s+dr;},
 muts:(p,r)=>{const x=p.x,bb=i=>[x+LCX[i]-2,61.8,4,9],i=pk(r,[0,1,2].filter(k=>p.on[k])),bc=p.bc.slice();bc[i]=pkC(r,['#92400e','#2563eb','#16a34a','#f8fafc','#dc2626'],bc[i]);
  const so=(k,v)=>p.on.map((o,j)=>j===k?v:o),off=[0,2].find(k=>!p.on[k]),side=off===undefined?pk(r,[0,2]):off;
  return[{t:'color',p2:{...p,bc},b:bb(i)},{t:off===undefined?'remove':'add',p2:{...p,on:so(side,off!==undefined)},b:bb(side)},{t:'color',p2:{...p,box:pkC(r,['#d6a35a','#dc2626','#2563eb'],p.box)},b:[x+2.2,74.2,8.2,7.2]},
   tog(p,'gog',[x+11.6,77.4,7.4,3.6])];}};
Object.assign(CAT,{lcup:'cupboards',flasks:'shelf',board:'board',lclock2:'wall',hazard:'wall',coat:'coat',scope:'counter',tubes:'counter',burner:'counter',monitor:'monitor',glamp:'plant',robot:'robot',ldoor:'cupboards',gas:'below',ext:'below'});
gadd('Lab','flasks on a shelf, whiteboard, microscope, tubes, burner, monitor, grow lamp, robot arm',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  add('raw',{s:R(0,0,120,90,'#334155')+R(0,56,120,2.4,'#94a3b8')+R(0,58.4,120,24,'#475569')+R(80,59.4,39,22,'#1e293b')+R(0,82.4,120,7.6,'#1e293b')},-10);
  add('flasks',{n:r()<0.7?4:3,t:FKX.map(()=>pk(r,['cone','round'])),c:mixC(r,FKX,PC),f:FKX.map(()=>r()<0.6)},1);
  add('board',{f1:pk(r,['E=mc²','F=ma','H₂O','CO₂']),num:String(ri(r,12,98)),up:r()<0.5,gc:pk(r,['#16a34a','#dc2626'])},1);add('lclock2',{h:r()<0.5},1);add('hazard',{v:pk(r,['bang','bolt'])},1);
  add('coat',{pen:r()<0.7,pc:pk(r,['#2563eb','#dc2626']),bc:pk(r,['#2563eb','#dc2626']),bt:r()<0.75?3:2},1);
  add('scope',{c:pk(r,['#2563eb','#dc2626','#16a34a']),sl:r()<0.7,f:r()<0.5},2);add('tubes',{n:r()<0.7?4:3,c:mixC(r,TBX,PC)},2);
  add('burner',{on:r()<0.7,bub:pk(r,[2,3,3]),c:pk(r,PC)},2);add('monitor',{h:[0,1,2,3,4].map(()=>ri(r,3,9)),c:pk(r,['#4ade80','#38bdf8'])},2);
  add('glamp',{on:r()<0.7,pot:pk(r,['#b45309','#2563eb']),pt:pk(r,['leafy','leafy','cactus']),n:r()<0.75?3:2},2);add('robot',{open:r()<0.5,jc:pk(r,['#f97316','#2563eb']),led:r()<0.6},2);
  {const ox=pk(r,[0,20,40,60]);[0,20,40,60].forEach(x=>x===ox?add('lcup',{x,on:(k=>[k!==0,true,k!==2])(r()<0.7?-1:pk(r,[0,2])),bc:[pk(r,['#92400e','#2563eb']),pk(r,['#16a34a','#f8fafc']),pk(r,['#dc2626','#92400e'])],box:pk(r,['#d6a35a','#dc2626']),gog:r()<0.7},1.5):add('ldoor',{x,hr:x===ox+20?true:r()<0.5,fix:x===ox+20},1,'ldoor'));}
  add('gas',{c:[pk(r,['#2563eb','#16a34a']),pk(r,['#2563eb','#16a34a'])],cap:[r()<0.8,r()<0.8],two:r()<0.75},2);add('ext',{hose:true,lb:r()<0.6},2);
  return items;});
