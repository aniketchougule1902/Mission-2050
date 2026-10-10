import {locateAction,LAB_Y,LAB_X,LAB_Z,lift,spawn} from './layout.js';
import {fresh,decide,assess,costs,budgetTotal,restore as restoreRules} from './rules.js';
export const stoneColors=[0xffa93c,0x35cfff,0x60ef8d,0x56e0df,0xb578ff];
export const corePosition=[LAB_X,LAB_Z-8];
export function freshAdventure(players=1){return {version:3,layoutVersion:2,location:'city',assembled:[],stone:-1,tasks:[],inventory:'',rules:fresh(players),position:[...spawn],heat:0,night:null,ending:null};}
export function restoreVehicle(raw,location='city'){
 if(!raw||!Array.isArray(raw.position)||raw.position.length!==3||raw.position.some(v=>!Number.isFinite(v))||Math.abs(raw.position[0])>300||Math.abs(raw.position[2])>300||Math.abs(raw.position[1])>.1||!Number.isFinite(raw.heading)||typeof raw.driving!=='boolean')return null;
 return {position:[raw.position[0],0,raw.position[2]],heading:Math.atan2(Math.sin(raw.heading),Math.cos(raw.heading)),driving:location==='city'&&raw.driving};
}
export const phaseOf=a=>Math.min(a.assembled.length,4);
const has=(a,id)=>a.tasks.includes(id);
function action(id,key,x,z,kind='work',duration=1.4,y=0){return {id,key,x,z,y,kind,duration};}
function missionActions(a){
 if(a.ending)return [];
 const phase=phaseOf(a), list=[];
 if(a.stone>=0)return [action('assemble','act.assemble',0,14,'assemble',.8),...(a.stone===1?[action('ladder','act.climb',-15,-11,'ladder',.7)]:[])];
 if(a.assembled.length===5)return [action('activate','act.activate',0,14,'activate',2)];
 if(phase===0){
  if(!has(a,'fuse'))list.push(action('fuse','act.fuse',-7,14,'pickup',.5));
  else if(!has(a,'power')){list.push(action('power','act.efficiency',-10,3,'switch',2));list.push(action('coal','act.coal',-14,3,'switch',2));}
  else if(!has(a,'circuit'))list.push(action('circuit','act.circuit',-15,9,'repair',3));
  else if(!has(a,'clinic'))list.push(action('clinic','act.clinic',-16,12,'talk',1));
  else list.push(action('gem','act.collect',-15,8,'gem',.8));
 }
 if(phase===1){
  list.push(action('ladder','act.climb',-15,-11,'ladder',.7));
  if(!has(a,'panels'))list.push(action('panels','act.panels',-17,-12,'pickup',1,4.4));
  else {const slots=[['panel1',-22,-13],['panel2',-20,-16],['panel3',-18,-19],['shade',-23,-19]];if(a.tasks.filter(x=>x.startsWith('panel')&&x!=='panels'||x==='shade').length<3)slots.filter(([id])=>!has(a,id)).forEach(([id,x,z])=>list.push(action(id,id==='shade'?'act.shaded':'act.installPanel',x,z,'panel',2,4.4)));else list.push(action('gem','act.collect',-17,-16,'gem',.8,4.4));}
 }
 if(phase===2){
  if(!has(a,'stakes'))list.push(action('stakes','act.stakes',8,-9,'pickup',.8));
  else if(!has(a,'housing1')||!has(a,'housing2')){if(!has(a,'housing1'))list.push(action('housing1','act.housing',8,-14,'stake',1.8));if(!has(a,'housing2'))list.push(action('housing2','act.housing',8,-19,'stake',1.8));}
  else if(!has(a,'grove')){list.push(action('grove','act.protect',14,-14,'protect',2));list.push(action('clear','act.clear',11,-14,'switch',2));}
  else if(!has(a,'water1')||!has(a,'water2')){if(!has(a,'water1'))list.push(action('water1','act.water',13,-20,'plant',2));if(!has(a,'water2'))list.push(action('water2','act.water',19,-23,'plant',2));}
  else list.push(action('gem','act.collect',10,-12,'gem',.8));
 }
 if(phase===3){
  if(!has(a,'scan1'))list.push(action('scan1','act.sampleUpstream',24,-2,'scan',1.4));
  if(!has(a,'scan2'))list.push(action('scan2','act.sampleOutfall',25,8,'scan',1.4));
  if(!has(a,'scan3'))list.push(action('scan3','act.records',21,11,'scan',1.4));
  if(['scan1','scan2','scan3'].every(id=>has(a,id))&&!has(a,'valve')){list.push(action('valve','act.valve',26,10,'valve',3));list.push(action('litter','act.litter',22,5,'pickup',2));}
  if(has(a,'valve'))list.push(action('gem','act.collect',22,8,'gem',.8));
 }
 if(phase===4){
  if(!has(a,'cargo'))list.push(action('cargo','act.cargo',-4,16,'pickup',1));
  else if(!has(a,'depotDelivery'))list.push(action('depotDelivery','act.deliverDepot',2,25,'deliver',1.5));
  else if(!has(a,'clinicDelivery'))list.push(action('clinicDelivery','act.deliverClinic',-13,12,'deliver',1.5));
  else {Object.keys(costs).forEach((id,i)=>list.push({...action('budget:'+id,'act.budget.'+id,-12+i*4,21,'budget',.6),cost:costs[id],selected:a.rules.budget.includes(id)}));list.push(action('night','act.night',0,25,'test',2));if(a.night){if(a.night.ending!=='critical')list.push(action('gem','act.collect',4,25,'gem',.8));else list.push(action('override','act.override',4,25,'switch',3));}}
 }
 return list;
}
export function actionsFor(a){
 if(a.ending)return [];
 const ride=action('lift',a.location==='lab'?'act.liftUp':'act.liftDown',...lift,'lift',.6,a.location==='lab'?LAB_Y:0);
 if(a.location==='lab')return [ride,...(a.stone>=0?[action('assemble','act.handover',LAB_X-2,LAB_Z+3,'handover',1,LAB_Y)]:a.assembled.length===5?[action('activate','act.activate',LAB_X,LAB_Z-3,'activate',2,LAB_Y)]:[action('brief','act.brief',LAB_X-2,LAB_Z+3,'talk',1,LAB_Y)])];
 if(a.stone>=0)return [ride,...(a.stone===1?[locateAction(action('ladder','act.climb',0,0,'ladder',.7),1)]:[])];
 if(a.assembled.length===5)return [ride];
 return [...missionActions(a).map(x=>locateAction(x,phaseOf(a))),ride];
}
export function act(a,id){
 if(!actionsFor(a).some(x=>x.id===id))throw Error('Action not available');
 const n=structuredClone(a),p=phaseOf(a);
 if(id==='ladder'||id==='brief')return n;
 if(id==='lift'){n.location=n.location==='lab'?'city':'lab';n.position=[lift[0],n.location==='lab'?LAB_Y:0,lift[1]];return n;}
 if(id.startsWith('budget:')){const b=id.slice(7),ids=n.rules.budget.includes(b)?n.rules.budget.filter(x=>x!==b):[...n.rules.budget,b];if(budgetTotal(ids)>100)throw Error('Budget exceeded');n.rules.budget=ids;n.night=null;return n;}
 if(id==='night'){n.night=assess(n.rules,n.rules.budget);return n;}
 if(id==='activate'){n.ending=assess(n.rules,n.rules.budget);return n;}
 if(id==='assemble'){if(n.stone!==n.assembled.length)throw Error('Wrong socket');n.assembled.push(n.stone);n.stone=-1;n.inventory='';return n;}
 if(id==='gem'||id==='override'){
  if(p<4){const stages=['energy','solar','land','river'];const choice=p===0?(has(n,'coal')?'coal':'efficiency'):p===1?(has(n,'shade')?'tower':'school'):p===2?(has(n,'clear')?'clear':'infill'):(has(n,'litter')?'plastic':'effluent');n.rules=decide(n.rules,stages[p],choice);}
  n.stone=p;n.inventory='stone';return n;
 }
 if(!n.tasks.includes(id))n.tasks.push(id);
 if(id==='coal')n.tasks.push('power');if(id==='clear')n.tasks.push('grove');if(id==='litter')n.tasks.push('valve');
 n.inventory=id==='fuse'?'fuse':id==='panels'?'panel':id==='stakes'?'stakes':id==='cargo'?'battery':n.inventory;
 if(['circuit','clinicDelivery'].includes(id))n.inventory='';
 return n;
}
export function restoreAdventure(raw){try{const a=JSON.parse(raw);if(a.version!==3||!['city','lab'].includes(a.location)||!Array.isArray(a.assembled)||a.assembled.length>5||a.assembled.some((x,i)=>x!==i)||!Array.isArray(a.tasks)||a.tasks.length>45)return null;const rules=restoreRules(JSON.stringify(a.rules));if(!rules)return null;const expected=Math.min(a.assembled.length+(a.stone>=0&&a.stone<4?1:0),4);if(rules.stage!==expected)return null;if(a.stone!==-1&&a.stone!==a.assembled.length)return null;if(!Array.isArray(a.position)||a.position.length!==3||a.position.some(x=>!Number.isFinite(x)||Math.abs(x)>350))a.position=[...spawn];if(a.layoutVersion!==2){if(a.location==='lab'){a.position[0]+=LAB_X;a.position[2]+=LAB_Z;}a.layoutVersion=2;}a.rules=rules;a.vehicle=restoreVehicle(a.vehicle,a.location);a.heat=0;return a;}catch{return null;}}
