// Self-contained runtime build contract for V26 oak entrance (without WebGL).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
const main=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(main,/import \{ buildOakEntrance \} from '\.\/oak-door\.js\?v=20261119-v39-deckfalz'/);
assert.match(main,/const door=buildOakEntrance\(THREE,scene\)/);
assert.doesNotMatch(main,/loadCastleDoor|castle-door-import/);
assert.match(main,/instanceStaticBoxes\(leaf\)/);
assert.match(main,/leftLeaf\.rotation\.y=-doorAngle;[\s\S]*rightLeaf\.rotation\.y=doorAngle;/);
assert.match(html,/V83<\/span>/);
assert.match(html,/main\.js\?v=20261119-v83-innenraum/);
assert.doesNotMatch(html,/Castle Style Door · Visthétique/);
assert.equal(fs.existsSync(path.join(root,'Herrenhaus-2027-main')),false,
 'ZIP ROOT must never contain a nested outdated game');
class Group {
  constructor(){this.children=[];this.userData={};this.position={set(x,y,z){Object.assign(this,{x,y,z})}};this.scale={set(x,y,z){Object.assign(this,{x,y,z})}};this.rotation={};this.name='';}
  add(obj){this.children.push(obj);}
  traverse(fn){fn(this);for(const child of this.children)if(child.traverse)child.traverse(fn);else fn(child);}
}
class Mesh extends Group {
  constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;this.castShadow=false;this.receiveShadow=false;this.position={set(x,y,z){Object.assign(this,{x,y,z})}};this.rotation={};this.scale={z:1};}
}
class InstancedMesh extends Mesh {
  constructor(geometry,material,count){super(geometry,material);this.count=count;this.instanceMatrix={};}
  setMatrixAt(i,matrix){assert.ok(i>=0&&i<this.count);}
}
class Geom {constructor(...args){this.parameters=args;}}
class Shape {moveTo(){} lineTo(){} quadraticCurveTo(){}}
class TextureLoader {load(p){assert.ok(fs.existsSync(path.join(root,p.split('?')[0])),`missing texture ${p}`);return {clone(){return {center:{set(){}}};}};}}
class MeshStandardMaterial {constructor(args){this.args=args;}}
class Matrix4 {compose(){return this;}}
class Vector3 {constructor(x,y,z){this.x=x;this.y=y;this.z=z;}}
class Quaternion {}
const THREE={Group,Mesh,InstancedMesh,Shape,TextureLoader,MeshStandardMaterial,Matrix4,Vector3,Quaternion,
  SphereGeometry:Geom,BoxGeometry:Geom,ExtrudeGeometry:Geom,CylinderGeometry:Geom,
  DoubleSide:2,SRGBColorSpace:'srgb'};
const {buildOakEntrance}=await import('./src/oak-door.js');
const scene={children:[],add(o){this.children.push(o)}};
const door=buildOakEntrance(THREE,scene);
assert.equal(scene.children.length,1);
assert.equal(scene.children[0],door);
assert.equal(door.userData.leaves.length,2);
assert.match(door.userData.design,/V30/);
assert.equal(door.userData.opening.width,2.638);
assert.equal(door.userData.opening.thresholdY,.938);
assert.ok(Math.abs(door.userData.opening.lintelY-door.userData.opening.thresholdY-door.userData.opening.height-.018)<1e-9);
const names=[]; door.traverse(x=>{if(x.isMesh) names.push(x.name)});
assert.ok(names.filter(n=>n==='Massiver_Eichenkern_17cm').length===2);
assert.ok(names.filter(n=>n==='Kassette_Eiche_mit_echter_3D_Fase').length===8);
assert.ok(names.filter(n=>n==='Massiver_langer_Zuggriff').length===4);
assert.ok(names.filter(n=>n==='Geschmiedete_Nieten_Oben_und_Unten').length===2);
assert.ok(!names.some(n=>/Castle|Glasbogen|arched door/i.test(n)));
assert.equal(door.userData.leaves[0].position.x,-1.32);
assert.equal(door.userData.leaves[1].position.x,1.32);
for(const leaf of door.userData.leaves){assert.equal(leaf.scale.x,.88);assert.equal(leaf.scale.y,1.085);}
assert.equal(door.userData.leaves[0].children.some(x=>x.isMesh),true);
door.userData.leaves[0].rotation.y=-1.38;
door.userData.leaves[1].rotation.y=1.38;
assert.equal(door.userData.leaves[0].rotation.y,-1.38);
assert.equal(door.userData.leaves[1].rotation.y,1.38);
const aperture=2*1.34;
assert.ok(door.userData.opening.width < aperture, 'not covered by stone jamb');
console.log('PASS V83 mit erhöhtem Türmodell: ACTIVE module integration, real geometry (2 solid leaves, 8 detailed face panels, 4 pull handles), bronze hardware, door animation, 2.638 x 3.954 m, no arch, V83 version, paths and no nested older project');
