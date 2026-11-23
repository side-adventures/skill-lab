/* ================= GARDEN v2 ================= */
K.fcat={draw:p=>p.on?cat(46,33.6,p.c,p.f):'',muts:(p,r)=>p.on?[{t:'remove',p2:{...p,on:false},b:[42,29.4,8.4,6]},{t:'color',p2:{...p,c:other(r,p.c,['#f97316','#f1f5f9','#94a3b8','#111'])},b:[42,29.4,8.4,6]},{t:'flip',p2:{...p,f:!p.f},b:[41.6,29.4,8.8,6]}]:[{t:'add',p2:{...p,on:true},b:[42,29.4,8.4,6]}]};
const MAILP={r:[-7.5,2],l:[-32,4]};
const mailB=(p,b)=>{const[dx,dy]=MAILP[p.side];const x=p.side==='l'?224-b[0]-b[2]:b[0];return[x+dx,b[1]+dy,b[2],b[3]];};
K.mail={draw:p=>G(`translate(${MAILP[p.side][0]},${MAILP[p.side][1]})`,flip(112,L(112,74,112,68,'#334155',0.8)+R(109.5,65,5,3.6,p.c,'rx="0.8"')+(p.up?R(114.5,63.6,0.9,3,'#ef4444'):R(114.5,66.8,2.4,0.9,'#ef4444')),p.side==='l')),
 muts:(p,r)=>[{t:'move',p2:{...p,up:!p.up},b:mailB(p,[113.9,63.1,3.4,5])},{t:'color',p2:{...p,c:other(r,p.c,['#1d4ed8','#16a34a','#dc2626','#facc15'])},b:mailB(p,[109,64.5,5,4.6])}]};
/* small objects: one spot left of the patch under the tree, one right of the path */
const SPOT={l:[11,76],r:[115.5,77.5]};
const SPV={l:['bucket','ball','hedgehog'],r:['lamp','pot','ball']};
const SPC={bucket:['#2563eb','#dc2626','#facc15'],ball:['#dc2626','#2563eb','#facc15'],pot:['#c2410c','#2563eb','#f1f5f9']};
const spotD=(v,x,y,c,on)=>v==='bucket'?`<path d="M${x-2} ${y-4.4} q2 -3 4 0" stroke="#475569" stroke-width="0.4" fill="none"/>`+Pa(`M${x-2.3} ${y-4.4} h4.6 l-0.7 4.4 h-3.2 Z`,c)+R(x-2.3,y-4.4,4.6,0.6,'#00000030')
 :v==='ball'?C(x,y-2,2,c)+R(x-2,y-2.45,4,0.9,'#f1f5f9')
 :v==='hedgehog'?Pa(`M${x-3.2} ${y} a3.2 2.6 0 0 1 6.2 -0.6 Z`,'#57351c')+[-2.2,-0.8,0.6].map(d=>Pg(`${x+d-0.6},${y-2} ${x+d+0.6},${y-2.2} ${x+d-0.4},${y-3.5}`,'#3b2412')).join('')+E(x+3,y-0.9,1.3,0.9,'#d6b48c')+C(x+4.2,y-0.9,0.35,'#111')+C(x+2.9,y-1.2,0.3,'#111')
 :v==='lamp'?L(x,y,x,y-6,'#cbd5e1',0.6)+R(x-1.3,y-8.6,2.6,2.6,'#cbd5e1','rx="0.4"')+R(x-0.8,y-8.1,1.6,1.6,on?'#fde68a':'#475569')+Pg(`${x-1.7},${y-8.6} ${x+1.7},${y-8.6} ${x},${y-9.8}`,'#cbd5e1')
 :v==='pot'?Pa(`M${x-2.2} ${y-3.4} h4.4 l-0.5 3.4 h-3.4 Z`,c)+C(x-1.1,y-4.4,1.3,'#25542b')+C(x+1.1,y-4.5,1.3,'#25542b')+C(x,y-5.4,1.4,'#2f6b35')+C(x,y-5.8,0.7,'#f472b6'):'';
K.spot={draw:p=>p.v==='none'?'':spotD(p.v,SPOT[p.s][0],SPOT[p.s][1],p.c,p.on),
 muts:(p,r)=>{const[x,y]=SPOT[p.s],b=[x-4.2,y-10.2,9.2,10.8],vs=SPV[p.s];const nv=v=>({...p,v,c:SPC[v]?pk(r,SPC[v]):p.c,on:true});
  if(p.v==='none'){const v=pk(r,vs);return[{t:'add',p2:nv(v),b,easy:false}];}
  const m=[{t:'remove',p2:{...p,v:'none'},b,easy:false},{t:'replace',p2:nv(pk(r,vs.filter(v=>v!==p.v))),b,easy:false}];
  if(SPC[p.v])m.push({t:'color',p2:{...p,c:pkC(r,SPC[p.v],p.c)},b});if(p.v==='lamp')m.push({t:'light',p2:{...p,on:!p.on},b:[x-1.8,y-10,3.6,4.4]});return m;}};
const GAP6=[[8,20.5],[16,16.5],[19,26.5],[10,29.5],[4,32.5],[26,32.5]];
K.gtree={draw:p=>R(9,30,6,34,'#5b3a1e')+C(12,22,13,DTREE)+C(3,29,6,DTREE)+C(22,29,6,DTREE)+C(15,16,5,'#33703a')+GAP6.map(([x,y],i)=>i===p.miss?'':C(x,y,1.3,p.ac)).join(''),
 muts:(p,r)=>{const ab=i=>[GAP6[i][0]-2,GAP6[i][1]-2,4,4];const m=[{t:'color',p2:{...p,ac:p.ac==='#ef4444'?'#facc15':'#ef4444'},b:[-1,9,30,26]}];
  if(p.miss<0){const i=ri(r,0,5);m.push({t:'remove',p2:{...p,miss:i},b:ab(i)});}else m.push({t:'add',p2:{...p,miss:-1},b:ab(p.miss)});return m;}};
K.swing={draw:p=>p.on?L(18,35,18,52,'#a16207',0.4)+L(24,35,24,52,'#a16207',0.4)+R(17,52,8,1.4,p.c):'',
 muts:(p,r)=>p.on?[{t:'color',p2:{...p,c:other(r,p.c,['#ef4444','#2563eb','#facc15','#16a34a'])},b:[16.5,51.5,9,2.4]},{t:'remove',p2:{...p,on:false},b:[16.5,35.5,9,18.5]}]:[]};
K.bhouse={draw:p=>R(33,40,2,18,'#6b4423')+R(30,32,8,8,p.c)+Pg('28.5,32.5 34,27 39.5,32.5','#7c2d12')+(p.hole?C(34,36,1.3,'#111'):'')+(p.bird?E(36.6,27.6,1.5,1,'#b7793f')+C(37.8,26.9,0.8,'#b7793f')+Pg('38.5,26.8 39.4,27 38.5,27.3','#f59e0b'):''),
 muts:(p,r)=>[{...tog(p,'hole',[32.2,34.2,3.6,3.6])},{t:'color',p2:{...p,c:other(r,p.c,['#e07a5f','#60a5fa','#fde68a','#16a34a'])},b:[29.5,31.5,9,9]},tog(p,'bird',[34.5,25.4,5.6,3.6])]};
const SUNF=[[53,44],[58,40],[63,46]];
K.sunf={draw:p=>SUNF.map(([x,top],i)=>i===2&&p.n<3?'':L(x,62,x,top,'#16a34a',0.7)+E(x-1.5,top+8,1.5,0.7,'#16a34a')+C(x,top,2.6,'#facc15')+C(x,top,1.2,p.cc[i])).join(''),
 muts:(p,r)=>{const i=ri(r,0,p.n-1);const cc=p.cc.slice();cc[i]=cc[i]==='#78350f'?'#facc15':'#78350f';return[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[60,43,6,19.5]},{t:'color',p2:{...p,cc},b:[SUNF[i][0]-1.6,SUNF[i][1]-1.6,3.2,3.2]}];}};
