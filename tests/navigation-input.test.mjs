import test from 'node:test';
import assert from 'node:assert/strict';
import {gameplayKey,compassHeading,routeDirection,remainingRoute} from '../src/input.js';
test('Physical WASD remains usable with Caps Lock, Shift and alternate layouts',()=>{
 for(const key of ['W','w','ц'])assert.equal(gameplayKey({code:'KeyW',key}),'w');
 assert.equal(gameplayKey({key:'S'}),'s');assert.equal(gameplayKey({code:'ShiftLeft',key:'Shift'}),'Shift');
 assert.equal(gameplayKey({code:'Space',key:' '}),' ');assert.equal(gameplayKey({key:'ArrowLeft'}),'ArrowLeft');
});
test('Remaining map route drops traversed sections and follows the current segment',()=>{
 assert.deepEqual(remainingRoute([10,0,5],[[0,0],[10,0],[10,10],[20,10]]),[[10,5],[10,5],[10,10],[20,10]]);
 assert.deepEqual(remainingRoute([12,0,5],[[0,0],[10,0],[10,10],[20,10]]),[[12,5],[10,5],[10,10],[20,10]]);
 assert.deepEqual(remainingRoute([0,0,0],[]),[]);
});
test('Compass wraps negative and multiple rotations',()=>{
 assert.equal(compassHeading(-Math.PI/2),270);assert.equal(compassHeading(4*Math.PI),0);
});
test('Navigation points past the nearest segment instead of back to stale route start',()=>{
 const target={x:20,z:10},route=[[0,0],[10,0],[10,10],[20,10]];
 assert.deepEqual(routeDirection([10,0,5],route,target),[10,10]);
 assert.deepEqual(routeDirection([10,0,9],route,target),[20,10]);
 assert.deepEqual(routeDirection([0,0,0],[],target),[20,10]);
});
