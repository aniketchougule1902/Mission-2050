import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {route,trafficPose} from '../src/layout.js';

test('Unreachable city routes have a strict expansion budget',()=>{
 let visits=0;
 const result=route([0,0],[260,260],(x,z)=>{
  visits++;
  // Enclose the target district and leave the start area traversable.
  return Math.abs(x)>64||Math.abs(z)>64;
 });
 assert.ok(visits<15000,`A* spent ${visits} collision checks on one route`);
 assert.deepEqual(result,[],'Unreachable destinations must not draw routes through walls');
});

test('Reachable routes still detour around solid footprints',()=>{
 const wall=(x,z)=>x>=8&&x<=24&&Math.abs(z)<12;
 const points=route([0,0],[32,0],wall);
 assert.ok(points.length>4);
 assert.ok(points.every(point=>!wall(...point)));
 assert.ok(points.some(point=>Math.abs(point[1])>=12));
});

test('Vehicle forward heading matches travel direction in both traffic lanes',()=>{
 for(const direction of [-1,1]){
  for(let t=0;t<45;t+=.33){
   const p=trafficPose(t,30,direction),q=trafficPose(t+.001,30,direction);
   if(Math.abs(q.z-p.z)>2)continue;
   assert.ok((q.z-p.z)*(-Math.cos(p.yaw))>0);
  }
 }
});

test('Browser renderer avoids repeated scan copies and per-frame scene traversals',()=>{
 const city=readFileSync('src/city.js','utf8'),engine=readFileSync('src/engine.js','utf8');
 assert.match(city,/new T\.InstancedMesh/);
 assert.match(city,/signCache=new Map/);
 assert.doesNotMatch(city,/source\.clone\(true\)/);
 assert.doesNotMatch(engine,/t\.model\.traverse\(/);
 assert.match(engine,/render\.adaptive/);
});
