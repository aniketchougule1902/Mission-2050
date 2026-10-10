import test from 'node:test';
import assert from 'node:assert/strict';
import {createFootstepClock,drivingSound} from '../src/movement-audio.js';
import {audio} from '../src/audio.js';

test('Footsteps follow travelled distance at every refresh rate and alternate feet',()=>{
 const run=(hz,running)=>{const clock=createFootstepClock(),steps=[];for(let i=0;i<hz*4;i++){const step=clock.advance((running?6.2:3.6)/hz,running,true);if(step)steps.push(step);}return steps;};
 for(const running of [false,true]){assert.deepEqual(run(30,running),run(120,running));const steps=run(60,running);assert.ok(steps.length>5);assert.equal(steps[0].pan,-steps[1].pan);}
 assert.ok(run(60,true).length>run(60,false).length);
});
test('Standing, wall contact, jumps and reset cannot produce phantom footsteps',()=>{
 const clock=createFootstepClock();clock.advance(1,false,true);
 assert.equal(clock.advance(0,false,true),null);assert.equal(clock.advance(.5,false,true),null);
 assert.equal(clock.advance(10,false,false),null);assert.equal(clock.advance(.5,false,true),null);
 clock.reset();assert.equal(clock.advance(1,false,true),null);
});
test('Motor responds to speed and throttle, tyres are silent when parked, and reverse is symmetric',()=>{
 const idle=drivingSound(0),cruise=drivingSound(12),accelerating=drivingSound(12,1);
 assert.equal(idle.tyreGain,0);assert.ok(cruise.motorHz>idle.motorHz);assert.ok(cruise.tyreGain>0);
 assert.ok(accelerating.motorHz>cruise.motorHz);assert.ok(accelerating.motorGain>cruise.motorGain);
 assert.deepEqual(drivingSound(-12),cruise);assert.deepEqual(drivingSound(Infinity,NaN),idle);
 assert.deepEqual(drivingSound(300,4),drivingSound(30,1));
});
test('Driving loops reuse sources and release them on exit, pause and mute',async()=>{
 const originals={AudioContext:globalThis.AudioContext,document:globalThis.document};const sources=[];
 const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}});
 const node=()=>({gain:param(),frequency:param(),pan:param(),threshold:param(),ratio:param(),connect(next){return next;},disconnect(){this.disconnected=true;}});
 const source=()=>{const n={...node(),start(){this.started=true;},stop(at){this.stopped=at;}};sources.push(n);return n;};
 globalThis.AudioContext=class {currentTime=1;sampleRate=100;destination=node();createGain=node;createDynamicsCompressor=node;createBiquadFilter=node;createStereoPanner=node;createOscillator=source;createBufferSource=source;createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}async resume(){} };
 globalThis.document={hidden:true};const sound=audio();
 try{
  sound.engineLoop(4);assert.equal(sources.length,0);
  await sound.toggle();sound.engineLoop(0);assert.equal(sources.length,3);
  for(let i=0;i<50;i++)sound.engineLoop(i/5,1);assert.equal(sources.length,3);
  assert.ok(sources[0].frequency.value>48);sound.stopEngine();
  for(const n of sources){assert.equal(n.stopped,1.2);n.onended();assert.equal(n.disconnected,true);}
  sound.engineLoop(5);const pauseSources=sources.slice(3);sound.scene({active:false});assert.ok(pauseSources.every(n=>n.stopped===1.2));
  sound.engineLoop(5);const muteSources=sources.slice(6);await sound.toggle();assert.ok(muteSources.every(n=>n.stopped===1.2));
  const count=sources.length;sound.engineLoop(5);assert.equal(sources.length,count);
 }finally{if(sound.enabled())await sound.toggle();Object.assign(globalThis,originals);}
});
