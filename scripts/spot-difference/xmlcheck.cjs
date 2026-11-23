const {GENS,rnd,renderItems}=require('./out/t.cjs');const fs=require('fs');const out=[];
GENS.forEach((g,gi)=>{for(let s=1;s<=40;s++){const items=g.gen(rnd(s*7919));out.push([gi,s,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90">${renderItems(items)}</svg>`]);}});
fs.writeFileSync(__dirname+'/out/xml.json',JSON.stringify(out));
