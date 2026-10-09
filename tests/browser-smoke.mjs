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
 await page.keyboard.down('w');await page.waitForTimeout(1200);await page.keyboard.up('w');
 const moved=await page.evaluate(()=>window.mission2050.snapshot());
 assert.ok(moved.position[2]<before.position[2]-1,'W input did not move the character forward');
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
}finally{
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
