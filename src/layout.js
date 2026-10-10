// Metres. Physics, navigation, unlocks and the map share this one layout.
export const LAB_Y=-24;
export const LAB_X=24,LAB_Z=24;
export const lift=[LAB_X,LAB_Z+8];
export const parking=[14,34];
export const surfaceGuards=[[-6,0,12],[6,0,12]];
export const coreGuards=[[-6,LAB_Y,-5],[6,LAB_Y,-5],[-6,LAB_Y,-13],[6,LAB_Y,-13]];
export const spawn=[24,0,41];
export const districts=[
 {key:'district.0',center:[-27,24],radius:66,color:0xe4ab55},
 {key:'district.1',center:[-111,-85],radius:68,color:0x67b9e8},
 {key:'district.2',center:[112,-109],radius:76,color:0x80c894},
 {key:'district.3',center:[207,66],radius:76,color:0x70d9d0},
 {key:'district.4',center:[-125,196],radius:82,color:0xb19be8}
];
export const roads=[-240,-180,-120,-60,0,60,120,180,240];
const coordinates=[
 {fuse:[-14,24],power:[-34,8],coal:[-39,8],circuit:[-49,29],clinic:[-47,34],gem:[-46,29]},
 {ladder:[-99,-71],panels:[-108,-73,9],panel1:[-119,-75,9],panel2:[-116,-84,9],panel3:[-106,-92,9],shade:[-120,-92,9],gem:[-108,-84,9]},
 {stakes:[99,-86],housing1:[93,-104],housing2:[93,-123],grove:[116,-106],clear:[105,-106],water1:[108,-137],water2:[136,-126],gem:[106,-97]},
 {scan1:[214,40],scan2:[221,76],scan3:[198,65],valve:[222,72],litter:[213,64],gem:[212,69]},
 {cargo:parking,depotDelivery:[-121,194],clinicDelivery:[-46,33],night:[-125,191],gem:[-116,193],override:[-116,193]}
];
export const ecologySites=Object.freeze(Object.fromEntries(['housing1','housing2','water1','water2'].map(id=>[id,Object.freeze([...coordinates[2][id]])])));
// Surface roads and collision use the same staged connections. Adjacent unlocked
// districts must be reachable without walking through an invisible locked gap.
export const serviceConnections=Object.freeze([
 ...districts.map((d,level)=>({from:[0,0],to:d.center,level})),
 {from:districts[0].center,to:[-93,-64],level:1},
 {from:[-93,-64],to:districts[2].center,level:2},
 {from:districts[2].center,to:districts[3].center,level:3},
 {from:districts[3].center,to:districts[4].center,level:4}
]);
export function serviceCorridor(x,z,level=4,margin=12){
 return serviceConnections.some(c=>c.level<=level&&segmentDistance(x,z,...c.from,...c.to)<margin);
}
export function locateAction(action,phase){
 const xyz=action.id.startsWith('budget:')?[-140+['buses','cycling','backup','training','roads','petrol'].indexOf(action.id.slice(7))*6,202]:coordinates[phase]?.[action.id];
 return xyz?{...action,x:xyz[0],z:xyz[1],y:xyz[2]||0}:action;
}
export function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-t*dx,z-az-t*dz);}
// A road only reserves its real width against the complete building footprint.
// Relocate an affected lot inside its block instead of removing the whole block.
export function corridorIntersectsLot(x,z,w,d,clearance=7){
 return serviceConnections.some(c=>{
  let lo=0,hi=1;const half=[w/2+clearance,d/2+clearance],center=[x,z];
  for(let axis=0;axis<2;axis++){const a=c.from[axis],delta=c.to[axis]-a,min=center[axis]-half[axis],max=center[axis]+half[axis];
   if(Math.abs(delta)<1e-8){if(a<min||a>max)return false;continue;}
   const t1=(min-a)/delta,t2=(max-a)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;
  }return true;
 });
}
const landmarkFootprints=[{x:-59,z:28,w:16,d:18},{x:-112,z:-83,w:22,d:24},{x:215,z:104,w:18,d:24},{x:-142,z:180,w:24,d:18},{x:LAB_X,z:LAB_Z+3,w:20,d:24}];
function lotAvailable(x,z,w,d){
 return !corridorIntersectsLot(x,z,w,d)&&Math.hypot(x,z)>=35&&!districts.some(q=>Math.hypot(x-q.center[0],z-q.center[1])<38)&&Math.hypot(x+52,z-28)>=29&&
  !roads.some(r=>Math.abs(x-r)<w/2+9||Math.abs(z-r)<d/2+9)&&
  !landmarkFootprints.some(q=>Math.abs(x-q.x)<(w+q.w)/2+3&&Math.abs(z-q.z)<(d+q.d)/2+3);
}
export const buildingLots=Object.freeze((()=>{const lots=Array.from({length:81},(_,i)=>{
 const ix=Math.floor(i/9)-4,iz=i%9-4,seed=Math.abs(ix*19+iz*13),w=15+seed%3*2,d=17+seed%2*3;
 for(const [dx,dz] of [[18,22],[30,30],[42,38],[22,38],[38,22],[22,30],[38,30],[30,22],[30,38]]){
  const x=ix*60+dx,z=iz*60+dz;if(lotAvailable(x,z,w,d))return Object.freeze({x,z,w,d,floors:3+seed%4,type:seed%3});
 }return null;
}).filter(Boolean);
 // Keep the original residential count even where a connecting road occupies a lot.
 for(let ix=-4;ix<5&&lots.length<73;ix++)for(let iz=-4;iz<5&&lots.length<73;iz++)for(const [dx,dz] of [[20,20],[40,40],[20,40],[40,20]]){
  if(lots.length>=73)break;const x=ix*60+dx,z=iz*60+dz,w=12,d=14;
  if(lotAvailable(x,z,w,d)&&!lots.some(b=>Math.abs(x-b.x)<(w+b.w)/2+2&&Math.abs(z-b.z)<(d+b.d)/2+2))lots.push(Object.freeze({x,z,w,d,floors:3,type:1}));
 }return lots;})());
