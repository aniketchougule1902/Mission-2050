// Navigation targets never replace proximity-based interaction targets.
export function navigationGoal(actions,position,selection,location='city'){
 if(selection?.location===location){
  if(!selection.actionId){const ladder=actions.find(a=>a.id==='ladder');if(location==='city'&&position.y>6&&ladder)return {...ladder,x:-103,z:-73,y:9};return {...selection,id:'map-pin',key:'nav.pin',kind:'pin',y:position.y};}
  const chosen=actions.find(a=>a.id===selection.actionId);
  if(chosen){const ladder=actions.find(a=>a.id==='ladder');if(location==='city'&&ladder){if(position.y<6&&chosen.y>6)return ladder;if(position.y>6&&chosen.y<6)return {...ladder,x:-103,z:-73,y:9};}return chosen;}
 }
 const ladder=actions.find(a=>a.id==='ladder');
 const tasks=actions.filter(a=>!['lift','brief','ladder'].includes(a.id));
 if(location==='city'&&ladder){
  if(position.y<6&&tasks.some(a=>a.y>6))return ladder;
  if(position.y>6&&!tasks.some(a=>a.y>6))return {...ladder,x:-103,z:-73,y:9};
 }
 return tasks.find(a=>a.kind==='gem')||tasks[0]||actions.find(a=>a.id==='lift')||actions[0]||null;
}
export function navigationColour(goal,selected=false){
 return selected?'#65d5ff':goal?.kind==='gem'?'#b578ff':goal?.id==='lift'||goal?.id==='ladder'?'#60efb2':'#ff895e';
}
export function routeLength(position,points){
 if(points.length<2)return null;
 let distance=0;for(let i=1;i<points.length;i++)distance+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
 return distance;
}
// A clear stance must also be reachable; the closest side of a station may be fenced off.
export function navigationRoute(start,target,isBlocked,findRoute){
 const exact=[target.x,target.z];
 const direct=isBlocked(...exact)?[]:findRoute(start,exact,isBlocked);
 if(direct.length||target.kind==='pin')return direct;
 const candidates=Array.from({length:16},(_,i)=>{
  const angle=i*Math.PI/8;return [target.x+Math.cos(angle)*2,target.z+Math.sin(angle)*2];
 }).filter(p=>!isBlocked(...p)).sort((a,b)=>Math.hypot(a[0]-start[0],a[1]-start[1])-Math.hypot(b[0]-start[0],b[1]-start[1]));
 for(const stance of candidates){const path=findRoute(start,stance,isBlocked);if(path.length)return path;}
 return [];
}
