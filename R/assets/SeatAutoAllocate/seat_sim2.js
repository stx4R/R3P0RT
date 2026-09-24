// 실행: node seat_sim2.js seat_sim.js  (초기 배정 방식별 공정성, 빈 좌석 포함 TTC(YRMH-IGYT) 개선안)
const fs=require('fs'); (0,eval)(fs.readFileSync(process.argv[2],'utf8').split('function run(')[0].replace(/^const /gm,'var '));
// popularity-weighted prefs: seat i weight = exp(-i/8) (front seats popular)
function popPrefs(all){ const w=all.map((_,i)=>Math.exp(-i/8)); const out=[]; const pool=all.map((s,i)=>[s,w[i]]);
  while(out.length<5){ const tot=pool.reduce((a,b)=>a+b[1],0); let r=Math.random()*tot, k=0; while(r>pool[k][1]){r-=pool[k][1];k++;} out.push(pool[k][0]); pool.splice(k,1);} return out; }
// 1) order vs random endowment with popular front seats, n=30 seats=30
for (const endow of ['order','random']) {
  const T=5000; let first=Array(30).fill(0);
  for(let t=0;t<T;t++){ const students=Array.from({length:30},(_,i)=>'S'+i), all=Array.from({length:30},(_,i)=>'Seat_'+(i+1));
    const prefs={}; students.forEach(s=>prefs[s]=popPrefs(all)); const market= endow==='order'? all : fy(all);
    const a=ttc(students,prefs,market); students.forEach((s,i)=>{ if(a[s]===prefs[s][0]) first[i]++; }); }
  const f=i=>(100*first[i]/T).toFixed(1);
  console.log(`${endow}: 1st-choice rate  students#1-5 avg ${(first.slice(0,5).reduce((a,b)=>a+b)/5/T*100).toFixed(1)}%  #26-30 avg ${(first.slice(25).reduce((a,b)=>a+b)/5/T*100).toFixed(1)}%`);
}
// 2) YRMH-IGYT: include vacant seats; vacant seat points to highest-priority active student
function yrmh(students, prefs, owned, vacant, order){ // owned: seat per student; order: priority list
  const owner={}; students.forEach((s,i)=>owner[owned[i]]=s); const own={}; students.forEach((s,i)=>own[s]=owned[i]);
  let activeS=new Set(students), remainSeats=new Set([...owned,...vacant]); const alloc={};
  while(activeS.size){
    const next={}; // node -> node ; students 'S', seats 'Seat'
    const pr=order.filter(s=>activeS.has(s));
    for(const s of activeS){ let top=null; for(const p of prefs[s]) if(remainSeats.has(p)){top=p;break;} if(!top) top=own[s]&&remainSeats.has(own[s])?own[s]:[...remainSeats][0]; next[s]=top; }
    for(const seat of remainSeats){ const o=owner[seat]; next[seat]= (o&&activeS.has(o))? o : pr[0]; }
    // find cycles
    const seen=new Set(); const rmS=[], rmSeat=[];
    for(const start of activeS){ if(seen.has(start)) continue; const path=[]; let c=start; const idx=new Map();
      while(!seen.has(c) && !idx.has(c)){ idx.set(c,path.length); path.push(c); c=next[c]; }
      if(idx.has(c)){ const cyc=path.slice(idx.get(c)); for(let i=0;i<cyc.length;i++){ const n=cyc[i]; if(n.startsWith('S')&&!n.startsWith('Seat')){ alloc[n]=next[n]; rmS.push(n); rmSeat.push(next[n]); } } }
      path.forEach(n=>seen.add(n)); }
    rmS.forEach(s=>activeS.delete(s)); rmSeat.forEach(x=>remainSeats.delete(x));
  }
  return alloc;
}
for (const [n,m] of [[24,30],[24,36]]) { const T=3000; let h1=0,h5=0; 
  for(let t=0;t<T;t++){ const students=Array.from({length:n},(_,i)=>'S'+i), all=Array.from({length:m},(_,i)=>'Seat_'+(i+1));
    const prefs={}; students.forEach(s=>prefs[s]=fy(all).slice(0,5)); const sh=fy(all); const owned=sh.slice(0,n), vacant=sh.slice(n);
    const a=yrmh(students,prefs,owned,vacant,fy(students)); students.forEach(s=>{const r=prefs[s].indexOf(a[s]); if(r===0)h1++; if(r>=0)h5++;}); }
  console.log(`YRMH-IGYT n=${n} seats=${m}: 1st ${(100*h1/(n*T)).toFixed(1)}% top5 ${(100*h5/(n*T)).toFixed(1)}%`); }