const groveTrees=Array.from({length:28},(_,i)=>[100+i%6*6,-99-Math.floor(i/6)*8]);
const treeClear=(x,z)=>!buildingLots.some(b=>Math.abs(x-b.x)<b.w/2+3&&Math.abs(z-b.z)<b.d/2+3)&&!landmarkFootprints.some(b=>Math.abs(x-b.x)<b.w/2+3&&Math.abs(z-b.z)<b.d/2+3);
const streetTrees=[];
for(let i=0;i<32;i++){
 const x=-70+i%8*20,z=49+Math.floor(i/8)*55;
 const candidates=[[0,0],[0,6],[0,-6],[8,0],[-8,0],[12,6],[-12,6],[0,12],[0,-12]].map(([dx,dz])=>[x+dx,z+dz]);
 candidates.push([Math.round(x/60)*60+10,z],[Math.round(x/60)*60+10,z+6]);
 const p=candidates.find(([px,pz])=>treeClear(px,pz)&&!streetTrees.some(q=>q[0]===px&&q[1]===pz));
 if(p)streetTrees.push(p);
}
// Extra roadside shade belongs outside the road and building footprints.
const avenueTrees=[];
for(let z=-240;z<=240;z+=24)for(const x of [-14,14]){
 if(!roads.some(r=>Math.abs(z-r)<10)&&treeClear(x,z)&&!serviceCorridor(x,z,4,7))avenueTrees.push([x,z]);
}
export const treeSites=Object.freeze([...groveTrees,...streetTrees,...avenueTrees].map(p=>Object.freeze(p)));
export function areaUnlocked(x,z,level){
 if(Math.hypot(x,z)<42||Math.hypot(x-LAB_X,z-(LAB_Z+4))<19)return true;
 return districts.some((d,i)=>i<=Math.min(level,4)&&Math.hypot(x-d.center[0],z-d.center[1])<d.radius)||serviceCorridor(x,z,level);
}
export function blocked(x,z,y,obstacles,level,location='city',radius=.38){
 if(location==='lab'){x-=LAB_X;z-=LAB_Z;return Math.abs(x)>17-radius||z>10-radius||z<-21+radius||(Math.hypot(x,z+8)<3.4+radius);}
 if(!areaUnlocked(x,z,level)||Math.abs(x)>300||Math.abs(z)>300)return true;
 if(x>231&&z>5&&z<132)return true; // canal bank
 return obstacles.some(b=>y<b.h-.02&&Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius);
}
export function roofHeight(x,z,y){return y>6&&x>=-123&&x<=-101&&z>=-95&&z<=-71?9:0;}
export function route(start,goal,isBlocked){
 // Budgeted A* with a binary min-heap: no full-array sort on every expansion.
 // A route request can never monopolise the render thread in an inaccessible district.
 const step=4;let sx=Math.round(start[0]/step),sz=Math.round(start[1]/step);
 const gx=Math.round(goal[0]/step),gz=Math.round(goal[1]/step);
 const key=(x,z)=>x+','+z,heur=(x,z)=>Math.abs(x-gx)+Math.abs(z-gz);
 const edgeClear=(ax,az,bx,bz)=>{const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);for(let i=1;i<=n;i++)if(isBlocked(ax+(bx-ax)*i/n,az+(bz-az)*i/n))return false;return true;};
 if(isBlocked(...goal))return [];
 if(edgeClear(...start,...goal))return [start,goal];
 // Connect the exact start to a clear grid node; rounding must not cross a wall.
 let seed=null,best=Infinity;
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const x=sx+dx,z=sz+dz,d=Math.hypot(x*step-start[0],z*step-start[1]);if(d<best&&!isBlocked(x*step,z*step)&&edgeClear(...start,x*step,z*step)){seed=[x,z];best=d;}}
 if(!seed)return [];[sx,sz]=seed;
 const heap=[],score=new Map([[key(sx,sz),0]]),parent=new Map(),closed=new Set();
 function push(p){let i=heap.length;heap.push(p);while(i){const j=(i-1)>>1;if(heap[j].f<=p.f)break;heap[i]=heap[j];i=j;}heap[i]=p;}
 function pop(){const top=heap[0],end=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(end.f<=heap[j].f)break;heap[i]=heap[j];i=j;}heap[i]=end;}return top;}
 push({x:sx,z:sz,g:0,f:heur(sx,sz)});
 let reached=null;
 for(let expanded=0;heap.length&&expanded<3500;){
  const p=pop(),id=key(p.x,p.z);
  if(closed.has(id)||p.g!==score.get(id))continue;
  closed.add(id);expanded++;
  if(Math.abs(p.x-gx)+Math.abs(p.z-gz)<=1&&edgeClear(p.x*step,p.z*step,...goal)){reached=p;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=p.x+dx,z=p.z+dz,nid=key(x,z),g=p.g+1;
   if(closed.has(nid)||g>= (score.get(nid)??Infinity)||!edgeClear(p.x*step,p.z*step,x*step,z*step))continue;
   score.set(nid,g);parent.set(nid,id);push({x,z,g,f:g+heur(x,z)});
  }
 }
 if(!reached)return [];
 const points=[goal];let id=key(reached.x,reached.z);
 while(id!==key(sx,sz)){const [x,z]=id.split(',').map(Number);points.push([x*step,z*step]);id=parent.get(id);if(!id)return [];}
 points.push([sx*step,sz*step]);points.push(start);return points.reverse();
}

export function onRoad(x,z){return roads.some(r=>Math.abs(x-r)<7||Math.abs(z-r)<7)||serviceCorridor(x,z,4,5);}
// Car meshes face local -Z. Yaw always follows actual travel; wheels roll forward.
export function trafficPose(time,offset,direction){
 const z=((time*7*direction+offset+300)%600+600)%600-300;
 return {x:direction>0?3:-3,z,yaw:Math.atan2(0,-direction),speed:7};
}
