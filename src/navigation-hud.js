import {compassHeading} from './input.js';
export const COMPASS_SCALE=2.8;
export function relativeBearing(target,heading){return ((target-heading+540)%360)-180;}
export function worldBearing(from,to){return compassHeading(Math.atan2(to.x-from[0],-(to.z-from[2])));}
export function compassMarks(){
 const cardinal=['N','NE','E','SE','S','SW','W','NW'];
 return Array.from({length:181},(_,i)=>{const angle=i*5-180,value=(angle+360)%360;
  return {angle,label:value%45===0?cardinal[value/45]:value%15===0?String(value):'',major:value%15===0,cardinal:value%45===0};
 });
}
export function createNavigationCompass(container){
 const tape=container.querySelector('#compassTape'),heading=container.querySelector('#compassHeading'),pin=container.querySelector('#compassWaypoint');
 tape.innerHTML=compassMarks().map(mark=>`<span class="compass-mark ${mark.major?'major':''} ${mark.cardinal?'cardinal':''}" style="left:${(mark.angle+180)*COMPASS_SCALE}px"><i></i><small>${mark.label}</small></span>`).join('');
 let lastHeading=-1;
 return {update(degrees,target,distance){
  if(Math.abs(degrees-lastHeading)>.05){tape.style.transform=`translateX(${-((degrees+180)*COMPASS_SCALE)}px)`;heading.textContent=Math.round(degrees).toString().padStart(3,'0')+'°';lastHeading=degrees;}
  pin.hidden=!Number.isFinite(target);if(pin.hidden)return;
  const delta=relativeBearing(target,degrees),edge=Math.max(10,container.clientWidth/2-22),offset=Math.max(-edge,Math.min(edge,delta*COMPASS_SCALE));
  pin.style.left=`calc(50% + ${offset}px)`;pin.dataset.edge=Math.abs(delta*COMPASS_SCALE)>edge?(delta<0?'left':'right'):'';
  pin.querySelector('small').textContent=Math.round(distance)+' m';
 }};
}
// Canvas pixel coordinates to the north-up expanded map's shared world coordinates.
export function mapPoint(pixelX,pixelY,width,height,extent,centre){
 const scale=Math.min(width,height)/extent;
 return {x:centre.x+(pixelX-width/2)/scale,z:centre.z+(pixelY-height/2)/scale};
}
