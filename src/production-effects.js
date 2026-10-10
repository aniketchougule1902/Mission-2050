import * as T from '/vendor/three.module.js';

// One reusable buffer for short-lived effects; no geometry allocation per frame.
export function createSurfaceEffects(scene,reduced){
 const count=192,pos=new Float32Array(count*3),col=new Float32Array(count*3),life=new Float32Array(count),velocity=new Float32Array(count*3);
 pos.fill(-1000);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(pos,3));geometry.setAttribute('color',new T.BufferAttribute(col,3));
 const material=new T.PointsMaterial({size:.12,vertexColors:true,transparent:true,opacity:.55,depthWrite:false});
 const points=new T.Points(geometry,material);points.frustumCulled=false;scene.add(points);let cursor=0,clock=0,exhaust=0;
 const colors={dust:new T.Color('#baa486'),spark:new T.Color('#ffd57b'),water:new T.Color('#89cddb'),exhaust:new T.Color('#677784'),firefly:new T.Color('#d0ef80')};
 function emit(kind,x,y,z,n=4){if(reduced)return;const c=colors[kind]||colors.dust;for(let j=0;j<n;j++){
  const i=cursor++%count,k=i*3,a=i*2.399+clock*3;life[i]=kind==='firefly'?2:.6;
  pos[k]=x+Math.sin(a)*.2;pos[k+1]=y;pos[k+2]=z+Math.cos(a)*.2;
  velocity[k]=Math.sin(a)*.6;velocity[k+1]=kind==='spark'?1.8:kind==='water'?1.2:.3;velocity[k+2]=Math.cos(a)*.6;
  col[k]=c.r;col[k+1]=c.g;col[k+2]=c.b;
 }geometry.attributes.color.needsUpdate=true;}
 function tick(dt,{active,city,player,traffic,working,phase,low}){
  points.visible=city&&!reduced;clock+=dt;
  if(active&&city&&!low&&!reduced){exhaust+=dt;if(exhaust>.15){exhaust=0;for(const t of traffic)if(Math.hypot(t.model.position.x-player.x,t.model.position.z-player.z)<50){const p=t.model.position,a=t.model.rotation.y;emit('exhaust',p.x+Math.sin(a)*1.8,.45,p.z+Math.cos(a)*1.8,1);}
   if(phase>=2&&Math.hypot(player.x-112,player.z+109)<45)emit('firefly',112+Math.sin(clock*.7)*22,1.5+Math.sin(clock),-109+Math.cos(clock*.8)*22,2);
   if(working&&Math.hypot(player.x+49,player.z-29)<3)emit('spark',-49,1.1,29,3);
  }}
  for(let i=0;i<count;i++){if(life[i]<=0)continue;life[i]-=dt;const k=i*3;if(life[i]<=0){pos[k+1]=-1000;continue;}pos[k]+=velocity[k]*dt;pos[k+1]+=velocity[k+1]*dt;pos[k+2]+=velocity[k+2]*dt;velocity[k+1]-=dt*.8;}
  geometry.attributes.position.needsUpdate=true;
 }
 return {emit,tick,dispose(){scene.remove(points);geometry.dispose();material.dispose();}};
}

// A single full-screen pass combines bright-neighbour bloom, depth contact
// shading and district grading. This is an approximation, not multi-pass SSAO.
export function createPresentation(renderer){
 const supported=renderer.extensions.has('EXT_color_buffer_float');
 const target=new T.WebGLRenderTarget(1,1,{depthTexture:new T.DepthTexture(1,1),type:T.HalfFloatType});
 const uniforms={image:{value:target.texture},depth:{value:target.depthTexture},pixel:{value:new T.Vector2()},grade:{value:new T.Vector3(1,1,1)}};
 const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uvOut;void main(){uvOut=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 uniform sampler2D image;uniform sampler2D depth;uniform vec2 pixel;uniform vec3 grade;varying vec2 uvOut;
 void main(){vec3 base=texture2D(image,uvOut).rgb;vec3 bloom=vec3(0.);float ao=0.;float here=texture2D(depth,uvOut).r;
 for(int i=0;i<8;i++){float angle=float(i)*.785398;vec2 direction=vec2(cos(angle),sin(angle));vec3 neighbour=texture2D(image,uvOut+direction*pixel*3.).rgb;bloom+=max(neighbour-vec3(1.2),vec3(0.));float delta=here-texture2D(depth,uvOut+direction*pixel*2.).r;ao+=step(.00003,delta)*(1.-smoothstep(.0001,.003,delta));}
 gl_FragColor=vec4((base*(1.-ao*.018)+bloom*.045)*grade,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),material);quad.frustumCulled=false;scene.add(quad);const size=new T.Vector2();
 const grades=[[1.035,1,.96],[.97,1,1.035],[.975,1.025,.98],[.97,1.025,1.03],[1.025,.975,1.04]];
 return {render(world,view,{enabled,phase,lab}){
  if(!enabled||!supported){if(target.width>1)target.setSize(1,1);renderer.render(world,view);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
  renderer.getDrawingBufferSize(size);if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);uniforms.pixel.value.set(1/size.x,1/size.y);}
  uniforms.grade.value.fromArray(lab?[.98,1.01,1.025]:grades[Math.min(4,phase)]);
  renderer.setRenderTarget(target);renderer.render(world,view);const stats={calls:renderer.info.render.calls+1,triangles:renderer.info.render.triangles+2};renderer.setRenderTarget(null);renderer.render(scene,camera);return stats;
 },dispose(){target.dispose();material.dispose();quad.geometry.dispose();}};
}
