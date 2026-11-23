const {GENS,K,pickDiffs,rnd}=require('./out/t.cjs');
const EX=new Set(['bld2+win','nbld+win','nbld+roof','win+nbld','roof+nbld','win+bld2','kwin+sill','sill+kwin','mtree+mtree','ldoor+ldoor']);
const hit=(a,b)=>a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3];
for(const g of GENS){const ov={};let n3=0,easy=[0,0,0,0],types={},cats={},err=0,lit=[],things=[],cands=0;
  for(let s=1;s<=300;s++){let items;try{items=g.gen(rnd(s*7919));}catch(e){err++;if(err<3)console.log(g.name,e.message);continue;}
    const bx=items.map((it,i)=>{const k=K[it.kind];if(!k.muts)return[];try{return k.muts(it.p,rnd(s)).map(m=>m.b);}catch(e){err++;if(err<3)console.log(g.name,it.kind,e.stack.split('\n').slice(0,2).join(' '));return[];}});
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const key=items[i].kind+'+'+items[j].kind;if(EX.has(key))continue;
      if(bx[i].some(a=>bx[j].some(b=>hit(a,b)))){ov[key]=(ov[key]||0)+1;}}
    if(g.name==='Night city'){const w=items.filter(i=>i.kind==='win');lit.push(w.filter(x=>x.p.lit).length);things.push(w.filter(x=>x.p.lit&&x.p.c!=='none').length);}
    for(let d=0;d<3;d++){const res=pickDiffs(items,rnd(s*31+d));cands+=res.all;if(res.diffs.length===3)n3++;easy[res.diffs.filter(x=>x.easy).length]++;res.diffs.forEach(x=>{types[x.t]=(types[x.t]||0)+1;cats[x.cat]=(cats[x.cat]||0)+1;});}}
  console.log('\n==',g.name,'errors',err,'| exactly3',n3,'/900 | easy0/1/2',easy.slice(0,3).join('/'),'| avg cands',(cands/900).toFixed(0));
  console.log(' overlaps',JSON.stringify(ov));console.log(' types',JSON.stringify(types));console.log(' cats',JSON.stringify(cats));
  if(lit.length)console.log(' lit min/max',Math.min(...lit),Math.max(...lit),' things min/max',Math.min(...things),Math.max(...things));}
