import test from 'node:test';
import assert from 'node:assert/strict';
import {areaUnlocked,districts,blocked,route,LAB_Y,LAB_X,LAB_Z,lift,parking,coreGuards,onRoad,trafficPose,locateAction,serviceConnections,serviceCorridor} from '../src/layout.js';
test('Each milestone opens its district while later districts remain closed',()=>{
 for(let level=0;level<5;level++)for(let i=0;i<5;i++)assert.equal(areaUnlocked(...districts[i].center,level),i<=level);
 assert.equal(areaUnlocked(301,299,4),false);
});
test('Every district can be reached along its unlocked service corridor',()=>{
 for(let i=0;i<5;i++)for(let k=0;k<=20;k++)assert.equal(areaUnlocked(districts[i].center[0]*k/20,districts[i].center[1]*k/20,i),true);
});
test('Lab navigation protects the containment reactor and outer walls',()=>{
 assert.equal(blocked(LAB_X,LAB_Z-8,LAB_Y,[],4,'lab'),true);
 assert.equal(blocked(LAB_X-2,LAB_Z+3,LAB_Y,[],0,'lab'),false);
 assert.equal(blocked(LAB_X+18,LAB_Z,LAB_Y,[],4,'lab'),true);
});
test('Breadcrumb routing detours around building footprints',()=>{
 const wall=(x,z)=>Math.abs(x-12)<4&&Math.abs(z)<8;
 const path=route([0,0],[28,0],wall);
 assert.ok(path.length>3);
 assert.ok(path.every(p=>!wall(...p)));
 assert.ok(path.some(p=>Math.abs(p[1])>=8));
});
test('Breadcrumb edges cannot jump across thin fences between grid nodes',()=>{
 const fence=(x,z)=>Math.abs(x-6)<.6&&Math.abs(z)<6;
 const path=route([0,0],[16,0],fence);assert.ok(path.some(p=>Math.abs(p[1])>=6));
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4);for(let j=0;j<=n;j++)assert.equal(fence(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n),false);}
});
test('Rooftop tasks use the school elevation instead of ground-level interaction',()=>{
 assert.equal(locateAction({id:'panel1'},1).y,9);
 assert.equal(locateAction({id:'valve'},3).y,0);
});

test('Research campus and parked vehicle keep roads clear',()=>{
 for(let x=LAB_X-8;x<=LAB_X+8;x+=1)for(let z=LAB_Z-7;z<=LAB_Z+14;z+=1)assert.equal(onRoad(x,z),false,`Campus obstructs road at ${x},${z}`);
 assert.equal(onRoad(...lift),false);assert.equal(onRoad(...parking),false);
 for(const [x,y,z] of coreGuards)assert.ok(Math.hypot(x,z+8)>4.5,'Guard obstructs researcher arc');
});
test('Both traffic lanes face their travel direction and never detour around the lab',()=>{
 for(const direction of [-1,1])for(let t=0;t<70;t+=.25){
  const p=trafficPose(t,65,direction),q=trafficPose(t+.001,65,direction);
  assert.equal(p.x,q.x);assert.ok(Math.abs(p.x)===3);
  if(Math.abs(q.z-p.z)>1)continue; // lane recycling at city boundary
  const facingZ=-Math.cos(p.yaw);
  assert.ok((q.z-p.z)*facingZ>0,'Car travelled rear-first');
 }
});

test('Airborne players can clear low obstacles but cannot pass through tall buildings',()=>{
 const obstacle=[{x:10,z:10,w:2,d:2,h:12}];
 assert.equal(blocked(10,10,8,obstacle,0),true);
 assert.equal(blocked(10,10,12,obstacle,0),false);
 assert.equal(blocked(10,10,1,[{x:10,z:10,w:2,d:2,h:.5}],0),false);
});

test('The third installation opens the complete grove-to-river connection',()=>{const c=serviceConnections.find(c=>c.level===3&&c.from[0]===districts[2].center[0]);for(let i=0;i<=200;i++){const f=i/200,x=c.from[0]+(c.to[0]-c.from[0])*f,z=c.from[1]+(c.to[1]-c.from[1])*f;assert.equal(blocked(x,z,0,[],3),false,`Unlocked road blocked at ${x},${z}`);}assert.equal(areaUnlocked(150,-39,2),false);assert.equal(areaUnlocked(150,-39,3),true);assert.equal(areaUnlocked(...districts[4].center,3),false);});
test('Procedural lots cannot occupy reserved service road clearance',()=>{assert.equal(serviceCorridor(138,-38,4,28),true);for(const c of serviceConnections)assert.equal(serviceCorridor((c.from[0]+c.to[0])/2,(c.from[1]+c.to[1])/2,c.level),true);});