K.fbed={draw:p=>E(40,61,10,2.4,'#5b3a1e')+p.c.map((c,i)=>i===4&&p.n<5?'':L(32+i*4,61,32+i*4,57,'#16a34a',0.5)+C(32+i*4,56,1.4,c)+C(32+i*4,56,0.5,'#7c2d12')).join(''),
 muts:(p,r)=>{const i=ri(r,0,p.n-1),c=p.c.slice();c[i]=other(r,c[i],['#f472b6','#facc15','#b91c1c','#a78bfa','#f1f5f9']);return[{t:'color',p2:{...p,c},b:[32+i*4-1.9,54.1,3.8,3.8]},{t:p.n===5?'remove':'add',p2:{...p,n:p.n===5?4:5},b:[46,54,4,7.5]}];}};
K.berry={draw:p=>C(71.5,63.5,3.6,'#25542b')+C(78.5,63.5,3.6,'#25542b')+C(75,61.3,4.4,'#2f6b35')+(p.on?[[72,62.5],[75,59.8],[78,62],[73.8,64.6],[77,64.6]].map(([x,y])=>C(x,y,0.9,p.c)).join(''):''),
 muts:(p,r)=>p.on?[{t:'color',p2:{...p,c:other(r,p.c,['#7c3aed','#dc2626','#2563eb','#f1f5f9'])},b:[67.5,56.5,15,10.5],easy:false},{t:'remove',p2:{...p,on:false},b:[67.5,56.5,15,10.5],easy:false}]:[{t:'add',p2:{...p,on:true},b:[67.5,56.5,15,10.5],easy:false}]};
const gnome=(c)=>Pg('29,80 35,80 32,72','#2563eb')+C(32,72,1.4,'#f1c27d')+Pg('30.6,72.6 33.4,72.6 32,76','#f1f5f9')+Pg('29.6,72.4 34.4,72.4 32,65',c);
const flamingo=(c)=>E(32,71,3.4,2,c)+`<path d="M34.5 70.5 q2 -3 0.5 -5.5 q-1 -1.6 0.6 -2.4" stroke="${c}" stroke-width="0.9" fill="none"/>`+C(35.6,62.7,1,c)+Pg('36.4,62.6 37.8,63.4 36.3,63.4','#1f2937')+L(31.5,73,31.5,80,'#475569',0.4)+L(33,73,33,80,'#475569',0.4);
K.snail={draw:p=>p.on?flip(44,E(44,86.5,3.6,0.9,'#d6d3d1')+C(44.6,84.6,2,p.c)+C(44.6,84.6,0.9,'#00000040')+L(41.2,86,40.6,84.6,'#d6d3d1',0.3)+L(41.6,86,41.6,84.4,'#d6d3d1',0.3),p.f):'',
 muts:(p,r)=>p.on?[{t:'flip',p2:{...p,f:!p.f},b:[39.6,82,8.8,5.6]},{t:'color',p2:{...p,c:p.c==='#a16207'?'#f97316':'#a16207'},b:[42,82,5.4,5.2]},{t:'remove',p2:{...p,on:false},b:[39.6,82,8.8,5.6]}]:[]};
/* lawn items are drawn at their default spot and moved by (dx,dy) */
const shifted=def=>({draw:p=>G(`translate(${p.dx||0},${p.dy||0})`,def.draw(p)),muts:(p,r)=>def.muts(p,r).map(m=>({...m,b:[m.b[0]+(p.dx||0),m.b[1]+(p.dy||0),m.b[2],m.b[3]]}))});
K.snail=shifted(K.snail);
K.gnome=shifted({draw:p=>G('translate(-2,4)',flip(32,p.v==='gnome'?gnome(p.c):flamingo(p.c),p.f)),
 muts:p=>{const b=[25.5,65.2,12,19.3],w=[22.5,65.2,15,19.3];return[...(p.v==='flamingo'?[{t:'flip',p2:{...p,f:!p.f},b:w}]:[]),{t:'color',p2:{...p,c:near(p.c)},b},{t:'replace',p2:{...p,v:p.v==='gnome'?'flamingo':'gnome',c:p.v==='gnome'?'#f472b6':'#dc2626'},b:w}];}});
K.can=shifted({draw:p=>flip(63,p.v==='can'?R(58,78,9,7,p.c,'rx="1"')+Pg('67,80 72,76 72.6,76.8 67,83',p.c)+`<path d="M59.5 78 q3.5 -4 7 0" stroke="${p.c}" stroke-width="0.8" fill="none"/>`
  :Pa('M57.5 79 h11 l-1.5 6 h-8 Z',p.c)+`<path d="M58.5 79 q4.5 -6 9 0" stroke="${p.c}" stroke-width="0.8" fill="none"/>`+R(58.5,80.5,9,0.6,'#00000030')+R(59,82.5,8,0.6,'#00000030'),p.f),
 muts:p=>{const b=[53,74.5,20.5,11];return[{t:'color',p2:{...p,c:near(p.c)},b},...(p.v==='can'?[{t:'flip',p2:{...p,f:!p.f},b}]:[]),{t:'replace',p2:{...p,v:p.v==='can'?'basket':'can'},b}];}});
/* bird bath: 0, 1 or 2 birds */
const bbird=(x,c)=>E(x,67.4,1.5,1,c)+C(x-1.2,66.7,0.8,c)+Pg(`${x-1.9},66.6 ${x-2.8},66.8 ${x-1.9},67.1`,'#f59e0b');
K.bath=shifted({draw:p=>E(47,70,6,1.6,'#cbd5e1')+E(47,69.6,4.6,0.9,'#7dd3fc')+R(46,70,2,8,'#cbd5e1')+E(47,78,4,1,'#cbd5e1')+(p.n>0?bbird(44.4,p.c):'')+(p.n>1?flip(47,bbird(44.4,p.c),true):''),
 muts:p=>{const bb=[[41,65.4,5.4,3.5],[47.6,65.4,5.4,3.5]],m=[];if(p.n>0)m.push({t:'remove',p2:{...p,n:p.n-1},b:bb[p.n-1]},{t:'color',p2:{...p,c:p.c==='#78350f'?'#2563eb':'#78350f'},b:p.n>1?U(bb[0],bb[1]):bb[0],easy:false});
  if(p.n<2)m.push({t:'add',p2:{...p,n:p.n+1},b:bb[p.n]});return m;}});
/* house: wall runs off the right edge, roof centred on it and overhanging both sides */
K.ghouse={draw:p=>(p.chim?R(78,11,5,8,'#7c2d12'):'')+Pg('62.5,26.5 93,8 123.5,26.5',p.roof)+(p.att==='round'?C(93,18.5,2.6,'#fde68a'):R(90.6,16.1,4.8,4.8,'#fde68a'))+R(66,26,54,36,p.wall)+R(66,26,54,1.2,'#00000030'),
 muts:p=>[tog(p,'chim',[77.5,10.5,6,6.5]),{t:'replace',p2:{...p,att:p.att==='round'?'square':'round'},b:[90,15.5,6,6]}]};
K.gdoor={draw:p=>R(88,44,10,18,p.c)+(p.dw?C(93,49,2,'#bae6fd','stroke="#475569" stroke-width="0.5"'):'')+C(96.5,54,0.6,'#fbbf24')+R(99.6,45.2,6,4.2,'#f1f5f9','rx="0.4"')+T(102.6,48.6,3.3,'#1f2937',p.num),
 muts:(p,r)=>[{t:'color',p2:{...p,c:other(r,p.c,DOORS)},b:[87.5,43.5,11,19]},{t:p.dw?'remove':'add',p2:{...p,dw:!p.dw},b:[90.5,46.5,5,5]},{t:'text',p2:{...p,num:digitTweak(r,p.num)},b:[99.2,44.8,6.8,5]}]};
K.porch={draw:p=>L(93,38.4,93,40.4,'#334155',0.4)+R(91.8,40.4,2.4,2.4,'#334155','rx="0.5"')+C(93,41.6,0.8,p.on?'#fde68a':'#475569'),muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[91.3,37.9,3.4,5.4]}]};
/* flower box under each upper window */
const FBD=[1.5,4.5,7.5];
K.fbox={draw:p=>FBD.map((dx,i)=>i===2&&p.n<3?'':C(p.x+dx,39.7,1.1,p.c[i])).join('')+R(p.x-1,40.3,11,2.2,'#7c2d12'),
 muts:(p,r)=>{const fb=i=>[p.x+FBD[i]-1.6,38.5,3.2,2.4],i=ri(r,0,p.n-1),c=p.c.slice();c[i]=other(r,c[i],['#f472b6','#b91c1c','#a78bfa','#facc15','#f1f5f9']);return[{t:'color',p2:{...p,c},b:fb(i)},{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:fb(2)}];}};
