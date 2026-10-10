import test from 'node:test';
import assert from 'node:assert/strict';
import {buildingLots,treeSites,corridorIntersectsLot,serviceConnections,roads,ecologySites} from '../src/layout.js';

test('Restored residential blocks retain dense scenery without covering service roads',()=>{
 assert.ok(buildingLots.length===73);
 for(const b of buildingLots){
  assert.equal(corridorIntersectsLot(b.x,b.z,b.w,b.d),false,`Lot ${b.x},${b.z} covers a connection`);
  for(const r of roads){assert.ok(Math.abs(b.x-r)>=b.w/2+9);assert.ok(Math.abs(b.z-r)>=b.d/2+9);}
 }
 for(const c of serviceConnections)assert.equal(corridorIntersectsLot((c.from[0]+c.to[0])/2,(c.from[1]+c.to[1])/2,16,18),true);
});
test('Mature grove and street trees persist beside separate restoration and survey sites',()=>{
 assert.ok(treeSites.length>=80);
 for(let i=0;i<28;i++)assert.deepEqual(treeSites[i],[100+i%6*6,-99-Math.floor(i/6)*8]);
 for(const [x,z] of treeSites)assert.ok(!buildingLots.some(b=>Math.abs(x-b.x)<b.w/2+2&&Math.abs(z-b.z)<b.d/2+2),'Tree embedded in a building');
 for(const id of ['water1','water2'])assert.ok(treeSites.every(q=>Math.hypot(q[0]-ecologySites[id][0],q[1]-ecologySites[id][1])>=5),'Restoration should use a gap between mature canopies');
 for(const p of Object.values(ecologySites))assert.ok(!treeSites.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<.8),'Mature trunk blocks a task');
 assert.equal(new Set(treeSites.map(p=>p.join(','))).size,treeSites.length);
});
