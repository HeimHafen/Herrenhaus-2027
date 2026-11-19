import fs from 'node:fs';
import * as T from 'three';
import { buildEmptyInterior } from './src/architecture.js';
import { buildOakEntrance } from './src/oak-door.js';
import { buildEntryFinish } from './src/entry-finish.js';
T.TextureLoader.prototype.load=function(file){const t=new T.Texture(); t.name=file;return t};
const scene=new T.Scene();
buildEmptyInterior(T,scene);
buildOakEntrance(T,scene);
buildEntryFinish(T,scene);
scene.updateMatrixWorld(true);
const spots=[];
const meshes=[], geometries={}, materials={};
const box=new T.Box3(new T.Vector3(-9,-.1,-5),new T.Vector3(4,9,13)),matrix=new T.Matrix4();
scene.traverse(o=>{
 if(o.isSpotLight)spots.push({pos:o.getWorldPosition(new T.Vector3()).toArray(),target:o.target.getWorldPosition(new T.Vector3()).toArray(),angle:o.angle,power:o.intensity,blend:o.penumbra});
 if(!o.isMesh||Array.isArray(o.material))return;
 const g=o.geometry,m=o.material;
 g.computeBoundingBox();
 const transforms=[];
 for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
   if(o.isInstancedMesh){o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld)}else matrix.copy(o.matrixWorld);
   if(g.boundingBox.clone().applyMatrix4(matrix).intersectsBox(box))transforms.push(matrix.toArray());
 }
 if(!transforms.length)return;
 geometries[g.id]??={p:Array.from(g.attributes.position.array),uv:Array.from(g.attributes.uv?.array??[]),vertexColors:Array.from(g.attributes.color?.array??[]),i:g.index?Array.from(g.index.array):null,smooth:g.type==='LatheGeometry'};
 materials[m.id]??={daylight:o.name==='Westtreppe_Podestfenster_Verglasung',color:m.color.toArray(),map:m.map?.name,rough:m.roughness,metal:m.metalness,repeat:m.map?.repeat.toArray(),roughMap:m.roughnessMap?.name,bumpMap:m.bumpMap?.name,bumpScale:m.bumpScale,coat:m.clearcoat,coatRough:m.clearcoatRoughness,vertexColors:m.vertexColors};
 meshes.push([o.name,g.id,m.id,transforms]);
});
fs.writeFileSync('/tmp/v71-scene.json',JSON.stringify({meshes,geometries,materials,spots}));
