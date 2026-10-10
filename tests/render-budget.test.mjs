import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkVisible,renderDistance,routeNeedsRefresh,renderProfile,createFrameBudget} from '../src/render-budget.js';
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
 assert.equal(renderDistance('high',true),170);
 assert.equal(renderDistance('low'),170);
 assert.equal(renderDistance('low',false),170);
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

test('Browser profiles bound pixel cost and reserve post-processing for Cinematic',()=>{for(const [w,h,dpr] of [[1280,720,1],[1920,1080,2],[390,844,3]]){const p=renderProfile('balanced',w,h,dpr);assert.ok(w*h*p.scale*p.scale<=1100001);assert.equal(p.post,false);}assert.equal(renderProfile('high').post,true);assert.equal(renderDistance('balanced'),230);});
test('Adaptive quality reacts to sustained misses and does not oscillate on a hitch',()=>{const b=createFrameBudget(90);assert.equal(b.sample(.08),0);let reductions=0;for(let i=0;i<150;i++)reductions+=b.sample(1/40)===-1;assert.ok(reductions>0);b.reset();for(let i=0;i<90;i++)assert.equal(b.sample(1/90),0);});