/* shovel or rake leaning on the tree */
K.gtool={draw:p=>p.v==='none'?'':L(2.8,63.5,8.8,41,'#a16207',0.7)+(p.v==='shovel'?Pg('1.2,60.2 4.6,61.1 3.8,64.6 0.9,63.8','#94a3b8')+L(8.2,41.4,9.8,41.8,'#a16207',0.7)
   :L(0.4,62.2,5.4,63.6,'#64748b',0.8)+[0,1,2,3].map(i=>L(0.8+i*1.4,62.5+i*0.37,0.4+i*1.4,64.3+i*0.37,'#64748b',0.45)).join('')),
 muts:(p,r)=>{const b=[0,37.5,12.2,27.5];return p.v==='none'?[{t:'add',p2:{...p,v:pk(r,['shovel','rake'])},b}]:[{t:'replace',p2:{...p,v:p.v==='shovel'?'rake':'shovel'},b},{t:'remove',p2:{...p,v:'none'},b}];}};
/* pond along the left edge: lilies (1 or 2), a flower, a frog */
const frog=(x,y)=>E(x,y,2,1.3,'#4ade80')+C(x-1,y-1,0.7,'#4ade80')+C(x+1,y-1,0.7,'#4ade80')+C(x-1,y-1.2,0.3,'#111')+C(x+1,y-1.2,0.3,'#111');
K.gpond={draw:p=>E(3,84.5,21,7.4,'#78716c')+E(3,84.5,20,6.6,'#2563a8')+`<path d="M0 88.4 q2 -1 4 0 M17 86.4 q2 -1 4 0" stroke="#60a5fa" stroke-width="0.5" fill="none"/>`+lily(7,85.4,p.fl)+(p.n>1?lily(13,87.6,false):'')+(p.frog?frog(15.5,82.4):''),
 muts:p=>[{t:p.frog?'remove':'add',p2:{...p,frog:!p.frog},b:[13,80,5,3.8]},{t:p.fl?'remove':'add',p2:{...p,fl:!p.fl},b:[6.2,83.6,2.6,2.4]},{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[9.6,85.8,7,3.4]}]};
/* hedge from the right edge to the path, with 0-3 flowers */
const HFL=[[106,83.2],[111,84.6],[116,83.4]];
K.hedge={draw:p=>R(103,84,17,6,'#2f6b35')+[105.5,110,114.5,119].map(x=>C(x,84.6,3,'#2f6b35')).join('')+[107.5,112,116.5].map(x=>C(x,83.4,1.6,'#3b7f42')).join('')+HFL.map(([x,y],i)=>i<p.n?C(x,y,0.95,p.c):'').join(''),
 muts:p=>{const fb=i=>[HFL[i][0]-1.6,HFL[i][1]-1.6,3.2,3.2],m=[];if(p.n>0)m.push({t:'remove',p2:{...p,n:p.n-1},b:fb(p.n-1)},{t:'color',p2:{...p,c:p.c==='#f1f5f9'?'#f472b6':'#f1f5f9'},b:[103,81.4,15,4.6],easy:false});
  if(p.n<3)m.push({t:'add',p2:{...p,n:p.n+1},b:fb(p.n)});return m;}};
/* bee in front of the lawn */
K.bee={draw:p=>p.on?E(46,53.4,1.6,1.1,'#facc15')+L(45.6,52.4,45.6,54.4,'#111',0.4)+L(46.5,52.4,46.5,54.4,'#111',0.4)+E(45.8,52,1,0.7,'#e0f2fe','opacity=".8"'):'',muts:p=>[tog(p,'on',[43.8,50.7,4.6,4.4])]};
/* vegetable patch: a row of flowers at the back, vegetables in 6 cells, a bit untidy */
const PFX=[25,30.25,35.5,40.75,46];
K.fpatch={draw:p=>R(21,57,30,23.5,'#5b3a1e')+R(21,57,30,23.5,'none','stroke="#7a5233" stroke-width="0.8"')+PFX.map((x,i)=>i===4&&p.n<5?'':L(x,62.2,x,59.4,'#16a34a',0.5)+C(x,58.9,1.3,p.c[i])+C(x,58.9,0.5,'#7c2d12')).join(''),
 muts:(p,r)=>{const i=ri(r,0,p.n-1),c=p.c.slice();c[i]=other(r,c[i],['#f472b6','#facc15','#b91c1c','#a78bfa','#f1f5f9']);return[{t:'color',p2:{...p,c},b:[PFX[i]-1.9,56.9,3.8,3.8]},{t:p.n===5?'remove':'add',p2:{...p,n:p.n===5?4:5},b:[PFX[4]-1.9,56.9,3.8,5.6]}];}};
const VEG={cabbage:(x,y,c)=>C(x-1.1,y-1.6,1.6,c)+C(x+1.1,y-1.6,1.6,c)+C(x,y-2.7,1.7,c)+C(x-0.3,y-3,0.7,'#ffffff30'),
 carrot:(x,y,c,n)=>(n===1?[0]:[-1.4,1.4]).map(d=>Pg(`${x+d-0.8},${y-0.5} ${x+d+0.8},${y-0.5} ${x+d},${y+0.9}`,'#f97316')+L(x+d,y-0.5,x+d-0.9,y-3.8,'#16a34a',0.5)+L(x+d,y-0.5,x+d+0.7,y-4,'#22c55e',0.5)).join(''),
 tomato:(x,y,c)=>L(x,y,x,y-4.8,'#a16207',0.4)+E(x,y-2.6,1.9,2.2,'#15803d')+C(x-1,y-1.6,0.75,c)+C(x+1,y-2.9,0.75,c)+C(x+0.3,y-0.9,0.7,c),
 pumpkin:(x,y,c)=>E(x,y-1.4,2.6,1.5,c)+L(x,y-2.8,x+0.5,y-3.9,'#15803d',0.6)+E(x-2,y-3,1,0.6,'#16a34a'),
 lettuce:(x,y)=>E(x-1.2,y-1.4,1.4,1.2,'#a3e635')+E(x+1.2,y-1.4,1.4,1.2,'#84cc16')+E(x,y-2.4,1.5,1.3,'#bef264')};
const VEGC={cabbage:['#65a30d','#7e22ce'],tomato:['#ef4444','#facc15'],pumpkin:['#f97316','#f1f5f9']};
K.veg={draw:p=>p.t==='none'?'':G(`translate(${p.x},${p.y}) scale(1.15) translate(${-p.x},${-p.y})`,VEG[p.t](p.x,p.y,p.c,p.n)),
 muts:(p,r)=>{const b=[p.x-3.7,p.y-5.8,7.4,6.5];if(p.t==='none'){const t=pk(r,Object.keys(VEG));return[{t:'add',p2:{...p,t,c:VEGC[t]?VEGC[t][0]:'',n:2},b}];}
  const t=pk(r,Object.keys(VEG).filter(k=>k!==p.t)),m=[{t:'remove',p2:{...p,t:'none'},b},{t:'replace',p2:{...p,t,c:VEGC[t]?pk(r,VEGC[t]):'',n:2},b}];
  if(VEGC[p.t])m.push({t:'color',p2:{...p,c:VEGC[p.t].find(c=>c!==p.c)},b});if(p.t==='carrot')m.push({t:p.n===2?'remove':'add',p2:{...p,n:p.n===2?1:2},b});return m;}};
