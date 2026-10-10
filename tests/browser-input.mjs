export async function movePlayer(page,goal,drive=false){
 if(!drive){await page.mouse.move(640,360);await page.mouse.down();}
 try{return await page.evaluate(async({goal,drive})=>{
  const {blocked}=await import('/src/layout.js');
  const initial=window.mission2050.snapshot(),nav=window.mission2050.navigation(),level=Math.min(4,initial.adventure.assembled.length),y=initial.position[1],location=initial.adventure.location;
  const start=[initial.position[0],initial.position[2]],radius=drive?1.8:.55;
  const clear=(x,z)=>!blocked(x,z,y,nav.obstacles,level,location,radius);
  const line=(a,b)=>{const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])*4);for(let i=1;i<=n;i++)if(!clear(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))return false;return true;};
  // Fine navigation belongs only to this browser test. The runtime stays bounded.
  function plan(){
   if(line(start,goal))return [goal];
   const step=2,sx=Math.round(start[0]/step),sz=Math.round(start[1]/step),gx=Math.round(goal[0]/step),gz=Math.round(goal[1]/step),key=(x,z)=>x+','+z;
   const heap=[],scores=new Map([[key(sx,sz),0]]),parents=new Map(),closed=new Set();
   const push=p=>{let i=heap.length;heap.push(p);while(i){const j=(i-1)>>1;if(heap[j].f<=p.f)break;heap[i]=heap[j];i=j;}heap[i]=p;};
   const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(last.f<=heap[j].f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
   push({x:sx,z:sz,g:0,f:Math.abs(sx-gx)+Math.abs(sz-gz)});let end;
   for(let n=0;heap.length&&n<50000;n++){
    const p=pop(),id=key(p.x,p.z);if(closed.has(id))continue;closed.add(id);
    if(Math.hypot(p.x*step-goal[0],p.z*step-goal[1])<3&&line([p.x*step,p.z*step],goal)){end=id;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,nid=key(x,z),g=p.g+1;
     if(closed.has(nid)||g>=(scores.get(nid)??Infinity)||!line([p.x*step,p.z*step],[x*step,z*step]))continue;
     scores.set(nid,g);parents.set(nid,id);push({x,z,g,f:g+Math.abs(x-gx)+Math.abs(z-gz)});
    }
   }
   if(!end)throw Error('No walkable route '+JSON.stringify({start,goal,level,y,drive}));
   const path=[goal];while(end!==key(sx,sz)){path.push(end.split(',').map(Number).map(v=>v*step));end=parents.get(end);if(!end)throw Error('Broken route');}path.push(start);path.reverse();
   const smooth=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!line(path[i],path[j]))j--;smooth.push(path[j]);i=j;}return smooth;
  }
  const points=plan(),held=new Set();let waypoint=0,last=performance.now(),lastProgress=last,progressPosition=start,lastControl=0,cursorX=640;
  const setKeys=wanted=>{for(const key of held)if(!wanted.has(key)){document.body.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));held.delete(key);}for(const key of wanted)if(!held.has(key)){document.body.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));held.add(key);}};
  return new Promise((resolve,reject)=>{
   const finish=(error,s)=>{setKeys(new Set());error?reject(error):resolve({position:s.position,waypoints:points.length,driving:s.driving,stats:s.renderStats});};
   function tick(now){try{
    if(now-lastControl<60){requestAnimationFrame(tick);return;}lastControl=now;
    const s=window.mission2050.snapshot(),n=window.mission2050.navigation(),p=[s.position[0],s.position[2]];
    if(s.screen!=='city')throw Error('Left city during movement: '+s.screen);
    if(drive&&!s.driving)throw Error('Vehicle lost during delivery');
    const distance=Math.hypot(p[0]-goal[0],p[1]-goal[1]);
    if(distance<(drive?2.4:.65)&&(!drive||Math.abs(n.speed)<.4))return finish(null,s);
    if(Math.hypot(p[0]-progressPosition[0],p[1]-progressPosition[1])>.7){progressPosition=p;lastProgress=now;}
    if(now-lastProgress>14000||now-last>240000)throw Error('Movement stalled '+JSON.stringify({p,goal,target:points[waypoint],drive,heading:n.heading,speed:n.speed,heat:s.adventure.heat}));
    while(waypoint<points.length-1&&Math.hypot(p[0]-points[waypoint][0],p[1]-points[waypoint][1])<(drive?8:.25)&&(!drive||line(p,points[waypoint+1])))waypoint++;
    const target=points[waypoint],dx=target[0]-p[0],dz=target[1]-p[1],wanted=new Set();
    if(drive){
     const desired=Math.atan2(-dx,-dz),angle=Math.atan2(Math.sin(desired-n.heading),Math.cos(desired-n.heading));
     if(Math.abs(angle)>.08)wanted.add(angle>0?'a':'d');
     const cruise=distance<8?2.3:Math.abs(angle)>.6?3:Math.abs(angle)>.2?5:10;
     if(distance<2.2||n.speed>cruise+.3)wanted.add(' ');else wanted.add('w');
    }else{
     const desired=Math.atan2(-dx,-dz),turn=Math.atan2(Math.sin(desired-n.yaw),Math.cos(desired-n.yaw));cursorX-=turn/.005;
     document.querySelector('#world').dispatchEvent(new PointerEvent('pointermove',{clientX:cursorX,clientY:360,pointerId:1,bubbles:true}));
     wanted.add('w');if(Math.hypot(dx,dz)>3&&s.adventure.heat<35)wanted.add('Shift');
    }
    setKeys(wanted);requestAnimationFrame(tick);
   }catch(e){finish(e,window.mission2050.snapshot());}}
   requestAnimationFrame(tick);
  });
 },{goal,drive});}finally{if(!drive)await page.mouse.up();}
}
