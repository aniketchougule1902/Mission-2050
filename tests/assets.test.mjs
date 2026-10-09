import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
test('All locally packaged module imports resolve',()=>{
 const paths=['src','public/vendor'];
 for(const folder of paths)for(const name of readdirSync(folder).filter(x=>x.endsWith('.js'))){
  const file=resolve(folder,name),source=readFileSync(file,'utf8');
  for(const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){
   const spec=match[1];if(!spec.startsWith('.')&&!spec.startsWith('/'))continue;
   const target=spec.startsWith('/')?resolve('public',spec.slice(1)):resolve(dirname(file),spec);
   assert.ok(existsSync(target),`${file} references missing ${spec}`);
  }
 }
});

test('Production policy permits embedded GLB image decoding without remote scripts',()=>{
 const config=JSON.parse(readFileSync('vercel.json','utf8'));
 const policy=config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
 for(const directive of ['img-src','connect-src'])assert.ok(policy.split(';').find(p=>p.trim().startsWith(directive)).includes('blob:'));
 assert.ok(policy.includes("script-src 'self';"));
});
