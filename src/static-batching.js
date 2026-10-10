import {mergeGeometries} from '/vendor/BufferGeometryUtils.js';

// Merge already-positioned opaque geometry by material and spatial chunk.
// Different box dimensions/UV tiling share a draw call while preserving textures.
export function batchStaticMeshes(T,parent,meshes,{chunkSize=60,onBatch=()=>{}}={}){
 const bins=new Map();
 for(const mesh of meshes){
  if(mesh.parent!==parent||Array.isArray(mesh.material)||mesh.isSkinnedMesh)continue;
  const key=mesh.material.uuid+'_'+!!mesh.userData.lodDetail+'_'+Math.floor(mesh.position.x/chunkSize)+'_'+Math.floor(mesh.position.z/chunkSize);
  if(!bins.has(key))bins.set(key,[]);bins.get(key).push(mesh);
 }
 for(const list of bins.values()){
  if(list.length<2){const m=list[0];m.geometry.computeBoundingSphere();m.updateMatrix();m.matrixAutoUpdate=false;const sphere=m.geometry.boundingSphere.clone().applyMatrix4(m.matrix);onBatch(m,sphere,!!m.userData.lodDetail);continue;}
  const mixedIndices=list.some(m=>!!m.geometry.index)!==list.every(m=>!!m.geometry.index);
  const copies=list.map(m=>{m.updateMatrix();const geometry=mixedIndices&&m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return geometry.applyMatrix4(m.matrix);});
  const geometry=mergeGeometries(copies,false);for(const copy of copies)copy.dispose();
  if(!geometry)continue;
  geometry.computeBoundingSphere();const batch=new T.Mesh(geometry,list[0].material);batch.matrixAutoUpdate=false;batch.name='StaticMaterialBatch';parent.add(batch);
  for(const mesh of list)parent.remove(mesh);
  onBatch(batch,geometry.boundingSphere,!!list[0].userData.lodDetail);
 }
}
