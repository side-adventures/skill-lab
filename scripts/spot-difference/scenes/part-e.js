/* ================= WINTER VILLAGE v2 ================= */
const SNW='#f8fafc',SNO='stroke="#94a3b8" stroke-width="0.4"';
const star5=(x,y,r,c)=>Pg(Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*0.45:r;return`${(x+rr*Math.cos(a)).toFixed(2)},${(y+rr*Math.sin(a)).toFixed(2)}`;}).join(' '),c);
/* colors that must not look alike (scarf vs jacket, gloves vs jacket and skis): hue at least 45 degrees apart; whites/greys only clash with each other */
const hsl=c=>{const n=parseInt(hex6(c).slice(1,7),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0;
  if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360;}return[h,d?d/(1-Math.abs(2*l-1)):0,l];};
const clash=(a,b)=>{const[h1,s1,l1]=hsl(a),[h2,s2,l2]=hsl(b),g1=s1<0.25||l1>0.9,g2=s2<0.25||l2>0.9;if(g1||g2)return g1&&g2&&Math.abs(l1-l2)<0.35;const dh=Math.abs(h1-h2);return Math.min(dh,360-dh)<45;};
/* `old`: the colour being changed (the new one must also stay different under colour blindness) */
const apart=(r,pal,avoid,old)=>{const o=pal.filter(c=>avoid.every(a=>!a||!clash(c,a)));const c=o.length?o:pal;return pk(r,old?cvdPrefer(c,old):c);};
const SCARF=['#dc2626','#2563eb','#16a34a','#facc15','#f1f5f9','#7c3aed'],GLV=['#dc2626','#2563eb','#16a34a','#facc15','#7c3aed','#f472b6','#f1f5f9'];

/* Santa in his sleigh (beard, red coat and hat, sack), 1 or 2 reindeer; only the leading one can have a red nose */
const RDC='#c49a6c';
const rein=(x,y,nose)=>L(x-2,y-2.6,x-3.4,y-0.6,RDC,0.55)+L(x-1,y-2.6,x-1.6,y-0.4,RDC,0.55)+L(x+1.2,y-2.6,x+2.4,y-0.8,RDC,0.55)+L(x+2,y-2.6,x+3.4,y-1,RDC,0.55)
  +E(x,y-3.4,2.9,1.35,RDC)+Pg(`${x+1.8},${y-4.2} ${x+3},${y-6.4} ${x+4},${y-5.8} ${x+2.8},${y-3.6}`,RDC)+E(x+3.9,y-6.4,1.4,0.85,RDC)+C(x-2.8,y-3.8,0.5,SNW)
  +`<path d="M${x+3.4} ${y-7} l-0.6 -1.8 l-0.9 -0.4 M${x+2.9} ${y-8} l0.3 -0.9 M${x+4.2} ${y-7} l0.5 -1.7 l0.9 -0.3" stroke="#5b3a1e" stroke-width="0.35" fill="none"/>`
  +C(x+5.2,y-6.3,0.62,nose?'#ef4444':'#3f2a1d')+C(x+3.9,y-6.8,0.25,'#111');
K.sleigh={draw:p=>{const x=p.x,y=p.y;let s='';
  if(p.sack)s+=Pa(`M${x-1.6} ${y-5} q-0.6 -3.6 1.8 -4.4 q2.2 0.8 1.4 4.4 Z`,'#a16207')+L(x-0.6,y-9.2,x+0.8,y-9.6,'#78350f',0.4);
  s+=R(x+1.4,y-8.6,4.2,4.4,'#dc2626','rx="1.2"')+R(x+1.4,y-5.6,4.2,0.7,'#111827')+C(x+3.5,y-10,1.35,'#f1c27d')+Pa(`M${x+2.1} ${y-9.9} q1.4 3.4 2.8 0 Z`,SNW)
   +(p.hat?Pg(`${x+2},${y-10.7} ${x+5},${y-10.7} ${x+6.2},${y-13}`,'#dc2626')+R(x+1.9,y-11.2,3.2,0.9,SNW,'rx="0.4"')+C(x+6.3,y-13.1,0.6,SNW):Pa(`M${x+2.15} ${y-10.3} a1.35 1.35 0 0 1 2.7 0 Z`,SNW))
   +L(x+5,y-7.4,x+8,y-6.4,'#dc2626',1)+C(x+8.2,y-6.3,0.6,'#111827');
  s+=Pa(`M${x-0.6} ${y-5.6} q0 3 1 5.6 h9.6 l1.6 -4.2 h-1.6 l-1 1.2 h-7.6 l-0.4 -2.6 Z`,'#b91c1c')+`<path d="M${x-1.6} ${y+0.7} h12.8 q1.6 0 1.6 -1.6" stroke="#facc15" stroke-width="0.5" fill="none"/>`
   +L(x+0.8,y+0.1,x+0.8,y+0.7,'#facc15',0.4)+L(x+8.8,y+0.1,x+8.8,y+0.7,'#facc15',0.4);
  if(p.dec==='dots')[1.8,4.3,6.8,9.2].forEach(dx=>s+=C(x+dx,y-2.1,0.6,'#facc15'));else s+=R(x+0.4,y-2.45,10,0.7,'#facc15');
  s+=L(x+11,y-3,p.two?x+30.2:x+21.6,p.two?y-3.6:y-3.3,'#78350f',0.3)+rein(x+17.4,y,false);return p.two?s+rein(x+26,y,p.rn):s;},
 muts:(p,r)=>{const x=p.x,y=p.y;
  return[{t:p.two?'remove':'add',p2:{...p,two:!p.two},b:[x+22.2,y-9.6,10.6,9.4]},...(p.two?[{t:p.rn?'remove':'add',p2:{...p,rn:!p.rn},b:[x+30,y-7.5,2.4,2.4],easy:false}]:[]),
   {t:'replace',p2:{...p,dec:p.dec==='dots'?'line':'dots'},b:[x,y-3.4,11,2.6],easy:false},tog(p,'sack',[x-2.6,y-10.2,4.4,5.6]),{t:'remove',p2:{...p,hat:false},b:[x+1.6,y-14.2,5.8,4.2],easy:false}];}};
/* house with a snowy roof (centred on the wall, which runs off the right edge) and chimney smoke */
K.whouse={draw:p=>R(108,16,5,10,'#7c2d12')+[[110.5,12.5,1.8],[112,8.5,2.3],[114.5,4,2.7]].map(([x,y,rr],i)=>i<p.sm?C(x,y,rr,'#cbd5e1','opacity=".7"'):'').join('')
  +Pg('80,34 102,18 124,34',p.roof)+`<path d="M80.5 33.6 L102 18.4 L123.5 33.6" stroke="${SNW}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`+R(84,34,36,28,p.wall)+R(84,34,36,1,'#00000030'),
 muts:p=>[{t:'color',p2:{...p,roof:p.roof==='#7c2d12'?'#1e3a8a':'#7c2d12'},b:[80,18,40,15.6]},{t:p.sm===3?'remove':'add',p2:{...p,sm:p.sm===3?2:3},b:[111.6,1.1,5.8,5.8]}]};
/* light string under the roof: only the end bulbs come and go */
const WLC=['#ef4444','#facc15','#22c55e','#3b82f6'],WLX=85.9;
K.wlights={draw:p=>`<path d="M${WLX} 35 ${[0,1,2,3,4,5,6].map(i=>`Q${WLX+2.3+i*4.6} 36.4 ${WLX+4.6+i*4.6} 35`).join(' ')}" stroke="#334155" stroke-width="0.3" fill="none"/>`+p.cs.map((c,i)=>(i===0&&!p.l)||(i===7&&!p.r)?'':C(WLX+i*4.6,35.7,0.8,c)).join(''),
 muts:(p,r)=>{const bb=i=>[WLX+i*4.6-1.8,33.9,3.6,3.6],i=ri(r,1,6),cs=p.cs.slice();cs[i]=pkC(r,WLC,cs[i]);return[tog(p,'l',bb(0)),tog(p,'r',bb(7)),{t:'color',p2:{...p,cs},b:bb(i)}];}};
K.wdoor={draw:p=>R(98.5,48,7,14,p.c)+C(104,55.5,0.5,'#fbbf24')+(p.wr?C(102,51.8,2.2,'none','stroke="#15803d" stroke-width="1.2"')+Pg('102,54 100.5,53.2 100.5,55',p.bc)+Pg('102,54 103.5,53.2 103.5,55',p.bc):''),
 muts:(p,r)=>{const m=[{t:'color',p2:{...p,c:pkC(r,WDC,p.c)},b:[98,47.5,8,15]},tog(p,'wr',[98.9,48.7,6.2,7])];if(p.wr)m.push({t:'color',p2:{...p,bc:p.bc==='#dc2626'?'#facc15':'#dc2626'},b:[100.2,52.8,3.6,2.6]});return m;}};
const WDC=['#1e3a8a','#78350f','#5b21b6'];
K.wlamp={draw:p=>L(79,66,79,46,'#94a3b8',0.8)+Pg('76.8,42.8 81.2,42.8 79,40.6','#94a3b8')+E(79,40.7,2,0.6,SNW)+R(77.4,42.6,3.2,3.6,p.on?'#fde68a':'#475569')+R(77,46,4,0.8,'#94a3b8')
  +(p.bow?Pg('79,50 76.6,48.6 76.6,51.4',p.bc)+Pg('79,50 81.4,48.6 81.4,51.4',p.bc)+L(79,50,78,53.4,p.bc,0.5)+L(79,50,80,53.4,p.bc,0.5):''),
 muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[76.2,39.8,5.6,7.2]},tog(p,'bow',[76,48,6,5.8]),...(p.bow?[{t:'color',p2:{...p,bc:p.bc==='#dc2626'?'#2563eb':'#dc2626'},b:[76,48,6,5.8]}]:[])]};
/* Christmas tree: balls in a set formation, garland, and one of 5 tree toppers */
const XB=[[58,33],[66,34.5],[56,43],[63,47.5],[69,44],[52,55.5],[60,57],[71,56]],XBC=['#ef4444','#3b82f6','#facc15','#a855f7'];
const TOPS={star:()=>star5(62,22.4,2.8,'#facc15'),
  angel:()=>E(60.3,21.6,1.2,1.8,'#e2e8f0')+E(63.7,21.6,1.2,1.8,'#e2e8f0')+Pg('60.2,25.4 63.8,25.4 62,20.8',SNW)+C(62,20.2,0.95,'#f1c27d')+E(62,18.7,1.2,0.4,'none','stroke="#facc15" stroke-width="0.4"'),
  bow:()=>L(62,22.6,60.4,25.6,'#dc2626',0.6)+L(62,22.6,63.6,25.6,'#dc2626',0.6)+Pg('62,22.6 58.6,20.6 58.6,24.6','#dc2626')+Pg('62,22.6 65.4,20.6 65.4,24.6','#dc2626')+C(62,22.6,0.85,'#991b1b'),
  flake:()=>[0,60,120].map(a=>G(`rotate(${a} 62 21.8)`,L(62,18.6,62,25,SNW,0.5)+L(62,19.6,61,18.8,SNW,0.35)+L(62,19.6,63,18.8,SNW,0.35)+L(62,24,61,24.8,SNW,0.35)+L(62,24,63,24.8,SNW,0.35))).join(''),
  spike:()=>Pg('61.1,23 62.9,23 62,17.8','#dc2626')+C(62,23.8,1.5,'#dc2626')+C(61.5,23.3,0.4,'#fecaca')};
