import test from 'node:test';
import assert from 'node:assert/strict';
import {areaUnlocked,districts,blocked,route,LAB_Y,locateAction} from '../src/layout.js';
test('Each milestone opens its district while later districts remain closed',()=>{
 for(let level=0;level<5;level++)for(let i=0;i<5;i++)assert.equal(areaUnlocked(...districts[i].center,level),i<=level);
 assert.equal(areaUnlocked(301,299,4),false);
});
test('Every district can be reached along its unlocked service corridor',()=>{
 for(let i=0;i<5;i++)for(let k=0;k<=20;k++)assert.equal(areaUnlocked(districts[i].center[0]*k/20,districts[i].center[1]*k/20,i),true);
});
test('Lab navigation protects the containment reactor and outer walls',()=>{
 assert.equal(blocked(0,-8,LAB_Y,[],4,'lab'),true);
 assert.equal(blocked(-2,3,LAB_Y,[],0,'lab'),false);
 assert.equal(blocked(18,0,LAB_Y,[],4,'lab'),true);
});
test('Breadcrumb routing detours around building footprints',()=>{
 const wall=(x,z)=>Math.abs(x-12)<4&&Math.abs(z)<8;
 const path=route([0,0],[28,0],wall);
 assert.ok(path.length>3);
 assert.ok(path.every(p=>!wall(...p)));
 assert.ok(path.some(p=>Math.abs(p[1])>=8));
});
test('Rooftop tasks use the school elevation instead of ground-level interaction',()=>{
 assert.equal(locateAction({id:'panel1'},1).y,9);
 assert.equal(locateAction({id:'valve'},3).y,0);
});
