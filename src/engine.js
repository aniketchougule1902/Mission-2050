import {navigationGoal,navigationRoute,navigationColour} from './navigation-target.js';
import {movementFacing} from './locomotion.js';
import * as T from '/vendor/three.module.js';
import {batchStaticMeshes} from './static-batching.js';
import {GLTFLoader} from '/vendor/GLTFLoader.js';
import {clone} from '/vendor/SkeletonUtils.js';
import {createObstacleIndex,sweptMove,createFixedStepper,dampAngle,cameraFraction,visualFrameDelta,reflectVelocity,gripVelocity} from './motion.js';
import {chunkVisible,renderDistance,routeNeedsRefresh,renderProfile,createFrameBudget} from './render-budget.js';
import {nearestAction} from './action-proximity.js';
import {createSurfaceEffects,createPresentation} from './production-effects.js';
import {createEcologyEffects,ecologicalActionSite,ecologicalActionKind} from './ecology-effects.js';
import {pushOutOfVehicle,pushCarOutOfTraffic} from './traffic-physics.js';
import {createReactor} from './reactor-model.js';
import {stoneColors,phaseOf} from './adventure.js';
import {LAB_Y,LAB_X,LAB_Z,lift,parking,surfaceGuards,coreGuards,trafficPose,spawn,districts,blocked,roofHeight,route,areaUnlocked} from './layout.js';

