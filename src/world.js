import * as T from '/vendor/three.module.js';
import {adventureController} from './controller.js';
export const zones=[{x:-16,z:9,color:0xffbf78},{x:-16,z:-14,color:0x8acde3},{x:14,z:-16,color:0x96d39b},{x:20,z:8,color:0x70c6d0},{x:0,z:24,color:0xb4b4ff}];
export function createWorld(canvas,onFPS){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const scene=new T.Scene();scene.background=new T.Color(0xa5a6a1);scene.fog=new T.Fog(0xb9ad9b,40,115);
 const camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,250);const hemi=new T.HemisphereLight(0xd8e8fc,0x302b2b,1.6);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffca8f,3.2);sun.position.set(-30,35,-25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:130});sun.shadow.bias=-.0008;scene.add(sun);
 function texture(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='road'?'#525758':'#c7c5bb';ctx.fillRect(0,0,256,256);let seed=37;for(let i=0;i<14000;i++){seed=(seed*16807)%2147483647;const x=seed%256;seed=(seed*16807)%2147483647;const y=seed%256;ctx.fillStyle=i%2?'#ffffff12':'#00000019';ctx.fillRect(x,y,1+i%2,1+i%2);}if(kind==='wall'){ctx.strokeStyle='#6a6b6420';for(let y=0;y<256;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();for(let x=(y%64===0?0:32);x<256;x+=64){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke();}}}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='road'?8:2,kind==='road'?8:2);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}const wallMap=texture('wall'),roadMap=texture('road');
 const materials=new Map();function mat(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.84,map:[0x3a4a48,0x71766a].includes(color)?roadMap:wallMap,bumpMap:[0x3a4a48,0x71766a].includes(color)?roadMap:wallMap,bumpScale:.035}));return materials.get(color);}
 const staticBoxes=[];const obstacles=[],moving=[],trees=[],panels=[],beacons=[],windows=[],smoke=[];
 const boxGeo=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,color,collide=false){const m=new T.Mesh(boxGeo,mat(color));m.position.set(x,y+h/2,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;scene.add(m);staticBoxes.push(m);if(collide)obstacles.push({x,z,w:w/2+.45,d:d/2+.45,h});return m;}
 function cylinder(x,y,z,r,h,color,segments=8){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,segments),mat(color));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 function label(text,x,y,z,color='#e4f7d3'){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#09272a';ctx.fillRect(0,0,512,96);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.strokeRect(4,4,504,88);ctx.font='bold 30px Arial';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,256,60);const texture=new T.CanvasTexture(c);const sp=new T.Sprite(new T.SpriteMaterial({map:texture}));sp.position.set(x,y,z);sp.scale.set(3.5,.65,1);scene.add(sp);return sp;}
 box(0,-.8,0,96,.8,90,0x71766a);box(0,0,0,8,.06,80,0x3a4a48);box(0,0,0,80,.07,7,0x3a4a48);
 for(let i=-36;i<40;i+=5){box(0,.07,i,.12,.01,2.4,0xc2ba92);box(i,.08,0,2.4,.01,.12,0xc2ba92);}
 for(const x of [-4.5,4.5])box(x,0,0,.8,.16,80,0xa2aa92);for(const z of [-4,4])box(0,0,z,80,.16,.8,0xa2aa92);
 // Buildings form navigable neighbourhoods around a central plaza.
 const colors=[0xbaad88,0x7f9f98,0xd0b99a,0x769294,0x9b9e86];
 for(let row=0;row<5;row++)for(let col=0;col<6;col++){
  const x=-34+col*13,z=-31+row*14;if(Math.abs(x)<7||Math.abs(z)<7||(Math.abs(x)<12&&Math.abs(z-10)<9)||zones.some(p=>Math.hypot(x-p.x,z-p.z)<8))continue;
  const h=4+((row*7+col*3)%5)*2,w=6+(col%2);box(x,0,z,w,h,6,colors[(row+col)%5],true);box(x,h,z,w+.5,.3,6.5,0x3d5c59);
  for(let level=1;level<h-1;level+=2)for(let a=-2;a<=2;a+=2){windows.push(box(x+a,level,z+3.03,.8,.8,.05,0xffd99c));box(x-w/2-.03,level,z+a,.05,.8,.8,0xb0d3c2);}
  box(x,h+.3,z,2,.7,1.5,0x6a8277);cylinder(x+w/2-.8,h+.3,z-1,.5,1.2,0xbbc6ad);
 }
 // Shopfronts, balconies and street furniture make the neighbourhood readable at human scale.
 for(const [x,z] of [[-8,-17],[-21,-3],[5,-31],[-34,25],[18,25]]){box(x,1,z+3.2,4.6,1.8,.08,0x314c56);box(x,2.9,z+3.8,5,.18,1.5,0xb77859);box(x,3.2,z+4.5,5,.5,.08,0xe0b475);box(x-2,0,z+4.1,.12,2.9,.12,0x52615e);box(x+2,0,z+4.1,.12,2.9,.12,0x52615e);box(x,4.4,z+3.8,5,.12,1.6,0x92918a);for(let q=-2;q<=2;q+=.5)box(x+q,4.5,z+4.5,.04,.7,.04,0x45535b);box(x,5.2,z+4.5,5,.04,.04,0x45535b);}
 for(const [x,z] of [[-6,8],[6,-12],[-6,22],[7,6]]){box(x,.3,z,1.6,.1,.5,0x866b4d);box(x,.4,z+.25,1.6,.6,.08,0x866b4d);for(const xx of [-.6,.6])box(x+xx,0,z,.08,.4,.5,0x47545b);}
 for(let i=0;i<8;i++)box(-3+i*.9,.09,2,.45,.012,2.5,0xdbd9c5);
 // Clinic and clean energy pilot.
 box(-20,0,9,7,4.8,6,0xc9c8b0,true);box(-20,4.8,9,7.7,.35,6.7,0x6caea2);box(-20,2,12.05,1.8,1.8,.06,0x315b59);box(-20,3,12.1,.9,.25,.08,0xffd5a1);box(-20,2.65,12.1,.25,.95,.08,0xffd5a1);label('01 / CLINIC',-16,6,9,'#ffc487');
 box(-20,0,-16,8,4,9,0xbea887,true);box(-20,4,-16,8.5,.3,9.5,0x637d73);label('02 / SOLAR ROOFS',-16,7,-14,'#a1e8ef');
 // Grove: mature canopy, native saplings, paths.
 box(18,.02,-20,21,.09,18,0x657c58);label('03 / DADI GROVE',14,7,-16,'#b6f7c3');
 function tree(x,z,scale=1){const g=new T.Group();const trunk=new T.Mesh(new T.CylinderGeometry(.2,.32,3*scale,6),mat(0x726047));trunk.position.y=1.5*scale;g.add(trunk);for(let i=0;i<3;i++){const top=new T.Mesh(new T.IcosahedronGeometry((1.8-i*.3)*scale,0),mat(i%2?0x647f54:0x789b64));top.position.set((i-1)*.35,3*scale+i*.5,0);top.castShadow=true;g.add(top);}g.position.set(x,0,z);scene.add(g);trees.push(g);obstacles.push({x,z,w:.5,d:.5,h:4});}
 for(let i=0;i<20;i++)tree(10+(i*7%17),-26+(i*11%14),.8+(i%4)*.13);
 for(let i=0;i<13;i++){const x=-35+(i*17%68),z=-35+(i*23%68);if(Math.abs(x)>7&&Math.abs(z)>7&&!zones.some(p=>Math.hypot(x-p.x,z-p.z)<9))tree(x,z,.75);}
 // River and industrial outfall.
 const water=box(33,-.18,9,9,.17,80,0x526f64);box(27.8,0,9,1,.5,80,0xa89a79);box(38.2,0,9,1,.5,80,0xa89a79);label('04 / RIVER OUTFALL',20,6,8,'#8edfe2');box(24,0,16,6,6,6,0x8f8778,true);for(const x of [22,25]){cylinder(x,6,16,.7,6,0x596f67);for(let i=0;i<6;i++){const m=new T.Mesh(new T.IcosahedronGeometry(1.3,1),new T.MeshBasicMaterial({color:0x7d8174,transparent:true,opacity:.2,depthWrite:false}));m.position.set(x+i*.2,13+i*1.7,16);scene.add(m);smoke.push(m);}}
 box(28,0,9,4,.6,.7,0x586963);for(let i=0;i<10;i++)box(31+(i%3),.02,-15+i*5,.5,.06,2,0x739385);
 // Mobility depot.
 box(-8,0,27,10,3.5,6,0x848e89,true);label('05 / NIGHT DEPOT',0,6,24,'#c6b9ff');
 for(let i=0;i<3;i++){const bus=new T.Group();const body=new T.Mesh(boxGeo,mat(0xccab74));body.scale.set(2,1.8,5);body.position.y=1.2;body.castShadow=true;bus.add(body);const glass=new T.Mesh(boxGeo,mat(0x33565e));glass.scale.set(2.04,.6,3.5);glass.position.y=1.7;bus.add(glass);for(const x of [-1,1])for(const z of [-1.5,1.5]){const wheel=new T.Mesh(new T.CylinderGeometry(.38,.38,.2,8),mat(0x263b3c));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.45,z);bus.add(wheel);}bus.position.set(-1+i*3,0,29);scene.add(bus);moving.push(bus);}
 // ECO-CORE plaza and luminous sockets.
 box(0,.05,10,7,.3,7,0x92a398);const machine=cylinder(0,.35,10,1.9,1.3,0x385f60,12);cylinder(0,1.65,10,1.5,.15,0xb7ddba,12);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const m=new T.Mesh(new T.OctahedronGeometry(.25),mat(0x476460));m.position.set(Math.sin(a)*1.2,2,10+Math.cos(a)*1.2);scene.add(m);beacons.push(m);}
 label('ECO-CORE',0,4.7,10);
 const rings=[];zones.forEach((z,i)=>{const mesh=new T.Mesh(new T.TorusGeometry(1.25,.055,6,32),new T.MeshBasicMaterial({color:z.color}));mesh.rotation.x=Math.PI/2;mesh.position.set(z.x,.18,z.z);scene.add(mesh);const diamond=new T.Mesh(new T.OctahedronGeometry(.32),new T.MeshStandardMaterial({color:z.color,emissive:z.color,emissiveIntensity:.4}));diamond.position.set(z.x,2.3,z.z);scene.add(diamond);rings.push(diamond);});
 // Sidewalk lamps and distant skyline.
 for(let i=0;i<10;i++){const z=-32+i*7;cylinder(5.5,0,z,.08,4,0x31494a);box(5,3.9,z,1,.13,.35,0xe3d7a4);}
 for(let i=0;i<18;i++){const x=-70+i*8,h=8+(i*11%21);box(x,0,-65,6,h,7,0x6b827d);}
 // Batch static boxes by material: hundreds of buildings/windows become a few GPU draws.
 const batches=new Map();for(const m of staticBoxes){if(m===water)continue;const key=m.material;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}
 for(const [material,meshes] of batches){const batch=new T.InstancedMesh(boxGeo,material,meshes.length);meshes.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);scene.remove(m);});batch.castShadow=true;batch.receiveShadow=true;batch.instanceMatrix.needsUpdate=true;scene.add(batch);}
 obstacles.push({x:0,z:10,w:2,d:2,h:3});return adventureController({scene,camera,renderer,obstacles,water,trees,beacons,sun,canvas,onFPS,reduced});
}
