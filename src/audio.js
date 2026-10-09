export function audio(){let ctx,master,musicGain,timer,enabled=false,volume=.35,step=0;const scales=[[110,164.81,220,329.63],[146.83,293.66,440,587.33],[130.81,196,261.63,392],[174.61,261.63,349.23,523.25],[123.47,185,246.94,369.99]];
 function tone(hz,duration=.5,gain=.2,type='sine',delay=0,endHz=hz,pan=0){if(!ctx||!enabled)return;const at=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,endHz),at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+duration);p.pan.value=pan;o.connect(g).connect(p).connect(master);o.start(at);o.stop(at+duration+.03);}
 function noise(duration=.25,gain=.08,filterHz=1200,delay=0){if(!ctx||!enabled)return;const n=ctx.createBufferSource(),b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);n.buffer=b;const f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=filterHz;g.gain.value=gain;n.connect(f).connect(g).connect(master);n.start(ctx.currentTime+delay);}
 function tick(){if(document.hidden)return;const base=[110,130.81,146.83,123.47][Math.floor(step/4)%4];tone(base,3,.08,'sine');tone(base*2,2,.045,'triangle');tone([440,523.25,587.33,493.88][step%4],.8,.035,'sine',0,undefined,Math.sin(step));if(step%2===0)tone(55,.35,.12,'sine',0,35);step++;}
 return {async toggle(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.connect(ctx.destination);}await ctx.resume();enabled=!enabled;master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.08);if(enabled){tick();timer=setInterval(tick,800);}else clearInterval(timer);return enabled;},enabled:()=>enabled,volume(v){volume=v;if(master)master.gain.value=enabled?v:0;},effect(kind,index=0){if(kind==='assemble'){const scale=scales[index];tone(scale[0]/2,6,.22,'sine',0,scale[0]);noise(1.8,.075,400+index*400);scale.forEach((n,i)=>tone(n,3,.14,index%2?'triangle':'sine',i*.42,n*1.005,i%2?.5:-.5));for(let j=0;j<14;j++)tone(scale[j%4]*2,.5,.06,index===1?'sine':index===4?'triangle':'sine',1+j*.19,scale[(j+1)%4]*2,Math.sin(j));tone(70,.8,.35,'sine',1.6,28);noise(.6,.17,2000,1.6);scale.forEach((n,i)=>tone(n*2,2,.18,'sine',1.6+i*.1));}
 else if(kind==='elevator'){tone(45,5,.13,'sine',0,70);noise(2,.055,450);tone(660,.15,.08,'sine',5.3);}
 else if(kind==='door'){noise(.8,.08,700);tone(95,.7,.08,'triangle',0,55);}
 else if(kind==='handover'){tone(520,.6,.07,'sine',0,780);}
 else if(kind==='unlock'){[330,440,660,880].forEach((f,i)=>tone(f,.6,.07,'sine',i*.12));}
 else if(kind==='collect'){scales[index].forEach((f,i)=>tone(f*2,.7,.12,'sine',i*.09));}
 else if(kind==='scanner'){tone(200,.5,.13,'sine',0,1200);tone(1200,.2,.08,'sine',.55,1200);}
 else if(kind==='footstep')noise(.07,.018,350);
 else if(kind==='vehicle')tone(80,.35,.15,'sawtooth',0,160);
 else if(kind==='reactor'){[55,110,220,330,440,660].forEach((f,i)=>tone(f,5,.12,'sine',i*.18,f*1.01));noise(2,.1,700);}
 else if(kind==='error'){tone(130,.4,.16,'triangle',0,80);tone(100,.4,.12,'triangle',.45,60);}
 else if(kind==='work')noise(.12,.035,1500);
 else tone(540,.15,.07,'sine',0,740);
 },suspend(){ctx?.suspend();},resume(){if(enabled)ctx?.resume();}};
}
