import {movePlayer} from './browser-input.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const save=JSON.parse(await readFile(process.env.SAVE_PATH||'outputs/scenery-final/clinic-checkpoint.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:process.env.NATIVE_GPU?['--enable-gpu','--ignore-gpu-blocklist']:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(save=>{if(!sessionStorage.getItem('vehicle-check-started')){localStorage.clear();localStorage.setItem('m2050.adventure.v3',JSON.stringify(save));localStorage.setItem('m2050.v3.settings',JSON.stringify({quality:'balanced',renderVersion:2,volume:0}));sessionStorage.setItem('vehicle-check-started','1');}},save);
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4185');await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>window.mission2050.snapshot().modelLoaded,{timeout:60000});
 // Continue from a checkpoint produced by the physical journey.
 await movePlayer(page,[14,34]);
 await page.keyboard.press('f');await page.waitForFunction(()=>window.mission2050.snapshot().driving,{timeout:5000});
 await page.keyboard.down('w');try{await page.waitForFunction(()=>window.mission2050.snapshot().position[2]>41.5,{timeout:10000});}finally{await page.keyboard.up('w');}
 await page.keyboard.down(' ');try{await page.waitForFunction(()=>Math.abs(window.mission2050.navigation().speed)<.2,{timeout:8000});}finally{await page.keyboard.up(' ');}
 await page.keyboard.press('Escape');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('m2050.adventure.v3')));assert.equal(saved.vehicle.driving,true);assert.ok(saved.vehicle.position[2]>41);
 await page.reload();await page.locator('[data-action="begin"]').click();await page.waitForFunction(()=>window.mission2050.snapshot().modelLoaded,{timeout:60000});
 const restored=await page.evaluate(()=>({state:window.mission2050.snapshot(),nav:window.mission2050.navigation()}));assert.equal(restored.state.driving,true);assert.ok(Math.hypot(restored.nav.carPosition[0]-saved.vehicle.position[0],restored.nav.carPosition[2]-saved.vehicle.position[2])<.1);assert.ok(Math.abs(restored.nav.heading-saved.vehicle.heading)<1e-8);assert.deepEqual(restored.state.adventure.assembled,save.assembled);
 await page.screenshot({path:'outputs/scenery-final/vehicle-restored.png'});await page.keyboard.press('f');await page.waitForFunction(()=>!window.mission2050.snapshot().driving);
 await page.keyboard.press('Escape');await page.locator('[data-action="restart"]').click();const reset=await page.evaluate(()=>({state:window.mission2050.snapshot(),nav:window.mission2050.navigation()}));assert.deepEqual(reset.nav.carPosition,[14,0,34]);assert.deepEqual(reset.state.adventure.assembled,[]);assert.equal(reset.state.screen,'home');assert.deepEqual(errors,[]);
 await writeFile('outputs/scenery-final/vehicle-save.json',JSON.stringify({passed:true,savedVehicle:saved.vehicle,restoredVehicle:restored.nav.carPosition,restart:true,errors},null,2));console.log('Physical driving, vehicle save/reload and restart passed');
}finally{await browser.close();}
