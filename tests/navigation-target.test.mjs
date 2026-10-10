import test from 'node:test';
import assert from 'node:assert/strict';
import {navigationGoal,navigationColour,navigationRoute} from '../src/navigation-target.js';
import {freshAdventure,actionsFor} from '../src/adventure.js';
import {route} from '../src/layout.js';
import {movementFacing} from '../src/locomotion.js';
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
test('Character turns toward travel in all directions and retains facing when stopped',()=>{
 for(const [vx,vz] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]){
  let facing=Math.PI;for(let i=0;i<60;i++)facing=movementFacing(vx,vz,facing,1/60);
  assert.ok(Math.abs(Math.atan2(Math.sin(facing-Math.atan2(vx,vz)),Math.cos(facing-Math.atan2(vx,vz))))<.001);
 }
 assert.equal(movementFacing(0,0,1.2,1/60),1.2);
 assert.ok(Math.abs(movementFacing(-.01,-1,Math.PI-.01,1/60)-(Math.PI-.01))<.02);
});
test('Selected lift and surface pin route through the rooftop ladder',()=>{
 const a=freshAdventure();a.assembled=[0];a.stone=1;const actions=actionsFor(a);
 for(const selection of [{actionId:'lift',location:'city'},{x:24,z:32,location:'city'}]){
  const goal=navigationGoal(actions,{y:9},selection);assert.equal(goal.id,'ladder');assert.equal(goal.y,9);
  assert.notEqual(navigationGoal(actions,{y:0},selection).id,'ladder');
 }
});
test('Routing tries reachable station sides and never relocates a blocked free pin',()=>{
 const blocked=(x,z)=>Math.hypot(x,z)<1;
 const planner=(start,end)=>end[0]>1?[start,end]:[];
 const points=navigationRoute([-10,0],{x:0,z:0,kind:'repair'},blocked,planner);
 assert.ok(points.at(-1)[0]>1);assert.ok(Math.hypot(...points.at(-1))<2.2);
 assert.deepEqual(navigationRoute([-10,0],{x:0,z:0,kind:'pin'},blocked,planner),[]);
});
