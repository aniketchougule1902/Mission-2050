import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestAction} from '../src/action-proximity.js';
import {circleHitsVehicle,playerCarHitsTraffic} from '../src/traffic-physics.js';
function legacyNearest(actions,player,location,stone=-1,assembledCount=0){
 const sorted=actions.map(a=>a.id==='ladder'&&player.y>6?{...a,x:-103,z:-73,y:9}:a)
 .map(a=>({...a,distance:Math.hypot(player.x-a.x,player.z-a.z,a.id==='ladder'?0:(player.y-a.y)*1.4)}))
 .sort((a,b)=>a.distance-b.distance);
 if(location==='lab'){
  const primary=sorted.find(a=>a.id===(stone>=0?'assemble':assembledCount===5?'activate':'lift'));
  const cabin=sorted.find(a=>a.id==='lift'&&a.distance<.65);
  return cabin||primary||sorted[0]||null;
 }
 const lift=sorted.find(a=>a.id==='lift'&&a.distance<2.4);
 return lift||sorted.find(a=>a.id!=='lift')||sorted[0]||null;
}
test('Single-pass nearest action matches stable sorting for city/lab, rooftop and lift',()=>{
 const items=[
  {id:'lift',x:24,z:32,y:0},{id:'gem',x:20,z:36,y:0},
  {id:'assemble',x:24,z:20,y:-24},{id:'activate',x:24,z:16,y:-24},
  {id:'ladder',x:-99,z:-71,y:0},{id:'clinic',x:-45,z:32,y:0}
 ];
 for(const location of ['city','lab'])for(const stone of [-1,0])for(const assembledCount of [0,5])
 for(let x=-111;x<=35;x+=13)for(let z=-79;z<=44;z+=11)for(const y of [0,9,-24]){
  const p={x,y,z},actual=nearestAction(items,p,location,stone,assembledCount);
  const expected=legacyNearest(items,p,location,stone,assembledCount);
  assert.deepEqual(actual,expected,`Mismatch at ${JSON.stringify({location,stone,assembledCount,p})}`);
 }
 assert.equal(nearestAction([],{x:0,y:0,z:0}),null);
});
test('Pedestrian collisions honor vehicle yaw, front/rear and safe clearance',()=>{
 assert.equal(circleHitsVehicle(0,0,.38,0,0,0),true);
 assert.equal(circleHitsVehicle(0,2,.38,0,0,0),true);
 assert.equal(circleHitsVehicle(0,2.2,.38,0,0,0),false);
 assert.equal(circleHitsVehicle(2,0,.38,0,0,0),false);
 assert.equal(circleHitsVehicle(2,0,.38,0,0,Math.PI/2),true);
 assert.equal(circleHitsVehicle(0,2,.38,0,0,Math.PI/2),false);
 assert.equal(circleHitsVehicle(0,0,.38,0,0,NaN),false);
});
test('Two cars react to overlapping front/rear while clear cars remain driveable',()=>{
 assert.equal(playerCarHitsTraffic(0,0,0,0,-3,0),true);
 assert.equal(playerCarHitsTraffic(0,0,0,0,3,0),true);
 assert.equal(playerCarHitsTraffic(0,0,0,0,-4.4,0),false);
 assert.equal(playerCarHitsTraffic(0,0,Math.PI/2,2.8,0,Math.PI/2),true);
 assert.equal(playerCarHitsTraffic(0,0,0,20,20,0),false);
});
