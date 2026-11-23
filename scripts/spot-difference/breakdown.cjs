const {GENS,K,pickDiffs,rnd}=require('./out/t.cjs');
const gi=+process.argv[2];const g=GENS[gi];const U={};let n=0;const P=300,D=4;
const unitOf=(it,idx)=>it.g||(AUTOG_HAS(it.kind)?'k:'+it.kind:it.kind+'#'+idx);
const {readFileSync}=require('fs');const AUT=new Set((readFileSync(__dirname+'/scenes/part-a.js','utf8').match(/AUTOG=new Set\(\[([^\]]*)\]/)[1]).replace(/'/g,'').split(','));const AUTOG_HAS=k=>AUT.has(k);
for(let s=1;s<=P;s++){const items=g.gen(rnd(s*7919));const per={};
  items.forEach((it,i)=>{const k=K[it.kind];if(!k.muts)return;const m=k.muts(it.p,rnd(s)).length;if(!m)return;const sameKind=items.filter(x=>x.kind===it.kind);const u=unitOf(it,sameKind.indexOf(it));(per[u]=per[u]||{kind:it.kind,members:0,ch:0}).members++;per[u].ch+=m;});
  for(const u in per){const o=U[u]=U[u]||{kind:per[u].kind,present:0,members:0,ch:0,picked:0};o.present++;o.members+=per[u].members;o.ch+=per[u].ch;}
  for(let d=0;d<D;d++){n++;const seen=new Set();pickDiffs(items,rnd(s*31+d),+(process.argv[3]||3),{lastFree:process.argv[4]==='free'}).diffs.forEach(c=>{const it=items[c.i];const sameKind=items.filter(x=>x.kind===it.kind);seen.add(unitOf(it,sameKind.indexOf(it)));});seen.forEach(u=>{if(U[u])U[u].picked++;});}}
const rows=Object.entries(U).map(([u,o])=>({u,kind:o.kind,grp:u.startsWith('k:')||!u.includes('#'),present:Math.round(100*o.present/P),members:(o.members/o.present),chPer:(o.ch/o.members),share:Math.round(100*o.picked/n),when:Math.round(100*o.picked/(o.present*D))}));
rows.sort((a,b)=>b.share-a.share);
console.log(JSON.stringify(rows));