export function adventureController({scene,camera,renderer,city,lab,obstacles,water,sun,hemi,sky,gates,decorations,staticChunks,canvas,onFPS,reduced}){
 const stepPhysics=createFixedStepper(1/120,12);
 const keys=new Set(),timers=new Map(),player=new T.Group();scene.add(player);player.position.set(...spawn);
 let state,actions=[],active=false,paused=false,text=false,loaded=false,yaw=0,pitch=.18,view=0,working=false,jumpV=0,driving=false,speed=0,heading=0,time=0,last=performance.now(),frames=0,fpsStart=last,onTick=()=>{},onEvent=()=>{},drag=null,cinema=null,climbing=null,hero,doctor,quality='balanced',routeTime=0,routePoints=[],scanTime=0,footTime=0,blockTime=0,trafficCooldown=0,lastWalking=false,lastRunning=false;
 let renderScale=renderProfile('balanced',innerWidth,innerHeight,devicePixelRatio).scale,idleDraw=0,gpuLost=false,adaptiveLowDetail=false,chunkCheckTime=Infinity,visibleStaticChunks=staticChunks.length,trafficSnapshotAge=Infinity,trafficTelemetry=[];
  const surfaceFX=createSurfaceEffects(scene,reduced),presentation=createPresentation(renderer);let renderStats={calls:0,triangles:0};
  let opening=false,selectedNavigation=null,routeStatus='pending';
  let carSafe=null;let lastRoutePlan=null,physicsTime=0,walkX=0,walkZ=0,carX=0,carZ=0,trafficIndex=()=>[],trafficIndexTime=Infinity,brakeTime=0;
 let targetFPS=90,frameBudget=createFrameBudget(targetFPS),renderElapsed=0,ecologyPose=null;
 const camTarget=new T.Vector3(),camHead=new T.Vector3(),camDelta=new T.Vector3(),camPoint=new T.Vector3(),actorWorld=new T.Vector3();
 const actors=[],guards=[],markers=new Map(),labOffset=new T.Vector3(LAB_X,0,LAB_Z),obstacleIndex=(x,z)=>staticObstacleIndex(x,z),labCameraIndex=createObstacleIndex([{x:LAB_X,z:LAB_Z-8,w:3.4,d:3.4,bottom:LAB_Y,h:LAB_Y+6.4}]);
 const metal=new T.MeshStandardMaterial({color:0x344752,metalness:.8,roughness:.3}),gold=new T.MeshStandardMaterial({color:0xd9b86d,metalness:.5,roughness:.3});
 function mesh(geometry,material,position,parent=scene,name){const m=new T.Mesh(geometry,material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;m.name=name||'';parent.add(m);return m;}
 function box(w,h,d,material,pos,parent=scene){return mesh(new T.BoxGeometry(w,h,d),material,pos,parent);}
 function haloTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffffcc');g.addColorStop(.2,'#ffffff44');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
 const haloMap=haloTexture();function aura(colour,size,parent){const s=new T.Sprite(new T.SpriteMaterial({map:haloMap,color:colour,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));s.scale.set(size,size,1);parent.add(s);return s;}
 const contact=mesh(new T.PlaneGeometry(1.25,1.4),new T.MeshBasicMaterial({map:haloMap,color:0x071219,transparent:true,opacity:.85,depthWrite:false}),[0,.075,0]);contact.rotation.x=-Math.PI/2;
 const carry=mesh(new T.IcosahedronGeometry(.16,0),new T.MeshStandardMaterial({color:stoneColors[0],emissive:stoneColors[0],emissiveIntensity:1.3,metalness:.5,roughness:.14}),[.35,1.05,.1],player);carry.visible=false;const carryGlow=aura(stoneColors[0],.75,player);carryGlow.visible=false;
 const tool=box(.3,.18,.2,gold,[.3,.95,.13],player);tool.visible=false;
 const ecology=createEcologyEffects(T,city,player);
 // Character animations are native to this skeleton. No retargeted hips or legs.
 const loader=new GLTFLoader();let modelPromise;
 function actor(gltf,position,parent,scientist=false){const root=new T.Group(),model=clone(gltf.scene);model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),scale=1.78/bounds.getSize(new T.Vector3()).y;model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.rotation.y=Math.PI;root.add(model);root.position.set(...position);parent.add(root);model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;if(scientist&&n.material){n.material=n.material.clone();n.material.color.set(0xdde5e3);n.material.roughness=.66;}}});
  const mixer=new T.AnimationMixer(model),clips=Object.fromEntries(gltf.animations.filter(c=>['Idle','Walk','Run'].includes(c.name)).map(c=>[c.name,mixer.clipAction(c)]));let current='';const play=name=>{if(name===current||!clips[name])return;clips[name].reset().setEffectiveWeight(1).play();if(current)clips[current].crossFadeTo(clips[name],.18,false);current=name;};play('Idle');
  const bone=name=>model.getObjectByName('mixamorig:'+name)||model.getObjectByName('mixamorig'+name);const bones=Object.fromEntries(['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftArm','RightArm','LeftForeArm','RightForeArm'].map(name=>[name,bone(name)]));const rest=Object.fromEntries(Object.entries(bones).filter(([,b])=>b).map(([name,b])=>[name,b.rotation.clone()]));const item={root,model,mixer,clips,play,bones,rest,hand:bone('RightHand'),head:bone('Head'),chest:bone('Spine2')};actors.push(item);
  if(scientist){const coat=mesh(new T.CylinderGeometry(.27,.36,.75,24),new T.MeshStandardMaterial({color:0xe2e6df,roughness:.85}),[0,.91,0],root);box(.11,.16,.018,new T.MeshStandardMaterial({color:0x46b8bb,emissive:0x17585b}),[-.14,1.2,.28],root);}
  return item;
 }
 modelPromise=loader.loadAsync('/models/Soldier.glb').then(gltf=>{
  hero=actor(gltf,[0,0,0],player);doctor=actor(gltf,[-2,LAB_Y,1],lab,true);doctor.root.rotation.y=0;
  for(const [i,p] of [[0,[-46,0,35]],[1,[-105,9,-74]],[2,[98,0,-96]],[3,[198,0,66]],[4,[-118,0,187]]]){const a=actor(gltf,p,city,i===0);a.root.rotation.y=i%2?Math.PI:1;}
  for(const [positions,parent,offset] of [[surfaceGuards,city,labOffset],[coreGuards,lab,new T.Vector3()]])for(const p of positions){const g=actor(gltf,p,parent);g.root.position.add(offset);g.root.name='ResearchSecurityGuard';g.root.rotation.y=Math.atan2(-p[0],-p[2]-8);g.model.traverse(m=>{if(m.isMesh&&m.material){m.material=m.material.clone();m.material.color.set(0x354a61);}});box(.14,.18,.025,gold,[-.18,1.3,-.24],g.root);guards.push(g);}
  loaded=true;onEvent('models.ready',{nativeRig:true});
 }).catch(error=>onEvent('models.fallback',{message:error.message}));
 const fallback=mesh(new T.CapsuleGeometry(.28,1.1,8,16),metal,[0,.85,0],player);
 // A full vehicle silhouette: sloped windshield, wheel treads, fenders and lamps.
 const car=new T.Group();car.position.set(parking[0],0,parking[1]);car.rotation.y=Math.PI;city.add(car);const paint=new T.MeshPhysicalMaterial({color:0xe8b04c,metalness:.65,roughness:.23,clearcoat:1}),glass=new T.MeshPhysicalMaterial({color:0x14313b,metalness:.7,roughness:.05,clearcoat:1});
 const shape=new T.Shape();shape.moveTo(-2,0);shape.lineTo(2,0);shape.lineTo(1.8,.7);shape.lineTo(.9,.75);shape.lineTo(.35,.8);shape.lineTo(-.9,.8);shape.lineTo(-1.3,.8);shape.lineTo(-1.9,.65);shape.closePath();const body=mesh(new T.ExtrudeGeometry(shape,{depth:1.65,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.06}),paint,[0,.55,0],car);body.rotation.y=Math.PI/2;body.position.x=-.825;body.position.z=0;
 box(1.47,.67,1.55,glass,[0,1.66,.14],car);box(1.65,.13,1.9,paint,[0,2.06,.1],car);const wind=box(1.45,.72,.04,glass,[0,1.66,-.63],car);wind.rotation.x=-.45;for(const x of [-.79,.79]){box(.06,1.05,.07,paint,[x,1.6,.6],car);box(.1,.12,.3,metal,[x*1.1,1.55,-.4],car);box(.07,.09,.3,metal,[x,1.25,.5],car);}box(1.8,.13,3.7,metal,[0,.5,0],car);
 const wheels=[],tyreMaterial=new T.MeshStandardMaterial({color:0x151719,roughness:.94}),wheelGeo=new T.TorusGeometry(.31,.12,10,20),rimGeo=new T.CylinderGeometry(.24,.24,.04,12);
 for(const x of [-.86,.86])for(const z of [-1.2,1.2]){const hub=new T.Group();hub.position.set(x,.4,z);car.add(hub);const tyre=mesh(wheelGeo,tyreMaterial,[0,0,0],hub);tyre.rotation.y=Math.PI/2;const rim=mesh(rimGeo,metal,[0,0,0],hub);rim.rotation.z=Math.PI/2;wheels.push(hub);}
 for(const x of [-.55,.55]){box(.35,.15,.035,new T.MeshBasicMaterial({color:0xfff4d1}),[x,.91,-1.98],car);box(.28,.14,.035,new T.MeshBasicMaterial({color:0xd85139}),[x,.91,1.98],car);}const cargo=box(1.15,.35,.7,metal,[0,1.07,1.2],car);cargo.visible=false;batchStaticMeshes(T,car,car.children.filter(m=>m.isMesh&&m!==cargo),{chunkSize:Infinity});
 // Traffic uses a compact shared-geometry silhouette, not eight clones of the hero car.
 // Front lights and movement both point along local -Z; wheel pivots roll about X.
 const traffic=[],trafficBody=new T.BoxGeometry(1.75,.58,3.4),trafficRoof=new T.BoxGeometry(1.53,.65,1.75),trafficTyre=new T.CylinderGeometry(.34,.34,.18,10),trafficGlass=new T.MeshStandardMaterial({color:0x244450,roughness:.3,metalness:.35}),trafficRubber=new T.MeshStandardMaterial({color:0x15191c,roughness:1}),trafficLight=new T.MeshBasicMaterial({color:0xffeec3}),trafficTail=new T.MeshBasicMaterial({color:0xbd4a39}),smallLamp=new T.BoxGeometry(.32,.12,.06);
 for(let i=0;i<8;i++){
  const model=new T.Group(),wheels=[];
  const finish=new T.MeshStandardMaterial({color:[0x787e81,0x3e6577,0x9c6659,0xd1cdb9][i%4],metalness:.48,roughness:.35});
  const shell=new T.Mesh(trafficBody,finish);shell.position.y=.75;model.add(shell);
  const roof=new T.Mesh(trafficRoof,trafficGlass);roof.position.set(0,1.3,.15);model.add(roof);
  for(const x of [-.89,.89])for(const z of [-1.05,1.05]){const hub=new T.Group();hub.position.set(x,.4,z);const wheel=new T.Mesh(trafficTyre,trafficRubber);wheel.rotation.z=Math.PI/2;wheel.position.copy(hub.position);model.add(wheel);}
  for(const x of [-.53,.53])for(const [z,mat] of [[-1.75,trafficLight],[1.75,trafficTail]]){const lamp=new T.Mesh(smallLamp,mat);lamp.position.set(x,.77,z);model.add(lamp);}
  batchStaticMeshes(T,model,model.children.filter(m=>m.isMesh),{chunkSize:Infinity});
  model.position.set(i%2?3:-3,0,-260+i*65);city.add(model);traffic.push({model,wheels,offset:i*65,direction:i%2?1:-1});
 }
 const parked=[];
 for(const [x,z,yaw] of [[18,60,0],[18,75,0],[-18,65,Math.PI],[42,18,Math.PI/2]]){
  if(blocked(x,z,0,obstacles,4,'city',2.5))continue;
  const model=traffic[parked.length%traffic.length].model.clone();model.position.set(x,0,z);model.rotation.y=yaw;city.add(model);parked.push(model);obstacles.push({x,z,w:Math.abs(Math.cos(yaw))*1+Math.abs(Math.sin(yaw))*2.1,d:Math.abs(Math.cos(yaw))*2.1+Math.abs(Math.sin(yaw))*1,h:2});
 }
 const staticObstacleIndex=createObstacleIndex(obstacles);
 // Elevator cabin moves physically through the shaft; door panels separate.
 const cabin=new T.Group();cabin.position.set(lift[0],0,lift[1]);scene.add(cabin);const doorMat=new T.MeshStandardMaterial({color:0x263f50,metalness:.85,roughness:.24}),stripMat=new T.MeshBasicMaterial({color:0x68deed});
 box(3.5,.14,3.8,metal,[0,-.07,0],cabin);box(3.5,.14,3.8,metal,[0,3.1,0],cabin);for(const x of [-1.75,1.75]){box(.12,3.1,3.8,doorMat,[x,1.55,0],cabin);box(.03,2.6,.03,stripMat,[x*.97,1.65,-1.6],cabin);}const doors=[box(1.7,3,.08,doorMat,[-.85,1.5,-1.88],cabin),box(1.7,3,.08,doorMat,[.85,1.5,-1.88],cabin),box(1.7,3,.08,doorMat,[-.85,1.5,1.88],cabin),box(1.7,3,.08,doorMat,[.85,1.5,1.88],cabin)];const liftLight=new T.PointLight(0x5bcade,18,7);liftLight.position.set(0,2.6,0);cabin.add(liftLight);
 const shaft=new T.Group();scene.add(shaft);for(let y=-24;y<0;y+=3){box(.12,.5,4.5,metal,[-2,y+1.5,8],shaft);box(.12,.5,4.5,metal,[2,y+1.5,8],shaft);box(.025,.75,.025,stripMat,[-1.92,y+1.3,6.1],shaft);box(.025,.75,.025,stripMat,[1.92,y+1.3,6.1],shaft);}shaft.visible=false;shaft.position.copy(labOffset);const shaftMist=new T.MeshBasicMaterial({color:0x65cddd,transparent:true,opacity:.025,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});for(let y=-21;y<0;y+=6){const haze=mesh(new T.CylinderGeometry(.3,1.8,5,12,1,true),shaftMist,[0,y,8],shaft);haze.rotation.z=.08;}
 const core=createReactor(T);core.root.position.set(0,LAB_Y,-8);lab.add(core.root);const coreLight=new T.PointLight(0x58d5d5,35,18,2);coreLight.position.set(0,LAB_Y+3,-8);lab.add(coreLight);
 const fly=mesh(new T.IcosahedronGeometry(.18,0),new T.MeshStandardMaterial({color:stoneColors[0],emissive:stoneColors[0],emissiveIntensity:2,metalness:.6,roughness:.08}),[0,0,0]);fly.visible=false;const flyGlow=aura(stoneColors[0],1,scene);flyGlow.visible=false;
 const beam=mesh(new T.CylinderGeometry(.2,.85,13,32,1,true),new T.MeshBasicMaterial({color:0x83eedd,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}),[0,LAB_Y+6,-8],lab);
 const particlePalette=stoneColors.map(color=>new T.Color(color));
  let particleColourIndex=-1,particleColourFinal=false;
  const count=320,positions=new Float32Array(count*3),colours=new Float32Array(count*3),pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(positions,3));pg.setAttribute('color',new T.BufferAttribute(colours,3));const pm=new T.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}),particles=new T.Points(pg,pm);particles.frustumCulled=false;lab.add(particles);
 const wave=mesh(new T.RingGeometry(.98,1.02,96),new T.MeshBasicMaterial({color:0x94eadd,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}),[0,LAB_Y+.12,-8],lab);wave.rotation.x=-Math.PI/2;
 const scan=mesh(new T.RingGeometry(.98,1.02,64),new T.MeshBasicMaterial({color:0x8de3e7,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),[0,.16,0]);scan.rotation.x=-Math.PI/2;
 const panels=[];for(const [x,z] of [[-119,-75],[-116,-84],[-106,-92]]){const m=box(2,.12,2.7,new T.MeshStandardMaterial({color:0x18354d,metalness:.75,roughness:.2}),[x,9.22,z],city);m.rotation.x=-.2;for(let k=-.8;k<1;k+=.4)box(.025,.012,2.4,new T.MeshStandardMaterial({color:0xaebcc7,metalness:.8}),[k,.085,0],m);m.visible=false;panels.push(m);}
 for(const x of [-99.4,-98.6])box(.055,9,.08,metal,[x,4.5,-71],city);for(let y=.3;y<9;y+=.4)box(.8,.045,.08,metal,[-99,y,-71],city);
 const valve=mesh(new T.TorusGeometry(.3,.045,8,32),gold,[222,1,72],city);valve.rotation.y=Math.PI/2;box(.04,.6,.04,metal,[0,0,0],valve);box(.6,.04,.04,metal,[0,0,0],valve);
 function distance(a){return Math.hypot(player.position.x-a.x,player.position.z-a.z,a.id==='ladder'?0:(player.position.y-a.y)*1.4);}
 function nearest(){return nearestAction(actions,player.position,state?.location||'city',state?.stone??-1,state?.assembled?.length??0);}
 function collision(x,z,r=.38){return blocked(x,z,player.position.y,obstacleIndex(x,z),phaseOf(state||{assembled:[]}),state?.location||'city',r);}
 function updateMarkers(){const ids=new Set(actions.map(a=>a.id));for(const [id,g] of markers)if(!ids.has(id)){scene.remove(g);g.traverse(m=>{m.geometry?.dispose();if(m.material&&m.material!==metal&&m.material!==gold){if(Array.isArray(m.material))m.material.forEach(item=>item.dispose());else m.material.dispose();}});markers.delete(id);}for(const a of actions){let g=markers.get(a.id);if(!g){g=new T.Group();g.position.set(a.x,a.y,a.z);const colour=navigationColour(a);const mat=new T.MeshBasicMaterial({color:colour});g.userData.navMaterial=mat;const icon=mesh(new T.OctahedronGeometry(.1),mat,[0,1.3,0],g);g.userData.icon=icon;const halo=aura(colour,.7,g);halo.position.y=1.3;g.userData.navHalo=halo;
    if(['switch','repair','budget','test','valve'].includes(a.kind)){box(.5,.95,.38,metal,[0,.48,0],g);box(.34,.2,.025,mat,[0,.74,.2],g);}if(['pickup','deliver'].includes(a.kind))box(.6,.38,.4,gold,[0,.2,0],g);if(a.kind==='gem'){const stone=mesh(new T.IcosahedronGeometry(.19,0),new T.MeshStandardMaterial({color:stoneColors[phaseOf(state)],emissive:stoneColors[phaseOf(state)],emissiveIntensity:1.5}),[0,1,0],g);g.userData.stone=stone;}
    scene.add(g);markers.set(a.id,g);}g.userData.action=a;g.traverse(m=>{if(m.material?.isMeshBasicMaterial&&a.kind==='budget')m.material.color.set(a.selected?0x63deac:0xd8aeec);});}}
 function supportFloor(p){return state?.location==='lab'?LAB_Y:roofHeight(p[0],p[1],player.position.y);}
 function navigationTarget(){return navigationGoal(actions,player.position,selectedNavigation,state?.location||'city');}
 function rebuildRoute(){
  const target=navigationTarget();for(const g of markers.values()){const a=g.userData.action,colour=navigationColour(a,!!selectedNavigation&&a.id===target?.id);g.userData.navMaterial.color.set(colour);g.userData.navHalo.material.color.set(colour);}if(!target){routePoints=[];lastRoutePlan=null;routeStatus='none';return;}
  const at={x:player.position.x,z:player.position.z},level=phaseOf(state);
  if(!routeNeedsRefresh(lastRoutePlan,at,target,level,state.location,2.5))return;
  lastRoutePlan={x:at.x,z:at.z,goalId:target.id,tx:target.x,tz:target.z,level,location:state.location};
  routePoints=navigationRoute([at.x,at.z],target,(x,z)=>collision(x,z,.45),route);routeStatus=routePoints.length?'ready':'blocked';
 }
 function setLocation(location){const underground=location==='lab';city.visible=!underground;lab.visible=underground;shaft.visible=false;sun.visible=!underground;hemi.intensity=underground?.12:1.25;scene.fog=underground?new T.Fog(0x101f2b,20,65):new T.Fog(0xb1bcc3,170,680);scene.background.set(underground?0x0e1b25:0xa5b3bd);cabin.position.y=underground?LAB_Y:0;doors.forEach((d,i)=>d.position.x=i%2?2.35:-2.35);}
 function animateParticles(index,progress,final=false){
   pm.opacity=Math.sin(progress*Math.PI);
   // Colours depend only on the stone and finale mode, not on frame time.
   // Avoid resending a full colour buffer to the GPU every animation frame.
   if(particleColourIndex!==index||particleColourFinal!==final){
    particleColourIndex=index;particleColourFinal=final;
    for(let i=0;i<count;i++){const c=final?particlePalette[i%5]:particlePalette[index];
     colours[i*3]=c.r;colours[i*3+1]=c.g;colours[i*3+2]=c.b;}
    pg.attributes.color.needsUpdate=true;
   }
   for(let i=0;i<count;i++){const a=i*.618+time*(.7+index*.18),r=.6+(i%17)*.18;
    positions[i*3]=Math.sin(a)*r;
    positions[i*3+1]=LAB_Y+1.3+(final?(i*.031+time*2)%5:Math.sin(a*.4+i)*1.3);
    positions[i*3+2]=-8+Math.cos(a)*r;
   }
   pg.attributes.position.needsUpdate=true;
   wave.material.opacity=Math.sin(progress*Math.PI)*.4;wave.scale.setScalar(1+progress*12);
  }
 function researcherPose(dock,v){
  const ease=n=>n*n*(3-2*n),angle=Math.atan2(dock.x,dock.z+8);
  if(v<.35){const u=ease(v/.35);return {x:-2+2*u,z:1-4.5*u,heading:Math.atan2(2,-4.5)};}
  const a=angle*ease((v-.35)/.65);return {x:Math.sin(a)*4.5,z:-8+Math.cos(a)*4.5,heading:a+(angle<0?-1:1)*Math.PI/2};
 }
 function researcherHand(pose){return new T.Vector3(pose.x+Math.sin(pose.heading)*.3,LAB_Y+1.05,pose.z+Math.cos(pose.heading)*.3);}
 function updateCinematic(dt){const c=cinema;c.elapsed+=dt;const t=c.elapsed,p=Math.min(1,t/c.duration),smooth=v=>v*v*(3-2*v);
  if(c.kind==='elevator'){
   const closing=Math.min(1,t/1.3);let open=1-closing;const travel=T.MathUtils.clamp((t-1.3)/3.4,0,1);const y=T.MathUtils.lerp(c.from,c.to,smooth(travel));cabin.position.y=y;camPoint.set(lift[0],y,lift[1]+.2);player.position.lerpVectors(c.entry,camPoint,smooth(closing));player.position.y=y;if(t>6.1)player.position.z=T.MathUtils.lerp(lift[1]+.2,lift[1]-1,smooth(Math.min(1,(t-6.1)/.4)));city.visible=y>-3;lab.visible=y<-18;shaft.visible=true;sun.visible=y>-3;hemi.intensity=y>-3?1.25:.15;
   if(y<-3&&!c.dark){c.dark=true;scene.background.set(0x0c1925);scene.fog=new T.Fog(0x0c1925,20,70);}if(t>4.7){open=Math.min(1,(t-4.7)/1.4);if(!c.arrival){c.arrival=true;onEvent('elevator.arrival');}}doors.forEach((d,i)=>d.position.x=(i%2?1:-1)*(.85+open*1.5));
   camTarget.set(LAB_X+.75,y+1.7,lift[1]+1.25);camera.position.lerpVectors(c.cameraFrom,camTarget,smooth(closing));camHead.set(LAB_X-.2,y+1.5,lift[1]-2);camHead.lerpVectors(c.lookFrom,camHead,smooth(closing));camera.lookAt(camHead);onEvent('cinematic.stage',{id:t<1.3?'doorsClose':t<4.7?(c.to===LAB_Y?'descent':'ascent'):(c.to===LAB_Y?'doorsOpen':'surfaceOpen'),progress:p});
  }else if(c.kind==='handover'){
   carry.visible=false;fly.visible=true;flyGlow.visible=true;fly.material.color.set(stoneColors[c.index]);fly.material.emissive.set(stoneColors[c.index]);flyGlow.material.color.set(stoneColors[c.index]);
   const dock=core.sockets[c.index].clone().add(core.root.position);let stoneAt;
   if(t<1.8){const v=smooth(t/1.8);stoneAt=c.from.clone().lerp(researcherHand(researcherPose(dock,0)),v);doctor?.play('Idle');onEvent('cinematic.stage',{id:'handover',progress:p});}
   else if(t<5.8){const pose=researcherPose(dock,(t-1.8)/4);doctor?.root.position.set(pose.x,LAB_Y,pose.z);if(doctor){doctor.root.rotation.y=dampAngle(doctor.root.rotation.y,pose.heading,dt);doctor.play('Walk');}stoneAt=researcherHand(pose);onEvent('cinematic.stage',{id:'researcherCarry',progress:p});}
   else if(t<8){const v=smooth((t-5.8)/2.2);doctor?.play('Idle');const from=researcherHand(researcherPose(dock,1));stoneAt=from.lerp(dock,v);stoneAt.y+=Math.sin(v*Math.PI)*.65;onEvent('cinematic.stage',{id:'socketFit',progress:p});}
   else if(t<12){stoneAt=dock;core.stones[c.index].visible=true;animateParticles(c.index,(t-8)/4);coreLight.intensity=45+Math.sin(time*8)*10;core.plasma.material.emissive.set(stoneColors[c.index]);core.plasma.material.emissiveIntensity=2+Math.sin(time*8)*.6;onEvent('cinematic.stage',{id:'activation',progress:p});}
   else{stoneAt=dock;fly.visible=false;flyGlow.visible=false;pm.opacity=0;wave.material.opacity=0;coreLight.intensity=25+(c.index+1)*3;const pose=researcherPose(dock,1-Math.min(1,(t-12)/4));doctor?.root.position.set(pose.x,LAB_Y,pose.z);if(doctor){doctor.root.rotation.y=dampAngle(doctor.root.rotation.y,pose.heading+Math.PI,dt);doctor.play('Walk');}onEvent('cinematic.stage',{id:'researcherReturn',progress:p});}
   fly.position.copy(stoneAt).add(labOffset);fly.rotation.y+=dt*3;flyGlow.position.copy(fly.position);const angle=c.index*1.2+(reduced?0:t*.12);camera.position.set(Math.sin(angle)*7.5,LAB_Y+3.4,-8+Math.cos(angle)*8);camera.position.add(labOffset);camera.lookAt((t<5.8?(doctor?.root.position.clone().add(new T.Vector3(0,1.2,0))||new T.Vector3(-2,LAB_Y+1.2,1)):core.root.position.clone().add(new T.Vector3(0,2.2,0))).add(labOffset));
  }else if(c.kind==='finale'){beam.material.opacity=Math.sin(p*Math.PI)*.35;animateParticles(4,p,true);camera.position.set(Math.sin(time*.18)*9,LAB_Y+4,-8+Math.cos(time*.18)*9);camera.position.add(labOffset);camera.lookAt(LAB_X,LAB_Y+2.8,LAB_Z-8);coreLight.intensity=50;}
  if(p===1){const done=c.done,kind=c.kind;cinema=null;fly.visible=false;flyGlow.visible=false;pm.opacity=0;wave.material.opacity=0;if(kind==='elevator'){setLocation(c.to===LAB_Y?'lab':'city');player.position.set(lift[0],c.to,lift[1]-1);yaw=0;}else if(kind==='handover'){doctor?.root.position.set(-2,LAB_Y,1);doctor?.play('Idle');}onEvent('cinematic.stage',{id:'complete',progress:1});done();}
 }
 function followCamera(dt){const focus=driving?car.position:player.position,angle=driving?heading:yaw,d=driving?7.5:view===1?10:view===2?.1:5.5,h=view===2?1.65:2.2+pitch*2;
  camTarget.set(focus.x+Math.sin(angle)*d,focus.y+h,focus.z+Math.cos(angle)*d);camHead.set(focus.x,focus.y+1.4,focus.z);
  if(state?.location==='lab'){camTarget.x=T.MathUtils.clamp(camTarget.x,LAB_X-16.8,LAB_X+16.8);camTarget.z=T.MathUtils.clamp(camTarget.z,LAB_Z-20.8,LAB_Z+10.6);camTarget.y=Math.min(-16.8,camTarget.y);const q=cameraFraction(camHead,camTarget,labCameraIndex);camTarget.lerpVectors(camHead,camTarget,q);}
  else{const q=cameraFraction(camHead,camTarget,obstacleIndex);camTarget.lerpVectors(camHead,camTarget,q);}
  camera.position.lerp(camTarget,1-Math.exp(-dt*9));
  const q=cameraFraction(camHead,camera.position,state?.location==='lab'?labCameraIndex:obstacleIndex);camera.position.lerpVectors(camHead,camera.position,q);
  camera.lookAt(focus.x-Math.sin(angle)*2,focus.y+1.35-pitch,focus.z-Math.cos(angle)*2);player.visible=!driving&&view!==2;
 }
 function frame(now){requestAnimationFrame(frame);if(document.hidden||text||gpuLost){last=now;return;}if((!active||paused)&&!cinema&&now-idleDraw<66){last=now;return;}idleDraw=now;const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(.1,elapsed),cinematicDt=visualFrameDelta(elapsed);last=now;time+=dt;let walking=false,running=false;fallback.visible=!loaded;
  let physicsSteps=0;if(active&&!paused&&!cinema&&!climbing&&!ecology.playing())physicsSteps=stepPhysics(dt,dt=>{
   blockTime=Math.max(0,blockTime-dt);trafficCooldown=Math.max(0,trafficCooldown-dt);brakeTime=Math.max(0,brakeTime-dt);
   if(state.location==='city'){
    physicsTime+=dt;
    for(const t of traffic){const p=trafficPose(physicsTime,t.offset,t.direction);t.model.position.set(p.x,reduced?0:Math.sin(physicsTime*7+t.offset)*.018,p.z);t.model.rotation.y=p.yaw;t.wheels.forEach(w=>w.rotation.x-=p.speed*dt/.34);t.x=p.x;t.z=p.z;t.w=2;t.d=2;}
    trafficIndexTime+=dt;if(trafficIndexTime>=1/15){trafficIndexTime=0;trafficIndex=createObstacleIndex(traffic,16,4);}
   }
   if(driving){
    const throttle=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0);
    const steer=(keys.has('a')||keys.has('ArrowLeft')?1:0)-(keys.has('d')||keys.has('ArrowRight')?1:0),brake=keys.has(' ');
    speed=-carX*Math.sin(heading)-carZ*Math.cos(heading);
    heading+=steer*dt*1.7*Math.min(1,Math.abs(speed)/3)*Math.sign(speed||1);
    carX-=Math.sin(heading)*throttle*9*dt;carZ-=Math.cos(heading)*throttle*9*dt;
    const drag=Math.exp(-dt*(brake?8:throttle?.15:1.25));carX*=drag;carZ*=drag;
    const grip=gripVelocity(carX,carZ,heading,dt,brake);carX=grip.x;carZ=grip.z;
    const forward=-carX*Math.sin(heading)-carZ*Math.cos(heading),limited=T.MathUtils.clamp(forward,-6,22);
    carX-=Math.sin(heading)*(limited-forward);carZ-=Math.cos(heading)*(limited-forward);speed=limited;
    if(brake&&Math.abs(speed)>10&&!brakeTime){onEvent('brake');brakeTime=1;}
    const motion=sweptMove(car.position.x,car.position.z,carX*dt,carZ*dt,(x,z)=>collision(x,z,1)||collision(x-Math.sin(heading),z-Math.cos(heading),1)||collision(x+Math.sin(heading),z+Math.cos(heading),1),true);
    if(!motion.hit)carSafe=[motion.x,motion.z];car.position.set(motion.x,reduced?0:Math.sin(physicsTime*8)*Math.min(.035,Math.abs(speed)*.002),motion.z);
    if(motion.hit){const bounce=reflectVelocity(carX,carZ,motion.nx,motion.nz,0);carX=bounce.x;carZ=bounce.z;if(!blockTime){onEvent('vehicle.bump');blockTime=1;}}
    car.rotation.y=heading;player.position.set(car.position.x,0,car.position.z);wheels.forEach(w=>w.rotation.x-=speed*dt/.43);
   }else{
    let x=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),z=(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0),length=Math.hypot(x,z);
    if(length){x/=length;z/=length;}running=keys.has('Shift')&&length>0;
    const v=running?6.2:3.6,targetX=(x*Math.cos(yaw)+z*Math.sin(yaw))*v,targetZ=(-x*Math.sin(yaw)+z*Math.cos(yaw))*v,blend=1-Math.exp(-dt*(length?14:10));
    walkX+=(targetX-walkX)*blend;walkZ+=(targetZ-walkZ)*blend;
    const moved=sweptMove(player.position.x,player.position.z,walkX*dt,walkZ*dt,(x,z)=>collision(x,z),true);
    const actualX=(moved.x-player.position.x)/dt,actualZ=(moved.z-player.position.z)/dt,distanceMoved=Math.hypot(actualX,actualZ)*dt;player.position.x=moved.x;player.position.z=moved.z;
    if(moved.hit){const slide=reflectVelocity(walkX,walkZ,moved.nx,moved.nz,0);walkX=slide.x;walkZ=slide.z;}
    if(!areaUnlocked(moved.x+targetX*dt,moved.z+targetZ*dt,phaseOf(state))&&state.location==='city'&&!blockTime){onEvent('district.locked');blockTime=2;}
    if(distanceMoved>.001){player.rotation.y=movementFacing(actualX,actualZ,player.rotation.y,dt);walking=true;footTime+=dt;}
    if(jumpV===0&&footTime>(running?.28:.46)){onEvent('footstep');if(state.location==='city'&&(Math.hypot(player.position.x-112,player.position.z+109)<70))surfaceFX.emit('dust',player.position.x,player.position.y+.05,player.position.z);if(state.location==='city'&&Math.abs(player.position.x-231)<5)surfaceFX.emit('water',player.position.x,.1,player.position.z);footTime=0;}
    const floor=state.location==='lab'?LAB_Y:roofHeight(player.position.x,player.position.z,player.position.y);
    // Small support changes follow the floor; taller roof transitions use the ladder.
    if(!jumpV&&Math.abs(player.position.y-floor)<.3)player.position.y=floor;
    else if(jumpV||player.position.y>floor){jumpV-=16*dt;player.position.y+=jumpV*dt;if(player.position.y<=floor){player.position.y=floor;jumpV=0;onEvent('land');}}
   }
   // Resolve every physics step. Damage cooldown never disables solid contact.
   if(state.location==='city'&&player.position.y<2&&Math.abs(player.position.x)<8){
    for(let pass=0;pass<3;pass++)for(const t of trafficIndex(player.position.x,player.position.z)){
     const pushed=driving?pushCarOutOfTraffic(car.position.x,car.position.z,heading,t.x,t.z,t.model.rotation.y):pushOutOfVehicle(player.position.x,player.position.z,.38,t.x,t.z,t.model.rotation.y);
     if(!pushed)continue;
     if(collision(pushed.x,pushed.z,driving?1.8:.38)){if(driving&&carSafe){car.position.set(carSafe[0],0,carSafe[1]);player.position.copy(car.position);carX=carZ=0;}continue;}player.position.x=pushed.x;player.position.z=pushed.z;
     if(driving){car.position.x=pushed.x;car.position.z=pushed.z;const bounce=reflectVelocity(carX,carZ,pushed.nx,pushed.nz);carX=bounce.x;carZ=bounce.z;}
     else{const slide=reflectVelocity(walkX,walkZ,pushed.nx,pushed.nz,0);walkX=slide.x;walkZ=slide.z;}
     if(!trafficCooldown){trafficCooldown=2.5;onEvent(driving?'vehicle.bump':'traffic.hit',{traffic:true,x:t.x,z:t.z});}
    }
   }
  });
   if(physicsSteps){lastWalking=walking;lastRunning=running;}else if(active&&!paused&&!cinema&&!climbing&&!ecology.playing()){walking=lastWalking;running=lastRunning;}
   hero?.play(climbing?'Idle':walking?(running?'Run':'Walk'):'Idle');
   for(const a of actors){
    const visible=a===hero||(lab.visible&&a.root.parent===lab)||(city.visible&&a.root.parent===city&&a.root.getWorldPosition(actorWorld).distanceToSquared(player.position)<2500);
    if(a!==hero)a.root.visible=visible;
    if(!visible)continue;
    a.animationTime=(a.animationTime||0)+(paused&&!cinema?0:dt);
    if(a===hero||cinema||a.animationTime>=1/30){a.mixer.update(a.animationTime);a.animationTime=0;
     if(!reduced&&a.chest)a.chest.rotation.x+=Math.sin(time*1.8)*.006;
     if(a!==hero&&a.head&&!cinema&&a.root.getWorldPosition(actorWorld).distanceToSquared(player.position)<36){const angle=Math.atan2(player.position.x-actorWorld.x,player.position.z-actorWorld.z)-a.root.rotation.y-Math.PI;a.head.rotation.y+=T.MathUtils.clamp(Math.atan2(Math.sin(angle),Math.cos(angle)),-.5,.5);}
    }
   }
  // Apply steps on this model's own bones, after native clips have sampled.
  if(hero&&(climbing||jumpV!==0)){
   const cycle=climbing?climbing.elapsed*5:0;
   for(const [side,offset] of [['Left',0],['Right',Math.PI]]){
    const wave=Math.sin(cycle+offset),bend=Math.max(0,wave);
    const pose=(part,x,z=0,weight=1)=>{const name=side+part,b=hero.bones[name],r=hero.rest[name];if(b&&r){b.rotation.x+=(r.x+x-b.rotation.x)*weight;b.rotation.y+=(r.y-b.rotation.y)*weight;b.rotation.z+=(r.z+z-b.rotation.z)*weight;}};
    if(climbing){pose('UpLeg',-.65*bend);pose('Leg',.9*bend);pose('Arm',-2.35+.25*wave);pose('ForeArm',-.45-.3*bend);}
    else if(jumpV!==0){pose('UpLeg',-.22);pose('Leg',.42);pose('Arm',-.3,side==='Left'?-.15:.15);}
   }
  }
  if(climbing&&!paused){climbing.elapsed+=dt;const c=climbing,p=Math.min(1,c.elapsed/c.duration);
   // Approach the ladder, climb its rungs vertically, then step onto the landing.
   if(p<.15){player.position.lerpVectors(c.from,c.start,p/.15);}
   else if(p<.85){player.position.lerpVectors(c.start,c.end,(p-.15)/.7);}
   else player.position.lerpVectors(c.end,c.to,(p-.85)/.15);
   player.rotation.y=dampAngle(player.rotation.y,Math.PI,dt);
   if(p===1){climbing=null;lastRoutePlan=null;routeTime=2;}
  }
  if(cinema)updateCinematic(cinematicDt);else if(opening&&!reduced){camera.position.set(45+Math.sin(time*.12)*20,22,65);camera.lookAt(-30,8,15);}else if(active)followCamera(dt);else{camera.position.set(45+Math.sin(time*.05)*10,22,65);camera.lookAt(-30,8,15);}
  sky.visible=city.visible&&!cinema;sky.material.uniforms.day.value=[4,9,15,21,29][phaseOf(state||{assembled:[]})]/30;
  if(lab.visible){core.rings.forEach((m,i)=>m.rotation.z+=dt*(.15+i*.08));core.stones.forEach(m=>m.rotation.y+=dt*.2);}carry.rotation.y+=dt;carryGlow.position.copy(carry.position);if(!cinema)carry.visible=state?.stone>=0;carryGlow.visible=carry.visible;
  if(ecologyPose&&!paused){ecologyPose.elapsed+=dt;player.position.lerpVectors(ecologyPose.from,ecologyPose.to,Math.min(1,ecologyPose.elapsed/.4));player.rotation.y=Math.atan2(ecologyPose.site[0]-player.position.x,ecologyPose.site[1]-player.position.z);}
  ecology.tick(paused&&!cinema?0:cinematicDt,hero);if(!ecology.playing())ecologyPose=null;
  surfaceFX.tick(paused&&!cinema?0:dt,{active:active&&!paused&&!cinema,city:city.visible,player:player.position,traffic,working,phase:phaseOf(state||{assembled:[]}),low:quality==='low'||adaptiveLowDetail});
  if(lab.visible&&!cinema){const power=state?.assembled.length||0;coreLight.intensity=25+power*4+(reduced?0:Math.sin(time*2)*power);core.plasma.material.emissiveIntensity=1+power*.15+(reduced?0:Math.sin(time*2)*.12);}
  if(working&&hero?.hand)tool.rotation.z=Math.sin(time*8)*.1;
  for(const g of markers.values()){if(g.userData.action.id==='ladder')g.position.set(player.position.y>6?-103:-99,player.position.y>6?9:0,player.position.y>6?-73:-71);g.userData.icon.position.y=1.3+(reduced?0:Math.sin(time*2)*.08);g.userData.icon.rotation.y=time*.5;}
  for(const gate of gates){const open=(state?.assembled.length||0)>=gate.level;gate.door.position.y=T.MathUtils.lerp(gate.door.position.y,open?-.9:1.6,1-Math.exp(-dt*2));gate.root.visible=!open||gate.door.position.y>-.8;}
  if(scanTime>0){scanTime-=dt;scan.position.set(player.position.x,player.position.y+.16,player.position.z);scan.scale.setScalar(1+(1-scanTime/1.5)*14);scan.material.opacity=scanTime/1.5*.7;}
   // Instance/chunk visibility is cheap; traversing whole scanned meshes every frame is not.
   chunkCheckTime+=dt;
   if(chunkCheckTime>=.25){
    chunkCheckTime=0;visibleStaticChunks=0;
    const distance=renderDistance(quality,adaptiveLowDetail);
    for(const chunk of staticChunks){
     const visible=chunkVisible(player.position.x,player.position.z,chunk.x,chunk.z,chunk.radius,chunk.detail?Math.min(renderProfile(quality).detailDistance,distance):distance);
     chunk.mesh.visible=visible;if(visible)visibleStaticChunks++;
    }
    decorations.forEach(m=>{
     const near=chunkVisible(player.position.x,player.position.z,m.position.x,m.position.z,m.userData.radius||0,38);
     const distance=m.userData.foliage?230:renderDistance(quality,adaptiveLowDetail);
     m.visible=city.visible&&chunkVisible(player.position.x,player.position.z,m.position.x,m.position.z,m.userData.radius||0,distance)&&
      (!m.userData.foliageDetail||near)&&(!m.userData.foliageProxy||!m.userData.detailReady||!near);
    });
   }
   traffic.forEach(t=>{t.model.visible=city.visible&&Math.abs(t.model.position.z-player.position.z)<125;});
  if(active){sun.target.position.copy(player.position);sun.position.set(player.position.x-45,75,player.position.z+30);routeTime+=dt;if(routeTime>.4){routeTime=0;rebuildRoute();}}
  contact.position.set(player.position.x,supportFloor([player.position.x,player.position.z])+.09,player.position.z);contact.visible=active&&!driving;
   trafficSnapshotAge+=dt;
    if(trafficSnapshotAge>=.2){trafficSnapshotAge=0;
     trafficTelemetry=traffic.map(t=>({x:t.model.position.x,z:t.model.position.z,yaw:t.model.rotation.y,direction:t.direction}));}
    const info={position:[player.position.x,player.position.y,player.position.z],nearest:nearest(),navigationTarget:navigationTarget(),routeStatus,selectedNavigation:!!selectedNavigation,driving,speed:Math.abs(speed)*3.6,modelLoaded:loaded,nativeRig:true,climbing:!!climbing,grounded:jumpV===0,securityGuards:guards.length,traffic:trafficTelemetry,yaw,facing:driving?heading+Math.PI:player.rotation.y,location:state?.location||'city',cinematic:cinema?{kind:cinema.kind,progress:cinema.elapsed/cinema.duration}:null,route:routePoints,stats:{calls:renderStats.calls,triangles:renderStats.triangles,visibleChunks:visibleStaticChunks,totalChunks:staticChunks.length,renderTier:quality==='low'||adaptiveLowDetail?'low':quality,pixelRatio:renderScale,frameMS:renderElapsed,targetFPS}};
   onTick(dt,info);const renderStart=performance.now();renderStats=presentation.render(scene,camera,{enabled:quality==='high'&&!adaptiveLowDetail&&renderScale>.85,phase:phaseOf(state||{assembled:[]}),lab:lab.visible});renderElapsed=performance.now()-renderStart;frames++;
   if(now-fpsStart>1000){const measured=Math.round(frames*1000/(now-fpsStart));onFPS(measured);frames=0;fpsStart=now;
   }
   if(active&&!paused&&!cinema&&loaded){
    const change=frameBudget.sample(elapsed),profile=renderProfile(quality,innerWidth,innerHeight,devicePixelRatio);
    if(change<0){renderScale=Math.max(.55,renderScale-.1);if(renderScale<=.75)adaptiveLowDetail=true;chunkCheckTime=Infinity;renderer.setPixelRatio(renderScale);onEvent('render.adaptive',{scale:renderScale,detail:adaptiveLowDetail?'low':quality});}
    else if(change>0&&renderScale<profile.scale){renderScale=Math.min(profile.scale,renderScale+.05);if(renderScale>=profile.scale-.01)adaptiveLowDetail=false;chunkCheckTime=Infinity;renderer.setPixelRatio(renderScale);}

   }
 }
 requestAnimationFrame(frame);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gpuLost=true;onEvent('renderer.context_lost');});
  canvas.addEventListener('webglcontextrestored',()=>{gpuLost=false;last=performance.now();onEvent('renderer.context_restored');});
  canvas.addEventListener('pointerdown',e=>{if(active&&!paused&&!cinema){drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.005;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag[1])*.003,-.25,.7);drag=[e.clientX,e.clientY];});for(const e of ['pointerup','pointercancel'])canvas.addEventListener(e,()=>drag=null);canvas.addEventListener('wheel',e=>{if(active){e.preventDefault();view=e.deltaY>0?1:0;}},{passive:false});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderScale=renderProfile(quality,innerWidth,innerHeight,devicePixelRatio).scale;renderer.setPixelRatio(renderScale);frameBudget.reset();});
 return {keys,setNavigationTarget(target){selectedNavigation=target;lastRoutePlan=null;rebuildRoute();},intro(v){opening=v;},hooks(tick,event){onTick=tick;onEvent=event;},working(v){working=v;},moveFor(key,duration=.45){keys.add(key);clearTimeout(timers.get(key));timers.set(key,setTimeout(()=>keys.delete(key),duration*1000));},start(pos=spawn,savedVehicle=null){active=true;selectedNavigation=null;routePoints=[];cinema=null;climbing=null;ecologyPose=null;car.position.set(...(savedVehicle?.position||[parking[0],0,parking[1]]));car.rotation.y=savedVehicle?.heading??Math.PI;heading=car.rotation.y;trafficCooldown=0;trafficIndexTime=Infinity;chunkCheckTime=Infinity;trafficSnapshotAge=Infinity;lastRoutePlan=null;carSafe=null;driving=false;speed=0;walkX=walkZ=carX=carZ=0;player.position.set(...pos);player.rotation.y=Math.PI;yaw=0;jumpV=0;setLocation(pos[1]<-10?'lab':'city');if(savedVehicle?.driving&&pos[1]>=0){driving=true;player.position.copy(car.position);}player.visible=!driving;},stop(){active=false;keys.clear();},pause(v){paused=v;keys.clear();walkX=walkZ=carX=carZ=0;speed=0;},position:()=>[player.position.x,player.position.y,player.position.z],nearest,
  update(a,next){state=a;actions=next;ecology.sync(a.tasks);updateMarkers();if(!cinema)setLocation(a.location);core.stones.forEach((m,i)=>m.visible=a.assembled.includes(i));panels.forEach((m,i)=>m.visible=a.tasks.includes('panel'+(i+1)));carry.material.color.set(stoneColors[Math.max(0,a.stone)]);carry.material.emissive.set(stoneColors[Math.max(0,a.stone)]);carryGlow.material.color.set(stoneColors[Math.max(0,a.stone)]);carry.visible=a.stone>=0;tool.visible=!!a.inventory&&a.stone<0;cargo.visible=a.tasks.includes('cargo')&&!a.tasks.includes('clinicDelivery');water.material.color.set(a.tasks.includes('valve')&&!a.tasks.includes('litter')?0x528a8d:0x4b7b7c);beam.material.opacity=0;coreLight.intensity=25+a.assembled.length*3;routeTime=2;},
   vehicleState(){return {position:[car.position.x,0,car.position.z],heading:car.rotation.y,driving};},
   navigation(){return {obstacles,yaw,heading,route:routePoints,navigationTarget:navigationTarget(),routeStatus,carPosition:[car.position.x,car.position.y,car.position.z],speed};},
   ecologyAction(id){keys.clear();walkX=walkZ=0;const site=ecologicalActionSite(id);
    if(site&&ecologicalActionKind(id)==='plant'&&Math.hypot(player.position.x-site[0],player.position.z-site[1])<1.3){
     for(const [dx,dz] of [[0,1.5],[1.5,0],[-1.5,0],[0,-1.5]])if(!collision(site[0]+dx,site[1]+dz)){ecologyPose={from:player.position.clone(),to:new T.Vector3(site[0]+dx,player.position.y,site[1]+dz),site,elapsed:0};break;}
    }return ecology.play(id);},
   ecologyPlaying(){return ecology.playing();},
   quality(q,target=90){quality=q;targetFPS=Math.min(90,Math.max(30,target));frameBudget=createFrameBudget(targetFPS);adaptiveLowDetail=false;chunkCheckTime=Infinity;renderScale=renderProfile(q,innerWidth,innerHeight,devicePixelRatio).scale;renderer.setPixelRatio(renderScale);renderer.shadowMap.enabled=false;},text(v){text=v;fpsStart=performance.now();frames=0;},jump(){const floor=state?.location==='lab'?LAB_Y:roofHeight(player.position.x,player.position.z,player.position.y);if(!driving&&!climbing&&!ecology.playing()&&!paused&&Math.abs(player.position.y-floor)<.02&&jumpV===0&&!cinema){jumpV=6;onEvent('jump');}},camera(){view=(view+1)%3;return view;},scan(){scanTime=1.5;onEvent('scanner');},
  vehicle(){if(cinema||ecology.playing()||state.location==='lab')return false;if(driving){for(const side of [1,-1]){const x=car.position.x+Math.cos(heading)*side*1.8,z=car.position.z-Math.sin(heading)*side*1.8;if(!collision(x,z)){driving=false;player.position.set(x,0,z);player.visible=true;speed=0;return true;}}return false;}if(player.position.distanceTo(car.position)<3.8){driving=true;carX=carZ=walkX=walkZ=0;heading=car.rotation.y;keys.clear();return true;}return false;},
  climb(){if(climbing||cinema||driving||ecology.playing())return;keys.clear();jumpV=0;const up=player.position.y<6;walkX=walkZ=0;onEvent('ladder_climb');climbing={from:player.position.clone(),start:new T.Vector3(-99,up?0:9,-71),end:new T.Vector3(-99,up?9:0,-71),to:new T.Vector3(up?-103:-99,up?9:0,up?-73:-69.8),elapsed:0,duration:6};},
  elevator(down){if(cinema)return Promise.reject(Error('Busy'));if(driving&&!this.vehicle())return Promise.reject(Error('Vehicle exit blocked'));climbing=null;jumpV=0;keys.clear();player.visible=true;return new Promise(done=>{cinema={kind:'elevator',entry:player.position.clone(),cameraFrom:camera.position.clone(),lookFrom:camera.getWorldDirection(new T.Vector3()).multiplyScalar(5).add(camera.position),from:down?0:LAB_Y,to:down?LAB_Y:0,elapsed:0,duration:6.5,done};onEvent('elevator.start');});},
  async assemble(index){await modelPromise;if(cinema)throw Error('Busy');player.visible=true;keys.clear();return new Promise(done=>{cinema={kind:'handover',index,elapsed:0,duration:16,from:player.localToWorld(new T.Vector3(.35,1.05,.1)).sub(labOffset),done};onEvent('handover.start',{index});});},
  activate(ending){keys.clear();coreLight.color.set(ending==='critical'?0xff765b:0x80efd8);core.plasma.material.emissive.copy(coreLight.color);return new Promise(done=>{cinema={kind:'finale',elapsed:0,duration:5,done};});},dispose(){surfaceFX.dispose();presentation.dispose();ecology.dispose();for(const actor of actors)actor.mixer.stopAllAction();const resources=new Set();scene.traverse(m=>{if(m.geometry)resources.add(m.geometry);for(const material of m.material?(Array.isArray(m.material)?m.material:[m.material]):[]){resources.add(material);for(const v of Object.values(material))if(v?.isTexture)resources.add(v);}});if(scene.environment)resources.add(scene.environment);for(const resource of resources)resource.dispose();renderer.dispose();}
 };
}
