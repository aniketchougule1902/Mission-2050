export const VERSION=1;
export const choices={
 energy:[{id:'efficiency',delta:[-16,12,0],points:20,reserve:8,workers:1},{id:'coal',delta:[18,4,-4],points:-25,reserve:12,workers:1},{id:'closure',delta:[-22,-8,0],points:5,reserve:-8,workers:-1}],
 solar:[{id:'school',delta:[-12,24,0],points:20,reserve:0},{id:'mall',delta:[-4,12,0],points:5,reserve:0},{id:'tower',delta:[-8,18,0],points:10,reserve:0}],
 land:[{id:'infill',delta:[-10,0,28],points:20},{id:'clear',delta:[8,0,-20],points:-10},{id:'block',delta:[-6,0,15],points:5,access:-1}],
 river:[{id:'effluent',delta:[0,0,22],points:20},{id:'plastic',delta:[0,0,5],points:5},{id:'runoff',delta:[0,0,8],points:5}]
};
export const costs={buses:50,cycling:20,backup:15,training:15,roads:35,petrol:30};
export function fresh(players=1){return {version:VERSION,stage:0,decisions:[],budget:[],carbon:82,energy:18,ecosystem:15,reserve:4,workers:0,access:0,scores:Array(players).fill(100),evidence:[],position:[0,15]};}
const clamp=n=>Math.max(0,Math.min(100,n));
export function decide(s,stage,id){
 const c=choices[stage]?.find(c=>c.id===id);if(!c)throw Error('Invalid choice');
 const n=structuredClone(s),player=n.decisions.length%n.scores.length;
 n.decisions.push({stage,id});n.stage=n.decisions.length;
 n.carbon=clamp(n.carbon+c.delta[0]);n.energy=clamp(n.energy+c.delta[1]);n.ecosystem=clamp(n.ecosystem+c.delta[2]);n.reserve+=c.reserve||0;n.workers+=c.workers||0;n.access+=c.access||0;n.scores[player]+=c.points;
 return n;
}
export function budgetTotal(ids){return ids.reduce((sum,id)=>sum+(costs[id]??1000),0);}
export function assess(s,ids){
 const total=budgetTotal(ids);if(new Set(ids).size!==ids.length||ids.some(id=>!(id in costs))||total>100)throw Error('Invalid budget');
 const clean=ids.includes('buses')||ids.includes('cycling');
 const reserve=s.reserve+(ids.includes('backup')?16:0)-(ids.includes('buses')?14:0);
 const workers=s.workers+(ids.includes('training')?2:0);
 const carbon=clamp(s.carbon-(ids.includes('buses')?18:0)-(ids.includes('cycling')?8:0)+(ids.includes('roads')?10:0)+(ids.includes('petrol')?15:0));
 const energy=clamp(s.energy+(ids.includes('backup')?8:0));
 const validRiver=s.decisions.some(d=>d.stage==='river'&&d.id==='effluent');
 const access=s.access+(ids.includes('cycling')?1:0)+(ids.includes('training')?1:0);
 const safe=reserve>=10&&workers>=1&&clean;
 const green=safe&&carbon<=40&&energy>=45&&s.ecosystem>=60&&validRiver&&access>=1;
 return {ending:green?'green':safe?'survival':'critical',total,reserve,workers,carbon,energy,ecosystem:s.ecosystem,access,validRiver,checks:{clinic:reserve>=10,workers:workers>=1,transport:clean,carbon:carbon<=40,ecosystem:s.ecosystem>=60,river:validRiver}};
}
export function replay(decisions,players=1){if(!Number.isInteger(players)||players<1||players>4||!Array.isArray(decisions)||decisions.length!==4)throw Error('Invalid run');let s=fresh(players);for(let i=0;i<4;i++){if(decisions[i].stage!==Object.keys(choices)[i])throw Error('Invalid order');s=decide(s,decisions[i].stage,decisions[i].id);}return s;}
export function restore(raw){try{const r=JSON.parse(raw);if(r.version!==VERSION||!Array.isArray(r.decisions)||r.decisions.length>4||!Array.isArray(r.scores)||r.scores.length<1||r.scores.length>4)return null;let s=fresh(r.scores.length);r.decisions.forEach((d,i)=>{if(d.stage!==Object.keys(choices)[i])throw Error('order');s=decide(s,d.stage,d.id);});if(Array.isArray(r.budget)&&new Set(r.budget).size===r.budget.length&&r.budget.every(i=>i in costs)&&budgetTotal(r.budget)<=100)s.budget=r.budget;if(Array.isArray(r.position)&&r.position.length===2&&r.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=45))s.position=r.position;return s;}catch{return null;}}
