import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import verdict from './api/verdict.js';
const base=process.cwd(),port=Number(process.env.PORT||4185);
const config=JSON.parse(await readFile(resolve(base,'vercel.json'),'utf8'));
const production=process.argv.includes('--production');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.hdr':'application/octet-stream'};
createServer(async(req,res)=>{
 for(const header of config.headers.find(rule=>rule.source==='/(.*)').headers)res.setHeader(header.key,header.value);
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(path==='/api/verdict') {let raw=''; for await(const c of req){raw+=c;if(raw.length>4096){res.writeHead(413);res.end();return;}} try{req.body=JSON.parse(raw||'{}');}catch{res.writeHead(400);res.end();return;} res.status=n=>{res.statusCode=n;return res;};res.json=v=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(v));};return verdict(req,res);}
 const root=production?resolve(base,'dist'):path.startsWith('/src/')?base:resolve(base,'public');
 const file=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!file.startsWith(root+String.fromCharCode(92))&&!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
 try{const content=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));