/* 0-2 birds in the sky */
K.sbirds={draw:p=>[0,1].map(i=>i<p.n?bird(p.x+i*7,p.y-i*3):'').join(''),muts:p=>{const b=i=>[p.x+i*7-0.5,p.y-i*3-2,7,3];return p.n>0?[{t:'remove',p2:{...p,n:p.n-1},b:b(p.n-1)},...(p.n<2?[{t:'add',p2:{...p,n:2},b:b(1)}]:[])]:[{t:'add',p2:{...p,n:1},b:b(0)}];}};
Object.assign(CAT,{fcat:'fence',ghouse:'house',gdoor:'house',porch:'house',mail:'path',spot:'lawn',fbox:'house',gtree:'tree',gtool:'tree',swing:'tree',bhouse:'tree',sunf:'flowers',fpatch:'patch',veg:'patch',berry:'flowers',gnome:'lawn',bath:'lawn',can:'lawn',gpond:'pond',snail:'lawn',bee:'flowers',hedge:'hedge',sbirds:'sky'});
function gardenLayout(r){const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  let bg=R(0,0,120,50,'#1e3a5f');for(let x=0;x<66;x+=6)bg+=Pg(`${x},50 ${x},37 ${x+2},35 ${x+4},37 ${x+4},50`,'#e7dcc8');bg+=R(0,40,66,1.6,'#d6c9b1')+R(0,46,66,1.6,'#d6c9b1')+R(0,50,120,40,'#4d7c3a');
  bg+=Pg('88,62 98,62 102,90 84,90','#a8a29e');for(const y of[66,72,79,86])bg+=L(89-(y-62)/7,y,97+(y-62)/7,y,'#94a3b8',0.3);
  add('raw',{s:bg},-10);add('sun',{R:true,n:pk(r,[4,5])},0);
  [[44,8,0.8],[72,6,0.7]].forEach(([x,y,s])=>add('cloud',{x,y,s,on:r()<0.7},0));add('sbirds',{x:50,y:21,n:pk(r,[0,1,2,2])},0);
  add('fcat',{on:r()<0.6,c:pk(r,['#f97316','#f1f5f9','#94a3b8']),f:r()<0.5},1);
  add('ghouse',{chim:r()<0.7,att:pk(r,['round','square']),roof:pk(r,['#7c2d12','#475569']),wall:pk(r,['#e0a95f','#c2733a','#a7b4c2'])},0);
  const wins=[[70,29],[107,29],[70,46.5],[107,46.5]].map(([x,y])=>({x,y,sz:9}));fillWins(r,wins,99,ri(r,1,2),['plant','cat']);wins.forEach(p=>add('win',p,1,'win'));
  [70,107].forEach(x=>add('fbox',{x,n:3,c:mixC(r,[0,1,2],['#f472b6','#b91c1c','#a78bfa'])},2));
  add('gdoor',{c:pk(r,DOORS),dw:r()<0.7,num:String(ri(r,2,98))},1);add('porch',{on:r()<0.6},1);const ms=r()<0.5?'r':'l';add('mail',{side:ms,up:r()<0.5,c:pk(r,['#1d4ed8','#16a34a'])},2);
  add('gtree',{ac:r()<0.8?'#ef4444':'#facc15',miss:r()<0.4?ri(r,0,5):-1},1);add('gtool',{v:pk(r,['shovel','rake','none'])},2);add('swing',{on:r()<0.85,c:pk(r,['#ef4444','#2563eb'])},2);
  add('bhouse',{hole:true,c:pk(r,['#e07a5f','#60a5fa']),bird:r()<0.4},1);
  add('sunf',{n:r()<0.75?3:2,cc:SUNF.map(()=>'#78350f')},1);add('fpatch',{n:5,c:mixC(r,[0,1,2,3,4],['#f472b6','#facc15','#b91c1c','#a78bfa'])},2);
  /* 6 vegetables at random spots in the patch (fewer if they do not fit), one spot may stay empty */
  {const vb=[];for(let t=0;t<800&&vb.length<6;t++){const x=+(25+r()*22).toFixed(1),y=+(68.8+r()*10.6).toFixed(1);if(vb.some(([a,b])=>Math.abs(a-x)<8&&Math.abs(b-y)<7))continue;vb.push([x,y]);}
   if(vb.length<5)return null;const planted=new Set(shuf(r,vb.map((_,k)=>k)).slice(0,pk(r,[3,4])));
   vb.sort((a,b)=>a[1]-b[1]).forEach(([x,y],k)=>{const t=planted.has(k)?pk(r,Object.keys(VEG)):'none';add('veg',{x,y,t,c:VEGC[t]?(r()<0.75?VEGC[t][0]:VEGC[t][1]):'',n:pk(r,[1,2])},2.5+y/1000);});}
  add('berry',{on:r()<0.8,c:pk(r,['#7c3aed','#dc2626'])},2);add('bee',{on:r()<0.6},3);
  add('gpond',{frog:r()<0.6,fl:r()<0.6,n:r()<0.5?2:1},3);add('hedge',{n:ri(r,0,3),c:pk(r,['#f1f5f9','#f472b6'])},3);
  /* lawn items: random spots between the pond and the path, never overlapping */
  ['l','r'].forEach(s=>{const v=r()<0.25?'none':pk(r,SPV[s]);add('spot',{s,v,c:SPC[v]?pk(r,SPC[v]):'',on:r()<0.6},2);});
  const blocked=[[67.5,56.5,15,10.5],[20.5,56.5,31,24.5],...(ms==='l'?[[74,66.5,10,12]]:[])],used=[];
  const hitm=(a,b,m)=>a[0]<b[0]+b[2]+m&&b[0]<a[0]+a[2]+m&&a[1]<b[1]+b[3]+m&&b[1]<a[1]+a[3]+m;
  const lawn=(kind,p,base)=>{for(let t=0;t<600;t++){const x0=24.5+r()*(60-base[2]),y0=63.8+r()*(89.6-63.8-base[3]),b=[x0,y0,base[2],base[3]];
    if(x0+base[2]>88-(y0+base[3]-62)/7-1.5)continue;if(blocked.some(o=>hitm(b,o,0.5))||used.some(o=>hitm(b,o,1.5)))continue;
    used.push(b);p.dx=+(x0-base[0]).toFixed(1);p.dy=+(y0-base[1]).toFixed(1);add(kind,p,3+(y0+base[3])/1000);return true;}return false;};
  /* for now (bigger patch): try them in random order, skip what does not fit */
  const gv=pk(r,['gnome','flamingo']);
  shuf(r,[()=>lawn('gnome',{v:gv,c:gv==='gnome'?'#dc2626':'#f472b6',f:r()<0.5},[22.5,65.2,15,19.3]),()=>lawn('bath',{n:pk(r,[0,1,1,2]),c:'#78350f'},[40.5,65,13,14.4]),
    ()=>lawn('can',{v:pk(r,['can','basket']),c:pk(r,['#16a34a','#2563eb','#dc2626']),f:r()<0.5},[53,74.5,20.5,11])]).forEach(f=>f());
  lawn('snail',{on:r()<0.7,c:'#a16207',f:r()<0.5},[39.6,82,8.8,5.6]);
  return items;}
gadd('Garden','house, apple tree with a tool, vegetable patch, lawn items at random spots, pond, hedge',r=>{for(let t=0;t<40;t++){const it=gardenLayout(r);if(it)return it;}throw new Error('garden layout failed');});

/* ================= FOREST HUT (generated) ================= */
const roundT=(x,y,s,c,c2)=>R(x-1*s,y-6*s,2*s,6*s,'#4a3222')+C(x,y-10*s,5*s,c)+C(x+1.6*s,y-12*s,2.4*s,c2);
const HAP=[[-4,-25],[3,-27],[-7,-19],[0,-20],[6,-21],[-3,-14]];
K.htree={draw:p=>R(4,30,6,36,'#5b3a1e')+C(7,22,12,DTREE)+C(0,28,6,DTREE)+C(15,28,6,DTREE)+C(10,15,5,'#33703a')+C(7,40,2.8,'#1f2937')+HAP.map(([dx,dy],i)=>i===p.miss?'':C(7+dx,47+dy,1.25,p.ac)).join('')
  +(p.owl?C(7,39.6,2.2,'#a16207')+C(6.2,39,0.7,'#fde68a')+C(7.8,39,0.7,'#fde68a')+Pg('6.6,40 7.4,40 7,40.8','#f59e0b'):''),
muts:(p,r)=>{const ab=i=>[7+HAP[i][0]-1.9,47+HAP[i][1]-1.9,3.8,3.8];const m=[{t:p.owl?'remove':'add',p2:{...p,owl:!p.owl},b:[4.4,37,5.2,4.4]},{t:'color',p2:{...p,ac:p.ac==='#ef4444'?'#facc15':'#ef4444'},b:[-1,15,17,20]}];
  if(p.miss<0){const i=ri(r,0,5);m.push({t:'remove',p2:{...p,miss:i},b:ab(i)});}else m.push({t:'add',p2:{...p,miss:-1},b:ab(p.miss)});return m;}};
