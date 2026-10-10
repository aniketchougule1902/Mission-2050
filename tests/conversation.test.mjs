import test from 'node:test';
import assert from 'node:assert/strict';
import {createConversation} from '../src/conversation.js';
import {addTranslations} from '../src/locale.js';
addTranslations({'test.line1':'First message','test.line2':'Second message','conv.advance':'Continue'});
function fixture(reduced=false){
 const nodes=new Map(),classes=new Set(),listeners=new Map();
 const node=()=>({style:{},textContent:'',classList:{add(){},remove(){}},addEventListener(name,fn){listeners.set(name,fn);}});
 for(const key of ['.conv-avatar','.conv-name','.conv-text','.conv-advance','.conv-live'])nodes.set(key,node());
 const root={style:{},querySelector:key=>nodes.get(key),classList:{add(...x){x.forEach(v=>classes.add(v));},remove(...x){x.forEach(v=>classes.delete(v));},toggle(k,v){v?classes.add(k):classes.delete(k);}}};
 const blips=[];return {conversation:createConversation(root,hz=>blips.push(hz),{reduced}),nodes,classes,blips};
}
test('Conversations enqueue overlapping requests and resolve after each line',async()=>{
 const {conversation:c,nodes}=fixture();let first=false,second=false;
 const p=c.play([{who:'asha',key:'test.line1',speed:10,hold:1}]).then(()=>first=true);
 const q=c.play([{who:'kabir',key:'test.line2',speed:10,hold:1}]).then(()=>second=true);
 c.tick(.5);assert.equal(nodes.get('.conv-text').textContent,'First');assert.equal(first,false);
 c.skip();c.skip();await p;assert.equal(first,true);assert.equal(second,false);
 c.skip();c.skip();await q;assert.equal(c.isActive(),false);
});
test('Reduced motion reveals a full accessible line without speech blips',()=>{
 const {conversation:c,nodes,blips}=fixture(true);c.play([{who:'asha',key:'test.line1'}]);c.tick(1/60);
 assert.equal(nodes.get('.conv-text').textContent,'First message');assert.equal(nodes.get('.conv-live').textContent,'First message');assert.deepEqual(blips,[]);c.cancel();
});
test('Auto advance uses simulation time and cancellation settles every waiter',async()=>{
 const {conversation:c,classes}=fixture();const p=c.play([{key:'test.line1',hold:1}]);const q=c.play([{key:'test.line2'}]);
 c.tick(1);assert.equal(c.isActive(),true);c.tick(.5);assert.equal(classes.has('active'),true);c.cancel();await Promise.all([p,q]);assert.equal(c.isActive(),false);assert.equal(classes.has('visible'),false);
});
