// Self-contained structural smoke test for the straight six-column south elevation.
// Node only; no npm, WebGL or external network required.
import {readFileSync,existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import { buildSouthPortico } from './src/south-portico.js';
class V{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
}
class V2{constructor(x=0,y=0){this.x=x;this.y=y;}}
class Object3D{constructor(){this.position=new V();this.matrix={};}updateMatrix(){this.matrix={x:this.position.x,y:this.position.y,z:this.position.z};}}
class Geometry{
 constructor(type,...args){this.type=type;const keys={BoxGeometry:['width','height','depth'],CylinderGeometry:['radiusTop','radiusBottom','height','radialSegments']};this.parameters={};for(const [i,k] of (keys[type]||[]).entries())this.parameters[k]=args[i];}
}
class BoxGeometry extends Geometry{constructor(...a){super('BoxGeometry',...a);}}
class CylinderGeometry extends Geometry{constructor(...a){super('CylinderGeometry',...a);}}
class TubeGeometry extends Geometry{constructor(...a){super('TubeGeometry',...a);}}
class LatheGeometry extends Geometry{constructor(points,steps){super('LatheGeometry',steps);this.points=points;}}
class Group{
 constructor(){this.children=[];this.userData={};this.name='';}
 add(child){this.children.push(child);}
}
class Mesh{
 constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new V;this.isMesh=true;this.castShadow=false;this.receiveShadow=false;this.name='';}
}
class InstancedMesh extends Mesh{constructor(geo,mat,count){super(geo,mat);this.count=count;this.positions=[];this.instanceMatrix={needsUpdate:false};}setMatrixAt(i,matrix){this.positions[i]=matrix;}}
class Curve{constructor(points){this.points=points;}}
const THREE={Group,Mesh,InstancedMesh,BoxGeometry,CylinderGeometry,TubeGeometry,LatheGeometry,Vector3:V,Vector2:V2,Object3D,CatmullRomCurve3:Curve};
const fakeMaterials={facadeWall:{id:'facade'},trim:{id:'trim'},shade:{id:'shade'},roof:{id:'roof'},paintedSash:{id:'sash'},dressedStone:{id:'stone'}};
const originals=Array.from({length:180},(_,i)=>({isMesh:true,name:'Cube.'+String(i).padStart(3,'0'),visible:true}));
const exterior=new Group();
const portico=buildSouthPortico(THREE,exterior,{traverse(fn){originals.forEach(fn);}},fakeMaterials,{id:'glass'});
const find=(prefix)=>portico.children.filter(c=>c.name.startsWith(prefix));
assert.equal(portico.name,'South_Rectangular_Ionic_Portico_2027_V11');
assert.equal(exterior.children.length,1);
assert.equal(portico.userData.columns,6);
assert.equal(portico.userData.ionianCapitals,6);
assert.equal(portico.userData.frenchDoors,6);
assert.equal(portico.userData.curves,0);
assert.equal(portico.userData.exteriorStairs,0);
assert.equal(portico.userData.balconies,1);
assert.equal(find('Ionic_Tapered_Shaft_').length,6);
assert.equal(find('Ionic_Volute_').length,12);
assert.equal(find('French_').filter(o=>o.name.endsWith('_Glass')).length,6);
const sculpted=find('Balcony_Carved_Stone_Balusters_V11');
assert.equal(sculpted.length,1);
assert.equal(sculpted[0].geometry.type,'LatheGeometry');
assert.equal(sculpted[0].count,portico.userData.profiledBalusters);
assert(sculpted[0].count>20);
assert(sculpted[0].positions.every(p=>Math.abs(p.y-6.045)<.000001));
assert.equal(find('Portico_Roof_Flat').length,1);
assert.equal(find('Rear_Straight_Parapet').length,1);
for(const mesh of find('Ionic_Tapered_Shaft_'))assert.equal(mesh.position.z,-15.76,'columns on the same straight line');
for(let n=0;n<originals.length;n++)assert.equal(originals[n].visible,!(n>=75&&n<=140),'legacy rear cornice meshes correctly hidden');
assert(portico.children.every(m=>m.geometry),'all portico pieces contain geometry');
for(const file of ['index.html','src/main.js','src/exterior-details.js','src/sky-atmosphere.js','src/facade.js','src/architecture.js','src/landscape.js','src/oak-door.js','assets/white-house-structure.glb']){
 assert(existsSync(new URL('./'+file,import.meta.url)),`required file missing: ${file}`);
}
const facade=readFileSync(new URL('./src/facade.js',import.meta.url),'utf8');
const main=readFileSync(new URL('./src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.match(facade,/buildSouthPortico\(THREE,exterior,model,mats,glass\)/);
assert.match(facade,/PORTICO_DOOR_AXES\.includes\(axis\)/);
assert.match(main,/20261118-stone-v14/);
assert.match(html,/20261118-v23-tuerfluegel-fix/);
assert.match(html,/<script type="importmap">/);
console.log('PASS – 6 Ionic columns, 12 real 3D volutes, 6 French window-doors, flat roof and straight balustrade');
console.log('PASS – no arcades / exterior stairs, 66 replaced GLB parapet meshes hidden');
console.log('PASS – HTML/import chain, original 3D asset and other project modules present');