K.xtree={draw:p=>R(60.5,60,3,4,'#78350f')+Pg('47,60 77,60 62,38','#166534')+Pg('50,49 74,49 62,30','#15803d')+Pg('53,39 71,39 62,24','#16a34a')
  +`<path d="M54 39.5 Q62 43.5 70 38.5" stroke="${p.gc}" stroke-width="0.8" fill="none"/>`+(p.g2?`<path d="M51 50 Q62 54 73 49.5" stroke="${p.gc}" stroke-width="0.8" fill="none"/>`:'')
  +XB.map(([x,y],i)=>p.on[i]?C(x,y,1.4,p.bc[i]):'').join('')+(TOPS[p.top]?TOPS[p.top]():''),
 muts:(p,r)=>{const bb=i=>[XB[i][0]-2,XB[i][1]-2,4,4],tb=[57.8,17.4,8.4,8.6],m=[];
  const on=XB.map((_,k)=>k).filter(k=>p.on[k]),off=XB.map((_,k)=>k).filter(k=>!p.on[k]),so=(k,v)=>p.on.map((o,j)=>j===k?v:o);
  if(on.length>5){const k=pk(r,on);m.push({t:'remove',p2:{...p,on:so(k,false)},b:bb(k)});}if(off.length){const k=pk(r,off);m.push({t:'add',p2:{...p,on:so(k,true)},b:bb(k)});}
  const i=pk(r,on),bc=p.bc.slice();bc[i]=pkC(r,XBC,bc[i]);m.push({t:'color',p2:{...p,bc},b:bb(i)});
  if(p.top==='none')m.push({t:'add',p2:{...p,top:pk(r,Object.keys(TOPS))},b:tb});else m.push({t:'replace',p2:{...p,top:pk(r,Object.keys(TOPS).filter(t=>t!==p.top))},b:tb},{t:'remove',p2:{...p,top:'none'},b:tb});
  m.push({t:'color',p2:{...p,gc:p.gc==='#fbbf24'?'#e2e8f0':'#fbbf24'},b:[50.5,37.5,23,17],easy:false},tog(p,'g2',[50.5,48.5,23,6.5]));return m;}};
/* presents under the tree: each one can come or go */
const GF=[[49.5,59.5,6,5],[57,61,5,4],[66,60,6.5,5]];
K.gifts={draw:p=>GF.map(([x,y,w,h],i)=>!p.on[i]?'':R(x,y,w,h,p.c[i])+R(x+w/2-0.5,y,1,h,p.rb)+R(x,y+h/2-0.5,w,1,p.rb)).join(''),
 muts:(p,r)=>{const gb=i=>[GF[i][0]-0.5,GF[i][1]-0.5,GF[i][2]+1,GF[i][3]+1],on=[0,1,2].filter(i=>p.on[i]),off=[0,1,2].filter(i=>!p.on[i]),m=[],set=(i,v)=>{const o=p.on.slice();o[i]=v;return o;};
  if(on.length>1){const i=pk(r,on);m.push({t:'remove',p2:{...p,on:set(i,false)},b:gb(i)});}if(off.length){const i=pk(r,off);m.push({t:'add',p2:{...p,on:set(i,true)},b:gb(i)});}
  const i=pk(r,on),c=p.c.slice();c[i]=pkC(r,['#dc2626','#2563eb','#16a34a','#7c3aed'],c[i]);m.push({t:'color',p2:{...p,c},b:gb(i)},{t:'color',p2:{...p,rb:p.rb==='#fbbf24'?SNW:'#fbbf24'},b:[49,59,24,7],easy:false});return m;}};
/* snowman: hat, carrot nose, scarf, 3 or 2 buttons (recentred), stick arms (both or none) */
K.snowman={draw:p=>{let s=(p.arms?L(30.4,62.4,25.4,58.2,'#78350f',0.6)+L(26.6,59.2,25.6,57.4,'#78350f',0.4)+L(37.6,62.4,42.6,58.2,'#78350f',0.6)+L(41.4,59.2,42.4,57.4,'#78350f',0.4):'')
  +C(34,72,5,SNW,SNO)+C(34,63.6,3.9,SNW,SNO)+C(34,56.6,3,SNW,SNO)+C(33,55.6,0.45,'#1f2937')+C(35,55.6,0.45,'#1f2937');
  if(p.nose)s+=Pg('34.6,56.6 38.2,57.2 34.6,57.8','#f97316');
  (p.bt===3?[61.6,63.6,65.6]:[62.6,64.6]).forEach(y=>s+=C(34,y,0.5,'#1f2937'));
  s+=R(31.2,59.1,5.6,1.5,p.sc)+R(35,59.6,1.4,3.6,p.sc);
  if(p.hat)s+=R(31.6,49.2,4.8,4.6,'#1f2937')+R(30.2,53.4,7.6,1.1,'#1f2937')+R(31.6,52.2,4.8,0.9,'#dc2626');
  return s;},
 muts:p=>[tog(p,'hat',[29.7,48.7,8.6,6.3]),tog(p,'nose',[34.2,56,4.4,2.4]),{t:'color',p2:{...p,sc:near(p.sc)},b:[30.7,58.6,6.6,5.1]},{t:p.bt===3?'remove':'add',p2:{...p,bt:p.bt===3?2:3},b:[33,60.6,2,6],easy:false},tog(p,'arms',[24.8,56.8,18.4,6.2])]};
/* kid on a sled, tilted along the slope */
K.sledder=placed({box:()=>[-6.5,-12.5,13,13.5],
 draw:p=>R(-5.5,-1.6,11,1.3,p.c,'rx="0.4"')+`<path d="M-6 0.4 h11 q1.6 0 1.6 -1.6" stroke="#94a3b8" stroke-width="0.5" fill="none"/>`+L(-3.5,-0.3,-3.5,0.4,'#94a3b8',0.45)+L(3.5,-0.3,3.5,0.4,'#94a3b8',0.45)
  +R(0.5,-3.2,4.4,1.5,'#57534e','rx="0.6"')+R(-2.6,-7.6,3.8,5.6,p.coat,'rx="1"')+C(-0.7,-9.3,1.7,'#f1c27d')+(p.hat?Pa('M-2.5 -9.6 a1.8 1.9 0 0 1 3.6 0 Z',p.hc)+C(-0.7,-11.6,0.6,SNW):''),
 muts:p=>[{t:'color',p2:{...p,c:p.c==='#dc2626'?'#2563eb':'#dc2626'},b:[-6,-2,12.5,2.8]},{t:'color',p2:{...p,coat:near(p.coat)},b:[-3,-8,4.6,6.4]},tog(p,'hat',[-2.9,-12.4,4.4,3.2])]});
const wPerson=(r,sc,sk)=>{const w=wardrobe(r,{noItem:true,noDog:true}),shirt=pk(r,SHIRTS.filter(c=>c!=='#f1f5f9'));
  return{skin:w.skin,hair:w.hair,shoes:w.shoes,shirt,pants:pk(r,PANTS),hat:r()<0.7?'beanie':'',hcol:hatCol(r,w),scarf:sc&&r()<0.7?apart(r,SCARF,[shirt]):'',gl:r()<0.6?apart(r,GLV,[shirt,sk]):''};};
/* gloves: bigger than the hands, never the jacket's (or the skis') hue */
const glMut=(p,o,b,avoid,r)=>o.gl?{t:'remove',p2:{...p,o:{...o,gl:''}},b}:{t:'add',p2:{...p,o:{...o,gl:apart(r,GLV,avoid)}},b};
/* skier going down the slope: skis along the slope, knees bent, leaning forward, poles back */
const SKA=36.2,SKC=Math.cos(SKA*Math.PI/180),SKS=Math.sin(SKA*Math.PI/180);
const skierD=p=>{const o=p.o,k=o.skin;let s=L(-5*SKC,-5*SKS,5*SKC,5*SKS,p.sk,0.75)+L(5*SKC,5*SKS,5*SKC+0.9,5*SKS-0.5,p.sk,0.75);
  if(p.poles)s+=L(3.9,-6.5,-3.8,-2.9,'#94a3b8',0.4)+L(3.4,-6.9,-4.6,-3.6,'#94a3b8',0.4)+C(-3.8,-2.9,0.45,'none','stroke="#94a3b8" stroke-width="0.3"');
  s+=C(-0.5,-0.5,0.8,'#1f2937')+C(0.7,0.3,0.8,'#1f2937')+L(0.1,-0.8,1.9,-3.3,o.pants,1.6)+L(1.9,-3.3,-0.5,-5.4,o.pants,1.8)
   +L(-0.4,-5.9,1.4,-8.9,o.shirt,3.3)+L(1.6,-8.6,3.8,-6.6,o.shirt,1.1)+C(3.9,-6.5,o.gl?0.9:0.6,o.gl||k)+C(2.4,-10.9,1.45,k);
  if(o.hat)s+=Pa('M0.9 -11 a1.5 1.6 0 0 1 3 0 Z',o.hcol)+C(2.4,-12.7,0.5,SNW);else s+=Pa('M0.9 -11 a1.5 1.5 0 0 1 3 0 Z',o.hair);return G(`translate(${p.x},${p.y})`,s);};
K.skier={draw:skierD,
 muts:(p,r)=>{const o=p.o,b=q=>[p.x+q[0],p.y+q[1],q[2],q[3]];return[{t:'color',p2:{...p,sk:apart(r,['#dc2626','#2563eb','#facc15','#16a34a'].filter(c=>c!==p.sk),[o.shirt,o.gl],p.sk)},b:b([-4.6,-3.4,10.2,6.8])},tog(p,'poles',b([-5.2,-7.4,9.8,5])),
  {t:'color',p2:{...p,o:{...o,shirt:apart(r,SHIRTS.filter(c=>c!==o.shirt&&c!=='#f1f5f9'),[o.shirt,o.gl,p.sk],o.shirt)}},b:b([-2.4,-10.2,7.2,5.6])},
  o.hat?{t:'remove',p2:{...p,o:{...o,hat:''}},b:b([0.6,-13.4,3.8,3])}:{t:'add',p2:{...p,o:{...o,hat:'beanie',hcol:hatCol(r,o)}},b:b([0.6,-13.4,3.8,3])},glMut(p,o,b([2.6,-7.8,2.6,2.6]),[o.shirt,p.sk],r)];}};
