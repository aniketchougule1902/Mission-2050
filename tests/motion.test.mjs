import test from 'node:test';
import assert from 'node:assert/strict';
import {createObstacleIndex,sweptMove} from '../src/motion.js';

test('Spatial collision candidates match brute-force obstacles at cell edges',()=>{
 const objects=[
  {x:-19,z:12,w:4,d:3},
  {x:25,z:-24,w:2,d:5},
  {x:0,z:0,w:1,d:1},
  {x:47,z:24,w:10,d:2}
 ];
 const nearby=createObstacleIndex(objects,12,1.5);
 for(let x=-38;x<63;x+=.65)for(let z=-38;z<38;z+=.85){
  for(const radius of [.38,1]){
   const full=objects.some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius);
   const indexed=nearby(x,z).some(b=>Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius);
   assert.equal(indexed,full,`Missing collider at ${x},${z} radius ${radius}`);
  }
 }
});

test('Fast vehicle cannot tunnel through a thin barrier',()=>{
 const wall=(x,z)=>x>.5&&x<.65&&Math.abs(z)<2;
 const motion=sweptMove(0,0,4,0,wall);
 assert.equal(motion.hit,true);
 assert.ok(motion.x<=.5);
 assert.equal(motion.z,0);
});

test('Walking slides along solid walls without entering them',()=>{
 const wall=(x,z)=>x>.6&&x<2&&z>-2&&z<4;
 const motion=sweptMove(0,0,2,1.5,wall,true);
 assert.equal(motion.hit,true);
 assert.ok(motion.x<=.6);
 assert.ok(motion.z>0);
});

test('Unobstructed forward and reverse have symmetric displacement',()=>{
 const yes=()=>false;
 const forward=sweptMove(3,-9,-4,7,yes);
 const reverse=sweptMove(3,-9,4,-7,yes);
 assert.ok(Math.abs(forward.x+1)<1e-9&&Math.abs(forward.z+2)<1e-9);
 assert.ok(Math.abs(reverse.x-7)<1e-9&&Math.abs(reverse.z+16)<1e-9);
});

import {createFixedStepper,dampAngle,cameraFraction} from '../src/motion.js';
test('Fixed physics produces identical gravity across 30/60/144 Hz',()=>{
 const simulate=hz=>{let y=0,v=6;const advance=createFixedStepper();for(let i=0;i<hz;i++)advance(1/hz,dt=>{v-=16*dt;y+=v*dt;});return {y,v};};
 assert.deepEqual(simulate(30),simulate(60));assert.deepEqual(simulate(144),simulate(60));
 let count=0;createFixedStepper()(30,()=>count++);assert.equal(count,6,'suspended tabs must not cause unbounded catch-up');
});
test('Turning follows shortest arc across the pi boundary',()=>{
 const result=dampAngle(Math.PI-.01,-Math.PI+.01,1/60);
 assert.ok(result>Math.PI-.01&&result<Math.PI+.01);
});
test('Camera sweep catches thin fences and allows views over low walls',()=>{
 const index=createObstacleIndex([{x:0,z:2,w:4,d:.03,h:3}]);
 const q=cameraFraction({x:0,y:1.4,z:0},{x:0,y:2,z:8},index);
 assert.ok(q>0&&q<.25);
 assert.equal(cameraFraction({x:0,y:5,z:0},{x:0,y:5,z:8},index),1);
 assert.equal(cameraFraction({x:0,y:1,z:0},{x:0,y:1,z:-8},index),1);
});

test('Underground camera protects the reactor at negative world elevations',()=>{
 const index=createObstacleIndex([{x:24,z:16,w:3.4,d:3.4,bottom:-24,h:-17.6}]);
 const q=cameraFraction({x:24,y:-22,z:22},{x:24,y:-21,z:12},index);
 assert.ok(q>0&&q<.3);
});
