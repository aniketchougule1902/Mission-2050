import test from 'node:test';
import assert from 'node:assert/strict';
import {areaUnlocked,districts,blocked,route,LAB_Y,LAB_X,LAB_Z,lift,parking,coreGuards,onRoad,trafficPose,locateAction} from '../src/layout.js';
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
