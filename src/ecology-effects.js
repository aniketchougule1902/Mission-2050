// Shared renderer-side ecological action presentation. No external assets or runtime network.
const SITES = Object.freeze({
 housing1:[93,-104],housing2:[93,-123],
 water1:[117,-124],water2:[136,-126]
});
const GROWTH_TIME={housing1:2.2,housing2:2.2,water1:2.5,water2:2.5};
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export const ecologicalActionIds=Object.freeze(Object.keys(SITES));
export const ecologicalActionSite=id=>SITES[id]?[...SITES[id]]:null;

export function createEcologyEffects(T,city,player){
 const soilMaterial=new T.MeshStandardMaterial({color:0x584535,roughness:1});
 const trunkMaterial=new T.MeshStandardMaterial({color:0x725034,roughness:.94});
 const leafMaterial=new T.MeshStandardMaterial({color:0x3b9854,roughness:.91,side:T.DoubleSide});
 const darkLeafMaterial=new T.MeshStandardMaterial({color:0x286d41,roughness:.91});
 const rimMaterial=new T.MeshStandardMaterial({color:0xa3dbe1,metalness:.52,roughness:.3});
 const waterMaterial=new T.PointsMaterial({color:0x80ddff,size:.15,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
 const trunkGeometry=new T.CylinderGeometry(.09,.15,1.16,8);
 const soilGeometry=new T.CylinderGeometry(.75,.8,.09,16);
 const leafGeometry=new T.IcosahedronGeometry(.52,1);
 const canGeometry=new T.CylinderGeometry(.18,.21,.36,12);
 const nozzleGeometry=new T.CylinderGeometry(.065,.095,.34,8);
 const entries=new Map();
 for(const [id,[x,z]] of Object.entries(SITES)){
  const root=new T.Group();root.position.set(x,0,z);root.name='Ecosystem-'+id;city.add(root);
  const soil=new T.Mesh(soilGeometry,soilMaterial);soil.position.y=.05;root.add(soil);
  const tree=new T.Group();root.add(tree);
  const trunk=new T.Mesh(trunkGeometry,trunkMaterial);trunk.position.y=.64;tree.add(trunk);
  const leaves=[];
  for(const [i,offset] of [[0,[0,1.43,0]],[1,[-.37,1.17,-.03]],[2,[.35,1.18,.16]]]){
   const leaf=new T.Mesh(leafGeometry,i===1?darkLeafMaterial:leafMaterial);leaf.position.set(...offset);leaf.scale.setScalar(i===0?1:.68);tree.add(leaf);leaves.push(leaf);
  }
  const waterGeometry=new T.BufferGeometry();
  const positions=new Float32Array(32*3);waterGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
  const spray=new T.Points(waterGeometry,waterMaterial.clone());spray.visible=false;spray.frustumCulled=false;root.add(spray);
  tree.scale.setScalar(.001);root.visible=false;
  entries.set(id,{id,root,tree,soil,spray,positions,leaves,x,z,done:false});
 }
 const can=new T.Group();can.name='GardeningCan';player.add(can);
 const container=new T.Mesh(canGeometry,rimMaterial);can.add(container);
 const spout=new T.Mesh(nozzleGeometry,rimMaterial);spout.rotation.z=-Math.PI/2.75;spout.position.set(-.31,.06,0);can.add(spout);
 const handle=new T.Mesh(new T.TorusGeometry(.17,.032,7,16,Math.PI*1.3),rimMaterial);handle.position.set(.18,.06,0);handle.rotation.y=Math.PI/2;can.add(handle);
 can.position.set(.46,1.02,-.14);can.visible=false;
 let active=null;
 function sync(tasks=[]){
  const completed=new Set(tasks);
  for(const [id,e] of entries){
   e.done=completed.has(id);
   if(active?.id===id)continue;
   e.root.visible=e.done;
   e.tree.scale.setScalar(e.done?(id.startsWith('water')?1.38:1):.001);
   e.spray.visible=false;
  }
 }
 function play(id){
  const e=entries.get(id);
  if(!e)return Promise.resolve(false);
  if(active)return Promise.reject(new Error('Another environmental animation is playing'));
  e.root.visible=true;e.tree.scale.setScalar(id.startsWith('water')?.35:.06);
  can.visible=true;
  return new Promise(resolve=>{active={id,e,elapsed:0,duration:GROWTH_TIME[id],resolve};});
 }
 function tick(dt,hero){
  if(!active){can.visible=false;if(hero?.root)hero.root.rotation.x+=(0-hero.root.rotation.x)*Math.min(1,dt*10);return;}
  const a=active,{e,id}=a;
  a.elapsed+=Math.min(.07,Math.max(0,dt));
  const p=Math.min(1,a.elapsed/a.duration),grow=smooth(p),watering=id.startsWith('water');
  // Lean toward the work and tip the can, rather than replacing native character skeleton clips.
  if(hero?.root)hero.root.rotation.x+=( (watering?-.20:-.31)-hero.root.rotation.x)*Math.min(1,dt*7);
  can.position.set(.46,1.02-.20*Math.sin(Math.PI*p),-.14-.1*Math.sin(Math.PI*p));
  can.rotation.z=watering?-.6*Math.sin(Math.PI*p):-.27*Math.sin(Math.PI*p);
  e.tree.scale.setScalar((watering?.35:.06)+(watering?1.03:.94)*grow);
  if(watering){
   e.spray.visible=p>.13&&p<.92;e.spray.material.opacity=e.spray.visible?.88:0;
   if(e.spray.visible){
    const attribute=e.spray.geometry.attributes.position;
    for(let i=0;i<32;i++){
     const u=(i/32+p*3.8)%1;
     e.positions[i*3]=.45-.55*u+(i%4-.5)*.07;
     e.positions[i*3+1]=1.18-1.12*u*u;
     e.positions[i*3+2]=.2+(i%7-3)*.07;
    }
    attribute.needsUpdate=true;
   }
  }
  if(p>=1){
   e.done=true;e.root.visible=true;e.spray.visible=false;e.tree.scale.setScalar(watering?1.38:1);
   can.visible=false;can.rotation.z=0;
   const done=a.resolve;active=null;done(true);
  }
 }
 return {sync,play,tick,playing:()=>active?.id||null,dispose(){
  if(active){active.resolve(false);active=null;}
  city.remove(...[...entries.values()].map(e=>e.root));
  player.remove(can);
  for(const e of entries.values()){e.spray.geometry.dispose();e.spray.material.dispose();}
  trunkGeometry.dispose();soilGeometry.dispose();leafGeometry.dispose();canGeometry.dispose();nozzleGeometry.dispose();
  soilMaterial.dispose();trunkMaterial.dispose();leafMaterial.dispose();darkLeafMaterial.dispose();rimMaterial.dispose();waterMaterial.dispose();
 }};
}
