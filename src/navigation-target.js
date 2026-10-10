// Navigation targets never replace proximity-based interaction targets.
export function navigationGoal(actions,position,selection,location='city'){
 if(selection?.location===location){
  if(!selection.actionId)return {...selection,id:'map-pin',key:'nav.pin',kind:'pin',y:position.y};
  const chosen=actions.find(a=>a.id===selection.actionId);
  if(chosen){const ladder=actions.find(a=>a.id==='ladder');if(location==='city'&&position.y<6&&chosen.y>6&&ladder)return ladder;return chosen.id==='ladder'&&position.y>6?{...chosen,x:-103,z:-73,y:9}:chosen;}
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
