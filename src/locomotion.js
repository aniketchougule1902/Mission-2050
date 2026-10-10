// Character heading follows collision-resolved travel, independently of camera yaw.
export function movementFacing(vx,vz,current,dt){
 if(Math.hypot(vx,vz)<.06)return current;
 const target=Math.atan2(vx,vz),delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+delta*(1-Math.exp(-18*dt));
}
