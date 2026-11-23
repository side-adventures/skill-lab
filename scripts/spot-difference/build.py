import sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
L=open('base.html').read().split('\n')
head='\n'.join(L[:517]); cards='\n'.join(L[517:])
head=head.replace("cat:CAT[it.kind]||it.kind","cat:m.cat||it.p.cat||CAT[it.kind]||it.kind")
head=head.replace("c.easy=isEasy(c);","c.easy=m.easy??isEasy(c);")
head=head.replace("((c.t==='remove'||c.t==='add')&&a>=50)","((c.t==='remove'||c.t==='add'||c.t==='replace')&&a>=50)")
head=head.replace('<title>Generated scenes 2</title>','<title>Spot the Difference scenes</title>').replace('generated scenes, round 2','generated scenes')
head=head.replace("if(o.stripes)g+=R(-4,-15.2,8,1.2,'#f1f5f9')+R(-4,-12.2,8,1.2,'#f1f5f9');","if(o.stripes){const sc=o.shirt==='#f1f5f9'?'#1e3a8a':'#f1f5f9';g+=R(-4,-15.2,8,1.2,sc)+R(-4,-12.2,8,1.2,sc);}")
head=head.replace("set('color',{hair:other(r,o.hair,HAIR)},'hair');","if(!o.hat||o.long)set('color',{hair:grpOther(r,o.hair,HAIRG)},'hair');")
head=head.replace("(pat==='stripes'?R(-1.5,-3.2,1.4,6.4,'#f1f5f9')+R(1,-3.4,1.2,6.8,'#f1f5f9')","(pat==='stripes'?R(-1.5,-3.2,1.4,6.4,c==='#f1f5f9'?'#1f2937':'#f1f5f9')+R(1,-3.4,1.2,6.8,c==='#f1f5f9'?'#1f2937':'#f1f5f9')")
head=head.replace("k.muts(it.p,r).forEach(m=>{const c=","k.muts(it.p,r).forEach(m=>{if(!onCanvas(m.b))return;const c=")
for k in ["if(o.stripes){const sc","if(!o.hat||o.long)","c==='#f1f5f9'?'#1f2937'","if(!onCanvas(m.b))return;"]: assert k in head,k
cards=cards.replace("diffs=res.diffs;found=new Set();show=false;","diffs=res.diffs;found=new Set();")
cards=cards.replace("document.getElementById(id+'b').onclick=()=>{show=!show;marks();};","document.getElementById(id+'b').onclick=e=>{show=!show;e.target.textContent=show?'Showing ✓':'Show';e.target.style.background=show?'#166534':'';marks();};")
assert "e.target.textContent=show?" in cards and "found=new Set();show=false" not in cards
i0=head.index("function pickDiffs(items,r){");i1=head.index("return{diffs:out,all:cands.length};}",i0)+len("return{diffs:out,all:cands.length};}")
head=head[:i0]+"""const PW={a:0.5,b:0.05};
/* pick 3 changes: first an item (weight = (changes per item)^0.5 x (items in the group)^0.05, a group such as the windows counts as one unit and inside it an item with more changes weighs more; one in an area that already has a change only gets 0.3 of the weight, a third in that area none),
   then one of that item's changes. One change per item and per group (windows, stars...), max 2 per change type, max 1 easy, spread apart. */
function pickDiffs(items,r,n=3,opts={}){
  const cands=[];items.forEach((it,i)=>{const k=K[it.kind];if(!k.muts)return;k.muts(it.p,r).forEach(m=>{if(!onCanvas(m.b))return;const c={i,...m,g:m.g||it.g||(AUTOG.has(it.kind)?'k:'+it.kind:undefined),cat:m.cat||it.p.cat||CAT[it.kind]||it.kind};c.easy=m.easy??isEasy(c);cands.push(c);});});
  const tryPick=minDist=>{const pool=new Map();cands.forEach(c=>{if(!pool.has(c.i))pool.set(c.i,[]);pool.get(c.i).push(c);});const out=[],tc={},cc={};
    const tiny=c=>c.b[2]*c.b[3]<16,maxT=Math.max(2,Math.ceil(n/2));
    const ok=c=>(tc[c.t]||0)<maxT&&!(c.easy&&out.some(o=>o.easy))&&!(tiny(c)&&out.some(tiny))&&!out.some(o=>Math.hypot(c.b[0]+c.b[2]/2-o.b[0]-o.b[2]/2,c.b[1]+c.b[3]/2-o.b[1]-o.b[3]/2)<minDist);
    while(out.length<n){
      /* only changes that fit the rules right now take part, so a big group gets no extra tries */
      /* opts.lastFree (trial): the last change may land on any item again, even one already changed or in the same group / area;
         only overlapping click areas block it, and on an item / group that already has a change it must be another type */
      const last=opts.lastFree&&out.length===n-1,kindOf=t=>t==='add'||t==='remove'?'add/remove':t; // appearing and disappearing count as the same kind
      const ca=b=>{const W=Math.max(b[2],6),H=Math.max(b[3],6);return[b[0]+b[2]/2-W/2-2.5,b[1]+b[3]/2-H/2-2.5,W+5,H+5];},ovl=(a,b)=>a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3];
      const okLast=c=>(tc[c.t]||0)<maxT&&!(c.easy&&out.some(o=>o.easy))&&!(tiny(c)&&out.some(tiny))&&!out.some(o=>ovl(ca(c.b),ca(o.b)))&&!out.some(o=>(o.i===c.i||(c.g&&o.g===c.g))&&kindOf(o.t)===kindOf(c.t))&&!out.some(o=>o.i===c.i&&Object.keys(c.p2).some(k=>JSON.stringify(c.p2[k])!==JSON.stringify(items[c.i].p[k])&&JSON.stringify(o.p2[k])!==JSON.stringify(items[c.i].p[k])));
      const avail=last?[...pool.entries()].map(([i,cs])=>[i,cs.filter(okLast)]).filter(([i,cs])=>cs.length)
        :[...pool.entries()].map(([i,cs])=>[i,cs.filter(ok)]).filter(([i,cs])=>cs.length&&!out.some(o=>o.i===i)&&!(cs[0].g&&out.some(o=>o.g===cs[0].g))&&(cc[cs[0].cat]||0)<2);
      if(!avail.length)break;const gn={},gc={},gs={};avail.forEach(([i,cs])=>{const u=cs[0].g||'i'+i,n=pool.get(i).length;gn[u]=(gn[u]||0)+1;gc[u]=(gc[u]||0)+n;gs[u]=(gs[u]||0)+Math.pow(n,PW.a);});
      const w=avail.map(([i,cs])=>{const u=cs[0].g||'i'+i,m=gn[u],n=pool.get(i).length;return(!last&&cc[cs[0].cat]?0.3:1)*Math.pow(gc[u]/m,PW.a)*Math.pow(m,PW.b)*Math.pow(n,PW.a)/gs[u];}),tot=w.reduce((a,b)=>a+b,0);
      let x=r()*tot,k=0;while(k<w.length-1&&x>w[k]){x-=w[k];k++;}
      const cs=avail[k][1],c=cs[Math.floor(r()*cs.length)];
      out.push(c);tc[c.t]=(tc[c.t]||0)+1;cc[c.cat]=(cc[c.cat]||0)+1;}
    return out;};
  let out=[];for(const d of n>3?[14,12,10,8,6]:[16,16,12,8]){out=tryPick(d);if(out.length===n)break;}
  return{diffs:out,all:cands.length};}"""+head[i1:]
