// Actual local velocity, rather than key presses, drives the lateral gait.
export function localMovement(vx,vz,yaw,speed=3.6){
 return {side:Math.max(-1,Math.min(1,(vx*Math.cos(yaw)-vz*Math.sin(yaw))/speed))||0,forward:Math.max(-1,Math.min(1,-(vx*Math.sin(yaw)+vz*Math.cos(yaw))/speed))||0};
}
export function lateralStep(phase,side,forward,left=true){
 const wave=Math.sin(phase+(left?0:Math.PI)),lift=Math.max(0,wave),weight=Math.abs(side);
 return {hipX:-.35*forward*wave,hipZ:-.42*side*wave,knee:.65*lift*weight,armX:.15*forward*wave,armZ:(left?-.1:.1)*weight};
}
