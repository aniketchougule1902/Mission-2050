import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationGoal,navigationColour} from '../src/navigation-target.js';
import {freshAdventure,actionsFor} from '../src/adventure.js';
import {route} from '../src/layout.js';
import {localMovement,lateralStep} from '../src/locomotion.js';
test('Mission guidance keeps the fuse target even next to the lift',()=>{
 const a=freshAdventure();assert.equal(navigationGoal(actionsFor(a),{x:24,y:0,z:32},null).id,'fuse');
});
test('Selected destination overrides automatic guidance and clears after completion',()=>{
 const actions=[{id:'one',x:0,z:0},{id:'two',x:20,z:0}];
 const pin={x:40,z:20,location:'city'};
 assert.equal(navigationGoal(actions,{y:0},pin).id,'map-pin');
 const selected={actionId:'two',location:'city'};
 assert.equal(navigationGoal(actions,{y:0},selected).id,'two');
 assert.equal(navigationGoal(actions.slice(0,1),{y:0},selected).id,'one');
});
test('Rooftop guidance uses ladder before work and when descending with core',()=>{
 const a=freshAdventure();a.assembled=[0];const actions=actionsFor(a);
 assert.equal(navigationGoal(actions,{y:0},null).id,'ladder');
 assert.equal(navigationGoal(actions,{y:9},null).id,'panels');
 assert.equal(navigationGoal(actions,{y:0},{actionId:'panels',location:'city'}).id,'ladder');
 a.stone=1;assert.equal(navigationGoal(actionsFor(a),{y:9},null).y,9);
 assert.equal(navigationGoal(actionsFor(a),{y:0},null).id,'lift');
});
test('Core icons and selected pins have distinct colours',()=>{
 assert.notEqual(navigationColour({kind:'gem'}),navigationColour({kind:'pickup'}));
 assert.equal(navigationColour({kind:'gem'},true),'#65d5ff');
});
test('Pathfinding never invents a path into a wall and attaches exact starts safely',()=>{
 assert.deepEqual(route([0,0],[10,0],(x,z)=>x>8),[]);
 const wall=(x,z)=>x>=2&&x<=3&&Math.abs(z)<6,points=route([1,0],[9,0],wall);
 assert.ok(points.length>2);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let t=0;t<=1;t+=.02)assert.equal(wall(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),false);}
});
test('Lateral gait follows actual velocity, mirrors direction and alternates feet',()=>{
 assert.deepEqual(localMovement(3.6,0,0),{side:1,forward:0});
 const turned=localMovement(0,-3.6,Math.PI/2);assert.equal(turned.side,1);assert.ok(Math.abs(turned.forward)<1e-8);
 const right=lateralStep(Math.PI/2,1,0),left=lateralStep(Math.PI/2,-1,0);
 assert.equal(right.hipZ,-left.hipZ);assert.ok(Math.abs(right.hipX)<1e-8);
 assert.ok(right.knee>lateralStep(Math.PI/2,1,0,false).knee);
 assert.equal(lateralStep(0,0,1).knee,0);
});
