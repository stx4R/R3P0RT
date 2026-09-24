// 실행: node seat_sim.js  (SeatAutoAllocate 웹 버전 runAlgorithm의 TTC를 그대로 옮긴 모의실험)
// Port of SeatAutoAllocate web TTC (index.html runAlgorithm) for simulation
function ttc(students, prefs, seats) { // seats: endowment list aligned with students
  const currOwners={}, seatToOwner={};
  students.forEach((s,i)=>{currOwners[s]=seats[i]; seatToOwner[seats[i]]=s;});
  let active=[...students]; const alloc={};
  while(active.length){
    const graph={};
    for(const s of active){ let top=null; for(const p of prefs[s]||[]){ if(seatToOwner[p]&&active.includes(seatToOwner[p])){top=p;break;} } if(!top) top=currOwners[s]; graph[s]=seatToOwner[top]; }
    const visited=new Set(), processed=new Set(); let found=false;
    const getCycle=(c,path)=>{ if(path.includes(c)) return path.slice(path.indexOf(c)); if(visited.has(c)) return null; visited.add(c); path.push(c); if(graph[c]){const r=getCycle(graph[c],path); if(r) return r;} path.pop(); return null; };
    for(const s of active){ if(!visited.has(s)&&!processed.has(s)){ const cyc=getCycle(s,[]); if(cyc){found=true; for(const st of cyc){ alloc[st]=currOwners[graph[st]]; processed.add(st);} } } }
    if(!found) for(const s of active) if(!processed.has(s)){alloc[s]=currOwners[s];processed.add(s);}
    active=active.filter(s=>!processed.has(s));
  }
  return alloc;
}
const sortShuffle=a=>[...a].sort(()=>0.5-Math.random());
const fy=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function trial(nS,nSeat,endow){
  const students=Array.from({length:nS},(_,i)=>'S'+i), all=Array.from({length:nSeat},(_,i)=>'Seat_'+(i+1));
  const prefs={}; students.forEach(s=>prefs[s]=fy(all).slice(0,5));
  const market = endow==='order'? all.slice(0,nS) : sortShuffle(all).slice(0,nS);
  const alloc=ttc(students,prefs,market);
  const rank=students.map(s=>{const r=prefs[s].indexOf(alloc[s]); return r<0?6:r+1;});
  // how many students listed a seat outside the market in their top1
  const outside=students.filter(s=>!market.includes(prefs[s][0])).length;
  return {rank,outside};
}
function run(nS,nSeat,endow,T=5000){
  const hist=[0,0,0,0,0,0,0]; let out=0;
  for(let t=0;t<T;t++){const r=trial(nS,nSeat,endow); r.rank.forEach(k=>hist[k]++); out+=r.outside;}
  const n=nS*T; const pct=k=>(100*hist[k]/n).toFixed(1);
  console.log(`${endow} n=${nS} seats=${nSeat}: 1st ${pct(1)}% | top3 ${(100*(hist[1]+hist[2]+hist[3])/n).toFixed(1)}% | top5 ${(100*(n-hist[6])/n).toFixed(1)}% | none-of-5 ${pct(6)}% | 1st-choice-outside-market ${(100*out/n).toFixed(1)}%`);
}
run(30,30,'random'); run(24,30,'random'); run(24,36,'random'); run(30,30,'order');
// sort-shuffle bias: prob element 0 ends at position 0 among 30 (ideal 3.33%)
let c0=0, cl=0; const T=200000, base=Array.from({length:30},(_,i)=>i);
for(let t=0;t<T;t++){const s=sortShuffle(base); if(s[0]===0)c0++; if(s[29]===0)cl++;}
console.log(`sortShuffle n=30: P(first stays first)=${(100*c0/T).toFixed(2)}% P(first goes last)=${(100*cl/T).toFixed(2)}% ideal=3.33%`);
