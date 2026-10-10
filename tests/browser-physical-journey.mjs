import {movePlayer} from './browser-input.mjs';
// Real input, proximity, collision, ladder, driving, lift, researcher and verdict.
// Requires a running game server and Playwright. No state mutation or teleporting.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseURL=process.env.BASE_URL||'http://127.0.0.1:4185';
const output=process.env.EVIDENCE_DIR||'outputs/scenery-restoration';
const checkpoint=process.env.RESUME_SAVE?JSON.parse(await readFile(process.env.RESUME_SAVE,'utf8')):null;
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:process.env.NATIVE_GPU?['--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[],assets=[],journey=[],verdicts=[];
if(checkpoint){const prior=JSON.parse(await readFile(output+'/journey.json','utf8'));journey.push(...prior.journey);errors.push(...prior.errors);assets.push(...prior.assets);verdicts.push(...prior.verdicts);}
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push({message:m.text(),url:m.location().url});});
page.on('response',async r=>{if(r.status()>=400&&/\/(models|textures|vendor)\//.test(r.url()))assets.push(r.status()+' '+r.url());if(r.url().endsWith('/api/verdict'))verdicts.push({status:r.status(),body:await r.json()});});
const snapshot=()=>page.evaluate(()=>window.mission2050.snapshot());
const moveTo=(goal,drive=false)=>movePlayer(page,goal,drive);
async function task(id){
 const before=await snapshot();
 const item=await page.evaluate(async id=>{const {actionsFor}=await import('/src/adventure.js');const s=window.mission2050.snapshot(),action=actionsFor(s.adventure).find(x=>x.id===id);if(action?.id==='ladder'&&s.position[1]>6)return {...action,x:-103,z:-73,y:9};return action;},id);
 assert.ok(item,'Unavailable task '+id);
 await moveTo([item.x,item.z],item.kind==='deliver');
 await page.waitForFunction(id=>{const s=window.mission2050.snapshot();return s.nearest?.id===id&&s.nearest.distance<(s.driving?3:2.2);},id,{timeout:5000});
 await page.keyboard.down('e');
 if(id==='housing1'){
  await page.waitForFunction(()=>window.mission2050.snapshot().events.some(e=>e.name==='ecology.animation.start'&&e.id==='housing1'));
  await page.keyboard.press('Escape');await page.waitForTimeout(1600);assert.equal((await snapshot()).adventure.tasks.includes('housing1'),false,'Survey advanced while paused');await page.keyboard.press('Escape');
 }
 try{await page.waitForFunction(({id,before})=>{const s=window.mission2050.snapshot();if(id==='ladder')return (s.position[1]>6)!==(before.position[1]>6);if(id==='lift')return s.screen==='city'&&s.adventure.location!==before.adventure.location;if(id==='assemble')return s.screen==='city'&&s.adventure.assembled.length===before.adventure.assembled.length+1;if(id==='activate')return s.screen==='ending';if(id==='gem')return s.adventure.stone>=0;if(id==='night')return s.adventure.night!==null&&JSON.stringify(s.adventure.night)!==JSON.stringify(before.adventure.night);if(id.startsWith('budget:'))return s.adventure.rules.budget.includes(id.slice(7))!==before.adventure.rules.budget.includes(id.slice(7));return s.adventure.tasks.includes(id);},{id,before},{timeout:45000});}
 finally{await page.keyboard.up('e');}
 await page.waitForTimeout(id==='ladder'?1500:300);
 const s=await snapshot();assert.ok(s.renderStats.calls>0);assert.equal(s.modelLoaded,true);
 const entry={id,location:s.adventure.location,position:s.position,assembled:s.adventure.assembled,heat:Math.round(s.adventure.heat),render:s.renderStats};journey.push(entry);console.log('Physical task passed',JSON.stringify(entry));
 await writeFile(output+'/checkpoint.json',JSON.stringify(s.adventure,null,2));
 await writeFile(output+'/journey.json',JSON.stringify({journey,errors,assets,verdicts},null,2));
 return s;
}
try{
 await page.addInitScript(checkpoint=>{if(!sessionStorage.getItem('physical-journey-started')){localStorage.clear();if(checkpoint)localStorage.setItem('m2050.adventure.v3',JSON.stringify(checkpoint));localStorage.setItem('m2050.v3.settings',JSON.stringify({quality:'balanced',renderVersion:2,volume:0,text:false}));sessionStorage.setItem('physical-journey-started','1');}},checkpoint);
 await page.goto(baseURL);await page.locator('[data-action="begin"]').click();
 await page.waitForFunction(()=>window.mission2050?.snapshot().modelLoaded,{timeout:60000});if((await snapshot()).screen==='intro')await page.keyboard.press('Enter');await page.waitForTimeout(1500);
 const scenery=await page.evaluate(async()=>{const {buildingLots,treeSites}=await import('/src/layout.js');return {buildings:buildingLots.length,trees:treeSites.length,obstacles:window.mission2050.navigation().obstacles.length};});
 assert.ok(scenery.buildings===73);assert.ok(scenery.trees>=80);console.log('Restored scenery',JSON.stringify(scenery));
 await page.screenshot({path:output+(checkpoint?'/city-continue.png':'/city-start.png')});
 if((await snapshot()).adventure.assembled.length<1)for(const id of ['fuse','power','circuit','clinic','gem','lift','assemble','lift'])await task(id);
 if((await snapshot()).adventure.assembled.length<2){await task('ladder');for(const id of ['panels','panel1','panel2','panel3','gem'])await task(id);
 await page.screenshot({path:output+'/school-roof.png'});await task('ladder');for(const id of ['lift','assemble','lift'])await task(id);}
 if((await snapshot()).adventure.assembled.length<3){for(const id of ['stakes','housing1','housing2','grove','water1','water2']){await task(id);if(id==='housing1')await page.screenshot({path:output+'/survey-boundary.png'});if(id==='water1')await page.screenshot({path:output+'/sapling-grove.png'});}
 for(const id of ['gem','lift','assemble','lift'])await task(id);
 await page.keyboard.press('Escape');await page.reload();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>window.mission2050.snapshot().modelLoaded,{timeout:60000});assert.deepEqual((await snapshot()).adventure.assembled,[0,1,2]);
 await page.keyboard.press('m');await page.locator('#zoomIn').click();await page.screenshot({path:output+'/map-restored.png'});await page.keyboard.press('Escape');}
 if((await snapshot()).adventure.assembled.length<4){for(const id of ['scan1','scan2','scan3','valve','gem'])await task(id);
 await page.screenshot({path:output+'/river-unlocked.png'});for(const id of ['lift','assemble','lift'])await task(id);}
 if(!(await snapshot()).adventure.tasks.includes('cargo'))await task('cargo');
 if(!(await snapshot()).adventure.tasks.includes('clinicDelivery')){
  if(!(await snapshot()).driving){await moveTo([14,34]);await page.keyboard.press('f');await page.waitForFunction(()=>window.mission2050.snapshot().driving,{timeout:5000});}
  if(!(await snapshot()).adventure.tasks.includes('depotDelivery')){await task('depotDelivery');await page.screenshot({path:output+'/depot-driving.png'});}
  await task('clinicDelivery');
 }
 if((await snapshot()).driving){await page.keyboard.press('f');await page.waitForFunction(()=>!window.mission2050.snapshot().driving,{timeout:5000});}
 await moveTo([-125,191]);
 for(const id of ['budget:buses','budget:cycling','budget:training'])await task(id);
 const failed=await task('night');assert.equal(failed.adventure.night.ending,'critical');assert.equal(failed.adventure.night.reserve,-2);
 await task('budget:backup');const repaired=await task('night');assert.equal(repaired.adventure.night.ending,'green');assert.equal(repaired.adventure.night.reserve,14);
 for(const id of ['gem','lift','assemble','activate'])await task(id);
 const final=await snapshot();assert.deepEqual(final.adventure.assembled,[0,1,2,3,4]);assert.equal(final.adventure.ending.ending,'green');assert.equal(final.adventure.ending.reserve,14);
 assert.equal(verdicts.length,1);assert.equal(verdicts[0].status,200);assert.equal(verdicts[0].body.ending,'green');assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);
 await page.screenshot({path:output+'/green-ending.png'});await page.locator('[data-action="restart"]').click();assert.equal((await snapshot()).screen,'home');assert.deepEqual((await snapshot()).adventure.assembled,[]);
 await writeFile(output+'/result.json',JSON.stringify({passed:true,scenery,tasks:journey.length,ending:final.adventure.ending,verdicts,errors,assets,restart:true,savedCheckpointResume:!!checkpoint},null,2));console.log('PHYSICAL FIVE-MISSION JOURNEY PASSED');
}catch(e){console.error(e);await page.screenshot({path:output+'/failure.png'}).catch(()=>{});await writeFile(output+'/failure.json',JSON.stringify({message:e.message,snapshot:await snapshot(),journey,errors,assets},null,2));process.exitCode=1;}
finally{await browser.close();}
