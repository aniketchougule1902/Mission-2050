// Dynamic traffic collision using an oriented vehicle rectangle and a
// capsule-like three-circle approximation for the player's drivable car.
// Rotation follows Three.js's Y-axis convention (front is local -Z).
export function circleHitsVehicle(x,z,radius,vehicleX,vehicleZ,yaw,halfWidth=.89,halfLength=1.75){
 if(![x,z,radius,vehicleX,vehicleZ,yaw].every(Number.isFinite))return false;
 const dx=x-vehicleX,dz=z-vehicleZ,c=Math.cos(yaw),s=Math.sin(yaw);
 const lx=dx*c-dz*s,lz=dx*s+dz*c;
 const nearX=Math.max(-halfWidth,Math.min(halfWidth,lx));
 const nearZ=Math.max(-halfLength,Math.min(halfLength,lz));
 return (lx-nearX)**2+(lz-nearZ)**2<=radius**2;
}
export function playerCarHitsTraffic(x,z,yaw,otherX,otherZ,otherYaw){
 const s=Math.sin(yaw),c=Math.cos(yaw);
 for(const offset of [-1.05,0,1.05]){
  if(circleHitsVehicle(x+s*offset,z+c*offset,.88,otherX,otherZ,otherYaw))return true;
 }
 return false;
}
