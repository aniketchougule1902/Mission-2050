// Geometry is kept in memory for collisions; only faraway draw calls are culled.
export function chunkVisible(px,pz,cx,cz,radius,viewDistance){
 if(![px,pz,cx,cz,radius,viewDistance].every(Number.isFinite)||viewDistance<0)return true;
 const limit=viewDistance+Math.max(0,radius),dx=px-cx,dz=pz-cz;
 return dx*dx+dz*dz<=limit*limit;
}
export function renderDistance(quality,adaptiveLow=false){
 return quality==='low'||adaptiveLow?170:230;
}
export function renderProfile(quality='balanced',width=1280,height=720,dpr=1){
 const budget=quality==='low'?650000:quality==='high'?1800000:1100000;
 const cap=quality==='low'?.85:quality==='high'?1.25:1;
 return {scale:Math.min(dpr,cap,Math.sqrt(budget/Math.max(1,width*height))),detailDistance:quality==='high'?120:quality==='low'?55:85,post:quality==='high'};
}
// Time-based hysteresis reacts to sustained missed frame budgets, not one hitch.
export function createFrameBudget(targetFPS=90){
 let average=1/targetFPS,slow=0,fast=0;
 return {sample(dt){if(!(dt>0)||dt>.25)return 0;average+=(dt-average)*.08;if(average>1/(targetFPS*.8)){slow+=dt;fast=0;}else if(average<1/(targetFPS*.96)){fast+=dt;slow=0;}else{slow=fast=0;}
  if(slow>=1.25){slow=0;return -1;}if(fast>=6){fast=0;return 1;}return 0;},reset(){average=1/targetFPS;slow=fast=0;}};
}
// A* replans when either the milestone, level or player position changes enough.
export function routeNeedsRefresh(previous,player,target,level,location,maxShift=6){
 return !previous||previous.goalId!==target.id||previous.tx!==target.x||previous.tz!==target.z||
 previous.level!==level||previous.location!==location||
 Math.hypot(player.x-previous.x,player.z-previous.z)>maxShift;
}
