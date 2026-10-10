// Dynamic traffic collision using an oriented vehicle rectangle and a
// capsule-like three-circle approximation for the player's drivable car.
// Rotation follows Three.js's Y-axis convention (front is local -Z).

// Convert world-space point to vehicle-local OBB coordinates.
function toLocal(x,z,vx,vz,yaw){
 const dx=x-vx,dz=z-vz,c=Math.cos(yaw),s=Math.sin(yaw);
 return {lx:dx*c-dz*s,lz:dx*s+dz*c};
}

export function circleHitsVehicle(x,z,radius,vehicleX,vehicleZ,yaw,halfWidth=1.02,halfLength=1.8){
 if(![x,z,radius,vehicleX,vehicleZ,yaw].every(Number.isFinite))return false;
 const {lx,lz}=toLocal(x,z,vehicleX,vehicleZ,yaw);
 const nearX=Math.max(-halfWidth,Math.min(halfWidth,lx));
 const nearZ=Math.max(-halfLength,Math.min(halfLength,lz));
 return (lx-nearX)**2+(lz-nearZ)**2<=radius**2;
}

// Compute the corrected world position that pushes a circle completely
// out of a vehicle's oriented bounding box. Returns {x,z} or null.
export function pushOutOfVehicle(x,z,radius,vehicleX,vehicleZ,yaw,halfWidth=1.02,halfLength=1.8){
 if(![x,z,radius,vehicleX,vehicleZ,yaw].every(Number.isFinite))return null;
 const c=Math.cos(yaw),s=Math.sin(yaw);
 const {lx,lz}=toLocal(x,z,vehicleX,vehicleZ,yaw);
 const nearX=Math.max(-halfWidth,Math.min(halfWidth,lx));
 const nearZ=Math.max(-halfLength,Math.min(halfLength,lz));
 const distSq=(lx-nearX)**2+(lz-nearZ)**2;
 const contact=radius+.08;
 if(distSq>=contact*contact-1e-10)return null;
 const dist=Math.sqrt(distSq);
 let nx,nz,push;
 if(dist>1e-9){nx=(lx-nearX)/dist;nz=(lz-nearZ)/dist;push=contact-dist;}
 else if(halfWidth-Math.abs(lx)<halfLength-Math.abs(lz)){
  nx=lx<0?-1:1;nz=0;push=halfWidth-Math.abs(lx)+contact;
 }else{nx=0;nz=lz<0?-1:1;push=halfLength-Math.abs(lz)+contact;}
 const plx=lx+nx*push,plz=lz+nz*push;
 return {x:vehicleX+plx*c+plz*s,z:vehicleZ-plx*s+plz*c,nx:nx*c+nz*s,nz:-nx*s+nz*c};
}

export function playerCarHitsTraffic(x,z,yaw,otherX,otherZ,otherYaw){
 const s=Math.sin(yaw),c=Math.cos(yaw);
 for(const offset of [-1.05,0,1.05]){
  if(circleHitsVehicle(x+s*offset,z+c*offset,.88,otherX,otherZ,otherYaw))return true;
 }
 return false;
}

// Push a three-circle car approximation out of a traffic vehicle.
// Returns corrected {x,z} centre or null when no overlap exists.
export function pushCarOutOfTraffic(x,z,yaw,otherX,otherZ,otherYaw){
 // Separating axes give one complete translation, even for crossed cars.
 const a=[{x:Math.cos(yaw),z:-Math.sin(yaw)},{x:Math.sin(yaw),z:Math.cos(yaw)}];
 const b=[{x:Math.cos(otherYaw),z:-Math.sin(otherYaw)},{x:Math.sin(otherYaw),z:Math.cos(otherYaw)}];
 const dot=(u,v)=>u.x*v.x+u.z*v.z;
 let depth=Infinity,normal;
 for(const axis of [...a,...b]){
  const separation=(x-otherX)*axis.x+(z-otherZ)*axis.z;
  const reach=1*Math.abs(dot(a[0],axis))+2.12*Math.abs(dot(a[1],axis))+1.02*Math.abs(dot(b[0],axis))+1.8*Math.abs(dot(b[1],axis));
  const overlap=reach-Math.abs(separation);
  if(overlap<=0)return null;
  if(overlap<depth){depth=overlap;const sign=separation<0?-1:1;normal={nx:axis.x*sign,nz:axis.z*sign};}
 }
 return {x:x+normal.nx*(depth+.02),z:z+normal.nz*(depth+.02),...normal};
}