K.skater={draw:p=>person(p.x,p.y,0.45,p.o)+(p.o.gl?G(`translate(${p.x},${p.y}) scale(0.45)`,C(-4.9,-8.3,1.45,p.o.gl)+C(4.9,-8.3,1.45,p.o.gl)):'')+L(p.x-1.6,p.y+0.3,p.x-0.2,p.y+0.3,'#94a3b8',0.4)+L(p.x+0.2,p.y+0.3,p.x+1.6,p.y+0.3,'#94a3b8',0.4),
 muts:(p,r)=>{const o=p.o,b=k=>pb(p.x,p.y,0.45,PB[k]),m=[{t:'color',p2:{...p,o:{...o,shirt:apart(r,SHIRTS.filter(c=>c!==o.shirt&&c!=='#f1f5f9'),[o.shirt,o.scarf,o.gl],o.shirt)}},b:b('shirt')}];
  if(o.scarf)m.push({t:'color',p2:{...p,o:{...o,scarf:apart(r,SCARF.filter(c=>c!==o.scarf),[o.shirt,o.scarf],o.scarf)}},b:b('scarf')},{t:'remove',p2:{...p,o:{...o,scarf:''}},b:b('scarf')});else m.push({t:'add',p2:{...p,o:{...o,scarf:apart(r,SCARF,[o.shirt])}},b:b('scarf')});
  m.push(o.hat?{t:'color',p2:{...p,o:{...o,hcol:hatCol(r,o,o.hcol)}},b:b('hat')}:{t:'add',p2:{...p,o:{...o,hat:'beanie',hcol:hatCol(r,o)}},b:b('hat')},{t:'color',p2:{...p,o:{...o,pants:grpOther(r,o.pants,PANTG)}},b:b('pants')},
   glMut(p,o,pb(p.x,p.y,0.45,[-6.6,-10,13.2,3.4]),[o.shirt],r));return m;}};
