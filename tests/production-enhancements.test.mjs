import test from 'node:test';
import assert from 'node:assert/strict';
import {pushOutOfVehicle,pushCarOutOfTraffic,circleHitsVehicle,playerCarHitsTraffic} from '../src/traffic-physics.js';
import {reflectVelocity,gripVelocity,createFixedStepper} from '../src/motion.js';
import {trafficPose} from '../src/layout.js';

test('Pedestrians inside, outside and on rotated OBB corners resolve completely',()=>{
 for(const yaw of [0,.3,Math.PI/2,Math.PI,-1.2])for(let x=-2;x<=2;x+=.17)for(let z=-3;z<=3;z+=.23){
  const p=pushOutOfVehicle(x,z,.38,0,0,yaw);
  if(circleHitsVehicle(x,z,.38,0,0,yaw))assert.ok(p);
  if(p){assert.equal(circleHitsVehicle(p.x,p.z,.38,0,0,yaw),false);assert.ok(Math.abs(Math.hypot(p.nx,p.nz)-1)<1e-9);}
 }
 const center=pushOutOfVehicle(0,0,.38,0,0,0);assert.ok(center.x>1.27);
 assert.equal(pushOutOfVehicle(20,20,.38,0,0,0),null);
});

test('Car separation covers aligned, crossed and fully coincident vehicles',()=>{
 for(const yaw of [0,.8,Math.PI/2])for(const otherYaw of [0,.4,Math.PI/2])for(const x of [-1,0,1]){
  const p=pushCarOutOfTraffic(x,0,yaw,0,0,otherYaw);assert.ok(p);
  assert.equal(playerCarHitsTraffic(p.x,p.z,yaw,0,0,otherYaw),false);
  assert.equal(pushCarOutOfTraffic(p.x,p.z,yaw,0,0,otherYaw),null);
 }
});

test('Traffic remains solid during damage cooldown at 30, 60 and 144 Hz',()=>{
 const run=hz=>{let x=-3,z=0,time=0,cooldown=0,hits=0;const step=createFixedStepper();
  for(let i=0;i<hz*6;i++)step(1/hz,dt=>{time+=dt;cooldown=Math.max(0,cooldown-dt);const t=trafficPose(time,0,-1),p=pushOutOfVehicle(x,z,.38,t.x,t.z,t.yaw);if(p){x=p.x;z=p.z;if(!cooldown){hits++;cooldown=2.5;}}assert.equal(circleHitsVehicle(x,z,.38,t.x,t.z,t.yaw),false);});assert.ok(hits>=1);return {x,z,hits};};
 assert.deepEqual(run(30),run(60));assert.deepEqual(run(144),run(60));
});

test('Impact reflection preserves tangential motion and grip damps sideways slip',()=>{
 const bounce=reflectVelocity(10,4,-1,0);assert.ok(Math.abs(bounce.x+1.8)<1e-8);assert.equal(bounce.z,4);
 assert.deepEqual(reflectVelocity(-2,4,-1,0),{x:-2,z:4});
 const grip=gripVelocity(5,-20,0,1/60);assert.ok(grip.x>0&&grip.x<5);assert.equal(grip.z,-20);
});
