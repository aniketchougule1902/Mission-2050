import {replay,assess} from '../src/rules.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}
 if(Number(req.headers['content-length']||0)>4096)return res.status(413).json({error:'Payload too large'});
 try{const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>4096)throw Error('payload');const s=replay(b.decisions,b.players);if(!Array.isArray(b.budget))throw Error('budget');return res.status(200).json({version:1,...assess(s,b.budget)});}catch{return res.status(400).json({error:'Invalid mission data'});}
}