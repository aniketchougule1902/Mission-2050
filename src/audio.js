import {drivingSound} from './movement-audio.js';
export function audio(){let ctx,master,ambientGain,timer,enabled=false,volume=1,step=0;
 const scales=[[110,164.81,220,329.63],[146.83,293.66,440,587.33],[130.81,196,261.63,392],[174.61,261.63,349.23,523.25],[123.47,185,246.94,369.99]];
 let currentAmbient='none',engine=null,roadBuffer=null;
 function ensureCtx(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=6;master.connect(limiter);limiter.connect(ctx.destination);ambientGain=ctx.createGain();ambientGain.gain.value=.45;ambientGain.connect(master);}}
 function tone(hz,duration=.5,gain=.2,type='sine',delay=0,endHz=hz,pan=0,endPan=pan){if(!ctx||!enabled)return;const at=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,endHz),at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+duration);p.pan.setValueAtTime(pan,at);p.pan.linearRampToValueAtTime(endPan,at+duration);o.connect(g).connect(p).connect(master);o.start(at);o.stop(at+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};}
 function noise(duration=.25,gain=.08,filterHz=1200,delay=0,filterType='lowpass'){if(!ctx||!enabled)return;const n=ctx.createBufferSource(),b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=b;const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type=filterType;f.frequency.value=filterHz;g.gain.value=gain;n.connect(f).connect(g).connect(master);n.start(ctx.currentTime+delay);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();};}

 // Each ambience owns its gain; retained loops crossfade without reallocating.
 const layers=new Map();let phase=0,heat=0;
 function layer(name,hz,noiseHz=0){
  if(layers.has(name))return layers.get(name);
  const g=ctx.createGain(),pan=ctx.createStereoPanner();g.gain.value=0;pan.pan.value=name==='stone'?.25:0;g.connect(pan).connect(ambientGain);let source;
  if(noiseHz){source=ctx.createBufferSource();const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;source.buffer=buffer;source.loop=true;const f=ctx.createBiquadFilter();f.type=name==='speed'?'highpass':'lowpass';f.frequency.value=noiseHz;source.connect(f).connect(g);}
  else{source=ctx.createOscillator();source.frequency.value=hz;source.type=name==='lab'?'triangle':'sine';source.connect(g);}
  source.start();const item={gain:g,source};layers.set(name,item);return item;
 }
 function setAmbient(type){if(!ctx||!enabled)return;currentAmbient=type;for(const name of ['city','lab'])layer(name,name==='city'?60:50,name==='city'?320:0).gain.gain.setTargetAtTime(type===name?.035:0,ctx.currentTime,.7);}
 function killAmbient(){if(!ctx)return;currentAmbient='none';for(const l of layers.values())l.gain.gain.setTargetAtTime(0,ctx.currentTime,.15);}
 function sceneAudio(info){
  phase=Math.min(4,Math.max(0,info.phase||0));heat=info.heat||0;
  if(!ctx||!enabled)return;
  if(!info.active){killAmbient();stopEngineSound();return;}
  setAmbient(info.location==='lab'?'lab':'city');const city=info.location!=='lab';
  layer('road',0,420).gain.gain.setTargetAtTime(city?Math.max(0,1-Math.abs(info.position[0])/18)*.018:0,ctx.currentTime,.3);
  layer('water',0,2400).gain.gain.setTargetAtTime(city?Math.max(0,1-Math.hypot(info.position[0]-243,info.position[2]-68)/55)*.026:0,ctx.currentTime,.4);
  layer('speed',0,1800).gain.gain.setTargetAtTime(info.driving?Math.min(.025,info.speed/80*.025):0,ctx.currentTime,.15);
  layer('reactor',35).gain.gain.setTargetAtTime(city?0:.01*(1+.4*Math.sin(ctx.currentTime*2)),ctx.currentTime,.2);
  layer('stone',220).gain.gain.setTargetAtTime(info.stone>=0?.014:0,ctx.currentTime,.3);
  layer('heat',73).gain.gain.setTargetAtTime(Math.max(0,(heat-65)/35)*(.012+.008*Math.sin(ctx.currentTime*4)),ctx.currentTime,.1);
  if(info.driving){startEngine();updateEngine(info.speed/3.6,info.throttle);}else stopEngineSound();
 }
 function startEngine(){
  if(!ctx||!enabled||engine)return;
  const motor=ctx.createOscillator(),whine=ctx.createOscillator(),tyres=ctx.createBufferSource();
  motor.type='triangle';whine.type='sine';motor.frequency.value=48;whine.frequency.value=150;
  if(!roadBuffer){roadBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=roadBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  tyres.buffer=roadBuffer;tyres.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;
  const motorGain=ctx.createGain(),whineGain=ctx.createGain(),tyreGain=ctx.createGain();
  for(const gain of [motorGain,whineGain,tyreGain]){gain.gain.value=0;gain.connect(master);}
  motor.connect(motorGain);whine.connect(whineGain);tyres.connect(filter).connect(tyreGain);
  motor.onended=()=>{motor.disconnect();motorGain.disconnect();};
  whine.onended=()=>{whine.disconnect();whineGain.disconnect();};
  tyres.onended=()=>{tyres.disconnect();filter.disconnect();tyreGain.disconnect();};
  engine={motor,whine,tyres,filter,motorGain,whineGain,tyreGain};motor.start();whine.start();tyres.start();
 }
 function updateEngine(speed,throttle=0){
  if(!engine||!ctx)return;const sound=drivingSound(speed,throttle),at=ctx.currentTime;
  engine.motor.frequency.setTargetAtTime(sound.motorHz,at,.1);engine.whine.frequency.setTargetAtTime(sound.whineHz,at,.12);
  engine.motorGain.gain.setTargetAtTime(sound.motorGain,at,.12);engine.whineGain.gain.setTargetAtTime(sound.whineGain,at,.12);
  engine.tyreGain.gain.setTargetAtTime(sound.tyreGain,at,.15);engine.filter.frequency.setTargetAtTime(sound.tyreHz,at,.15);
 }
 function stopEngineSound(){
  if(!engine)return;const old=engine;engine=null;
  for(const gain of [old.motorGain,old.whineGain,old.tyreGain])gain.gain.setTargetAtTime(0,ctx.currentTime,.04);
  for(const source of [old.motor,old.whine,old.tyres])source.stop(ctx.currentTime+.2);
 }

 function scoreLoop(){tick();timer=setTimeout(scoreLoop,heat>70?480:800);}
 function tick(){if(document.hidden||currentAmbient==='none')return;const scale=scales[phase],base=scale[Math.floor(step/4)%4];tone(base,3,.06,'sine');tone(base*2,2,.035,'triangle');tone(scale[step%4]*2,.8,.025,'sine',0,undefined,Math.sin(step));if(heat>70){tone(base*1.05946,.35,.025,'triangle');tone(base*1.4142,.22,.02,'sine',.3);}if(step%2===0){tone(80,.18,.13,'sine',0,35);noise(.04,.035,6500,.4,'highpass');}else noise(.1,.055,1700,.05,'highpass');step++;}
 return {async toggle(){ensureCtx();await ctx.resume();enabled=!enabled;master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.08);if(enabled){scoreLoop();}else{clearTimeout(timer);globalThis.speechSynthesis?.cancel();killAmbient();stopEngineSound();}return enabled;},enabled:()=>enabled,volume(v){volume=v;if(master)master.gain.value=enabled?v:0;},
  speak(text,who){if(!enabled||document.hidden||!globalThis.speechSynthesis)return;const utterance=new SpeechSynthesisUtterance(text.replace(/^[^:]{1,20}:\s*/,''));utterance.lang=document.documentElement.lang==='hi'?'hi-IN':'en-IN';utterance.rate=1.04;utterance.pitch={asha:1.15,kabir:.88,meera:1.04,dadi:.95}[who]||1;utterance.volume=Math.min(1,volume);speechSynthesis.cancel();speechSynthesis.speak(utterance);},
  silence(){globalThis.speechSynthesis?.cancel();},
  scene:sceneAudio,
  ambient(type){setAmbient(type);},
  engineLoop(speed,throttle=0){startEngine();updateEngine(speed,throttle);},
  stopEngine(){stopEngineSound();},
  effect(kind,index=0){
  // ═══════ Original effects (preserved) ═══════
  if(kind==='assemble'){const scale=scales[index];tone(scale[0]/2,6,.22,'sine',0,scale[0]);noise(1.8,.075,400+index*400);scale.forEach((n,i)=>tone(n,3,.14,index%2?'triangle':'sine',i*.42,n*1.005,i%2?.5:-.5));for(let j=0;j<14;j++)tone(scale[j%4]*2,.5,.06,index===1?'sine':index===4?'triangle':'sine',1+j*.19,scale[(j+1)%4]*2,Math.sin(j));tone(70,.8,.35,'sine',1.6,28);noise(.6,.17,2000,1.6);scale.forEach((n,i)=>tone(n*2,2,.18,'sine',1.6+i*.1));}
  else if(kind==='elevator'){tone(45,5,.13,'sine',0,70);noise(2,.055,450);tone(660,.15,.08,'sine',5.3);}
  else if(kind==='door'){noise(.8,.08,700);tone(95,.7,.08,'triangle',0,55);}
  else if(kind==='handover'){tone(520,.6,.07,'sine',0,780);}
  else if(kind==='unlock'){[330,440,660,880].forEach((f,i)=>tone(f,.6,.07,'sine',i*.12));}
  else if(kind==='collect'){scales[index]?.forEach((f,i)=>tone(f*2,.7,.12,'sine',i*.09));}
  else if(kind==='scanner'){tone(200,.5,.13,'sine',0,1200);tone(1200,.2,.08,'sine',.55,1200);}
  else if(kind==='plant'){noise(.35,.08,450);tone(230,.42,.09,'triangle',.1,165);tone(330,.63,.07,'sine',.55,440);tone(493.88,.65,.08,'sine',1.3,659.25);}
  else if(kind==='water'){for(let i=0;i<9;i++){noise(.21,.027,1600+i*70,i*.18);tone(330+i*23,.16,.025,'sine',i*.18,260+i*25);}tone(220,1.8,.055,'sine',.2,340);}
  else if(kind==='footstep'||kind==='runstep'){
   const running=kind==='runstep',surface=index?.surface||'road',pan=index?.pan||0;
   const soft=surface==='grass',indoor=surface==='lab',strength=running?2.6:2;
   noise(soft?.14:.095,(soft?.095:.13)*strength,soft?1700:indoor?2200:1100);
   tone(soft?72:indoor?135:100,.095,(soft?.055:.09)*strength,'sine',0,soft?38:55,pan);
   if(!soft)noise(.035,.055*strength,indoor?4200:2900,.02,'highpass');
  }
  else if(kind==='vehicle'){tone(80,.35,.15,'sawtooth',0,160);noise(.15,.04,800,.05);}
  else if(kind==='reactor'){[55,110,220,330,440,660].forEach((f,i)=>tone(f,5,.12,'sine',i*.18,f*1.01));noise(2,.1,700);}
  else if(kind==='error'){tone(130,.4,.16,'triangle',0,80);tone(100,.4,.12,'triangle',.45,60);}
  else if(kind==='work')noise(.12,.035,1500);
  // ═══════ New situational effects ═══════
  else if(kind==='radio_static'){noise(.1,.035,3200);noise(.06,.02,5000,.04);}
  else if(kind==='brake_screech'){noise(.3,.1,2500,0,'highpass');tone(1800,.25,.05,'sawtooth',0,600);}
  else if(kind==='car_horn'){tone(415,.35,.09,'square',0,415);tone(525,.3,.07,'square',.04,525);}
  else if(kind==='traffic_pass'){const dir=index>0?1:-1;noise(.5,.035,1600);tone(270,.45,.035,'sine',0,190,-dir*.7,dir*.7);}
  else if(kind==='traffic_warning'){tone(370,.18,.055,'square',0,370);tone(370,.18,.045,'square',.22,370);}
  else if(kind==='stone_pickup'){[660,880,1100,1320].forEach((f,i)=>tone(f,.45,.08,'sine',i*.07,f*1.02));noise(.25,.035,3200,.12);}
  else if(kind==='stone_hum'||kind==='stone_glow'){tone(220,.7,.025,'sine');tone(330,.7,.018,'triangle',.05);}
  else if(kind==='heat_warning'){const intensity=typeof index==='number'?index:.5;tone(78,1,.06+intensity*.04,'sine',0,65);tone(115,.8,.04+intensity*.03,'triangle',.08,95);}
  else if(kind==='district_unlock'){[220,330,440,550,660,880].forEach((f,i)=>tone(f,.7,.09,'sine',i*.09,f*.99));noise(.4,.05,1400,.25);tone(55,.5,.18,'sine',.45,28);}
  else if(kind==='ladder_climb'){for(let i=0;i<4;i++){noise(.07,.025,2800,i*.13);tone(750+i*90,.05,.025,'triangle',i*.13);}}
  else if(kind==='task_progress'){const hz=300+(typeof index==='number'?index:0)*400;tone(hz,.12,.04,'sine',0,hz*1.08);}
  else if(kind==='conversation_blip'){const hz=typeof index==='number'&&index>100?index:(typeof index==='string'?({asha:380,kabir:280,meera:440,leela:360,hari:240,arun:300,dadi:320}[index]||340):340);tone(hz,.035,.02,'sine',0,hz*1.04);}
  else if(kind==='menu_hover'){tone(650,.025,.012,'sine');}
  else if(kind==='rain_ambient'){noise(1,.025,3400);}
  else if(kind==='menu_click'){tone(800,.05,.035,'sine',0,1100);}
  else if(kind==='jump'){noise(.05,.02,900);tone(195,.1,.03,'sine',0,320);}
  else if(kind==='land'){noise(.07,.025,550);tone(95,.08,.04,'sine',0,65);}
  else if(kind==='water_ambient'){for(let i=0;i<5;i++){noise(.35,.012,2200+i*180,i*.25);tone(380+i*28,.25,.01,'sine',i*.25,330+i*22);}}
  else if(kind==='wind'){noise(.7,.02,550);tone(170,.5,.012,'sine',0,110);}
  else if(kind==='spark'){for(let i=0;i<6;i++){tone(2800+Math.random()*2200,.04,.025,'sine',i*.035);noise(.03,.015,7000,i*.035);}}
  else if(kind==='click'){tone(680,.05,.04,'sine',0,880);}
  else tone(540,.15,.07,'sine',0,740);
 },suspend(){globalThis.speechSynthesis?.cancel();ctx?.suspend();},resume(){if(enabled)ctx?.resume();}};
}
