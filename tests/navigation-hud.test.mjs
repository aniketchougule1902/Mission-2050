import test from 'node:test';
import assert from 'node:assert/strict';
import {worldBearing,relativeBearing,compassMarks,mapPoint} from '../src/navigation-hud.js';
test('Compass bearings match north/east/south/west world coordinates',()=>{
 assert.equal(worldBearing([0,0,0],{x:0,z:-10}),0);assert.equal(worldBearing([0,0,0],{x:10,z:0}),90);
 assert.equal(worldBearing([0,0,0],{x:0,z:10}),180);assert.equal(worldBearing([0,0,0],{x:-10,z:0}),270);
 assert.equal(relativeBearing(1,359),2);assert.equal(relativeBearing(359,1),-2);
});
test('Heading ruler repeats across north without a blank edge and has five degree ticks',()=>{
 const marks=compassMarks();assert.equal(marks[0].angle,-180);assert.equal(marks.at(-1).angle,720);
 assert.equal(marks.find(m=>m.angle===0).label,'N');assert.equal(marks.find(m=>m.angle===360).label,'N');
 assert.equal(marks.find(m=>m.angle===15).label,'15');assert.equal(marks[1].angle-marks[0].angle,5);
});
test('Expanded map pin coordinates respect zoom, aspect ratio and panning',()=>{
 assert.deepEqual(mapPoint(360,360,720,720,650,{x:12,z:34}),{x:12,z:34});
 assert.deepEqual(mapPoint(720,360,720,720,650,{x:0,z:0}),{x:325,z:0});
 assert.deepEqual(mapPoint(360,720,720,720,325,{x:10,z:-5}),{x:10,z:157.5});
});
