// Runs only in CI after installing the pinned Playwright browser.
// Smoke-tests a real WebGL canvas: unit tests alone cannot detect missing skins.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const baseURL=process.env.BASE_URL||'http://127.0.0.1:4185';
const server=process.env.BASE_URL?null:spawn(process.execPath,['dev.mjs','--production'],{stdio:['ignore','pipe','pipe']});
let browser;let serverError='';
server?.stderr.on('data',chunk=>serverError+=chunk.toString());
async function ready(){
 for(let i=0;i<80;i++){
  try{const response=await fetch('http://127.0.0.1:4185/');if(response.ok)return;}catch{}
  if(server.exitCode!==null)throw Error('Local server exited: '+serverError);
  await delay(250);
 }
 throw Error('Local game server did not become ready: '+serverError);
}
try{
 if(server)await ready();
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const pageErrors=[],assetErrors=[],decodeErrors=[];
 page.on('console',message=>{if(/Content Security Policy|Couldn.t load texture|Failed to fetch/.test(message.text()))decodeErrors.push(message.text());});
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('response',response=>{if(response.status()>=400&&/\/(?:models|textures|vendor)\//.test(response.url()))assetErrors.push(response.status()+' '+response.url());});
 await page.goto(baseURL+'/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.mission2050),{timeout:30000});
 const begin=page.locator('[data-action="begin"]');
 await begin.waitFor({timeout:15000});await begin.click();
 await page.waitForFunction(()=>window.mission2050?.snapshot().renderStats?.calls>0,{timeout:30000});
 await page.waitForFunction(()=>window.mission2050?.snapshot().modelLoaded===true,{timeout:35000});
 await page.keyboard.press('Enter'); // dismiss opening cinematic, enter physical traversal
 await page.waitForTimeout(1200);
 const before=await page.evaluate(()=>window.mission2050.snapshot());
 assert.equal(before.screen,'city','Player cannot enter the city');
 await page.keyboard.down('S'); // Caps Lock / uppercase input must still backpedal.
 let movementWaitError='';
 try{
  // Software-rendered WebGL may stall the main thread; require movement, not
  // simply 1200ms of wall time which can pass without a simulation frame.
  await page.waitForFunction(start=>{
   const position=window.mission2050?.snapshot()?.position;
   return position&&Math.hypot(position[0]-start[0],position[2]-start[2])>.05;
  },before.position,{timeout:8000,polling:150});
 }catch(e){movementWaitError=e.message;}
 finally{await page.keyboard.up('S');}
 const moved=await page.evaluate(()=>window.mission2050.snapshot());
 assert.ok(Math.hypot(moved.position[0]-before.position[0],moved.position[2]-before.position[2])>.05,
  'Movement failed near research compound: '+JSON.stringify({before:before.position,after:moved.position,screen:moved.screen,pageErrors,movementWaitError}));
 // Compact mission board and map are real clickable controls.
 assert.equal(await page.locator('#questToggle').getAttribute('aria-expanded'),'false');
 await page.locator('#questToggle').click();assert.equal(await page.locator('#questToggle').getAttribute('aria-expanded'),'true');
 await page.locator('#questToggle').click();assert.equal(await page.locator('#questToggle').getAttribute('aria-expanded'),'false');
 assert.match(await page.locator('#compassHeading').textContent(),/\d+°/);
 const facing=await page.evaluate(()=>window.mission2050.snapshot().position);
 await page.keyboard.down('d');
 try{await page.waitForFunction(start=>window.mission2050.snapshot().position[0]>start[0]+.08,facing,{timeout:8000});}
 finally{await page.keyboard.up('d');}
 const side=await page.evaluate(()=>window.mission2050.snapshot());
 assert.ok(Math.abs(Math.atan2(Math.sin(side.facing-Math.PI),Math.cos(side.facing-Math.PI)))<.15,'Sidestep rotated the character');
 await page.locator('#minimapToggle').click();await page.locator('#bigmap').waitFor();
 assert.equal(await page.locator('.compass-mark').count(),181);
 await page.locator('#bigmap').click({position:{x:100,y:100}});
 await page.screenshot({path:'game-tactical-map.png'});
 await page.locator('#minimapToggle').click();assert.equal((await page.evaluate(()=>window.mission2050.snapshot())).screen,'city');
 await page.waitForFunction(()=>document.querySelector('#compassWaypoint').classList.contains('custom-pin'));
 await page.locator('#minimapToggle').click();await page.locator('#clearMapPin').click();await page.keyboard.press('m');
 await page.waitForFunction(()=>!document.querySelector('#compassWaypoint').classList.contains('custom-pin'));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
 const hudBounds=await page.evaluate(()=>{const c=document.querySelector('#compass').getBoundingClientRect(),m=document.querySelector('#minimapToggle').getBoundingClientRect();return {compass:{x:c.x,y:c.y,right:c.right},map:{x:m.x,y:m.y,right:m.right}};});
 assert.ok(hudBounds.compass.x>=0&&hudBounds.compass.right<=390);assert.ok(hudBounds.map.x>=0&&hudBounds.map.right<=390);
 await page.screenshot({path:'game-phone-navigation.png'});
 await page.setViewportSize({width:1280,height:720});
 await page.keyboard.press('m');await page.locator('#bigmap').waitFor();await page.keyboard.press('m');assert.equal((await page.evaluate(()=>window.mission2050.snapshot())).screen,'city');
 // Sustained render check: catch context loss, memory pressure and late asset exceptions.
 await page.waitForTimeout(20000);
 const snapshot=await page.evaluate(()=>window.mission2050.snapshot());
 const fps=await page.locator('#fps').textContent();
 assert.equal(snapshot.screen,'city','Game exited play during sustained render');
 assert.ok(snapshot.renderStats.calls>0,'Render loop stalled during soak');
 console.log('20-second browser soak',JSON.stringify({fps,from:before.position,to:snapshot.position}));
 assert.ok(snapshot.renderStats.calls>0,'No 3D draw calls');
 assert.ok(snapshot.renderStats.triangles>0,'No geometry rendered');
 assert.ok(snapshot.renderStats.totalChunks>0,'No instanced city facade chunks');
 assert.ok(snapshot.renderStats.visibleChunks>0,'Nearby facades disappeared');
 assert.ok(snapshot.renderStats.visibleChunks<=snapshot.renderStats.totalChunks,'Invalid chunk counts');
 assert.ok(snapshot.securityGuards===6,'Research security models missing');
 assert.ok(snapshot.traffic.length===8,'Traffic did not spawn');
 assert.equal(snapshot.nativeRig,true,'Native character rig is not ready');
 assert.deepEqual(assetErrors,[],'Missing game asset responses');
 assert.deepEqual(decodeErrors,[],'Texture decoding or production CSP errors');
 assert.deepEqual(pageErrors,[],'Unhandled browser exceptions');
 await page.screenshot({path:'game-smoke.png'});
 console.log('3D browser smoke passed',JSON.stringify({drawCalls:snapshot.renderStats.calls,triangles:snapshot.renderStats.triangles,models:snapshot.modelLoaded,guards:snapshot.securityGuards,traffic:snapshot.traffic.length}));
 // Exercise Three.js watering and planting geometries in a real Chromium WebGL session.
 // This checks animation timing, persistent save reconstruction and cleanup.
 const ecologyResults=await page.evaluate(async()=>{
  const [T,{createEcologyEffects,ecologicalActionIds,ecologicalActionSite}]=await Promise.all([
   import('/vendor/three.module.js'),import('/src/ecology-effects.js')]);
  const city=new T.Group(),actor=new T.Group(),effects=createEcologyEffects(T,city,actor);
  const initial=ecologicalActionIds.map(id=>[id,ecologicalActionSite(id)]);
  const simulate=async id=>{
   const promise=effects.play(id);
   for(let i=0;i<165;i++)effects.tick(1/60,null);
   return await promise;
  };
  const planted=await simulate('housing1');
  effects.sync(['housing1']);
  const plantedVisible=city.children.some(x=>x.name==='Ecosystem-housing1'&&x.visible&&x.children.some(c=>c.name==='HousingSurveyBoundary'&&c.children.length===8));
  const watered=await simulate('water1');
  effects.sync(['housing1','water1']);
  const grown=city.children.some(x=>x.name==='Ecosystem-water1'&&x.visible&&x.children[1].scale.x>.6&&x.children[1].scale.x<=.7);
  const waterParticles=city.children.some(x=>x.name==='Ecosystem-water1'&&x.children.some(y=>y.isPoints));
  effects.dispose();
  return {initial,planted,watered,plantedVisible,grown,waterParticles};
 });
 assert.deepEqual(ecologyResults.initial.map(x=>x[0]),['housing1','housing2','water1','water2']);
 assert.ok(ecologyResults.planted&&ecologyResults.plantedVisible,'Native WebGL construction boundary marking failed');
 assert.ok(ecologyResults.watered&&ecologyResults.grown&&ecologyResults.waterParticles,'Sapling planting and water spray failed');
 assert.deepEqual(pageErrors,[],'Ecology effects caused JS exceptions');
 console.log('Ecology render/timing test passed',JSON.stringify(ecologyResults));
 // Physical elevator round trip using real movement and interaction controls.
 await page.keyboard.down('w');
 try{await page.waitForFunction(()=>window.mission2050.snapshot().nearest?.id==='lift'&&window.mission2050.snapshot().nearest.distance<2,{timeout:45000});}
 finally{await page.keyboard.up('w');}
 for(const location of ['lab','city']){
  if(location==='city'){
   // The lift exits one metre forward. Step into its centre to select it
   // ahead of the lab handover marker.
   await page.keyboard.down('s');
   try{await page.waitForFunction(()=>window.mission2050.snapshot().nearest?.id==='lift',{timeout:15000});}
   finally{await page.keyboard.up('s');}
  }
  await page.keyboard.down('e');
  try{await page.waitForFunction(()=>window.mission2050.snapshot().cinematic?.kind==='elevator',{timeout:20000});}
  finally{await page.keyboard.up('e');}
  await page.waitForFunction(expected=>{const s=window.mission2050.snapshot();return s.screen==='city'&&s.adventure.location===expected&&!s.cinematic;},location,{timeout:90000});
  const arrived=await page.evaluate(()=>window.mission2050.snapshot());
  assert.ok(Math.abs(arrived.position[1]-(location==='lab'?-24:0))<.05,'Lift floor mismatch');
  await page.screenshot({path:'game-lift-'+location+'.png'});
 }
 assert.deepEqual(pageErrors,[],'Lift caused browser exceptions');
 console.log('Physical elevator round trip passed');
 // Separate no-GPU accessibility playthrough: all five stones, server verdict
 // and restart must complete through actual menu controls.
 const accessible=await browser.newPage({viewport:{width:1100,height:800}});
 const assetRequests=[];
 accessible.on('request',req=>{if(req.url().includes('/models/'))assetRequests.push(req.url());});
 await accessible.addInitScript(()=>localStorage.setItem('m2050.v3.settings',JSON.stringify({text:true,quality:'low',locale:'en',volume:0})));
 await accessible.goto(baseURL+'/',{waitUntil:'domcontentloaded'});
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
 server?.kill('SIGTERM');
}
