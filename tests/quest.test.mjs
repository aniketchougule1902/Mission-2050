import test from 'node:test';
import assert from 'node:assert/strict';
import {questSteps} from '../src/quest.js';
test('Checklist acknowledges alternate decisions without declaring a failed night test complete',()=>{
 const a={assembled:[],stone:-1,tasks:['coal'],rules:{budget:[]},night:null};
 assert.equal(questSteps(a).find(x=>x.key==='quest.power').done,true);
 a.assembled=[0,1,2,3];a.night={ending:'critical'};
 assert.equal(questSteps(a).find(x=>x.key==='quest.nightFailed').done,false);
 a.night={ending:'green'};
 assert.equal(questSteps(a).find(x=>x.key==='quest.night').done,true);
});