assert "then one of that item" in head
head=head.replace("if(r()<0.4){w.hat=pk(r,['cap','beanie']);w.hcol=pk(r,SHIRTS);}","if(r()<0.4){w.hat=pk(r,['cap','beanie']);w.hcol=hatCol(r,w);}")
head=head.replace("if(o.hat)set('remove',{hat:''},'hat');else set('add',{hat:'cap',hcol:pk(r,SHIRTS)},'hat');","if(o.hat)set('remove',{hat:''},'hat');else set('add',{hat:'cap',hcol:hatCol(r,o)},'hat');")
head=head.replace("if(o.hat)set('color',{hcol:other(r,o.hcol,SHIRTS)},'hat');","if(o.hat)set('color',{hcol:hatCol(r,o,o.hcol)},'hat');")
head=head.replace("if(!o.hat||o.long)set('color',{hair:grpOther(r,o.hair,HAIRG)},'hair');","if(!o.hat||o.long)set('color',{hair:hairCol(r,o)},'hair');")
for k in ["w.hcol=hatCol(r,w)","hcol:hatCol(r,o)},'hat'","hatCol(r,o,o.hcol)","hair:hairCol(r,o)"]: assert k in head,k
head=head.replace("const other=(r,c,pal=PAL.map(p=>p[0]))=>{const L0=Lof(c);const o=pal.filter(x=>Math.abs(Lof(x)-L0)>=2);return pk(r,o.length?o:pal.filter(x=>x!==c));};",
 "const other=(r,c,pal=PAL.map(p=>p[0]))=>{const L0=Lof(c),inP=x=>PAL.some(q=>q[0]===x);const o=pal.filter(x=>x!==c&&cdist(x,c)>=110&&!(inP(x)&&inP(c)&&Math.abs(Lof(x)-L0)<2));return pk(r,cvdPrefer(o.length?o:[pal.filter(x=>x!==c).sort((a,b)=>cdist(b,c)-cdist(a,c))[0]],c));};")
