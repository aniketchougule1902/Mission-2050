// Geometry is kept in memory for collisions; only faraway draw calls are culled.
export function chunkVisible(px,pz,cx,cz,radius,viewDistance){
 if(![px,pz,cx,cz,radius,viewDistance].every(Number.isFinite)||viewDistance<0)return true;
 const limit=viewDistance+Math.max(0,radius),dx=px-cx,dz=pz-cz;
 return dx*dx+dz*dz<=limit*limit;
}
export function renderDistance(quality,adaptiveLow=false){
 return quality==='low'||adaptiveLow?130:230;
}
// A* replans when either the milestone, level or player position changes enough.
export function routeNeedsRefresh(previous,player,target,level,location,maxShift=6){
 return !previous||previous.goalId!==target.id||previous.tx!==target.x||previous.tz!==target.z||
 previous.level!==level||previous.location!==location||
 Math.hypot(player.x-previous.x,player.z-previous.z)>maxShift;
}
