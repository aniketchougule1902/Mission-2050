import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
const base=process.env.BASE_URL||'https://mission-2050.vercel.app';
const expected=process.env.EXPECTED_REVISION;
assert.ok(expected,'EXPECTED_REVISION is required');
let deployed=false;
for(let attempt=0;attempt<60;attempt++){
 try{
  const res=await fetch(base+'/build-info.json?revision='+expected,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(res.ok&&(await res.json()).revision===expected){deployed=true;break;}
 }catch{}
 if(attempt%6===0)console.log('Waiting for production revision',expected);
 await delay(5000);
}
assert.ok(deployed,'Production did not publish the tested commit');
const home=await fetch(base+'/',{signal:AbortSignal.timeout(10000)});
assert.equal(home.status,200);
const csp=home.headers.get('content-security-policy');
for(const directive of ['img-src','connect-src'])assert.ok(csp.split(';').find(p=>p.trim().startsWith(directive)).includes('blob:'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let checked=0;
// Sequential bounded transfers avoid an artificial download burst on production.
for(const dir of ['models','textures','vendor'])for(const name of await readdir('public/'+dir)){
 const response=await fetch(base+'/'+dir+'/'+name,{signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,dir+'/'+name);
 assert.equal(hash(Buffer.from(await response.arrayBuffer())),hash(await readFile('public/'+dir+'/'+name)),'Asset mismatch: '+dir+'/'+name);
 checked++;
}
const invalid=await fetch(base+'/api/verdict',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
assert.equal(invalid.status,400);
const method=await fetch(base+'/api/verdict');assert.equal(method.status,405);
console.log('Verified production revision, CSP, '+checked+' exact asset hashes and API validation');
