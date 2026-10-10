import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkVisible,renderDistance,routeNeedsRefresh} from '../src/render-budget.js';
test('Bounded static meshes fade out of the draw list while large roads stay',()=>{
 assert.equal(chunkVisible(0,0,20,20,5,130),true);
 assert.equal(chunkVisible(0,0,300,200,4,130),false);
 assert.equal(chunkVisible(0,0,300,0,200,130),true);
 assert.equal(chunkVisible(0,0,135,0,5,130),true);
 assert.equal(chunkVisible(0,0,135.01,0,5,130),false);
 assert.equal(chunkVisible(0,0,NaN,0,10,130),true);
});
test('Adaptive quality only changes temporary draw distance',()=>{
 assert.equal(renderDistance('high'),230);
 assert.equal(renderDistance('high',true),130);
 assert.equal(renderDistance('low'),130);
 assert.equal(renderDistance('low',false),130);
});
test('Navigation only replans on movement, new action or district',()=>{
 const p={goalId:'gem',tx:45,tz:12,level:2,location:'city',x:10,z:10};
 const goal={id:'gem',x:45,z:12};
 assert.equal(routeNeedsRefresh(null,{x:10,z:10},goal,2,'city'),true);
 assert.equal(routeNeedsRefresh(p,{x:14,z:10},goal,2,'city'),false);
 assert.equal(routeNeedsRefresh(p,{x:17,z:10},goal,2,'city'),true);
 assert.equal(routeNeedsRefresh(p,{x:10,z:10},{...goal,id:'lift'},2,'city'),true);
 assert.equal(routeNeedsRefresh(p,{x:10,z:10},{...goal,x:46},2,'city'),true);
 assert.equal(routeNeedsRefresh(p,{x:10,z:10},goal,3,'city'),true);
 assert.equal(routeNeedsRefresh(p,{x:10,z:10},goal,2,'lab'),true);
});
