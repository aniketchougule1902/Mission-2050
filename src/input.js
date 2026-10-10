// Keyboard layout-independent gameplay input; key fallback supports touch/tests.
export function gameplayKey(event){
 const code=event.code||'';
 if(/^Key[A-Z]$/.test(code))return code.slice(3).toLowerCase();
 if(code==='Space')return ' ';
 if(code.startsWith('Shift'))return 'Shift';
 return event.key?.length===1?event.key.toLowerCase():event.key;
}
export function compassHeading(yaw){return ((yaw*180/Math.PI)%360+360)%360;}
export function remainingRoute(position,points){
 if(!points||points.length<2)return [];
 let best=Infinity,index=1,projection=points[0];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const u=length?Math.max(0,Math.min(1,((position[0]-a[0])*dx+(position[2]-a[1])*dz)/length)):1;
  const p=[a[0]+u*dx,a[1]+u*dz],distance=Math.hypot(position[0]-p[0],position[2]-p[1]);
  if(distance<=best){best=distance;index=i;projection=p;}
 }
 return [[position[0],position[2]],projection,...points.slice(index)];
}
export function routeDirection(position,points,target){
 if(!points||points.length<2)return [target.x,target.z];
 let best=Infinity,index=1;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const u=length?Math.max(0,Math.min(1,((position[0]-a[0])*dx+(position[2]-a[1])*dz)/length)):1;
  const distance=Math.hypot(position[0]-a[0]-u*dx,position[2]-a[1]-u*dz);
  if(distance<=best){best=distance;index=i;}
 }
 while(index<points.length-1&&Math.hypot(points[index][0]-position[0],points[index][1]-position[2])<3)index++;
 return points[index];
}