K.squir={draw:p=>p.on?`<path d="M12.6 54.5 q4 -1 3 -5 q-1 -2 -2.5 0" stroke="${p.c}" stroke-width="1.6" fill="none"/>`+E(12,52,1.4,2.2,p.c)+C(11.6,49.4,1,p.c)+Pg('11.2,48.6 11.5,47.5 12,48.5',p.c):'',
 muts:p=>p.on?[{t:'remove',p2:{...p,on:false},b:[10,47,7,9]},{t:'color',p2:{...p,c:p.c==='#c2410c'?'#78716c':'#c2410c'},b:[10,47,7,9]}]:[{t:'add',p2:{...p,on:true},b:[10,47,7,9]}]};
K.smoke={draw:p=>R(62,17,6,14,'#78716c')+[[65,13,2.4],[67,8,3],[70,3.4,3.3]].map(([x,y,rr],i)=>i<p.n?C(x,y,rr,'#cbd5e1','opacity=".7"'):'').join(''),
 muts:p=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[66.2,0,7.4,7],easy:false}]};
K.moss={draw:p=>p.on?[[66.2,28.6,1.5],[68.6,30.2,1.8],[71.1,32.1,1.6],[73.4,33.8,1.3]].map(([x,y,rr])=>C(x,y,rr,'#4d7c3a')+C(x-0.3,y-0.5,rr*0.5,'#65a30d')).join(''):'',muts:p=>[{...tog(p,'on',[64.2,26.6,10.6,9]),easy:false}]};
K.rbird={draw:p=>p.on?E(50,26.4,1.6,1,'#78350f')+C(51.4,25.6,0.8,'#78350f')+Pg('52.1,25.5 53,25.7 52.1,25.9','#f59e0b'):'',muts:p=>[tog(p,'on',[47.8,24.2,5.8,3.6])]};
K.hwin={draw:p=>R(44,46,12,9,'#fde68a')+L(50,46,50,55,'#7a4e25',0.6)+L(44,50.5,56,50.5,'#7a4e25',0.6)+(p.cur?R(44,46,2.5,9,p.cc)+R(53.5,46,2.5,9,p.cc):'')+(p.cat?E(48,54.2,1.8,0.9,'#111')+C(48.4,52.6,1,'#111')+Pg('47.7,52 47.9,50.9 48.4,51.8','#111')+Pg('48.6,51.8 49,50.9 49.2,52','#111')+'<path d="M46.4 54.4 q-1.3 -0.4 -0.9 -2.3" stroke="#111" stroke-width="0.45" fill="none" stroke-linecap="round"/>':''),
 muts:(p,r)=>[p.cur?{t:'color',p2:{...p,cc:other(r,p.cc,['#dc2626','#2563eb','#16a34a','#f1f5f9'])},b:[43.6,45.6,12.8,9.6]}:{t:'add',p2:{...p,cur:true},b:[43.6,45.6,12.8,9.6]},{t:p.cat?'remove':'add',p2:{...p,cat:!p.cat},b:[45,50.4,5,4.8]}]};
const HFX=[45.5,48.5,51.5,54.5];
K.hflow={draw:p=>HFX.map((x,i)=>i===3&&p.n<4?'':C(x,56.6,1.1,p.c[i])).join('')+R(43,57,14,2.5,'#5b3a1e'),
 muts:(p,r)=>{const i=ri(r,0,p.n-1),c=p.c.slice();c[i]=other(r,c[i],['#f472b6','#facc15','#b91c1c','#a78bfa','#f1f5f9']);return[{t:'color',p2:{...p,c},b:[HFX[i]-1.5,55.3,3,2.4]},{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:[53,55.3,3,2.4]}];}};
K.hdoor={draw:p=>R(64,50,10,18,'#5b3a1e')+(p.dw?C(69,55,2,'#fde68a'):'')+C(72.3,60,0.6,'#fbbf24')+R(63,68,12,1.4,p.mat),
 muts:(p,r)=>[{t:p.dw?'remove':'add',p2:{...p,dw:!p.dw},b:[66.5,52.5,5,5]},{t:'color',p2:{...p,mat:other(r,p.mat,['#b91c1c','#2563eb','#facc15','#16a34a'])},b:[62.5,67.5,13,2.4]}]};
K.lant={draw:p=>L(77.5,48,77.5,50,'#1f2937',0.4)+R(76,50,3,4.5,'#1f2937','rx="0.5"')+R(76.6,50.8,1.8,3,p.on?'#fde68a':'#475569'),muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[75.5,47.5,4,7.5]}]};
const LOGS=[[88,66],[93,66],[98,66],[90.5,61.5],[95.5,61.5],[100.5,61.5],[93,57],[98,57]];
K.wood={draw:p=>LOGS.map(([x,y],i)=>i===p.miss?'':C(x,y,2.4,'#a16207')+C(x,y,1.2,'#d6a35a')).join(''),muts:(p,r)=>{const i=p.miss>=0?p.miss:pk(r,[6,7]);return[{t:p.miss>=0?'add':'remove',p2:{...p,miss:p.miss>=0?-1:i},b:[LOGS[i][0]-2.7,LOGS[i][1]-2.7,5.4,5.4]}];}};
const axe2=f=>flip(24,L(21.4,62.1,27,62.1,'#3f2a1d',0.7)+L(24.6,59.4,33.4,56.8,'#a16207',0.9)+C(33.5,56.8,0.55,'#a16207')+Pg('23,60.2 25.6,60.2 26.7,62 21.9,62','#cbd5e1')+R(22.9,58.4,2.8,1.9,'#64748b','rx="0.3"'),f);
const split=x=>Pg(`${x},61.9 ${x+3.2},61.9 ${x+2.5},58.3 ${x+0.4},58.6`,'#f5deb3')+L(x+0.4,58.6,x,61.9,'#4a3222',0.8);
K.stump={draw:p=>R(19,62,10,6,'#78350f')+E(24,62,5,1.5,'#d6a35a')+(p.v==='axe'?axe2(p.f):p.v==='logs'?split(20.6)+(p.n>1?split(24.6):''):''),
 muts:p=>{const ab=f=>f?[14,56,11.4,6.4]:[22.6,56,11.4,6.4],axb=U(ab(false),ab(true)),lb=[20,57.8,8.4,4.6];if(p.v==='none')return[{t:'add',p2:{...p,v:'axe'},b:ab(p.f)}];
  if(p.v==='axe')return[{t:'flip',p2:{...p,f:!p.f},b:axb},{t:'remove',p2:{...p,v:'none'},b:ab(p.f)},{t:'replace',p2:{...p,v:'logs',n:2},b:U(ab(p.f),lb)}];
  return[{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[24.2,57.8,4.2,4.6]},{t:'replace',p2:{...p,v:'axe'},b:U(ab(p.f),lb)}];}};
K.deer={draw:p=>flip(111,E(110,58,4,2,'#a16207')+L(107.5,59.5,107.5,63,'#a16207',0.7)+L(112.5,59.5,112.5,63,'#a16207',0.7)+Pg('112.5,57 114.5,52.5 116,53 114,57.5','#a16207')+E(115.5,52.4,1.6,1,'#a16207')+C(106.3,57.4,0.8,'#f1f5f9')
  +(p.ant?`<path d="M114.6 51.6 l-1 -3 M114 49.8 l-1.5 -0.6 M115.8 51.6 l1 -3 M116.4 49.8 l1.4 -0.6" stroke="#78350f" stroke-width="0.5" fill="none"/>`:''),p.f),
 muts:p=>[{t:p.ant?'remove':'add',p2:{...p,ant:!p.ant},b:p.f?[103,47.5,6,5]:[113,47.5,6,5]},{t:'flip',p2:{...p,f:!p.f},b:[104,47.5,14,16]}]};
K.sign={draw:p=>R(111.2,73,1.6,15,'#78350f')+(p.l?Pg('107,72 117,72 117,77 107,77 104.5,74.5','#a16207'):Pg('107,72 117,72 119.5,74.5 117,77 107,77','#a16207'))+T(112,75.3,2.6,'#fef3c7',p.txt),
 muts:(p,r)=>[{t:'flip',p2:{...p,l:!p.l},b:[104,71.5,16,6]},{t:'text',p2:{...p,txt:pk(r,['TRAIL','LAKE','HILL','FARM'].filter(t=>t!==p.txt))},b:[106.5,72,11,5]}]};
