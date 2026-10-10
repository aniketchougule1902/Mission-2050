import test from 'node:test';
import assert from 'node:assert/strict';
import {freshAdventure,restoreAdventure,restoreVehicle} from '../src/adventure.js';

test('Vehicle pose and driving restore independently of mission progression',()=>{
 const a=freshAdventure();a.vehicle={position:[-121,0,194],heading:2.4,driving:true};
 const restored=restoreAdventure(JSON.stringify(a));assert.deepEqual(restored.vehicle,a.vehicle);assert.deepEqual(restored.tasks,[]);assert.deepEqual(restored.assembled,[]);
 a.location='lab';assert.equal(restoreAdventure(JSON.stringify(a)).vehicle.driving,false);
 const legacy=freshAdventure();assert.equal(restoreAdventure(JSON.stringify(legacy)).vehicle,null);
});
test('Invalid vehicle poses fall back safely without discarding a valid mission save',()=>{
 for(const vehicle of [{position:[400,0,0],heading:0,driving:false},{position:[1,0],heading:0,driving:false},{position:[0,10,0],heading:0,driving:false},{position:[0,0,0],heading:'east',driving:false},{position:[0,0,0],heading:0,driving:'yes'}]){
  assert.equal(restoreVehicle(vehicle),null);const a=freshAdventure();a.vehicle=vehicle;assert.ok(restoreAdventure(JSON.stringify(a)));assert.equal(restoreAdventure(JSON.stringify(a)).vehicle,null);
 }
 assert.ok(Math.abs(restoreVehicle({position:[12,0,34],heading:Math.PI*6+.4,driving:false}).heading-.4)<1e-9);
});
