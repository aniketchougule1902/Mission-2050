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