K.barrow={draw:p=>Pg('88,74 102,74 100,79 90,79','#64748b')+C(89,80.5,2.2,'#1f2937')+L(102,75,106,78,'#78350f',0.7)+L(99,79,99,82,'#78350f',0.6)+C(92,72.6,2.4,p.c)+R(91.6,69.6,0.8,1,'#16a34a')+(p.n>1?C(97,72.8,2.2,p.c)+R(96.6,70,0.8,1,'#16a34a'):''),
 muts:p=>[{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[94.5,69.5,5,5.6]},{t:'color',p2:{...p,c:p.c==='#f97316'?'#facc15':'#f97316'},b:[89.3,69.4,10.5,6]}]};
const STN=[[67,72,4],[63,77,4.5],[67,83,5],[63,88,5]];
K.stones={draw:p=>STN.map(([x,y,rx],i)=>i>=p.n?'':E(x,y,rx,1.7,'#a8a29e')).join(''),muts:p=>[{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:[57.5,85.8,11,4.2]}]};
const mush=(x,y,c,dots)=>R(x-0.8,y-3,1.6,3,'#f1f5f9')+Pa(`M${x-3} ${y-3} a3 2.6 0 0 1 6 0 Z`,c)+(dots?C(x-1.2,y-4,0.5,'#f1f5f9')+C(x+1,y-4.4,0.5,'#f1f5f9')+C(x,y-3.4,0.4,'#f1f5f9'):'');
const MSH=[[8,81],[14,84],[20,87.5]];
K.mush={draw:p=>MSH.map(([x,y],i)=>mush(x,y,p.c[i],p.d[i])).join(''),
 muts:(p,r)=>{const i=ri(r,0,2),mb=[MSH[i][0]-3.4,MSH[i][1]-6.2,6.8,6.4],a=(k,v)=>{const q=p[k].slice();q[i]=v;return{...p,[k]:q};};return[{t:p.d[i]?'remove':'add',p2:a('d',!p.d[i]),b:mb,easy:false},{t:'color',p2:a('c',p.c[i]==='#dc2626'?'#a16207':'#dc2626'),b:mb}];}};
K.animal={draw:p=>p.v==='fox'?flip(33,E(34,81,5,2.5,'#ea580c')+Pg('38,80 42,78 41.5,82','#ea580c')+C(41,79.5,0.4,'#111')+Pg('39,79 39.8,77 40.5,79','#ea580c')+E(28,80,3.5,1.6,'#ea580c','transform="rotate(-20 28 80)"')+(p.tip?C(25.4,79,1.1,'#f1f5f9'):'')+L(31.5,83,31.5,85,'#1f2937',0.7)+L(36.5,83,36.5,85,'#1f2937',0.7),p.f)
  :flip(33,E(32,82,3.5,2.6,'#a8a29e')+C(34.8,79.6,1.8,'#a8a29e')+(p.tip?E(34.2,76.4,0.7,2.2,'#a8a29e')+E(35.6,76.6,0.7,2.2,'#a8a29e'):'')+C(29,82.5,1,'#f1f5f9'),p.f),
 muts:p=>{const tb=p.v==='fox'?(p.f?[39,77.4,3.2,3.2]:[23.8,77.4,3.2,3.2]):(p.f?[29.4,73.8,3.4,5.4]:[33.2,73.8,3.4,5.4]);return[{t:p.tip?'remove':'add',p2:{...p,tip:!p.tip},b:tb},{t:'flip',p2:{...p,f:!p.f},b:[23.5,73.5,19,12]}];}};
const PCH=[[4,'#f472b6'],[7,'#facc15'],[10,'#b91c1c'],[13,'#a78bfa']];
K.patch={draw:p=>PCH.map(([x],i)=>i===3&&p.n<4?'':L(x,74,x,72,'#16a34a',0.4)+C(x,72,1.1,p.c[i])).join(''),
 muts:(p,r)=>{const i=ri(r,0,p.n-1),c=p.c.slice();c[i]=other(r,c[i],['#f472b6','#facc15','#b91c1c','#a78bfa','#f1f5f9']);return[{t:'color',p2:{...p,c},b:[PCH[i][0]-1.5,70.5,3,3]},{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:[11.5,70.5,3,4]}];}};
K.bfly={draw:p=>[[28.6,69.4,1.5,1.1],[31.4,69.4,1.5,1.1],[28.9,71,1,0.8],[31.1,71,1,0.8]].map(a=>E(...a,p.c)).join('')+R(29.8,68.6,0.4,3,'#1f2937'),muts:p=>[{t:'color',p2:{...p,c:near(p.c)},b:[26.6,67.8,6.8,4.4]}]};
const SNOW=[['17,25.4 22,20 27,25.4 22,23.5',[16.5,19.5,11,6.4]],['72,20.3 78,14 84,20.3 78,18',[71.5,13.5,13,7.3]],['111,32 115,28 119,32 115,30.5',[110.5,27.5,9,5]]];
K.snow={draw:p=>SNOW.map(([pts],i)=>p.on[i]?Pg(pts,'#e2e8f0'):'').join(''),muts:(p,r)=>{const i=ri(r,0,2),on=p.on.slice();on[i]=!on[i];return[{t:p.on[i]?'remove':'add',p2:{...p,on},b:SNOW[i][1]}];}};
K.mtree={draw:p=>p.t==='round'?roundT(p.x,57,p.s*1.1,'#24563a','#2f6b45'):pine2(p.x,57,p.s,'#24563a','#2f6b45'),
 muts:p=>p.sw?[{t:'replace',p2:{...p,t:p.t==='round'?'pine':'round'},b:[p.x-5.5*p.s,57-17*p.s,11*p.s,10*p.s]}]:[]};
const HIB={axe:[2.8,-18,5.6,15.6],bucket:PB.bucket,lantern:[3.2,-9.2,3.4,6.2]};
K.hiker={draw:p=>{const o=p.o;let ex='';
  if(o.btn){const bc=['#f1f5f9','#facc15'].includes(o.shirt)?'#1f2937':'#f1f5f9';(o.btn===4?[-16.4,-14.4,-12.4,-10.4]:[-16,-13.4,-10.8]).forEach(y=>ex+=C(0,y,0.45,bc));}
  if(o.hitem==='lantern')ex+=L(4.9,-8.6,4.9,-7.2,'#1f2937',0.4)+R(3.6,-7.2,2.6,3.4,'#1f2937','rx="0.4"')+R(4.1,-6.6,1.6,2.2,'#fde68a');
  if(o.hitem==='axe')ex+=L(5.5,-2.8,4.3,-15.6,'#a16207',0.6)+Pa('M4.3 -16.4 h1.6 l1.7 -1.1 q0.8 2.1 0 4.2 l-1.7 -1.1 h-1.6 Z','#cbd5e1')+R(3.1,-16.4,1.3,2,'#64748b')+C(4.9,-8.6,1,o.skin);
  return person(p.x,p.y,p.s,{...o,item:o.hitem==='bucket'?'bucket':''})+G(`translate(${p.x},${p.y}) scale(${p.s})`,ex);},
 muts:(p,r)=>{const o=p.o,m=[],b=k=>pb(p.x,p.y,p.s,k),set=(t,ch,k,x={})=>m.push({t,p2:{...p,o:{...o,...ch}},b:b(k),...x});
  if(o.hair==='#eab308')set(o.glasses?'remove':'add',{glasses:o.glasses?0:1},PB.glasses);
  if(o.hat){set('remove',{hat:''},PB.hat);set('color',{hcol:hatCol(r,o,o.hcol)},PB.hat);}else set('add',{hat:'cap',hcol:hatCol(r,o)},PB.hat);
  set('color',{shirt:other(r,o.shirt,SHIRTS)},PB.shirt);set('color',{pants:grpOther(r,o.pants,PANTG)},PB.pants);
  if(o.btn)set(o.btn===4?'remove':'add',{btn:o.btn===4?3:4},[-1.2,-17.2,2.4,7.6],{easy:false});
  if(o.hitem){const nx=pk(r,Object.keys(HIB).filter(k=>k!==o.hitem));m.push({t:'replace',p2:{...p,o:{...o,hitem:nx}},b:U(b(HIB[o.hitem]),b(HIB[nx]))});set('remove',{hitem:''},HIB[o.hitem]);}
  return m;}};
