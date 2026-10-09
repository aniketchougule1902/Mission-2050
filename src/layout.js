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
 {stakes:[99,-86],housing1:[93,-104],housing2:[93,-123],grove:[116,-106],clear:[105,-106],water1:[117,-124],water2:[136,-126],gem:[106,-97]},
 {scan1:[214,40],scan2:[221,76],scan3:[198,65],valve:[222,72],litter:[213,64],gem:[212,69]},
 {cargo:parking,depotDelivery:[-121,194],clinicDelivery:[-46,33],night:[-125,191],gem:[-116,193],override:[-116,193]}
];
export function locateAction(action,phase){
 const xyz=action.id.startsWith('budget:')?[-140+['buses','cycling','backup','training','roads','petrol'].indexOf(action.id.slice(7))*6,202]:coordinates[phase]?.[action.id];
 return xyz?{...action,x:xyz[0],z:xyz[1],y:xyz[2]||0}:action;
}
export function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-ax-t*dx,z-az-t*dz);}
export function areaUnlocked(x,z,level){
 if(Math.hypot(x,z)<42||Math.hypot(x-LAB_X,z-(LAB_Z+4))<19)return true;
 return districts.some((d,i)=>i<=Math.min(level,4)&&(Math.hypot(x-d.center[0],z-d.center[1])<d.radius||segmentDistance(x,z,0,0,...d.center)<12));
}
export function blocked(x,z,y,obstacles,level,location='city',radius=.38){
 if(location==='lab'){x-=LAB_X;z-=LAB_Z;return Math.abs(x)>17-radius||z>10-radius||z<-21+radius||(Math.hypot(x,z+8)<3.4+radius);}
 if(!areaUnlocked(x,z,level)||Math.abs(x)>300||Math.abs(z)>300)return true;
 if(x>231&&z>5&&z<132)return true; // canal bank
 if(y>7)return false; // roof support is checked separately
 return obstacles.some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius);
}
export function roofHeight(x,z,y){return y>6&&x>=-123&&x<=-101&&z>=-95&&z<=-71?9:0;}
export function route(start,goal,isBlocked){
 // A* on a four-metre grid; points are real traversable positions, no teleport.
 const step=4,key=(x,z)=>x+','+z,sx=Math.round(start[0]/step),sz=Math.round(start[1]/step),gx=Math.round(goal[0]/step),gz=Math.round(goal[1]/step);
 const open=[{x:sx,z:sz,g:0,f:0}],seen=new Map([[key(sx,sz),0]]),parents=new Map();let end;
 for(let n=0;open.length&&n<12000;n++){
  open.sort((a,b)=>b.f-a.f);const p=open.pop();if(Math.hypot(p.x-gx,p.z-gz)<1.6){end=p;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,k=key(x,z),g=p.g+1;if(seen.has(k)&&seen.get(k)<=g)continue;if(isBlocked(x*step,z*step))continue;seen.set(k,g);parents.set(k,p);open.push({x,z,g,f:g+Math.abs(x-gx)+Math.abs(z-gz)});}
 }
 if(!end)return [start,goal];const points=[goal];while(end&&(end.x!==sx||end.z!==sz)){points.push([end.x*step,end.z*step]);end=parents.get(key(end.x,end.z));}points.push(start);return points.reverse();
}

export function onRoad(x,z){return roads.some(r=>Math.abs(x-r)<7||Math.abs(z-r)<7)||districts.some(d=>segmentDistance(x,z,0,0,...d.center)<5);}
// Car meshes face local -Z. Yaw always follows actual travel; wheels roll forward.
export function trafficPose(time,offset,direction){
 const z=((time*7*direction+offset+300)%600+600)%600-300;
 return {x:direction>0?3:-3,z,yaw:Math.atan2(0,-direction),speed:7};
}
