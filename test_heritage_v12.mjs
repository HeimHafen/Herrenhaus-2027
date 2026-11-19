import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {buildHeritageOrnaments} from './src/heritage-ornaments.js';
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
class G{constructor(type, ...args){this.type=type;this.args=args;}}
class Mesh{constructor(geometry, material){this.geometry=geometry;this.material=material;this.rotation={x:0,y:0,z:0};this.scale={x:1,y:1,z:1,set(x,y,z){this.x=x;this.y=y;this.z=z;}};this.position=new V3();this.isMesh=true;}}
class Group{constructor(){this.children=[];this.userData={};}add(mesh){this.children.push(mesh);}}
class Curve{constructor(points){this.points=points;}}
const geo=name=>class extends G{constructor(...a){super(name,...a);}};
const THREE={Mesh,BoxGeometry:geo('BoxGeometry'),SphereGeometry:geo('SphereGeometry'),TorusGeometry:geo('TorusGeometry'),TubeGeometry:geo('TubeGeometry'),Vector3:V3,CatmullRomCurve3:Curve};
const scene=new Group(), rear=new Group();
const mats={ornamentStone:{id:1},windowStone:{id:2},capitalFinish:{id:3}};
const results=buildHeritageOrnaments(THREE,scene,rear,mats);
assert.equal(results.sculptedWindows,18);
assert.equal(results.north,6);
assert.equal(results.south,6);
assert.equal(results.sides,6);
assert.equal(results.columnDetails,12);
assert.equal(scene.children.length,results.addedMeshes);
assert.equal(rear.children.length,0);
assert.equal(scene.children.filter(o=>o.name==='Heritage_Front_Capital_Echinus').length,6);
assert.equal(scene.children.filter(o=>o.name==='Heritage_Rear_Capital_Rosette').length,6);
// No pediment collides with the 9.49m string course.
for(const mesh of scene.children.filter(o=>o.name.includes('_CrownCap'))){
 assert(mesh.position.y + mesh.geometry.args[1]/2 < 9.49,
   `raised window ornament collides with string course: ${mesh.name}`);
}
assert(scene.children.every(o=>Number.isFinite(o.position.x)&&Number.isFinite(o.position.y)&&Number.isFinite(o.position.z)));
const material=readFileSync('./src/exterior-materials.js','utf8');
const facade=readFileSync('./src/facade.js','utf8');
assert(material.includes("applyProceduralFinish(THREE,facadeWall,'heritageAshlar')"));
assert(material.includes('float course=floor((wp.y+.12)/.70);'));
assert(material.includes("applyProceduralFinish(THREE,ornamentStone,'weatheredCarving')"));
assert(facade.includes('buildHeritageOrnaments(THREE,exterior,southPortico,mats,{skipNorthAxis:importedWindowPreview?-15:null})'));
const previewResults=buildHeritageOrnaments(THREE,new Group(),rear,mats,{skipNorthAxis:-15});
assert.equal(previewResults.sculptedWindows,17);
assert.equal(previewResults.north,5);
assert(existsSync('./assets/white-house-structure.glb'));
console.log('PASS – 18 original 3D-ornamented windows, symmetric north/south/side arrangement');
console.log('PASS – 6 front and 6 rear capital treatments, original colonnades preserved');
console.log('PASS – no window crown collision with stringcourse, coherent world-space ashlar shader');
