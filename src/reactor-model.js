import {batchStaticMeshes} from './static-batching.js';
// Authored reactor source; also exported as ECO_CORE.glb for inspection/reuse.
export function createReactor(T){
 const root=new T.Group();root.name='ECO_CORE';
 const steel=new T.MeshStandardMaterial({color:0x283642,metalness:.92,roughness:.27});
 const silver=new T.MeshStandardMaterial({color:0x94a7b4,metalness:.87,roughness:.22});
 const black=new T.MeshStandardMaterial({color:0x0d141b,metalness:.7,roughness:.4});
 const cyan=new T.MeshStandardMaterial({color:0x48c5c7,emissive:0x30a5af,emissiveIntensity:2,metalness:.5,roughness:.2});
 const glass=new T.MeshPhysicalMaterial({color:0x83d8e1,metalness:.1,roughness:.05,transparent:true,opacity:.25,side:T.DoubleSide,clearcoat:1});
 function mesh(geo,mat,pos,name){const m=new T.Mesh(geo,mat);m.position.set(...pos);m.name=name||'Housing';m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 const box=(w,h,d,mat,pos,name)=>mesh(new T.BoxGeometry(w,h,d),mat,pos,name);
 const cyl=(r,h,mat,pos,name)=>mesh(new T.CylinderGeometry(r,r,h,32),mat,pos,name);
 const torus=(r,t,mat,pos,name)=>{const m=mesh(new T.TorusGeometry(r,t,r<.6?5:8,r<.6?16:48),mat,pos,name);m.rotation.x=Math.PI/2;return m;};
 cyl(3.4,.28,steel,[0,.14,0],'Foundation');cyl(3.15,.22,silver,[0,.39,0]);cyl(2.9,.22,black,[0,.61,0]);
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2;box(.12,.12,.18,silver,[Math.sin(a)*3.2,.37,Math.cos(a)*3.2],'AnchorBolt').rotation.y=a;}
 cyl(1.3,.7,steel,[0,1.07,0]);torus(1.28,.1,cyan,[0,1.4,0]);
 const plasma=mesh(new T.SphereGeometry(.9,32,20),new T.MeshStandardMaterial({color:0x98f7ed,emissive:0x5bdbd6,emissiveIntensity:2.3,metalness:.1,roughness:.16}),[0,2.55,0],'PLASMA');
 const containment=cyl(1.22,2.4,glass,[0,2.65,0],'ContainmentGlass');
 for(const y of [1.48,3.84]){cyl(1.5,.14,silver,[0,y,0]);torus(1.55,.035,cyan,[0,y+.1,0]);}
 cyl(1.13,.4,black,[0,4.13,0]);cyl(.64,.45,silver,[0,4.55,0]);
 for(let i=0;i<3;i++){const ring=torus(1.7+i*.18,.045,silver,[0,2.55,0],'RING_'+i);ring.rotation.x=.8+i*.6;}
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI*2,x=Math.sin(a)*1.75,z=Math.cos(a)*1.75;
  cyl(.13,3.1,steel,[x,2.2,z],'SupportColumn');cyl(.2,.16,silver,[x,.76,z]);cyl(.2,.16,silver,[x,3.76,z]);
  const tube=new T.CatmullRomCurve3([new T.Vector3(x,.8,z),new T.Vector3(x*1.38,1.1,z*1.38),new T.Vector3(x*1.4,3.7,z*1.4),new T.Vector3(x,4.1,z)]);
  mesh(new T.TubeGeometry(tube,24,.07,8,false),black,[0,0,0],'CoolantHose');
  for(let q=0;q<9;q++)torus(.2,.02,silver,[x,.9+q*.3,z],'HeatSink');
 }
 const colors=[0xffb04b,0x50bbff,0x74eda3,0x67e0dc,0xbba0ff],sockets=[],stones=[];
 for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2,x=Math.sin(a)*2.62,z=Math.cos(a)*2.62;
  const arm=box(.35,.22,1.55,steel,[x*.75,1.3,z*.75],'SocketArm');arm.rotation.y=a;
  cyl(.43,.32,black,[x,1.5,z],'Socket_'+i);torus(.43,.04,silver,[x,1.68,z]);
  for(let k=0;k<3;k++){const b=a+k/3*Math.PI*2;box(.055,.35,.055,silver,[x+Math.sin(b)*.3,1.87,z+Math.cos(b)*.3],'Clamp');}
  const stone=mesh(new T.IcosahedronGeometry(.22,0),new T.MeshStandardMaterial({color:colors[i],emissive:colors[i],emissiveIntensity:2,metalness:.45,roughness:.12}),[x,1.95,z],'STONE_'+i);stone.visible=false;
  const cell=cyl(.09,.14,new T.MeshStandardMaterial({color:colors[i],emissive:colors[i],emissiveIntensity:.5}),[x,1.18,z],'StatusCell_'+i);
  sockets.push(new T.Vector3(x,1.95,z));stones.push(stone);
 }
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const vent=box(.12,.24,.34,black,[Math.sin(a)*2.5,.85,Math.cos(a)*2.5]);vent.rotation.y=a;}
 const rings=[0,1,2].map(i=>root.getObjectByName('RING_'+i)),dynamic=new Set([plasma,containment,...rings,...stones]);
 batchStaticMeshes(T,root,root.children.filter(m=>m.isMesh&&!dynamic.has(m)),{chunkSize:Infinity});
 return {root,plasma,containment,sockets,stones,rings};
}