Object.assign(CAT,{snow:'sky',sbirds:'sky',mtree:'trees',hiker:'people'});
Object.assign(CAT,{htree:'tree',squir:'tree',smoke:'hut',moss:'hut',rbird:'hut',hwin:'hut',hflow:'hut',hdoor:'hut',lant:'hut',wood:'yard',stump:'yard',deer:'animals',sign:'yard',barrow:'yard',stones:'path',mush:'ground',animal:'animals',patch:'ground',bfly:'animals'});
gadd('Forest hut','round and pointed trees, apple tree with an owl, hiker, animals',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  let bg=R(0,0,120,90,'#1e3a5f')+Pg('-10,54 22,20 54,54','#3b4f6b')+Pg('40,54 78,14 116,54','#334861')+Pg('90,54 115,28 140,54','#3b4f6b');
  for(let x=-2;x<124;x+=5.5){const s=0.75+r()*0.45;bg+=r()<0.4?roundT(x,54,s*0.9,'#1a3a29','#21452f'):pine2(x,54,s,'#1a3a29','#21452f');}
  bg+=R(0,52,120,38,'#3f6b35');
  add('raw',{s:bg},-10);add('snow',{on:[r()<0.9,r()<0.9,r()<0.9]},-9.8);
  for(const[x,sc]of[[23.5,1.1],[31,1.0],[88,1.5],[97.5,1.05]])add('mtree',{x,s:sc,t:r()<0.5?'round':'pine'},-9.5,'mtree');
  bg='';for(let i=0;i<7;i++)bg+=R(38,38+i*4.3,44,4.3,i%2?'#8b5a2b':'#7a4e25')+C(38,40.15+i*4.3,2,'#a16207')+C(82,40.15+i*4.3,2,'#a16207');
  add('raw',{s:bg},-9);add('sbirds',{x:44,y:11,n:pk(r,[0,1,2,2])},0);
  [[30,9,0.8],[96,14,0.6]].forEach(([x,y,s])=>add('cloud',{x,y,s,on:r()<0.7},0));
  add('smoke',{n:r()<0.6?3:2},0);add('raw',{s:Pg('33,40 60,20 87,40','#4a3222')},1);add('rbird',{on:r()<0.5},2);
  add('htree',{ac:r()<0.8?'#ef4444':'#facc15',miss:r()<0.4?ri(r,0,5):-1,owl:r()<0.6},1);add('squir',{on:r()<0.6,c:'#c2410c'},2);
  add('deer',{ant:true,f:r()<0.4},1);
  add('hwin',{cur:r()<0.8,cc:pk(r,['#dc2626','#2563eb']),cat:r()<0.4},2);add('hflow',{n:4,c:mixC(r,[0,1,2,3],['#f472b6','#facc15','#b91c1c','#a78bfa'])},3);
  add('hdoor',{dw:r()<0.7,mat:pk(r,['#b91c1c','#2563eb'])},2);add('lant',{on:r()<0.7},2);
  add('wood',{miss:r()<0.35?pk(r,[6,7]):-1},2);const sv=pk(r,['axe','axe','logs','logs','none']);add('stump',{v:sv,f:r()<0.5,n:ri(r,1,2)},2);
  add('sign',{l:r()<0.5,txt:pk(r,['TRAIL','LAKE','HILL'])},2);add('barrow',{n:r()<0.6?2:1,c:'#f97316'},2);
  add('stones',{n:r()<0.7?4:3},2);add('mush',{c:mixC(r,MSH,['#dc2626','#dc2626','#a16207']),d:MSH.map(()=>r()<0.6)},3);
  {const av=pk(r,['fox','rabbit']);add('animal',{v:av,tip:true,f:r()<0.5},3);}add('patch',{n:r()<0.7?4:3,c:PCH.map(([,c])=>c)},3);add('bfly',{c:pk(r,['#facc15','#60a5fa','#f472b6'])},3);
  const w=wardrobe(r,{noItem:true,noDog:true});
  add('hiker',{x:50,y:86,s:0.75,o:{skin:w.skin,hair:w.hair,shoes:w.shoes,shirt:pk(r,SHIRTS),pants:pk(r,PANTS),hat:w.hat,hcol:w.hcol,glasses:w.hair==='#eab308'&&r()<0.6?1:0,btn:pk(r,[0,3,4,4,4]),
    hitem:pk(r,sv==='axe'?['bucket','lantern']:['axe','axe','bucket','lantern'])}},4);
  /* a midground tree can swap round <-> pointed only where its box is free */
  const hitb=(a,b)=>a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3];
  const others=items.filter(it=>it.kind!=='mtree'&&K[it.kind].muts).flatMap(it=>[1,2,3,4,5,6,7,8].flatMap(k=>K[it.kind].muts(it.p,rnd(k)).map(m=>m.b)));
  items.filter(it=>it.kind==='mtree').forEach(it=>{const p=it.p;p.sw=!others.some(o=>hitb([p.x-5.5*p.s,57-17*p.s,11*p.s,10*p.s],o));});
  return items;});

/* ================= AQUARIUM (generated) ================= */
K.fish=placed({box:p=>[-10.5,-7,21,13],
 draw:p=>E(0,0,6,3.6,p.c)+(p.tail===false?'':Pg('-5.5,0 -10,-3.5 -10,3.5',p.c))+C(3.5,-0.8,0.8,'#111')+(p.pat==='stripes'?R(-1.5,-3.2,1.4,6.4,p.c==='#f1f5f9'?'#1f2937':'#f1f5f9')+R(1,-3.4,1.2,6.8,p.c==='#f1f5f9'?'#1f2937':'#f1f5f9'):p.pat==='dots'?C(-1,-1,0.8,'#1f2937')+C(1,1.2,0.8,'#1f2937')+C(-2.5,1,0.7,'#1f2937'):'')+(p.fin?Pg('-2.6,-3 2.4,-3.3 -3,-6.6',p.c):''),
 muts:(p,r)=>{const b=[-6.5,-4,13,8],all=[-10.5,-4.2,17,8.4],m=[{t:'flip',p2:{...p,m:-(p.m||1)},b:all},{t:'color',p2:{...p,c:other(r,p.c,FISHC)},b:all}];
  if(p.pat==='none')m.push({t:'add',p2:{...p,pat:pk(r,['stripes','dots'])},b,easy:false});else m.push({t:'replace',p2:{...p,pat:p.pat==='dots'?'stripes':'dots'},b,easy:false},{t:'remove',p2:{...p,pat:'none'},b,easy:false});
  m.push({t:p.fin?'remove':'add',p2:{...p,fin:!p.fin},b:[-3.6,-7,6.6,4.2]});if(p.tail!==false)m.push({t:'remove',p2:{...p,tail:false},b:[-10.6,-4.2,5.6,8.4]});return m;}});
const FISHC=['#f97316','#facc15','#60a5fa','#f472b6','#4ade80','#ef4444','#a78bfa','#f1f5f9'];
K.castle={draw:p=>R(10,64,22,18,'#a8a29e')+R(8,56,7,26,'#a8a29e')+R(27,56,7,26,'#a8a29e')+[8,10.8,13.2,27,29.8,32.2].map(x=>R(x,54.5,1.8,1.8,'#a8a29e')).join('')+Pa('M17 82 v-8 a4 4 0 0 1 8 0 v8 Z','#1f2937')+R(10.5,60,2,3,'#1f2937')+(p.tw?R(29.5,60,2,3,'#1f2937'):'')
  +L(11.5,54.5,11.5,50.8,'#e5e7eb',0.4)+(p.fl?Pg('11.5,50.8 7.5,52 11.5,53.2',p.fc):Pg('11.5,50.8 15.5,52 11.5,53.2',p.fc))+(p.f2?L(30.5,54.5,30.5,50.8,'#e5e7eb',0.4)+(p.fl?Pg('30.5,50.8 26.5,52 30.5,53.2',p.fc):Pg('30.5,50.8 34.5,52 30.5,53.2',p.fc)):''),
 muts:(p,r)=>{const fb=p.f2?U([7,50.3,9,3.4],[26,50.3,9,3.4]):[7,50.3,9,3.4];return[tog(p,'tw',[29,59.5,3,4]),{t:'color',p2:{...p,fc:near(p.fc)},b:fb},{t:'flip',p2:{...p,fl:!p.fl},b:fb},tog(p,'f2',[26,50.3,8.4,4.4])];}};