assert "cdist(x,c)>=110" in head
head=head.replace("K.star={draw:p=>p.on?sparkle(p.x,p.y,p.s||1.4,p.c||'#e2e8f0'):'',muts:p=>[{...tog(p,'on',[p.x-2.2,p.y-2.2,4.4,4.4]),g:'star'}]};",
 "K.star={draw:p=>!p.on?'':p.big?G(`rotate(45 ${p.x} ${p.y})`,sparkle(p.x,p.y,p.s*0.6,p.c))+sparkle(p.x,p.y,p.s,p.c):sparkle(p.x,p.y,p.s||1.4,p.c||'#e2e8f0'),"
 "muts:p=>{const h=p.big?p.s+0.9:2.2,b=[p.x-h,p.y-h,2*h,2*h],m=[{...tog(p,'on',b),g:'star'}];if(p.big&&p.on)m.push({t:'color',p2:{...p,c:p.c==='#fde68a'?'#e2e8f0':'#fde68a'},b,g:'star'});return m;}};")
assert "p.big&&p.on" in head
head=head.replace(".map(({it,i})=>{const d=diffs&&diffs.find(x=>x.i===i);return K[it.kind].draw(d?d.p2:it.p);}).join('');}",
 ".map(({it,i})=>{const ds=diffs?diffs.filter(x=>x.i===i):[];let p=it.p;"
 "/* several changes on one item: each changes other keys (the picker makes sure), so they combine */"
 "for(const d of ds){p={...p};for(const k in d.p2)if(JSON.stringify(d.p2[k])!==JSON.stringify(it.p[k]))p[k]=d.p2[k];}"
 "return K[it.kind].draw(p);}).join('');}")
