// Runs only in CI after installing the pinned Playwright browser.
// Smoke-tests a real WebGL canvas: unit tests alone cannot detect missing skins.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const server=spawn(process.execPath,['dev.mjs'],{stdio:['ignore','pipe','pipe']});
let browser;let serverError='';
server.stderr.on('data',chunk=>serverError+=chunk.toString());
async function ready(){
 for(let i=0;i<80;i++){
  try{const response=await fetch('http://127.0.0.1:4185/');if(response.ok)return;}catch{}
  if(server.exitCode!==null)throw Error('Local server exited: '+serverError);
  await delay(250);
 }
 throw Error('Local game server did not become ready: '+serverError);
}
try{
 await ready();
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const pageErrors=[],assetErrors=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('response',response=>{if(response.status()>=400&&/\/(?:models|textures|vendor)\//.test(response.url()))assetErrors.push(response.status()+' '+response.url());});
 await page.goto('http://127.0.0.1:4185/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.mission2050),{timeout:30000});
 const begin=page.locator('[data-action="begin"]');
 await begin.waitFor({timeout:15000});await begin.click();
 await page.waitForFunction(()=>window.mission2050?.snapshot().renderStats?.calls>0,{timeout:30000});
 await page.waitForFunction(()=>window.mission2050?.snapshot().modelLoaded===true,{timeout:35000});
 await page.keyboard.press('Enter'); // dismiss opening cinematic, enter physical traversal
 await page.waitForTimeout(1200);
 const before=await page.evaluate(()=>window.mission2050.snapshot());
 assert.equal(before.screen,'city','Player cannot enter the city');
 await page.keyboard.down('s');await page.waitForTimeout(1200);await page.keyboard.up('s');
 const moved=await page.evaluate(()=>window.mission2050.snapshot());
 assert.ok(Math.hypot(moved.position[0]-before.position[0],moved.position[2]-before.position[2])>1,
  'Movement failed near research compound: '+JSON.stringify({before:before.position,after:moved.position,screen:moved.screen}));
 // Sustained render check: catch context loss, memory pressure and late asset exceptions.
 await page.waitForTimeout(20000);
 const snapshot=await page.evaluate(()=>window.mission2050.snapshot());
 const fps=await page.locator('#fps').textContent();
 assert.equal(snapshot.screen,'city','Game exited play during sustained render');
 assert.ok(snapshot.renderStats.calls>0,'Render loop stalled during soak');
 console.log('20-second browser soak',JSON.stringify({fps,from:before.position,to:snapshot.position}));
 assert.ok(snapshot.renderStats.calls>0,'No 3D draw calls');
 assert.ok(snapshot.renderStats.triangles>0,'No geometry rendered');
 assert.ok(snapshot.securityGuards===6,'Research security models missing');
 assert.ok(snapshot.traffic.length===8,'Traffic did not spawn');
 assert.equal(snapshot.nativeRig,true,'Native character rig is not ready');
 assert.deepEqual(assetErrors,[],'Missing game asset responses');
 assert.deepEqual(pageErrors,[],'Unhandled browser exceptions');
 await page.screenshot({path:'game-smoke.png'});
 console.log('3D browser smoke passed',JSON.stringify({drawCalls:snapshot.renderStats.calls,triangles:snapshot.renderStats.triangles,models:snapshot.modelLoaded,guards:snapshot.securityGuards,traffic:snapshot.traffic.length}));
 // Separate no-GPU accessibility playthrough: all five stones, server verdict
 // and restart must complete through actual menu controls.
 const accessible=await browser.newPage({viewport:{width:1100,height:800}});
 const assetRequests=[];
 accessible.on('request',req=>{if(req.url().includes('/models/'))assetRequests.push(req.url());});
 await accessible.addInitScript(()=>localStorage.setItem('m2050.v3.settings',JSON.stringify({text:true,quality:'low',locale:'en',volume:0})));
 await accessible.goto('http://127.0.0.1:4185/',{waitUntil:'domcontentloaded'});
 await accessible.locator('[data-action="begin"]').click();
 const missions=[
  ['fuse','power','circuit','clinic','gem'],
  ['panels','panel1','panel2','panel3','gem'],
  ['stakes','housing1','housing2','grove','water1','water2','gem'],
  ['scan1','scan2','scan3','valve','gem'],
  ['cargo','depotDelivery','clinicDelivery','budget:buses','budget:cycling','budget:backup','budget:training','night','gem']
 ];
 for(const steps of missions){
  for(const id of steps){
   const choice=accessible.locator('[data-action="accessible:'+id+'"]');
   await choice.waitFor({state:'visible',timeout:10000});await choice.click();
  }
  for(const id of ['lift','assemble','lift']){
   const choice=accessible.locator('[data-action="accessible:'+id+'"]');
   await choice.waitFor({state:'visible',timeout:10000});await choice.click();
  }
 }
 await accessible.locator('[data-action="accessible:lift"]').click();
 await accessible.locator('[data-action="accessible:activate"]').click();
 await accessible.waitForFunction(()=>window.mission2050?.snapshot().screen==='ending',{timeout:15000});
 const ending=await accessible.evaluate(()=>window.mission2050.snapshot());
 assert.deepEqual(ending.adventure.assembled,[0,1,2,3,4]);
 assert.equal(ending.adventure.ending.ending,'green');
 assert.deepEqual(assetRequests,[],'Accessible mode should not initialize or fetch GPU models');
 await accessible.locator('[data-action="restart"]').click();
 assert.equal((await accessible.evaluate(()=>window.mission2050.snapshot())).screen,'home');
 console.log('Accessible 5-level journey + restart passed without WebGL');

}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