K.chest={draw:p=>R(86,74,12,8,'#92400e')+Pa('M86 74 l1 -3.5 h10 l1 3.5 Z',p.lc)+[89,92,95].map((x,i)=>i===2&&p.n<3?'':C(x,73.4-(i===1?0.4:0),1,p.mt)).join('')+(p.lock?R(91,76,2,2,'#facc15'):''),
 muts:(p,r)=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[93.6,71.6,2.8,2.8]},{t:'color',p2:{...p,lc:p.lc==='#451a03'?'#1e3a8a':'#451a03'},b:[85.5,70,13,4.5]},tog(p,'lock',[90.5,75.5,3,3]),{t:'color',p2:{...p,mt:p.mt==='#facc15'?'#cbd5e1':'#facc15'},b:[87.4,71.8,9.2,2.8],easy:false}]};
K.diver={draw:p=>C(66,58,3,'#cbd5e1')+C(66,58,1.6,p.mc)+R(63,61,6,8,p.c,'rx="1"')+R(63.2,69,2.4,6,'#1f2937')+R(66.4,69,2.4,6,'#1f2937')+Pg('62.5,75 66,75 64,77','#111')+Pg('66,75 69.5,75 68,77','#111')+(p.tank?R(69,61,2,6,'#94a3b8','rx="0.8"'):''),
 muts:(p,r)=>[tog(p,'tank',[68.5,60.5,3,7]),{t:'color',p2:{...p,c:near(p.c)},b:[62.5,60.5,7,9]},{t:'color',p2:{...p,mc:p.mc==='#0ea5e9'?'#facc15':'#0ea5e9'},b:[63.8,55.8,4.4,4.4]}]};
K.bubs={draw:p=>[[66,52,1.1],[67,47,0.9],[65.5,43,0.7]].map(([x,y,rr],i)=>i<p.n?C(x,y,rr,'none','stroke="#bae6fd" stroke-width="0.4"'):'').join(''),muts:p=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[63.8,41.3,3.4,3.4]}]};
const WEED=[[38,30],[47,24],[104,34],[112,26]];
K.weed={draw:p=>{const[x,hh]=WEED[p.i];return`<path d="M${x} 82 q-3 -${hh/4} 0 -${hh/2} q3 -${hh/4} 0 -${hh/2}" stroke="${p.c}" stroke-width="2" fill="none"/>`+(p.lf?E(x+2,82-hh*0.55,1.8,0.8,p.c):'');},
 muts:p=>{const[x,hh]=WEED[p.i];return[{...tog(p,'lf',[x+0.2,82-hh*0.55-1.2,3.6,2.4])},{t:'color',p2:{...p,c:p.c==='#22c55e'?'#15803d':'#22c55e'},b:[x-3,82-hh,6,hh],easy:false}];}};
K.jelly={draw:p=>Pa('M36 16 a4 4 0 0 1 8 0 Z',p.c,'opacity=".85"')+(p.n===4?[37,39,41,43]:[38,40,42]).map(x=>`<path d="M${x} 16 q-1 3 0 6" stroke="${p.c}" stroke-width="0.4" fill="none"/>`).join(''),
 muts:p=>[{t:p.n===4?'remove':'add',p2:{...p,n:p.n===4?3:4},b:[36.4,15.5,7.2,7]},{t:'color',p2:{...p,c:near(p.c)},b:[35.5,11.5,9,11]}]};
K.horse={draw:p=>flip(114,E(114,30,1.6,3.5,p.c)+E(115.8,26.2,2,1.2,p.c)+Pg('117.4,25.8 119,26.4 117.4,26.9',p.c)+`<path d="M113.5 33 q-1 3.5 1.5 3.5 q1.5 -1 0 -2" stroke="${p.c}" stroke-width="1" fill="none"/>`+C(116,25.8,0.35,'#111'),p.f),
 muts:p=>[{t:'flip',p2:{...p,f:!p.f},b:[108.5,24.5,11,13]},{t:'color',p2:{...p,c:near(p.c)},b:[108.5,24.5,11,13]}]};
K.gsnail={draw:p=>p.on?E(108,12,3,0.8,'#d6d3d1')+C(108,10,2,'#a16207')+C(108,10,0.9,'#78350f'):'',muts:p=>[tog(p,'on',[104.5,7.5,7,6])]};
K.sfish={draw:p=>Pg('56,80.5 57,83 59.6,83.2 57.6,84.8 58.4,87.4 56,86 53.6,87.4 54.4,84.8 52.4,83.2 55,83',p.c),muts:p=>[{t:'color',p2:{...p,c:near(p.c)},b:[52,80,8,8]}]};
NEARC['#fb7185']='#f97316';
K.crab={draw:p=>E(76,84,3,1.8,p.c)+(p.cl?C(72,82,1.2,p.c)+C(80,82,1.2,p.c):'')+L(73.5,85,71.5,87,p.c,0.5)+L(78.5,85,80.5,87,p.c,0.5)+C(75,82.5,0.4,'#111')+C(77,82.5,0.4,'#111'),
 muts:p=>[{t:p.cl?'remove':'add',p2:{...p,cl:!p.cl},b:[70.5,80.5,11,3]},{t:'color',p2:{...p,c:near(p.c)},b:[70.5,80.5,11,7]}]};
K.shells={draw:p=>Pa('M30 88 a2.5 2.5 0 0 1 5 0 Z','#fda4af')+(p.n>1?Pa('M37 88 a2 2 0 0 1 4 0 Z','#f1f5f9'):''),muts:p=>[{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:[36.5,85.5,5,3]}]};
Object.assign(CAT,{fish:'fish',castle:'castle',chest:'bottom',diver:'diver',bubs:'diver',weed:'plants',jelly:'creatures',horse:'creatures',gsnail:'creatures',sfish:'bottom',crab:'bottom',shells:'bottom'});
gadd('Aquarium','6 fish placed at random, castle, diver, creatures; plain sand',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  add('raw',{s:R(0,0,120,90,'#0e4a6e')+R(0,0,120,3,'#1e6a96')+Pg('20,3 30,3 50,80 34,80','#ffffff','opacity=".03"')+Pg('70,3 78,3 96,80 84,80','#ffffff','opacity=".03"')+R(0,80,120,10,'#d6b77a')},-10);
  add('castle',{tw:true,f2:r()<0.5,fc:pk(r,['#ef4444','#facc15']),fl:r()<0.5},1);add('chest',{n:r()<0.7?3:2,lc:'#451a03',lock:r()<0.8,mt:pk(r,['#facc15','#facc15','#cbd5e1'])},1);
  add('diver',{tank:true,c:pk(r,['#f59e0b','#ef4444']),mc:'#0ea5e9'},1);add('bubs',{n:r()<0.7?3:2},1);
  WEED.forEach((w,i)=>add('weed',{i,c:pk(r,['#22c55e','#15803d']),lf:r()<0.5},0,'weed'));
  add('jelly',{n:4,c:'#f0abfc'},1);add('horse',{f:r()<0.5,c:pk(r,['#fbbf24','#f97316'])},1);add('gsnail',{on:r()<0.6},1);
  add('sfish',{c:pk(r,['#fb7185','#fde68a'])},1);add('crab',{cl:true,c:'#ef4444'},1);add('shells',{n:r()<0.6?2:1},1);
  const boxes=[[6,49,30,34],[84,69,16,14],[61,40,12,38],[34,10,12,14],[107,22,14,16],[103,6,10,8],[33,50,19,32],[100,46,16,36],[0,78,120,12]];
  const hit=(a,b)=>a[0]<b[0]+b[2]+2&&b[0]<a[0]+a[2]+2&&a[1]<b[1]+b[3]+2&&b[1]<a[1]+a[3]+2;
  const cols=shuf(r,FISHC);for(let k=0;k<6;k++)for(let t=0;t<300;t++){const p={x:+(11+r()*98).toFixed(1),y:+(8+r()*64).toFixed(1),s:pk(r,[0.7,0.8,0.9,1]),m:r()<0.5?1:-1,c:cols[k],pat:pk(r,['stripes','dots','none']),fin:r()<0.5,tail:true};
    const b=K.fish.box(p);if(b[0]<1||b[0]+b[2]>119||b[1]<4||b[1]+b[3]>79||boxes.some(o=>hit(b,o)))continue;boxes.push(b);add('fish',p,2);break;}
  return items;});
