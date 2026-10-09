import { cp, mkdir, rm } from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
const output=resolve('dist');
if(dirname(output)!==process.cwd()||basename(output)!=='dist')throw Error('Invalid build directory');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp('public',output,{recursive:true});
await cp('src',resolve(output,'src'),{recursive:true});
console.log('Mission 2050 built into dist.');
