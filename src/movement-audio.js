// Cadence follows real ground travel, so blocked input and airborne motion stay silent.
export function createFootstepClock(){
 let distance=0,side=1;
 return {reset(){distance=0;side=1;},advance(metres,running,grounded){
  if(!grounded||!Number.isFinite(metres)||metres<.001){distance=0;return null;}
  distance+=metres;const stride=running?1.7:1.35;
  if(distance<stride)return null;
  distance%=stride;side=-side;return {running,pan:side*.12};
 }};
}
// Input speed is metres/second. Reverse uses the same motor and tyre response.
export function drivingSound(speed,throttle=0){
 const pace=Math.min(30,Math.abs(Number.isFinite(speed)?speed:0));
 const load=Math.max(0,Math.min(1,Number.isFinite(throttle)?throttle:0));
 return {motorHz:48+pace*5+load*18,whineHz:150+pace*23+load*45,
  motorGain:.12+pace*.0036+load*.036,whineGain:.02+pace*.0014+load*.014,
  tyreGain:Math.min(.11,pace*.0044),tyreHz:450+pace*35};
}
