import test from 'node:test';
import assert from 'node:assert/strict';
import {ecologicalActionIds,ecologicalActionSite,ecologicalActionKind} from '../src/ecology-effects.js';
import {freshAdventure,actionsFor,act} from '../src/adventure.js';

test('planting and watering sites match the real land-restoration quest layout',()=>{
 const ids=['housing1','housing2','water1','water2'];
 assert.deepEqual(ecologicalActionIds,ids);
 assert.deepEqual(ids.map(ecologicalActionSite),[[93,-104],[93,-123],[108,-137],[136,-126]]);
 assert.equal(ecologicalActionSite('unexpected'),null);
 const a=freshAdventure();
 a.assembled=[0,1];a.rules.stage=2;
 a.tasks=['stakes'];
 const first=actionsFor(a).map(x=>x.id);
 assert.ok(first.includes('housing1')&&first.includes('housing2'));
});

test('stone cannot be collected before habitat staking, planting and watering',()=>{
 let a=freshAdventure();
 a.assembled=[0,1];
 a.rules.stage=2;
 a.tasks=['stakes'];
 a=act(a,'housing1');
 a=act(a,'housing2');
 assert.ok(actionsFor(a).some(x=>x.id==='grove'));
 assert.ok(!actionsFor(a).some(x=>x.id==='gem'));
 a=act(a,'grove');
 assert.ok(actionsFor(a).some(x=>x.id==='water1'));
 a=act(a,'water1');
 assert.ok(!actionsFor(a).some(x=>x.id==='gem'));
 a=act(a,'water2');
 assert.ok(actionsFor(a).some(x=>x.id==='gem'));
});

test('Housing surveys mark construction boundaries; only grove restoration plants saplings',()=>{assert.equal(ecologicalActionKind('housing1'),'survey');assert.equal(ecologicalActionKind('housing2'),'survey');assert.equal(ecologicalActionKind('water1'),'plant');assert.equal(ecologicalActionKind('water2'),'plant');assert.equal(ecologicalActionKind('unexpected'),null);});
