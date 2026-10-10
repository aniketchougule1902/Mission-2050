// Animated typewriter conversation system with character portraits.
// All displayed text passes through the locale translation system.
import {t} from './locale.js';

const CHARS={
 asha:{label:'conv.asha',color:'#ffa93c',initial:'A',blipHz:380},
 kabir:{label:'conv.kabir',color:'#35cfff',initial:'K',blipHz:280},
 meera:{label:'conv.meera',color:'#56e0df',initial:'M',blipHz:440},
 leela:{label:'conv.leela',color:'#b6f7c3',initial:'L',blipHz:360},
 hari:{label:'conv.hari',color:'#60ef8d',initial:'H',blipHz:240},
 arun:{label:'conv.arun',color:'#70d9d0',initial:'R',blipHz:300},
 dadi:{label:'conv.dadi',color:'#f5c57f',initial:'D',blipHz:320},
 system:{label:'',color:'#92a6a5',initial:'◈',blipHz:0}
};

export function createConversation(container,blipFn,{reduced=false,speak,silence}={}){
 const avatarEl=container.querySelector('.conv-avatar'),nameEl=container.querySelector('.conv-name'),textEl=container.querySelector('.conv-text'),advanceEl=container.querySelector('.conv-advance'),live=container.querySelector('.conv-live');
 let queue=[],line=null,ci=0,elapsed=0,hold=0,done=false;
 function display(){
  line=queue.shift()||null;ci=0;elapsed=0;hold=0;done=false;
  container.classList.toggle('active',!!line);container.classList.toggle('visible',!!line);
  if(!line)return;
  const ch=CHARS[line.who]||CHARS.system;
  avatarEl.style.background=ch.color;avatarEl.textContent=ch.initial;
  nameEl.textContent=ch.label?t(ch.label):'';nameEl.style.color=ch.color;container.style.borderLeftColor=ch.color;
  textEl.textContent='';advanceEl.textContent=t('conv.advance');advanceEl.classList.remove('visible');
  if(live)live.textContent=t(line.key);speak?.(t(line.key),line.who);
 }
 function advance(){silence?.();line?.resolve?.();display();}
 function tick(dt){
  if(!line)return;
  if(done){hold+=dt;if(hold>=(line.hold||3.5))advance();return;}
  const full=t(line.key);elapsed+=dt;
  const target=reduced?full.length:Math.min(full.length,Math.floor(elapsed*(line.speed||35)));
  if(target>ci){const ch=CHARS[line.who]||CHARS.system;if(!reduced&&ch.blipHz&&Math.floor(target/3)>Math.floor(ci/3))blipFn?.(ch.blipHz);ci=target;textEl.textContent=full.slice(0,ci);}
  if(ci>=full.length){done=true;advanceEl.classList.add('visible');}
 }
 function skip(){if(!line)return;if(done)advance();else{ci=t(line.key).length;textEl.textContent=t(line.key);done=true;advanceEl.classList.add('visible');}}
 function play(lines){if(!lines?.length)return Promise.resolve();return new Promise(resolve=>{queue.push(...lines.map((l,i)=>({...l,resolve:i===lines.length-1?resolve:null})));if(!line)display();});}
 function cancel(){silence?.();line?.resolve?.();for(const l of queue)l.resolve?.();queue=[];line=null;container.classList.remove('active','visible');}
 advanceEl.addEventListener('click',skip);
 return {play,tick,skip,cancel,isActive:()=>!!line};
}

// Detect character id from radio text prefix (e.g. "KABIR: ..." → 'kabir').
export function detectCharacter(text){
 const match=text.match(/^(ASHA|KABIR|DR\.\s*MEERA|MEERA|LEELA|HARI|ARUN|DRIVER|DADI)\s*:/i);
 if(!match)return 'system';
 const name=match[1].toLowerCase().replace(/dr\.\s*/,'');
 return CHARS[name]?name:name==='driver'?'kabir':'system';
}

export const characterColor=who=>(CHARS[who]||CHARS.system).color;
export const characterInitial=who=>(CHARS[who]||CHARS.system).initial;