/* gingerbread corner: the edge of a gingerbread house at the back (a light string under the roof icing), a small pine, a candy-cane gate with a trail of little canes to the house, a lollipop and a gingerbread man */
const GLX=[[1.6,50.4],[4.9,54],[8.2,57.6]];
K.ginger={draw:p=>R(0,58.4,8.4,14.8,'#b0652e')+Pg('0,46.8 11,58.8 0,58.8','#8a4a1f')+`<path d="M0 46.8 L11 58.8" stroke="${SNW}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
  +`<path d="M0 60 q1.05 1.2 2.1 0 q1.05 1.2 2.1 0 q1.05 1.2 2.1 0 q1.05 1.2 2.1 0" stroke="${SNW}" stroke-width="0.5" fill="none"/>`
  /* a light string under the icing, like the one on the house: wire with sagging loops, bulbs below it */
  +`<path d="M${GLX[0][0]-1.2} ${GLX[0][1]-1.6} ${GLX.map(([x,y],i)=>i?`Q${(x+GLX[i-1][0])/2-0.6} ${(y+GLX[i-1][1])/2+0.2} ${x} ${y-0.7}`:`L${x} ${y-0.7}`).join(' ')}" stroke="#334155" stroke-width="0.3" fill="none"/>`
  +GLX.map(([x,y],i)=>C(x,y,0.8,p.lc[i])).join('')
  +R(1.4,62,4.8,4.6,p.lit?'#fde68a':'#475569')+R(1.4,62,4.8,4.6,'none',`stroke="${SNW}" stroke-width="0.6"`)+L(3.8,62,3.8,66.6,SNW,0.4)+L(1.4,64.3,6.2,64.3,SNW,0.4)
  +(p.pm?C(3.8,70,1.7,SNW)+[0,60,120].map(a=>G(`rotate(${a} 3.8 70)`,L(3.8,68.5,3.8,71.5,'#dc2626',0.45))).join(''):''),
 muts:(p,r)=>{const lb=i=>[GLX[i][0]-1.6,GLX[i][1]-1.6,3.2,3.2],i=ri(r,0,2),lc=p.lc.slice();lc[i]=pkC(r,WLC,lc[i]);
  return[{t:'color',p2:{...p,lc},b:lb(i),easy:false},{t:'light',p2:{...p,lit:!p.lit},b:[0.8,61.4,6,5.8]},tog(p,'pm',[1.6,67.8,4.4,4.4])];}};
const cane=(d,c)=>`<path d="${d}" stroke="#94a3b8" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${SNW}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="1.3" fill="none" stroke-dasharray="0.9 0.9"/>`;
K.cgate={draw:p=>cane('M11.6 89 V76.6 a2.2 2.2 0 0 1 4.4 0 v0.8',p.c[0])+cane('M23.4 89 V76.6 a2.2 2.2 0 0 0 -4.4 0 v0.8',p.c[1])
  +`<path d="M12 75.2 Q17.5 79.6 23 75.2" stroke="#166534" stroke-width="0.9" fill="none"/>`
  +(p.mis?L(17.5,77.4,17.5,78.6,'#166534',0.35)+E(16.6,79.4,1.2,0.6,'#22c55e','transform="rotate(30 16.6 79.4)"')+E(18.4,79.4,1.2,0.6,'#22c55e','transform="rotate(-30 18.4 79.4)"')+C(17.1,80.1,0.45,SNW)+C(17.9,80.1,0.45,SNW)+C(17.5,79.4,0.45,SNW):'')
  +(p.bow?Pg('11.6,83.4 9.6,82.2 9.6,84.6','#dc2626')+Pg('11.6,83.4 13.6,82.2 13.6,84.6','#dc2626')+C(11.6,83.4,0.55,'#991b1b'):''),
 muts:(p,r)=>{
  return[tog(p,'mis',[15.4,77,4.2,4.4]),tog(p,'bow',[9.3,81.8,4.9,3.4])];}};
/* little candy canes in an arc from the gate's right side back to the house */
const CTR=[[26.4,87.4],[26.9,81],[25.4,75.4],[21.8,71.6],[16.4,70.2],[11.4,70.4]];
const minicane=(x,y,c)=>`<path d="M${x} ${y} v-3.3 a1.05 1.05 0 0 0 -2.1 0" stroke="#94a3b8" stroke-width="1.05" fill="none" stroke-linecap="round"/><path d="M${x} ${y} v-3.3 a1.05 1.05 0 0 0 -2.1 0" stroke="${SNW}" stroke-width="0.75" fill="none" stroke-linecap="round"/><path d="M${x} ${y} v-3.3 a1.05 1.05 0 0 0 -2.1 0" stroke="${c}" stroke-width="0.75" fill="none" stroke-dasharray="0.55 0.55"/>`;
K.ctrail={draw:p=>CTR.map(([x,y],i)=>i===5&&p.n<6?'':minicane(x,y,p.c[i])).join(''),
 muts:(p,r)=>{const cb=i=>[CTR[i][0]-2.7,CTR[i][1]-5,3.4,5.6],i=ri(r,0,p.n-1),c=p.c.slice();c[i]=c[i]==='#dc2626'?'#16a34a':'#dc2626';
  return[{t:p.n===6?'remove':'add',p2:{...p,n:p.n===6?5:6},b:cb(5),easy:false},{t:'color',p2:{...p,c},b:cb(i),easy:false}];}};
/* snowy pine behind the trail: a star; under the snowy middle branch either a golden bell or icicles (the last icicle comes and goes) */
const PT=b=>[17.8+(b[0]-18.2)*1.3,64.4+(b[1]-68)*1.3,b[2]*1.3,b[3]*1.3],ICX=[[15.7,1.5],[17.2,2],[18.7,1.4],[20.1,1.8]];
/* bell test: 3 shapes (round, small round, triangle), hung at one of several spots on the tree */
const BELLV={round:s=>L(0,0,0,0.7,'#dc2626',0.3)+Pg('0,0.3 -0.9,-0.2 -0.9,0.8','#dc2626')+Pg('0,0.3 0.9,-0.2 0.9,0.8','#dc2626')
   +Pa('M-1.1 3.2 q0 -2.5 1.1 -2.5 q1.1 0 1.1 2.5 q0.15 0.35 0.5 0.45 h-3.2 q0.35 -0.1 0.5 -0.45 Z','#fbbf24','stroke="#b45309" stroke-width="0.15"')+C(0,3.95,0.32,'#b45309')+L(-0.5,1.6,-0.6,2.8,'#fef3c7',0.2),
  tri:s=>L(0,0,0,0.6,'#dc2626',0.3)+Pg('0,0.3 -0.9,-0.2 -0.9,0.8','#dc2626')+Pg('0,0.3 0.9,-0.2 0.9,0.8','#dc2626')
   +C(0,1,0.45,'#fbbf24')+Pg('0,0.8 1.6,3.6 -1.6,3.6','#fbbf24','stroke="#b45309" stroke-width="0.15" stroke-linejoin="round"')+C(0,3.95,0.32,'#b45309')+L(-0.3,1.6,-0.8,3,'#fef3c7',0.2)};
const BELLP=[[18.2,57],[16.8,58.6],[19.6,58.6],[18.2,61.2],[16,61.6],[20.4,61.6]];
const BELLS={round:1,small:0.55,tri:1},bellBox=(v,[x,y])=>{const k=BELLS[v];return[x-2*k,y-0.6*k,4*k,5.2*k];};
const pbell=(v,pos)=>{const[x,y]=BELLP[pos],k=BELLS[v];return G(`translate(${x},${y}) scale(${k})`,BELLV[v==='small'?'round':v](k));};
/* pine decorations: up to 2 small bells or icicles (never both); a small candy cane now and then (not with icicles) */
const CANEP=[19.6,63.4],bOK=(bs,k,cane)=>bs.every(b=>Math.hypot(BELLP[b][0]-BELLP[k][0],BELLP[b][1]-BELLP[k][1])>=2.6)&&!(cane&&Math.hypot(BELLP[k][0]-CANEP[0],BELLP[k][1]+1.4-CANEP[1])<2.8);
const freeBell=(r,bs,cane)=>{const o=BELLP.map((_,k)=>k).filter(k=>!bs.includes(k)&&bOK(bs,k,cane));return o.length?pk(r,o):-1;};
K.cpine={draw:p=>G('translate(17.8,64.4) scale(1.3) translate(-18.2,-68)',R(17.4,65.2,1.6,2.8,'#4a3222')+Pg('13,65.6 23.4,65.6 18.2,58.2','#166534')+Pg('14.2,61.4 22.2,61.4 18.2,54','#15803d')+E(18.2,61.5,3.7,0.5,SNW)
  +(p.dec==='ice'?ICX.map(([x,l],i)=>i===3&&p.ic<4?'':Pg(`${x-0.42},61.8 ${x+0.42},61.8 ${x},${61.8+l}`,'#bae6fd','stroke="#38bdf8" stroke-width="0.15" stroke-linejoin="round"')).join(''):'')
  +(p.cane?`<path d="M20.4 64.6 v-2.4 a0.8 0.8 0 0 0 -1.6 0" stroke="${SNW}" stroke-width="0.6" fill="none" stroke-linecap="round"/><path d="M20.4 64.6 v-2.4 a0.8 0.8 0 0 0 -1.6 0" stroke="#dc2626" stroke-width="0.6" fill="none" stroke-dasharray="0.45 0.45"/>`:'')
  +p.bells.map(k=>pbell('small',k)).join('')
  +(p.star?star5(18.2,54.2,1.5,'#facc15'):'')),
 muts:(p,r)=>{const ib=PT([14.6,61.2,7,5.2]),bb=k=>PT(bellBox('small',BELLP[k])),cb=PT([18.2,60.8,2.8,4.4]),m=[tog(p,'star',PT([16.3,52.4,3.8,3.6]))];
  if(p.dec==='ice')m.push({t:p.ic===4?'remove':'add',p2:{...p,ic:p.ic===4?3:4},b:PT([19.5,61.6,1.4,2.2]),easy:false},{t:'remove',p2:{...p,dec:'none'},b:ib,easy:false});
  else{if(p.bells.length){const k=pk(r,p.bells);m.push({t:'remove',p2:{...p,bells:p.bells.filter(b=>b!==k)},b:bb(k),easy:false});}
   if(p.bells.length<2){const k=freeBell(r,p.bells,p.cane);if(k>=0)m.push({t:'add',p2:{...p,bells:[...p.bells,k]},b:bb(k),easy:false});}
   if(!p.bells.length&&!p.cane)m.push({t:'add',p2:{...p,dec:'ice',ic:4},b:ib,easy:false});
}
  return m;}};
/* gingerbread man under the mistletoe: icing, eyes and buttons (all can go at once) */
const gman=(x,y,plain)=>{const B='#b0652e';let s=C(x,y-7.2,1.4,B)+R(x-1.1,y-6,2.2,3.2,B,'rx="0.6"')+L(x-0.7,y-3.2,x-1.3,y-0.3,B,1.1)+L(x+0.7,y-3.2,x+1.3,y-0.3,B,1.1)
  +L(x-1,y-5.3,x-2.5,y-4.1,B,1)+L(x+1,y-5.3,x+2.5,y-4.1,B,1);
  if(!plain)s+=C(x-0.5,y-7.5,0.22,SNW)+C(x+0.5,y-7.5,0.22,SNW)+`<path d="M${x-0.5} ${y-6.8} q0.5 0.4 1 0" stroke="${SNW}" stroke-width="0.2" fill="none"/>`+C(x,y-5.2,0.3,'#ef4444')+C(x,y-4.1,0.3,'#22c55e')
   +`<path d="M${x-2.3} ${y-4.6} l0.4 0.5 M${x+2.3} ${y-4.6} l-0.4 0.5 M${x-1.4} ${y-1} h0.6 M${x+0.8} ${y-1} h0.6" stroke="${SNW}" stroke-width="0.3" fill="none"/>`;return s;};
/* two lollipops left of the gate, lower than the big canes, the inner one shorter */
const LOLX=[[2.8,77.6],[7,80.2]];
K.candy={draw:p=>LOLX.map(([x,y],i)=>p.on[i]?L(x,88.6,x,y+2,SNW,0.5)+C(x,y,2,p.lc[i])+`<path d="M${x} ${y} m-1.25 0 a1.25 1.25 0 1 1 1.25 1.25 a0.62 0.62 0 1 1 -0.62 -0.62" stroke="${SNW}" stroke-width="0.4" fill="none"/>`:'').join('')+(p.gm?G('translate(17.5,89.6) scale(0.82) translate(-17.5,-89.6)',gman(17.5,89.6,p.plain)):''),
 muts:(p,r)=>{const lb=i=>[LOLX[i][0]-2.1,LOLX[i][1]-2.2,4.2,88.8-LOLX[i][1]+2.2],gb=[15.2,82.4,4.6,7.4],i=pk(r,[0,1].filter(k=>p.on[k])),lc=p.lc.slice();lc[i]=pkC(r,['#ef4444','#a855f7','#22c55e'],lc[i]);
  const m=[{t:'color',p2:{...p,lc},b:[LOLX[i][0]-2.1,LOLX[i][1]-2.2,4.2,4.4]},tog(p,'gm',gb)];if(p.gm)m.push({t:p.plain?'add':'remove',p2:{...p,plain:!p.plain},b:gb,easy:false});
  const off=[0,1].find(k=>!p.on[k]);if(off===undefined){const k=pk(r,[0,1]);m.push({t:'remove',p2:{...p,on:p.on.map((o,j)=>j!==k)},b:lb(k)});}else m.push({t:'add',p2:{...p,on:[true,true]},b:lb(off)});return m;}};
K.psled={draw:p=>flip(51,R(45,83,12,1.4,p.c,'rx="0.4"')+`<path d="M44.4 85.6 h12 q1.8 0 1.8 -1.8" stroke="#475569" stroke-width="0.45" fill="none"/>`+L(47,84.4,47,85.6,'#475569',0.45)+L(55,84.4,55,85.6,'#475569',0.45)+(p.rope?`<path d="M45 83.6 q-3.4 2.8 -6.2 0.4" stroke="#7c2d12" stroke-width="0.75" fill="none"/>`:''),p.f),
 muts:p=>[{t:'color',p2:{...p,c:p.c==='#dc2626'?'#2563eb':'#dc2626'},b:[43.5,82.5,15,3.6]},{t:'flip',p2:{...p,f:!p.f},b:[38.2,81.5,25.6,5]},tog(p,'rope',p.f?[56.6,82.6,7,3.4]:[38.4,82.6,7,3.4])]};
Object.assign(CAT,{sleigh:'sky',whouse:'house',wlights:'house',wdoor:'house',wlamp:'street',xtree:'tree',gifts:'tree',snowman:'snowman',sledder:'slope',skier:'slope',skater:'rink',ginger:'gingerbread',cgate:'gate',candy:'gingerbread',cpine:'gate',ctrail:'gate',psled:'snow'});
gadd('Winter village','Santa in the sky, Christmas tree, snowman, sled slope, ice rink, decorated house, gingerbread house and candy-cane gate',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  add('raw',{s:R(0,0,120,90,'#1e3a5f')+R(0,60,120,30,'#d3dce8')+Pa('M0 26 Q24 27 54 62 L0 62 Z','#eef2f7')},-10);
  add('raw',{s:E(94,80,24.6,7.5,'#94a3b8')+E(94,80,24,7,'#bae6fd')+`<path d="M80 79 q6 2 12 0 M98 82 q6 2 12 0" stroke="#e0f2fe" stroke-width="0.4" fill="none"/>`},1);
  add('cloud',{x:78,y:9,s:0.7,on:r()<0.7},0);add('sbirds',{x:50,y:12,n:pk(r,[0,1,2])},0);
  add('sleigh',{x:12,y:14.5,hat:true,dec:pk(r,['dots','line']),two:r()<0.6,rn:r()<0.6,sack:r()<0.7},1);
  add('whouse',{sm:ri(r,2,3),roof:pk(r,['#7c2d12','#1e3a8a']),wall:pk(r,['#c2733a','#a7b4c2','#e0a95f'])},0);
  const wins=[[86,38],[111,38],[86,50],[111,50]].map(([x,y])=>({x,y,sz:7}));fillWins(r,wins,99,ri(r,1,2),['plant','cat','person']);wins.forEach(p=>add('win',p,1,'win'));
  add('wdoor',{c:pk(r,WDC),wr:r()<0.8,bc:pk(r,['#dc2626','#facc15'])},1);
  add('wlights',{cs:[0,1,2,3,4,5,6,7].map(i=>WLC[i%4]),l:r()<0.8,r:r()<0.8},2);
  add('wlamp',{on:r()<0.7,bow:r()<0.6,bc:pk(r,['#dc2626','#2563eb'])},2);
  add('xtree',{bc:mixC(r,XB,XBC),on:(n=>{const s=new Set(shuf(r,[0,1,2,3,4,5,6,7]).slice(0,n));return XB.map((_,k)=>s.has(k));})(ri(r,5,8)),top:r()<0.9?pk(r,Object.keys(TOPS)):'none',gc:pk(r,['#fbbf24','#e2e8f0']),g2:r()<0.7},1);
  {const miss=r()<0.3?ri(r,0,2):-1;add('gifts',{on:[0,1,2].map(i=>i!==miss),c:mixC(r,[0,1,2],['#dc2626','#2563eb','#16a34a','#7c3aed']),rb:pk(r,['#fbbf24',SNW])},2);}
  add('snowman',{hat:r()<0.75,nose:r()<0.8,sc:pk(r,['#dc2626','#2563eb','#16a34a']),bt:r()<0.75?3:2,arms:r()<0.8},2);
  add('sledder',{x:13.9,y:29.2,a:22.4,c:pk(r,['#dc2626','#2563eb']),coat:pk(r,['#16a34a','#f97316','#facc15']),hat:r()<0.7,hc:pk(r,['#dc2626','#2563eb'])},2);
  {const sk=pk(r,['#dc2626','#2563eb','#facc15']);add('skier',{x:28.8,y:37.8,sk,poles:r()<0.85,o:wPerson(r,false,sk)},2);}
  [84,102].forEach(x=>add('skater',{x,y:81,o:wPerson(r,true)},3));
  add('ginger',{lc:mixC(r,GLX,WLC),lit:r()<0.6,pm:r()<0.7},3);add('ctrail',{n:r()<0.75?6:5,c:CTR.map((_,i)=>i%2?'#16a34a':'#dc2626')},2.9);{const ice=r()<0.3,cane=false,bells=[];if(!ice){const n=pk(r,[0,1,1,2]);for(let k=0;k<n;k++){const b=freeBell(r,bells,cane);if(b>=0)bells.push(b);}}
   add('cpine',{star:r()<0.7,dec:ice?'ice':'bells',ic:r()<0.75?4:3,bells,cane},2.8);}add('candy',{on:[true,true],lc:shuf(r,['#ef4444','#a855f7','#22c55e']).slice(0,2),gm:r()<0.8,plain:false},3);
  add('cgate',{c:['#dc2626','#dc2626'],mis:r()<0.75,bow:r()<0.6},3);add('psled',{c:pk(r,['#dc2626','#2563eb']),f:r()<0.5,rope:r()<0.75},3);
  return items;});

/* ================= MEDIEVAL TOWN ================= */
const FLC=['#dc2626','#facc15','#2563eb'];
const MERX=[17,20.9,24.8,28.7,32.6];
K.castle2={draw:p=>{let s=R(7,22,9,20,'#9ca3af')+R(36,22,9,20,'#9ca3af')+R(17,16,18,26,'#a8a29e')+(p.nm===4?[17,22.2,27.4,32.6]:MERX).map(x=>R(x,13.6,2.4,2.4,'#a8a29e')).join('')
  +Pg('6,22 11.5,12 17,22',p.rc)+Pg('35,22 40.5,12 46,22',p.rc)+Pa('M23 42 v-6 a3 3 0 0 1 6 0 v6 Z','#1f2937')+(p.port?`<path d="M24 37 v5 M26 35.4 v6.6 M28 37 v5 M23.2 38.5 h5.6 M23 40.5 h6" stroke="#94a3b8" stroke-width="0.4"/>`:'')
  +R(24.8,22,2.4,3.6,'#1f2937')+(p.tw?R(10.3,28,2.4,3.6,'#1f2937'):'')+R(39.3,28,2.4,3.6,'#1f2937');
  if(p.fl)s+=L(11.5,12,11.5,6.5,'#e5e7eb',0.4)+Pg('11.5,6.5 15.5,7.7 11.5,8.9',p.fc);if(p.fr)s+=L(40.5,12,40.5,6.5,'#e5e7eb',0.4)+Pg('40.5,6.5 44.5,7.7 40.5,8.9',p.fc2);return s;},
 muts:(p,r)=>[tog(p,'fl',[10.8,6,5.4,6.4]),...(p.fl?[{t:'color',p2:{...p,fc:pkC(r,FLC,p.fc)},b:[10.8,6,5.4,3.6]}]:[]),...(p.fr?[{t:'color',p2:{...p,fc2:pkC(r,FLC,p.fc2)},b:[39.8,6,5.4,3.6]}]:[]),tog(p,'fr',[39.8,6,5.4,6.4]),
  ...(p.bc!=='#991b1b'?[{t:'color',p2:{...p,rc:p.rc==='#991b1b'?p.bc:'#991b1b'},b:[5.5,11.5,41,11]}]:[]),tog(p,'tw',[9.8,27.5,3.4,4.6]),tog(p,'port',[22.6,34.6,6.8,7.8]),
  ...(p.nm===5?[{t:'remove',p2:{...p,nm:4},b:[16.6,13.2,18.8,3.2],easy:false}]:[])]};
/* half-timbered house: brace patterns in the lower panels can change */
const brace=(x0,x1,t,c)=>t==='X'?L(x0,47.6,x1,62.8,c,1)+L(x1,47.6,x0,62.8,c,1):t==='V'?L(x0,47.6,(x0+x1)/2,62.8,c,1)+L(x1,47.6,(x0+x1)/2,62.8,c,1):L(x0,62.8,(x0+x1)/2,47.6,c,1)+L(x1,62.8,(x0+x1)/2,47.6,c,1);
K.mhouse={draw:p=>{const bm='#5b3a1e';return(p.chim?R(102,16,4,9,'#57534e'):'')+Pg('64,32 90,14 116,32',p.roof)+R(68,32,44,32,'#f3e3c3')+[68,82,98,110.8].map(x=>R(x,32,1.2,32,bm)).join('')
  +R(68,32,44,1.2,bm)+R(68,46.4,44,1.2,bm)+R(68,62.8,44,1.2,bm)+L(83.2,33.2,98,46.4,bm,1)+L(98,33.2,83.2,46.4,bm,1)+brace(69.2,82,p.ba,bm)+brace(99.2,110.8,p.bc,bm);},
 muts:(p,r)=>[{t:'color',p2:{...p,roof:p.roof==='#7c2d12'?'#334155':'#7c2d12'},b:[64,14,52,18]},tog(p,'chim',[101.5,15.5,5,8]),
  (k=>({t:'replace',p2:{...p,[k]:pk(r,['X','V','A'].filter(v=>v!==p[k]))},b:k==='ba'?[69.2,47.6,12.8,15.2]:[99.2,47.6,11.6,15.2],easy:false}))(r()<0.5?'ba':'bc')]};
const shut=(x,c)=>R(x,35.5,3.5,7,c)+L(x,37.8,x+3.5,37.8,'#00000040',0.3)+L(x,40.2,x+3.5,40.2,'#00000040',0.3);
K.mwin={draw:p=>{const x=p.x;return p.cl?shut(x,p.sc)+shut(x+3.5,p.sc)+L(x+3.5,35.5,x+3.5,42.5,'#3f2a1d',0.4):R(x,35.5,7,7,p.lit?'#fde68a':'#1f2937')+L(x+3.5,35.5,x+3.5,42.5,'#5b3a1e',0.5)+L(x,39,x+7,39,'#5b3a1e',0.5)+shut(x-3.5,p.sc)+shut(x+7,p.sc);},
 muts:(p,r)=>{const x=p.x,b=[x-3.9,35.1,14.8,7.8],m=[{t:'color',p2:{...p,sc:p.sc==='#991b1b'?'#d6a35a':'#991b1b'},b}];
  if(p.cl)m.push({t:'replace',p2:{...p,cl:false},b,easy:false});else m.push({t:'light',p2:{...p,lit:!p.lit},b:[x-0.3,35.2,7.6,7.6]},{t:'replace',p2:{...p,cl:true},b,easy:false});return m;}};
K.mdoor={draw:p=>Pa('M86 64 v-10 a4 4 0 0 1 8 0 v10 Z',p.c)+C(92.4,58,0.5,'#fbbf24')+(p.dw?R(88.8,52.4,2.4,2.4,'#fde68a'):''),
 muts:(p,r)=>[{t:'color',p2:{...p,c:other(r,p.c,DOORS)},b:[85.5,49.5,9,15]},tog(p,'dw',[88.3,51.9,3.4,3.4])]};
K.torch={draw:p=>R(95.6,50.4,1.2,3.6,'#1f2937')+R(95,53.6,2.4,0.8,'#1f2937')+(p.on?E(96.2,49,0.9,1.4,'#f97316')+E(96.2,49.4,0.5,0.8,'#facc15'):''),muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[94.8,47.2,2.8,7.4]}]};
const EMB={mug:R(114.8,47,2.2,2.8,'#fde68a')+`<path d="M117 47.6 q1.2 0.6 0 1.8" stroke="#fde68a" stroke-width="0.4" fill="none"/>`,key:C(114.6,48.2,0.9,'none','stroke="#fde68a" stroke-width="0.5"')+L(115.5,48.2,118,48.2,'#fde68a',0.5)+L(117.4,48.2,117.4,49.2,'#fde68a',0.5),tee:`<text x="116" y="50.5" font-size="5.4" fill="#fde68a" font-family="Georgia,'Times New Roman',serif" font-weight="700" text-anchor="middle">T</text>`};
K.msign={draw:p=>L(110.8,44,118.6,44,'#1f2937',0.6)+L(113,44,113,45.5,'#1f2937',0.3)+L(118,44,118,45.5,'#1f2937',0.3)+Pa('M112.4 45.5 h7.2 v3.4 q0 3 -3.6 4 q-3.6 -1 -3.6 -4 Z',p.c)+EMB[p.em],
 muts:(p,r)=>{const b=[112,45,8,8.4];return[{t:'replace',p2:{...p,em:pk(r,Object.keys(EMB).filter(e=>e!==p.em))},b,easy:false},{t:'color',p2:{...p,c:pkC(r,['#991b1b','#1e3a8a','#166534','#7c3aed'],p.c)},b}];}};
/* market stall */
K.stall={draw:p=>{let s=L(8,72,8,52,'#78350f',1)+L(42,72,42,52,'#78350f',1);
  for(let i=0;i<6;i++){const x=6+i*6.33,c=i%2?SNW:p.ac;s+=R(x,48,6.33,4.6,c)+Pa(`M${x} 52.6 a3.165 1.8 0 0 0 6.33 0 Z`,c);}
  return s+R(7,62,36,10,'#92400e')+R(7,62,36,1,'#a16207');},
 muts:p=>[{t:'color',p2:{...p,ac:p.ac==='#dc2626'?'#2563eb':'#dc2626'},b:[5.5,47.5,39,7.4]}]};
K.apples={draw:p=>[0,1,2,3,4].map(i=>(i===0&&!p.l)||(i===4&&!p.r)?'':C(11.4+i*2.05,57.8,1.05,p.c)+L(11.4+i*2.05,56.8,11.7+i*2.05,56.1,'#78350f',0.3)).join('')+Pa('M9.6 58.4 h12 l-1.4 3.6 h-9.2 Z','#b45309')+L(10,59.6,21.2,59.6,'#78350f',0.35)+L(10.4,60.8,20.8,60.8,'#78350f',0.35),
 muts:p=>[tog(p,'l',[9.8,56,3.2,3.2]),tog(p,'r',[18,56,3.2,3.2]),{t:'color',p2:{...p,c:p.c==='#ef4444'?'#84cc16':'#ef4444'},b:[9.6,56,11.8,3.4]}]};
K.bread={draw:p=>R(22.4,60.6,11.2,1.4,'#78350f','rx="0.4"')+[0,1,2].map(i=>i===2&&p.n<3?'':E(25.4+i*2.6,59.4,1.6,1,'#d6a35a')+L(25+i*2.6,59.2,25.8+i*2.6,58.8,'#b45309',0.3)).join(''),
 muts:p=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[28.2,57.6,3.8,3]}]};
K.jug={draw:p=>p.v==='pie'?E(38,60.6,3.8,1.2,'#a16207')+Pa('M34.6 60.4 a3.4 2.8 0 0 1 6.8 0 Z','#d6a35a')+L(37,58.4,37.6,59.2,'#92400e',0.35)+L(38.8,58.2,38.4,59.2,'#92400e',0.35)
  :(p.cut?Pa('M38 59 L41.2 59 A3.2 3.2 0 1 1 38 55.8 Z','#facc15')+Pa('M38 59 L41.2 59 A3.2 3.2 0 1 1 38 55.8 Z','none','stroke="#ca8a04" stroke-width="0.5"'):C(38,59,3.2,'#facc15','stroke="#ca8a04" stroke-width="0.5"'))+R(34.4,61.8,7.2,0.5,'#78350f'),
 muts:p=>{const b=[34.2,55.4,7.6,7.2];return[{t:'replace',p2:{...p,v:p.v==='pie'?'cheese':'pie'},b},...(p.v==='cheese'?[{t:p.cut?'add':'remove',p2:{...p,cut:!p.cut},b:[37.6,55.4,4.2,4],easy:false}]:[])];}};
K.well={draw:p=>L(51.5,66,51.5,52.5,'#78350f',0.9)+L(62.5,66,62.5,52.5,'#78350f',0.9)+Pg('48,53.5 57,46.5 66,53.5',p.rc)+L(51.5,55,62.5,55,'#78350f',0.6)+L(57,55,57,p.up?57:62.4,'#a16207',0.3)+R(55.5,p.up?57:62.4,3,2.6,'#78350f','rx="0.4"')
  +R(50,66,14,10,'#9ca3af')+L(50,69.3,64,69.3,'#78716c',0.4)+L(50,72.6,64,72.6,'#78716c',0.4)+L(54.6,66,54.6,69.3,'#78716c',0.4)+L(59.4,69.3,59.4,72.6,'#78716c',0.4)+E(57,66,7,1.4,'#1f2937'),
 muts:p=>[{t:'move',p2:{...p,up:!p.up},b:[55,56.5,4,9]},{t:'color',p2:{...p,rc:p.rc==='#7c2d12'?'#1e3a8a':'#7c2d12'},b:[47.5,46,19,8]}]};
/* knight: plume, shield color and emblem, surcoat cross, spear or sword */
const knightD=o=>R(-3,-9.5,2.5,9.5,'#94a3b8')+R(0.5,-9.5,2.5,9.5,'#94a3b8')+R(-3.5,-1.2,3.1,1.4,'#475569')+R(0.4,-1.2,3.1,1.4,'#475569')
  +Pg('-4.5,-18 4.5,-18 5.2,-7.5 -5.2,-7.5',o.c)+(o.cross?R(-0.6,-16.8,1.2,7.6,o.ec)+R(-2.6,-14.4,5.2,1.2,o.ec):'')
  +R(4,-17.5,1.8,8,'#94a3b8','rx="0.9"')+C(0,-21.5,3.3,'#94a3b8')+R(-2.4,-22.2,4.8,0.7,'#1f2937')+(o.plume?Pa('M0 -24.6 q3 -3 5.5 -1.6 q-2.8 0.2 -5.5 2.4 Z',o.pc):'')
  +(o.item==='spear'?L(5,0,5,-31,'#a16207',0.6)+Pg('4.2,-31 5.8,-31 5,-34','#cbd5e1')
    :o.item==='halberd'?L(5,0,5,-31,'#a16207',0.6)+Pg('4.4,-31 5.6,-31 5,-34.4','#cbd5e1')+Pa('M5.4 -30.4 q3.6 0.6 3.2 3.6 q-1.8 -1 -3.2 -0.6 Z','#cbd5e1')+Pg('4.6,-29.6 2.8,-28.6 4.6,-28','#cbd5e1')
    :G('rotate(18 4.9 -8.6)',L(4.9,-8,4.9,-19.4,'#cbd5e1',0.9)+R(3.3,-8.9,3.2,0.9,'#78350f')))+C(4.9,-8.6,1,'#94a3b8')
  +Pa('M-10 -17 h7 v5.5 q0 4.5 -3.5 6 q-3.5 -1.5 -3.5 -6 Z',o.sc)+(o.em==='stripe'?R(-7.1,-17,1.4,11.4,o.ec):Pg('-10,-14 -6.5,-11.2 -3,-14 -3,-12 -6.5,-9.2 -10,-12',o.ec));
K.knight={draw:p=>G(`translate(${p.x},${p.y}) scale(${p.s})`,knightD(p.o)),
 muts:(p,r)=>{const o=p.o,b=k=>pb(p.x,p.y,p.s,k),set=(t,ch,k,x={})=>({t,p2:{...p,o:{...o,...ch}},b:b(k),...x}),IT={spear:[3.8,-34.4,2.4,34.4],halberd:[2.4,-34.8,6.3,34.8],sword:[3,-19.4,6,11]},PL=[-0.4,-28.2,6.6,4.8],SH=[-10.4,-17.4,7.8,12];
  return[set(o.plume?'remove':'add',{plume:!o.plume},PL),...(o.plume?[set('color',{pc:near(o.pc)},PL)]:[]),set('color',{sc:pkC(r,['#dc2626','#2563eb','#16a34a'],o.sc)},SH),
   set('replace',{em:o.em==='stripe'?'chev':'stripe'},SH,{easy:false}),set('color',{c:pkC(r,['#1e3a8a','#991b1b','#166534'],o.c)},[-5.5,-18.4,11,11.2]),set(o.cross?'remove':'add',{cross:!o.cross},[-3,-17.2,6,8.2]),
   (it=>({t:'replace',p2:{...p,o:{...o,item:it}},b:U(b(IT[o.item]),b(IT[it]))}))(pk(r,Object.keys(IT).filter(k=>k!==o.item)))];}};
const horseD=(x,y,c,sc,mc,tc,sh,shc,she)=>R(x-5,y-9,1.6,7.6,c)+R(x-5,y-9,1.6,7.6,'#00000033')+R(x+4,y-9,1.6,7.6,c)+R(x+4,y-9,1.6,7.6,'#00000033')+E(x,y-11,8,4,c)+R(x-6.6,y-9,1.6,9,c)+R(x+5.6,y-9,1.6,9,c)
 +Pg(`${x+5},${y-13} ${x+8.8},${y-20} ${x+11},${y-18.6} ${x+8.2},${y-11}`,c)+E(x+11,y-18.4,3,1.6,c,`transform="rotate(30 ${x+11} ${y-18.4})"`)
 +Pa(`M${x+5.4} ${y-13.4} L${x+8.6} ${y-20.4} L${x+7.4} ${y-19.6} L${x+4.4} ${y-13} Z`,mc)+`<path d="M${x-7.8} ${y-12.6} q-3 1 -2.6 6" stroke="${tc}" stroke-width="1.2" fill="none"/>`
 +R(x-3,y-15.2,6,4.6,sc,'rx="0.6"')+C(x+11.6,y-19.6,0.4,'#111')
 +(sh?G(`translate(${x-8.4},${y-16}) scale(1.4) translate(0,-57)`,shieldD(0,shc,she)):'');
K.mhorse={draw:p=>G(`translate(${p.x},${p.y}) scale(0.8) translate(${-p.x},${-p.y})`,flip(p.x,horseD(p.x,p.y,p.c,p.sc,p.mc,p.tc,p.sh,p.shc,p.she),p.f)),
 muts:(p,r)=>{const x=p.x,y=p.y;return[{t:'flip',p2:{...p,f:!p.f},b:[x-14.2,y-21.5,28.4,21.6]},{t:'color',p2:{...p,sc:pk(r,cvdPrefer(['#dc2626','#2563eb','#16a34a'].filter(c=>c!==p.sc&&!(p.sh&&c===p.shc)),p.sc))},b:[x-3.5,y-15.7,7,5.6]},
  {t:'color',p2:{...p,mc:p.mc==='#3f2a1d'?SNW:'#3f2a1d'},b:p.f?[x-9.6,y-21,5.6,8.6]:[x+4,y-21,5.6,8.6],easy:false},
  ...(()=>{const sb=p.f?[x+2.2,y-16.4,6.4,9.8]:[x-8.6,y-16.4,6.4,9.8];return p.sh?[{t:'color',p2:{...p,shc:pk(r,cvdPrefer(['#dc2626','#2563eb','#16a34a','#f1f5f9'].filter(c=>c!==p.shc&&c!==p.sc),p.shc))},b:sb},{t:'replace',p2:{...p,she:pk(r,['stripe','cross','dot'].filter(e=>e!==p.she))},b:sb,easy:false},{t:'remove',p2:{...p,sh:false},b:sb}]:[{t:'add',p2:{...p,sh:true,shc:p.shc===p.sc?'#f1f5f9':p.shc},b:sb}];})()];}};
{const hm=K.mhorse.muts;K.mhorse.muts=(p,r)=>hm(p,r).map(m=>({...m,b:[p.x+(m.b[0]-p.x)*0.8,p.y+(m.b[1]-p.y)*0.8,m.b[2]*0.8,m.b[3]*0.8]}));}
const hen=(x,y,c,f)=>flip(x,E(x,y,2.2,1.6,c)+Pg(`${x-2},${y-0.6} ${x-3.4},${y-2.2} ${x-1.8},${y-1.4}`,c)+C(x+1.8,y-1.8,1,c)+Pg(`${x+1.4},${y-2.6} ${x+1.8},${y-3.4} ${x+2.3},${y-2.6}`,'#dc2626')
  +Pg(`${x+2.7},${y-2} ${x+3.6},${y-1.7} ${x+2.7},${y-1.4}`,'#f59e0b')+L(x-0.5,y+1.4,x-0.5,y+2.6,'#f59e0b',0.35)+L(x+0.6,y+1.4,x+0.6,y+2.6,'#f59e0b',0.35),f);
K.hens={draw:p=>hen(34,84,p.c,p.f)+(p.n>1?hen(42,86,p.c,p.f):''),
 muts:p=>{const hb=x=>[x-4,x===34?80.8:82.8,8,6],all=p.n>1?U(hb(34),hb(42)):hb(34);return[{t:p.n>1?'remove':'add',p2:{...p,n:p.n>1?1:2},b:hb(42)},{t:'color',p2:{...p,c:p.c===SNW?'#b45309':SNW},b:all},{t:'flip',p2:{...p,f:!p.f},b:all}];}};
const barrel=x=>R(x,79,6,9,'#92400e','rx="1.2"')+R(x,81,6,0.7,'#475569')+R(x,85.6,6,0.7,'#475569');
K.barrels={draw:p=>[3,10,17].map((x,i)=>i===2&&p.n<3?'':barrel(x)).join('')+(p.kit?(p.av==='hen'?hen(6.8,76.8,p.cc,false):cat(6.4,77.6,p.cc,false)):''),
 muts:(p,r)=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[16.5,78.5,7,10]},tog(p,'kit',[2.4,73,8.2,6.4]),...(p.kit?[{t:'color',p2:{...p,cc:p.cc==='#f97316'?'#f1f5f9':'#f97316'},b:[2.4,73,8.2,6.4]},{t:'replace',p2:{...p,av:p.av==='hen'?'cat':'hen'},b:[2.4,73,8.2,6.4]}]:[])]};
const MKT=d=>({draw:p=>G('translate(92.6,68.4) scale(0.7) translate(-5.5,-47.5)',d.draw(p)),muts:(p,r)=>d.muts(p,r).map(m=>({...m,b:[92.6+(m.b[0]-5.5)*0.7,68.4+(m.b[1]-47.5)*0.7,m.b[2]*0.7,m.b[3]*0.7]}))});
['stall','apples','bread','jug'].forEach(k=>K[k]=MKT(K[k]));
Object.assign(CAT,{castle2:'castle',mhouse:'house',mwin:'house',mdoor:'house',torch:'house',msign:'sign',stall:'market',apples:'market',bread:'market',jug:'market',well:'well',knight:'knight',mhorse:'horse',hens:'animals',barrels:'yard'});
/* ---- medieval v2: castle banners, blacksmith (forge, shields on the wall, smith at the anvil), weapon rack, second knight ---- */
const BANC=['#991b1b','#1e3a8a','#166534','#7c3aed'],BEM=['cross','ring','chev'];
const banEm=(x,t,c)=>t==='cross'?R(x+1.2,18.6,0.8,4.6,c)+R(x+0.3,20,2.6,0.8,c):t==='ring'?C(x+1.6,20.9,1,'none',`stroke="${c}" stroke-width="0.6"`):Pg(`${x+0.3},19.2 ${x+1.6},20.6 ${x+2.9},19.2 ${x+2.9},20.6 ${x+1.6},22 ${x+0.3},20.6`,c);
K.banner={draw:p=>G('translate(0,6.6)',L(p.x-0.4,17,p.x+3.6,17,'#57534e',0.5)+Pa(p.tail==='pt'?`M${p.x} 17 h3.2 v8.4 l-1.6 2.6 l-1.6 -2.6 Z`:`M${p.x} 17 h3.2 v10 l-1.6 -1.4 l-1.6 1.4 Z`,p.c)+banEm(p.x,p.em,'#facc15')),
 muts:(p,r)=>{const b=[p.x-0.6,23,4.4,11.2];return[{t:'replace',p2:{...p,em:pk(r,BEM.filter(e=>e!==p.em))},b,easy:false},{t:'replace',p2:{...p,tail:p.tail==='pt'?'v':'pt'},b:[p.x-0.6,30.2,4.4,4.6],easy:false}];}};
/* smithy: lean-to roof, forge with fire, shields hanging on the back wall */
K.smithy={draw:p=>{let s=R(51,53.2,3.4,5.4,'#57534e')
   +Pg('48.2,58.4 56.8,58.4 55.2,61.6 49.8,61.6','#57534e')+R(48,66,9,10,'#78716c')+L(48,69.4,57,69.4,'#57534e',0.4)+L(48,72.8,57,72.8,'#57534e',0.4)+L(52.5,66,52.5,69.4,'#57534e',0.4)+L(50,69.4,50,72.8,'#57534e',0.4)+L(55,69.4,55,72.8,'#57534e',0.4)
   +R(48.6,65,7.8,1.2,'#292524');
  s+=p.on?E(52.5,64.6,4,1.6,'#f97316','opacity=".35"')+Pg('49.6,65.2 51,62 52,64 52.8,61.2 54,64 55,62.4 55.6,65.2','#f97316')+Pg('50.8,65.2 51.8,63.4 52.6,64.6 53.6,63 54.4,65.2','#facc15'):[50,51.8,53.6,55.2].map(x=>C(x,64.9,0.7,'#44403c')).join('');
  return s;},
 muts:p=>[{t:'light',p2:{...p,on:!p.on},b:[48.4,60.8,8.4,5.6]}]};
const shieldD=(x,c,em)=>Pa(`M${x} 57 h4 v2.8 q0 2.8 -2 3.8 q-2 -1 -2 -3.8 Z`,c)+(em==='stripe'?R(x+1.5,57,1,6.4,'#facc15'):em==='cross'?R(x+1.6,57.6,0.8,4.4,'#facc15')+R(x+0.6,58.8,2.8,0.8,'#facc15'):C(x+2,59.4,0.9,'#facc15'));
const WSX=[58.2,63];
K.wshield={draw:p=>WSX.map((x,i)=>p.on[i]?shieldD(x,p.c[i],p.em[i]):'').join(''),
 muts:(p,r)=>{const sb=i=>[WSX[i]-0.4,56.6,4.8,6.6],on=[0,1].filter(i=>p.on[i]),i=pk(r,on),a=(k,v,j=i)=>{const q=p[k].slice();q[j]=v;return{...p,[k]:q};},m=[];
  m.push({t:'color',p2:a('c',pkC(r,['#dc2626','#2563eb','#16a34a','#f1f5f9'],p.c[i])),b:sb(i)},{t:'replace',p2:a('em',pk(r,['stripe','cross','dot'].filter(e=>e!==p.em[i]))),b:sb(i),easy:false});
  if(on.length===2){const j=pk(r,[0,1]);m.push({t:'remove',p2:a('on',false,j),b:sb(j)});}else{const j=p.on.indexOf(false);m.push({t:'add',p2:a('on',true,j),b:sb(j)});}return m;}};
/* the smith at the anvil (faces left): apron, beard, hammer or tongs, a glowing horseshoe on the anvil */
const BEARDC=['#d97706','#7c2d12','#d6d3d1','#57534e'];
K.smith={draw:p=>{const o=p.o;let s=Pa('M49 81 h7.6 l-1.4 1.6 h-1.3 v2.2 h1.9 v1.4 h-6.6 v-1.4 h1.9 v-2.2 h-1 Z','#374151')+Pg('49,81 46.6,81.4 49,82.4','#374151');
  if(p.shoe)s+=`<path d="M51.6 80.9 a1.4 1.1 0 1 1 2.8 0" stroke="#f97316" stroke-width="0.6" fill="none"/>`;
  let g='';const k=o.skin;
  g+=R(-3,-9.5,2.5,9.5,o.pants)+R(0.5,-9.5,2.5,9.5,o.pants)+R(-3.5,-1.2,3.1,1.4,'#1f2937','rx="0.5"')+R(0.4,-1.2,3.1,1.4,'#1f2937','rx="0.5"')+R(-4,-18,8,10,o.shirt,'rx="1.5"')
   +R(-3.4,-16.6,6.8,13.4,o.ap,'rx="0.8"')+R(-5.8,-17.5,1.8,8.5,o.shirt,'rx="0.9"')+R(4,-17.5,1.8,8.5,o.shirt,'rx="0.9"')+C(-4.9,-8.6,1,k)+C(4.9,-8.6,1,k)+C(0,-21.5,3.2,k)
   +Pa('M-3.3 -22.2 a3.3 3.3 0 0 1 6.6 0 q-0.5 -1.1 -1.4 -1.5 q-1.9 -0.7 -3.8 0 q-0.9 0.4 -1.4 1.5 Z',o.hair)+C(-1.1,-21.9,0.35,'#1f2937')+C(1.1,-21.9,0.35,'#1f2937')+E(0,-20.8,0.55,0.7,'#00000030')+Pa('M-3.15 -21.2 q0 4.6 3.15 5.3 q3.15 -0.7 3.15 -5.3 q-0.6 1.7 -1.6 2.1 q-1.55 -0.8 -3.1 0 q-1 -0.4 -1.6 -2.1 Z',o.bc||o.hair)+Pa('M-1.7 -19.9 q1.7 -0.9 3.4 0 q-1.7 0.5 -3.4 0 Z',o.bc||o.hair);
  if(o.tool==='hammer')g+=L(4.9,-8.6,6.6,-16.6,'#d6a35a',0.9)+R(4.6,-19,4.4,2.8,'#cbd5e1','rx="0.3"');
  else g+=L(4.9,-8.6,8.6,-14.6,'#cbd5e1',0.6)+L(4.9,-8.6,9.4,-13.6,'#cbd5e1',0.6);
  return s+G(`translate(${p.x},${p.y}) scale(${p.s})`,g);},
 muts:(p,r)=>{const o=p.o,b=q=>[p.x+q[0]*p.s,p.y+q[1]*p.s,q[2]*p.s,q[3]*p.s],set=(t,ch,q,x={})=>({t,p2:{...p,o:{...o,...ch}},b:b(q),...x});
  return[set('color',{ap:o.ap==='#78350f'?'#374151':'#78350f'},[-3.6,-16.8,7.2,13.8]),set('replace',{tool:o.tool==='hammer'?'tongs':'hammer'},[3.6,-19.2,6.6,11.4]),set('color',{bc:farFrom(r,BEARDC.filter(c=>c!==(o.bc||o.hair)),[o.bc||o.hair,o.skin])},[-3.5,-21.6,7,6.2],{easy:false}),
   set('color',{shirt:pkC(r,['#f1f5f9','#d6a35a','#2563eb','#991b1b'],o.shirt)},[-6.2,-18.4,12.4,10.2]),{...tog(p,'shoe',[51,78.8,4,2.8]),easy:false}];}};
/* weapon rack against the house: 3 slots, sword / axe / spear / mace */
const RKX=[72.4,75.8,79.2];
const WPN={sword:x=>L(x,63.6,x,53.6,'#e2e8f0',0.9)+L(x-1.6,57.6,x+1.6,57.6,'#78350f',0.6)+L(x,57.8,x,59.8,'#78350f',0.6)+C(x,63.8,0.6,'#78350f'),
  axe:x=>L(x,64,x,53.4,'#a16207',0.6)+Pa(`M${x} 54 h1.2 l1 -0.9 q0.6 1.8 0 3.6 l-1 -0.9 h-1.2 Z`,'#e2e8f0'),
  spear:x=>L(x,64,x,51.6,'#a16207',0.5)+Pg(`${x-0.8},51.8 ${x+0.8},51.8 ${x},49.4`,'#e2e8f0'),
  mace:x=>L(x,64,x,56.6,'#a16207',0.6)+C(x,55.4,1.5,'#94a3b8')+[[0,-2.1],[1.9,-0.9],[1.9,1],[-1.9,-0.9],[-1.9,1]].map(([dx,dy])=>C(x+dx,55.4+dy,0.4,'#94a3b8')).join('')};
K.rack={draw:p=>R(69.6,50.6,12.4,13.4,'#3f2a1d')+L(70.2,64,70.2,50.6,'#a16207',0.9)+L(81.4,64,81.4,50.6,'#a16207',0.9)+L(69.6,61.6,82,61.6,'#a16207',0.6)+RKX.map((x,i)=>i===2&&p.n<3?'':WPN[p.w[i]](x)).join('')+L(69.6,55.2,82,55.2,'#a16207',0.6),
 muts:(p,r)=>{const wb=i=>[RKX[i]-2.2,48.8,4.6,15.6],i=ri(r,0,p.n-1),w=p.w.slice();w[i]=pk(r,Object.keys(WPN).filter(k=>k!==w[i]));const m=[{t:'replace',p2:{...p,w},b:wb(i)},{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:wb(2)}];
  const js=[0,1].filter(j=>j+1<p.n&&p.w[j]!==p.w[j+1]);if(js.length){const j=pk(r,js),w2=p.w.slice();[w2[j],w2[j+1]]=[w2[j+1],w2[j]];m.push({t:'move',p2:{...p,w:w2},b:U(wb(j),wb(j+1))});}return m;}};
/* armory on the left: weapon wall, armor stand with helmet, bow and quiver, sign */
const AWX=[11.4,15,18.6];
K.armory={draw:p=>{let s=R(51,39.6,3.4,11,'#57534e')+R(50.6,39,4.2,1,'#44403c')+R(6,52.6,38.6,12.6,'#4a3222')+R(44.6,52.6,23.4,23.4,'#4a3222');for(const x of[16.5,24.5,32.5])s+=L(x,52.6,x,65.2,'#3f2a1d',0.4);for(const x of[51.5,57,62.5])s+=L(x,52.6,x,76,'#3f2a1d',0.4);
  s+=L(5.6,72,5.6,50,'#78350f',1)+L(44.6,76,44.6,50,'#78350f',1)+L(68,76,68,50,'#78350f',1)+Pg('44,52.6 70.6,52.6 70.6,50.8 44,48.4','#92400e')+R(44,52.2,26.6,1,'#5b3a1e')+Pg('3,52.6 46.2,52.6 44.2,46.4 5,46.4','#7c2d12')+R(3,52.2,43.2,1,'#5b3a1e')+R(6,65,37,7,'#5b3a1e')+R(6,65,37,0.9,'#78350f')
   +R(17.6,47.2,14,4.6,'#d6a35a','rx="0.5"')+R(17.6,47.2,14,4.6,'none','stroke="#78350f" stroke-width="0.4" rx="0.5"');
  s+=p.sg==='swords'?L(22.4,48.2,27.6,50.8,'#475569',0.6)+L(27.6,48.2,22.4,50.8,'#475569',0.6)+L(22.9,50,23.9,51.2,'#78350f',0.6)+L(27.1,50,26.1,51.2,'#78350f',0.6)
   :Pa('M23.4 47.9 h3.2 v1.6 q0 1.6 -1.6 2.1 q-1.6 -0.5 -1.6 -2.1 Z','#991b1b')+R(24.7,48.2,0.6,2.8,'#facc15');return s;},
 muts:p=>[{t:'replace',p2:{...p,sg:p.sg==='swords'?'shield':'swords'},b:[17.6,46.8,14.8,5.4],easy:false}]};
K.awall={draw:p=>L(9.6,63.4,20.4,63.4,'#a16207',0.6)+AWX.map((x,i)=>i===2&&p.n<3?'':G(`translate(${x} 64.6) scale(0.72) translate(${-x} -64)`,WPN[p.w[i]](x))).join(''),
 muts:(p,r)=>{const wb=i=>[AWX[i]-1.8,53.4,3.6,11.6],i=ri(r,0,p.n-1),w=p.w.slice();w[i]=pk(r,Object.keys(WPN).filter(k=>k!==w[i]));const m=[{t:'replace',p2:{...p,w},b:wb(i)},{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:wb(2)}];
  const js=[0,1].filter(j=>j+1<p.n&&p.w[j]!==p.w[j+1]);if(js.length){const j=pk(r,js),w2=p.w.slice();[w2[j],w2[j+1]]=[w2[j+1],w2[j]];m.push({t:'move',p2:{...p,w:w2},b:U(wb(j),wb(j+1))});}return m;}};
K.astand={draw:p=>R(23.6,64.2,4.8,0.8,'#78350f')+L(26,64.4,26,62,'#78350f',0.7)+Pa('M22.6 57.8 h6.8 l-0.6 4.6 q-2.8 1.2 -5.6 0 Z','#cbd5e1')+E(22.5,58.2,1.4,1,'#94a3b8')+E(29.5,58.2,1.4,1,'#94a3b8')
  +R(24.2,58.6,3.6,4.4,p.tc)+(p.em?R(25.7,59.1,0.6,3.4,'#facc15')+R(24.8,60.1,2.4,0.6,'#facc15'):'')
  +R(24.1,54,3.8,3.9,'#94a3b8','rx="1.2"')+R(24.5,55.6,3,0.5,'#1f2937')+(p.pl?Pa('M25 54.2 q-2.6 -1.8 -4.2 0.2 q1.9 -0.7 4.2 0.9 Z',p.pc):''),
 muts:(p,r)=>{const m=[{t:'color',p2:{...p,tc:pkC(r,['#1e3a8a','#991b1b','#166534'],p.tc)},b:[23.8,58.2,4.4,5.2]},tog(p,'em',[24.4,58.8,3.2,4.2]),tog(p,'pl',[20.7,52.8,4.7,2.8])];
  if(p.pl)m.push({t:'color',p2:{...p,pc:pkC(r,['#dc2626','#facc15','#2563eb'],p.pc)},b:[20.7,52.8,4.7,2.8]});return m;}};
K.bowq={draw:p=>(p.bow?`<path d="M34.6 53.8 q3.6 5.4 0 10.8" stroke="#a16207" stroke-width="0.7" fill="none"/>`+L(34.6,53.8,34.6,64.6,'#e5e7eb',0.25):'')
  +[0,1,2].map(i=>i===2&&p.n<3?'':L(38.8+i*0.8,58,38.4+i*1.1,54.6,'#d6d3d1',0.3)+Pg(`${38.4+i*1.1-0.5},${54.4} ${38.4+i*1.1+0.5},${54.4} ${38.4+i*1.1},${55.8}`,p.fc)).join('')+R(38,57.4,3,7,'#78350f','rx="0.5"')+R(38,58.6,3,0.5,'#a16207'),
 muts:(p,r)=>[{t:p.n===3?'remove':'add',p2:{...p,n:p.n===3?2:3},b:[39.6,53.6,2.6,4.4],easy:false},{t:'color',p2:{...p,fc:pkC(r,['#dc2626','#f1f5f9','#16a34a'],p.fc)},b:[37.4,53.6,4.6,2.8]},tog(p,'bow',[33.6,53.4,3.8,11.6])]};
/* knights can face either way */
K.knight.draw=p=>G(`translate(${p.x},${p.y}) scale(${p.f?-p.s:p.s},${p.s})`,knightD(p.o));
{const km=K.knight.muts;K.knight.muts=(p,r)=>km(p,r).map(m=>{if(!p.f)return m;const[x,y,w,h]=m.b;return{...m,b:[2*p.x-x-w,y,w,h]};});}
/* the left brace panel sits behind the rack, so only the right one changes */

K.hens=shifted(K.hens);
Object.assign(CAT,{armory:'armory',awall:'armory',astand:'armory',bowq:'armory',banner:'castle',smithy:'smithy',wshield:'smithy',smith:'smith',rack:'weapons'});
const knightO=r=>({c:pk(r,['#1e3a8a','#991b1b','#166534']),ec:pk(r,['#facc15',SNW]),cross:r()<0.7,plume:r()<0.75,pc:pk(r,['#dc2626','#2563eb','#facc15']),sc:pk(r,['#dc2626','#2563eb','#16a34a']),em:pk(r,['stripe','chev']),item:pk(r,['spear','halberd','sword'])});
gadd('Medieval town','castle with banners, timber house with a weapon rack, armory and forge, smith, two knights, small market stand, barrels or a horse',r=>{const items=[],add=(kind,p,z=0,g)=>items.push({kind,p,z,g});
  add('raw',{s:R(0,0,120,90,'#1e3a5f')+E(28,48,44,13,'#365e30')+R(0,58,120,6,'#3f6b35')+R(0,64,120,26,'#78716c')+[68,73,79,85].map(y=>L(0,y,120,y,'#6b6560',0.4)).join('')},-10);
  add('cloud',{x:60,y:8,s:0.7,on:r()<0.7},0);add('cloud',{x:100,y:6,s:0.6,on:r()<0.6},0);add('sbirds',{x:49,y:20,n:pk(r,[0,1,2])},0);
  {const fcs=pk(r,FLC),bc=pk(r,BANC),em=pk(r,BEM),tail=pk(r,['v','pt']),nf=pk(r,[0,1,2]),side=r()<0.5;
   add('castle2',{bc,rc:r()<0.5?'#991b1b':bc,fl:nf===2||(nf===1&&side),fr:nf===2||(nf===1&&!side),fc:fcs,fc2:fcs,tw:true,port:r()<0.6,nm:5},1);
   [18.6,30.2].forEach(x=>add('banner',{x,c:bc,em,tail},2,'banner'));}
  {const br=pk(r,['X','V','A']);add('mhouse',{roof:pk(r,['#7c2d12','#334155']),chim:r()<0.7,ba:br,bc:br},0);}
  {const sc=pk(r,['#991b1b','#d6a35a']);[72.1,101.5].forEach(x=>{const st=pk(r,['on','off','closed']);add('mwin',{x,lit:st==='on',cl:st==='closed',sc},1);});}
  add('mdoor',{c:pk(r,['#5b3a1e','#7f1d1d','#166534']),dw:r()<0.6},1);add('torch',{on:r()<0.7},1);add('msign',{em:pk(r,Object.keys(EMB)),c:pk(r,['#991b1b','#1e3a8a','#166534'])},1);
  add('armory',{sg:pk(r,['swords','shield'])},1);add('awall',{n:r()<0.75?3:2,w:shuf(r,Object.keys(WPN)).slice(0,3)},2);
  add('astand',{tc:pk(r,['#1e3a8a','#991b1b','#166534']),em:r()<0.7,pl:r()<0.75,pc:pk(r,['#dc2626','#facc15'])},2);add('bowq',{n:r()<0.75?3:2,fc:pk(r,['#dc2626','#f1f5f9']),bow:r()<0.85},2);
  add('stall',{ac:pk(r,['#dc2626','#2563eb'])},1);add('apples',{l:r()<0.85,r:r()<0.85,c:pk(r,['#ef4444','#84cc16'])},2);add('bread',{n:r()<0.7?3:2},2);add('jug',{v:pk(r,['cheese','cheese','pie']),cut:r()<0.4},2);
  add('smithy',{on:r()<0.75},1);add('wshield',{on:r()<0.75?[true,true]:pk(r,[[true,false],[false,true]]),c:[pk(r,['#dc2626','#2563eb']),pk(r,['#16a34a','#f1f5f9'])],em:[pk(r,['stripe','cross','dot']),pk(r,['stripe','cross','dot'])]},2);
  add('smith',{x:40.4,y:88,s:0.6,shoe:r()<0.7,o:{skin:pk(r,SKIN),hair:pk(r,['#d97706','#7c2d12','#d6d3d1']),bc:'',shirt:pk(r,['#f1f5f9','#d6a35a','#2563eb']),pants:pk(r,['#475569','#1e3a8a']),ap:pk(r,['#78350f','#374151']),beard:r()<0.6,tool:pk(r,['hammer','hammer','tongs'])}},3);
  add('knight',{x:73,y:86,s:0.62,f:false,o:knightO(r)},3);add('knight',{x:85,y:86,s:0.62,f:true,o:knightO(r)},3);
  if(r()<0.5)add('barrels',{n:r()<0.7?3:2,kit:r()<0.6,av:pk(r,['cat','hen']),cc:pk(r,['#f97316','#f1f5f9'])},3);else{const mc=pk(r,['#3f2a1d',SNW]);const sc=pk(r,['#dc2626','#2563eb','#16a34a']);add('mhorse',{x:12.4,y:88.4,c:pk(r,['#92400e','#a16207']),sc,mc,tc:mc,sh:r()<0.8,shc:pkC(r,['#dc2626','#2563eb','#16a34a','#f1f5f9'],sc),she:pk(r,['stripe','cross','dot']),f:r()<0.5},3);}add('hens',{dx:63,dy:1.4,n:r()<0.6?2:1,c:pk(r,[SNW,'#b45309']),f:r()<0.5},3);
  return items;});