assert "several changes on one item" in head
extra=[a for a in sys.argv[1:]]
body='\n'.join(open(f).read() for f in ['scenes/part-'+p+'.js' for p in 'abcdef']+extra)
open('out/scenes.html','w').write(head+'\n'+body+'\n'+cards)
# node test harness: everything except the cards
open('out/t.cjs','w').write(head.split('<script>',1)[1]+'\n'+body+'\nmodule.exports={GENS,K,pickDiffs,rnd,renderItems,PW};')
gal="""/* gallery */
const out=document.getElementById('out');const q=new URLSearchParams(location.search);const gi=+(q.get('g')||0),base=+(q.get('s')||1);
let h='';for(let k=0;k<6;k++){const items=GENS[gi].gen(rnd((base+k)*7919));h+=`<svg viewBox="0 0 120 90" style="width:370px;height:277px;margin:3px;border-radius:4px">${renderItems(items)}</svg>`;}
out.innerHTML=`<b>${GENS[gi].name}</b><br>`+h;
</script></body></html>"""
ov="""/* overview */
const out=document.getElementById('out');const base=+(new URLSearchParams(location.search).get('s')||1);let h='';
GENS.forEach((g,gi)=>{const items=g.gen(rnd(base*7919+gi));h+=`<svg viewBox="0 0 120 90" style="width:380px;height:285px;margin:2px;border-radius:4px">${renderItems(items)}</svg>`;});
out.innerHTML=h;document.querySelector('h1').remove();document.querySelector('p.sub').remove();
</script></body></html>"""
open('out/gallery.html','w').write(head+'\n'+body+'\n'+gal)
open('out/over.html','w').write(head+'\n'+body+'\n'+ov)
zm="""/* zoom */
const q=new URLSearchParams(location.search);const items=GENS[+q.get('g')].gen(rnd(+(q.get('s')||1)*7919));
document.body.innerHTML=`<svg viewBox="${q.get('vb')||'0 0 120 90'}" style="width:${q.get('w')||760}px;background:#000">${renderItems(items)}</svg>`;
</script></body></html>"""
open('out/zoom.html','w').write(head+'\n'+body+'\n'+zm)
px="""/* pixel visibility check */
const W=600,H=450;
async function raster(inner){for(let k=0;k<4;k++){const d=await raster1(inner);let nz=0;for(let i=0;i<d.length;i+=400)if(d[i]+d[i+1]+d[i+2]>0)nz++;if(nz>d.length/400*0.5)return d;}throw new Error('blank render');}
async function raster1(inner){const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="${W}" height="${H}">${inner}</svg>`;
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();
  const c=new OffscreenCanvas(W,H),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);x.drawImage(img,0,0);return x.getImageData(0,0,W,H).data;}
/* red-green colour blindness (Machado et al. 2009, severity 1): deuteranopia, protanopia */
const CVDM=[[[0.367,0.861,-0.228],[0.280,0.673,0.047],[-0.012,0.043,0.969]],[[0.152,1.053,-0.205],[0.115,0.786,0.099],[-0.004,-0.048,1.052]]];
window.runPx=async(gs,seeds)=>{const res=[];
  for(const gi of gs){const g=GENS[gi];for(let s=1;s<=seeds;s++){const items=g.gen(rnd(s*7919));if(!items)continue;const base=await raster(renderItems(items));
    for(const it of items){const k=K[it.kind];if(!k||!k.muts)continue;if(window.ONLY&&it.kind!==window.ONLY)continue;let ms;try{ms=k.muts(it.p,rnd(s)).filter(m=>onCanvas(m.b));}catch(e){continue;}
      for(const m of ms){let n=0,tot=0;for(let tr=0;tr<3&&n<15;tr++){const b2=tr?await raster(renderItems(items)):base;const d=await raster(renderItems(items.map(x=>x===it?{...it,p:m.p2}:x)));n=0;tot=0;
        for(let i=0;i<d.length;i+=4){const dd=Math.abs(d[i]-b2[i])+Math.abs(d[i+1]-b2[i+1])+Math.abs(d[i+2]-b2[i+2]);if(dd>12)tot++;if(dd>90)n++;}}
        const dif={};const fl=(a,b,pre)=>{for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})])){const x=a?.[k],y=b?.[k];if(JSON.stringify(x)===JSON.stringify(y))continue;if(x&&y&&typeof x==='object'&&!Array.isArray(x))fl(x,y,pre+k+'.');else dif[pre+k]=JSON.stringify(x)+'>'+JSON.stringify(y);}};fl(it.p,m.p2,'');
        let cvd=n;if(window.CVD){const d=await raster(renderItems(items.map(x=>x===it?{...it,p:m.p2}:x)));for(const M of CVDM){let c=0;for(let i=0;i<d.length;i+=4){let dd=0;for(let ch=0;ch<3;ch++){const a=M[ch][0]*d[i]+M[ch][1]*d[i+1]+M[ch][2]*d[i+2],b=M[ch][0]*base[i]+M[ch][1]*base[i+1]+M[ch][2]*base[i+2];dd+=Math.abs(a-b);}if(dd>45)c++;}cvd=Math.min(cvd,c);}}
        res.push({g:g.name,kind:it.kind+(window.ONLY?'#'+s:''),t:m.t,strong:n,any:tot,cvd,dif:JSON.stringify(dif),ex:n<15?'s'+s+' '+JSON.stringify(dif):''});}}}}
  return res;};
const qq=new URLSearchParams(location.search);
if(qq.get('one')){const[gi,sd,kind,mi]=qq.get('one').split(',');const fresh=renderItems(GENS[+gi].gen(rnd(+sd*7919)));if(qq.get('pre'))for(let k=1;k<+sd;k++)GENS[+gi].gen(rnd(k*7919));const items=GENS[+gi].gen(rnd(+sd*7919));const[kn,kk]=kind.split('#');const it=items.filter(i=>i.kind===kn)[+(kk||0)];const m=K[kn].muts(it.p,rnd(+sd))[+mi];
  const a=renderItems(items),b=renderItems(items.map(x=>x===it?{...it,p:m.p2}:x));Promise.all([raster(a),raster(b)]).then(([A,B])=>{let n=0,nz=0;for(let i=0;i<A.length;i+=4){if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>12)n++;if(A[i]+A[i+1]+A[i+2]>0)nz++;}
  const pre=document.createElement('pre');pre.id='res';pre.textContent='diff '+n+' nonblack '+nz+' lenA '+a.length+' lenB '+b.length+' t '+m.t+' sameAsFresh '+(a===fresh);document.body.appendChild(pre);});}
else if(qq.get('cvd')){window.CVD=1;runPx(qq.get('cvd').split(',').map(Number),+(qq.get('n')||6)).then(r=>{const bad=r.filter(x=>x.strong>=40&&x.cvd<Math.max(25,0.3*x.strong));const pre=document.createElement('pre');pre.id='res';pre.textContent=bad.map(x=>`${x.g}|${x.kind}|${x.t}\t${x.strong}\t${x.cvd}\t${x.dif}`).join(String.fromCharCode(10));document.body.appendChild(pre);});}
else if(qq.get('g')){window.ONLY=qq.get('only');runPx(qq.get('g').split(',').map(Number),+(qq.get('n')||6)).then(r=>{const agg={};for(const x of r){const k=x.g+'|'+x.kind+'|'+x.t;(agg[k]=agg[k]||[]).push(x);}
  const med=a=>{a=[...a].sort((p,q)=>p-q);return a[a.length>>1];};
  const out=Object.entries(agg).map(([k,a])=>({ex:(a.find(x=>x.ex)||{}).ex||'',k,n:a.length,min:Math.min(...a.map(x=>x.strong)),med:med(a.map(x=>x.strong)),any:med(a.map(x=>x.any))})).sort((a,b)=>a.min-b.min);
  const pre=document.createElement('pre');pre.id='res';pre.textContent=out.map(o=>`${o.k}\tn${o.n}\tmin ${o.min}\tmed ${o.med}\tany ${o.any}\t${o.ex}`).join(String.fromCharCode(10));document.body.appendChild(pre);});}
else document.body.innerHTML='px ready';
</script></body></html>"""
open('out/px.html','w').write(head+'\n'+body+'\n'+px)
size="""/* true size: two pictures side by side in the 768 x 512 stage, the 3 smallest changes */
document.querySelector('h1').textContent='True size: the 3 smallest changes';document.querySelector('p.sub').textContent='Each block is the real 768 × 512 stage. Click a block to show or hide the answers. New = other pictures.';
const out=document.getElementById('out');const W=378,H=W*0.75;
const tiny=(items,r)=>{const c=[];items.forEach((it,i)=>{const k=K[it.kind];if(!k.muts)return;k.muts(it.p,r).forEach(m=>{if(onCanvas(m.b))c.push({i,...m,g:m.g||it.g||(AUTOG.has(it.kind)?'k:'+it.kind:undefined)});});});
  c.sort((a,b)=>a.b[2]*a.b[3]-b.b[2]*b.b[3]);const o=[];for(const x of c){if(o.length===3)break;if(o.some(y=>y.i===x.i||(x.g&&y.g===x.g)))continue;if(o.some(y=>Math.hypot(x.b[0]+x.b[2]/2-y.b[0]-y.b[2]/2,x.b[1]+x.b[3]/2-y.b[1]-y.b[3]/2)<14))continue;o.push(x);}return o;};
const draw=()=>{out.innerHTML='';[0,9,10,3,6,2].forEach(gi=>{const items=GENS[gi].gen(rnd(Math.random()*1e9)),d=tiny(items,rnd(Math.random()*1e9));
  const marks=d.map(x=>R(x.b[0]-1.5,x.b[1]-1.5,x.b[2]+3,x.b[3]+3,'none','rx="2" stroke="#f87171" stroke-width="0.9" stroke-dasharray="2 1.5"')).join('');
  const el=document.createElement('div');el.style.cssText='width:768px;height:512px;background:#0b1220;border:1px solid #334155;margin:10px 0;position:relative;cursor:pointer';
  el.innerHTML=`<div style="position:absolute;top:8px;left:8px;color:#94a3b8;font:13px system-ui">${GENS[gi].name} · smallest: ${d.map(x=>items[x.i].kind+' '+x.t).join(', ')}</div>
   <div style="position:absolute;top:${(512-H)/2}px;left:${(768-2*W-8)/2}px;display:flex;gap:8px"><svg viewBox="0 0 120 90" width="${W}" height="${H}">${renderItems(items)}<g style="display:none">${marks}</g></svg><svg viewBox="0 0 120 90" width="${W}" height="${H}">${renderItems(items,d)}<g style="display:none">${marks}</g></svg></div>`;
  el.onclick=()=>el.querySelectorAll('g[style]').forEach(g=>g.style.display=g.style.display==='none'?'':'none');out.appendChild(el);});};
const b=document.createElement('button');b.textContent='New';b.onclick=draw;document.body.insertBefore(b,out);draw();
</script></body></html>"""
open('out/size.html','w').write(head+'\n'+body+'\n'+size)
# the app's copy: an ES module with the scenes, the picker and the renderer (generated; edit scenes/ and rebuild)
os.makedirs('../../src/tests/spot-difference',exist_ok=True)
open('../../src/tests/spot-difference/scenes.gen.js','w').write('/* GENERATED by scripts/spot-difference/build.py from scenes/ and base.html. Do not edit by hand. */\n/* eslint-disable */\n'+head.split('<script>',1)[1]+'\n'+body+'\nexport{GENS,K,pickDiffs,rnd,renderItems};\n')
