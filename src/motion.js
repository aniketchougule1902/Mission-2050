// Broad-phase grid for static city colliders; collision logic remains in layout.js.
// Objects are inserted into every touching cell including a contact margin so
// character and vehicle radius checks remain equivalent to a full obstacle scan.
export function createObstacleIndex(obstacles,cellSize=24,contactMargin=1.5){
 if(!(cellSize>0)||!(contactMargin>=0))throw RangeError('Invalid collision grid');
 const cells=new Map(),empty=Object.freeze([]);
 for(const box of obstacles){
  const left=Math.floor((box.x-box.w-contactMargin)/cellSize);
  const right=Math.floor((box.x+box.w+contactMargin)/cellSize);
  const near=Math.floor((box.z-box.d-contactMargin)/cellSize);
  const far=Math.floor((box.z+box.d+contactMargin)/cellSize);
  for(let ix=left;ix<=right;ix++)for(let iz=near;iz<=far;iz++){
   const key=ix+','+iz;
   if(!cells.has(key))cells.set(key,[]);
   cells.get(key).push(box);
  }
 }
 return (x,z)=>cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||empty;
}

// Substep kinematic motion to stop fast cars crossing thin walls in one frame.
// Walking permits separate-axis sliding, driving stops at the first contact.
export function sweptMove(x,z,dx,dz,isBlocked,slide=false,maxStep=.28){
 if(!(maxStep>0)||![x,z,dx,dz].every(Number.isFinite))throw RangeError('Invalid motion');
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/maxStep)),sx=dx/steps,sz=dz/steps;
 let hit=false;
 for(let i=0;i<steps;i++){
  const nx=x+sx,nz=z+sz;
  if(!isBlocked(nx,nz)){x=nx;z=nz;continue;}
  hit=true;
  if(!slide)break;
  if(!isBlocked(nx,z))x=nx;
  if(!isBlocked(x,nz))z=nz;
 }
 return {x,z,hit};
}

// Bounded 60 Hz physics prevents refresh-rate-dependent integration and huge
// catch-up work after a suspended tab. Rendering remains independently paced.
export function createFixedStepper(step=1/60,maxSteps=6){
 let remainder=0;
 return (elapsed,simulate)=>{
  remainder=Math.min(remainder+Math.max(0,elapsed),step*maxSteps);
  let steps=0;
  while(remainder+1e-10>=step&&steps<maxSteps){simulate(step);remainder-=step;steps++;}
  return steps;
 };
}
export function dampAngle(current,target,dt,rate=14){
 const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+difference*(1-Math.exp(-rate*dt));
}
// Sweep the camera's near-plane clearance along the complete sight line,
// including the interpolated camera position, so smoothing cannot enter walls.
export function cameraFraction(from,to,nearby,clearance=.25){
 let limit=1;const seen=new Set(),length=Math.hypot(to.x-from.x,to.z-from.z);
 for(let i=0,n=Math.max(1,Math.ceil(length/.5));i<=n;i++){
  const q=i/n,x=from.x+(to.x-from.x)*q,z=from.z+(to.z-from.z)*q;
  for(const b of nearby(x,z)){
   if(seen.has(b))continue;seen.add(b);
   let enter=0,exit=1;
   for(const [axis,min,max] of [['x',b.x-b.w-clearance,b.x+b.w+clearance],['y',b.bottom??-.3,b.h+clearance],['z',b.z-b.d-clearance,b.z+b.d+clearance]]){
    const delta=to[axis]-from[axis];
    if(Math.abs(delta)<1e-9){if(from[axis]<min||from[axis]>max){enter=2;break;}}
    else{const a=(min-from[axis])/delta,c=(max-from[axis])/delta;enter=Math.max(enter,Math.min(a,c));exit=Math.min(exit,Math.max(a,c));}
   }
   if(enter<=exit&&exit>=0)limit=Math.min(limit,Math.max(0,enter-.02));
  }
 }
 return limit;
}

// Physics deliberately caps catch-up work at 100ms; cinematics must progress closer
// to real time during slow rendering while still bounding visible interpolation.
export function visualFrameDelta(elapsed,maxDelta=.25){
 if(!Number.isFinite(elapsed)||elapsed<=0)return 0;
 return Math.min(elapsed,maxDelta);
}
